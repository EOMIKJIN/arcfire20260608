/**
 * 이동중 전투 종료 후처리 — IM 영구대기·셸 큐 고착 계약
 * npx tsx --test src/game/transitCombat/transitCombatPostFlow.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const src = readFileSync(resolve(__dirname, './transitCombatPostFlow.ts'), 'utf8');
const leaderSrc = readFileSync(
  resolve(__dirname, '../combat/presentCombatEndLeaderDialog.ts'),
  'utf8',
);
const combatSrc = readFileSync(resolve(__dirname, '../../../app/(game)/combat.tsx'), 'utf8');

test('settle uses runStageUiAfterIdle, not bare runAfterInteractions', () => {
  assert.match(src, /runStageUiAfterIdle/);
  assert.doesNotMatch(src, /InteractionManager\.runAfterInteractions/);
});

test('end dialog and mission clear bypass the worldmap screen shell', () => {
  assert.match(src, /bypassScreenShell:\s*true/);
  assert.match(leaderSrc, /bypassScreenShell:\s*true/);
});

test('overlay / dialog waits have a close deadline', () => {
  assert.match(src, /TRANSIT_OVERLAY_CLOSE_DEADLINE_MS/);
  assert.match(src, /autoDismissMs: ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS/);
  assert.match(leaderSrc, /COMBAT_END_OPERATOR_AUTO_DISMISS_MS \+ 2000/);
});

test('failed presents have a blank-flow abort and tighter waits', () => {
  assert.match(src, /TRANSIT_POST_FLOW_BLANK_ABORT_MS/);
  assert.match(src, /TRANSIT_MISSION_CLEAR_WAIT_MS/);
  assert.match(src, /shouldAbortBlankTransitPostFlow/);
  assert.match(src, /!ok \|\| !isIngameDialogActive\(\)/);
  assert.match(leaderSrc, /COMBAT_END_DIALOG_RETRY_MS/);
});

test('victory result goes through the single combat-end pipeline', () => {
  assert.match(src, /runCombatEndOutcomeFlow/);
  assert.match(src, /venue:\s*'transit'/);
  assert.doesNotMatch(src, /showArcOverlayReward/);
});

test('victory path has one total deadline instead of per-step polling waits', () => {
  assert.match(src, /TRANSIT_POST_FLOW_TOTAL_DEADLINE_MS/);
  assert.match(src, /delayCancellable/);
  assert.match(src, /postFlowCap\.cancel/);
  const victoryBranch = src.slice(src.indexOf("if (payload.kind === 'victory') {\n      // 결과창 이후"));
  const untilReturn = victoryBranch.slice(0, victoryBranch.indexOf('return true;'));
  assert.doesNotMatch(untilReturn, /waitForArcOverlayKindsIdle/);
  assert.doesNotMatch(untilReturn, /presentLevelUpIfPending/);
  assert.doesNotMatch(untilReturn, /presentMissionClearWhenReady/);
});

test('victory uses shared leader defeat dialog', () => {
  assert.match(src, /presentCombatEndLeaderDialog/);
  assert.match(src, /kind:\s*'defeat'/);
});

test('flee dialog uses the shared combat-end adhoc presenter', () => {
  assert.match(src, /presentAdHocCombatEndDialog/);
  assert.doesNotMatch(src, /presentAdHocTransitDialog/);
});

test('transit lose uses the same combat-end pipeline', () => {
  assert.match(combatSrc, /runCombatEndOutcomeFlow/);
  assert.match(combatSrc, /outcome:\s*'lose'/);
  assert.match(combatSrc, /setEndHoldVisible\(false\)/);
});
