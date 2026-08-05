// ============================================================
// 함선 장비 UI — effectPending · 스탯 요약 (Table-First attrs)
// ============================================================

import { getItemDef } from '../../data/goods';
import type { ItemDef } from '../../types';
import { translate } from '../../i18n';
import type { AppLocale } from '../../i18n/types';
import { isShipEquipmentItemId } from './shipEquipmentModel';

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

/** 무역·조선소 — 미구현 장비만 [추후 연동] 접미 */
export function formatShipEquipmentListingSuffix(
  itemDefOrId: ItemDef | string,
  pendingSuffix: string,
): string {
  return isShipEquipmentEffectPending(itemDefOrId) ? pendingSuffix : '';
}
