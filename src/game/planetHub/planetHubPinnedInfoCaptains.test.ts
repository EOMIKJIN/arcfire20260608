/**
 * npx tsx --test src/game/planetHub/planetHubPinnedInfoCaptains.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPinnedInfoPrimaryLabel, resolvePinnedInfoMark } from './nearbyPresenceContract';
import { mergePinnedHubInfoRows } from './mergePinnedHubInfoRows';
import { applyQuestInfoMarkFlagsToRows, isCaptainHintPresentInHubSystem } from './hubInfoSystemPresence';
import type { NearbyInfoDetailRow } from './nearbyPresenceDisplay';

function row(partial: Partial<NearbyInfoDetailRow> & Pick<NearbyInfoDetailRow, 'keySlot' | 'captainId'>): NearbyInfoDetailRow {
  return {
    line: partial.captainId ?? '',
    captainName: partial.captainId ?? '',
    shipLabel: '',
    action: { kind: 'dialog' },
    ...partial,
  };
}

test('merge — 총사령관·퀘스트가 체류 목록 앞, 동일 함장 중복 제거', () => {
  const orbit = [
    row({ keySlot: 0, captainId: 'npc_cpt_orbit' }),
    row({ keySlot: 1, captainId: 'npc_cpt_arcadia_lane_01' }),
  ];
  const pinned = [
    row({
      keySlot: -2,
      captainId: 'npc_cpt_arcadia_lane_01',
      pinKind: 'governor',
      commGuaranteed: true,
    }),
    row({
      keySlot: -20,
      captainId: 'npc_cpt_story',
      pinKind: 'quest',
      commGuaranteed: true,
    }),
  ];
  const merged = mergePinnedHubInfoRows(orbit, pinned);
  assert.equal(merged.length, 3);
  assert.equal(merged[0]?.captainId, 'npc_cpt_arcadia_lane_01');
  assert.equal(merged[0]?.pinKind, 'governor');
  assert.equal(merged[0]?.commGuaranteed, true);
  assert.equal(merged[1]?.captainId, 'npc_cpt_story');
  assert.equal(merged[2]?.captainId, 'npc_cpt_orbit');
});

test('성계 필터 — 타 성계 퀘스트 NPC 제외 · 이 성계 체류·고향·바만', () => {
  const systemOf = (planetId: string) => {
    if (planetId === 'arcadia_prime') return 'arcadia';
    if (planetId === 'solar_station') return 'solar';
    return null;
  };
  assert.equal(
    isCaptainHintPresentInHubSystem(
      'arcadia_prime',
      'arcadia',
      { presenceActivity: 'orbit_table_patrol', presencePlanetId: 'arcadia_prime', presenceSystemId: 'arcadia' },
      systemOf,
    ),
    true,
  );
  assert.equal(
    isCaptainHintPresentInHubSystem(
      'arcadia_prime',
      'arcadia',
      { presenceActivity: 'bar_host', presencePlanetId: 'solar_station', presenceSystemId: 'solar' },
      systemOf,
    ),
    false,
  );
  assert.equal(
    isCaptainHintPresentInHubSystem(
      'solar_station',
      'solar',
      { presenceActivity: 'off_world', basePlanetId: 'solar_station', barPlanetIds: ['solar_station'] },
      systemOf,
    ),
    true,
  );
  assert.equal(
    isCaptainHintPresentInHubSystem(
      'arcadia_prime',
      'arcadia',
      { presenceActivity: 'off_world', basePlanetId: 'solar_station', barPlanetIds: ['solar_station'] },
      systemOf,
    ),
    false,
  );
  assert.equal(
    isCaptainHintPresentInHubSystem(
      'solar_station',
      'solar',
      { presenceActivity: 'off_world', basePlanetId: 'arcadia_prime', activityPlanetIds: ['solar_station'] },
      systemOf,
    ),
    true,
  );
});

test('applyQuestInfoMarkFlagsToRows — 퀘스트 NPC만 레일 · 메인 M · 서브 S', () => {
  const rows = [
    row({ keySlot: 0, captainId: 'npc_cpt_story' }),
    row({ keySlot: 1, captainId: 'npc_cpt_sandbox' }),
    row({ keySlot: 2, captainId: 'npc_cpt_side' }),
    row({ keySlot: 3, captainId: 'npc_cpt_orbit' }),
  ];
  const stamped = applyQuestInfoMarkFlagsToRows(rows, {
    assignedQuestIds: new Set(['npc_cpt_story', 'npc_cpt_sandbox', 'npc_cpt_side']),
    mainQuestIds: new Set(['npc_cpt_story']),
    subQuestIds: new Set(['npc_cpt_sandbox', 'npc_cpt_side']),
    configuredQuestIds: new Set(['npc_cpt_configured']),
  });
  assert.equal(stamped[0]?.showQuestMarks, true);
  assert.equal(stamped[0]?.hasMainQuest, true);
  assert.equal(stamped[0]?.hasSubQuest, false);
  assert.equal(stamped[1]?.showQuestMarks, true);
  assert.equal(stamped[1]?.hasMainQuest, false);
  assert.equal(stamped[1]?.hasSubQuest, true);
  assert.equal(stamped[2]?.showQuestMarks, true);
  assert.equal(stamped[2]?.hasMainQuest, false);
  assert.equal(stamped[2]?.hasSubQuest, true);
  assert.equal(stamped[3]?.showQuestMarks, false);
  assert.equal(stamped[3]?.hasMainQuest, false);
  assert.equal(stamped[3]?.hasSubQuest, false);

  const configuredOnly = applyQuestInfoMarkFlagsToRows(
    [row({ keySlot: 3, captainId: 'npc_cpt_configured' })],
    {
      assignedQuestIds: new Set(),
      mainQuestIds: new Set(),
      subQuestIds: new Set(),
      configuredQuestIds: new Set(['npc_cpt_configured']),
    },
  );
  assert.equal(configuredOnly[0]?.showQuestMarks, true);
  assert.equal(configuredOnly[0]?.hasMainQuest, false);
  assert.equal(configuredOnly[0]?.hasSubQuest, false);

  const sideOnly = applyQuestInfoMarkFlagsToRows(
    [row({ keySlot: 4, captainId: 'npc_cpt_sq_orren_bask' })],
    {
      assignedQuestIds: new Set(),
      mainQuestIds: new Set(),
      subQuestIds: new Set(['npc_cpt_sq_orren_bask']),
      configuredQuestIds: new Set(),
    },
  );
  assert.equal(sideOnly[0]?.showQuestMarks, true);
  assert.equal(sideOnly[0]?.hasSubQuest, true);
  assert.equal(sideOnly[0]?.hasMainQuest, false);
});

test('compact label — 총사령관 마크 없음 · 퀘스트 ◈', () => {
  assert.equal(resolvePinnedInfoMark('governor'), null);
  assert.equal(resolvePinnedInfoMark('quest'), '◈');
  assert.equal(resolvePinnedInfoMark(undefined), null);
  assert.equal(formatPinnedInfoPrimaryLabel('governor', '엘렌 드 코르'), '엘렌 드 코르');
  assert.equal(formatPinnedInfoPrimaryLabel('quest', '엘렌 드 코르'), '◈ 엘렌 드 코르');
  assert.equal(formatPinnedInfoPrimaryLabel(undefined, '궤도함장'), '궤도함장');
});
