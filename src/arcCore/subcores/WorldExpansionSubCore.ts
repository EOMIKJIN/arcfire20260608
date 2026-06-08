import { BaseArcSubCore } from './BaseArcSubCore';
import { applyArcCoreLegacyGuaranteedUnlocks } from '../worldExpansionGuaranteedUnlocks';

/**
 * 아크코어 월드 확장(로컬 일일 개방)
 * - 레거시 보장 성계는 부트 시 1회 해금.
 * - 일일 미개척 성계 개방은 `ArcCoreDailyOpsSubCore` 배치(기본 12:00)에서 실행.
 * - 테스트: `EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_INTERVAL_SEC`, 원샷: `EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_ONE_SHOT=1`.
 */
export class WorldExpansionSubCore extends BaseArcSubCore {
  constructor() {
    super('world_expansion_subcore', 'World Expansion 서브코어');
  }

  override onBoot(): void {
    applyArcCoreLegacyGuaranteedUnlocks();
  }
}
