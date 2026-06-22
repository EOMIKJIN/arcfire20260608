// ============================================================
// 함선 장비 UI — effectPending · 스탯 요약 (Table-First attrs)
// ============================================================

import { getItemDef } from '../../data/goods';
import type { ItemDef } from '../../types';
import { isShipEquipmentItemId } from './shipEquipmentModel';

const STAT_LABEL_KO: Record<string, string> = {
  speedBonusPct: '속도',
  maneuverBonusPct: '기동',
  powerEfficiencyPct: '동력효율',
  armorBonusPct: '장갑',
  shieldBonusPct: '실드',
  damageReductionPct: '피해감소',
  detectRangeBonusPct: '탐지',
  linkStabilityPct: '링크',
  stealthDetectBonusPct: '은밀탐지',
  ecmStrengthPct: 'ECM',
  allyBuffPct: '아군버프',
  decoyStrengthPct: '미끼',
  hullRepairPerMinPct: '선체수리',
  overheatReductionPct: '과열완화',
  postCombatRepairPct: '전투후수리',
  evasionBonusPct: '회피',
  cooldownReductionPct: '쿨다운',
  routeEfficiencyPct: '항로효율',
  miningYieldBonusPct: '채굴',
};

const STAT_LABEL_EN: Record<string, string> = {
  speedBonusPct: 'Speed',
  maneuverBonusPct: 'Maneuver',
  powerEfficiencyPct: 'Power eff.',
  armorBonusPct: 'Armor',
  shieldBonusPct: 'Shield',
  damageReductionPct: 'DR',
  detectRangeBonusPct: 'Detect',
  linkStabilityPct: 'Link',
  stealthDetectBonusPct: 'Stealth',
  ecmStrengthPct: 'ECM',
  allyBuffPct: 'Ally buff',
  decoyStrengthPct: 'Decoy',
  hullRepairPerMinPct: 'Hull repair',
  overheatReductionPct: 'Overheat',
  postCombatRepairPct: 'Post-combat',
  evasionBonusPct: 'Evasion',
  cooldownReductionPct: 'Cooldown',
  routeEfficiencyPct: 'Route',
  miningYieldBonusPct: 'Mining',
};

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
  locale: 'ko' | 'en' = 'ko',
): string | null {
  const def = typeof itemDefOrId === 'string' ? getItemDef(itemDefOrId) : itemDefOrId;
  if (!def || !isShipEquipmentItemId(def.id)) return null;
  if (isShipEquipmentEffectPending(def)) return null;

  const labels = locale === 'en' ? STAT_LABEL_EN : STAT_LABEL_KO;
  const attrs = def.attrs ?? {};
  const parts: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const raw = attrs[key];
    const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? ''));
    if (!Number.isFinite(n) || n <= 0) continue;
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
