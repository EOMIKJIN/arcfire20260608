/**
 * post-Skia-peak 직후 RN 성운 remount 여부.
 * remount는 Fresco 1024² 재디코드만 늘리고 계단 native를 내리지 못함(2026-10-02 실측).
 * 15분 deep pass의 remount는 이 정책 밖.
 */
export function shouldSkipHubPeakBackdropRemount(reason: string): boolean {
  return (
    reason.includes('hub_inbound')
    || reason.includes('inbound_settle')
    || reason.includes('hub_combat_orbit_end')
    || reason.includes('hub_wave_inter_wave')
  );
}
