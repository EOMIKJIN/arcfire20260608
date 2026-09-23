import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveArcCoreFiscalOpexPolicy,
  shouldSkipCentralBankEmptyAccountingBurn,
} from './arcCoreFiscalOpexPolicy';
import {
  computeArcCoreFiscalOpexRequested,
  computePgpUnit,
  computeResidualForSurplus,
  spendableAboveSeed,
} from './computeArcCoreFiscalOpexProxy';

describe('computeArcCoreFiscalOpexProxy', () => {
  const policy = resolveArcCoreFiscalOpexPolicy();

  it('uses pgp/3375 as unit and falls back to D', () => {
    assert.equal(computePgpUnit(33750, 40, 3375), 10);
    assert.equal(computePgpUnit(0, 40, 3375), 40);
  });

  it('protects seed and residual 0 by default', () => {
    assert.equal(spendableAboveSeed(9_000_000, 100_000), 8_900_000);
    assert.equal(spendableAboveSeed(80_000, 100_000), 0);
    assert.equal(computeResidualForSurplus(1_000_000, 0), 0);
    assert.equal(computeResidualForSurplus(1_000_000, 25), 250_000);
  });

  it('splits ship opex 70/30 and charges R&D to RED only', () => {
    const out = computeArcCoreFiscalOpexRequested(
      {
        planets: [
          {
            planetId: 'core_prime',
            vaultKey: 'red',
            defense: 50,
            pgp: 84375,
            shipyardLevel: 2,
            laboratoryLevel: 3,
            talkEnabledGovernor: true,
          },
          {
            planetId: 'eden_city',
            vaultKey: 'blue',
            defense: 40,
            pgp: 33750,
            shipyardLevel: 0,
            laboratoryLevel: 0,
            talkEnabledGovernor: true,
          },
        ],
        orbitShipCount: 8,
        orbitCaptainCount: 4,
      },
      policy,
    );
    assert.equal(out.orbitUsed, 5);
    assert.equal(out.shipyardLevelSum, 2);
    assert.equal(out.laboratoryLevelSum, 3);
    assert.ok(out.military.red > 0);
    assert.ok(out.military.blue > 0);
    assert.equal(out.rd.red, policy.kRd * 3);
    assert.equal(out.rd.blue, 0);
    const shipTotal = out.ship.fleet + out.ship.red;
    assert.ok(Math.abs(out.ship.fleet / shipTotal - 0.7) < 0.02);
    assert.equal(out.captain.red, policy.kCap);
    assert.equal(out.captain.blue, policy.kCap);
    assert.equal(out.captain.fleet, policy.kCap * 4);
    assert.equal(policy.shadowMode, false);
    assert.equal(policy.residualSurplusPct, 15);
    assert.equal(policy.fleetOpexOfSurplusPct, 2);
    assert.equal(policy.redDividendPct, 0);
    assert.equal(shouldSkipCentralBankEmptyAccountingBurn(), true);
  });
});
