import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isTitleStartScreenActive,
  setTitleStartScreenActive,
} from './titleStartScreenPresence';

test('title start screen presence is a scalar gate', () => {
  setTitleStartScreenActive(false);
  assert.equal(isTitleStartScreenActive(), false);
  setTitleStartScreenActive(true);
  assert.equal(isTitleStartScreenActive(), true);
  setTitleStartScreenActive(false);
  assert.equal(isTitleStartScreenActive(), false);
});
