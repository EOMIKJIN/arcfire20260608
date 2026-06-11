/**
 * D&D3 기반 무기 패밀리 TTK 모델 — rebalance 스크립트·런타임 공용 상수.
 * 레이저=기준, 미사일=동급 TTK, 로켓=저효율, 드론/함재기=고효율.
 */

export const DEFAULT_FAMILY_POLICY = {
  laser: { targetDpsVsLaser: 1.0, cycleTimeScale: 1.0, minCooldownMs: 120, maxCooldownMs: 3000 },
  missile: { targetDpsVsLaser: 1.0, cycleTimeScale: 0.48, minCooldownMs: 2400, maxCooldownMs: 7200 },
  rocket: { targetDpsVsLaser: 0.87, cycleTimeScale: 0.55, minCooldownMs: 1800, maxCooldownMs: 6500 },
  drone: { targetDpsVsLaser: 1.12, cycleTimeScale: 0.46, minCooldownMs: 2200, maxCooldownMs: 7000 },
  carrier: { targetDpsVsLaser: 1.12, cycleTimeScale: 0.46, minCooldownMs: 2200, maxCooldownMs: 7000 },
};

export const DEFAULT_COMBAT_REF = {
  diceCount: 1,
  diceSides: 6,
  diceBonus: 0,
  strStat: 10,
  attackBonus: 6,
  defenderAcFlat: 14,
  defenderDexStat: 10,
  defenderSizeClass: 0,
  critNaturalThreshold: 20,
  critDamageBonusStrMul: 2,
  affinityKind: 'light',
  referenceRangeRatio: 0.72,
  travelOverlapFactor: 0.35,
  anchorTierLabel: '기본',
};

function abilityMod(stat) {
  return Math.floor(stat / 2) - 5;
}

export function loadFamilyPolicyFromRows(rows) {
  const out = { ...DEFAULT_FAMILY_POLICY };
  for (const row of rows) {
    const kind = String(row.familyKind ?? '').trim().toLowerCase();
    if (!kind || !out[kind]) continue;
    out[kind] = {
      targetDpsVsLaser: Number(row.targetDpsVsLaser) || out[kind].targetDpsVsLaser,
      cycleTimeScale: Number(row.cycleTimeScale) || out[kind].cycleTimeScale,
      minCooldownMs: Number(row.minCooldownMs) || out[kind].minCooldownMs,
      maxCooldownMs: Number(row.maxCooldownMs) || out[kind].maxCooldownMs,
    };
  }
  return out;
}

export function loadCombatRefFromKvRows(rows) {
  const kv = Object.fromEntries(rows.map((r) => [String(r.key ?? '').trim(), String(r.value ?? '').trim()]));
  const num = (key, fallback) => {
    const n = Number(kv[key]);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    diceCount: num('dice_count', DEFAULT_COMBAT_REF.diceCount),
    diceSides: num('dice_sides', DEFAULT_COMBAT_REF.diceSides),
    diceBonus: num('dice_bonus', DEFAULT_COMBAT_REF.diceBonus),
    strStat: num('str_stat', DEFAULT_COMBAT_REF.strStat),
    attackBonus: num('attack_bonus', DEFAULT_COMBAT_REF.attackBonus),
    defenderAcFlat: num('defender_ac_flat', DEFAULT_COMBAT_REF.defenderAcFlat),
    defenderDexStat: num('defender_dex_stat', DEFAULT_COMBAT_REF.defenderDexStat),
    defenderSizeClass: num('defender_size_class', DEFAULT_COMBAT_REF.defenderSizeClass),
    critNaturalThreshold: num('crit_natural_threshold', DEFAULT_COMBAT_REF.critNaturalThreshold),
    critDamageBonusStrMul: num('crit_damage_bonus_str_mul', DEFAULT_COMBAT_REF.critDamageBonusStrMul),
    affinityKind: kv.affinity_kind || DEFAULT_COMBAT_REF.affinityKind,
    referenceRangeRatio: num('reference_range_ratio', DEFAULT_COMBAT_REF.referenceRangeRatio),
    travelOverlapFactor: num('travel_overlap_factor', DEFAULT_COMBAT_REF.travelOverlapFactor),
    anchorTierLabel: kv.anchor_tier_label || DEFAULT_COMBAT_REF.anchorTierLabel,
  };
}

function hitAndCritRates(ref) {
  const strMod = abilityMod(ref.strStat);
  const dexMod = abilityMod(ref.defenderDexStat);
  const attackTotalBonus = ref.attackBonus + ref.defenderSizeClass + strMod;
  const defenseAc = 10 + ref.defenderSizeClass + dexMod + ref.defenderAcFlat;
  let hit = 0;
  let crit = 0;
  for (let natural = 2; natural <= 20; natural += 1) {
    if (natural >= ref.critNaturalThreshold) {
      crit += 1;
      continue;
    }
    if (natural + attackTotalBonus >= defenseAc) hit += 1;
  }
  const trials = 19;
  return { hitRate: hit / trials, critRate: crit / trials, strMod };
}

function avgDamagePerHit(weaponDamageBonus, ref, rates) {
  const min = ref.diceCount + ref.diceBonus + weaponDamageBonus;
  const max = ref.diceCount * ref.diceSides + ref.diceBonus + weaponDamageBonus;
  const avg = (min + max) / 2;
  const withStr = Math.max(1, avg + rates.strMod);
  const critBase = Math.max(1, withStr + Math.max(1, rates.strMod * ref.critDamageBonusStrMul));
  return withStr * rates.hitRate + critBase * rates.critRate;
}

function laserCycleSec(cooldownMs) {
  return Math.max(0.12, cooldownMs / 1000);
}

function projectileCycleSec(weapon, ref, familyPolicy) {
  const scaledCd = Math.max(
    familyPolicy.minCooldownMs,
    Math.min(familyPolicy.maxCooldownMs, Math.round(weapon.cooldownMs * familyPolicy.cycleTimeScale)),
  );
  const salvo = Math.max(1, weapon.salvoCount || 1);
  const salvoSpanMs = salvo > 1 ? (salvo - 1) * Math.max(0, weapon.salvoIntervalMs || 0) : 0;
  const speed = Math.max(1, weapon.projectileSpeedPxPerSec || 64);
  const rangePx = Math.max(40, weapon.rangePx || 150);
  const travelSec = (rangePx * ref.referenceRangeRatio) / speed;
  const overlap = Math.max(0, Math.min(1, ref.travelOverlapFactor));
  return scaledCd / 1000 + salvoSpanMs / 1000 + travelSec * (1 - overlap);
}

export function computeWeaponRawDps(weapon, familyKind, ref, familyPolicyByKind) {
  const kind = String(familyKind ?? weapon.familyKind ?? 'missile').trim().toLowerCase();
  const policy = familyPolicyByKind[kind] ?? DEFAULT_FAMILY_POLICY.missile;
  const rates = hitAndCritRates(ref);
  const dmgPerHit = avgDamagePerHit(Math.max(1, weapon.damage || 1), ref, rates);
  const salvo = Math.max(1, weapon.salvoCount || 1);
  if (kind === 'laser') {
    const cycle = laserCycleSec(weapon.cooldownMs || 1800);
    return { rawDps: (dmgPerHit * salvo) / cycle, cycleSec: cycle, policy };
  }
  const cycle = projectileCycleSec(weapon, ref, policy);
  return { rawDps: (dmgPerHit * salvo) / cycle, cycleSec: cycle, policy };
}

export function scaledCooldownMs(weapon, familyKind, familyPolicyByKind) {
  const kind = String(familyKind ?? weapon.familyKind ?? 'missile').trim().toLowerCase();
  if (kind === 'laser') return Math.max(120, weapon.cooldownMs || 1800);
  const policy = familyPolicyByKind[kind] ?? DEFAULT_FAMILY_POLICY.missile;
  const raw = Math.max(1, weapon.cooldownMs || 9000);
  if (raw >= policy.minCooldownMs && raw <= policy.maxCooldownMs) {
    return raw;
  }
  return Math.max(
    policy.minCooldownMs,
    Math.min(policy.maxCooldownMs, Math.round(raw * policy.cycleTimeScale)),
  );
}

export function rebalanceWeaponRow(weapon, anchorLaserDps, ref, familyPolicyByKind) {
  const kind = String(weapon.familyKind ?? '').trim().toLowerCase();
  if (!kind || kind === 'laser') {
    return { damage: weapon.damage, cooldownMs: weapon.cooldownMs };
  }
  const policy = familyPolicyByKind[kind] ?? DEFAULT_FAMILY_POLICY.missile;
  const newCooldownMs = scaledCooldownMs(weapon, kind, familyPolicyByKind);
  const targetDps = Math.max(0.5, anchorLaserDps * policy.targetDpsVsLaser);
  const seed = Math.max(1, weapon.damage || 1);
  let bestDamage = seed;
  let bestErr = Number.POSITIVE_INFINITY;
  const searchMin = Math.max(1, seed - 8);
  const searchMax = Math.min(99, seed + 24);
  for (let damage = searchMin; damage <= searchMax; damage += 1) {
    const probe = { ...weapon, damage, cooldownMs: newCooldownMs };
    const { rawDps } = computeWeaponRawDps(probe, kind, ref, familyPolicyByKind);
    const err = Math.abs(rawDps - targetDps);
    if (err < bestErr) {
      bestErr = err;
      bestDamage = damage;
    }
  }
  return { damage: bestDamage, cooldownMs: newCooldownMs };
}
