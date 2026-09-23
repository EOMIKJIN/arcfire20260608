/**
 * npx tsx --test src/arcCore/spy/tryNotifyArcCoreSpyIntelAlert.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getPendingArcCoreSpyIntelAlertForPlanet,
  resetArcCoreSpyIntelAlertStore,
} from './arcCoreSpyIntelAlertStore';
import { tryNotifyArcCoreSpyIntelAlert } from './tryNotifyArcCoreSpyIntelAlert';
import {
  lockWorldOpsNotifyUntilPlanetHub,
  resetWorldOpsNotifyPresenceForTest,
} from '../../navigation/worldOpsNotifyPresence';

const PLANET_ID = 'arcadia_prime';
const SPY_ID = 'npc_cpt_spy_test_01';

test('spy intel notify skips before first hub and does not consume keys', () => {
  resetWorldOpsNotifyPresenceForTest();
  resetArcCoreSpyIntelAlertStore();
  lockWorldOpsNotifyUntilPlanetHub();
  const keys = new Set<string>();

  const consumed = tryNotifyArcCoreSpyIntelAlert({
    planetId: PLANET_ID,
    newlyArrivedSpyCaptainIds: [SPY_ID],
    activeSpyCaptainIds: [SPY_ID],
    notifiedSpyKeys: keys,
  });

  assert.equal(consumed, false);
  assert.equal(keys.size, 0);
  assert.equal(getPendingArcCoreSpyIntelAlertForPlanet(PLANET_ID), null);

  resetWorldOpsNotifyPresenceForTest();
  resetArcCoreSpyIntelAlertStore();
});
