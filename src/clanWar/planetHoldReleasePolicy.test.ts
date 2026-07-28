/**
 * 계정 초기화 시 소유권 구매 성계 중립화 — unit tests
 * npx tsx --test src/clanWar/planetHoldReleasePolicy.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { releasePlayerPlanetHolds } from './planetHoldReleasePolicy';
import { applyPlanetOccupationSeedPipeline } from './planetOccupationSeedPipeline';
import { canPurchasePlanetOwnershipDeed } from './planetOwnershipModel';
import type { ClanBasicsRecord, PlanetClanHold } from '../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const PLAYER_CLAN_ID = 'solo_clan_test_player_1';
const PLAYER_UID = 'uid_test_player_1';

function playerIndependentHold(planetId: string, systemId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId: PLAYER_CLAN_ID,
    deedOwnerClanId: PLAYER_CLAN_ID,
    homePlayerUid: PLAYER_UID,
    kind: 'player_independent',
    capturedAt: 1000,
  };
}

function nationSeedHold(planetId: string, systemId: string, clanId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId: clanId,
    deedOwnerClanId: null,
    homePlayerUid: null,
    kind: 'clan_hold',
    capturedAt: 1,
  };
}

const PLAYER_CLAN_RECORD: ClanBasicsRecord = {
  id: PLAYER_CLAN_ID,
  displayName: '테스트 플레이어 함대',
  leaderUid: PLAYER_UID,
  megaFactionId: 'mega_stellium_alliance',
  createdAt: 0,
  ext: {},
};

/** purgeLocalAccountData 실제 순서 재현 — purge_account → 시드 파이프라인 → purge_all_non_ai → 시드 파이프라인 */
function runFullPurgeSequence(input: {
  holds: Record<string, PlanetClanHold>;
  clans: Record<string, ClanBasicsRecord>;
  uid: string;
}): { holds: Record<string, PlanetClanHold>; clans: Record<string, ClanBasicsRecord> } {
  const removedClanIds = new Set<string>([PLAYER_CLAN_ID]);
  const remainingClanIdsAfterAccount = new Set(
    Object.keys(input.clans).filter((id) => id !== PLAYER_CLAN_ID),
  );

  const step1 = releasePlayerPlanetHolds({
    holds: input.holds,
    removedClanIds,
    remainingClanIds: remainingClanIdsAfterAccount,
    uid: input.uid,
    mode: 'purge_account',
  });
  const nextClansAfterAccount = { ...input.clans };
  delete nextClansAfterAccount[PLAYER_CLAN_ID];
  const piped1 = applyPlanetOccupationSeedPipeline(step1.holds, nextClansAfterAccount);

  const nonAiClanIds = new Set(Object.keys(piped1.clans).filter((id) => !id.startsWith('ai_clan_')));
  const step2 = releasePlayerPlanetHolds({
    holds: piped1.holds,
    removedClanIds: nonAiClanIds,
    remainingClanIds: new Set(Object.keys(piped1.clans).filter((id) => id.startsWith('ai_clan_'))),
    mode: 'purge_all_non_ai',
  });
  const piped2 = applyPlanetOccupationSeedPipeline(step2.holds, piped1.clans);

  return { holds: piped2.holds, clans: piped2.clans };
}

test('M1: draco_haven(독립국, BLUE 시드 planetId) purge 후 neutral + neutralizedAt(BLUE 복귀 아님)', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: playerIndependentHold('draco_haven', 'draco_nebula'),
  };
  const clans = { [PLAYER_CLAN_ID]: PLAYER_CLAN_RECORD };
  const result = runFullPurgeSequence({ holds, clans, uid: PLAYER_UID });
  const hold = result.holds.draco_haven;
  assert.ok(hold);
  assert.equal(hold!.occupierClanId, 'neutral');
  assert.equal(hold!.kind, 'neutral');
  assert.equal(hold!.deedOwnerClanId, null);
  assert.equal(hold!.homePlayerUid, null);
  assert.ok(hold!.neutralizedAt && hold!.neutralizedAt > 0, 'neutralizedAt 설정돼야 함');
});

test('M1: sirius_border(독립국, RED 시드 planetId) purge 후 neutral + neutralizedAt(RED 복귀 아님)', () => {
  const holds: Record<string, PlanetClanHold> = {
    sirius_border: playerIndependentHold('sirius_border', 'sirius'),
  };
  const clans = { [PLAYER_CLAN_ID]: PLAYER_CLAN_RECORD };
  const result = runFullPurgeSequence({ holds, clans, uid: PLAYER_UID });
  const hold = result.holds.sirius_border;
  assert.ok(hold);
  assert.equal(hold!.occupierClanId, 'neutral');
  assert.equal(hold!.kind, 'neutral');
  assert.ok(hold!.neutralizedAt && hold!.neutralizedAt > 0);

  // 재구매 거부(red_territory) 구멍 해소 확인 — neutral이라 blue/neutral/independent 허용 분기로 진입
  const check = canPurchasePlanetOwnershipDeed(
    'sirius_border',
    hold,
    'solo_clan_new_owner',
    'mega_stellium_alliance',
    result.clans,
  );
  assert.notEqual(check.ok === false && check.reason, 'red_territory');
});

test('M1: 연타(재-purge) 안전망 — 이미 neutral+neutralizedAt인 hold는 재차 purge_all_non_ai를 돌려도 그대로 유지', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: playerIndependentHold('draco_haven', 'draco_nebula'),
  };
  const clans = { [PLAYER_CLAN_ID]: PLAYER_CLAN_RECORD };
  const once = runFullPurgeSequence({ holds, clans, uid: PLAYER_UID });

  // 두 번째 purge_all_non_ai 연타 — 플레이어 클랜이 이미 없는 상태에서 재실행해도 neutral 유지
  const secondRelease = releasePlayerPlanetHolds({
    holds: once.holds,
    removedClanIds: new Set(Object.keys(once.clans).filter((id) => !id.startsWith('ai_clan_'))),
    remainingClanIds: new Set(Object.keys(once.clans).filter((id) => id.startsWith('ai_clan_'))),
    mode: 'purge_all_non_ai',
  });
  const secondPiped = applyPlanetOccupationSeedPipeline(secondRelease.holds, once.clans);
  const hold = secondPiped.holds.draco_haven;
  assert.equal(hold!.occupierClanId, 'neutral');
  assert.equal(hold!.kind, 'neutral');
});

test('M2: 인접 국가 시드 hold(iron_remnant BLUE)는 purge_all_non_ai에 불변', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: playerIndependentHold('draco_haven', 'draco_nebula'),
    iron_remnant: nationSeedHold('iron_remnant', 'iron_cross', 'balance_seed_faction_blue'),
  };
  const clans = { [PLAYER_CLAN_ID]: PLAYER_CLAN_RECORD };
  const result = runFullPurgeSequence({ holds, clans, uid: PLAYER_UID });
  const ironHold = result.holds.iron_remnant;
  assert.ok(ironHold);
  assert.equal(ironHold!.occupierClanId, 'balance_seed_faction_blue');
  assert.equal(ironHold!.kind, 'clan_hold');
  assert.equal(ironHold!.neutralizedAt ?? null, null, 'iron_remnant는 중립화 마커도 새로 생기면 안 됨');
});

test('M5: dissolve_clan(클랜 해산 아이템 구매) 경로도 동일하게 중립화 — restoreHoldAfterPlayerRelease 공유라 자동 일치', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: playerIndependentHold('draco_haven', 'draco_nebula'),
  };
  const removedClanIds = new Set([PLAYER_CLAN_ID]);
  const released = releasePlayerPlanetHolds({
    holds,
    removedClanIds,
    remainingClanIds: new Set(),
    uid: PLAYER_UID,
    mode: 'dissolve_clan',
  });
  const hold = released.holds.draco_haven;
  assert.ok(hold);
  assert.equal(hold!.occupierClanId, 'neutral');
  assert.equal(hold!.kind, 'neutral');
  assert.ok(hold!.neutralizedAt);
});

test('M4: planetHoldReleasePolicy.ts에 draco_haven/sirius_border 등 planetId 하드코딩 분기 없음', () => {
  const src = readFileSync(resolve(__dirname, 'planetHoldReleasePolicy.ts'), 'utf8');
  const hardcodePattern = /planetId\s*===\s*['"](draco_haven|sirius_border)['"]/;
  assert.equal(hardcodePattern.test(src), false);
});

console.log('[planetHoldReleasePolicy] all tests passed');
