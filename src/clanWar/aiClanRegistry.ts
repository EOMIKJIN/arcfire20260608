import type { AppLocale } from '../i18n/types';
import { AI_CLAN_REGISTRY_FROM_CSV } from '../data/generated';
import type { AiClanRegistryRow, NpcCaptain } from '../types';

let registryById: Map<string, AiClanRegistryRow> | null = null;
let registryByLeaderCaptainId: Map<string, AiClanRegistryRow> | null = null;

function ensureRegistryIndexes(): void {
  if (registryById) return;
  registryById = new Map();
  registryByLeaderCaptainId = new Map();
  for (const row of AI_CLAN_REGISTRY_FROM_CSV) {
    registryById.set(row.id, row);
    if (row.leaderCaptainId) registryByLeaderCaptainId.set(row.leaderCaptainId, row);
  }
}

export function getAiClanRegistryRow(clanId: string): AiClanRegistryRow | null {
  if (!clanId.trim()) return null;
  ensureRegistryIndexes();
  return registryById!.get(clanId) ?? null;
}

export function getAiClanRegistryForLeaderCaptain(captainId: string): AiClanRegistryRow | null {
  ensureRegistryIndexes();
  return registryByLeaderCaptainId!.get(captainId) ?? null;
}

export function listAiClanTerritoryHubClans(): readonly AiClanRegistryRow[] {
  return AI_CLAN_REGISTRY_FROM_CSV.filter((row) => row.territoryHubZone != null);
}

export function resolveAiClanDisplayName(
  clanId: string,
  locale: AppLocale = 'ko',
): string {
  const row = getAiClanRegistryRow(clanId);
  if (!row) return clanId;
  return locale === 'en' ? row.displayNameEn || row.displayNameKo : row.displayNameKo;
}

export function resolveCaptainAiClanId(captain: Pick<NpcCaptain, 'aiClanId' | 'isAiClanLeader' | 'id'>): string {
  const fromColumn = captain.aiClanId?.trim();
  if (fromColumn) return fromColumn;
  if (captain.isAiClanLeader) {
    const hub = getAiClanRegistryForLeaderCaptain(captain.id);
    if (hub) return hub.id;
  }
  return '';
}

export function resolveCaptainAiClanDisplayName(
  captain: Pick<NpcCaptain, 'aiClanId' | 'aiClanName' | 'isAiClanLeader' | 'id'>,
  locale: AppLocale = 'ko',
): string | null {
  const clanId = resolveCaptainAiClanId(captain);
  if (clanId) return resolveAiClanDisplayName(clanId, locale);
  if (captain.isAiClanLeader && captain.aiClanName.trim()) return captain.aiClanName.trim();
  return null;
}

export function isCaptainAiClanAffiliated(
  captain: Pick<NpcCaptain, 'aiClanId' | 'aiClanRole'>,
): boolean {
  return Boolean(captain.aiClanId?.trim()) && captain.aiClanRole !== 'none';
}
