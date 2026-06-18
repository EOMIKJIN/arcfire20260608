// ============================================================
// 전함 분류 표준 — Tier → 함급 → Loadout → 역할 (인지 1순위)
// tables/balance/capital_ship_* CSV 정본
// ============================================================

import {
  CapitalShipClassMaster_FROM_BALANCE_CSV,
  CapitalShipCombatLevelClass_FROM_BALANCE_CSV,
  CapitalShipHullTierMapping_FROM_BALANCE_CSV,
  CapitalShipInstanceClass_FROM_BALANCE_CSV,
  CapitalShipLoadoutProfile_FROM_BALANCE_CSV,
  CapitalShipTradeListingPolicy_FROM_BALANCE_CSV,
  CapitalShipWaveTierClass_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated';
import type { CapitalShipArchetype } from '../../types';
import { resolveHullTierKeyForTradeCatalogShip } from './capitalShipTradeListingPolicy';
import type { AppLocale } from '../../i18n/types';
import { useAppSettingsStore } from '../../store/appSettingsStore';

export type CapitalShipLoadoutProfileKey =
  | 'fighter'
  | 'ranger'
  | 'neutral'
  | 'survival'
  | 'special';

export type CapitalShipClassification = {
  npcShipId: string;
  tierBand: number;
  shipClass: string;
  loadoutProfile: CapitalShipLoadoutProfileKey;
  labelKo: string;
  labelEn: string;
  loadoutLabelKo: string;
  loadoutLabelEn: string;
  combatRangeKo: string;
  combatRangeEn: string;
  roleSummaryKo: string;
  roleSummaryEn: string;
  identityHeadline: string;
  infoPanelBadge: string;
};

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const CLASS_BY_KEY = new Map(
  CapitalShipClassMaster_FROM_BALANCE_CSV.map((row) => [
    `${String(row.shipClass).trim()}:${parseNum(row.tierBand, 0)}`,
    row,
  ]),
);

const LOADOUT_BY_KEY = new Map(
  CapitalShipLoadoutProfile_FROM_BALANCE_CSV.map((row) => [
    String(row.loadoutProfile).trim(),
    row,
  ]),
);

const INSTANCE_BY_SHIP_ID = new Map(
  CapitalShipInstanceClass_FROM_BALANCE_CSV.map((row) => [
    String(row.npcShipId).trim(),
    row,
  ]),
);

const HULL_TIER_MAPPING = new Map(
  CapitalShipHullTierMapping_FROM_BALANCE_CSV.map((row) => [
    String(row.hullTierKey).trim(),
    row,
  ]),
);

const TRADE_CATALOG_SHIP_IDS = new Set<string>();
for (const row of CapitalShipTradeListingPolicy_FROM_BALANCE_CSV) {
  const primary = String(row.canonicalNpcShipId ?? '').trim();
  const alternate = String((row as { alternateNpcShipId?: string }).alternateNpcShipId ?? '').trim();
  if (primary) TRADE_CATALOG_SHIP_IDS.add(primary);
  if (alternate) TRADE_CATALOG_SHIP_IDS.add(alternate);
}

const SHIP_BY_ID = new Map(NPC_CAPITAL_SHIPS_FROM_CSV.map((s) => [s.id, s]));

function archetypeToLoadout(archetype: CapitalShipArchetype | undefined): CapitalShipLoadoutProfileKey {
  switch (archetype) {
    case 'fighter':
      return 'fighter';
    case 'ranger':
      return 'ranger';
    case 'survival':
      return 'survival';
    case 'special':
      return 'special';
    default:
      return 'neutral';
  }
}

function resolveClassRow(shipClass: string, tierBand: number) {
  return CLASS_BY_KEY.get(`${shipClass.trim()}:${tierBand}`) ?? null;
}

function resolveFromHullTierKey(hullTierKey: string): { shipClass: string; tierBand: number } | null {
  const row = HULL_TIER_MAPPING.get(hullTierKey.trim());
  if (!row) return null;
  return {
    shipClass: String(row.shipClass).trim(),
    tierBand: parseNum(row.tierBand, 1),
  };
}

function resolveFromWaveTier(npcShipId: string): {
  shipClass: string;
  tierBand: number;
  loadoutProfile: CapitalShipLoadoutProfileKey;
} | null {
  const m = /^npc_wave_invader_t(\d+)$/i.exec(npcShipId.trim());
  if (!m) return null;
  const waveTier = parseNum(m[1], 1);
  for (const row of CapitalShipWaveTierClass_FROM_BALANCE_CSV) {
    const min = parseNum(row.waveTierMin, 0);
    const max = parseNum(row.waveTierMax, 999);
    if (waveTier >= min && waveTier <= max) {
      return {
        shipClass: String(row.shipClass).trim(),
        tierBand: parseNum(row.tierBand, 1),
        loadoutProfile: String(row.defaultLoadoutProfile).trim() as CapitalShipLoadoutProfileKey,
      };
    }
  }
  return null;
}

function resolveFromExpReward(expReward: number): {
  shipClass: string;
  tierBand: number;
  loadoutProfile: CapitalShipLoadoutProfileKey;
} | null {
  for (const row of CapitalShipCombatLevelClass_FROM_BALANCE_CSV) {
    const min = parseNum(row.expRewardMin, 0);
    const max = parseNum(row.expRewardMax, 999);
    if (expReward >= min && expReward <= max) {
      return {
        shipClass: String(row.shipClass).trim(),
        tierBand: parseNum(row.tierBand, 1),
        loadoutProfile: String(row.defaultLoadoutProfile).trim() as CapitalShipLoadoutProfileKey,
      };
    }
  }
  return null;
}

function buildClassification(
  npcShipId: string,
  shipClass: string,
  tierBand: number,
  loadoutProfile: CapitalShipLoadoutProfileKey,
  roleOverrideKo?: string,
): CapitalShipClassification | null {
  const classRow = resolveClassRow(shipClass, tierBand);
  if (!classRow) return null;

  const loadoutRow = LOADOUT_BY_KEY.get(loadoutProfile) ?? LOADOUT_BY_KEY.get('neutral');
  const labelKo = String(classRow.labelKo).trim();
  const labelEn = String(classRow.labelEn).trim();
  const loadoutLabelKo = String(loadoutRow?.labelKo ?? '표준형').trim();
  const loadoutLabelEn = String(loadoutRow?.labelEn ?? loadoutLabelKo).trim();
  const combatRangeKo = String(loadoutRow?.combatRangeKo ?? '혼합').trim();
  const combatRangeEn = String(loadoutRow?.combatRangeEn ?? combatRangeKo).trim();
  const roleSummaryKo = roleOverrideKo?.trim() || String(classRow.roleSummaryKo).trim();
  const roleSummaryEn = String(classRow.roleSummaryEn ?? roleSummaryKo).trim();

  const identityHeadline = `Tier ${tierBand} · ${labelKo} (${labelEn}) · ${loadoutLabelKo} · ${combatRangeKo}`;
  const infoPanelBadge = `T${tierBand} ${labelKo}`;

  return {
    npcShipId: npcShipId.trim(),
    tierBand,
    shipClass,
    loadoutProfile,
    labelKo,
    labelEn,
    loadoutLabelKo,
    loadoutLabelEn,
    combatRangeKo,
    combatRangeEn,
    roleSummaryKo,
    roleSummaryEn,
    identityHeadline,
    infoPanelBadge,
  };
}

/** npcShipId → 표준 분류 (없으면 null) */
export function resolveCapitalShipClassification(
  npcShipId: string | null | undefined,
): CapitalShipClassification | null {
  const id = String(npcShipId ?? '').trim();
  if (!id) return null;

  const ship = SHIP_BY_ID.get(id);
  const instance = INSTANCE_BY_SHIP_ID.get(id);

  if (instance) {
    return buildClassification(
      id,
      String(instance.shipClass).trim(),
      parseNum(instance.tierBand, 1),
      String(instance.loadoutProfile).trim() as CapitalShipLoadoutProfileKey,
      String(instance.roleOverrideKo ?? '').trim() || undefined,
    );
  }

  const wave = resolveFromWaveTier(id);
  if (wave) {
    const loadout = ship?.combat?.capitalShipArchetype
      ? archetypeToLoadout(ship.combat.capitalShipArchetype)
      : wave.loadoutProfile;
    return buildClassification(id, wave.shipClass, wave.tierBand, loadout);
  }

  if (TRADE_CATALOG_SHIP_IDS.has(id)) {
    const fromHull = resolveFromHullTierKey(resolveHullTierKeyForTradeCatalogShip(id));
    if (fromHull) {
      const loadout = archetypeToLoadout(ship?.combat?.capitalShipArchetype);
      return buildClassification(id, fromHull.shipClass, fromHull.tierBand, loadout);
    }
  }

  const expReward = ship?.combat?.expReward ?? 0;
  if (expReward > 0) {
    const fromExp = resolveFromExpReward(expReward);
    if (fromExp) {
      const loadout = ship?.combat?.capitalShipArchetype
        ? archetypeToLoadout(ship.combat.capitalShipArchetype)
        : fromExp.loadoutProfile;
      return buildClassification(id, fromExp.shipClass, fromExp.tierBand, loadout);
    }
  }

  return null;
}

/** 무역소·조선소용 — identity + 역할 */
export function formatCapitalShipIdentityBlock(
  classification: CapitalShipClassification,
  locale: AppLocale = useAppSettingsStore.getState().locale,
): string {
  if (locale !== 'ko') {
    const headline = `Tier ${classification.tierBand} · ${classification.labelEn} · ${classification.loadoutLabelEn} · ${classification.combatRangeEn}`;
    return `${headline}\n${classification.roleSummaryEn}`;
  }
  return `${classification.identityHeadline}\n${classification.roleSummaryKo}`;
}

/** info 패널 우측 — T2 구축함 · Fighter형 */
export function formatCapitalShipInfoPanelBadge(
  classification: CapitalShipClassification,
  locale: AppLocale = useAppSettingsStore.getState().locale,
): string {
  if (classification.loadoutProfile === 'survival') {
    return locale !== 'ko' ? classification.loadoutLabelEn : classification.infoPanelBadge;
  }
  const hull = locale !== 'ko' ? classification.labelEn : classification.labelKo;
  const loadout = locale !== 'ko' ? classification.loadoutLabelEn : classification.loadoutLabelKo;
  return `T${classification.tierBand} ${hull} · ${loadout}`;
}
