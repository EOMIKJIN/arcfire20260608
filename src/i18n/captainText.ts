// ============================================================
// NPC 함장 표시명 — displayName(KO) + displayNameEn
// 직함 — rank(KO) + rankEn / npcCaptainRankEn 어휘
// ============================================================

import type { NpcCaptain } from '../types';
import type { AppLocale } from './types';
import { isKoUi } from './index';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { NPC_CAPTAIN_RANK_EN } from './npcCaptainRankEn';

export function resolveNpcCaptainDisplayName(
  captain: Pick<NpcCaptain, 'displayName' | 'displayNameEn'> | null | undefined,
  locale: AppLocale,
): string {
  if (!captain) return '';
  const ko = String(captain.displayName ?? '').trim();
  if (isKoUi(locale)) return ko;
  const en = String(captain.displayNameEn ?? '').trim();
  return en || ko;
}

export function resolveNpcCaptainRank(
  captain: Pick<NpcCaptain, 'rank' | 'rankEn'> | null | undefined,
  locale: AppLocale,
): string {
  if (!captain) return '';
  const ko = String(captain.rank ?? '').trim();
  if (!ko) return '';
  if (isKoUi(locale)) return ko;
  const fromField = String(captain.rankEn ?? '').trim();
  if (fromField) return fromField;
  return NPC_CAPTAIN_RANK_EN[ko] ?? ko;
}

export function resolveNpcCaptainDisplayNameNow(
  captain: Pick<NpcCaptain, 'displayName' | 'displayNameEn'> | null | undefined,
): string {
  return resolveNpcCaptainDisplayName(captain, useAppSettingsStore.getState().locale);
}

export function resolveNpcCaptainRankNow(
  captain: Pick<NpcCaptain, 'rank' | 'rankEn'> | null | undefined,
): string {
  return resolveNpcCaptainRank(captain, useAppSettingsStore.getState().locale);
}

/** 함장 배경 프로필 — 포트레이트·스토리 정본. 비어 있으면 빈 문자열. */
export function resolveNpcCaptainProfileKo(
  captain: Pick<NpcCaptain, 'profileKo'> | null | undefined,
): string {
  return String(captain?.profileKo ?? '').trim();
}
