import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
  narrativeDialogPortraitSourceKey,
  reuseNarrativeDialogPortraitSource,
} from './narrativeDialogPortraitSourceKey';

test('same require id is the same portrait key', () => {
  assert.equal(narrativeDialogPortraitSourceKey(12), 'n:12');
  assert.equal(narrativeDialogPortraitSourceKey(12), narrativeDialogPortraitSourceKey(12));
  assert.notEqual(narrativeDialogPortraitSourceKey(12), narrativeDialogPortraitSourceKey(13));
});

test('same uri is the same portrait key even if object identity differs', () => {
  assert.equal(
    narrativeDialogPortraitSourceKey({ uri: 'file://a.png' }),
    narrativeDialogPortraitSourceKey({ uri: 'file://a.png' }),
  );
});

test('empty source is a stable empty key', () => {
  assert.equal(narrativeDialogPortraitSourceKey(undefined), '');
  assert.equal(narrativeDialogPortraitSourceKey(null), '');
});

test('same portrait key keeps the existing source reference', () => {
  const existing = { uri: 'file://a.png' };
  const next = { uri: 'file://a.png' };
  assert.equal(reuseNarrativeDialogPortraitSource(existing, next), existing);
  assert.notEqual(reuseNarrativeDialogPortraitSource(existing, { uri: 'file://b.png' }), existing);
});

test('dialog portrait does not promote a hardware layer on a still Image', () => {
  const src = readFileSync(resolve(__dirname, './NarrativeDialogPortrait.tsx'), 'utf8');
  assert.doesNotMatch(src, /renderToHardwareTextureAndroid/);
});
