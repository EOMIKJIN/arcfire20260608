// ============================================================
// 발사체 착탄 — impactMode별 피해·FX·특수효과 (무기 id 하드코딩 최소)
// ============================================================

import type { Agent, Missile, MissileHitFx } from '../components/planet/PlanetEdenRaidTestLayer';
import { resolveRocketImpactHitRadiusPx } from '../game/capitalWeaponRegistry';
import {
  isNovaAoeWeapon,
  resolveCapitalWeaponRuntimeSpec,
  type WeaponHitFxKind,
} from './capitalWeaponRuntimeSpec';
import {
  getWeaponSpecialFxPolicy,
  type WeaponSpecialFxPolicy,
} from './weaponSpecialFxPolicy';

export type CapitalImpactPoint = { x: number; y: number };

export type CapitalWeaponImpactContext = {
  owner: Agent | undefined;
  primaryVictim: Agent | undefined;
  impactPoint: CapitalImpactPoint;
  missile: Missile;
  agents: Agent[];
  elapsedMs: number;
  orbitSize: number;
  margin: number;
  rollDamage: (
    owner: Agent,
    victim: Agent,
    weaponType: 'laser' | 'missile' | 'closeRange',
    outcome: 0 | 1 | 2,
  ) => number;
  resolveAttackOutcome: (attacker: Agent, defender: Agent) => 0 | 1 | 2;
  applyIncomingDamage: (
    defender: Agent,
    rawDamage: number,
    attackerAttackBonus: number,
    ignoreShield?: boolean,
    ignoreArmor?: boolean,
    attackerArmorPierce?: number,
  ) => number;
  /** 요격탄용 — 없으면 interceptNearby 무시 */
  missiles?: Missile[];
  applyKnockback: (
    victim: Agent,
    from: CapitalImpactPoint,
    hullDamage: number,
    margin: number,
    orbitSize: number,
  ) => void;
  finalizeDestroyed: (victim: Agent, owner: Agent | undefined, elapsedMs: number) => void;
};

export type CapitalWeaponImpactResult = {
  hitFx: Omit<MissileHitFx, 'id' | 'startMs'> & { startMs: number };
  skipDefaultMissileDamage: boolean;
};

function resolveWeaponDamageSlot(
  weaponId: string,
  ownerCloseRangeId: string,
): 'missile' | 'closeRange' {
  if (ownerCloseRangeId.trim() === weaponId.trim()) return 'closeRange';
  return 'missile';
}

export function resolveCapitalWeaponHitFxKind(weaponId: string): WeaponHitFxKind {
  return resolveCapitalWeaponRuntimeSpec(weaponId)?.hitFxKind ?? 'default';
}

/** 노바 AoE — lockImpactPoint+hitAreaNote 테이블 시그니처 기반 */
export function applyNovaAoeOnImpact(ctx: CapitalWeaponImpactContext): void {
  const { owner, impactPoint, agents, elapsedMs, orbitSize } = ctx;
  if (!owner) return;
  const effectRadius = orbitSize * 0.25;
  const slowMul = 0.5;
  const slowDurationMs = 6000;
  for (const ag of agents) {
    if (!ag.alive) continue;
    if (ag.team === owner.team) continue;
    const dist = Math.hypot(ag.x - impactPoint.x, ag.y - impactPoint.y);
    if (dist > effectRadius) continue;
    ag.speedSlowMul = Math.min(ag.speedSlowMul, slowMul);
    ag.speedSlowUntilMs = Math.max(ag.speedSlowUntilMs, elapsedMs + slowDurationMs);
    const hpDelta = Math.max(1, Math.floor(ag.maxHullHp * 0.3));
    ag.hullHp = Math.max(0, ag.hullHp - hpDelta);
    if (ag.hullHp <= 0) {
      ctx.finalizeDestroyed(ag, owner, elapsedMs);
    }
  }
}

export function applySpecialWeaponStatusOnAgent(
  victim: Agent,
  policy: WeaponSpecialFxPolicy,
  elapsedMs: number,
): void {
  const markMs =
    policy.markMs > 0 ? policy.markMs : policy.empMs > 0 ? policy.empMs : 800;
  if (policy.tintHex) {
    victim.statusTintHex = policy.tintHex;
    victim.statusIconKind = policy.iconKind;
    victim.statusTintUntilMs = Math.max(victim.statusTintUntilMs, elapsedMs + markMs);
  }
  if (policy.stripShield) {
    victim.shieldHp = 0;
  }
  const slowMs = policy.slowMs > 0 ? policy.slowMs : policy.empMs;
  const slowMul = policy.slowMul > 0 ? policy.slowMul : policy.empMs > 0 ? 0.5 : 0;
  if (slowMs > 0 && slowMul > 0 && slowMul < 1) {
    victim.speedSlowMul = Math.min(victim.speedSlowMul, slowMul);
    victim.speedSlowUntilMs = Math.max(victim.speedSlowUntilMs, elapsedMs + slowMs);
  }
}

export type SpecialWeaponAoeArgs = {
  owner: Agent;
  agents: Agent[];
  impactPoint: CapitalImpactPoint;
  elapsedMs: number;
  weaponId: string;
  skipAgentId: number;
  skipInsideRadiusPx?: number;
  damageSlot: 'laser' | 'missile' | 'closeRange';
  applyIncomingDamage: CapitalWeaponImpactContext['applyIncomingDamage'];
  rollDamage: CapitalWeaponImpactContext['rollDamage'];
  resolveAttackOutcome: CapitalWeaponImpactContext['resolveAttackOutcome'];
  finalizeDestroyed: CapitalWeaponImpactContext['finalizeDestroyed'];
};

/** 착탄 반경 아군 선체 소량 회복 — 신규 배열 없음. */
export function applyAllyHealAroundPoint(
  owner: Agent,
  agents: Agent[],
  impactPoint: CapitalImpactPoint,
  radiusPx: number,
  healPct: number,
): void {
  if (healPct <= 0 || radiusPx <= 0) return;
  const pct = Math.min(100, healPct);
  for (let i = 0; i < agents.length; i++) {
    const ag = agents[i]!;
    if (!ag.alive || ag.team !== owner.team) continue;
    if (Math.hypot(ag.x - impactPoint.x, ag.y - impactPoint.y) > radiusPx) continue;
    const heal = Math.max(1, Math.floor((ag.maxHullHp * pct) / 100));
    ag.hullHp = Math.min(ag.maxHullHp, ag.hullHp + heal);
  }
}

/** 정책 aoeRadius 안 적함 — 본타 제외. 틱 신규 배열 없음. */
export function applySpecialWeaponAoeAroundPoint(args: SpecialWeaponAoeArgs): void {
  const policy = getWeaponSpecialFxPolicy(args.weaponId);
  if (!policy || policy.aoeRadiusPx <= 0) return;
  const r = policy.aoeRadiusPx;
  const inner = args.skipInsideRadiusPx ?? 0;
  for (let i = 0; i < args.agents.length; i++) {
    const ag = args.agents[i]!;
    if (!ag.alive || ag.id === args.skipAgentId) continue;
    if (ag.team === args.owner.team) continue;
    const dist = Math.hypot(ag.x - args.impactPoint.x, ag.y - args.impactPoint.y);
    if (dist > r || dist <= inner) continue;
    applySpecialWeaponStatusOnAgent(ag, policy, args.elapsedMs);
    const outcome = args.resolveAttackOutcome(args.owner, ag);
    if (outcome > 0) {
      const raw = Math.max(
        1,
        Math.floor(args.rollDamage(args.owner, ag, args.damageSlot, outcome) * 0.35),
      );
      args.applyIncomingDamage(
        ag,
        raw,
        args.owner.attackBonusStat,
        policy.ignoreShield,
        policy.ignoreArmor,
        args.owner.skillArmorPierce,
      );
    }
    if (ag.hullHp <= 0) {
      args.finalizeDestroyed(ag, args.owner, args.elapsedMs);
    }
  }
}

function applyInterceptNearbyProjectiles(
  ctx: CapitalWeaponImpactContext,
  radiusPx: number,
): void {
  const list = ctx.missiles;
  const owner = ctx.owner;
  if (!list || !owner || radiusPx <= 0) return;
  const ox = ctx.impactPoint.x;
  const oy = ctx.impactPoint.y;
  const selfId = ctx.missile.id;
  const elapsed = ctx.elapsedMs;
  for (let i = 0; i < list.length; i++) {
    const m = list[i]!;
    if (m.hitApplied || m.id === selfId) continue;
    let otherTeam: Agent['team'] | undefined;
    for (let a = 0; a < ctx.agents.length; a++) {
      const ag = ctx.agents[a]!;
      if (ag.id === m.ownerAgentId) {
        otherTeam = ag.team;
        break;
      }
    }
    if (otherTeam === owner.team) continue;
    const t = Math.max(0, Math.min(1, (elapsed - m.startMs) / Math.max(1, m.travelMs)));
    const u = 1 - t;
    const mx = u * u * m.p0.x + 2 * u * t * m.p1.x + t * t * m.p2.x;
    const my = u * u * m.p0.y + 2 * u * t * m.p1.y + t * t * m.p2.y;
    if (Math.hypot(mx - ox, my - oy) > radiusPx) continue;
    m.hitApplied = true;
  }
}

function applySpreadCircleDamage(ctx: CapitalWeaponImpactContext, weaponId: string): void {
  const { owner, impactPoint, agents, elapsedMs, margin, orbitSize } = ctx;
  if (!owner) return;
  /** 피해 판정은 유효(명중) 반경 — 분산 반경보다 작아 미스탄이 자연 발생 */
  const spreadR = resolveRocketImpactHitRadiusPx(weaponId);
  const dmgSlot = resolveWeaponDamageSlot(weaponId, owner.closeRangeWeaponId);
  const policy = getWeaponSpecialFxPolicy(weaponId);
  for (const victim of agents) {
    if (!victim.alive) continue;
    if (Math.hypot(victim.x - impactPoint.x, victim.y - impactPoint.y) > spreadR) continue;
    const outcome = ctx.resolveAttackOutcome(owner, victim);
    if (outcome > 0) {
      const raw = ctx.rollDamage(owner, victim, dmgSlot, outcome);
      const hullDamage = ctx.applyIncomingDamage(
        victim,
        raw,
        owner.attackBonusStat,
        policy?.ignoreShield,
        policy?.ignoreArmor,
        owner.skillArmorPierce,
      );
      ctx.applyKnockback(victim, impactPoint, Math.max(1, hullDamage), margin, orbitSize);
    }
    if (policy) {
      applySpecialWeaponStatusOnAgent(victim, policy, elapsedMs);
    }
    if (victim.hullHp <= 0) {
      ctx.finalizeDestroyed(victim, owner, elapsedMs);
    }
  }
  if (policy && policy.aoeRadiusPx > spreadR) {
    applySpecialWeaponAoeAroundPoint({
      owner,
      agents,
      impactPoint,
      elapsedMs,
      weaponId,
      skipAgentId: -1,
      skipInsideRadiusPx: spreadR,
      damageSlot: dmgSlot,
      applyIncomingDamage: ctx.applyIncomingDamage,
      rollDamage: ctx.rollDamage,
      resolveAttackOutcome: ctx.resolveAttackOutcome,
      finalizeDestroyed: ctx.finalizeDestroyed,
    });
  }
}

/**
 * 착탄 1회 처리 — impactMode 디스패치.
 * @returns FX 메타; skipDefaultMissileDamage=true 이면 호출측 단일표적 루틴 생략
 */
export function resolveCapitalWeaponImpact(
  ctx: CapitalWeaponImpactContext,
): CapitalWeaponImpactResult {
  const weaponId = ctx.missile.missileWeaponId;
  const spec = resolveCapitalWeaponRuntimeSpec(weaponId);
  const impactMode = spec?.impactMode ?? 'target_track';
  const effectKind = resolveCapitalWeaponHitFxKind(weaponId);
  const policy = getWeaponSpecialFxPolicy(weaponId);
  const color = policy?.tintHex || ctx.primaryVictim?.stroke || '#94A3B8';

  const hitFx: CapitalWeaponImpactResult['hitFx'] = {
    x: ctx.impactPoint.x,
    y: ctx.impactPoint.y,
    startMs: ctx.elapsedMs,
    color,
    missileWeaponId: weaponId,
    ownerTeam: ctx.owner?.team,
    effectKind,
  };

  if (impactMode === 'nova_aoe' || isNovaAoeWeapon(weaponId)) {
    applyNovaAoeOnImpact(ctx);
    return { hitFx, skipDefaultMissileDamage: true };
  }

  if (impactMode === 'spread_circle') {
    applySpreadCircleDamage(ctx, weaponId);
    return { hitFx, skipDefaultMissileDamage: true };
  }

  if (policy && ctx.primaryVictim?.alive) {
    applySpecialWeaponStatusOnAgent(ctx.primaryVictim, policy, ctx.elapsedMs);
  }
  if (policy && ctx.owner) {
    applySpecialWeaponAoeAroundPoint({
      owner: ctx.owner,
      agents: ctx.agents,
      impactPoint: ctx.impactPoint,
      elapsedMs: ctx.elapsedMs,
      weaponId,
      skipAgentId: ctx.primaryVictim?.id ?? -1,
      damageSlot: resolveWeaponDamageSlot(weaponId, ctx.owner.closeRangeWeaponId),
      applyIncomingDamage: ctx.applyIncomingDamage,
      rollDamage: ctx.rollDamage,
      resolveAttackOutcome: ctx.resolveAttackOutcome,
      finalizeDestroyed: ctx.finalizeDestroyed,
    });
  }
  if (policy?.interceptNearby) {
    applyInterceptNearbyProjectiles(ctx, policy.aoeRadiusPx > 0 ? policy.aoeRadiusPx : 48);
  }
  if (policy && ctx.owner && policy.allyHealPct > 0) {
    applyAllyHealAroundPoint(
      ctx.owner,
      ctx.agents,
      ctx.impactPoint,
      policy.aoeRadiusPx > 0 ? policy.aoeRadiusPx : 52,
      policy.allyHealPct,
    );
  }

  return { hitFx, skipDefaultMissileDamage: false };
}
