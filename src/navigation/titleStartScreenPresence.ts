/** 타이틀(시작화면) 마운트 여부 — 틱/persist 없음. 알림 게이트용 스칼라. */

let titleStartScreenActive = false;

export function setTitleStartScreenActive(active: boolean): void {
  titleStartScreenActive = active;
}

export function isTitleStartScreenActive(): boolean {
  return titleStartScreenActive;
}
