// ============================================================
// AiAabsSubCore — AABS 아크코어 서브코어
// ============================================================

import { BaseArcSubCore } from './BaseArcSubCore';
import { runDailyPolicyAlignment, shouldRunDailyAlignment } from '../aabs/dailyPolicyAlignment';
import { useAabsPolicyStore } from '../aabs/aabsPolicyStore';

export class AiAabsSubCore extends BaseArcSubCore {
  private lastTickCheckMs = 0;

  constructor() {
    super('ai_aabs_subcore', 'AABS 능동 밸런싱', { timeScale: 1 });
  }

  override onBoot(): void {
    void useAabsPolicyStore.getState().loadAsync().then(() => {
      if (shouldRunDailyAlignment()) {
        void runDailyPolicyAlignment(false);
      }
    });
  }

  override _advanceWallClock(wallDeltaSec: number): void {
    super._advanceWallClock(wallDeltaSec);
    const now = Date.now();
    if (now - this.lastTickCheckMs < 60_000) return;
    this.lastTickCheckMs = now;
    if (shouldRunDailyAlignment(now)) {
      void runDailyPolicyAlignment(false);
    }
  }
}
