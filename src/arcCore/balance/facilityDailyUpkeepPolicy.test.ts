import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveFacilityDailyUpkeepCredits } from './facilityDailyUpkeepPolicy';

describe('facilityDailyUpkeepPolicy', () => {
  it('returns new facility slots and ignores unknown levels', () => {
    assert.equal(resolveFacilityDailyUpkeepCredits('shipyard', 1), 24);
    assert.equal(resolveFacilityDailyUpkeepCredits('laboratory', 1), 20);
    assert.equal(resolveFacilityDailyUpkeepCredits('trade_port', 1), 18);
    assert.equal(resolveFacilityDailyUpkeepCredits('population_dome', 1), 16);
    assert.equal(resolveFacilityDailyUpkeepCredits('shipyard', 15), 164);
    assert.equal(resolveFacilityDailyUpkeepCredits('shipyard', 99), 0);
  });
});
