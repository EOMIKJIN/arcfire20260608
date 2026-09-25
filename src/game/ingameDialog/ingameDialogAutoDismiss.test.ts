/**
 * 보고형 인게임 대화 자동 닫힘 — 마지막 페이지 vs 첫 창 무입력
 * npx tsx --test src/game/ingameDialog/ingameDialogAutoDismiss.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
  COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
  isFirstIngameDialogWindow,
  resolveSessionAutoDismissKey,
  resolveSessionAutoDismissMode,
  resolveSessionAutoDismissMs,
  shouldArmSessionAutoDismiss,
} from './ingameDialogAutoDismiss';

test('csv combat-end operator session resolves 40s key', () => {
  const session = {
    kind: 'csv_scene' as const,
    sceneId: 'ingame_dialog_wave_defense_end',
    pageIndex: 0,
    segmentIndex: 0,
    pageComplete: false,
    completionActions: [],
    context: {},
    autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
  };
  assert.equal(resolveSessionAutoDismissMs(session), 40_000);
  assert.equal(resolveSessionAutoDismissKey(session), 'csv:ingame_dialog_wave_defense_end');
  assert.equal(resolveSessionAutoDismissMode(session), 'final_page');
});

test('adhoc combat-end operator session resolves 40s key', () => {
  const session = {
    kind: 'adhoc' as const,
    adhocId: 'adhoc_1',
    segmentIndex: 0,
    pageComplete: true,
    payload: {
      label: '[ 안내 오퍼레이터 ]',
      text: '전투가 종료되었습니다.',
      autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
    },
  };
  assert.equal(resolveSessionAutoDismissMs(session), 40_000);
  assert.equal(resolveSessionAutoDismissKey(session), 'adhoc:adhoc_1');
});

test('missing or zero autoDismissMs stays manual', () => {
  assert.equal(resolveSessionAutoDismissMs(null), 0);
  assert.equal(
    resolveSessionAutoDismissMs({
      kind: 'csv_scene',
      sceneId: 'npc_dialog_operator_stella',
      pageIndex: 0,
      segmentIndex: 0,
      pageComplete: false,
      completionActions: [],
      context: {},
    }),
    0,
  );
});

test('combat-end final_page arms only after last page is complete', () => {
  const session = {
    kind: 'csv_scene' as const,
    sceneId: 'ingame_dialog_wave_defense_end',
    pageIndex: 1,
    segmentIndex: 0,
    pageComplete: true,
    completionActions: [],
    context: {},
    autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
  };
  assert.equal(shouldArmSessionAutoDismiss(session, false), false);
  assert.equal(
    shouldArmSessionAutoDismiss({ ...session, pageComplete: false }, true),
    false,
  );
  assert.equal(shouldArmSessionAutoDismiss(session, true), true);
});

test('ready=false does not arm auto-dismiss before the window opens', () => {
  const session = {
    kind: 'csv_scene' as const,
    sceneId: 'arc_core_spy_intel_alert',
    pageIndex: 0,
    segmentIndex: 0,
    pageComplete: false,
    ready: false,
    completionActions: [],
    context: {},
    autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
    autoDismissMode: 'first_idle' as const,
  };
  assert.equal(shouldArmSessionAutoDismiss(session, false), false);
  assert.equal(shouldArmSessionAutoDismiss({ ...session, ready: true }, false), true);
});

test('spy first_idle arms on first window without waiting for typewriter', () => {
  const session = {
    kind: 'csv_scene' as const,
    sceneId: 'arc_core_spy_intel_alert',
    pageIndex: 0,
    segmentIndex: 0,
    pageComplete: false,
    completionActions: [],
    context: {},
    autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
    autoDismissMode: 'first_idle' as const,
  };
  assert.equal(resolveSessionAutoDismissMode(session), 'first_idle');
  assert.equal(isFirstIngameDialogWindow(session), true);
  assert.equal(shouldArmSessionAutoDismiss(session, false), true);
  assert.equal(
    shouldArmSessionAutoDismiss({ ...session, pageIndex: 1 }, false),
    false,
  );
  assert.equal(
    shouldArmSessionAutoDismiss({ ...session, segmentIndex: 1 }, false),
    false,
  );
});

test('spy intel present wires 40s first_idle', () => {
  const src = readFileSync(resolve(__dirname, '../planetHubSpyIntelDialog.ts'), 'utf8');
  assert.match(src, /autoDismissMs:\s*COMBAT_END_OPERATOR_AUTO_DISMISS_MS/);
  assert.match(src, /autoDismissMode:\s*'first_idle'/);
});

test('operator inbound first comm auto-pops 40s first_idle', () => {
  const src = readFileSync(
    resolve(__dirname, '../conversation/presentOperatorInboundFirstComm.ts'),
    'utf8',
  );
  assert.match(src, /autoDismissMs:\s*COMBAT_END_OPERATOR_AUTO_DISMISS_MS/);
  assert.match(src, /autoDismissMode:\s*'first_idle'/);
});

test('cancel queued idle presents does not run them', () => {
  const { runAfterIngameDialogIdle, cancelQueuedIngameDialogIdlePresents } =
    require('./ingameDialogIdle') as typeof import('./ingameDialogIdle');
  let ran = 0;
  runAfterIngameDialogIdle(() => {
    ran += 1;
  });
  cancelQueuedIngameDialogIdlePresents();
  assert.equal(ran, 0);
});
