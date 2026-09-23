/** info 패널 — 함장·함선명과 우측 요약 구분자 */
export const NEARBY_PRESENCE_DISPLAY_SEP = ' \u2502 ';

/** 전투 벤치마크 CSV 함장 — 허브 궤도·INFO 목록 제외 */
export const PLAYER_BENCH_CAPTAIN_ID = 'Player_pilot';

/** 플레이어 기함 INFO 행 슬롯 키(궤도 테이블 슬롯과 분리) */
export const PLAYER_FLAGSHIP_HUB_INFO_SLOT = -1;

/** 퀘스트 핀 마크 — 저채도 진한 녹색. 총사령관은 마크 없음 */
export const PINNED_INFO_MARK_INK = '#2F5C45';
export const PINNED_INFO_MARK_QUEST = '◈';

export function resolvePinnedInfoMark(
  pinKind: 'governor' | 'quest' | undefined,
): string | null {
  if (pinKind === 'quest') return PINNED_INFO_MARK_QUEST;
  return null;
}

export function formatPinnedInfoPrimaryLabel(
  pinKind: 'governor' | 'quest' | undefined,
  name: string,
): string {
  const mark = resolvePinnedInfoMark(pinKind);
  return mark ? `${mark} ${name}` : name;
}

export function stripHubOrbitClanBracketPrefix(label: string): string {
  return String(label ?? '')
    .replace(/^[‹<][^›>]*[›>]\s*/u, '')
    .trim();
}
