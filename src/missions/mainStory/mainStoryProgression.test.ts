import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../../types';
import {
  MAIN_STORY_BRANCHES_FROM_CSV,
  MAIN_STORY_CHAPTERS_FROM_CSV,
  MAIN_STORY_QUESTS_FROM_CSV,
} from '../../data/generated';
import {
  formatMainStoryBranchQuestId,
  formatMainStoryChapterId,
  formatMainStoryQuestId,
  MAIN_STORY_BRANCH_SLOTS_PER_CHAPTER,
  MAIN_STORY_CHAPTER_COUNT,
  MAIN_STORY_SPINE_QUESTS_PER_CHAPTER,
} from './mainStoryIds';
import {
  getMainStoryQuest,
  listEffectiveMainStoryChainSteps,
  listMainStorySpineQuests,
} from './mainStoryCatalog';
import {
  pickEnabledMainStoryBranch,
  resolveCurrentMainStoryOfferMissionId,
  resolveCurrentMainStoryQuest,
  resolveMainStoryAfterBindMissionComplete,
  resolveMainStoryNextQuest,
} from './resolveMainStoryProgression';

test('reserves 10 chapters × 30 spine + 4 branch slots with unique ids', () => {
  assert.equal(MAIN_STORY_CHAPTERS_FROM_CSV.length, MAIN_STORY_CHAPTER_COUNT);
  const spine = MAIN_STORY_QUESTS_FROM_CSV.filter((q) => q.questKind === 'spine');
  const branch = MAIN_STORY_QUESTS_FROM_CSV.filter((q) => q.questKind === 'branch');
  assert.equal(spine.length, MAIN_STORY_CHAPTER_COUNT * MAIN_STORY_SPINE_QUESTS_PER_CHAPTER);
  assert.equal(branch.length, MAIN_STORY_CHAPTER_COUNT * MAIN_STORY_BRANCH_SLOTS_PER_CHAPTER);
  const ids = new Set(MAIN_STORY_QUESTS_FROM_CSV.map((q) => q.questId));
  assert.equal(ids.size, MAIN_STORY_QUESTS_FROM_CSV.length);
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 1))?.bindMissionId, 'story_001');
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 1))?.contentStatus, 'ready');
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 2))?.contentStatus, 'ready');
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 2))?.bindMissionId, 'story_002');
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 6))?.contentStatus, 'ready');
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 6))?.bindMissionId, 'story_006');
  assert.equal(getMainStoryQuest(formatMainStoryQuestId(1, 7))?.contentStatus, 'skeleton');
  assert.equal(listMainStorySpineQuests(formatMainStoryChapterId(1)).length, 30);
  assert.ok(getMainStoryQuest(formatMainStoryBranchQuestId(1, 1)));
});

test('default next walks spine and chapter closer goes to next chapter q01', () => {
  const q01 = resolveMainStoryNextQuest('story_c01_q01');
  assert.equal(q01.nextQuestId, 'story_c01_q02');
  assert.equal(q01.reason, 'default');
  const close = resolveMainStoryNextQuest('story_c01_q30');
  assert.equal(close.nextQuestId, 'story_c02_q01');
  assert.equal(close.reason, 'chapter_end');
  assert.equal(close.chapterEnded, true);
  const last = resolveMainStoryNextQuest('story_c10_q30');
  assert.equal(last.nextQuestId, null);
  assert.equal(last.reason, 'campaign_end');
  assert.equal(last.campaignEnded, true);
});

test('disabled sample branches do not override default next', () => {
  assert.ok(MAIN_STORY_BRANCHES_FROM_CSV.some((b) => b.id === 'br_sample_c01_flag_a' && !b.enabled));
  const next = resolveMainStoryNextQuest('story_c01_q05', { sample_path_a: '1' });
  assert.equal(next.nextQuestId, 'story_c01_q06');
  assert.equal(next.reason, 'default');
  assert.equal(next.usedBranchId, null);
});

test('pickEnabledMainStoryBranch honors enabled+flag only', () => {
  const rows = [
    {
      enabled: false,
      conditionKind: 'flag',
      conditionValue: 'sample_path_a',
    },
    {
      enabled: true,
      conditionKind: 'flag',
      conditionValue: 'sample_path_a',
    },
  ];
  assert.equal(pickEnabledMainStoryBranch(rows, {}), -1);
  assert.equal(pickEnabledMainStoryBranch(rows, { sample_path_a: '1' }), 1);
});

test('open offer is story_001 until it completes; then story_002', () => {
  assert.equal(resolveCurrentMainStoryOfferMissionId({}), 'story_001');
  const progresses: Record<string, MissionProgress> = {
    story_001: { missionId: 'story_001', status: 'complete', objectives: {} },
  };
  const current = resolveCurrentMainStoryQuest(progresses);
  assert.equal(current?.questId, 'story_c01_q02');
  assert.equal(resolveCurrentMainStoryOfferMissionId(progresses), 'story_002');
});

test('q01 complete offers q02 bind; q02 is one ready chain step', () => {
  const progresses: Record<string, MissionProgress> = {
    story_001: { missionId: 'story_001', status: 'complete', objectives: {} },
  };
  const after = resolveMainStoryAfterBindMissionComplete('story_001', progresses);
  assert.equal(after.completedQuestId, 'story_c01_q01');
  assert.equal(after.nextQuestId, 'story_c01_q02');
  assert.equal(after.nextBindMissionId, 'story_002');
  assert.equal(listEffectiveMainStoryChainSteps('story_c01_q02').length, 1);
});

test('q06 complete stops at q07 skeleton', () => {
  const progresses: Record<string, MissionProgress> = {
    story_001: { missionId: 'story_001', status: 'complete', objectives: {} },
    story_002: { missionId: 'story_002', status: 'complete', objectives: {} },
    story_003: { missionId: 'story_003', status: 'complete', objectives: {} },
    story_004: { missionId: 'story_004', status: 'complete', objectives: {} },
    story_005: { missionId: 'story_005', status: 'complete', objectives: {} },
    story_006: { missionId: 'story_006', status: 'complete', objectives: {} },
  };
  const after = resolveMainStoryAfterBindMissionComplete('story_006', progresses);
  assert.equal(after.completedQuestId, 'story_c01_q06');
  assert.equal(after.nextQuestId, 'story_c01_q07');
  assert.equal(after.nextBindMissionId, null);
  assert.equal(resolveCurrentMainStoryOfferMissionId(progresses), null);
});
