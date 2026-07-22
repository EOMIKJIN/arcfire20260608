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
  applyIncomingDamage: (defender: Agent, rawDamage: number, attackerAttackBonus: number) => number;
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

function applySpreadCircleDamage(ctx: CapitalWeaponImpactContext, weaponId: string): void {
  const { owner, impactPoint, agents, elapsedMs, margin, orbitSize } = ctx;
  if (!owner) return;
  /** 피해 판정은 유효(명중) 반경 — 분산 반경보다 작아 미스탄이 자연 발생 */
  const spreadR = resolveRocketImpactHitRadiusPx(weaponId);
  const dmgSlot = resolveWeaponDamageSlot(weaponId, owner.closeRangeWeaponId);
  for (const victim of agents) {
    if (!victim.alive) continue;
    if (Math.hypot(victim.x - impactPoint.x, victim.y - impactPoint.y) > spreadR) continue;
    const outcome = ctx.resolveAttackOutcome(owner, victim);
    if (outcome > 0) {
      const raw = ctx.rollDamage(owner, victim, dmgSlot, outcome);
      const hullDamage = ctx.applyIncomingDamage(victim, raw, owner.attackBonusStat);
      ctx.applyKnockback(victim, impactPoint, Math.max(1, hullDamage), margin, orbitSize);
    }
    if (victim.hullHp <= 0) {
      ctx.finalizeDestroyed(victim, owner, elapsedMs);
    }
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
  const color = ctx.primaryVictim?.stroke ?? '#94A3B8';

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

  return { hitFx, skipDefaultMissileDamage: false };
}
