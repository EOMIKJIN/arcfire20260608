// ============================================================
// 일일 배치 — ArcCore·player dev gauge intent 누적 (composition apply 전)
// ============================================================

import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';

export type PlanetCoreGaugeIntentSource = 'arc_core' | 'player_dev';

const GAUGE_KEYS = ['resource', 'population', 'defense', 'technology', 'environment'] as const;

type IntentAccum = {
  arc_core: PlanetCoreGaugeView;
  player_dev: PlanetCoreGaugeView;
};

let batchActive = false;
const byPlanetId = new Map<string, IntentAccum>();

function emptyIntent(): IntentAccum {
  return {
    arc_core: { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 },
    player_dev: { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 },
  };
}

export function beginPlanetCoreGaugeIntentBatch(): void {
  batchActive = true;
  byPlanetId.clear();
}

export function endPlanetCoreGaugeIntentBatch(): void {
  batchActive = false;
  byPlanetId.clear();
}

export function isPlanetCoreGaugeIntentBatchActive(): boolean {
  return batchActive;
}

function ensurePlanetIntent(planetId: string): IntentAccum {
  let row = byPlanetId.get(planetId);
  if (!row) {
    row = emptyIntent();
    byPlanetId.set(planetId, row);
  }
  return row;
}

/** intent 배치 중 — Δ 누적. 배치 외 호출은 noop. */
export function pushPlanetCoreGaugeIntent(
  planetId: string,
  delta: Partial<PlanetCoreGaugeView>,
  source: PlanetCoreGaugeIntentSource,
): void {
  if (!batchActive || !planetId) return;
  const row = ensurePlanetIntent(planetId);
  const bucket = row[source];
  for (const k of GAUGE_KEYS) {
    const d = delta[k];
    if (d == null || !Number.isFinite(d)) continue;
    bucket[k] += d;
  }
}

export function getPlanetCoreGaugeIntentSnapshot(): ReadonlyMap<string, IntentAccum> {
  return byPlanetId;
}

/** gauge before→after Δ를 source로 intent에 기록 (배치 중). 아니면 directPatch 실행. */
export function applyPlanetCoreGaugeChangeOrIntent(
  planetId: string,
  before: PlanetCoreGaugeView,
  after: PlanetCoreGaugeView,
  source: PlanetCoreGaugeIntentSource,
  directPatch: () => void,
): void {
  if (!batchActive) {
    directPatch();
    return;
  }
  const delta: Partial<PlanetCoreGaugeView> = {};
  let any = false;
  for (const k of GAUGE_KEYS) {
    const d = after[k] - before[k];
    if (d === 0) continue;
    delta[k] = d;
    any = true;
  }
  if (any) pushPlanetCoreGaugeIntent(planetId, delta, source);
}
