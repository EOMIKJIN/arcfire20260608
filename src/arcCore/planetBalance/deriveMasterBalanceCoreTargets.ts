// ============================================================
// 마스터 사양서 §4 — zoneIndex 행 → 핵심 5지표 목표(R,P,D,T,E)
// 정본 수치는 CSV; 본 모듈은 planetCoreRuntimeStore 런타임 당김용 목표만 산출
// ============================================================

import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import type { PlanetMasterBalanceDetail } from '../../store/planetCoreMetricTypes';
import { resolvePlanetResourceEcosystemPolicy } from '../planetResource/planetResourceEcosystemPolicy';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function affinityNudge(kind: string): Partial<PlanetCoreGaugeView> {
  if (kind === 'shielded') return { defense: 4, technology: 3 };
  if (kind === 'heavy') return { defense: 6, environment: -5 };
  if (kind === 'boss_heavy') return { defense: 10, technology: 5, environment: -6 };
  return { environment: 4 };
}

/** `planet_leveling_progression` + level_band CPM 계수 → 5지표 목표 */
export function deriveMasterBalanceCoreTargets(
  balance: PlanetMasterBalanceDetail,
): PlanetCoreGaugeView {
  const lv = balance.recommendedPilotLevel;
  const tier = (balance.zoneIndex - 1) / 19;
  const dpsN = Math.min(1, balance.requiredFleetMinDps / 25_000);
  const creditN = Math.min(1, Math.log10(balance.targetCreditsEarned + 1) / 7.5);
  const cpm = balance.runtimeCpmMul ?? 1;

  let resource = clamp100(10 + lv * 0.92 + creditN * 22 * cpm);
  let population = clamp100(8 + lv * 0.86 + tier * 10);
  let defense = clamp100(6 + lv * 1.1 + dpsN * 28);
  let technology = clamp100(5 + lv * 1.22 + balance.mineralUpgradeCapAtZone * 1.6);
  let environment = clamp100(34 + lv * 0.68 + tier * 6);

  const aff = affinityNudge(balance.enemyAffinityKind);
  resource = clamp100(resource + (aff.resource ?? 0));
  const resourceCap = resolvePlanetResourceEcosystemPolicy().playerROperatingMax;
  resource = clamp100(Math.min(resourceCap, resource));
  population = clamp100(population + (aff.population ?? 0));
  defense = clamp100(defense + (aff.defense ?? 0));
  technology = clamp100(technology + (aff.technology ?? 0));
  environment = clamp100(environment + (aff.environment ?? 0));

  return { resource, population, defense, technology, environment };
}

export function nudgeGaugeTowardTarget(
  current: PlanetCoreGaugeView,
  target: PlanetCoreGaugeView,
  maxDelta: number,
): PlanetCoreGaugeView {
  const keys = ['resource', 'population', 'defense', 'technology', 'environment'] as const;
  const out = { ...current };
  for (const key of keys) {
    const d = clamp100(target[key]) - current[key];
    const step = Math.max(-maxDelta, Math.min(maxDelta, d));
    out[key] = clamp100(current[key] + step);
  }
  return out;
}
