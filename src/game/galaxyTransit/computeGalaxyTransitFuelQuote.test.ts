import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SKILLS_FROM_CSV } from '../../data/generated';
import {
  applyGalaxyTransitFuelEfficiency,
  resolveGalaxyTransitFuelPolicy,
} from './galaxyTransitFuelPolicy';

function csvFuelEfficiencySum(ownedIds: readonly string[]): number {
  let sum = 0;
  for (const id of ownedIds) {
    const skill = SKILLS_FROM_CSV[id];
    if (skill?.effect?.stat !== 'fuel_efficiency') continue;
    const v = Number(skill.effect.value);
    if (Number.isFinite(v)) sum += v;
  }
  return sum;
}

test('fuel_efficiency skill values sum from CSV ids', () => {
  assert.equal(csvFuelEfficiencySum([]), 0);
  assert.equal(csvFuelEfficiencySum(['warp_stabilizer']), 20);
  assert.equal(csvFuelEfficiencySum(['warp_stabilizer', 'orbit_surge']), 35);
  assert.equal(csvFuelEfficiencySum(['star_pathfinder']), 100);
  assert.equal(
    csvFuelEfficiencySum(['warp_stabilizer', 'orbit_surge', 'star_pathfinder']),
    135,
  );
});

test('galaxy transit fuel efficiency applies percent and caps at policy 50', () => {
  const cap = resolveGalaxyTransitFuelPolicy().fuelEfficiencyStatCapPct;
  assert.equal(cap, 50);
  assert.equal(applyGalaxyTransitFuelEfficiency(1000, 0, cap), 1000);
  assert.equal(applyGalaxyTransitFuelEfficiency(1000, 20, cap), 800);
  assert.equal(applyGalaxyTransitFuelEfficiency(1000, 35, cap), 650);
  assert.equal(applyGalaxyTransitFuelEfficiency(1000, 100, cap), 500);
  assert.equal(applyGalaxyTransitFuelEfficiency(1000, 135, cap), 500);
});
