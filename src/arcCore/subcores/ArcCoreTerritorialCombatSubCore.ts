import { InteractionManager } from 'react-native';
import { BaseArcSubCore } from './BaseArcSubCore';
import { runTerritorialCombatPass } from '../territorial/runTerritorialCombatPass';
import { hydrateArcCoreTerritorialCombatState, ensureTerritorialCampaignPreviewSchedules } from '../territorial/arcCoreTerritorialCombatState';
import { hydratePlanetGovernorAssignmentStore } from '../../game/planetGovernor/planetGovernorAssignmentStore';
import { TERRITORIAL_PASS_PROBE_INTERVAL_MS } from '../territorial/territorialCombatCampaign';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';

/**
 * 접전지역 자동 영토 전투 — ArcCore 전술 패스.
 * - 부트/onBoot 동기 전행성 루프 금지 → InteractionManager 지연 + probe.
 * - 빠른 일반전투 해상(resolveTerritorialQuickCombat) + planetHolds 갱신 + 팝업.
 */
export class ArcCoreTerritorialCombatSubCore extends BaseArcSubCore {
  private lastProbeMs = 0;
  private passRunning = false;

  constructor() {
    super('arc_core_territorial_combat_subcore', '아레스 · 접전지역 전투');
  }

  override onBoot(): void {
    InteractionManager.runAfterInteractions(() => {
      void this.probePass('boot');
    });
  }

  override _advanceWallClock(wallDeltaSec: number): void {
    super._advanceWallClock(wallDeltaSec);
    const now = Date.now();
    if (now - this.lastProbeMs < TERRITORIAL_PASS_PROBE_INTERVAL_MS) return;
    this.lastProbeMs = now;
    void this.probePass('tick');
  }

  /** 오프라인 catch-up·포그라운드 복귀 — 60s probe 게이트 우회 */
  async probeAfterCatchUp(): Promise<void> {
    this.lastProbeMs = 0;
    await this.probePass('catch_up');
  }

  private async probePass(_source: 'boot' | 'tick' | 'catch_up'): Promise<void> {
    if (this.passRunning) return;
    this.passRunning = true;
    try {
      await hydrateArcCoreTerritorialCombatState();
      await ensureTerritorialCampaignPreviewSchedules();
      await hydratePlanetGovernorAssignmentStore();
      if (!useClanWarFoundationStore.getState().hydrated) {
        await useClanWarFoundationStore.getState().loadLocalClanWarFoundation();
      }
      await runTerritorialCombatPass();
    } finally {
      this.passRunning = false;
    }
  }
}
