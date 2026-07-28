/**
 * Territorial combat graph — unit tests
 * npx tsx --test src/arcCore/territorial/territorialCombatGraph.test.ts
 */
import assert from 'node:assert/strict';
import {
  inferTerritorialCombatModeFromGraph,
  resolveAdjacentSystemFactionPresence,
  validateTerritorialCombatModeForSystem,
} from './territorialCombatGraph';
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

function hold(
  planetId: string,
  systemId: string,
  occupierClanId: string,
): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId,
    homePlayerUid: null,
    kind: occupierClanId === 'neutral' ? 'neutral' : 'clan_hold',
    capturedAt: 1,
  };
}

test('resolveAdjacentSystemFactionPresence — unknown system → false/false', () => {
  const r = resolveAdjacentSystemFactionPresence('__unknown_system__');
  assert.equal(r.hasBlue, false);
  assert.equal(r.hasRed, false);
});

test('inferTerritorialCombatModeFromGraph — unknown system → blue_red fallback', () => {
  const mode = inferTerritorialCombatModeFromGraph('__unknown_system__');
  assert.equal(mode, 'blue_red');
});

test('validateTerritorialCombatModeForSystem — returns expected mode', () => {
  const r = validateTerritorialCombatModeForSystem({
    systemId: '__unknown_system__',
    combatMode: 'blue_red',
  });
  assert.equal(r.ok, true);
  assert.equal(r.expected, 'blue_red');
});

test('런타임 holds 우선 — 오메가 시드 RED여도 holds가 중립이면 헬리오스 인접 RED 없음', () => {
  // helios 1홉: iron_cross, omega_station, titan_gate (perseus 숏컷 제거 후)
  const holds: Record<string, PlanetClanHold> = {
    iron_remnant: hold('iron_remnant', 'iron_cross', 'balance_seed_faction_blue'),
    omega_hub: hold('omega_hub', 'omega_station', 'neutral'),
    titan_ruins: hold('titan_ruins', 'titan_gate', 'neutral'),
  };
  const r = resolveAdjacentSystemFactionPresence({ systemId: 'helios', holds });
  assert.equal(r.hasBlue, true, '아이언 블루');
  assert.equal(r.hasRed, false, '오메가 시드 RED를 무시하고 런타임 중립');
  assert.equal(inferTerritorialCombatModeFromGraph('helios', holds), 'blue_neutral');
});

test('런타임 holds 우선 — 오메가가 블루면 헬리오스 BOTH가 아니라 블루만', () => {
  const holds: Record<string, PlanetClanHold> = {
    iron_remnant: hold('iron_remnant', 'iron_cross', 'balance_seed_faction_blue'),
    omega_hub: hold('omega_hub', 'omega_station', 'balance_seed_faction_blue'),
    titan_ruins: hold('titan_ruins', 'titan_gate', 'neutral'),
  };
  const r = resolveAdjacentSystemFactionPresence({ systemId: 'helios', holds });
  assert.equal(r.hasBlue, true);
  assert.equal(r.hasRed, false);
});

test('시드 폴백(holds 생략)은 존재하되 분쟁 패스에서는 사용하지 않음 — API만 유지', () => {
  const seeded = resolveAdjacentSystemFactionPresence('helios');
  assert.equal(typeof seeded.hasBlue, 'boolean');
  assert.equal(typeof seeded.hasRed, 'boolean');
});

console.log('[territorialCombatGraph] all tests passed');
