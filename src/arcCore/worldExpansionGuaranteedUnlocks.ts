/**
 * 아크코어 레거시 보장 개방 — 월드스토어 초기 배열에 박지 않고,
 * `WorldExpansionSubCore` 부트에서 일일 개방과 동일한 해금·명령 발행 경로로 수행한다.
 */
import { useWorldStore } from '../store/worldStore';
import { dispatchArcCoreAfterSystemUnlock } from './worldExpansionUnlockDispatch';
import { persistArcCoreDailyUnlockRecord } from './arcCoreDailyUnlockVerification';

/** 정책상 항상 개방할 합성 성계 id(3자리 패딩). */
export const ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS: readonly string[] = ['synth_073', 'synth_033'];

/**
 * `world.loaded` 이후 호출. 아직 잠금인 보장 성계에 대해
 * `unlockSystem(..., arc_core_legacy_seed)` + 명령 버스 + (지원용) 마지막 개방 기록을 남긴다.
 * `lastExpansionAtMs`(일일 주기)는 건드리지 않는다.
 */
export function applyArcCoreLegacyGuaranteedUnlocks(): void {
  const world0 = useWorldStore.getState();
  if (!world0.loaded) return;

  for (const systemId of ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS) {
    const world = useWorldStore.getState();
    if (world.isSystemUnlocked(systemId)) continue;
    const target = world.getSystem(systemId);
    if (!target?.planets[0]?.id) continue;

    world.unlockSystem(systemId, 'arc_core_legacy_seed');
    dispatchArcCoreAfterSystemUnlock(systemId, 'legacy_seed');
    void persistArcCoreDailyUnlockRecord(systemId);
  }
}
