// ============================================================
// 아크코어 — 행성 환경 다양성 분석 → 핵심 5지표 재조정 (순수 로직)
// - 테이블(Planet) 시드 5축 + 동일 성계 형제 분산·시설·무역 + 궤도 수송·전투 상호작용(선택)
// - 에너지·광물망은 Resource 스칼라에 통합; 궤도 자원 패스는 `runPlanetEnergyCorePass`가 R을 보정
// - 런타임 정본은 planetCoreRuntimeStore.patch 로만 반영 (초상은 동일 스토어 구독으로 갱신)
// ============================================================

import type { Planet, StarSystem, ZoneType } from '../../types';
import type { PlanetCoreGaugeView, PlanetCoreRuntime } from '../../store/planetCoreRuntimeStore';
import { planetCsvBaselineToRuntime, planetCoreRuntimeToGaugeView } from '../../store/planetCoreRuntimeStore';
import type { PlanetInteractionSignals } from './planetInteractionSignals';
import { getPlanetTradePortItemIds } from '../../world/planetTradePortDb';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function variance(vals: number[]): number {
  if (vals.length === 0) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((s, v) => s + (v - m) * (v - m), 0) / vals.length;
}

function meanFive(p: Planet): number {
  return (
    p.coreResource +
    p.corePopulation +
    p.coreDefense +
    p.coreTechnology +
    p.coreEnvironment
  ) / 5;
}

/**
 * 0..1 — 구조적 다양성(성계·시설·테이블) + 선택적 상호작용(궤도 수송·전투).
 * 상호작용이 있으면 재편 “여지”가 커질 수 있으나 상한 1로 고정.
 */
export function computePlanetDiversityIndex(
  planet: Planet,
  siblings: Planet[],
  interaction?: PlanetInteractionSignals,
): number {
  const group = siblings.length > 0 ? siblings : [planet];
  const scores = group.map(meanFive);
  const crossVar = scores.length > 1 ? variance(scores) : 0;
  const crossN = Math.min(1, crossVar / 420);

  const selfVar = variance([
    planet.coreResource,
    planet.corePopulation,
    planet.coreDefense,
    planet.coreTechnology,
    planet.coreEnvironment,
  ]);
  const selfN = Math.min(1, selfVar / 520);

  const fac =
    [planet.hasTradePort, planet.hasShipyard, planet.hasTavern].filter(Boolean).length / 3;
  const tr = Math.min(1, getPlanetTradePortItemIds(planet.id).length / 14);

  const structural = clamp100((0.34 * crossN + 0.24 * selfN + 0.2 * fac + 0.1 * tr) * 100) / 100;

  if (!interaction) return structural;

  const trafficBlend =
    Math.min(1, interaction.arcTrafficShipCount / 9) * 0.28 + interaction.arcTrafficMotionScore * 0.3;
  const combatBlend = interaction.capitalCombatOrbitActive ? 0.28 : 0;
  return Math.min(1, structural * 0.5 + trafficBlend + combatBlend);
}

function zoneWeight(zone: ZoneType): number {
  if (zone === 'pvp') return 1.04;
  if (zone === 'endgame') return 1.03;
  if (zone === 'safe') return 0.98;
  return 1;
}

function enemyWeight(enemyLevel: number): number {
  return Math.max(0.93, Math.min(1.07, 1 + (enemyLevel - 5) * 0.008));
}

type CoreKey = keyof PlanetCoreGaugeView;

const CORE_KEYS: CoreKey[] = [
  'resource',
  'population',
  'defense',
  'technology',
  'environment',
];

function siblingMeanGauge(siblings: Planet[], key: CoreKey): number {
  const map: Record<CoreKey, keyof Planet> = {
    resource: 'coreResource',
    population: 'corePopulation',
    defense: 'coreDefense',
    technology: 'coreTechnology',
    environment: 'coreEnvironment',
  };
  const pk = map[key];
  if (siblings.length === 0) return 50;
  const sum = siblings.reduce((s, p) => s + (p[pk] as number), 0);
  return sum / siblings.length;
}

function nudgeToward(cur: number, target: number, maxDelta: number): number {
  const d = clamp100(target) - cur;
  const capped = Math.max(-maxDelta, Math.min(maxDelta, d));
  return clamp100(cur + capped);
}

/**
 * 현재 런타임 5지표를 다양성·구역·난이도를 반영한 목표로 부드럽게 재조정.
 */
export function rebalancePlanetFiveFromDiversity(input: {
  planet: Planet;
  siblings: Planet[];
  systemZone: ZoneType;
  enemyLevel: number;
  current: PlanetCoreGaugeView;
  interaction?: PlanetInteractionSignals;
}): PlanetCoreGaugeView {
  const { planet, siblings, systemZone, enemyLevel, current, interaction } = input;
  const d = computePlanetDiversityIndex(planet, siblings, interaction);
  const base = planetCsvBaselineToRuntime(planet);
  const baseView = planetCoreRuntimeToGaugeView(base);
  const zw = zoneWeight(systemZone);
  const ew = enemyWeight(enemyLevel);

  const pull = 0.14 + d * 0.5;
  const maxDelta = 6 + Math.round(12 * d);

  const out: PlanetCoreGaugeView = { ...current };
  for (const key of CORE_KEYS) {
    const b = baseView[key];
    const sMean = siblingMeanGauge(siblings, key);
    const distinct = b + (b - sMean) * (0.42 + d * 0.38);
    let target = clamp100(distinct * zw * ew);
    target = clamp100(target * (1 - pull * 0.15) + b * (pull * 0.15));
    out[key] = nudgeToward(current[key], target, maxDelta);
  }

  if (interaction?.capitalCombatOrbitActive) {
    const k = Math.min(10, 4 + Math.round(5 * d));
    out.defense = clamp100(out.defense + k);
    out.technology = clamp100(out.technology + Math.round(k * 0.55));
    out.environment = clamp100(out.environment - Math.round(k * 0.5));
  }

  if (interaction && interaction.arcTrafficShipCount > 0) {
    const pulse =
      (Math.min(1, interaction.arcTrafficMotionScore) * 0.65 +
        Math.min(1, interaction.arcTrafficShipCount / 12) * 0.35) *
      d;
    out.resource = clamp100(out.resource + Math.round(4 * pulse));
    out.population = clamp100(out.population + Math.round(2.5 * pulse));
  }

  return out;
}

export function rebalanceFromRuntimeRecord(
  planet: Planet,
  system: StarSystem,
  runtime: PlanetCoreRuntime,
  interaction?: PlanetInteractionSignals,
): PlanetCoreGaugeView {
  return rebalancePlanetFiveFromDiversity({
    planet,
    siblings: system.planets,
    systemZone: system.zone,
    enemyLevel: system.enemyLevel,
    current: planetCoreRuntimeToGaugeView(runtime),
    interaction,
  });
}
