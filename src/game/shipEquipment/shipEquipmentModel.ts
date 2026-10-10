// ============================================================
// 함선 장비(무기 제외) — Table-First attrs → 슬롯·전투 보너스 집계
// ============================================================

import { getItemDef } from '../../data/goods';
import type { PlayerShip, ShipyardEquipSlotId } from '../../types';
import { COMBAT_WEAPON_SLOT_IDS, isEquipSlotFilled } from '../combatWeaponSlots';
import { SHIPYARD_EQUIP_SLOT_DEFS } from '../shipyardEquipSlots';
import { shipEquipmentPolicy as P } from './shipEquipmentEffectPolicy';

export const SHIP_EQUIPMENT_NON_WEAPON_SLOT_IDS = SHIPYARD_EQUIP_SLOT_DEFS
  .map((d) => d.id)
  .filter((id) => !(COMBAT_WEAPON_SLOT_IDS as readonly string[]).includes(id));

export type ShipEquipmentCombatBonuses = {
  /** maxShield % 가산 (합산 후 cap) */
  shieldBonusPct: number;
  /** armor % → armor·maxHp 소량 */
  armorBonusPct: number;
  /** 피해 % 감소 (합산 cap 35%) */
  damageReductionPct: number;
  speedBonusPct: number;
  maneuverBonusPct: number;
  detectRangeBonusPct: number;
  cooldownReductionPct: number;
  evasionBonusPct: number;
  hullRepairPerMinPct: number;
  powerEfficiencyPct: number;
  ecmStrengthPct: number;
  decoyStrengthPct: number;
  overheatReductionPct: number;
  /** 채굴 전용 — 전투 v1 미적용 */
  miningYieldBonusPct: number;
};

export type ShipEquipmentFlatStatBonus = {
  bonusHp: number;
  bonusShield: number;
  bonusArmor: number;
  bonusSpeed: number;
};

export type ShipEquipmentAgentKnobs = {
  acBonus: number;
  incomingDamageMul: number;
  hullRegenPerTick: number;
  missileMissChance: number;
};

const EMPTY_BONUSES: ShipEquipmentCombatBonuses = {
  shieldBonusPct: 0,
  armorBonusPct: 0,
  damageReductionPct: 0,
  speedBonusPct: 0,
  maneuverBonusPct: 0,
  detectRangeBonusPct: 0,
  cooldownReductionPct: 0,
  evasionBonusPct: 0,
  hullRepairPerMinPct: 0,
  powerEfficiencyPct: 0,
  ecmStrengthPct: 0,
  decoyStrengthPct: 0,
  overheatReductionPct: 0,
  miningYieldBonusPct: 0,
};

function parsePct(attrs: Record<string, unknown>, key: string): number {
  const raw = attrs[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, raw);
  if (typeof raw === 'string') {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return 0;
}

const SHIP_EQUIPMENT_SLOT_IDS = new Set<string>(SHIP_EQUIPMENT_NON_WEAPON_SLOT_IDS);

function readEffectPending(attrs: Record<string, unknown> | undefined): boolean {
  return attrs?.effectPending === true || attrs?.effectPending === 'true';
}

/** 효과가 구현된 장비만 집계 — item_defs attrs.effectPending=true(미구현)는 제외 */
function isActiveShipEquipmentDef(itemDefId: string): boolean {
  const def = getItemDef(itemDefId);
  if (!def || def.type !== 'ship_equipment') return false;
  return !readEffectPending(def.attrs as Record<string, unknown> | undefined);
}

export function isShipEquipmentItemId(itemDefId: string): boolean {
  const id = itemDefId.trim();
  if (!id || id.startsWith('weapon_item_')) return false;
  const def = getItemDef(id);
  return def?.type === 'ship_equipment' && def.kind === 'equipment';
}

/** 장착 칸 — item_defs.csv attrsJson `equipmentSlot`(Table-First · 2026-10-10). 없거나 잘못되면 장착 불가(null) */
export function resolveShipEquipmentSlotForItemDef(itemDefId: string): ShipyardEquipSlotId | null {
  const def = getItemDef(itemDefId);
  if (!def || def.type !== 'ship_equipment') return null;
  const raw = def.attrs?.equipmentSlot;
  const slot = typeof raw === 'string' ? raw.trim() : '';
  return SHIP_EQUIPMENT_SLOT_IDS.has(slot) ? (slot as ShipyardEquipSlotId) : null;
}

export function listEquippedShipEquipmentItemIds(
  equipSlots: PlayerShip['equipSlots'] | undefined,
): string[] {
  if (!equipSlots) return [];
  const out: string[] = [];
  for (const slotId of SHIP_EQUIPMENT_NON_WEAPON_SLOT_IDS) {
    const itemDefId = equipSlots[slotId]?.itemDefId?.trim();
    if (!itemDefId || !isEquipSlotFilled(equipSlots[slotId])) continue;
    if (!isShipEquipmentItemId(itemDefId)) continue;
    if (!isActiveShipEquipmentDef(itemDefId)) continue;
    out.push(itemDefId);
  }
  return out;
}

export function aggregateShipEquipmentBonuses(
  equipSlots: PlayerShip['equipSlots'] | undefined,
): ShipEquipmentCombatBonuses {
  const itemIds = listEquippedShipEquipmentItemIds(equipSlots);
  if (itemIds.length === 0) return { ...EMPTY_BONUSES };

  const acc = { ...EMPTY_BONUSES };
  for (const itemDefId of itemIds) {
    const def = getItemDef(itemDefId);
    if (!def?.attrs) continue;
    const attrs = def.attrs;
    acc.shieldBonusPct += parsePct(attrs, 'shieldBonusPct');
    acc.armorBonusPct += parsePct(attrs, 'armorBonusPct');
    acc.damageReductionPct += parsePct(attrs, 'damageReductionPct');
    acc.speedBonusPct += parsePct(attrs, 'speedBonusPct');
    acc.maneuverBonusPct += parsePct(attrs, 'maneuverBonusPct');
    acc.detectRangeBonusPct += parsePct(attrs, 'detectRangeBonusPct')
      + parsePct(attrs, 'linkStabilityPct') * P('conv_detect_per_link_stability')
      + parsePct(attrs, 'stealthDetectBonusPct') * P('conv_detect_per_stealth_detect');
    acc.cooldownReductionPct += parsePct(attrs, 'cooldownReductionPct')
      + parsePct(attrs, 'overheatReductionPct') * P('conv_cooldown_per_overheat')
      + parsePct(attrs, 'powerEfficiencyPct') * P('conv_cooldown_per_power_efficiency');
    acc.evasionBonusPct += parsePct(attrs, 'evasionBonusPct');
    acc.hullRepairPerMinPct += parsePct(attrs, 'hullRepairPerMinPct');
    acc.powerEfficiencyPct += parsePct(attrs, 'powerEfficiencyPct');
    acc.ecmStrengthPct += parsePct(attrs, 'ecmStrengthPct');
    acc.decoyStrengthPct += parsePct(attrs, 'decoyStrengthPct');
    acc.overheatReductionPct += parsePct(attrs, 'overheatReductionPct');
    acc.miningYieldBonusPct += parsePct(attrs, 'miningYieldBonusPct');
  }

  // 같은 효과 장비 여러 개 = 합산 후 상한(ship_equipment_effect_policy.csv cap_*)
  acc.damageReductionPct = Math.min(P('cap_damage_reduction_pct'), acc.damageReductionPct);
  acc.cooldownReductionPct = Math.min(
    P('cap_cooldown_reduction_pct'),
    acc.cooldownReductionPct + acc.overheatReductionPct * P('conv_cooldown_per_overheat_post_sum'),
  );
  acc.detectRangeBonusPct = Math.min(P('cap_detect_range_pct'), acc.detectRangeBonusPct);
  acc.speedBonusPct = Math.min(P('cap_speed_pct'), acc.speedBonusPct);
  acc.maneuverBonusPct = Math.min(P('cap_maneuver_pct'), acc.maneuverBonusPct);
  acc.shieldBonusPct = Math.min(P('cap_shield_pct'), acc.shieldBonusPct);
  acc.armorBonusPct = Math.min(P('cap_armor_pct'), acc.armorBonusPct);

  return acc;
}

/**
 * 장비 스탯 보너스(HP·실드·장갑·속도) — **유일한 적용식**(2026-10-10 이중 적용 정리).
 * 플레이어: shipStatPipeline 이 선체 기준으로 1회 더한다(조선소 표시 = 전투). NPC·트윈: applyShipEquipmentStatBonusToCombat.
 */
export function resolveShipEquipmentFlatStatBonus(
  baseShip: PlayerShip,
  equipSlots: PlayerShip['equipSlots'] | undefined,
): ShipEquipmentFlatStatBonus {
  const b = aggregateShipEquipmentBonuses(equipSlots);
  const baseHp = Math.max(1, baseShip.maxHp);
  const baseShield = Math.max(0, baseShip.maxShield);
  const baseArmor = Math.max(0, baseShip.armor);
  const baseSpeed = Math.max(0, baseShip.speed);

  const bonusShield = Math.round(baseShield * (b.shieldBonusPct / 100));
  const bonusArmor = Math.round(baseArmor * (b.armorBonusPct / 100));
  const bonusHp = Math.round(baseHp * (b.armorBonusPct * P('stat_hp_pct_per_armor_pct') / 100))
    + Math.round(baseHp * (b.powerEfficiencyPct * P('stat_hp_pct_per_power_efficiency_pct') / 100));
  const bonusSpeed = Math.round(baseSpeed * (b.speedBonusPct / 100));

  return { bonusHp, bonusShield, bonusArmor, bonusSpeed };
}

export function resolveShipEquipmentAgentKnobs(
  maxHullHp: number,
  bonuses: ShipEquipmentCombatBonuses,
): ShipEquipmentAgentKnobs {
  const dr = Math.min(P('cap_damage_reduction_pct'), bonuses.damageReductionPct) / 100;
  const ecmDecoy = Math.min(
    P('knob_missile_miss_max'),
    (bonuses.ecmStrengthPct + bonuses.decoyStrengthPct) / 100 * P('knob_missile_miss_per_pct'),
  );
  const regenPerMin = bonuses.hullRepairPerMinPct / 100;
  const hullRegenPerTick = maxHullHp > 0 && regenPerMin > 0
    ? Math.max(P('knob_hull_regen_min_per_tick'), (maxHullHp * regenPerMin) / 60 / P('knob_hull_regen_ticks_per_sec'))
    : 0;

  return {
    acBonus: Math.floor(bonuses.evasionBonusPct / P('knob_evasion_pct_per_ac')),
    incomingDamageMul: Math.max(P('knob_incoming_damage_mul_floor'), 1 - dr),
    hullRegenPerTick,
    missileMissChance: ecmDecoy,
  };
}

/** NPC·플레이봇 트윈 — 선체 전투 스탯에 장비 스탯 보너스를 1회 더한다(플레이어 shipStatPipeline 과 같은 식·같은 순서: 숙련 전). */
export function applyShipEquipmentStatBonusToCombat<T extends { maxHp: number; maxShield: number; armor: number }>(
  combat: T,
  equipSlots: PlayerShip['equipSlots'] | undefined,
): T {
  const flat = resolveShipEquipmentFlatStatBonus(
    { maxHp: combat.maxHp, maxShield: combat.maxShield, armor: combat.armor, speed: 0 } as PlayerShip,
    equipSlots,
  );
  if (flat.bonusHp === 0 && flat.bonusShield === 0 && flat.bonusArmor === 0) return combat;
  return {
    ...combat,
    maxHp: Math.max(1, combat.maxHp + flat.bonusHp),
    maxShield: Math.max(0, combat.maxShield + flat.bonusShield),
    armor: Math.max(0, combat.armor + flat.bonusArmor),
  };
}