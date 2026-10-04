import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
  bumpIngameDialogLeaveAbortGen,
  getIngameDialogLeaveAbortGen,
} from './ingameDialogLeaveAbort';

test('leave abort generation advances so in-flight bar turns stop', () => {
  const before = getIngameDialogLeaveAbortGen();
  const after = bumpIngameDialogLeaveAbortGen();
  assert.equal(after, before + 1);
  assert.equal(getIngameDialogLeaveAbortGen(), after);
});

test('stage leave aborts the dialog without completing into the next scene', () => {
  const store = readFileSync(resolve(__dirname, '../../store/ingameDialogStore.ts'), 'utf8');
  const planet = readFileSync(resolve(__dirname, '../../../app/(game)/planet.tsx'), 'utf8');
  const worldmap = readFileSync(resolve(__dirname, '../../../app/(game)/worldmap.tsx'), 'utf8');
  assert.match(store, /getIngameDialogLeaveAbortGen\(\) !== leaveGen/);
  assert.match(store, /cancelIngameDialogIdlePresentsAndNotify\(\);\s*cancelIngameDialogFeatureLinkDelay\(\)/);
  assert.match(planet, /abortAllIngameDialogOnLeave\(\)/);
  assert.doesNotMatch(
    planet.slice(planet.indexOf('beginPlanetHubSuspendingNavigation')),
    /useIngameDialogStore\.getState\(\)\.dismiss\(\)/,
  );
  assert.match(worldmap, /abortAllIngameDialogOnLeave\(\)/);
});
