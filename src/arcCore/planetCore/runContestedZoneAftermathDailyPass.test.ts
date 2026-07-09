import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveContestedZoneStatAftermathOffsets,
  listContestedZoneStatAftermathPlanetIds,
} from '../balance/contestedZoneAftermathPolicy';
import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';

test('contested zones — 3 planets flagged in occupation seeds', () => {
  const ids = listContestedZoneStatAftermathPlanetIds();
  assert.equal(ids.length, 3);
  for (const id of ids) {
    assert.equal(isPlanetContestedZone(id), true, id);
    assert.ok(resolveContestedZoneStatAftermathOffsets(id));
  }
});

test('contested aftermath offsets — net war economy vs civilian drag', () => {
  const draco = resolveContestedZoneStatAftermathOffsets('draco_haven')!;
  assert.ok(draco.defense > 0 && draco.technology > 0);
  assert.ok(draco.population < 0 && draco.environment < 0);

  const omega = resolveContestedZoneStatAftermathOffsets('omega_hub')!;
  assert.ok(omega.resource > 0);
  assert.ok(omega.population < 0);

  const shadow = resolveContestedZoneStatAftermathOffsets('shadow_market')!;
  assert.ok(shadow.resource > 0);
  assert.ok(shadow.environment < 0);
});

test('contested equilibrium target — PGP within bounded delta vs csv baseline', () => {
  const baseline = { resource: 36, population: 46, defense: 42, technology: 54, environment: 50 };
  const offsets = resolveContestedZoneStatAftermathOffsets('draco_haven')!;
  const target = {
    resource: baseline.resource + offsets.resource,
    population: baseline.population + offsets.population,
    defense: baseline.defense + offsets.defense,
    technology: baseline.technology + offsets.technology,
    environment: baseline.environment + offsets.environment,
  };
  const basePgp = calculatePlanetPgpFromStats(baseline);
  const targetPgp = calculatePlanetPgpFromStats(target);
  const delta = targetPgp - basePgp;
  assert.ok(delta >= 0 && delta <= 2500, `draco net PGP delta ${delta}`);
});
