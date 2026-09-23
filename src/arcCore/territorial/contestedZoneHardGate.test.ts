/**
 * 분쟁지역 하드 게이트 — 아르카디아 후방·점유전투 OFF
 * npx tsx --test src/arcCore/territorial/contestedZoneHardGate.test.ts
 */
import assert from 'node:assert/strict';
import { resolveContestedZoneHardGate } from './contestedZoneHardGate';
import type { PlanetClanHold } from '../../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function makeHold(planetId: string, systemId: string, occupierClanId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId,
    homePlayerUid: null,
    kind: occupierClanId === 'neutral' ? 'neutral' : 'clan_hold',
    capturedAt: 0,
  } as PlanetClanHold;
}

test('1) 아르카디아 BLUE + 솔라·베가 BLUE(아군만 접함) → occupation_combat_disabled', () => {
  const holds: Record<string, PlanetClanHold> = {
    arcadia_prime: makeHold('arcadia_prime', 'arcadia', 'balance_seed_faction_blue'),
    solar_station: makeHold('solar_station', 'solar_port', 'balance_seed_faction_blue'),
    vega_base: makeHold('vega_base', 'vega_outpost', 'balance_seed_faction_blue'),
  };
  const gate = resolveContestedZoneHardGate({
    planetId: 'arcadia_prime',
    systemId: 'arcadia',
    holdSide: 'BLUE',
    holds,
  });
  assert.equal(gate.blocked, true);
  assert.equal(gate.reason, 'occupation_combat_disabled');
  assert.equal(gate.classification, 'safe_hinterland');
});

test('2) 아르카디아는 베가가 RED여도(전선처럼 보여도) 점유전투 OFF라 blocked', () => {
  const holds: Record<string, PlanetClanHold> = {
    arcadia_prime: makeHold('arcadia_prime', 'arcadia', 'balance_seed_faction_blue'),
    solar_station: makeHold('solar_station', 'solar_port', 'balance_seed_faction_blue'),
    vega_base: makeHold('vega_base', 'vega_outpost', 'balance_seed_faction_red'),
  };
  const gate = resolveContestedZoneHardGate({
    planetId: 'arcadia_prime',
    systemId: 'arcadia',
    holdSide: 'BLUE',
    holds,
  });
  assert.equal(gate.blocked, true);
  assert.equal(gate.reason, 'occupation_combat_disabled');
  assert.equal(gate.classification, 'eligible_front');
});

test('3b) 뉴에덴 수도 BLUE + 아군3·오메가 RED → capital_ring_intact (자동전 차단)', () => {
  const holds: Record<string, PlanetClanHold> = {
    eden_city: makeHold('eden_city', 'new_eden', 'balance_seed_faction_blue'),
    solar_station: makeHold('solar_station', 'solar_port', 'balance_seed_faction_blue'),
    vega_base: makeHold('vega_base', 'vega_outpost', 'balance_seed_faction_blue'),
    iron_remnant: makeHold('iron_remnant', 'iron_cross', 'balance_seed_faction_blue'),
    omega_hub: makeHold('omega_hub', 'omega_station', 'balance_seed_faction_red'),
  };
  const gate = resolveContestedZoneHardGate({
    planetId: 'eden_city',
    systemId: 'new_eden',
    holdSide: 'BLUE',
    holds,
  });
  assert.equal(gate.blocked, true);
  assert.equal(gate.reason, 'capital_ring_intact');
  assert.equal(gate.classification, 'eligible_front');
});

test('3) 베가 BLUE + 아르카디아·뉴에덴 BLUE + 드라코 RED → 베가는 전선(eligible_front)이라 통과', () => {
  const holds: Record<string, PlanetClanHold> = {
    vega_base: makeHold('vega_base', 'vega_outpost', 'balance_seed_faction_blue'),
    arcadia_prime: makeHold('arcadia_prime', 'arcadia', 'balance_seed_faction_blue'),
    eden_city: makeHold('eden_city', 'new_eden', 'balance_seed_faction_blue'),
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_red'),
  };
  const gate = resolveContestedZoneHardGate({
    planetId: 'vega_base',
    systemId: 'vega_outpost',
    holdSide: 'BLUE',
    holds,
  });
  assert.equal(gate.blocked, false);
  assert.equal(gate.classification, 'eligible_front');
});

console.log('[contestedZoneHardGate] all tests passed');
