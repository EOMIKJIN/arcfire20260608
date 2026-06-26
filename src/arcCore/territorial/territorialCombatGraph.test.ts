/**
 * Territorial combat graph — unit tests
 * npx tsx src/arcCore/territorial/territorialCombatGraph.test.ts
 */
import assert from 'node:assert/strict';
import {
  inferTerritorialCombatModeFromGraph,
  resolveAdjacentSystemFactionPresence,
  validateTerritorialCombatModeForSystem,
} from './territorialCombatGraph';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
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

console.log('[territorialCombatGraph] all tests passed');
