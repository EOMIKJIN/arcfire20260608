/** 계정 초기화(purge) 진행 중 — 틱/persist 없음. 알림·리다이렉트 게이트용 스칼라. */

let accountResetInProgress = false;

export function setAccountResetInProgress(active: boolean): void {
  accountResetInProgress = active;
}

export function isAccountResetInProgress(): boolean {
  return accountResetInProgress;
}
