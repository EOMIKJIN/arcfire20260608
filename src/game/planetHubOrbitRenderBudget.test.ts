/**
 * npx tsx --test src/game/planetHubOrbitRenderBudget.test.ts
 */
import assert from 'node:assert/strict';
import {
  applyPlanetHubOrbitRenderBudget,
  PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX,
  PLANET_HUB_ORBIT_TABLE_MIN_RESERVE,
} from './planetHubOrbitRenderBudget';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';
import type { ArcNpcTrafficShip } from '../store/arcNpcTrafficStore';

function tableRow(i: number): NearbyOrbitPresenceRow {
  return {
    slotIndex: i,
    hullClassId: 'h',
    displayLine: `t${i}`,
    orbit: {
      phase: 0,
      speed: 1,
      radius: 100,
      moving: true,
      ellipseY: 0.7,
      pathTilt: 0,
      periodScale: 1,
    },
  };
}

function arcShip(id: string): ArcNpcTrafficShip {
  return {
    id,
    captainId: `c_${id}`,
    planetId: 'arcadia_prime',
    phase: 'dwelling',
    phaseElapsedSec: 0,
    phaseDurationSec: 60,
    orbitAngleRad: 0,
    orbitRadiusPx: 110,
    edgeAngleRad: 0,
    arcTrafficDwellRadPerSec: 0.4,
    arcTrafficPhaseDurationMul: 1,
    arcTrafficPlanetDwellSecMin: 60,
    arcTrafficPlanetDwellSecMax: 120,
  };
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('아크 8척이어도 테이블 최소 예약 유지', () => {
  const table = Array.from({ length: 6 }, (_, i) => tableRow(i));
  const arcs = Array.from({ length: 8 }, (_, i) => arcShip(`a${i}`));
  const r = applyPlanetHubOrbitRenderBudget(table, arcs);
  assert.equal(r.tableRows.length, PLANET_HUB_ORBIT_TABLE_MIN_RESERVE);
  assert.equal(r.arcShips.length, PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX - PLANET_HUB_ORBIT_TABLE_MIN_RESERVE);
  assert.equal(r.tableRows.length + r.arcShips.length, PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX);
});

test('테이블만 있으면 상한까지 테이블', () => {
  const table = Array.from({ length: 10 }, (_, i) => tableRow(i));
  const r = applyPlanetHubOrbitRenderBudget(table, []);
  assert.equal(r.tableRows.length, PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX);
  assert.equal(r.arcShips.length, 0);
});

test('테이블 2척(<예약)이면 있는 만큼만 + 아크 잔여', () => {
  const table = [tableRow(0), tableRow(1)];
  const arcs = Array.from({ length: 8 }, (_, i) => arcShip(`a${i}`));
  const r = applyPlanetHubOrbitRenderBudget(table, arcs);
  assert.equal(r.tableRows.length, 2);
  assert.equal(r.arcShips.length, 6);
});

console.log('[planetHubOrbitRenderBudget] all tests passed');
