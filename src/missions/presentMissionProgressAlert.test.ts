import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import {
  buildMissionProgressAlertCopy,
  resolveNewlyActivatedMissionId,
} from './missionProgressAlertCopy';

test('step copy includes completed objective and next section', () => {
  const copy = buildMissionProgressAlertCopy({
    kind: 'step',
    missionTitle: '첫 비행',
    completedObjectiveText: '베가 전초기지로 이동',
    nextObjectiveText: '지휘관 마코프와 대화',
  });
  assert.equal(copy.title, '미션 업데이트');
  assert.match(copy.message, /첫 비행/);
  assert.match(copy.message, /베가 전초기지로 이동/);
  assert.equal(copy.messageSection?.label, '다음 목표');
  assert.equal(copy.messageSection?.text, '지휘관 마코프와 대화');
});

test('step copy omits next section when mission has no remaining objective', () => {
  const copy = buildMissionProgressAlertCopy({
    kind: 'step',
    missionTitle: '해적 소탕',
    completedObjectiveText: '해적 1척 격파',
    nextObjectiveText: null,
  });
  assert.equal(copy.messageSection, undefined);
});

test('complete copy includes next mission section when chain advanced', () => {
  const copy = buildMissionProgressAlertCopy({
    kind: 'complete',
    missionTitle: '첫 비행',
    nextMissionTitle: '해적 소탕',
  });
  assert.equal(copy.title, '미션 업데이트');
  assert.match(copy.message, /첫 비행/);
  assert.equal(copy.messageSection?.label, '다음 미션');
  assert.match(copy.messageSection?.text ?? '', /해적 소탕/);
});

test('resolveNewlyActivatedMissionId only returns a freshly activated mission', () => {
  const completed: MissionProgress = {
    missionId: 'story_a',
    status: 'complete',
    objectives: {},
  };
  const already: MissionProgress = {
    missionId: 'sandbox_x',
    status: 'active',
    objectives: {},
  };
  const fresh: MissionProgress = {
    missionId: 'story_b',
    status: 'active',
    objectives: {},
  };
  const before = { story_a: completed, sandbox_x: already };
  assert.equal(
    resolveNewlyActivatedMissionId('story_a', before, { ...before, story_b: fresh }, 'story_b'),
    'story_b',
  );
  assert.equal(
    resolveNewlyActivatedMissionId('story_a', before, { ...before, story_a: completed }, 'sandbox_x'),
    null,
  );
  assert.equal(
    resolveNewlyActivatedMissionId('story_a', before, { ...before, story_a: completed }, 'story_a'),
    null,
  );
});
