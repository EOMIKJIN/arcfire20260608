import test from 'node:test';
import assert from 'node:assert/strict';
import { judgeTableDwellPlanet } from './planetDwellJudgment';
import type { PlanetDwellSignal } from './planetDwellTypes';

function signal(partial: Partial<PlanetDwellSignal> & Pick<PlanetDwellSignal, 'planetId'>): PlanetDwellSignal {
  return {
    population: 50,
    resource: 50,
    defense: 40,
    technology: 40,
    environment: 60,
    hasTradePort: false,
    hasShipyard: false,
    hasBar: false,
    zone: 'neutral',
    targetCreditsEarned: 20_000,
    feeGrossNorm: 0,
    isFrontier: false,
    colonizationPhase: 3,
    isContested: false,
    wdi: 10,
    rebellionPhase: 'none',
    gravity: 0.4,
    logicalCap: 4,
    ...partial,
  };
}

test('판단 — 민간 소비는 무역 허브를 개척 전초보다 고른다', () => {
  const hub = signal({
    planetId: 'hub_a',
    hasTradePort: true,
    hasBar: true,
    zone: 'safe',
    population: 80,
    gravity: 0.86,
    logicalCap: 10,
  });
  const frontier = signal({
    planetId: 'synth_001_p',
    isFrontier: true,
    colonizationPhase: 1,
    gravity: 0.07,
    logicalCap: 2,
  });
  const judged = judgeTableDwellPlanet({
    captainId: 'cpt_consumer_1',
    role: 'civilian_consumer',
    basePlanetId: null,
    activityPlanetIds: [],
    candidates: [hub.planetId, frontier.planetId],
    signalsById: new Map([
      [hub.planetId, hub],
      [frontier.planetId, frontier],
    ]),
    occupancy: new Map(),
    dayBucket: 20_000,
    epochBucket: 100,
  });
  assert.equal(judged.planetId, hub.planetId);
  assert.notEqual(judged.action, 'depart');
});

test('판단 — colonizer 는 phase1 프론티어를 선호', () => {
  const hub = signal({
    planetId: 'core_hub',
    hasTradePort: true,
    gravity: 0.9,
    logicalCap: 10,
  });
  const frontier = signal({
    planetId: 'synth_002_p',
    isFrontier: true,
    colonizationPhase: 1,
    gravity: 0.08,
    logicalCap: 2,
  });
  const judged = judgeTableDwellPlanet({
    captainId: 'cpt_col_1',
    role: 'colonizer',
    basePlanetId: null,
    activityPlanetIds: [],
    candidates: [hub.planetId, frontier.planetId],
    signalsById: new Map([
      [hub.planetId, hub],
      [frontier.planetId, frontier],
    ]),
    occupancy: new Map(),
    dayBucket: 20_000,
    epochBucket: 40,
  });
  assert.equal(judged.planetId, frontier.planetId);
});

test('판단 — 상한 1이면 두 번째 민간은 다른 행성으로', () => {
  const a = signal({ planetId: 'town_a', hasTradePort: true, gravity: 0.95, logicalCap: 1, population: 88 });
  const b = signal({ planetId: 'town_b', hasTradePort: true, gravity: 0.4, logicalCap: 3, population: 40 });
  const first = judgeTableDwellPlanet({
    captainId: 'cpt_a',
    role: 'civilian_consumer',
    basePlanetId: null,
    activityPlanetIds: [],
    candidates: [a.planetId, b.planetId],
    signalsById: new Map([
      [a.planetId, a],
      [b.planetId, b],
    ]),
    occupancy: new Map(),
    dayBucket: 20_001,
    epochBucket: 11,
  });
  const occupancy = new Map<string, number>();
  if (first.planetId) occupancy.set(first.planetId, 1);
  const second = judgeTableDwellPlanet({
    captainId: 'cpt_b',
    role: 'civilian_consumer',
    basePlanetId: null,
    activityPlanetIds: [],
    candidates: [a.planetId, b.planetId],
    signalsById: new Map([
      [a.planetId, a],
      [b.planetId, b],
    ]),
    occupancy,
    dayBucket: 20_001,
    epochBucket: 11,
  });
  assert.ok(first.planetId);
  assert.ok(second.planetId);
  assert.notEqual(second.planetId, first.planetId);
});

test('판단 — 프론티어만 있으면 민간은 이탈', () => {
  const frontier = signal({
    planetId: 'synth_003_p',
    isFrontier: true,
    colonizationPhase: 1,
    gravity: 0.07,
    logicalCap: 2,
  });
  const judged = judgeTableDwellPlanet({
    captainId: 'cpt_city',
    role: 'civilian_consumer',
    basePlanetId: null,
    activityPlanetIds: [],
    candidates: [frontier.planetId],
    signalsById: new Map([[frontier.planetId, frontier]]),
    occupancy: new Map(),
    dayBucket: 20_002,
    epochBucket: 12,
  });
  assert.equal(judged.planetId, null);
  assert.equal(judged.action, 'depart');
});
