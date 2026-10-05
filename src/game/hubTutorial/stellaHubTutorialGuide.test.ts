/**
 * npx tsx --test src/game/hubTutorial/stellaHubTutorialGuide.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  STELLA_HUB_TUTORIAL_SCENE_IDS as S,
  isStellaHubTutorialAwaitingTalk,
  isStellaHubTutorialComplete,
  isStellaHubTutorialInProgress,
  resolveStellaHubTutorialPresent,
} from './stellaHubTutorialGuideLogic';

test('A1 dismiss → 통신두절 E1→E2. A2를 이미 본 저장만 채굴 체인', () => {
  const a1 = [S.a1];
  const e1 = resolveStellaHubTutorialPresent('a1_dismissed', a1);
  assert.equal(e1?.sceneId, S.e1);
  assert.equal(e1?.chainOnDismiss, 'e2');
  const afterE1 = [...a1, S.e1];
  const e2 = resolveStellaHubTutorialPresent('hub_focused', afterE1);
  assert.equal(e2?.sceneId, S.e2);
  assert.equal(e2?.chainOnDismiss, 'start_opening_raid');
  assert.equal(resolveStellaHubTutorialPresent('hub_focused', [...afterE1, S.e2]), null);
  assert.equal(
    resolveStellaHubTutorialPresent('hub_focused', [...afterE1, S.e2, S.e3])?.sceneId,
    S.a2,
  );
  const a2 = [S.a1, S.a2];
  assert.equal(resolveStellaHubTutorialPresent('mine_started', a2), null);
  assert.equal(resolveStellaHubTutorialPresent('mine_granted', a2)?.sceneId, S.a3);
  assert.equal(resolveStellaHubTutorialPresent('mine_granted', a2)?.chainOnDismiss, 'a4');
  const a4 = [...a2, S.a3, S.a4];
  assert.equal(resolveStellaHubTutorialPresent('sold', a4)?.sceneId, S.a5);
  const a5 = [...a4, S.a5];
  assert.equal(resolveStellaHubTutorialPresent('shipyard_opened', a5)?.sceneId, S.b1);
});

test('조선소 복귀 → C1, 대화 본기능 후 → C2, 바 열람 후 허브 → D1→D2', () => {
  const afterYard = [S.a1, S.a2, S.a3, S.a4, S.a5, S.b1];
  assert.equal(isStellaHubTutorialAwaitingTalk(afterYard), true);
  assert.equal(resolveStellaHubTutorialPresent('hub_focused', afterYard)?.sceneId, S.c1);
  assert.equal(resolveStellaHubTutorialPresent('talk_started', afterYard)?.markOnly, S.c1);
  const afterTalkReady = [...afterYard, S.c1];
  assert.equal(resolveStellaHubTutorialPresent('talk_started', afterTalkReady), null);
  assert.equal(resolveStellaHubTutorialPresent('talk_done', afterTalkReady)?.sceneId, S.c2);
  const afterC2 = [...afterTalkReady, S.c2];
  assert.equal(resolveStellaHubTutorialPresent('bar_opened', afterC2)?.markOnly, S.barViewed);
  const afterBar = [...afterC2, S.barViewed];
  const d1 = resolveStellaHubTutorialPresent('hub_focused', afterBar);
  assert.equal(d1?.sceneId, S.d1);
  assert.equal(d1?.chainOnDismiss, 'd2');
  const afterD1 = [...afterBar, S.d1];
  const d2 = resolveStellaHubTutorialPresent('hub_focused', afterD1);
  assert.equal(d2?.sceneId, S.d2);
  assert.equal(d2?.chainOnDismiss, 'start_first_mission');
});

test('D2 완료 후 가이드 정지 · 바 수락 차단도 해제', () => {
  const done = [S.a1, S.d2];
  assert.equal(isStellaHubTutorialComplete(done), true);
  assert.equal(isStellaHubTutorialInProgress(done), false);
  assert.equal(resolveStellaHubTutorialPresent('sold', done), null);
  assert.equal(resolveStellaHubTutorialPresent('bar_accept_blocked', done), null);
  assert.equal(resolveStellaHubTutorialPresent('hub_focused', [S.a1])?.sceneId, S.e1);
});

test('바 수락 차단은 C2를 다시 띄운다 · 대화 차단 팝업은 조선소 후에만', () => {
  assert.deepEqual(resolveStellaHubTutorialPresent('bar_accept_blocked', [S.a1]), {
    sceneId: S.c2,
    skipSeenCheck: true,
  });
  assert.equal(resolveStellaHubTutorialPresent('talk_operator_blocked', [S.a1]), null);
  const afterYard = [S.a1, S.a2, S.a3, S.a4, S.a5, S.b1];
  assert.equal(resolveStellaHubTutorialPresent('talk_operator_blocked', afterYard)?.sceneId, S.c1);
  assert.equal(resolveStellaHubTutorialPresent('talk_operator_blocked', [...afterYard, S.c1]), null);
});

test('A1 이전·순서 건너뛰기는 발화하지 않는다', () => {
  assert.equal(resolveStellaHubTutorialPresent('a1_dismissed', []), null);
  assert.equal(resolveStellaHubTutorialPresent('mine_started', [S.a1]), null);
  assert.equal(resolveStellaHubTutorialPresent('mine_granted', [S.a1]), null);
  assert.equal(resolveStellaHubTutorialPresent('sold', [S.a1, S.a2]), null);
  assert.equal(resolveStellaHubTutorialPresent('trade_opened', [S.a1, S.a2, S.a3]), null);
});
