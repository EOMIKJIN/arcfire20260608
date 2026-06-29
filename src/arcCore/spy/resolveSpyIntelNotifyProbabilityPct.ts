// ============================================================
// 스파이 정보원 알림 확률 — 정책 + 스킬·과학 연구소 가산
// ============================================================

import { resolvePlanetCounterIntelBonuses } from '../../game/resolvePlanetCounterIntelBonuses';
import { resolvePlayerOwnedSkillStatBonus } from '../../game/playerOwnedSkillStatBonus';
import { resolveArcCoreSpyPolicy } from './arcCoreSpyPolicy';

/** @deprecated — `resolvePlanetCounterIntelBonuses` / `resolvePlayerOwnedSkillStatBonus` 사용 */
export function resolveSpyDetectionSkillBonusPct(planetId?: string): number {
  if (planetId?.trim()) {
    return resolvePlanetCounterIntelBonuses(planetId).spyDetectBonusPct;
  }
  return resolvePlayerOwnedSkillStatBonus('spy_detect');
}

/** 활동 시작 시 정보원 알림 롤 기준 확률(0~100) */
export function resolveSpyIntelNotifyProbabilityPct(planetId?: string): number {
  const policy = resolveArcCoreSpyPolicy();
  const detectBonus = planetId?.trim()
    ? resolvePlanetCounterIntelBonuses(planetId).spyDetectBonusPct
    : resolvePlayerOwnedSkillStatBonus('spy_detect');
  return Math.max(0, Math.min(100, policy.spyIntelNotifyPct + detectBonus));
}

/** 결정론적 시드 — planetId + spyCaptainId 기준 (틱마다 재롤 방지) */
export function rollSpyIntelNotifyPass(planetId: string, spyCaptainId: string, notifyPct: number): boolean {
  if (notifyPct >= 100) return true;
  if (notifyPct <= 0) return false;
  let hash = 2166136261;
  const seed = `${planetId}:${spyCaptainId}:spy_intel_notify`;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const roll = (hash >>> 0) % 100;
  return roll < notifyPct;
}
