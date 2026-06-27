// ============================================================
// 아크코어 5대 스탯 운영 추세 — 일일 배치(arc_core_daily_ops) Δ 기록
// 주기: resolveArcCoreDailyOpsPolicy() · 기본 12:00 KST · 24h 관측
// ============================================================

import {
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import type {
  PlanetCoreStatKey,
  PlanetCoreStatOpsTrendDetail,
} from '../../store/planetCoreMetricTypes';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { resolveArcCoreDailyOpsPolicy } from '../schedule/arcCoreDailyOpsPolicy';

export const PLANET_CORE_STAT_KEYS: readonly PlanetCoreStatKey[] = [
  'resource',
  'population',
  'defense',
  'technology',
  'environment',
];

export type PlanetCoreStatTrendDirection = 'up' | 'down' | 'flat';

export type PlanetCoreStatTrendView = {
  delta: number;
  direction: PlanetCoreStatTrendDirection;
};

let batchGaugeSnapshot: Record<string, PlanetCoreGaugeView> | null = null;

export function roundPlanetCoreStatDeltaTenth(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

/** `runArcCoreDailyOpsBatch` 시작 — 배치 전 5지표 스냅샷 */
export function beginPlanetCoreStatOpsTrendSnapshot(): void {
  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return;

  const snap: Record<string, PlanetCoreGaugeView> = {};
  for (const planetId of Object.keys(coreStore.byPlanetId)) {
    const runtime = coreStore.byPlanetId[planetId];
    if (!runtime) continue;
    snap[planetId] = planetCoreRuntimeToGaugeView(runtime);
  }
  batchGaugeSnapshot = snap;
}

function buildTrendDelta(
  before: PlanetCoreGaugeView,
  after: PlanetCoreGaugeView,
): PlanetCoreStatOpsTrendDetail['delta'] {
  const delta = {} as PlanetCoreStatOpsTrendDetail['delta'];
  for (const key of PLANET_CORE_STAT_KEYS) {
    delta[key] = roundPlanetCoreStatDeltaTenth(after[key] - before[key]);
  }
  return delta;
}

/** `runArcCoreDailyOpsBatch` 종료 — Δ를 detail.statOpsTrend에 일괄 반영 */
export function commitPlanetCoreStatOpsTrendAfterBatch(): void {
  const before = batchGaugeSnapshot;
  batchGaugeSnapshot = null;
  if (!before) return;

  const policy = resolveArcCoreDailyOpsPolicy();
  const kstDayKey = planetAttackKstDayKey();
  const completedAtMs = Date.now();
  const coreStore = usePlanetCoreRuntimeStore.getState();

  const updates: Record<string, PlanetCoreStatOpsTrendDetail> = {};
  for (const planetId of Object.keys(before)) {
    const prevGauge = before[planetId];
    const runtime = coreStore.byPlanetId[planetId];
    if (!prevGauge || !runtime) continue;
    const afterGauge = planetCoreRuntimeToGaugeView(runtime);
    updates[planetId] = {
      version: 1,
      kstDayKey,
      observationWindowHours: policy.observationWindowHours,
      batchCompletedAtMs: completedAtMs,
      delta: buildTrendDelta(prevGauge, afterGauge),
    };
  }

  if (Object.keys(updates).length > 0) {
    coreStore.patchPlanetCoreStatOpsTrendBulk(updates);
  }
}

export function readPlanetCoreStatOpsTrend(
  planetId: string,
): PlanetCoreStatOpsTrendDetail | null {
  const detail = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId]?.detail;
  return detail?.statOpsTrend ?? null;
}

export function resolvePlanetCoreStatTrendView(
  trend: PlanetCoreStatOpsTrendDetail | null | undefined,
  statKey: PlanetCoreStatKey,
): PlanetCoreStatTrendView {
  const raw = trend?.delta?.[statKey] ?? 0;
  const delta = roundPlanetCoreStatDeltaTenth(raw);
  if (delta > 0) return { delta, direction: 'up' };
  if (delta < 0) return { delta, direction: 'down' };
  return { delta: 0, direction: 'flat' };
}

export function formatPlanetCoreStatTrendDelta(delta: number): string {
  const abs = roundPlanetCoreStatDeltaTenth(Math.abs(delta));
  if (abs === 0) return '0.0';
  const sign = delta > 0 ? '+' : '-';
  return `${sign}${abs.toFixed(1)}`;
}
