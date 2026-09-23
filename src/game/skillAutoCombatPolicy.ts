// ============================================================
// skill_auto_combat_policy.csv — 자동전투 턴·쿨·배너
// ============================================================

import { SkillAutoCombatPolicy_FROM_BALANCE_CSV } from '../data/balance/generated/csvSkillAutoCombatPolicy';

export type SkillAutoCombatPolicy = {
  turnSec: number;
  procBannerMs: number;
  empCooldownTurns: number;
  fortressDurationTurns: number;
  fortressCooldownTurns: number;
  fortressAutoHullPct: number;
  repairDroneHubIntervalMs: number;
  perfectDefenseDurationTurns: number;
  perfectDefenseCooldownTurns: number;
  stealthDurationTurns: number;
  stealthCooldownTurns: number;
  gravitySwingDurationTurns: number;
  gravitySwingCooldownTurns: number;
  blinkCooldownTurns: number;
  blinkInvulnMs: number;
  hullRegenIntervalTurns: number;
  singularityCooldownTurns: number;
  singularityPullPx: number;
  singularityDamage: number;
  wingmanDurationTurns: number;
  wingmanCooldownTurns: number;
  wingmanHullMul: number;
  emergencyWarpHullPct: number;
  smugglerBaseDetectPct: number;
  bulkQtyThreshold: number;
  cargoSlotBonusCap: number;
  hangarBase: number;
  hangarSlotBonusCap: number;
  scanDurationReduceCapPct: number;
  jumpSpeedPostcapFuel: number;
  wormholeFinderPostcapPct: number;
  starPathfinderUnchartedPct: number;
  wormholeGeneratorSkipHops: number;
  monopolyBuyPct: number;
  contrabandDetectConfiscate: boolean;
};

function num(raw: string | undefined, fallback: number): number {
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
}

let cached: SkillAutoCombatPolicy | null = null;

export function resolveSkillAutoCombatPolicy(): SkillAutoCombatPolicy {
  if (cached) return cached;
  const kv = new Map<string, string>();
  const rows = SkillAutoCombatPolicy_FROM_BALANCE_CSV;
  for (let i = 0; i < rows.length; i += 1) {
    kv.set(rows[i]!.key, rows[i]!.value);
  }
  cached = {
    turnSec: Math.max(1, num(kv.get('turn_sec'), 8)),
    procBannerMs: Math.max(200, num(kv.get('proc_banner_ms'), 1600)),
    empCooldownTurns: Math.max(1, num(kv.get('emp_cooldown_turns'), 4)),
    fortressDurationTurns: Math.max(1, num(kv.get('fortress_duration_turns'), 1)),
    fortressCooldownTurns: Math.max(1, num(kv.get('fortress_cooldown_turns'), 3)),
    fortressAutoHullPct: Math.max(1, Math.min(100, num(kv.get('fortress_auto_hull_pct'), 30))),
    repairDroneHubIntervalMs: Math.max(1000, num(kv.get('repair_drone_hub_interval_ms'), 60_000)),
    perfectDefenseDurationTurns: Math.max(1, num(kv.get('perfect_defense_duration_turns'), 1)),
    perfectDefenseCooldownTurns: Math.max(1, num(kv.get('perfect_defense_cooldown_turns'), 4)),
    stealthDurationTurns: Math.max(1, num(kv.get('stealth_duration_turns'), 3)),
    stealthCooldownTurns: Math.max(1, num(kv.get('stealth_cooldown_turns'), 4)),
    gravitySwingDurationTurns: Math.max(1, num(kv.get('gravity_swing_duration_turns'), 1)),
    gravitySwingCooldownTurns: Math.max(1, num(kv.get('gravity_swing_cooldown_turns'), 3)),
    blinkCooldownTurns: Math.max(1, num(kv.get('blink_cooldown_turns'), 2)),
    blinkInvulnMs: Math.max(0, num(kv.get('blink_invuln_ms'), 500)),
    hullRegenIntervalTurns: Math.max(1, num(kv.get('hull_regen_interval_turns'), 1)),
    singularityCooldownTurns: Math.max(1, num(kv.get('singularity_cooldown_turns'), 5)),
    singularityPullPx: Math.max(0, num(kv.get('singularity_pull_px'), 80)),
    singularityDamage: Math.max(0, num(kv.get('singularity_damage'), 12)),
    wingmanDurationTurns: Math.max(1, num(kv.get('wingman_duration_turns'), 3)),
    wingmanCooldownTurns: Math.max(1, num(kv.get('wingman_cooldown_turns'), 4)),
    wingmanHullMul: Math.max(0.2, Math.min(1, num(kv.get('wingman_hull_mul'), 0.7))),
    emergencyWarpHullPct: Math.max(1, Math.min(50, num(kv.get('emergency_warp_hull_pct'), 10))),
    smugglerBaseDetectPct: Math.max(0, Math.min(100, num(kv.get('smuggler_base_detect_pct'), 20))),
    bulkQtyThreshold: Math.max(1, num(kv.get('bulk_qty_threshold'), 10)),
    cargoSlotBonusCap: Math.max(0, num(kv.get('cargo_slot_bonus_cap'), 20)),
    hangarBase: Math.max(1, num(kv.get('hangar_base'), 30)),
    hangarSlotBonusCap: Math.max(0, num(kv.get('hangar_slot_bonus_cap'), 8)),
    scanDurationReduceCapPct: Math.max(0, Math.min(80, num(kv.get('scan_duration_reduce_cap_pct'), 40))),
    jumpSpeedPostcapFuel: num(kv.get('jump_speed_postcap_fuel'), 1) > 0 ? 1 : 0,
    wormholeFinderPostcapPct: Math.max(0, num(kv.get('wormhole_finder_postcap_pct'), 15)),
    starPathfinderUnchartedPct: Math.max(0, num(kv.get('star_pathfinder_uncharted_pct'), 15)),
    wormholeGeneratorSkipHops: Math.max(0, num(kv.get('wormhole_generator_skip_hops'), 1)),
    monopolyBuyPct: Math.max(0, Math.min(80, num(kv.get('monopoly_buy_pct'), 30))),
    contrabandDetectConfiscate: num(kv.get('contraband_detect_confiscate'), 1) > 0,
  };
  return cached;
}

export function skillTurnMs(): number {
  return resolveSkillAutoCombatPolicy().turnSec * 1000;
}

export function invalidateSkillAutoCombatPolicyCache(): void {
  cached = null;
}
