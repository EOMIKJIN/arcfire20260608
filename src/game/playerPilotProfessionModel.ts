// ============================================================
// 플레이어 함장(프로페션) — Table-First 온보딩 (전투 수치는 전함 CSV 단일 정본)
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import {
  PLAYER_PROFESSIONS_FROM_CSV,
  type PlayerProfessionCsvRow,
} from '../data/generated';
import type { PlayerPilotGender, PlayerPilotProfile, PlayerStats } from '../types';
import { resolveNpcCaptainPortraitSource } from './npcCaptainPortraitAssets';

const DEFAULT_PROFESSION_ID = 'prof_striker';

export function listPlayerProfessions(): readonly PlayerProfessionCsvRow[] {
  return Object.values(PLAYER_PROFESSIONS_FROM_CSV).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPlayerProfessionById(id: string | null | undefined): PlayerProfessionCsvRow | null {
  if (!id) return null;
  return PLAYER_PROFESSIONS_FROM_CSV[id] ?? null;
}

export function getDefaultPlayerProfession(): PlayerProfessionCsvRow {
  return (
    getPlayerProfessionById(DEFAULT_PROFESSION_ID) ??
    listPlayerProfessions()[0]!
  );
}

export function buildPlayerPilotProfileFromProfession(
  profession: PlayerProfessionCsvRow,
): PlayerPilotProfile {
  return {
    professionId: profession.id,
    gender: profession.gender as PlayerPilotGender,
    personalityTag: profession.personalityKo,
    traitIds: [...profession.traitIds],
    combatArchetype: profession.combatArchetype,
  };
}

export function resolvePlayerSocialStatsFromProfession(
  professionId: string | null | undefined,
): PlayerStats {
  const row = getPlayerProfessionById(professionId) ?? getDefaultPlayerProfession();
  return { ...row.socialStats };
}

/** 구세이브 — 전함 겹치 스탯(STR/DEX/CON/INT) 제거 후 WIS/CHA만 유지 */
export function normalizePlayerSocialStats(
  raw: Partial<PlayerStats> | null | undefined,
  professionId?: string | null,
): PlayerStats {
  const fallback = resolvePlayerSocialStatsFromProfession(professionId);
  const wisdom = Number.isFinite(raw?.wisdom) ? Number(raw!.wisdom) : fallback.wisdom;
  const charisma = Number.isFinite(raw?.charisma) ? Number(raw!.charisma) : fallback.charisma;
  return { wisdom, charisma };
}

export function normalizePlayerPilotProfile(
  raw: PlayerPilotProfile | null | undefined,
): PlayerPilotProfile {
  if (raw?.professionId) {
    const row = getPlayerProfessionById(raw.professionId);
    if (row) {
      return {
        professionId: row.id,
        gender: (raw.gender ?? row.gender) as PlayerPilotGender,
        personalityTag: raw.personalityTag?.trim() || row.personalityKo,
        traitIds: raw.traitIds?.length ? [...raw.traitIds] : [...row.traitIds],
        combatArchetype: raw.combatArchetype ?? row.combatArchetype,
      };
    }
  }
  return buildPlayerPilotProfileFromProfession(getDefaultPlayerProfession());
}

export function formatPlayerProfessionStatLine(stats: PlayerStats): string {
  return `WIS ${stats.wisdom}  CHA ${stats.charisma}`;
}

/** 파일럿 정보 패널·UI — `player_professions.csv` portraitImageAssetKey */
export function resolvePlayerPilotPortraitSource(
  professionId: string | null | undefined,
): ImageSourcePropType | null {
  const row = getPlayerProfessionById(professionId) ?? getDefaultPlayerProfession();
  return resolveNpcCaptainPortraitSource(row.portraitImageAssetKey);
}

export function formatPlayerProfessionTraitLine(traitIds: readonly string[]): string {
  if (traitIds.length === 0) return '—';
  return traitIds.map((id) => id.replace(/^trait_/, '').replace(/_/g, ' ')).join(' · ');
}
