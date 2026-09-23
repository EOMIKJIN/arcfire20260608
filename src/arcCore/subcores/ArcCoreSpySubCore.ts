// ============================================================
// 아크코어 스파이 서브코어 — 백엔드 T(기술) 침식 (비가시)
// ============================================================

import { BaseArcSubCore } from './BaseArcSubCore';
import { applyPlanetAttackCoreDamage } from '../planetAttack/applyPlanetAttackCoreDamage';
import { PLANET_ATTACK_KIND } from '../planetAttack/planetAttackKind';
import { resolveArcCoreSpyPolicy } from '../spy/arcCoreSpyPolicy';
import { listActiveArcCoreSpyCaptainIdsAtPlanet } from '../spy/listActiveArcCoreSpiesAtPlanet';
import { useArcCoreSpyExpelledStore } from '../../store/arcCoreSpyExpelledStore';
import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import { usePlayerStore } from '../../store/playerStore';
import { tryNotifyArcCoreSpyIntelAlert } from '../spy/tryNotifyArcCoreSpyIntelAlert';
import { resetArcCoreSpyIntelAlertStore } from '../spy/arcCoreSpyIntelAlertStore';
import { resetPlanetHubSpyIntelDialogSchedule } from '../spy/spyIntelAutoOpenGate';
import { resolveArcCoreSpyTacticalBundleAtPlanet } from '../spy/resolveArcCoreSpyTacticalBundleAtPlanet';

/**
 * 궤도/수송 체류 스파이 → `applyPlanetAttackCoreDamage`(T only).
 * 드론(물리)과 분리 · 플레이어 체류 행성만 · zero/low-allocation tick.
 */
export class ArcCoreSpySubCore extends BaseArcSubCore {
  private pulseAccSec = 0;
  private lookupAccSec = 0;
  private lastPlanetId: string | null = null;
  private lastSpyKey = '';
  private cachedSpyIds: readonly string[] = [];
  /** 세션 내 스파이별 정보원 알림 1회 — `${planetId}:${captainId}` */
  private readonly notifiedSpyKeys = new Set<string>();
  private static readonly LOOKUP_INTERVAL_SEC = 1;

  constructor() {
    super('arc_core_spy_subcore', '닉스 · 스파이');
    this.onWallTick = ({ wallDeltaSec }) => {
      this.tick(wallDeltaSec);
    };
  }

  override onBoot(): void {
    void useArcCoreSpyExpelledStore.getState().loadLocal();
    this.pulseAccSec = 0;
    this.lookupAccSec = 0;
    this.lastPlanetId = null;
    this.lastSpyKey = '';
    this.cachedSpyIds = [];
    this.notifiedSpyKeys.clear();
    resetArcCoreSpyIntelAlertStore();
    resetPlanetHubSpyIntelDialogSchedule();
  }

  override onShutdown(): void {
    this.pulseAccSec = 0;
    this.lookupAccSec = 0;
    this.lastPlanetId = null;
    this.lastSpyKey = '';
    this.cachedSpyIds = [];
    this.notifiedSpyKeys.clear();
    resetArcCoreSpyIntelAlertStore();
    resetPlanetHubSpyIntelDialogSchedule();
  }

  private tick(wallDeltaSec: number): void {
    const policy = resolveArcCoreSpyPolicy();
    if (!policy.enabled) return;

    const playerPlanetId = usePlayerStore.getState().player?.currentPlanetId ?? null;
    if (policy.playerPlanetOnly && !playerPlanetId?.trim()) {
      this.pulseAccSec = 0;
      this.lookupAccSec = 0;
      this.lastPlanetId = null;
      this.lastSpyKey = '';
      this.cachedSpyIds = [];
      return;
    }

    const planetId = playerPlanetId!.trim();
    if (planetId !== this.lastPlanetId) {
      this.pulseAccSec = 0;
      this.lookupAccSec = 0;
      this.lastPlanetId = planetId;
      this.lastSpyKey = '';
      this.cachedSpyIds = [];
      this.notifiedSpyKeys.clear();
    }

    this.lookupAccSec += wallDeltaSec;
    const arcShips = useArcNpcTrafficStore.getState().ships;
    if (this.lookupAccSec >= ArcCoreSpySubCore.LOOKUP_INTERVAL_SEC || this.cachedSpyIds.length === 0) {
      this.lookupAccSec = 0;
      this.cachedSpyIds = listActiveArcCoreSpyCaptainIdsAtPlanet(planetId, arcShips);
    }
    const spyIds = this.cachedSpyIds;
    if (spyIds.length === 0) {
      this.pulseAccSec = 0;
      this.lastSpyKey = '';
      return;
    }

    const spyKey = spyIds.join(',');
    if (spyKey !== this.lastSpyKey) {
      const prevIds = this.lastSpyKey ? this.lastSpyKey.split(',') : [];
      const prevSet = new Set(prevIds);
      const newlyArrived: string[] = [];
      for (let i = 0; i < spyIds.length; i += 1) {
        const captainId = spyIds[i]!;
        if (!prevSet.has(captainId)) newlyArrived.push(captainId);
      }
      if (newlyArrived.length > 0) {
        const consumed = tryNotifyArcCoreSpyIntelAlert({
          planetId,
          newlyArrivedSpyCaptainIds: newlyArrived,
          activeSpyCaptainIds: spyIds,
          notifiedSpyKeys: this.notifiedSpyKeys,
        });
        this.pulseAccSec = 0;
        if (consumed) this.lastSpyKey = spyKey;
      } else {
        this.pulseAccSec = 0;
        this.lastSpyKey = spyKey;
      }
    }

    this.pulseAccSec += wallDeltaSec;
    if (this.pulseAccSec < policy.spyPulseIntervalSec) return;
    this.pulseAccSec = 0;

    const bundle = resolveArcCoreSpyTacticalBundleAtPlanet(planetId, arcShips);
    if (bundle.backdoorSpyCount <= 0) return;

    const avgPulseMul = bundle.backdoorPulseIntensityMul / Math.max(1, bundle.backdoorSpyCount);
    const intensityMul =
      bundle.backdoorSpyCount * policy.spyPulseIntensityPerSpy * Math.max(0.01, avgPulseMul);
    applyPlanetAttackCoreDamage({
      planetId,
      attackKind: PLANET_ATTACK_KIND.ARC_CORE_SPY_INFILTRATION,
      sourceId: `spy:${spyIds[0]}`,
      intensityMul,
    });
  }
}
