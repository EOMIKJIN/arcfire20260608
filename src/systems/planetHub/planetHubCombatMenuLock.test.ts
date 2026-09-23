/**
 * npx tsx --test src/systems/planetHub/planetHubCombatMenuLock.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPlanetHubCombatSessionLock } from './planetHubCombatMenuLock';

test('lock starts with Ready countdown, combat, or an active wave run', () => {
  assert.equal(
    isPlanetHubCombatSessionLock({
      battleReadyVisible: true,
      capitalCombatOrbitActive: false,
      waveDefenseActive: false,
    }),
    true,
  );
  assert.equal(
    isPlanetHubCombatSessionLock({
      battleReadyVisible: false,
      capitalCombatOrbitActive: true,
      waveDefenseActive: false,
    }),
    true,
  );
  assert.equal(
    isPlanetHubCombatSessionLock({
      battleReadyVisible: false,
      capitalCombatOrbitActive: false,
      waveDefenseActive: true,
    }),
    true,
  );
  assert.equal(
    isPlanetHubCombatSessionLock({
      battleReadyVisible: false,
      capitalCombatOrbitActive: false,
      waveDefenseActive: false,
    }),
    false,
  );
});
