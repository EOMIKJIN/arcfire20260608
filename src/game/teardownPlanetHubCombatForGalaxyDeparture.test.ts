import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldTeardownPlanetHubCombatForGalaxyDeparture } from './teardownPlanetHubCombatGate';

const idle = {
  battleReadyVisible: false,
  capitalCombatOrbitActive: false,
  waveDefenseActive: false,
  hadCombatThisVisit: false,
};

describe('shouldTeardownPlanetHubCombatForGalaxyDeparture', () => {
  it('skips combat teardown on a visit that never entered Ready/orbit/wave', () => {
    assert.equal(shouldTeardownPlanetHubCombatForGalaxyDeparture(idle), false);
  });

  it('keeps combat teardown while Ready, orbit, or wave is live', () => {
    assert.equal(
      shouldTeardownPlanetHubCombatForGalaxyDeparture({ ...idle, battleReadyVisible: true }),
      true,
    );
    assert.equal(
      shouldTeardownPlanetHubCombatForGalaxyDeparture({ ...idle, capitalCombatOrbitActive: true }),
      true,
    );
    assert.equal(
      shouldTeardownPlanetHubCombatForGalaxyDeparture({ ...idle, waveDefenseActive: true }),
      true,
    );
  });

  it('keeps combat teardown after the session flag drops if this visit fought', () => {
    assert.equal(
      shouldTeardownPlanetHubCombatForGalaxyDeparture({ ...idle, hadCombatThisVisit: true }),
      true,
    );
  });
});
