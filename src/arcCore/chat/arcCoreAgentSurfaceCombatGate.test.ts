import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveArcCoreAgentSurfaceCombatBlocked } from './arcCoreAgentSurfaceCombatGate';

test('combat gate blocks wave or orbit combat', () => {
  assert.equal(resolveArcCoreAgentSurfaceCombatBlocked({
    waveActive: false,
    orbitCombatActive: false,
  }), false);
  assert.equal(resolveArcCoreAgentSurfaceCombatBlocked({
    waveActive: true,
    orbitCombatActive: false,
  }), true);
  assert.equal(resolveArcCoreAgentSurfaceCombatBlocked({
    waveActive: false,
    orbitCombatActive: true,
  }), true);
});
