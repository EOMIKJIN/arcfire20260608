/**
 * npx tsx --test src/galaxyMap/galaxyMapZoomLadder.test.ts
 */
import assert from 'node:assert/strict';
import {
  GALAXY_MAP_ZOOM_DEFAULT_STEP,
  GALAXY_MAP_ZOOM_IN_MAX_MUL,
  GALAXY_MAP_ZOOM_STEP_MAX,
  GALAXY_MAP_ZOOM_STEP_MIN,
  clampGalaxyMapContentDim,
  resolveGalaxyMapNodeHitRadius,
  resolveGalaxyMapZoomScaleAtStep,
  resolveGalaxyMapZoomScaleMax,
  resolveGalaxyMapZoomScaleMin,
  resolveGalaxyMapZoomMaxScroll,
  resolveGalaxyMapZoomScrollTarget,
  mapViewportTapToContent,
  stepGalaxyMapZoom,
} from './galaxyMapZoomLadder';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('fit scale — content larger than viewport', () => {
  const sMin = resolveGalaxyMapZoomScaleMin({
    viewportW: 400,
    viewportH: 600,
    spanX: 2,
    spanY: 2,
    padPx: 44,
  });
  assert.ok(sMin < 1);
  assert.ok(sMin > 0);
  const innerW = 400 - 88;
  const expectX = innerW / (2 * 400);
  const innerH = 600 - 88;
  const expectY = innerH / (2 * 600);
  assert.ok(Math.abs(sMin - Math.min(expectX, expectY)) < 1e-9);
});

test('already fits → S_min = 1', () => {
  const sMin = resolveGalaxyMapZoomScaleMin({
    viewportW: 400,
    viewportH: 600,
    spanX: 0.2,
    spanY: 0.2,
    padPx: 44,
  });
  assert.equal(sMin, 1);
});

test('usable ladder is mid only — ends clamped, 1 click from 0%', () => {
  assert.equal(GALAXY_MAP_ZOOM_STEP_MIN, 1);
  assert.equal(GALAXY_MAP_ZOOM_STEP_MAX, 3);
  const sMin = 0.49;
  const sMax = resolveGalaxyMapZoomScaleMax(sMin);
  const s1 = resolveGalaxyMapZoomScaleAtStep(1, sMin);
  const s2 = resolveGalaxyMapZoomScaleAtStep(2, sMin);
  const s3 = resolveGalaxyMapZoomScaleAtStep(3, sMin);
  assert.equal(s2, 1);
  assert.ok(Math.abs(s1 - Math.sqrt(sMin)) < 1e-9);
  assert.ok(Math.abs(s3 - Math.max(1, Math.sqrt(sMax) * GALAXY_MAP_ZOOM_IN_MAX_MUL)) < 1e-9);
  assert.equal(resolveGalaxyMapZoomScaleAtStep(0, sMin), s1);
  assert.equal(resolveGalaxyMapZoomScaleAtStep(4, sMin), s3);
  assert.equal(stepGalaxyMapZoom(GALAXY_MAP_ZOOM_DEFAULT_STEP, -1), 1);
  assert.equal(stepGalaxyMapZoom(1, -1), 1);
  assert.equal(stepGalaxyMapZoom(GALAXY_MAP_ZOOM_DEFAULT_STEP, 1), 3);
  assert.equal(stepGalaxyMapZoom(3, 1), 3);
});

test('default step is 0% (scale 1) · one step each way', () => {
  assert.equal(GALAXY_MAP_ZOOM_DEFAULT_STEP, 2);
  assert.equal(stepGalaxyMapZoom(2, -2), 1);
  assert.equal(stepGalaxyMapZoom(2, 2), 3);
});

test('end stops are no-ops at usable bounds', () => {
  assert.equal(stepGalaxyMapZoom(1, -1), 1);
  assert.equal(stepGalaxyMapZoom(3, 1), 3);
  assert.equal(stepGalaxyMapZoom(0, 0), 1);
  assert.equal(stepGalaxyMapZoom(4, 0), 3);
});

test('hit radius is content-space (screen finger size / scale)', () => {
  const mid = resolveGalaxyMapNodeHitRadius(28, 1, 2.5);
  assert.equal(mid, 28);
  const zoomedIn = resolveGalaxyMapNodeHitRadius(28, 2, 2.5);
  assert.ok(Math.abs(zoomedIn - 14) < 1e-9);
  const zoomedOut = resolveGalaxyMapNodeHitRadius(28, 0.5, 2.5);
  assert.ok(Math.abs(zoomedOut - 56) < 1e-9);
});

test('camera helpers — scale 1 matches today scroll/tap', () => {
  const max = resolveGalaxyMapZoomMaxScroll({
    viewportW: 400,
    viewportH: 600,
    contentW: 800,
    contentH: 900,
    scale: 1,
  });
  assert.equal(max.maxSX, 400);
  assert.equal(max.maxSY, 300);
  const tap = mapViewportTapToContent({
    viewportX: 10,
    viewportY: 20,
    scrollX: 30,
    scrollY: 40,
    scale: 1,
    letterX: 0,
    letterY: 0,
  });
  assert.equal(tap.x, 40);
  assert.equal(tap.y, 60);
});

test('camera helpers — zoom-in does not grow content, only scroll range', () => {
  const max = resolveGalaxyMapZoomMaxScroll({
    viewportW: 400,
    viewportH: 600,
    contentW: 800,
    contentH: 900,
    scale: 2,
  });
  assert.equal(max.maxSX, 1200);
  assert.equal(max.maxSY, 1200);
  const tap = mapViewportTapToContent({
    viewportX: 0,
    viewportY: 0,
    scrollX: 200,
    scrollY: 0,
    scale: 2,
    letterX: 0,
    letterY: 0,
  });
  assert.equal(tap.x, 100);
  assert.equal(tap.y, 0);
  const target = resolveGalaxyMapZoomScrollTarget({
    contentX: 400,
    contentY: 300,
    viewportW: 400,
    viewportH: 600,
    contentW: 800,
    contentH: 900,
    scale: 2,
  });
  assert.equal(target.x, 600);
  assert.equal(target.y, 300);
});

test('content dim clamp matches 1..8192', () => {
  assert.equal(clampGalaxyMapContentDim(0), 1);
  assert.equal(clampGalaxyMapContentDim(9000), 8192);
  assert.equal(clampGalaxyMapContentDim(1200), 1200);
});
