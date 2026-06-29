import { BaseArcSubCore } from './BaseArcSubCore';
import { applyArcCoreLegacyGuaranteedUnlocks } from '../worldExpansionGuaranteedUnlocks';
import { integrateUnlockedSynthFrontierStatEconomyAsync } from '../planetCore/integrateUnlockedSynthFrontierStatEconomy';
import { syncArcCoreGlobalWorldExpansionSync } from '../syncArcCoreGlobalWorldExpansion';
import { isArcCoreGlobalWorldExpansionEnabled } from '../worldExpansionGlobalPolicy';

/**
 * 아크코어 월드 확장
 * - 전역 일정(globalScheduleEnabled): RTDB/CSV epoch 기준 누적 synth 개방 (설치일 무관).
 * - 레거시: per-user 일일 1성계 + fresh-start 시드(비활성 시).
 * - DEV: synth_033 레거시 보장 해금.
 */
export class WorldExpansionSubCore extends BaseArcSubCore {
  constructor() {
    super('world_expansion_subcore', 'World Expansion 서브코어');
  }

  override onBoot(): void {
    if (isArcCoreGlobalWorldExpansionEnabled()) {
      syncArcCoreGlobalWorldExpansionSync();
    }
    applyArcCoreLegacyGuaranteedUnlocks();
    void integrateUnlockedSynthFrontierStatEconomyAsync();
  }
}
