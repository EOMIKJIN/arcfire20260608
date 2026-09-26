/**
 * 시설 나가기 세대 — 비동기 바 대사 체인이 leave 이후에 present 되지 않게 한다.
 * 틱/persist 없음.
 */
let leaveAbortGen = 0;

export function bumpIngameDialogLeaveAbortGen(): number {
  leaveAbortGen += 1;
  return leaveAbortGen;
}

export function getIngameDialogLeaveAbortGen(): number {
  return leaveAbortGen;
}
