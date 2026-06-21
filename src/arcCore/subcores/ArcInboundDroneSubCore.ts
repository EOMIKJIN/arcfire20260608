import { BaseArcSubCore } from './BaseArcSubCore';
import { getArcCoreInboundDronePolicy } from '../balance/arcCoreInboundDronePolicy';
import {
  isArcInboundDroneHubEligible,
  readArcInboundDroneHubBridge,
} from '../inboundDrone/arcInboundDroneHubBridge';
import { runInboundDroneInterceptPass } from '../inboundDrone/runInboundDroneInterceptPass';
import { readPlanetOrbitClockMs } from '../orbitClockMsBridge';
import { resolveInboundDroneElapsedSecAtOrbitMs } from '../inboundDrone/inboundDroneKinematics';
import { resolveArcInboundDroneStrikeLeakMul } from '../inboundDrone/resolveInboundDroneStrikeLeak';
import { applyPlanetAttackCoreDamage } from '../planetAttack/applyPlanetAttackCoreDamage';
import { PLANET_ATTACK_KIND } from '../planetAttack/planetAttackKind';
import { usePlayerStore } from '../../store/playerStore';
import {
  useArcInboundDroneStore,
  type ArcInboundDrone,
} from '../../store/arcInboundDroneStore';

type PendingSpawn = {
  dueSec: number;
  planetId: string;
};

/**
 * 아크코어 드론 — 플레이어 체류 행성 대상 inbound 웨이브.
 * 허브 자본궤도 전투 중·행성 이탈 시 중단. 연출 없이 외곽 도달/요격 시 제거.
 */
export class ArcInboundDroneSubCore extends BaseArcSubCore {
  private drones: ArcInboundDrone[] = [];
  private publishAccSec = 0;
  private waveAccSec = 0;
  private pendingSpawns: PendingSpawn[] = [];
  private droneSeq = 0;
  private lastPublishedKey: string | null = null;

  private static readonly SNAPSHOT_INTERVAL_SEC = 0.25;
  /** Skia trail 페이드 — `INBOUND_DRONE_TRAIL_FADE_MS`와 맞춤 */
  private static readonly TRAIL_FADE_SEC = 1.4;

  constructor() {
    super('arc_inbound_drone_subcore', '아크코어 드론 서브코어');
    this.onWallTick = ({ wallDeltaSec, elapsedWallSec }) => {
      this.tick(wallDeltaSec, elapsedWallSec);
      this.publishAccSec += wallDeltaSec;
      if (this.publishAccSec >= ArcInboundDroneSubCore.SNAPSHOT_INTERVAL_SEC) {
        this.publishAccSec = 0;
        this.publishSnapshot();
      }
    };
  }

  override onBoot(): void {
    this.publishSnapshot();
  }

  override onShutdown(): void {
    this.drones = [];
    this.pendingSpawns = [];
    this.publishSnapshot(true);
  }

  private tick(wallDeltaSec: number, elapsedWallSec: number): void {
    const playerPlanetId = usePlayerStore.getState().player?.currentPlanetId ?? null;
    const hub = readArcInboundDroneHubBridge();
    const eligible = isArcInboundDroneHubEligible(playerPlanetId, hub);

    if (!eligible) {
      if (this.drones.length > 0 || this.pendingSpawns.length > 0) {
        this.drones = [];
        this.pendingSpawns = [];
        this.waveAccSec = 0;
      }
      return;
    }

    const planetId = hub.planetId!;
    const policy = getArcCoreInboundDronePolicy();

    this.waveAccSec += wallDeltaSec;
    if (this.waveAccSec >= policy.waveIntervalSec) {
      this.waveAccSec = 0;
      this.scheduleWave(planetId, elapsedWallSec, policy);
    }

    this.flushPendingSpawns(elapsedWallSec, planetId, policy);

    for (const d of this.drones) {
      if (d.phase !== 'inbound') continue;
      const orbitMs = readPlanetOrbitClockMs();
      const elapsed = resolveInboundDroneElapsedSecAtOrbitMs(d, orbitMs);
      d.inboundElapsedSec = elapsed;
      if (elapsed >= d.inboundDurationSec) {
        d.phase = 'impacted';
        applyPlanetAttackCoreDamage({
          planetId: d.planetId,
          attackKind: PLANET_ATTACK_KIND.ARC_INBOUND_DRONE_IMPACT,
          sourceId: d.id,
          intensityMul: resolveArcInboundDroneStrikeLeakMul(d),
        });
      }
    }

    runInboundDroneInterceptPass(planetId, this.drones, wallDeltaSec);

    for (const d of this.drones) {
      if (d.phase !== 'inbound' && d.trailEndWallSec == null) {
        d.trailEndWallSec = elapsedWallSec;
      }
    }

    this.drones = this.drones.filter((d) => {
      if (d.phase === 'inbound') return true;
      const end = d.trailEndWallSec ?? elapsedWallSec;
      return elapsedWallSec - end < ArcInboundDroneSubCore.TRAIL_FADE_SEC;
    });
    while (this.drones.length > policy.maxActiveDrones) {
      this.drones.shift();
    }
  }

  private scheduleWave(
    planetId: string,
    elapsedWallSec: number,
    policy: ReturnType<typeof getArcCoreInboundDronePolicy>,
  ): void {
    for (let i = 0; i < policy.waveCount; i += 1) {
      this.pendingSpawns.push({
        dueSec: elapsedWallSec + i * policy.staggerSec,
        planetId,
      });
    }
  }

  private flushPendingSpawns(
    elapsedWallSec: number,
    planetId: string,
    policy: ReturnType<typeof getArcCoreInboundDronePolicy>,
  ): void {
    if (this.pendingSpawns.length === 0) return;
    const kept: PendingSpawn[] = [];
    for (const job of this.pendingSpawns) {
      if (job.planetId !== planetId) continue;
      if (job.dueSec > elapsedWallSec) {
        kept.push(job);
        continue;
      }
      if (this.drones.length >= policy.maxActiveDrones) {
        kept.push(job);
        continue;
      }
      this.spawnDrone(planetId, policy);
    }
    this.pendingSpawns = kept;
  }

  private spawnDrone(
    planetId: string,
    policy: ReturnType<typeof getArcCoreInboundDronePolicy>,
  ): void {
    this.droneSeq += 1;
    const drone: ArcInboundDrone = {
      id: `arc_inbound_drone_${planetId}_${this.droneSeq}`,
      planetId,
      approachAngleRad: Math.random() * Math.PI * 2,
      inboundStartOrbitMs: readPlanetOrbitClockMs(),
      inboundElapsedSec: 0,
      inboundDurationSec: policy.inboundDurationSec,
      hp: policy.droneHp,
      maxHp: policy.droneHp,
      phase: 'inbound',
      defenseZoneDwellSec: 0,
    };
    this.drones.push(drone);
  }

  private publishSnapshot(force = false): void {
    let key = `${this.drones.length}`;
    for (const d of this.drones) {
      // inbound 비행 중 elapsed는 orbit clock(worklet)이 담당 — store 4Hz publish·planet 리렌더 억제
      if (d.phase === 'inbound') {
        key += `|${d.id}:${d.phase}:${d.hp}`;
      } else {
        key += `|${d.id}:${d.phase}:${Math.round(d.inboundElapsedSec * 10)}:${d.hp}`;
      }
    }
    if (!force && key === this.lastPublishedKey) return;
    this.lastPublishedKey = key;

    useArcInboundDroneStore.getState().setSnapshot({
      drones: this.drones.map((d) => ({ ...d })),
      initialized: true,
    });
  }
}
