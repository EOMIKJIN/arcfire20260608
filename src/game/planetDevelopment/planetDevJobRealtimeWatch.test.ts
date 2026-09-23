/**
 * npx tsx --test src/game/planetDevelopment/planetDevJobRealtimeWatch.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PlanetCoreRuntime } from '../../store/planetCoreRuntimeStore';
import {
  inspectPlanetDevJobSchedule,
  resolvePlanetDevJobEarliestAtMs,
} from './planetDevJobRealtimeWatch';

function runtimeWithJob(completeAtMs: number): PlanetCoreRuntime {
  return {
    resource: 1,
    population: 1,
    defense: 1,
    technology: 1,
    environment: 1,
    updatedAt: 1,
    detail: {
      development: {
        version: 1,
        byModuleId: {
          defense_satellite: {
            version: 1,
            installed: false,
            level: 0,
            upgradeJob: {
              targetLevel: 1,
              startedAtMs: completeAtMs - 1000,
              completeAtMs,
            },
          },
        },
      },
    },
  };
}

test('earliest — 모듈 job 시각', () => {
  assert.equal(resolvePlanetDevJobEarliestAtMs(runtimeWithJob(5000)), 5000);
  assert.equal(
    resolvePlanetDevJobEarliestAtMs({
      resource: 1,
      population: 1,
      defense: 1,
      technology: 1,
      environment: 1,
      updatedAt: 1,
    }),
    null,
  );
});

test('inspect — 기한 지난 행성만 due · 다음 시각은 미래 job', () => {
  const bag = {
    alpha: runtimeWithJob(1000),
    beta: runtimeWithJob(9000),
    gamma: {
      resource: 1,
      population: 1,
      defense: 1,
      technology: 1,
      environment: 1,
      updatedAt: 1,
    },
  };
  const out = inspectPlanetDevJobSchedule(bag, ['alpha', 'beta', 'gamma'], 2000, null);
  assert.deepEqual(out.duePlanetIds, ['alpha']);
  assert.equal(out.nextAtMs, 9000);
});

test('inspect — extra(광물 강화) 기한 지남은 next 없음(즉시 tick)', () => {
  const out = inspectPlanetDevJobSchedule({}, [], 5000, 4000);
  assert.deepEqual(out.duePlanetIds, []);
  assert.equal(out.nextAtMs, null);
});
