import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isArcCoreAgentSurfaceOpen,
  isArcCoreAgentSurfaceReopenLocked,
  useArcCoreAgentSurfaceStore,
} from './arcCoreAgentSurfaceStore';

test('agent surface activate then hide keeps mount', () => {
  useArcCoreAgentSurfaceStore.setState({
    mounted: false,
    front: 'game',
    immediate: false,
    closing: false,
  });
  const ok = useArcCoreAgentSurfaceStore.getState().activateAgent();
  assert.equal(ok, true);
  assert.equal(isArcCoreAgentSurfaceOpen(), true);
  useArcCoreAgentSurfaceStore.getState().activateGame();
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
  assert.equal(useArcCoreAgentSurfaceStore.getState().mounted, true);
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
  assert.equal(useArcCoreAgentSurfaceStore.getState().mounted, false);
});

test('close then close again stays on game without remount', () => {
  useArcCoreAgentSurfaceStore.setState({
    mounted: true,
    front: 'agent',
    immediate: false,
    closing: false,
  });
  useArcCoreAgentSurfaceStore.getState().activateGame();
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
  useArcCoreAgentSurfaceStore.getState().activateGame();
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
  assert.equal(useArcCoreAgentSurfaceStore.getState().mounted, true);
  assert.equal(useArcCoreAgentSurfaceStore.getState().front, 'game');
});

test('close swallows immediate reopen from leaked dialog tap', () => {
  useArcCoreAgentSurfaceStore.setState({
    mounted: true,
    front: 'agent',
    immediate: false,
    closing: false,
  });
  useArcCoreAgentSurfaceStore.getState().activateGame();
  assert.equal(isArcCoreAgentSurfaceOpen(), false);
  assert.equal(useArcCoreAgentSurfaceStore.getState().closing, true);
  assert.equal(isArcCoreAgentSurfaceReopenLocked(), true);
  assert.equal(useArcCoreAgentSurfaceStore.getState().activateAgent(), false);
  useArcCoreAgentSurfaceStore.getState().settleClosing();
  assert.equal(useArcCoreAgentSurfaceStore.getState().closing, false);
});

test('ignoreReopenLock resumes agent during close lock', () => {
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
  assert.equal(useArcCoreAgentSurfaceStore.getState().activateAgent(), true);
  useArcCoreAgentSurfaceStore.getState().activateGame();
  assert.equal(isArcCoreAgentSurfaceReopenLocked(), true);
  assert.equal(useArcCoreAgentSurfaceStore.getState().activateAgent(), false);
  assert.equal(
    useArcCoreAgentSurfaceStore.getState().activateAgent({ ignoreReopenLock: true }),
    true,
  );
  assert.equal(isArcCoreAgentSurfaceOpen(), true);
});

test('reopen after lock bumps openNonce', () => {
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
  useArcCoreAgentSurfaceStore.setState({
    mounted: true,
    front: 'game',
    immediate: false,
    closing: false,
    openNonce: 3,
  });
  assert.equal(useArcCoreAgentSurfaceStore.getState().activateAgent(), true);
  assert.equal(useArcCoreAgentSurfaceStore.getState().openNonce, 4);
  assert.equal(isArcCoreAgentSurfaceOpen(), true);
});
