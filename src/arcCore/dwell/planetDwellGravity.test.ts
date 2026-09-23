import test from 'node:test';
import assert from 'node:assert/strict';
import { computePlanetDwellGravity } from './planetDwellGravity';
import { resolvePlanetDwellCivicPolicy } from './planetDwellCivicPolicy';

const policy = resolvePlanetDwellCivicPolicy();

test('dwell gravity — 번화 무역 허브 > 저개발 전초', () => {
  const hub = computePlanetDwellGravity(
    {
      population: 82,
      resource: 70,
      hasTradePort: true,
      hasShipyard: true,
      hasBar: true,
      zone: 'safe',
      targetCreditsEarned: 80_000,
      feeGrossNorm: 0.7,
      isFrontier: false,
      colonizationPhase: 3,
    },
    policy,
  );
  const outpost = computePlanetDwellGravity(
    {
      population: 18,
      resource: 22,
      hasTradePort: false,
      hasShipyard: false,
      hasBar: false,
      zone: 'pvp',
      targetCreditsEarned: 8_000,
      feeGrossNorm: 0,
      isFrontier: false,
      colonizationPhase: 3,
    },
    policy,
  );
  assert.ok(hub.gravity > outpost.gravity + 0.25);
  assert.ok(hub.logicalCap > outpost.logicalCap);
  assert.ok(hub.logicalCap <= policy.capMax);
});

test('dwell gravity — 프론티어 phase1 은 낮은 중력·상한 2', () => {
  const early = computePlanetDwellGravity(
    {
      population: 10,
      resource: 12,
      hasTradePort: false,
      hasShipyard: false,
      hasBar: false,
      zone: 'neutral',
      targetCreditsEarned: 4_000,
      feeGrossNorm: 0,
      isFrontier: true,
      colonizationPhase: 1,
    },
    policy,
  );
  assert.equal(early.logicalCap, policy.frontierPhase1Cap);
  assert.ok(early.gravity < 0.2);
});

test('dwell gravity — phase0 논리 상한 0', () => {
  const locked = computePlanetDwellGravity(
    {
      population: 5,
      resource: 5,
      hasTradePort: false,
      hasShipyard: false,
      hasBar: false,
      zone: 'neutral',
      targetCreditsEarned: 1_000,
      feeGrossNorm: 0,
      isFrontier: true,
      colonizationPhase: 0,
    },
    policy,
  );
  assert.equal(locked.logicalCap, 0);
});
