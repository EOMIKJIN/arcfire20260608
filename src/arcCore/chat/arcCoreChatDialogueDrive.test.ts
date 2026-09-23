import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_CORE_CHAT_DIALOGUE_MODES,
  resolveArcCoreChatDialogueDrive,
  resolveArcCoreChatStanceFromDrive,
} from './arcCoreChatDialogueDrive';
import { listArcCoreChatModeRows, listArcCoreChatPurposeRows } from './arcCoreChatTableIndex';

const EMPTY_COVERED = {
  greeted: false,
  location: false,
  spy: false,
  combat: false,
  other: false,
};

const FACTS = {
  planetLabel: '아르카디아 프라임',
  spyAlertPending: false,
  hasCombatRecord: false,
};

test('purpose and mode tables list every drive id', () => {
  const purposeIds = new Set(listArcCoreChatPurposeRows().map((row) => row.id));
  const modeIds = new Set(listArcCoreChatModeRows().map((row) => row.id));
  for (const id of [
    'keep_mouth_body',
    'surface_alert',
    'name_self',
    'anchor_location',
    'close_combat',
    'invite_axis',
    'guide_story',
  ]) {
    assert.ok(purposeIds.has(id), id);
  }
  for (const id of ARC_CORE_CHAT_DIALOGUE_MODES) {
    assert.ok(modeIds.has(id), id);
  }
});

test('drive reacts to the asked words and never hijacks to combat or intel', () => {
  const hold = resolveArcCoreChatDialogueDrive({
    intent: 'refuse',
    topicId: 'refuse',
    facts: FACTS,
    alreadyCovered: EMPTY_COVERED,
  });
  assert.equal(hold.mode, 'hold');
  assert.equal(resolveArcCoreChatStanceFromDrive(hold), 'refuse');

  const react = resolveArcCoreChatDialogueDrive({
    intent: 'location',
    topicId: 'location',
    facts: FACTS,
    alreadyCovered: EMPTY_COVERED,
  });
  assert.equal(react.mode, 'react');
  assert.equal(resolveArcCoreChatStanceFromDrive(react), 'observe');

  const greet = resolveArcCoreChatDialogueDrive({
    intent: 'greet',
    topicId: 'greet',
    facts: FACTS,
    alreadyCovered: EMPTY_COVERED,
  });
  assert.equal(greet.mode, 'react');
  assert.equal(greet.nextAsk, '');
  assert.equal(resolveArcCoreChatStanceFromDrive(greet), 'observe');

  const otherWithCombat = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'other',
    facts: { ...FACTS, hasCombatRecord: true },
    alreadyCovered: EMPTY_COVERED,
    userText: '요즘 무슨 일 있어?',
  });
  assert.equal(otherWithCombat.mode, 'clue');
  assert.equal(otherWithCombat.purposeId, 'close_combat');
  assert.equal(otherWithCombat.clueTopic, 'combat');
  assert.equal(otherWithCombat.nextAsk, 'combat');

  const moodStaysHuman = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'smalltalk',
    facts: { ...FACTS, hasCombatRecord: true, spyAlertPending: true, hasTradePort: true },
    alreadyCovered: EMPTY_COVERED,
    userText: '오늘 기분이 어때',
  });
  assert.equal(moodStaysHuman.mode, 'react');
  assert.equal(moodStaysHuman.purposeId, 'invite_axis');
  assert.equal(moodStaysHuman.clueTopic, null);
  assert.equal(moodStaysHuman.nextAsk, '');
  assert.equal(resolveArcCoreChatStanceFromDrive(moodStaysHuman), 'observe');

  const locationWithSpy = resolveArcCoreChatDialogueDrive({
    intent: 'location',
    topicId: 'location',
    facts: { ...FACTS, spyAlertPending: true },
    alreadyCovered: EMPTY_COVERED,
  });
  assert.equal(locationWithSpy.mode, 'react');
  assert.equal(locationWithSpy.purposeId, 'anchor_location');
  assert.equal(locationWithSpy.clueTopic, null);
  assert.equal(resolveArcCoreChatStanceFromDrive(locationWithSpy), 'observe');
  assert.notEqual(resolveArcCoreChatStanceFromDrive(locationWithSpy), 'administer');
});

test('proposal memory never rides greet smalltalk or asked location', () => {
  const facts = {
    ...FACTS,
    hasCombatRecord: true,
    hasTradePort: true,
    lastAcceptedProposalId: 'open_trade',
    pendingProposalId: 'open_trade',
  };
  const mood = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'smalltalk',
    facts,
    alreadyCovered: EMPTY_COVERED,
    userText: '오늘 기분이 어때',
  });
  assert.equal(mood.nextAsk, '');
  assert.equal(mood.clueTopic, null);

  const location = resolveArcCoreChatDialogueDrive({
    intent: 'location',
    topicId: 'location',
    facts,
    alreadyCovered: EMPTY_COVERED,
    userText: '여기 어디야?',
  });
  assert.equal(location.nextAsk, '');
  assert.equal(location.mode, 'react');
});

test('empty axis clues spy then mining then daily and does not administer', () => {
  const spy = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'other',
    facts: { ...FACTS, spyAlertPending: true },
    alreadyCovered: EMPTY_COVERED,
    userText: '요즘 무슨 일 있어?',
  });
  assert.equal(spy.mode, 'clue');
  assert.equal(spy.purposeId, 'surface_alert');
  assert.equal(spy.clueTopic, 'spy');
  assert.equal(resolveArcCoreChatStanceFromDrive(spy), 'warn');
  assert.notEqual(resolveArcCoreChatStanceFromDrive(spy), 'administer');

  const mining = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'other',
    facts: { ...FACTS, miningAllowanceExhausted: true },
    alreadyCovered: EMPTY_COVERED,
    userText: '별일 있어?',
  });
  assert.equal(mining.mode, 'clue');
  assert.equal(mining.clueTopic, 'mining');

  const daily = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'other',
    facts: { ...FACTS, dailyOpsSettledToday: true },
    alreadyCovered: EMPTY_COVERED,
    userText: '요즘 정세는?',
  });
  assert.equal(daily.mode, 'lead');
  assert.equal(daily.clueTopic, 'daily');

  const dailyNoLead = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'other',
    facts: { ...FACTS, dailyOpsSettledToday: true },
    alreadyCovered: EMPTY_COVERED,
    userText: '요즘 정세는?',
    allowLead: false,
  });
  assert.equal(dailyNoLead.mode, 'clue');
  assert.equal(dailyNoLead.clueTopic, 'daily');

  const followUpCombat = resolveArcCoreChatDialogueDrive({
    intent: 'other',
    topicId: 'other',
    facts: { ...FACTS, hasCombatRecord: true },
    alreadyCovered: EMPTY_COVERED,
    followUp: true,
  });
  assert.equal(followUpCombat.mode, 'react');
  assert.equal(followUpCombat.clueTopic, null);
});
