// ============================================================
// AiAabsSubCore — AABS 아크코어 서브코어
// ============================================================

import { BaseArcSubCore } from './BaseArcSubCore';
import { useAabsPolicyStore } from '../aabs/aabsPolicyStore';

/**
 * AABS 정책 스토어 부트스트랩.
 * 일일 Observe→Analyze→Write→Verify 정렬은 `ArcCoreDailyOpsSubCore` 배치에서 실행한다.
 */
export class AiAabsSubCore extends BaseArcSubCore {
  constructor() {
    super('ai_aabs_subcore', 'AABS 능동 밸런싱', { timeScale: 1 });
  }

  override onBoot(): void {
    void useAabsPolicyStore.getState().loadAsync();
  }
}
