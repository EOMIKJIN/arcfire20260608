import type { AppLocale } from '../i18n/types';
import { isKoUi } from '../i18n';

/** 행성 허브·지도 클랜 플레이트 — 팩션·소유권 꼬리표 제거 후 순수 클랜명만 */
export function formatClanPlateDisplayName(displayName: string): string {
  return displayName
    .replace(/\s*\((블루|레드|Blue|Red|BLUE|RED)\)\s*$/iu, '')
    .replace(/\s*\((소유권|Owned)\)\s*$/iu, '')
    .trim();
}

/** 독립국 플레이트 — 솔로 클랜명("{닉네임} 함대")에서 닉네임만 추출 */
export function stripSoloClanFleetSuffix(displayName: string): string {
  return displayName.replace(/\s*(함대|Fleet)\s*$/iu, '').trim() || displayName;
}

const SOLO_FLEET_SUFFIX_RE = /\s*(함대|Fleet)\s*$/iu;

/**
 * 솔로 클랜 "{닉} 함대" / "{닉} Fleet" 를 locale에 맞게 표시.
 * AI·커스텀 클랜명은 그대로 반환.
 */
export function resolveClanDisplayNameForLocale(
  displayName: string,
  locale: AppLocale,
): string {
  const raw = String(displayName ?? '').trim();
  if (!raw || !SOLO_FLEET_SUFFIX_RE.test(raw)) return raw;
  const nick = stripSoloClanFleetSuffix(raw);
  return isKoUi(locale) ? `${nick} 함대` : `${nick} Fleet`;
}
