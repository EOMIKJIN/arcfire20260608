// ============================================================
// NPC 기함 함급(hull class) 마스터 — npcCapitalShips.hullTypeId 와 1:1
// + 근접 궤도 주민 연출용 hull_ambient_generic
// ============================================================

import type { NpcCapitalHullClassDef } from '../types';
import { NPC_CAPITAL_HULL_FALLBACK_ID } from '../types';

export const NPC_CAPITAL_HULL_CLASSES: readonly NpcCapitalHullClassDef[] = [
  {
    id: 'hull_cap_line_01',
    tierLabel: '라인',
    orbit: {
      radiusBase: 64,
      radiusSpread: 26,
      speedMin: 0.44,
      speedMax: 1.22,
      stillProbability: 0.12,
    },
    nameSalt: 0x31c4b21d,
    combatTags: ['capital', 'line', 'balanced'],
    threatTier: 6,
  },
  {
    id: 'hull_cap_siege_01',
    tierLabel: '시즈',
    orbit: {
      radiusBase: 60,
      radiusSpread: 22,
      speedMin: 0.32,
      speedMax: 0.95,
      stillProbability: 0.22,
    },
    nameSalt: 0x8a902f11,
    combatTags: ['capital', 'siege', 'slow'],
    threatTier: 7,
  },
  {
    id: 'hull_cap_carrier_light_01',
    tierLabel: '경항모',
    orbit: {
      radiusBase: 68,
      radiusSpread: 30,
      speedMin: 0.36,
      speedMax: 1.05,
      stillProbability: 0.18,
    },
    nameSalt: 0x4b7719cc,
    combatTags: ['capital', 'carrier', 'screen'],
    threatTier: 6,
  },
  {
    id: 'hull_cap_patrol_01',
    tierLabel: '순찰',
    orbit: {
      radiusBase: 70,
      radiusSpread: 28,
      speedMin: 0.5,
      speedMax: 1.35,
      stillProbability: 0.08,
    },
    nameSalt: 0x20fa55aa,
    combatTags: ['capital', 'patrol', 'fast'],
    threatTier: 5,
  },
  {
    id: 'hull_cap_research_01',
    tierLabel: '연구',
    orbit: {
      radiusBase: 66,
      radiusSpread: 32,
      speedMin: 0.4,
      speedMax: 1.08,
      stillProbability: 0.2,
    },
    nameSalt: 0x55aa20fa,
    combatTags: ['capital', 'research', 'support'],
    threatTier: 4,
  },
  {
    id: 'hull_cap_raider_01',
    tierLabel: '습격',
    orbit: {
      radiusBase: 58,
      radiusSpread: 34,
      speedMin: 0.48,
      speedMax: 1.4,
      stillProbability: 0.1,
    },
    nameSalt: 0xcafebabe,
    combatTags: ['capital', 'raider', 'burst'],
    threatTier: 6,
  },
  {
    id: NPC_CAPITAL_HULL_FALLBACK_ID,
    tierLabel: '항로',
    orbit: {
      radiusBase: 58,
      radiusSpread: 36,
      speedMin: 0.38,
      speedMax: 1.33,
      stillProbability: 0.25,
    },
    nameSalt: 0,
    combatTags: ['ambient', 'traffic'],
    threatTier: 2,
  },
] as const satisfies readonly NpcCapitalHullClassDef[];

/** 비등록 슬롯에 순환 적용할 함급 id (다양한 궤도 실루엣) */
export const NPC_CAPITAL_AMBIENT_SLOT_CLASS_IDS: readonly string[] = [
  'hull_cap_patrol_01',
  'hull_cap_line_01',
  NPC_CAPITAL_HULL_FALLBACK_ID,
  'hull_cap_carrier_light_01',
] as const;
