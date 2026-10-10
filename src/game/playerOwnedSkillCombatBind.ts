// ============================================================
// 플레이어 전투 스킬 — 매치 시작 1회 바인딩 (프레임 루프 금지)
// ============================================================

import { ownsSkillWithStat, sumOwnedSkillStatBonus } from './ownedSkillStatBonus';
import { skillCombatPolicyNum as SP, skillCombatPolicyStr } from './skillAutoCombatPolicy';

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  if (ownedSkillIds) return ownedSkillIds;
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  return usePlayerStore.getState().player?.skills ?? [];
}

/** 스킬 보유 판정 — 스킬 id 가 아니라 skills.csv effectStat(Table-First · 2026-10-10) */
function ownsStat(stat: string, owned: readonly string[]): boolean {
  return ownsSkillWithStat(stat, owned);
}

/** 윙맨 에이전트 식별자(엔티티 id — 수치 아님) */
export const PLAYER_WINGMAN_CAPTAIN_ID = 'Player_wingman';

export type PlayerCombatSkillBind = {
  armorPierce: number;
  incomingDamageMul: number;
  critRange: number;
  shieldPenPct: number;
  shieldMaxMul: number;
  weaponCooldownMul: number;
  missileSalvoBonus: number;
  fortressDefensePct: number;
  regenMissingPct: number;
  empDrainPct: number;
  perfectDefense: boolean;
  stealthTurns: number;
  sneakAttackMul: number;
  speedBoostMul: number;
  blinkRangePx: number;
  multiLockTargets: number;
  gravityPull: boolean;
  wingman: boolean;
  armorBonus: number;
  partyAttackBonus: number;
  auraAllyHit: number;
  auraEnemyHit: number;
  droneDamageMul: number;
  emergencyWarpHullPct: number;
  fleetRegenPerTurn: number;
  statMultiplierPct: number;
};

export const EMPTY_PLAYER_COMBAT_SKILL_BIND: PlayerCombatSkillBind = {
  armorPierce: 0,
  incomingDamageMul: 1,
  critRange: 20,
  shieldPenPct: 0,
  shieldMaxMul: 1,
  weaponCooldownMul: 1,
  missileSalvoBonus: 0,
  fortressDefensePct: 0,
  regenMissingPct: 0,
  empDrainPct: 0,
  perfectDefense: false,
  stealthTurns: 0,
  sneakAttackMul: 1,
  speedBoostMul: 1,
  blinkRangePx: 0,
  multiLockTargets: 0,
  gravityPull: false,
  wingman: false,
  armorBonus: 0,
  partyAttackBonus: 0,
  auraAllyHit: 0,
  auraEnemyHit: 0,
  droneDamageMul: 1,
  emergencyWarpHullPct: 0,
  fleetRegenPerTurn: 0,
  statMultiplierPct: 0,
};

export function resolvePlayerCombatSkillBind(
  ownedSkillIds?: readonly string[],
): PlayerCombatSkillBind {
  const owned = readOwnedSkillIds(ownedSkillIds);
  const armorPierce = Math.max(0, sumOwnedSkillStatBonus('armor_pierce', owned));
  const dr = Math.min(
    SP('damage_reduction_cap_pct'),
    Math.max(0, sumOwnedSkillStatBonus('damage_reduction', owned)),
  );
  const incomingFloor = SP('incoming_damage_mul_floor');
  let incomingDamageMul = Math.max(incomingFloor, 1 - dr / 100);
  const critRaw = sumOwnedSkillStatBonus('crit_range', owned);
  // 20 = d20 주사위 최대 눈(규칙 상수)
  const critRange = critRaw > 0 ? Math.min(20, Math.max(SP('crit_range_min'), Math.floor(critRaw))) : 20;
  const shieldPenPct = Math.max(0, Math.min(SP('shield_pen_cap_pct'), sumOwnedSkillStatBonus('shield_pen', owned)));
  const shieldBoost = Math.max(0, sumOwnedSkillStatBonus('shield_boost', owned));
  const haste = Math.max(0, Math.min(SP('weapon_haste_cap_pct'), sumOwnedSkillStatBonus('weapon_haste', owned)));
  const cdReduce = Math.max(0, Math.min(SP('cooldown_reduction_cap_pct'), sumOwnedSkillStatBonus('cooldown_reduction', owned)));
  const weaponCooldownMul = Math.max(SP('weapon_cooldown_mul_floor'), 1 - (haste + cdReduce) / 100);
  const fortressDefensePct = Math.max(0, sumOwnedSkillStatBonus('defense_boost', owned));
  const regenMissingPct = Math.max(0, sumOwnedSkillStatBonus('regen_rate', owned));
  const empDrainPct = Math.max(0, sumOwnedSkillStatBonus('emp_shield_drain', owned));
  const stealthTurns = Math.max(0, sumOwnedSkillStatBonus('stealth_duration_turns', owned));
  const sneakPct = Math.max(0, sumOwnedSkillStatBonus('sneak_attack', owned));
  const speedBoostPct = Math.max(0, sumOwnedSkillStatBonus('speed_boost', owned));
  const blinkRangePx = Math.max(0, sumOwnedSkillStatBonus('teleport_range', owned));
  const multiLockTargets = Math.max(0, Math.floor(sumOwnedSkillStatBonus('target_count', owned)));
  const armorBonus = Math.max(0, sumOwnedSkillStatBonus('armor_bonus', owned));
  const partyAttackBonus = Math.max(0, sumOwnedSkillStatBonus('party_attack_bonus', owned));
  const aura = Math.max(0, sumOwnedSkillStatBonus('aura_effect', owned));
  const dronePct = Math.max(0, sumOwnedSkillStatBonus('drone_damage', owned));
  const emergencyWarpHullPct = ownsStat('auto_escape', owned)
    ? Math.max(1, sumOwnedSkillStatBonus('auto_escape', owned))
    : 0;
  const fleetRegenPerTurn = Math.max(0, sumOwnedSkillStatBonus('fleet_regen', owned));
  let statMultiplierPct = 0;
  // 전술 링크 — 함께 보유해야 하는 효과 스탯은 skill_auto_combat_policy.csv stat_multiplier_requires_stats
  const statMulRequires = skillCombatPolicyStr('stat_multiplier_requires_stats').split('|').map((s) => s.trim()).filter(Boolean);
  if (ownsStat('stat_multiplier', owned) && statMulRequires.every((s) => ownsStat(s, owned))) {
    statMultiplierPct = Math.max(0, sumOwnedSkillStatBonus('stat_multiplier', owned));
  }
  if (statMultiplierPct > 0) {
    incomingDamageMul = Math.max(
      incomingFloor,
      incomingDamageMul * (1 - statMultiplierPct / 100),
    );
  }
  return {
    armorPierce,
    incomingDamageMul,
    critRange,
    shieldPenPct,
    shieldMaxMul: 1 + shieldBoost / 100,
    weaponCooldownMul,
    missileSalvoBonus: ownsStat('weapon_haste', owned) ? SP('weapon_haste_missile_salvo_bonus') : 0,
    fortressDefensePct,
    regenMissingPct,
    empDrainPct,
    perfectDefense: ownsStat('invincibility', owned),
    stealthTurns,
    sneakAttackMul: 1 + sneakPct / 100,
    speedBoostMul: 1 + speedBoostPct / 100,
    blinkRangePx,
    multiLockTargets,
    gravityPull: ownsStat('gravity_pull', owned),
    wingman: ownsStat('wingman_summon', owned),
    armorBonus,
    partyAttackBonus,
    auraAllyHit: aura > 0 ? SP('aura_ally_hit_bonus') : 0,
    auraEnemyHit: aura > 0 ? SP('aura_enemy_hit_penalty') : 0,
    droneDamageMul: 1 + dronePct / 100,
    emergencyWarpHullPct,
    fleetRegenPerTurn,
    statMultiplierPct,
  };
}

/** 방어자 장갑 스탯에서 공격자 관통을 뺀 유효 장갑 */
export function applySkillArmorPierceToArmorStat(armorStat: number, armorPierce: number): number {
  const armor = Number.isFinite(armorStat) ? armorStat : 0;
  const pierce = Number.isFinite(armorPierce) ? Math.max(0, armorPierce) : 0;
  return Math.max(0, armor - pierce);
}

export function isPlayerWingmanAgent(captainId: string | null | undefined): boolean {
  return captainId === PLAYER_WINGMAN_CAPTAIN_ID;
}
