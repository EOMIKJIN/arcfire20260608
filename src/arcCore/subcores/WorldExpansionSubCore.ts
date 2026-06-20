import { BaseArcSubCore } from './BaseArcSubCore';
import { applyArcCoreLegacyGuaranteedUnlocks } from '../worldExpansionGuaranteedUnlocks';
import { applyArcCoreAccountFreshStartSeedUnlock } from '../worldExpansionFreshStartSeed';

/**
 * 아크코어 월드 확장(로컬 일일 개방)
 * - 신규·초기화 월드: synth_073(미개척 -73) 즉시 1회 시드 개방.
 * - 레거시 보장 synth_033은 DEV/테스트 플래그일 때만 부트 1회 해금.
 * - 이후 미개척 성계는 `ArcCoreDailyOpsSubCore` 배치(기본 12:00, 1일 1성계)에서 선택 개방.
 * - 테스트(하네스): `EXPO_PUBLIC_ARCFIRE_DEV_HARNESS=1` + 간격/원샷 env.
 */
export class WorldExpansionSubCore extends BaseArcSubCore {
  constructor() {
    super('world_expansion_subcore', 'World Expansion 서브코어');
  }

  override onBoot(): void {
    applyArcCoreAccountFreshStartSeedUnlock();
    applyArcCoreLegacyGuaranteedUnlocks();
  }
}
