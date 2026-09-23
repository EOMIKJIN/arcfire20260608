/**
 * npx tsx --test src/ui/passportIdentityPhotoLayout.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NPC_PORTRAIT_CANONICAL_HEIGHT_PX,
  NPC_PORTRAIT_CANONICAL_WIDTH_PX,
} from '../game/npcPortraitPixelContract';
import {
  PASSPORT_IDENTITY_BODY_HEIGHT_PX,
  PASSPORT_IDENTITY_PHOTO_ASPECT,
  PASSPORT_IDENTITY_PHOTO_NATIVE_HEIGHT_PX,
  PASSPORT_IDENTITY_PHOTO_NATIVE_WIDTH_PX,
  resolvePassportIdentityPhotoWidthPx,
} from './passportIdentityPhotoLayout';

test('passport photo slot is a square matching the NPC portrait canon', () => {
  assert.equal(NPC_PORTRAIT_CANONICAL_WIDTH_PX, 240);
  assert.equal(NPC_PORTRAIT_CANONICAL_HEIGHT_PX, 240);
  assert.equal(PASSPORT_IDENTITY_PHOTO_NATIVE_WIDTH_PX, 240);
  assert.equal(PASSPORT_IDENTITY_PHOTO_NATIVE_HEIGHT_PX, 240);
  assert.equal(PASSPORT_IDENTITY_PHOTO_ASPECT, 1);
  assert.equal(PASSPORT_IDENTITY_BODY_HEIGHT_PX, 134);
  assert.equal(resolvePassportIdentityPhotoWidthPx(), PASSPORT_IDENTITY_BODY_HEIGHT_PX);
});
