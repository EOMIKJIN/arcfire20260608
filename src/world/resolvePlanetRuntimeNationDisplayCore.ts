// ============================================================
// 성계 점유(hold) → 행성정보 「국가」표시 — 순수 계산 core(zustand 미의존).
// 단위 테스트(Node/tsx)에서 RN 트랜스파일 에러 없이 돌리기 위해 store 의존 글루
// (`resolvePlanetRuntimeNationDisplay.ts`)와 분리했다(territorialSupplyLine.ts와 동일 원칙).
// ============================================================

import { translate } from '../i18n';
import type { AppLocale } from '../i18n/types';
import type { MapFactionSide } from '../galaxyMap/mapFactionSideCore';
import { resolveNationDisplayNameForMapSide } from './megaFactionNationPolicy';

/** side(이미 확정)+닉네임 → 표시용 국가명. neutral이면 null(접두 없음). */
export function resolveNationDisplayForSide(
  side: MapFactionSide,
  locale: AppLocale,
  nickname: string,
): string | null {
  if (side === 'independent') {
    // 싱글플레이 — 독립국 소유자는 항상 플레이어 본인 1명(월드맵 territoryNationLabels와 동일 문구).
    return translate(locale, 'worldmap.territory.nation.independent', { name: nickname });
  }
  // resolveNationDisplayNameForMapSide는 ko/en만 받음(megaFactionNationPolicy 기존 계약) —
  // ja/zh/es/de 등 나머지 locale은 en 표시명으로 폴백(이 모듈의 기존 ko/en 전용 설계와 동일 원칙).
  return resolveNationDisplayNameForMapSide(side, locale === 'ko' ? 'ko' : 'en');
}

const NATION_PREFIX_KO_RE = /^\[국가:\s*[^\]]+\]\s*/u;
const NATION_PREFIX_EN_RE = /^\[Nation:\s*[^\]]+\]\s*/i;

/** planets.csv에 정적으로 박힌 `[국가:…]`/`[Nation:…]` 접두만 제거(본문은 그대로). */
export function stripNationDescriptionPrefix(text: string): string {
  return text.replace(NATION_PREFIX_KO_RE, '').replace(NATION_PREFIX_EN_RE, '').trim();
}

/** 정적 접두 제거 후 side 기준으로 재접두(중립이면 접두 없이 본문만). */
export function withRuntimeNationPrefixForSide(
  raw: string,
  side: MapFactionSide,
  locale: AppLocale,
  nickname: string,
): string {
  const body = stripNationDescriptionPrefix(raw);
  const nation = resolveNationDisplayForSide(side, locale, nickname);
  if (!nation) return body;
  return locale === 'ko' ? `[국가: ${nation}] ${body}` : `[Nation: ${nation}] ${body}`;
}
