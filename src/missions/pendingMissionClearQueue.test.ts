import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  collectHydratePendingMissionClears,
  enqueuePendingMissionClear,
  emptyPendingMissionClearFields,
  isMissionInClearPipeline,
  MAX_PENDING_MISSION_CLEAR_QUEUE,
  promoteNextPendingMissionClear,
} from './pendingMissionClearQueue';

function slot(missionId: string) {
  return { missionId, sceneId: `clear_${missionId}` };
}

describe('pendingMissionClearQueue', () => {
  it('enqueues the second concurrent clear instead of overwriting', () => {
    const first = enqueuePendingMissionClear(emptyPendingMissionClearFields(), slot('a'));
    const second = enqueuePendingMissionClear(first, slot('b'));
    assert.equal(second.pendingMissionDialogId, 'a');
    assert.equal(second.pendingMissionClearDialog?.missionId, 'a');
    assert.equal(second.pendingMissionClearQueue.length, 1);
    assert.equal(second.pendingMissionClearQueue[0]?.missionId, 'b');
  });

  it('ignores duplicate mission ids', () => {
    const first = enqueuePendingMissionClear(emptyPendingMissionClearFields(), slot('a'));
    const again = enqueuePendingMissionClear(first, slot('a'));
    assert.equal(again.pendingMissionClearQueue.length, 0);
    assert.equal(isMissionInClearPipeline(first, 'a'), true);
  });

  it('promotes the queued clear after the head finishes', () => {
    const stacked = enqueuePendingMissionClear(
      enqueuePendingMissionClear(emptyPendingMissionClearFields(), slot('a')),
      slot('b'),
    );
    const next = promoteNextPendingMissionClear(stacked.pendingMissionClearQueue);
    assert.equal(next.pendingMissionDialogId, 'b');
    assert.equal(next.pendingMissionClearDialog?.missionId, 'b');
    assert.equal(next.pendingMissionClearQueue.length, 0);
  });

  it('hydrates every stuck mission, not just the first', () => {
    const hydrated = collectHydratePendingMissionClears([slot('a'), slot('b'), slot('c')]);
    assert.equal(hydrated.pendingMissionDialogId, 'a');
    assert.equal(hydrated.pendingMissionClearQueue.map((row) => row.missionId).join(','), 'b,c');
  });

  it('caps overflow at MAX_PENDING_MISSION_CLEAR_QUEUE', () => {
    let state = enqueuePendingMissionClear(emptyPendingMissionClearFields(), slot('head'));
    for (let i = 0; i < MAX_PENDING_MISSION_CLEAR_QUEUE + 3; i += 1) {
      state = enqueuePendingMissionClear(state, slot(`q${i}`));
    }
    assert.equal(state.pendingMissionClearQueue.length, MAX_PENDING_MISSION_CLEAR_QUEUE);
    assert.equal(state.pendingMissionDialogId, 'head');
  });
});
