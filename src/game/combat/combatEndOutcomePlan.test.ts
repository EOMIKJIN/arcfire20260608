/**
 * 전투 종료 출력 순서 계약 — venue·outcome 무관하게 «같은 순서»
 * npx tsx --test src/game/combat/combatEndOutcomePlan.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
  COMBAT_END_OUTCOME_STEPS,
  planCombatEndOutcomeSteps,
} from './combatEndOutcomePlan';

test('canonical order is result -> missionClear -> levelUp -> notice -> backchannel', () => {
  assert.deepEqual([...COMBAT_END_OUTCOME_STEPS], [
    'result',
    'missionClear',
    'levelUp',
    'notice',
    'backchannel',
  ]);
});

test('full chain keeps canonical order', () => {
  assert.deepEqual(
    planCombatEndOutcomeSteps({ hasNotice: true, hasBackchannel: true }),
    ['result', 'missionClear', 'levelUp', 'notice', 'backchannel'],
  );
});

test('optional steps drop out without reordering the rest', () => {
  assert.deepEqual(planCombatEndOutcomeSteps({}), ['result', 'missionClear', 'levelUp']);
  assert.deepEqual(
    planCombatEndOutcomeSteps({ hasBackchannel: true }),
    ['result', 'missionClear', 'levelUp', 'backchannel'],
  );
  assert.deepEqual(
    planCombatEndOutcomeSteps({ hasNotice: true }),
    ['result', 'missionClear', 'levelUp', 'notice'],
  );
});

test('missionClear can be disabled (defeat paths) without affecting order', () => {
  assert.deepEqual(
    planCombatEndOutcomeSteps({ missionClearEnabled: false, hasNotice: true }),
    ['result', 'levelUp', 'notice'],
  );
});

test('stopAfterResult skips mission and later extras (RED leave before mission)', () => {
  assert.deepEqual(
    planCombatEndOutcomeSteps({
      stopAfterResult: true,
      hasNotice: true,
      hasBackchannel: true,
    }),
    ['result', 'levelUp'],
  );
});

test('stopAfterLevelUp keeps mission then short-circuits extras (RED eviction)', () => {
  assert.deepEqual(
    planCombatEndOutcomeSteps({
      stopAfterLevelUp: true,
      hasNotice: true,
      hasBackchannel: true,
    }),
    ['result', 'missionClear', 'levelUp'],
  );
});

test('planned subsequence always follows the canonical order', () => {
  const combos = [
    {},
    { hasNotice: true },
    { hasBackchannel: true },
    { hasNotice: true, hasBackchannel: true },
    { missionClearEnabled: false },
    { missionClearEnabled: false, hasBackchannel: true },
    { stopAfterResult: true },
    { stopAfterLevelUp: true },
  ];
  for (const combo of combos) {
    const plan = planCombatEndOutcomeSteps(combo);
    const indices = plan.map((s) => COMBAT_END_OUTCOME_STEPS.indexOf(s));
    const sorted = [...indices].sort((a, b) => a - b);
    assert.deepEqual(indices, sorted, `out of order for ${JSON.stringify(combo)}`);
  }
});

test('flow module has no polling loop — chain is callback driven', () => {
  const src = readFileSync(resolve(__dirname, 'runCombatEndOutcomeFlow.ts'), 'utf8');
  assert.doesNotMatch(src, /while\s*\(/);
  assert.doesNotMatch(src, /setInterval/);
  assert.match(src, /onClose/);
  assert.doesNotMatch(src, /runAfterIngameDialogIdle\(/);
  assert.match(src, /runAfterIngameDialogIdleNow\(runMissionClear\)/);
  assert.match(src, /setCombatEndOutcomeHold\(true\)/);
  assert.match(src, /if \(resultClosed\) return/);
  assert.match(
    src,
    /onClose: \(\) => \{\s*if \(resultClosed\) return;\s*resultClosed = true;/,
  );
});
