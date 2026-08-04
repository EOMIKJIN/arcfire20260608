// ============================================================
// 교전지역(영유권 변동) 팝업 — 은하계 허브(worldmap) 진입 상태에서만 노출.
// 타이틀 화면·행성 허브 등 다른 화면에 떠 있는 동안 백그라운드에서 계산된
// territorial pass 결과가 화면 위로 불쑥 뜨는 걸 막는다(2026-08-04 대표님 지시).
// 판정·상태 갱신 자체는 그대로(타이밍 무변경) — 팝업 노출 시점만 지연.
// ============================================================

let galaxyMapActive = false;
/** 단일 알림 슬롯(TERRITORIAL_OCCUPATION_ALERT_ID)과 동일하게 최신 1건만 유지 */
let pendingShow: (() => void) | null = null;

/** worldmap.tsx 포커스 진입/이탈에서 호출 — 진입 시 보류 중이던 알림을 흘려보낸다. */
export function setTerritorialAlertGalaxyMapActive(active: boolean): void {
  galaxyMapActive = active;
  if (active && pendingShow) {
    const show = pendingShow;
    pendingShow = null;
    show();
  }
}

/** 은하계 허브에 있으면 즉시 표시, 아니면 다음 진입까지 보류. */
export function presentTerritorialAlertGatedToGalaxyMap(show: () => void): void {
  if (galaxyMapActive) {
    show();
    return;
  }
  pendingShow = show;
}
