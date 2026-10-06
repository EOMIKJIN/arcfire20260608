/**
 * 플레이 핵심 동작 마커.
 * 1) 스텔라 관찰 입력 — 출시 빌드 포함 항상 `recordPlayerObserve` 로 기기 안 요약에만 쌓는다.
 * 2) 플레이봇 학습 (logcat `[PLAY_VERB]`) — 대표님 실기 → owner-playlog 수집기가 읽는다.
 *
 * - console 은 개발 빌드만. release 는 __DEV__=false 로 건너뛰고,
 *   babel `transform-remove-console`(NODE_ENV=production)이 console 호출도 지운다 — 이중 제거.
 * - 사용자 동작 1회당 1회. 틱·프레임 루프에서 호출 금지.
 */

import { recordPlayerObserve, type PlayerObserveVerb } from './playerObserve/playerObserveSink';

/**
 * ship = 전함 구매(조선소·무역소) — 일반 화물 매입(trade)과 구분
 * mine = 채굴 시작 · scan = 스캔 완료 · talk = 인게임 대화 종료 · develop = 플레이어 시설 설치·업그레이드 착수
 * land = 행성 착륙 · level = 레벨업(detail=새 레벨)
 * destroy·repair·equip·session = 관찰 전용 예약 (방출 지점은 후속)
 */
export type PlayVerb = PlayerObserveVerb;

function isPlayVerbLogEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function emitPlayVerb(verb: PlayVerb, detail?: string): void {
  recordPlayerObserve(verb, detail ?? '');
  if (!isPlayVerbLogEnabled()) return;
  const d = detail?.trim() ? ` detail=${detail.trim().replace(/\s+/g, '_')}` : '';
  // eslint-disable-next-line no-console
  console.log(`[PLAY_VERB] verb=${verb}${d}`);
}
