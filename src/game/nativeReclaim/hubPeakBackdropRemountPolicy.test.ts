import assert from 'node:assert/strict';
import { shouldSkipHubPeakBackdropRemount } from './hubPeakBackdropRemountPolicy';

assert.equal(shouldSkipHubPeakBackdropRemount('hub_combat_orbit_end'), true);
assert.equal(shouldSkipHubPeakBackdropRemount('hub_combat_orbit_end:followup_90s'), true);
assert.equal(shouldSkipHubPeakBackdropRemount('hub_wave_inter_wave'), true);
assert.equal(shouldSkipHubPeakBackdropRemount('hub_inbound_drone_end'), true);
assert.equal(shouldSkipHubPeakBackdropRemount('hub_inbound_vfx_cleared:inbound_settle'), true);
assert.equal(shouldSkipHubPeakBackdropRemount('hub_periodic'), false);

console.log('hubPeakBackdropRemountPolicy tests done');
