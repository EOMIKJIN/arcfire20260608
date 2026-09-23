/**
 * npx tsx --test src/ui/overlay/overlayPanelLayout.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PLANET_DEV_DETAIL_DESCRIPTION_BLOCK_HEIGHT_PX,
  PLANET_DEV_DETAIL_DESCRIPTION_LINES,
  PLANET_DEV_LIST_DESCRIPTION_LINES,
} from './overlayPanelLayout';

test('행성개발 상세 상단 설명란은 4줄 · 목록은 3줄', () => {
  assert.equal(PLANET_DEV_DETAIL_DESCRIPTION_LINES, 4);
  assert.equal(PLANET_DEV_LIST_DESCRIPTION_LINES, 3);
  assert.equal(PLANET_DEV_DETAIL_DESCRIPTION_BLOCK_HEIGHT_PX, 80);
});
