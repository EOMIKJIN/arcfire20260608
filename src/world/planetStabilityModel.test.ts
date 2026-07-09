import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePlanetStabilityTierFromWdi,
  resolvePlanetStabilityTierFillPct,
  clampPlanetWdi,
  resolvePlanetStabilityTierColor,
  resolvePlanetStabilityTierColorOpacity,
  PLANET_STABILITY_TIER_INACTIVE_OPACITY,
} from './planetStabilityTierCore';

test('planet stability tier thresholds', () => {
  assert.equal(resolvePlanetStabilityTierFromWdi(0), 'stable');
  assert.equal(resolvePlanetStabilityTierFromWdi(34), 'stable');
  assert.equal(resolvePlanetStabilityTierFromWdi(35), 'unrest');
  assert.equal(resolvePlanetStabilityTierFromWdi(69), 'unrest');
  assert.equal(resolvePlanetStabilityTierFromWdi(70), 'danger');
  assert.equal(resolvePlanetStabilityTierFromWdi(99), 'danger');
  assert.equal(resolvePlanetStabilityTierFromWdi(50, 'overthrow'), 'rebellion');
});

test('planet stability tier fill pct', () => {
  assert.equal(resolvePlanetStabilityTierFillPct(0, 'stable'), 0);
  assert.ok(resolvePlanetStabilityTierFillPct(17, 'stable') > 0);
  assert.equal(resolvePlanetStabilityTierFillPct(100, 'rebellion'), 100);
  assert.equal(clampPlanetWdi(150), 100);
});

test('planet stability tier color opacity', () => {
  assert.equal(PLANET_STABILITY_TIER_INACTIVE_OPACITY, 0.1);
  assert.equal(resolvePlanetStabilityTierColorOpacity(true), 1);
  assert.equal(resolvePlanetStabilityTierColorOpacity(false), 0.1);
  assert.equal(resolvePlanetStabilityTierColor('#3DDC84', false), 'rgba(61, 220, 132, 0.1)');
  assert.equal(resolvePlanetStabilityTierColor('#3DDC84', true), 'rgba(61, 220, 132, 1)');
});
