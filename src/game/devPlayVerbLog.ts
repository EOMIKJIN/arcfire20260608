/**
 * 플레이봇 학습용 핵심 동작 마커 (logcat `[PLAY_VERB]`).
 * 대표님 실기 → owner-playlog 수집기가 퀘스트·전투·무역·편입·스킬 동사를 읽는다.
 *
 * - 개발 빌드만 출력. release 는 __DEV__=false 로 즉시 return,
 *   babel `transform-remove-console`(NODE_ENV=production)이 console 호출도 지운다 — 이중 제거.
 * - 사용자 동작 1회당 문자열 1개. 틱·프레임 루프에서 호출 금지.
 */

/** ship = 전함 구매(조선소·무역소) — 일반 화물 매입(trade)과 구분 */
export type PlayVerb = 'quest' | 'combat' | 'trade' | 'annex' | 'skill' | 'ship';

function isPlayVerbLogEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function emitPlayVerb(verb: PlayVerb, detail?: string): void {
  if (!isPlayVerbLogEnabled()) return;
  const d = detail?.trim() ? ` detail=${detail.trim().replace(/\s+/g, '_')}` : '';
  // eslint-disable-next-line no-console
  console.log(`[PLAY_VERB] verb=${verb}${d}`);
}
