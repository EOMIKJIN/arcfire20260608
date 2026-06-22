// ============================================================
// 함선 장비(무기 제외) — Table-First attrs → 슬롯·전투 보너스 집계
// ============================================================

import { getItemDef } from '../../data/goods';
import type { PlayerShip, ShipyardEquipSlotId } from '../../types';
import { COMBAT_WEAPON_SLOT_IDS, isEquipSlotFilled } from '../combatWeaponSlots';
import { SHIPYARD_EQUIP_SLOT_DEFS } from '../shipyardEquipSlots';

export const SHIP_EQUIPMENT_NON_WEAPON_SLOT_IDS = SHIPYARD_EQUIP_SLOT_DEFS
  .map((d) => d.id)
  .filter((id) => !(COMBAT_WEAPON_SLOT_IDS as readonly string[]).includes(id));

/** equipmentLineKey → 조선소 슬롯 (1:1, 동일 슬롯은 상호 교체) */
const EQUIPMENT_LINE_TO_SLOT: Record<string, ShipyardEquipSlotId> = {
  eq_prop_ion_booster: 'ENGINE',
  eq_prop_fusion_core: 'SYSTEM',
  eq_prop_vector_thruster: 'EX_01',
  eq_def_molecular_armor: 'ARMOR',
  eq_def_shield_amp: 'EX_02',
  eq_def_ablative_plate: 'ARMOR',
  eq_sens_long_scan: 'EX_03',
  eq_sens_secure_comms: 'EX_04',
  eq_sens_passive_array: 'FIGHTER',
  eq_ew_ecm_jammer: 'EX_01',
  eq_ew_tac_datalink: 'EX_02',
  eq_ew_decoy_launcher: 'EX_03',
  eq_sup_nano_repair: 'EX_04',
  eq_sup_fire_control: 'SYSTEM',
  eq_sup_hull_patch: 'FIGHTER',
  eq_nav_ai_assist: 'SYSTEM',
  eq_nav_tac_processor: 'EX_04',
  eq_nav_jump_calc: 'FIGHTER',
  eq_mining_drone: 'FIGHTER',
};

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

function parseLineKey(attrs: Record<string, unknown>): string {
  const raw = attrs.equipmentLineKey;
  return typeof raw === 'string' ? raw.trim() : '';
}

function isActiveShipEquipmentDef(itemDefId: string): boolean {
  const def = getItemDef(itemDefId);
  if (!def || def.type !== 'ship_equipment') return false;
  const cat = String(def.attrs?.equipmentCategory ?? '').trim().toLowerCase();
  if (cat === 'mining') return false;
  return true;
}

export function isShipEquipmentItemId(itemDefId: string): boolean {
  const id = itemDefId.trim();
  if (!id || id.startsWith('weapon_item_')) return false;
  const def = getItemDef(id);
  return def?.type === 'ship_equipment' && def.kind === 'equipment';
}

export function resolveShipEquipmentSlotForItemDef(itemDefId: string): ShipyardEquipSlotId | null {
  const def = getItemDef(itemDefId);
  if (!def || def.type !== 'ship_equipment') return null;
  const lineKey = parseLineKey(def.attrs ?? {});
  if (lineKey && EQUIPMENT_LINE_TO_SLOT[lineKey]) {
    return EQUIPMENT_LINE_TO_SLOT[lineKey];
  }
  const cat = String(def.attrs?.equipmentCategory ?? '').trim().toLowerCase();
  switch (cat) {
    case 'propulsion':
      return 'ENGINE';
    case 'defense':
      return 'ARMOR';
    case 'sensor':
      return 'EX_03';
    case 'ew':
      return 'EX_01';
    case 'support':
      return 'EX_04';
    case 'navigation':
      return 'SYSTEM';
    case 'mining':
      return 'FIGHTER';
    default:
      return null;
  }
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
      + parsePct(attrs, 'linkStabilityPct') * 0.35
      + parsePct(attrs, 'stealthDetectBonusPct') * 0.5;
    acc.cooldownReductionPct += parsePct(attrs, 'cooldownReductionPct')
      + parsePct(attrs, 'overheatReductionPct') * 0.6
      + parsePct(attrs, 'powerEfficiencyPct') * 0.35;
    acc.evasionBonusPct += parsePct(attrs, 'evasionBonusPct');
    acc.hullRepairPerMinPct += parsePct(attrs, 'hullRepairPerMinPct');
    acc.powerEfficiencyPct += parsePct(attrs, 'powerEfficiencyPct');
    acc.ecmStrengthPct += parsePct(attrs, 'ecmStrengthPct');
    acc.decoyStrengthPct += parsePct(attrs, 'decoyStrengthPct');
    acc.overheatReductionPct += parsePct(attrs, 'overheatReductionPct');
    acc.miningYieldBonusPct += parsePct(attrs, 'miningYieldBonusPct');
  }

  acc.damageReductionPct = Math.min(35, acc.damageReductionPct);
  acc.cooldownReductionPct = Math.min(30, acc.cooldownReductionPct + acc.overheatReductionPct * 0.25);
  acc.detectRangeBonusPct = Math.min(45, acc.detectRangeBonusPct);
  acc.speedBonusPct = Math.min(25, acc.speedBonusPct);
  acc.maneuverBonusPct = Math.min(30, acc.maneuverBonusPct);
  acc.shieldBonusPct = Math.min(40, acc.shieldBonusPct);
  acc.armorBonusPct = Math.min(35, acc.armorBonusPct);

  return acc;
}

/** PlayerShip 기본 스탯 대비 %·flat 보너스 (조선소·HUD) */
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
  const bonusHp = Math.round(baseHp * (b.armorBonusPct * 0.015))
    + Math.round(baseHp * (b.powerEfficiencyPct * 0.008));
  const bonusSpeed = Math.round(baseSpeed * (b.speedBonusPct / 100));

  return { bonusHp, bonusShield, bonusArmor, bonusSpeed };
}

export function resolveShipEquipmentAgentKnobs(
  maxHullHp: number,
  bonuses: ShipEquipmentCombatBonuses,
): ShipEquipmentAgentKnobs {
  const dr = Math.min(0.35, bonuses.damageReductionPct / 100);
  const ecmDecoy = Math.min(0.42, (bonuses.ecmStrengthPct + bonuses.decoyStrengthPct) / 100 * 0.85);
  const regenPerMin = bonuses.hullRepairPerMinPct / 100;
  const hullRegenPerTick = maxHullHp > 0 && regenPerMin > 0
    ? Math.max(0.02, (maxHullHp * regenPerMin) / 60 / 20)
    : 0;

  return {
    acBonus: Math.floor(bonuses.evasionBonusPct / 4),
    incomingDamageMul: Math.max(0.65, 1 - dr),
    hullRegenPerTick,
    missileMissChance: ecmDecoy,
  };
}
