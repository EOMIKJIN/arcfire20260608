// ============================================================
// 자동전투 스킬 틱 — 숫자 비교·in-place만. 틱당 new/문자열 concat 금지
// ============================================================

import {
  EMPTY_PLAYER_COMBAT_SKILL_BIND,
  type PlayerCombatSkillBind,
  PLAYER_WINGMAN_CAPTAIN_ID,
} from '../game/playerOwnedSkillCombatBind';
import {
  resolveSkillAutoCombatPolicy,
  skillTurnMs,
} from '../game/skillAutoCombatPolicy';
import { SKILL_PROC_LABEL } from '../game/skillProcBanner';

export type AgentSkillAuto = {
  critRange: number;
  shieldPenPct: number;
  weaponCooldownMul: number;
  missileSalvoBonus: number;
  regenMissingPct: number;
  empDrainPct: number;
  fortressDefensePct: number;
  speedBoostMul: number;
  blinkRangePx: number;
  multiLockTargets: number;
  gravityPull: boolean;
  sneakAttackMul: number;
  wingmanOwned: boolean;
  isWingman: boolean;
  perfectDefense: boolean;
  droneDamageMul: number;
  emergencyWarpHullPct: number;
  fleetRegenPerTurn: number;
  stealthTurns: number;
  nextEmpMs: number;
  nextFortressMs: number;
  fortressUntilMs: number;
  nextPerfectMs: number;
  perfectUntilMs: number;
  stealthUntilMs: number;
  nextStealthMs: number;
  nextGravityMs: number;
  gravityUntilMs: number;
  nextBlinkMs: number;
  blinkInvulnUntilMs: number;
  nextRegenMs: number;
  nextSingularityMs: number;
  nextWingmanMs: number;
  wingmanUntilMs: number;
  nextFleetRegenMs: number;
  emergencyUsed: boolean;
  sneakReady: boolean;
  procLabel: string;
  procUntilMs: number;
};

export type AutoCombatAgent = {
  id: number;
  team: 'red' | 'blue' | 'orange';
  captainId: string | null;
  alive: boolean;
  x: number;
  y: number;
  headingRad: number;
  hullHp: number;
  maxHullHp: number;
  shieldHp: number;
  maxShieldHp: number;
  skillAuto: AgentSkillAuto;
};

function writeProc(auto: AgentSkillAuto, elapsedMs: number, label: string, bannerMs: number): void {
  auto.procLabel = label;
  auto.procUntilMs = elapsedMs + bannerMs;
}

function createTimerState(): Pick<
  AgentSkillAuto,
  | 'nextEmpMs'
  | 'nextFortressMs'
  | 'fortressUntilMs'
  | 'nextPerfectMs'
  | 'perfectUntilMs'
  | 'stealthUntilMs'
  | 'nextStealthMs'
  | 'nextGravityMs'
  | 'gravityUntilMs'
  | 'nextBlinkMs'
  | 'blinkInvulnUntilMs'
  | 'nextRegenMs'
  | 'nextSingularityMs'
  | 'nextWingmanMs'
  | 'wingmanUntilMs'
  | 'nextFleetRegenMs'
  | 'emergencyUsed'
  | 'sneakReady'
  | 'procLabel'
  | 'procUntilMs'
> {
  return {
    nextEmpMs: 0,
    nextFortressMs: 0,
    fortressUntilMs: 0,
    nextPerfectMs: 0,
    perfectUntilMs: 0,
    stealthUntilMs: 0,
    nextStealthMs: 0,
    nextGravityMs: 0,
    gravityUntilMs: 0,
    nextBlinkMs: 0,
    blinkInvulnUntilMs: 0,
    nextRegenMs: 0,
    nextSingularityMs: 0,
    nextWingmanMs: 0,
    wingmanUntilMs: 0,
    nextFleetRegenMs: 0,
    emergencyUsed: false,
    sneakReady: false,
    procLabel: '',
    procUntilMs: 0,
  };
}

export function createNpcAgentSkillAuto(): AgentSkillAuto {
  return {
    critRange: 20,
    shieldPenPct: 0,
    weaponCooldownMul: 1,
    missileSalvoBonus: 0,
    regenMissingPct: 0,
    empDrainPct: 0,
    fortressDefensePct: 0,
    speedBoostMul: 1,
    blinkRangePx: 0,
    multiLockTargets: 0,
    gravityPull: false,
    sneakAttackMul: 1,
    wingmanOwned: false,
    isWingman: false,
    perfectDefense: false,
    droneDamageMul: 1,
    emergencyWarpHullPct: 0,
    fleetRegenPerTurn: 0,
    stealthTurns: 0,
    ...createTimerState(),
  };
}

export function createPlayerAgentSkillAuto(bind: PlayerCombatSkillBind): AgentSkillAuto {
  const b = bind ?? EMPTY_PLAYER_COMBAT_SKILL_BIND;
  return {
    critRange: b.critRange,
    shieldPenPct: b.shieldPenPct,
    weaponCooldownMul: b.weaponCooldownMul,
    missileSalvoBonus: b.missileSalvoBonus,
    regenMissingPct: b.regenMissingPct,
    empDrainPct: b.empDrainPct,
    fortressDefensePct: b.fortressDefensePct,
    speedBoostMul: b.speedBoostMul,
    blinkRangePx: b.blinkRangePx,
    multiLockTargets: b.multiLockTargets,
    gravityPull: b.gravityPull,
    sneakAttackMul: b.sneakAttackMul,
    wingmanOwned: b.wingman,
    isWingman: false,
    perfectDefense: b.perfectDefense,
    droneDamageMul: b.droneDamageMul,
    emergencyWarpHullPct: b.emergencyWarpHullPct,
    fleetRegenPerTurn: b.fleetRegenPerTurn,
    stealthTurns: b.stealthTurns,
    ...createTimerState(),
    nextStealthMs: 800,
    nextPerfectMs: 1600,
    nextGravityMs: 2400,
    nextBlinkMs: 1200,
    nextSingularityMs: 2000,
    nextRegenMs: 800,
  };
}

export function createWingmanAgentSkillAuto(): AgentSkillAuto {
  const auto = createNpcAgentSkillAuto();
  auto.isWingman = true;
  return auto;
}

export function isAgentStealthed(ag: AutoCombatAgent, nowMs: number): boolean {
  return ag.alive && ag.skillAuto.stealthUntilMs > nowMs;
}

export function isAgentSkillInvulnerable(ag: AutoCombatAgent, nowMs: number): boolean {
  const a = ag.skillAuto;
  return a.perfectUntilMs > nowMs || a.blinkInvulnUntilMs > nowMs;
}

export function resolveSkillMoveSpeedMult(ag: AutoCombatAgent, nowMs: number, baseMult: number): number {
  const a = ag.skillAuto;
  if (a.fortressUntilMs > nowMs) return 0;
  if (a.gravityUntilMs > nowMs) return baseMult * Math.max(1, a.speedBoostMul);
  return baseMult;
}

export function readSkillProcLabel(ag: AutoCombatAgent, nowMs: number): string {
  if (!ag.skillAuto.procLabel || nowMs >= ag.skillAuto.procUntilMs) return '';
  return ag.skillAuto.procLabel;
}

function nearestLivingEnemy(self: AutoCombatAgent, agents: AutoCombatAgent[]): AutoCombatAgent | null {
  let best: AutoCombatAgent | null = null;
  let bestD = Infinity;
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i]!;
    if (!a.alive || a.team === self.team) continue;
    const d = Math.hypot(a.x - self.x, a.y - self.y);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export type AutoCombatTickResult = {
  emergencyWarpFlee: boolean;
};

const AUTO_TICK_SCRATCH: AutoCombatTickResult = { emergencyWarpFlee: false };

/** 틱이 실제로 일할 스킬이 있을 때만 true. 패시브 수치(crit 등)는 착탄 경로. */
export function playerAutoCombatSkillsNeedTick(auto: AgentSkillAuto): boolean {
  return (
    auto.emergencyWarpHullPct > 0
    || auto.empDrainPct > 0
    || auto.fortressDefensePct > 0
    || auto.perfectDefense
    || auto.stealthTurns > 0
    || auto.speedBoostMul > 1
    || auto.blinkRangePx > 0
    || auto.regenMissingPct > 0
    || auto.gravityPull
    || auto.fleetRegenPerTurn > 0
    || auto.wingmanOwned
  );
}

export function tickPlayerAutoCombatSkills(
  player: AutoCombatAgent,
  agents: AutoCombatAgent[],
  elapsedMs: number,
  clampPos: (x: number, y: number) => { x: number; y: number },
): AutoCombatTickResult {
  const auto = player.skillAuto;
  const policy = resolveSkillAutoCombatPolicy();
  const turnMs = skillTurnMs();
  const bannerMs = policy.procBannerMs;
  AUTO_TICK_SCRATCH.emergencyWarpFlee = false;
  if (!player.alive) return AUTO_TICK_SCRATCH;

  if (
    auto.emergencyWarpHullPct > 0
    && !auto.emergencyUsed
    && player.maxHullHp > 0
    && player.hullHp > 0
    && player.hullHp * 100 < player.maxHullHp * auto.emergencyWarpHullPct
  ) {
    auto.emergencyUsed = true;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.emergency, bannerMs);
    player.alive = false;
    AUTO_TICK_SCRATCH.emergencyWarpFlee = true;
    return AUTO_TICK_SCRATCH;
  }

  if (auto.empDrainPct > 0 && elapsedMs >= auto.nextEmpMs) {
    const foe = nearestLivingEnemy(player, agents);
    if (foe && foe.maxShieldHp > 0) {
      const drain = Math.max(1, Math.floor((foe.maxShieldHp * auto.empDrainPct) / 100));
      foe.shieldHp = Math.max(0, foe.shieldHp - drain);
      writeProc(auto, elapsedMs, SKILL_PROC_LABEL.emp, bannerMs);
      auto.nextEmpMs = elapsedMs + policy.empCooldownTurns * turnMs;
    }
  }

  if (auto.fortressDefensePct > 0 && elapsedMs >= auto.nextFortressMs) {
    const hullPct = player.maxHullHp > 0 ? (player.hullHp * 100) / player.maxHullHp : 100;
    if (hullPct <= policy.fortressAutoHullPct) {
      auto.fortressUntilMs = elapsedMs + policy.fortressDurationTurns * turnMs;
      auto.nextFortressMs = elapsedMs + (policy.fortressDurationTurns + policy.fortressCooldownTurns) * turnMs;
      writeProc(auto, elapsedMs, SKILL_PROC_LABEL.fortress, bannerMs);
    }
  }

  if (auto.perfectDefense && elapsedMs >= auto.nextPerfectMs) {
    auto.perfectUntilMs = elapsedMs + policy.perfectDefenseDurationTurns * turnMs;
    auto.nextPerfectMs = elapsedMs + (policy.perfectDefenseDurationTurns + policy.perfectDefenseCooldownTurns) * turnMs;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.perfect, bannerMs);
  }

  if (auto.stealthTurns > 0 && elapsedMs >= auto.nextStealthMs) {
    auto.stealthUntilMs = elapsedMs + auto.stealthTurns * turnMs;
    auto.nextStealthMs = elapsedMs + (auto.stealthTurns + policy.stealthCooldownTurns) * turnMs;
    auto.sneakReady = auto.sneakAttackMul > 1;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.stealth, bannerMs);
  }

  if (auto.speedBoostMul > 1 && elapsedMs >= auto.nextGravityMs) {
    auto.gravityUntilMs = elapsedMs + policy.gravitySwingDurationTurns * turnMs;
    auto.nextGravityMs = elapsedMs + (policy.gravitySwingDurationTurns + policy.gravitySwingCooldownTurns) * turnMs;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.gravity, bannerMs);
  }

  if (auto.blinkRangePx > 0 && elapsedMs >= auto.nextBlinkMs) {
    const nx = player.x + Math.cos(player.headingRad) * auto.blinkRangePx;
    const ny = player.y + Math.sin(player.headingRad) * auto.blinkRangePx;
    const p = clampPos(nx, ny);
    player.x = p.x;
    player.y = p.y;
    auto.blinkInvulnUntilMs = elapsedMs + policy.blinkInvulnMs;
    auto.nextBlinkMs = elapsedMs + policy.blinkCooldownTurns * turnMs;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.blink, bannerMs);
  }

  if (auto.regenMissingPct > 0 && elapsedMs >= auto.nextRegenMs && player.hullHp < player.maxHullHp) {
    const missing = player.maxHullHp - player.hullHp;
    const heal = Math.max(1, Math.floor((missing * auto.regenMissingPct) / 100));
    player.hullHp = Math.min(player.maxHullHp, player.hullHp + heal);
    auto.nextRegenMs = elapsedMs + policy.hullRegenIntervalTurns * turnMs;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.regen, bannerMs);
  }

  if (auto.gravityPull && elapsedMs >= auto.nextSingularityMs) {
    const pull = policy.singularityPullPx;
    const dmg = policy.singularityDamage;
    for (let i = 0; i < agents.length; i += 1) {
      const a = agents[i]!;
      if (!a.alive || a.team === player.team) continue;
      const dx = player.x - a.x;
      const dy = player.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const step = Math.min(pull, dist);
        const p = clampPos(a.x + (dx / dist) * step, a.y + (dy / dist) * step);
        a.x = p.x;
        a.y = p.y;
      }
      if (dmg > 0) {
        a.hullHp = Math.max(0, a.hullHp - dmg);
      }
    }
    auto.nextSingularityMs = elapsedMs + policy.singularityCooldownTurns * turnMs;
    writeProc(auto, elapsedMs, SKILL_PROC_LABEL.singularity, bannerMs);
  }

  if (auto.fleetRegenPerTurn > 0 && elapsedMs >= auto.nextFleetRegenMs) {
    for (let i = 0; i < agents.length; i += 1) {
      const a = agents[i]!;
      if (!a.alive || a.team !== 'blue' || a.hullHp >= a.maxHullHp) continue;
      a.hullHp = Math.min(a.maxHullHp, a.hullHp + auto.fleetRegenPerTurn);
    }
    auto.nextFleetRegenMs = elapsedMs + turnMs;
  }

  if (auto.wingmanOwned) {
    let wing: AutoCombatAgent | null = null;
    for (let i = 0; i < agents.length; i += 1) {
      if (agents[i]!.captainId === PLAYER_WINGMAN_CAPTAIN_ID) {
        wing = agents[i]!;
        break;
      }
    }
    if (wing) {
      if (wing.alive && elapsedMs >= auto.wingmanUntilMs && auto.wingmanUntilMs > 0) {
        wing.alive = false;
        auto.nextWingmanMs = elapsedMs + policy.wingmanCooldownTurns * turnMs;
      } else if (!wing.alive && elapsedMs >= auto.nextWingmanMs) {
        wing.alive = true;
        wing.hullHp = wing.maxHullHp;
        wing.shieldHp = wing.maxShieldHp;
        auto.wingmanUntilMs = elapsedMs + policy.wingmanDurationTurns * turnMs;
        auto.nextWingmanMs = auto.wingmanUntilMs + policy.wingmanCooldownTurns * turnMs;
        writeProc(auto, elapsedMs, SKILL_PROC_LABEL.wingman, bannerMs);
      }
    }
  }

  return AUTO_TICK_SCRATCH;
}

export function applyMultiLockExtraHits<T extends AutoCombatAgent>(
  owner: T,
  primaryId: number,
  agents: readonly T[],
  applyHit: (target: T) => void,
): void {
  const extra = Math.max(0, owner.skillAuto.multiLockTargets - 1);
  if (extra <= 0) return;
  let applied = 0;
  for (let i = 0; i < agents.length && applied < extra; i += 1) {
    const a = agents[i]!;
    if (!a.alive || a.id === primaryId || a.team === owner.team) continue;
    applyHit(a);
    applied += 1;
  }
}
