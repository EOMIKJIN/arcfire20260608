import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldInvalidatePlanetMemoOnHubLand } from './planetHubIngressMemoPolicy';

describe('shouldInvalidatePlanetMemoOnHubLand', () => {
  it('skips full memo purge when landing the planet just departed', () => {
    assert.equal(
      shouldInvalidatePlanetMemoOnHubLand({
        landingPlanetId: 'omega_hub',
        originHubPlanetId: 'omega_hub',
      }),
      false,
    );
  });

  it('invalidates when landing a different planet or when ids are missing', () => {
    assert.equal(
      shouldInvalidatePlanetMemoOnHubLand({
        landingPlanetId: 'vega_base',
        originHubPlanetId: 'arcadia_prime',
      }),
      true,
    );
    assert.equal(
      shouldInvalidatePlanetMemoOnHubLand({
        landingPlanetId: 'arcadia_prime',
        originHubPlanetId: null,
      }),
      true,
    );
  });
});
