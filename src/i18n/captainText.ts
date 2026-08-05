// ============================================================
// NPC 함장 표시명 — displayName(KO) + displayNameEn
// ============================================================

import type { NpcCaptain } from '../types';
import type { AppLocale } from './types';
import { isKoUi } from './index';
import { useAppSettingsStore } from '../store/appSettingsStore';

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

export function resolveNpcCaptainDisplayNameNow(
  captain: Pick<NpcCaptain, 'displayName' | 'displayNameEn'> | null | undefined,
): string {
  return resolveNpcCaptainDisplayName(captain, useAppSettingsStore.getState().locale);
}
