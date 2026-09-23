import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beginPreHubWorldOpsAlertSuppress,
  endPreHubWorldOpsAlertSuppress,
  hasPlanetHubWorldOpsNotifyUnlocked,
  isPreHubWorldOpsAlertSuppressed,
  lockWorldOpsNotifyUntilPlanetHub,
  markPlanetHubWorldOpsNotifyUnlocked,
  resetWorldOpsNotifyPresenceForTest,
  shouldSkipWorldOpsNotifyUntilPlanetHub,
} from './worldOpsNotifyPresence';

test('world ops notify — hub unlock + pre-hub refcount', () => {
  resetWorldOpsNotifyPresenceForTest();
  assert.equal(hasPlanetHubWorldOpsNotifyUnlocked(), false);
  assert.equal(isPreHubWorldOpsAlertSuppressed(), false);

  markPlanetHubWorldOpsNotifyUnlocked();
  assert.equal(hasPlanetHubWorldOpsNotifyUnlocked(), true);
  lockWorldOpsNotifyUntilPlanetHub();
  assert.equal(hasPlanetHubWorldOpsNotifyUnlocked(), false);

  beginPreHubWorldOpsAlertSuppress();
  beginPreHubWorldOpsAlertSuppress();
  assert.equal(isPreHubWorldOpsAlertSuppressed(), true);
  endPreHubWorldOpsAlertSuppress();
  assert.equal(isPreHubWorldOpsAlertSuppressed(), true);
  endPreHubWorldOpsAlertSuppress();
  assert.equal(isPreHubWorldOpsAlertSuppressed(), false);
  endPreHubWorldOpsAlertSuppress();
  assert.equal(isPreHubWorldOpsAlertSuppressed(), false);

  resetWorldOpsNotifyPresenceForTest();
});

test('world ops notify — skip until first hub arrival', () => {
  resetWorldOpsNotifyPresenceForTest();
  assert.equal(shouldSkipWorldOpsNotifyUntilPlanetHub(), true);

  markPlanetHubWorldOpsNotifyUnlocked();
  assert.equal(shouldSkipWorldOpsNotifyUntilPlanetHub(), false);

  beginPreHubWorldOpsAlertSuppress();
  assert.equal(shouldSkipWorldOpsNotifyUntilPlanetHub(), true);
  endPreHubWorldOpsAlertSuppress();
  assert.equal(shouldSkipWorldOpsNotifyUntilPlanetHub(), false);

  lockWorldOpsNotifyUntilPlanetHub();
  assert.equal(shouldSkipWorldOpsNotifyUntilPlanetHub(), true);
  resetWorldOpsNotifyPresenceForTest();
});
