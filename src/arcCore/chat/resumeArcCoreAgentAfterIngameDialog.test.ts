import assert from 'node:assert/strict';
import { test } from 'node:test';
import { drainIngameDialogIdleCallbacks } from '../../game/ingameDialog/ingameDialogIdle';
import {
  cancelIngameDialogFeatureLinkDelay,
  setIngameDialogFeatureLinkDelayMsForTest,
} from '../../game/ingameDialog/ingameDialogFeatureLink';
import {
  clearResumeArcCoreAgentAfterIngameDialog,
  hasPendingResumeArcCoreAgentAfterIngameDialog,
  isArcCoreAgentSurfaceOpen,
  markResumeArcCoreAgentAfterIngameDialog,
  useArcCoreAgentSurfaceStore,
} from './arcCoreAgentSurfaceStore';
import {
  parkArcCoreAgentForIngameDialog,
  resumeArcCoreAgentAfterIngameDialogIfPending,
  scheduleResumeArcCoreAgentAfterIngameDialog,
} from './resumeArcCoreAgentAfterIngameDialog';

test('park then confirm idle resumes agent', () => {
  setIngameDialogFeatureLinkDelayMsForTest(0);
  cancelIngameDialogFeatureLinkDelay();
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
  assert.equal(useArcCoreAgentSurfaceStore.getState().activateAgent(), true);
  assert.equal(parkArcCoreAgentForIngameDialog(), true);
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
  assert.equal(hasPendingResumeArcCoreAgentAfterIngameDialog(), true);
  scheduleResumeArcCoreAgentAfterIngameDialog(true);
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
  drainIngameDialogIdleCallbacks();
  assert.equal(isArcCoreAgentSurfaceOpen(), true);
  assert.equal(hasPendingResumeArcCoreAgentAfterIngameDialog(), false);
  setIngameDialogFeatureLinkDelayMsForTest(null);
  cancelIngameDialogFeatureLinkDelay();
});

test('failed present resumes agent immediately', () => {
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
  assert.equal(useArcCoreAgentSurfaceStore.getState().activateAgent(), true);
  assert.equal(parkArcCoreAgentForIngameDialog(), true);
  scheduleResumeArcCoreAgentAfterIngameDialog(false);
  assert.equal(isArcCoreAgentSurfaceOpen(), true);
});

test('no pending does not reopen', () => {
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
  clearResumeArcCoreAgentAfterIngameDialog();
  markResumeArcCoreAgentAfterIngameDialog();
  clearResumeArcCoreAgentAfterIngameDialog();
  assert.equal(resumeArcCoreAgentAfterIngameDialogIfPending(), false);
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
});
