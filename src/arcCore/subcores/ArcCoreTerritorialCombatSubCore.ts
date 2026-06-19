import { InteractionManager } from 'react-native';
import { BaseArcSubCore } from './BaseArcSubCore';
import { runTerritorialCombatPass } from '../territorial/runTerritorialCombatPass';
import { hydrateArcCoreTerritorialCombatState } from '../territorial/arcCoreTerritorialCombatState';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';

/**
 * 접전지역 자동 영토 전투 — ArcCore 전술 패스(테스트: 1시간 주기).
 * - 부트/onBoot 동기 전행성 루프 금지 → InteractionManager 지연 + 60s probe.
 * - 빠른 일반전투 해상(resolveTerritorialQuickCombat) + planetHolds 갱신 + 팝업.
 */
export class ArcCoreTerritorialCombatSubCore extends BaseArcSubCore {
  private lastProbeMs = 0;
  private passRunning = false;

  constructor() {
    super('arc_core_territorial_combat_subcore', '아크코어 접전지역 전투');
  }

  override onBoot(): void {
    InteractionManager.runAfterInteractions(() => {
      void this.probePass('boot');
    });
  }

  override _advanceWallClock(wallDeltaSec: number): void {
    super._advanceWallClock(wallDeltaSec);
    const now = Date.now();
    if (now - this.lastProbeMs < 60_000) return;
    this.lastProbeMs = now;
    void this.probePass('tick');
  }

  private async probePass(_source: 'boot' | 'tick'): Promise<void> {
    if (this.passRunning) return;
    this.passRunning = true;
    try {
      await hydrateArcCoreTerritorialCombatState();
      if (!useClanWarFoundationStore.getState().hydrated) {
        await useClanWarFoundationStore.getState().loadLocalClanWarFoundation();
      }
      await runTerritorialCombatPass();
    } finally {
      this.passRunning = false;
    }
  }
}
