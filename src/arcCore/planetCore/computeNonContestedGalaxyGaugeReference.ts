// ============================================================
// 비분쟁 코어 개방 행성 CSV 시드 평균 — 분쟁지역 비교 기준
// ============================================================

import {
  planetCoreRuntimeToGaugeView,
  planetCsvBaselineToRuntime,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import { listCoreOpenGameplayPlanetIds, resolveCoreOpenGameplayPlanetRef } from '../../world/coreOpenGameplayPlanets';

const GAUGE_KEYS = ['resource', 'population', 'defense', 'technology', 'environment'] as const;

function emptyGauge(): PlanetCoreGaugeView {
  return { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 };
}

function clampGauge(g: PlanetCoreGaugeView): PlanetCoreGaugeView {
  const out = { ...g };
  for (const k of GAUGE_KEYS) {
    out[k] = Math.max(0, Math.min(100, Math.round(out[k])));
  }
  return out;
}

/** 비분쟁 코어 개방 행성 CSV 시드 5스탯 산술 평균 */
export function computeNonContestedGalaxyGaugeReference(): {
  gauge: PlanetCoreGaugeView;
  sampleCount: number;
} {
  const acc = emptyGauge();
  let sampleCount = 0;

  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    if (isPlanetContestedZone(planetId)) continue;
    const ref = resolveCoreOpenGameplayPlanetRef(planetId);
    if (!ref) continue;
    const gauge = planetCoreRuntimeToGaugeView(planetCsvBaselineToRuntime(ref.planet));
    for (const k of GAUGE_KEYS) {
      acc[k] += gauge[k];
    }
    sampleCount += 1;
  }

  if (sampleCount <= 0) {
    return { gauge: clampGauge({ resource: 50, population: 50, defense: 50, technology: 50, environment: 50 }), sampleCount: 0 };
  }

  const gauge = clampGauge({
    resource: acc.resource / sampleCount,
    population: acc.population / sampleCount,
    defense: acc.defense / sampleCount,
    technology: acc.technology / sampleCount,
    environment: acc.environment / sampleCount,
  });

  return { gauge, sampleCount };
}
