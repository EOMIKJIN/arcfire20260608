// ============================================================
// 함선 장비 UI — effectPending · 스탯 요약 (Table-First attrs)
// ============================================================

import { getItemDef } from '../../data/goods';
import type { ItemDef } from '../../types';
import { translate } from '../../i18n';
import type { AppLocale } from '../../i18n/types';
import { isShipEquipmentItemId } from './shipEquipmentModel';
import { shipEquipmentPolicy, type ShipEquipmentEffectPolicyKey } from './shipEquipmentEffectPolicy';

const STAT_ATTR_KEYS = [
  'speedBonusPct',
  'maneuverBonusPct',
  'powerEfficiencyPct',
  'armorBonusPct',
  'shieldBonusPct',
  'damageReductionPct',
  'detectRangeBonusPct',
  'linkStabilityPct',
  'stealthDetectBonusPct',
  'ecmStrengthPct',
  'allyBuffPct',
  'decoyStrengthPct',
  'hullRepairPerMinPct',
  'overheatReductionPct',
  'postCombatRepairPct',
  'evasionBonusPct',
  'cooldownReductionPct',
  'routeEfficiencyPct',
  'miningYieldBonusPct',
] as const;

function readEffectPending(attrs: Record<string, unknown> | undefined): boolean {
  if (!attrs) return false;
  return attrs.effectPending === true || attrs.effectPending === 'true';
}

export function isShipEquipmentEffectPending(
  itemDefOrId: ItemDef | string | null | undefined,
): boolean {
  const def = typeof itemDefOrId === 'string'
    ? getItemDef(itemDefOrId)
    : itemDefOrId;
  if (!def || !isShipEquipmentItemId(def.id)) return false;
  return readEffectPending(def.attrs as Record<string, unknown> | undefined);
}

/** 구현 완료 장비 — attrs 기반 스탯 한 줄 요약 */
export function formatShipEquipmentStatSummary(
  itemDefOrId: ItemDef | string,
  locale: AppLocale | 'ko' | 'en' = 'ko',
): string | null {
  const def = typeof itemDefOrId === 'string' ? getItemDef(itemDefOrId) : itemDefOrId;
  if (!def || !isShipEquipmentItemId(def.id)) return null;
  if (isShipEquipmentEffectPending(def)) return null;

  const attrs = def.attrs ?? {};
  const parts: string[] = [];
  for (const key of STAT_ATTR_KEYS) {
    const raw = attrs[key];
    const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? ''));
    if (!Number.isFinite(n) || n <= 0) continue;
    const label = translate(locale, `equip.stat.${key}`);
    parts.push(`${label} +${n}%`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** 효과 키 → 합산 상한 정책 키(ship_equipment_effect_policy.csv) */
const STACK_CAP_BY_ATTR: Partial<Record<(typeof STAT_ATTR_KEYS)[number], ShipEquipmentEffectPolicyKey>> = {
  shieldBonusPct: 'cap_shield_pct',
  armorBonusPct: 'cap_armor_pct',
  damageReductionPct: 'cap_damage_reduction_pct',
  cooldownReductionPct: 'cap_cooldown_reduction_pct',
  overheatReductionPct: 'cap_cooldown_reduction_pct',
  detectRangeBonusPct: 'cap_detect_range_pct',
  linkStabilityPct: 'cap_detect_range_pct',
  stealthDetectBonusPct: 'cap_detect_range_pct',
  speedBonusPct: 'cap_speed_pct',
  maneuverBonusPct: 'cap_maneuver_pct',
};

function readPct(attrs: Record<string, unknown>, key: string): number {
  const raw = attrs[key];
  const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fmtPct(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * 장비 고지 — 실제 적용 효과 + 여러 개 장착 시 합산·상한(대표님 지시 2026-10-10).
 * 「두 개 달면 두 배」로 오해하지 않게: 같은 효과는 합산되지만 상한까지만 적용된다.
 */
export function formatShipEquipmentEffectNotice(
  itemDefOrId: ItemDef | string,
  locale: AppLocale | 'ko' | 'en' = 'ko',
): string | null {
  const def = typeof itemDefOrId === 'string' ? getItemDef(itemDefOrId) : itemDefOrId;
  if (!def || !isShipEquipmentItemId(def.id)) return null;
  if (isShipEquipmentEffectPending(def)) return translate(locale, 'equip.notice.pending');

  const attrs = (def.attrs ?? {}) as Record<string, unknown>;
  const lines: string[] = [];

  // 실제로 함께 오르는 최대 HP(장갑·동력효율 환산)
  const hpPct = readPct(attrs, 'armorBonusPct') * shipEquipmentPolicy('stat_hp_pct_per_armor_pct')
    + readPct(attrs, 'powerEfficiencyPct') * shipEquipmentPolicy('stat_hp_pct_per_power_efficiency_pct');
  if (hpPct > 0) lines.push(translate(locale, 'equip.notice.derivedHp', { pct: fmtPct(hpPct) }));

  const caps: string[] = [];
  const seen = new Set<string>();
  for (const key of STAT_ATTR_KEYS) {
    const capKey = STACK_CAP_BY_ATTR[key];
    if (!capKey || readPct(attrs, key) <= 0 || seen.has(capKey)) continue;
    seen.add(capKey);
    caps.push(translate(locale, 'equip.notice.capItem', {
      stat: translate(locale, `equip.stat.${key}`),
      cap: fmtPct(shipEquipmentPolicy(capKey)),
    }));
  }
  if (readPct(attrs, 'ecmStrengthPct') > 0 || readPct(attrs, 'decoyStrengthPct') > 0) {
    caps.push(translate(locale, 'equip.notice.missileMissCap', {
      cap: fmtPct(shipEquipmentPolicy('knob_missile_miss_max') * 100),
    }));
  }
  lines.push(caps.length > 0
    ? translate(locale, 'equip.notice.stacking', { caps: caps.join(' · ') })
    : translate(locale, 'equip.notice.stackingNoCap'));
  return lines.join('\n');
}

/** 무역·조선소 — 미구현 장비만 [추후 연동] 접미 */
export function formatShipEquipmentListingSuffix(
  itemDefOrId: ItemDef | string,
  pendingSuffix: string,
): string {
  return isShipEquipmentEffectPending(itemDefOrId) ? pendingSuffix : '';
}
