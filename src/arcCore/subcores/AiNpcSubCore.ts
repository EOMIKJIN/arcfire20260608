import { BaseArcSubCore } from './BaseArcSubCore';
import { dispatchArcCoreCommand, subscribeArcCoreCommands, type ArcCoreCommand } from '../ArcCoreCommandBus';
import { useWorldStore } from '../../store/worldStore';
import {
  useArcNpcTrafficStore,
  type ArcNpcTrafficCaptain,
  type ArcNpcTrafficPhase,
  type ArcNpcTrafficShip,
} from '../../store/arcNpcTrafficStore';
import { listArcNpcTrafficRowsFromTables } from '../arcNpcTrafficTableRegistry';
import {
  pickBalancedArcTrafficPlanetId,
  spreadArcTrafficInitialPlanetIds,
} from '../orbitPresence/balanceArcTrafficPlanetPick';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';
import { readPlanetOrbitClockMs } from '../orbitClockMsBridge';
import { usePlanetDevelopmentAccStore } from '../../store/planetDevelopmentAccStore';
import { getConvoyShipCargoDestination } from '../economy/runArcTransportTradePass';
import {
  arcSeedTransportShipIdForSystem,
  resolveArcSeedTransportCaptainForSystem,
  resolveArcSeedTransportShipForSystem,
} from '../arcSeedTransportRegistry';

/**
 * AI NPC 서브코어
 * - 모든 NPC의 판단/행동/전투/생산 스케줄을 이 축으로 수렴시키는 기반.
 * - 궤도 **수송선**(테이블 `arcOrbitPresenceFill` 전용 함·함장, 최대 8척) 다음 행성: 월드 전 행성 풀 **최소 부하 균형**(`balanceArcTrafficPlanetPick`).
 * - 행성 체류(dwell): `npc_ai_ships.csv` min/max(초), 엔진 **상한 600초(10분)**.
 */
export class AiNpcSubCore extends BaseArcSubCore {
  private captains: ArcNpcTrafficCaptain[] = [];
  private ships: ArcNpcTrafficShip[] = [];
  private publishAccSec = 0;
  /** `orbitClockMs` 기준 — 체류 궤도 각도는 worklet만 적분, 스냅샷 때 앵커만 여기서 보정 */
  private lastOrbitClockMsAtNpcSnapshot: number | null = null;
  /**
   * 시뮬은 매 벽시계 틱(부드러운 궤도) — UI로는 아래 주기로만 Zustand 푸시.
   * Reanimated 레이어가 시각 보간하므로 스냅샷은 4Hz(250ms)로도 충분.
   * 12Hz 푸시는 거대한 `planet.tsx` 컴포넌트를 12회/초 리렌더해 3시간 누적 시 GC 부하·메모리 폭증 원인.
   */
  private static readonly NPC_SNAPSHOT_INTERVAL_SEC = 0.25;
  /**
   * 핵심 변경 감지용 직전 발행 스냅샷 키.
   * UI가 보는 영역만 변하면 set, 동일하면 set 자체를 건너뛴다.
   * (이전: phase·planetId·orbitAngle 등 모든 것 매번 새 객체)
   */
  private lastPublishedShipKey: string | null = null;

  /** 런타임 명령으로 설정 — 있으면 모든 함선 목표 행성이 이 값으로 고정 */
  private gatherDirectivePlanetId: string | null = null;
  /** 아크코어 월드 확장으로 생성한 수송선단 씨드(성계당 1세트) 중복 방지 */
  private seededSystemIds = new Set<string>();
  private unsubCommands: (() => void) | null = null;

  constructor() {
    super('ai_npc_subcore', 'AI NPC 서브코어');
    this.onWallTick = ({ wallDeltaSec }) => {
      this.tickShips(wallDeltaSec);
      if (this.ships.length > 0) {
        usePlanetDevelopmentAccStore.getState().addWallTickFromTransportShips(this.ships, wallDeltaSec);
      }
      this.publishAccSec += wallDeltaSec;
      if (this.publishAccSec >= AiNpcSubCore.NPC_SNAPSHOT_INTERVAL_SEC) {
        this.publishAccSec = 0;
        this.publishSnapshot();
      }
    };
  }

  override onBoot(): void {
    this.bootstrapCaptainsAndShips();
    this.unsubCommands = subscribeArcCoreCommands((cmd) => this.onArcCoreCommand(cmd));
    this.reconcileUnlockedSynthOrbitSeeds();
    this.publishSnapshot();
    /**
     * 첫번째 임무: 테이블 기반 함장·배정 전함을 궤도 교통에 편성
     * (완료 후에도 순찰 사이클은 상시 유지)
     */
    this.registerTimedMission({
      id: 'npc_birth_and_transport_build',
      name: 'AI 함장·전함(테이블) 궤도 교통 편성',
      stepDurationsSec: [1, 1],
    });
  }

  override onShutdown(): void {
    this.unsubCommands?.();
    this.unsubCommands = null;
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type === 'npc_gather_planet') {
      this.gatherDirectivePlanetId = cmd.planetId;
      for (const s of this.ships) {
        s.planetId = cmd.planetId;
      }
      this.publishSnapshot();
      return;
    }
    if (cmd.type === 'npc_release_gather') {
      this.gatherDirectivePlanetId = null;
      for (const s of this.ships) {
        s.planetId = this.pickNextPlanetId(s.id);
      }
      this.publishSnapshot();
      return;
    }
    if (cmd.type === 'npc_seed_transport_for_system') {
      this.seedTransportForUnlockedSystem(cmd.systemId, cmd.sourcePlanetId, cmd.factionId);
    }
  }

  private seedTransportForUnlockedSystem(systemId: string, sourcePlanetId: string, factionId: string): void {
    if (!systemId || !sourcePlanetId) return;
    if (this.seededSystemIds.has(systemId)) return;

    const tableCaptain = resolveArcSeedTransportCaptainForSystem(systemId);
    if (!tableCaptain) return;

    const captainId = tableCaptain.id;
    const captainName = tableCaptain.displayName;
    const { shipId, hullFromRegistry } = resolveArcSeedTransportShipForSystem(systemId);
    const simShipId = hullFromRegistry ? shipId : arcSeedTransportShipIdForSystem(systemId);

    const ship: ArcNpcTrafficShip = {
      id: simShipId,
      captainId,
      planetId: sourcePlanetId,
      phase: 'entering',
      phaseElapsedSec: 0,
      phaseDurationSec: 4.8,
      orbitAngleRad: Math.random() * Math.PI * 2,
      orbitRadiusPx: 110 + (this.captains.length % 3) * 10,
      edgeAngleRad: Math.random() * Math.PI * 2,
      arcTrafficDwellRadPerSec: 0.44,
      arcTrafficPhaseDurationMul: 1.8,
      arcTrafficPlanetDwellSecMin: 55,
      arcTrafficPlanetDwellSecMax: 180,
    };
    const hull = getNpcCapitalShip(shipId);
    if (hull) {
      ship.arcTrafficDwellRadPerSec = hull.arcTrafficDwellRadPerSec ?? ship.arcTrafficDwellRadPerSec;
      ship.arcTrafficPhaseDurationMul = hull.arcTrafficPhaseDurationMul ?? ship.arcTrafficPhaseDurationMul;
      ship.arcTrafficPlanetDwellSecMin = Math.min(600, hull.arcTrafficPlanetDwellSecMin ?? ship.arcTrafficPlanetDwellSecMin);
      ship.arcTrafficPlanetDwellSecMax = Math.min(600, hull.arcTrafficPlanetDwellSecMax ?? ship.arcTrafficPlanetDwellSecMax);
    }
    this.captains.push({ id: captainId, name: captainName });
    this.ships.push(ship);
    this.seededSystemIds.add(systemId);
    this.publishSnapshot();
  }

  private bootstrapCaptainsAndShips(): void {
    if (this.captains.length > 0 || this.ships.length > 0) return;
    const rows = listArcNpcTrafficRowsFromTables();
    this.captains = rows.map(({ captain }) => ({
      id: captain.id,
      name: captain.displayName,
    }));
    const initialPlanets = spreadArcTrafficInitialPlanetIds(this.listAllPlanetIds(), rows.length);
    this.ships = rows.map(({ captain, shipId }, i) => {
      const hull = getNpcCapitalShip(shipId);
      const dwell = hull?.arcTrafficDwellRadPerSec ?? 0.46;
      const phaseMul = hull?.arcTrafficPhaseDurationMul ?? 2;
      const dwellLo = hull?.arcTrafficPlanetDwellSecMin ?? 60;
      const dwellHi = Math.min(600, hull?.arcTrafficPlanetDwellSecMax ?? 600);
      return {
        id: shipId,
        captainId: captain.id,
        planetId: initialPlanets[i] ?? this.pickNextPlanetId(shipId),
        phase: 'entering' as const,
        phaseElapsedSec: Math.random() * 1.2,
        phaseDurationSec: (4.5 + Math.random() * 1.2) * phaseMul,
        orbitAngleRad: Math.random() * Math.PI * 2,
        orbitRadiusPx: 112 + (i % 3) * 10,
        edgeAngleRad: Math.random() * Math.PI * 2,
        arcTrafficDwellRadPerSec: dwell,
        arcTrafficPhaseDurationMul: phaseMul,
        arcTrafficPlanetDwellSecMin: Math.min(dwellLo, dwellHi),
        arcTrafficPlanetDwellSecMax: Math.max(dwellLo, dwellHi),
      };
    });
  }

  private publishSnapshot(): void {
    const m = readPlanetOrbitClockMs();
    if (m > 0) {
      if (this.lastOrbitClockMsAtNpcSnapshot == null) {
        this.lastOrbitClockMsAtNpcSnapshot = m;
      } else {
        const rawSec = (m - this.lastOrbitClockMsAtNpcSnapshot) / 1000;
        const clockDtSec = Math.max(0, Math.min(rawSec, 0.25));
        this.lastOrbitClockMsAtNpcSnapshot = m;
        if (clockDtSec > 0) {
          for (const s of this.ships) {
            if (s.phase === 'dwelling') {
              s.orbitAngleRad += s.arcTrafficDwellRadPerSec * clockDtSec;
            }
          }
        }
      }
    }
    /**
     * 위치(orbitAngleRad)는 worklet이 `phaseElapsedSec`/`arcTrafficDwellRadPerSec`로 시간 적분하므로
     * phase·planetId·궤도 반경이 바뀌지 않으면 zustand publish가 불필요하다.
     * 무조건 publish 시 거대 `planet.tsx`가 빈번히 리렌더되며 누적 GC 부하·메모리 폭증.
     */
    let key = `${this.captains.length}|${this.ships.length}`;
    for (let i = 0; i < this.ships.length; i += 1) {
      const s = this.ships[i]!;
      key += `|${s.id}:${s.phase}:${s.planetId}:${Math.round(s.orbitRadiusPx)}`;
    }
    if (key === this.lastPublishedShipKey) return;
    this.lastPublishedShipKey = key;

    useArcNpcTrafficStore.getState().setSnapshot({
      captains: this.captains.slice(),
      ships: this.ships.map((s) => ({ ...s })),
      initialized: this.captains.length > 0,
    });
  }

  private tickShips(dtSec: number): void {
    if (this.ships.length === 0) return;
    for (const s of this.ships) {
      s.phaseElapsedSec += dtSec;
      if (s.phaseElapsedSec < s.phaseDurationSec) continue;
      this.advanceShipPhase(s);
    }
  }

  private advanceShipPhase(ship: ArcNpcTrafficShip): void {
    const pm = ship.arcTrafficPhaseDurationMul;
    const next = this.nextPhase(ship.phase);
    if (next === 'entering') {
      ship.planetId = this.pickNextPlanetId(ship.id);
      ship.phase = next;
      ship.phaseElapsedSec = 0;
      ship.phaseDurationSec = (4.2 + Math.random() * 1.6) * pm;
      ship.edgeAngleRad = Math.random() * Math.PI * 2;
      return;
    }
    if (next === 'dwelling') {
      ship.phase = next;
      ship.phaseElapsedSec = 0;
      ship.phaseDurationSec = AiNpcSubCore.samplePlanetDwellSec(ship);
      ship.orbitRadiusPx = 106 + Math.random() * 28;
      return;
    }
    if (ship.phase === 'dwelling') {
      dispatchArcCoreCommand({
        type: 'economy_transport_dwell_settled',
        shipId: ship.id,
        planetId: ship.planetId,
        meta: { origin: 'arc_core_policy', reason: 'transport_dwell_trade' },
      });
    }
    ship.phase = 'departing';
    ship.phaseElapsedSec = 0;
    ship.phaseDurationSec = (4 + Math.random() * 1.6) * pm;
    ship.edgeAngleRad = Math.random() * Math.PI * 2;
  }

  private nextPhase(cur: ArcNpcTrafficPhase): ArcNpcTrafficPhase {
    if (cur === 'entering') return 'dwelling';
    if (cur === 'dwelling') return 'departing';
    return 'entering';
  }

  private listAllPlanetIds(): string[] {
    const world = useWorldStore.getState();
    const unlocked = new Set(world.unlockedSystemIds);
    const out: string[] = [];
    for (const system of Object.values(world.systems)) {
      if (system.id.startsWith('synth_') && !unlocked.has(system.id)) continue;
      for (const planet of system.planets) {
        out.push(planet.id);
      }
    }
    return out;
  }

  /** 앱 재기동 — 잠금 해제 synth에 궤도 수송 1척(idempotent) */
  private reconcileUnlockedSynthOrbitSeeds(): void {
    const world = useWorldStore.getState();
    for (const systemId of world.unlockedSystemIds) {
      if (!systemId.startsWith('synth_')) continue;
      if (this.seededSystemIds.has(systemId)) continue;
      const system = world.getSystem(systemId);
      const planetId = system?.planets[0]?.id;
      if (!planetId) continue;
      const factionId = system.planets[0]?.factionId ?? 'independent';
      this.seedTransportForUnlockedSystem(systemId, planetId, factionId);
    }
  }

  private pickNextPlanetId(shipId?: string): string {
    if (this.gatherDirectivePlanetId) return this.gatherDirectivePlanetId;
    if (shipId) {
      const cargoDest = getConvoyShipCargoDestination(shipId);
      if (cargoDest) return cargoDest;
    }
    const allPlanetIds = this.listAllPlanetIds();
    return pickBalancedArcTrafficPlanetId(allPlanetIds, this.ships, {
      excludeShipId: shipId,
      gatherPlanetId: this.gatherDirectivePlanetId,
    });
  }

  /** 행성 체류(dwell) — 테이블 [min,max] 초, 엔진 상한 600 */
  private static samplePlanetDwellSec(ship: ArcNpcTrafficShip): number {
    const lo = Math.max(0, Math.min(ship.arcTrafficPlanetDwellSecMin, 600));
    const hi = Math.max(lo, Math.min(600, ship.arcTrafficPlanetDwellSecMax));
    if (hi <= lo) return lo;
    return lo + Math.random() * (hi - lo);
  }
}
