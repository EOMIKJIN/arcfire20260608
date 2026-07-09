import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyWealthDisparityDailyDelta,
  computePlanetWealthDisparityDailyDelta,
  computeRebellionOverthrowProbability,
  computeRebellionOverthrowRoll01,
  resolveWealthDisparityTierFromWdi,
  shouldRebellionOverthrowSucceed,
} from './computePlanetWealthDisparityDailyDelta';
import { resolveWealthDisparityGlobalPolicy } from '../balance/wealthDisparityPolicy';
import { PLANET_ATTACK_KIND } from '../planetAttack/planetAttackKind';

const policy = resolveWealthDisparityGlobalPolicy();

test('WDI rises with population decline and attack events', () => {
  const { delta, pressureRise } = computePlanetWealthDisparityDailyDelta(
    {
      currentWdi: 20,
      rebellionPhase: 'none',
      baselinePopulation: 60,
      runtimePopulation: 40,
      attackDailyByKind: { arc_inbound_drone_impact: 5 },
      populationDomeLevel: 0,
      fiscalDeficit: false,
      domeWdiReductionPerDay: 0,
    },
    policy,
  );
  assert.ok(pressureRise > 0);
  assert.ok(delta > 0);
  assert.equal(applyWealthDisparityDailyDelta(20, delta), Math.round(20 + delta));
});

test('population dome reduces WDI pressure', () => {
  const lowDome = computePlanetWealthDisparityDailyDelta(
    {
      currentWdi: 50,
      rebellionPhase: 'none',
      baselinePopulation: 55,
      runtimePopulation: 50,
      attackDailyByKind: {},
      populationDomeLevel: 0,
      fiscalDeficit: false,
      domeWdiReductionPerDay: 0,
    },
    policy,
  );
  const highDome = computePlanetWealthDisparityDailyDelta(
    {
      currentWdi: 50,
      rebellionPhase: 'none',
      baselinePopulation: 55,
      runtimePopulation: 50,
      attackDailyByKind: {},
      populationDomeLevel: 15,
      fiscalDeficit: false,
      domeWdiReductionPerDay: 8,
    },
    policy,
  );
  assert.ok(highDome.delta < lowDome.delta);
});

test('overthrow phase applies post-overthrow decay', () => {
  const { delta } = computePlanetWealthDisparityDailyDelta(
    {
      currentWdi: 100,
      rebellionPhase: 'overthrow',
      baselinePopulation: 50,
      runtimePopulation: 50,
      attackDailyByKind: {},
      populationDomeLevel: 0,
      fiscalDeficit: false,
      domeWdiReductionPerDay: 0,
    },
    policy,
  );
  assert.ok(delta < 0);
});

test('tier mapping matches policy thresholds', () => {
  assert.equal(resolveWealthDisparityTierFromWdi(0, policy), 'stable');
  assert.equal(resolveWealthDisparityTierFromWdi(35, policy), 'unrest');
  assert.equal(resolveWealthDisparityTierFromWdi(70, policy), 'danger');
});

test('RED faction overthrow probability is ~1/3 of BLUE', () => {
  const rollPolicy = {
    wdiDangerMin: 70,
    overthrowBaseProbAtDanger: 0.12,
    overthrowProbSpanToMax: 0.22,
  };
  const blue = computeRebellionOverthrowProbability(80, 1, rollPolicy);
  const red = computeRebellionOverthrowProbability(80, 0.33, rollPolicy);
  assert.ok(Math.abs(red / blue - 0.33) < 0.01);
});

test('overthrow roll is deterministic per planet and day', () => {
  const a = computeRebellionOverthrowRoll01('eden_prime', '20260709');
  const b = computeRebellionOverthrowRoll01('eden_prime', '20260709');
  const c = computeRebellionOverthrowRoll01('eden_prime', '20260710');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('spy infiltration weighs higher than generic attack', () => {
  const attackOnly = computePlanetWealthDisparityDailyDelta(
    {
      currentWdi: 30,
      rebellionPhase: 'none',
      baselinePopulation: 50,
      runtimePopulation: 50,
      attackDailyByKind: { arc_inbound_drone_impact: 3 },
      populationDomeLevel: 0,
      fiscalDeficit: false,
      domeWdiReductionPerDay: 0,
    },
    policy,
  );
  const spyOnly = computePlanetWealthDisparityDailyDelta(
    {
      currentWdi: 30,
      rebellionPhase: 'none',
      baselinePopulation: 50,
      runtimePopulation: 50,
      attackDailyByKind: { [PLANET_ATTACK_KIND.ARC_CORE_SPY_INFILTRATION]: 3 },
      populationDomeLevel: 0,
      fiscalDeficit: false,
      domeWdiReductionPerDay: 0,
    },
    policy,
  );
  assert.ok(spyOnly.pressureRise > attackOnly.pressureRise);
});

test('shouldRebellionOverthrowSucceed respects zero probability below danger', () => {
  assert.equal(
    shouldRebellionOverthrowSucceed('test', '20260709', 50, 1, {
      wdiDangerMin: 70,
      overthrowBaseProbAtDanger: 0.5,
      overthrowProbSpanToMax: 0.5,
    }),
    false,
  );
});
