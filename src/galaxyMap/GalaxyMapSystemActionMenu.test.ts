/**
 * npx tsx --test src/galaxyMap/GalaxyMapSystemActionMenu.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  GALAXY_MAP_ACTION_COMBAT_INK,
  GALAXY_MAP_ACTION_LAND_INK,
  resolveGalaxyMapActionMenuLabelColor,
} from './galaxyMapActionMenuInk';
import {
  MENU_FIRST_ROW_HALF,
  MENU_FIRST_ROW_HIT_GAP,
  MENU_ITEM_HEIGHT,
  MENU_WIDTH,
  isGalaxyMapMenuCloseHit,
  isGalaxyMapMenuNavHit,
  resolveGalaxyMapMenuTap,
} from './galaxyMapSystemActionMenuHit';

test('은하 지도 메뉴 — LAND/전투는 가능할 때만 색, 비활성은 회색', () => {
  assert.equal(resolveGalaxyMapActionMenuLabelColor('land', false), GALAXY_MAP_ACTION_LAND_INK);
  assert.equal(resolveGalaxyMapActionMenuLabelColor('land', true), '#526483');
  assert.equal(resolveGalaxyMapActionMenuLabelColor('combat', false), GALAXY_MAP_ACTION_COMBAT_INK);
  assert.equal(resolveGalaxyMapActionMenuLabelColor('combat', true), '#526483');
  assert.equal(resolveGalaxyMapActionMenuLabelColor('default', false), 'rgba(172, 180, 194, 0.92)');
  assert.equal(resolveGalaxyMapActionMenuLabelColor('default', true), '#526483');
});

test('첫 줄 착륙|닫기 히트는 균등하고 갭에서 겹치지 않는다', () => {
  assert.equal(MENU_FIRST_ROW_HALF * 2 + MENU_FIRST_ROW_HIT_GAP, MENU_WIDTH);
  assert.equal(MENU_FIRST_ROW_HALF, 61);

  assert.equal(isGalaxyMapMenuNavHit(0, 0), true);
  assert.equal(isGalaxyMapMenuNavHit(MENU_FIRST_ROW_HALF, 23), true);
  assert.equal(isGalaxyMapMenuNavHit(MENU_FIRST_ROW_HALF + 1, 23), false);
  assert.equal(isGalaxyMapMenuCloseHit(MENU_FIRST_ROW_HALF + MENU_FIRST_ROW_HIT_GAP, 23), true);
  assert.equal(isGalaxyMapMenuCloseHit(MENU_WIDTH, MENU_ITEM_HEIGHT), true);
  assert.equal(isGalaxyMapMenuCloseHit(MENU_FIRST_ROW_HALF, 23), false);

  const gapX = MENU_FIRST_ROW_HALF + 1;
  assert.equal(isGalaxyMapMenuNavHit(gapX, 20), false);
  assert.equal(isGalaxyMapMenuCloseHit(gapX, 20), false);
  assert.equal(resolveGalaxyMapMenuTap(gapX, 20, 3), null);

  assert.deepEqual(resolveGalaxyMapMenuTap(10, 20, 3), { kind: 'item', index: 0 });
  assert.deepEqual(resolveGalaxyMapMenuTap(100, 20, 3), { kind: 'close' });
  assert.deepEqual(resolveGalaxyMapMenuTap(10, MENU_ITEM_HEIGHT + 1, 3), { kind: 'item', index: 1 });
});
