// ============================================================
// capital_hull_purchase_policy.csv — 함선 구매 검증(조선소 연동용)
// ============================================================

import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated';
import { getCapitalHullPurchaseRow } from './balanceTableRegistry';
import { getCanonicalNpcShipIdForHullTier } from './capitalShipTradeListingPolicy';

/** hullTierKey → 대표 npc_ai_ships id (tradePortListed 우선) */
const HULL_TIER_NPC_SHIP_ID: Record<string, string> = {
  frigate_default: 'Player_npc_red_fleet_1',
  frigate_upgraded: 'Player_frigate_mk2',
  destroyer: 'Player_destroyer_mk1',
  destroyer_upgraded: 'Player_destroyer_mk2',
  cruiser: 'Player_cruiser_mk1',
  cruiser_upgraded: 'Player_cruiser_mk2',
  battlecruiser: 'Player_battlecruiser_mk1',
  battlecruiser_max: 'Player_battlecruiser_apex',
  dreadnought: 'Player_dreadnought_mk1',
  super_capital: 'Player_super_capital_mk1',
  apex_legend: 'Player_apex_legend_mk1',
};

export function listCapitalHullPurchasePolicyRows() {
  return CapitalHullPurchasePolicy_FROM_BALANCE_CSV;
}

/** 신규 파일럿 기본 지급 전함 — `frigate_default` 플레이어 대표 hull */
export function resolvePlayerDefaultNpcCapitalShipId(): string {
  const mapped = HULL_TIER_NPC_SHIP_ID.frigate_default;
  if (mapped && NPC_CAPITAL_SHIPS_FROM_CSV.some((s) => s.id === mapped)) return mapped;
  const playerHull = NPC_CAPITAL_SHIPS_FROM_CSV.find((s) => s.id.startsWith('Player_'));
  return playerHull?.id ?? mapped ?? 'Player_npc_red_fleet_1';
}

export function resolveNpcShipIdForHullTier(hullTierKey: string): string | null {
  const canonical = getCanonicalNpcShipIdForHullTier(hullTierKey);
  if (canonical && NPC_CAPITAL_SHIPS_FROM_CSV.some((s) => s.id === canonical)) return canonical;
  const mapped = HULL_TIER_NPC_SHIP_ID[hullTierKey];
  if (mapped && NPC_CAPITAL_SHIPS_FROM_CSV.some((s) => s.id === mapped)) return mapped;
  const row = getCapitalHullPurchaseRow(hullTierKey);
  if (!row) return null;
  const minLv = parseNum(row.requiredPilotLevelMin, 1);
  const targetHp = 400 + minLv * 8;
  const listed = NPC_CAPITAL_SHIPS_FROM_CSV.filter((s) => s.tradePortListed);
  const match = listed
    .slice()
    .sort((a, b) => Math.abs(a.combat.maxHp - targetHp) - Math.abs(b.combat.maxHp - targetHp))[0];
  return match?.id ?? null;
}

export function affinityKindFromHullTierKey(hullTierKey: string): string {
  if (hullTierKey.startsWith('cruiser') || hullTierKey.startsWith('battlecruiser')) return 'heavy';
  if (hullTierKey.startsWith('destroyer')) return 'shielded';
  return 'light';
}

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export type CapitalHullPurchaseCheck = {
  ok: boolean;
  reasonKo?: string;
};

export function checkCapitalHullPurchase(
  hullTierKey: string,
  pilotLevel: number,
  credits: number,
): CapitalHullPurchaseCheck {
  const row = getCapitalHullPurchaseRow(hullTierKey);
  if (!row) return { ok: false, reasonKo: '등록되지 않은 함선 등급입니다.' };

  const requiredLevel = parseNum(row.requiredPilotLevelMin, 1);
  if (pilotLevel < requiredLevel) {
    return { ok: false, reasonKo: `파일럿 Lv.${requiredLevel} 이상 필요합니다.` };
  }

  const price = parseNum(row.purchaseCredits, 0);
  if (price > 0 && credits < price) {
    return { ok: false, reasonKo: `크레딧 ${price.toLocaleString('ko-KR')}이 필요합니다.` };
  }

  return { ok: true };
}
