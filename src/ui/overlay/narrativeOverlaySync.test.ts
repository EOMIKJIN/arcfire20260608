import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isNarrativeOverlayContentChanged,
  resolveNarrativeOverlayWrite,
} from './narrativeOverlaySync';

test('page change patches; hide dismisses; first show presents', () => {
  assert.equal(resolveNarrativeOverlayWrite(false, false, true, true), 'dismiss');
  assert.equal(resolveNarrativeOverlayWrite(true, true, false, true), 'present');
  assert.equal(resolveNarrativeOverlayWrite(true, true, true, true), 'patch');
  assert.equal(resolveNarrativeOverlayWrite(true, true, true, false), 'none');
});

test('typewriter key or text change is content, not remount', () => {
  assert.equal(
    isNarrativeOverlayContentChanged({
      existingTypewriterKey: 'p1',
      existingText: 'a',
      existingLabel: 'A',
      existingPortraitScale: 1,
      nextTypewriterKey: 'p2',
      nextText: 'a',
      nextLabel: 'A',
      nextPortraitScale: 1,
      imageChanged: false,
    }),
    true,
  );
  assert.equal(
    isNarrativeOverlayContentChanged({
      existingTypewriterKey: 'p1',
      existingText: 'a',
      existingLabel: 'A',
      existingPortraitScale: 1,
      nextTypewriterKey: 'p1',
      nextText: 'a',
      nextLabel: 'A',
      nextPortraitScale: 1,
      imageChanged: false,
    }),
    false,
  );
});
