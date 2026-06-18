import { BaseArcSubCore } from './BaseArcSubCore';
import { applyArcCoreLegacyGuaranteedUnlocks } from '../worldExpansionGuaranteedUnlocks';

/**
 * 아크코어 월드 확장(로컬 일일 개방)
 * - 레거시 보장 성계(synth_033·073)는 DEV/테스트 플래그일 때만 부트 1회 해금.
 * - 일일 미개척 성계 개방은 `ArcCoreDailyOpsSubCore` 배치(기본 12:00)에서 실행.
 * - 테스트(하네스): `EXPO_PUBLIC_ARCFIRE_DEV_HARNESS=1` + 간격/원샷 env.
 */
export class WorldExpansionSubCore extends BaseArcSubCore {
  constructor() {
    super('world_expansion_subcore', 'World Expansion 서브코어');
  }

  override onBoot(): void {
    applyArcCoreLegacyGuaranteedUnlocks();
  }
}
