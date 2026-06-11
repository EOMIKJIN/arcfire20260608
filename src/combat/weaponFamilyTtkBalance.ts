// ============================================================
// weapon_family_ttk_balance_policy + weapon_combat_reference_policy
// D&D3 기반 패밀리 TTK — 레이저 기준, 미사일 동급, 로켓 저효율, 드론/함재기 고효율
// ============================================================

import { WeaponCombatReferencePolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { CapitalWeaponCsvRow } from '../data/generated';
import { blendSingleTargetDpsWithAoePricing } from './weaponSpecialCombatBalance';

const combatRefKv = new Map<string, string>(
  WeaponCombatReferencePolicy_FROM_BALANCE_CSV.map((row) => [String(row.key), String(row.value)]),
);

function refNum(key: string, fallback: number): number {
  const n = Number(combatRefKv.get(key));
  return Number.isFinite(n) ? n : fallback;
}

function abilityMod(stat: number): number {
  return Math.floor(stat / 2) - 5;
}

function hitAndCritRates() {
  const strStat = refNum('str_stat', 10);
  const strMod = abilityMod(strStat);
  const dexMod = abilityMod(refNum('defender_dex_stat', 10));
  const attackBonus = refNum('attack_bonus', 6);
  const defenderSize = refNum('defender_size_class', 0);
  const defenderAcFlat = refNum('defender_ac_flat', 14);
  const critThreshold = refNum('crit_natural_threshold', 20);
  const attackTotalBonus = attackBonus + defenderSize + strMod;
  const defenseAc = 10 + defenderSize + dexMod + defenderAcFlat;
  let hit = 0;
  let crit = 0;
  for (let natural = 2; natural <= 20; natural += 1) {
    if (natural >= critThreshold) {
      crit += 1;
      continue;
    }
    if (natural + attackTotalBonus >= defenseAc) hit += 1;
  }
  return { hitRate: hit / 19, critRate: crit / 19, strMod };
}

function projectileCycleSec(
  weapon: Pick<
    CapitalWeaponCsvRow,
    'cooldownMs' | 'rangePx' | 'salvoCount' | 'salvoIntervalMs' | 'projectileSpeedPxPerSec'
  >,
): number {
  const salvo = Math.max(1, weapon.salvoCount);
  const salvoSpanMs = salvo > 1 ? (salvo - 1) * Math.max(0, weapon.salvoIntervalMs) : 0;
  const speed = Math.max(1, weapon.projectileSpeedPxPerSec);
  const rangePx = Math.max(40, weapon.rangePx);
  const travelOverlap = Math.max(0, Math.min(1, refNum('travel_overlap_factor', 0.35)));
  const travelSec = (rangePx * refNum('reference_range_ratio', 0.72)) / speed;
  return Math.max(0.12, weapon.cooldownMs) / 1000 + salvoSpanMs / 1000 + travelSec * (1 - travelOverlap);
}

/** 가격·밸런스 감사용 — D&D3 기대 DPS(레이저=즉시, 발사체=비행·살보 반영) */
export function computeWeaponEffectiveCombatDps(
  weapon: CapitalWeaponCsvRow,
): number {
  const diceCount = refNum('dice_count', 1);
  const diceSides = refNum('dice_sides', 6);
  const diceBonus = refNum('dice_bonus', 0);
  const rates = hitAndCritRates();
  const min = diceCount + diceBonus + Math.max(1, weapon.damage);
  const max = diceCount * diceSides + diceBonus + Math.max(1, weapon.damage);
  const avg = (min + max) / 2;
  const withStr = Math.max(1, avg + rates.strMod);
  const critMul = refNum('crit_damage_bonus_str_mul', 2);
  const critBase = Math.max(1, withStr + Math.max(1, rates.strMod * critMul));
  const dmgPerHit = withStr * rates.hitRate + critBase * rates.critRate;
  const salvo = Math.max(1, weapon.salvoCount);
  const kind = weapon.familyKind.trim().toLowerCase();
  const cycleSec =
    kind === 'laser'
      ? Math.max(0.12, weapon.cooldownMs / 1000)
      : projectileCycleSec(weapon);
  const singleTargetDps = (dmgPerHit * salvo) / cycleSec;
  return blendSingleTargetDpsWithAoePricing(
    weapon,
    singleTargetDps,
    refNum('hull_hp_reference', 300),
    cycleSec,
  );
}
