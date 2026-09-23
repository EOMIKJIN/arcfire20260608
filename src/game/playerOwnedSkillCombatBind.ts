// ============================================================
// 플레이어 전투 스킬 — 매치 시작 1회 바인딩 (프레임 루프 금지)
// ============================================================

import { sumOwnedSkillStatBonus } from './ownedSkillStatBonus';

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  if (ownedSkillIds) return ownedSkillIds;
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  return usePlayerStore.getState().player?.skills ?? [];
}

function owns(id: string, owned: readonly string[]): boolean {
  return owned.includes(id);
}

/** 피해 감소 합산 상한. CSV 기존값 변경 없음 */
export const DAMAGE_REDUCTION_STAT_CAP_PCT = 40;
export const SKILL_INCOMING_DAMAGE_MUL_FLOOR = 0.6;
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
    DAMAGE_REDUCTION_STAT_CAP_PCT,
    Math.max(0, sumOwnedSkillStatBonus('damage_reduction', owned)),
  );
  let incomingDamageMul = Math.max(SKILL_INCOMING_DAMAGE_MUL_FLOOR, 1 - dr / 100);
  const critRaw = sumOwnedSkillStatBonus('crit_range', owned);
  const critRange = critRaw > 0 ? Math.min(20, Math.max(2, Math.floor(critRaw))) : 20;
  const shieldPenPct = Math.max(0, Math.min(80, sumOwnedSkillStatBonus('shield_pen', owned)));
  const shieldBoost = Math.max(0, sumOwnedSkillStatBonus('shield_boost', owned));
  const haste = Math.max(0, Math.min(40, sumOwnedSkillStatBonus('weapon_haste', owned)));
  const cdReduce = Math.max(0, Math.min(30, sumOwnedSkillStatBonus('cooldown_reduction', owned)));
  const weaponCooldownMul = Math.max(0.6, 1 - (haste + cdReduce) / 100);
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
  const emergencyWarpHullPct = owns('emergency_warp', owned)
    ? Math.max(1, sumOwnedSkillStatBonus('auto_escape', owned) || 10)
    : 0;
  const fleetRegenPerTurn = Math.max(0, sumOwnedSkillStatBonus('fleet_regen', owned));
  let statMultiplierPct = 0;
  if (owns('tactical_link', owned) && owns('fleet_command', owned) && owns('emergency_warp', owned)) {
    statMultiplierPct = Math.max(0, sumOwnedSkillStatBonus('stat_multiplier', owned));
  }
  if (statMultiplierPct > 0) {
    incomingDamageMul = Math.max(
      SKILL_INCOMING_DAMAGE_MUL_FLOOR,
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
    missileSalvoBonus: owns('double_shot', owned) ? 1 : 0,
    fortressDefensePct,
    regenMissingPct,
    empDrainPct,
    perfectDefense: owns('perfect_defense', owned),
    stealthTurns,
    sneakAttackMul: 1 + sneakPct / 100,
    speedBoostMul: 1 + speedBoostPct / 100,
    blinkRangePx,
    multiLockTargets,
    gravityPull: owns('singularity_cannon', owned),
    wingman: owns('wingman', owned) || sumOwnedSkillStatBonus('wingman_summon', owned) > 0,
    armorBonus,
    partyAttackBonus,
    auraAllyHit: aura > 0 ? 4 : 0,
    auraEnemyHit: aura > 0 ? 4 : 0,
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
