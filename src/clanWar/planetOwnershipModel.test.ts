/**
 * npx tsx src/clanWar/planetOwnershipModel.test.ts
 */
import assert from 'node:assert/strict';
import {
  ARC_CORE_SEED_BLUE_CLAN_ID,
  isPlayerIndependentNationHold,
  migrateExistingPlayerDeedHoldToIndependent,
  resolveEffectiveMapOccupierClanId,
  resolvePlayerIndependentOccupierClanId,
  resolveTerritorialSideForHold,
} from './planetOwnershipModel';
import type { PlanetClanHold } from '../types';

const PLAYER_CLAN = 'solo_clan_test_uid';
const clans = {
  [PLAYER_CLAN]: {
    id: PLAYER_CLAN,
    displayName: '테스트 함대',
    leaderUid: 'test_uid',
    megaFactionId: 'mega_stellium_alliance',
    createdAt: 0,
    ext: {},
  },
};

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('neutral occupier + player deed → independent nation hold', () => {
  const hold: PlanetClanHold = {
    planetId: 'neutral_p',
    systemId: 'neutral_sys',
    occupierClanId: 'neutral',
    deedOwnerClanId: PLAYER_CLAN,
    homePlayerUid: 'test_uid',
    kind: 'neutral',
    capturedAt: 1,
  };
  assert.equal(isPlayerIndependentNationHold(hold), true);
  assert.equal(resolvePlayerIndependentOccupierClanId(hold), PLAYER_CLAN);
  assert.equal(resolveTerritorialSideForHold(hold, clans), 'independent');
  assert.equal(resolveEffectiveMapOccupierClanId('neutral_p', hold), PLAYER_CLAN);
});

test('migrate neutral legacy hold → player_independent', () => {
  const hold: PlanetClanHold = {
    planetId: 'neutral_p',
    systemId: 'neutral_sys',
    occupierClanId: 'neutral',
    deedOwnerClanId: PLAYER_CLAN,
    homePlayerUid: 'test_uid',
    kind: 'neutral',
    capturedAt: 1,
  };
  const migrated = migrateExistingPlayerDeedHoldToIndependent(hold);
  assert.equal(migrated.changed, true);
  assert.equal(migrated.hold.kind, 'player_independent');
  assert.equal(migrated.hold.occupierClanId, PLAYER_CLAN);
});

test('migrate nation seed legacy hold still works', () => {
  const hold: PlanetClanHold = {
    planetId: 'blue_p',
    systemId: 'blue_sys',
    occupierClanId: ARC_CORE_SEED_BLUE_CLAN_ID,
    deedOwnerClanId: PLAYER_CLAN,
    homePlayerUid: 'test_uid',
    kind: 'clan_hold',
    capturedAt: 1,
  };
  const migrated = migrateExistingPlayerDeedHoldToIndependent(hold);
  assert.equal(migrated.changed, true);
  assert.equal(migrated.hold.kind, 'player_independent');
  assert.equal(migrated.hold.occupierClanId, PLAYER_CLAN);
});

console.log('All planetOwnershipModel tests passed.');
