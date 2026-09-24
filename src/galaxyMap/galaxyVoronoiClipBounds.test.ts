/**
 * npx tsx --test src/galaxyMap/galaxyVoronoiClipBounds.test.ts
 */
import assert from 'node:assert/strict';
import { computeGalaxyVoronoiClipBounds } from './galaxyVoronoiClipBounds';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('사이트 bbox+48을 mapBounds 안으로 클램프한다', () => {
  const clip = computeGalaxyVoronoiClipBounds(
    [
      { x: 100, y: 200 },
      { x: 300, y: 400 },
    ],
    { x0: 0, y0: 0, x1: 2000, y1: 2000 },
  );
  assert.deepEqual(clip, { x0: 52, y0: 152, x1: 348, y1: 448 });
});

test('mapBounds가 더 좁으면 mapBounds를 따른다', () => {
  const clip = computeGalaxyVoronoiClipBounds(
    [{ x: 10, y: 10 }],
    { x0: 0, y0: 0, x1: 20, y1: 20 },
  );
  assert.deepEqual(clip, { x0: 0, y0: 0, x1: 20, y1: 20 });
});

console.log('[galaxyVoronoiClipBounds] all tests passed');
