/**
 * npx tsx --test src/arcCore/spy/spyIntelAutoOpenGate.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hasPlanetHubLandDialogSyncDone,
  markPlanetHubLandDialogSyncDone,
  resetPlanetHubSpyIntelDialogSchedule,
  shouldHoldSpyIntelAutoOpen,
} from './spyIntelAutoOpenGate';
import {
  markPlanetHubWorldOpsNotifyUnlocked,
  resetWorldOpsNotifyPresenceForTest,
} from '../../navigation/worldOpsNotifyPresence';

const PLANET_ID = 'arcadia_prime';

test('spy auto-open holds until hub unlock and land dialog sync', () => {
  resetWorldOpsNotifyPresenceForTest();
  resetPlanetHubSpyIntelDialogSchedule();

  assert.equal(shouldHoldSpyIntelAutoOpen(PLANET_ID), true);

  markPlanetHubWorldOpsNotifyUnlocked();
  assert.equal(shouldHoldSpyIntelAutoOpen(PLANET_ID), true);
  assert.equal(hasPlanetHubLandDialogSyncDone(PLANET_ID), false);

  markPlanetHubLandDialogSyncDone(PLANET_ID);
  assert.equal(hasPlanetHubLandDialogSyncDone(PLANET_ID), true);
  assert.equal(shouldHoldSpyIntelAutoOpen(PLANET_ID), false);

  resetPlanetHubSpyIntelDialogSchedule();
  assert.equal(shouldHoldSpyIntelAutoOpen(PLANET_ID), true);

  resetWorldOpsNotifyPresenceForTest();
  resetPlanetHubSpyIntelDialogSchedule();
});
