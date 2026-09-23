import type { AppLocale } from './types';
import { isKoUi } from './index';
import { GOVERNOR_TITLE_EN } from './governorTitleEn';
import { NPC_CAPTAIN_RANK_EN } from './npcCaptainRankEn';

export function resolveGovernorTitle(
  governor: { governorTitleKo?: string; governorTitleEn?: string } | null | undefined,
  locale: AppLocale,
): string {
  if (!governor) return '';
  const ko = String(governor.governorTitleKo ?? '').trim();
  if (!ko) return '';
  if (isKoUi(locale)) return ko;
  const fromField = String(governor.governorTitleEn ?? '').trim();
  if (fromField) return fromField;
  return GOVERNOR_TITLE_EN[ko] ?? NPC_CAPTAIN_RANK_EN[ko] ?? ko;
}
