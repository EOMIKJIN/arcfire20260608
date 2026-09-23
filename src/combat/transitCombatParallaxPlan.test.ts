/**
 * npx tsx src/combat/transitCombatParallaxPlan.test.ts
 */
import assert from 'node:assert/strict';
import {
  hashTransitDestKey,
  pickTransitSpaceCdIndex,
  areTransitNebulaLayersReady,
  resolveTransitCloudImageSlots,
  intersectRects,
  mapDestCropToSrc,
  resolveTransitBackdropChromePad,
  resolveTransitBakedFillBox,
  resolveTransitChromeCoverBands,
  countTransitCloudsOverlappingViewport,
  resolveTransitCloudLayerMotions,
  resolveTransitCloudScrollOrigin,
  resolveTransitCloudSpriteDest,
  resolveTransitCloudSpriteSize,
  resolveTransitCloudWrapPeriod,
  resolveTransitFullscreenContentBox,
  resolveTransitNearbyNebulaPlanetId,
  resolveTransitSessionViewStart,
  resolveTransitSpaceDrift,
  resolveTransitStageInsets,
  TRANSIT_CLOUD_CROSS_SPAN_FRAC,
  TRANSIT_CLOUD_LAYER_COUNT,
  TRANSIT_CLOUD_LAYER_SPEEDS_PX_PER_SEC,
  TRANSIT_CLOUD_SPEED_CAP_PX_PER_SEC,
  TRANSIT_CLOUD_SPRITE_FILL_FRAC,
  TRANSIT_PARALLAX_TICK_MS,
  TRANSIT_SPACE_CD_COUNT,
  TRANSIT_STAR_COUNT,
  TRANSIT_STAR_DRIFT_PX_PER_SEC,
  TRANSIT_STAR_STRIDE,
  fillTransitStarCatalog,
  resolveTransitStarDrift,
  writeTransitStarDraw,
  wrapParallaxOffset,
} from './transitCombatParallaxPlan';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('space_cd index stays in 0..2 (01~03 only)', () => {
  assert.equal(TRANSIT_SPACE_CD_COUNT, 3);
  assert.equal(pickTransitSpaceCdIndex('vega_outpost') >= 0, true);
  assert.equal(pickTransitSpaceCdIndex('vega_outpost') < TRANSIT_SPACE_CD_COUNT, true);
  assert.equal(pickTransitSpaceCdIndex(''), pickTransitSpaceCdIndex('transit'));
});

test('dest hash is stable and differs by system', () => {
  assert.equal(hashTransitDestKey('vega_outpost'), hashTransitDestKey('vega_outpost'));
  assert.notEqual(hashTransitDestKey('vega_outpost'), hashTransitDestKey('solar_port'));
});

test('star catalog is bounded, in-unit, and slower than clouds', () => {
  const catalog = new Float32Array(TRANSIT_STAR_COUNT * TRANSIT_STAR_STRIDE);
  fillTransitStarCatalog(catalog);
  const again = new Float32Array(TRANSIT_STAR_COUNT * TRANSIT_STAR_STRIDE);
  fillTransitStarCatalog(again);
  assert.equal(catalog.length, TRANSIT_STAR_COUNT * TRANSIT_STAR_STRIDE);
  for (let i = 0; i < TRANSIT_STAR_COUNT; i += 1) {
    const o = i * TRANSIT_STAR_STRIDE;
    assert.equal(catalog[o] === again[o], true);
    assert.equal((catalog[o] ?? -1) >= 0 && (catalog[o] ?? 2) < 1, true);
    assert.equal((catalog[o + 1] ?? -1) >= 0 && (catalog[o + 1] ?? 2) < 1, true);
    assert.equal((catalog[o + 2] ?? 0) > 0.4 && (catalog[o + 2] ?? 9) < 2.0, true);
  }
  const drift = resolveTransitStarDrift();
  assert.equal(drift.vx > 0 && drift.vy > 0, true);
  assert.equal(TRANSIT_STAR_DRIFT_PX_PER_SEC < TRANSIT_CLOUD_LAYER_SPEEDS_PX_PER_SEC[0]!, true);
});

test('star draw stays on canvas and writes into the scratch slot', () => {
  const catalog = new Float32Array(TRANSIT_STAR_COUNT * TRANSIT_STAR_STRIDE);
  fillTransitStarCatalog(catalog);
  const out = new Float32Array(4);
  writeTransitStarDraw(catalog, 0, 360, 800, 12.4, out);
  assert.equal(out[0]! >= 0 && out[0]! < 360, true);
  assert.equal(out[1]! >= 0 && out[1]! < 800, true);
  assert.equal(out[2]! > 0, true);
  assert.equal(out[3]! > 0 && out[3]! <= 1, true);
});

test('parallax tick is 120ms+ so Picture+setState does not fight combat rAF', () => {
  assert.equal(TRANSIT_PARALLAX_TICK_MS >= 120, true);
});

test('nebula first-frame waits for both cloud slots and baked when required', () => {
  const slots = resolveTransitCloudImageSlots(2, 1);
  assert.equal(slots.length, 2);
  assert.equal(slots[0] !== slots[1], true);
  const clouds: (object | null)[] = [null, null, null];
  assert.equal(areTransitNebulaLayersReady({
    clouds,
    indexBase: 2,
    cloudIndexBias: 1,
    bakedRequired: true,
    baked: {},
  }), false);
  clouds[slots[0]!] = {};
  clouds[slots[1]!] = {};
  assert.equal(areTransitNebulaLayersReady({
    clouds,
    indexBase: 2,
    cloudIndexBias: 1,
    bakedRequired: true,
    baked: null,
  }), false);
  assert.equal(areTransitNebulaLayersReady({
    clouds,
    indexBase: 2,
    cloudIndexBias: 1,
    bakedRequired: true,
    baked: {},
  }), true);
});

test('two drifting clouds share TL→BR with distinct slow speeds', () => {
  const layers = resolveTransitCloudLayerMotions();
  assert.equal(layers.length, 2);
  assert.equal(TRANSIT_CLOUD_LAYER_COUNT, 2);
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i]!;
    assert.equal(layer.vx > 0 && layer.vy > 0, true);
    assert.equal(TRANSIT_CLOUD_LAYER_SPEEDS_PX_PER_SEC[i]! < TRANSIT_CLOUD_SPEED_CAP_PX_PER_SEC, true);
  }
  assert.notEqual(layers[0]!.vx, layers[1]!.vx);
  assert.notEqual(layers[0]!.vy, layers[1]!.vy);
  assert.notEqual(layers[0]!.wrapPhaseFrac, layers[1]!.wrapPhaseFrac);
});

test('space drift is same TL→BR diagonal', () => {
  const drift = resolveTransitSpaceDrift();
  assert.equal(drift.vx > 0 && drift.vy > 0, true);
  const cloud = resolveTransitCloudLayerMotions()[0]!;
  assert.equal(Math.sign(drift.vx), Math.sign(cloud.vx));
  assert.equal(Math.sign(drift.vy), Math.sign(cloud.vy));
});

test('nearby nebula prefers dest planet (hub match)', () => {
  const systems: Record<string, { planets: { id: string }[]; connections: string[] }> = {
    arcadia: { planets: [{ id: 'arcadia_prime' }], connections: ['vega_outpost'] },
    vega_outpost: { planets: [{ id: 'vega_base' }], connections: ['arcadia', 'new_eden'] },
    new_eden: { planets: [{ id: 'eden_city' }], connections: ['vega_outpost'] },
  };
  assert.equal(
    resolveTransitNearbyNebulaPlanetId({
      originSystemId: 'arcadia',
      destSystemId: 'vega_outpost',
      getSystem: (id) => systems[id],
    }),
    'vega_base',
  );
  assert.equal(
    resolveTransitNearbyNebulaPlanetId({
      originSystemId: '',
      destSystemId: 'vega_outpost',
      getSystem: (id) => systems[id],
    }),
    'vega_base',
  );
  assert.equal(
    resolveTransitNearbyNebulaPlanetId({
      originSystemId: 'arcadia',
      destSystemId: 'vega_base',
      getSystem: (id) => systems[id],
    }),
    'vega_base',
  );
});

test('legacy helper: content box subtracts stage insets (Backdrop clouds do not use this)', () => {
  const insets = resolveTransitStageInsets(0);
  const content = resolveTransitFullscreenContentBox(360, 800, insets.topPx, insets.bottomPx);
  assert.equal(content.y, insets.topPx);
  assert.equal(content.h, 800 - insets.topPx - insets.bottomPx);
  assert.equal(content.w, 360);
});

test('legacy helper: chrome pad matches StageShell foreground (do not apply on Backdrop)', () => {
  assert.deepEqual(resolveTransitBackdropChromePad(0), { topPx: 72, bottomPx: 54 });
  assert.deepEqual(resolveTransitBackdropChromePad(34), { topPx: 72, bottomPx: 20 });
  assert.deepEqual(resolveTransitBackdropChromePad(80), { topPx: 72, bottomPx: 0 });
});

test('baked nebula covers the raw canvas (not original/contain size)', () => {
  const box = resolveTransitBakedFillBox(360, 800, 0, 0);
  assert.equal(box.size, 800);
  assert.equal(box.x, (360 - 800) * 0.5);
  assert.equal(box.y, 0);
});

test('intersectRects keeps dest inside content (no chrome spill)', () => {
  const crop = intersectRects(0, -200, 360, 337, 0, 72, 360, 674);
  assert.ok(crop);
  assert.equal(crop.y, 72);
  assert.equal(crop.y + crop.h <= 72 + 674, true);
  assert.equal(intersectRects(0, -400, 360, 100, 0, 72, 360, 674), null);
});

test('mapDestCropToSrc stays inside native sprite', () => {
  const src = mapDestCropToSrc(0, -80, 360, 337, 0, 0, 360, 257, 150, 150);
  assert.ok(src);
  assert.equal(src.x >= 0 && src.y >= 0, true);
  assert.equal(src.x + src.w <= 150.01, true);
  assert.equal(src.y + src.h <= 150.01, true);
});

test('baked dest is centered in the visible frame (72/54 chrome)', () => {
  const insets = resolveTransitStageInsets(0);
  const content = resolveTransitFullscreenContentBox(360, 800, insets.topPx, insets.bottomPx);
  const box = resolveTransitBakedFillBox(360, 800);
  assert.equal(box.size, Math.max(content.w, content.h));
  assert.equal(box.x, content.x + (content.w - box.size) * 0.5);
  assert.equal(box.y, content.y + (content.h - box.size) * 0.5);
  assert.equal(box.y, 72);
});

test('chrome cover bands are 72 top and 54 bottom on raw canvas', () => {
  const bands = resolveTransitChromeCoverBands(800);
  assert.equal(bands.topY, 0);
  assert.equal(bands.topH, 72);
  assert.equal(bands.bottomY, 746);
  assert.equal(bands.bottomH, 54);
});

test('one cloud sprite stays square (no vertical stretch)', () => {
  const sprite = resolveTransitCloudSpriteSize(360, 800);
  const side = Math.round(360 * TRANSIT_CLOUD_SPRITE_FILL_FRAC);
  assert.equal(sprite.w, side);
  assert.equal(sprite.h, side);
  assert.equal(sprite.w, sprite.h);
});

test('wrap offset stays in [0, period)', () => {
  assert.equal(wrapParallaxOffset(12, 10), 2);
  assert.equal(wrapParallaxOffset(-1, 10), 9);
  assert.equal(wrapParallaxOffset(0, 0), 0);
});

test('wrap period stays near one sprite so the pair overlaps instead of splitting', () => {
  assert.equal(TRANSIT_CLOUD_CROSS_SPAN_FRAC, 0.92);
  assert.equal(resolveTransitCloudWrapPeriod(360), 360 * 0.92);
  assert.equal(resolveTransitCloudWrapPeriod(450), 450 * 0.92);
});

test('phase 0.5 starts one cloud centered; 1 or 2 stay on screen', () => {
  const canvasW = 360;
  const canvasH = 800;
  const sprite = resolveTransitCloudSpriteSize(canvasW, canvasH);
  const layers = resolveTransitCloudLayerMotions();
  const dests = layers.map((layer) => {
    const origin = resolveTransitCloudScrollOrigin({
      spriteW: sprite.w,
      spriteH: sprite.h,
      elapsedSec: 0,
      vx: layer.vx,
      vy: layer.vy,
      wrapPhaseFrac: layer.wrapPhaseFrac,
    });
    return resolveTransitCloudSpriteDest({
      canvasW,
      canvasH,
      spriteW: sprite.w,
      spriteH: sprite.h,
      ox: origin.ox,
      oy: origin.oy,
    });
  });
  const centered = dests[0]!;
  assert.equal(Math.abs(centered.x - (canvasW - sprite.w) * 0.5) < 1, true);
  assert.equal(Math.abs(centered.y - (canvasH - sprite.h) * 0.5) < 1, true);
  const visible = countTransitCloudsOverlappingViewport(dests, canvasW, canvasH);
  assert.equal(visible >= 1 && visible <= 2, true);
});

test('session view seed keeps layer rules but changes start origin', () => {
  const a = resolveTransitSessionViewStart(1);
  const b = resolveTransitSessionViewStart(2);
  assert.equal(a.cloudStartFrac >= 0 && a.cloudStartFrac < 1, true);
  assert.equal(b.cloudStartFrac >= 0 && b.cloudStartFrac < 1, true);
  assert.notEqual(a.cloudStartFrac, b.cloudStartFrac);
  assert.equal(a.cloudIndexBias >= 0 && a.cloudIndexBias < TRANSIT_SPACE_CD_COUNT, true);
  assert.notEqual(a.starElapsedBiasSec, b.starElapsedBiasSec);
  assert.deepEqual(resolveTransitSessionViewStart(1), a);

  const canvasW = 360;
  const canvasH = 800;
  const sprite = resolveTransitCloudSpriteSize(canvasW, canvasH);
  const layers = resolveTransitCloudLayerMotions();
  const originsA = layers.map((layer) =>
    resolveTransitCloudScrollOrigin({
      spriteW: sprite.w,
      spriteH: sprite.h,
      elapsedSec: 0,
      vx: layer.vx,
      vy: layer.vy,
      wrapPhaseFrac: layer.wrapPhaseFrac,
      sessionStartFrac: a.cloudStartFrac,
    }),
  );
  const originsB = layers.map((layer) =>
    resolveTransitCloudScrollOrigin({
      spriteW: sprite.w,
      spriteH: sprite.h,
      elapsedSec: 0,
      vx: layer.vx,
      vy: layer.vy,
      wrapPhaseFrac: layer.wrapPhaseFrac,
      sessionStartFrac: b.cloudStartFrac,
    }),
  );
  assert.notEqual(originsA[0]!.ox, originsB[0]!.ox);
  assert.notEqual(originsA[0]!.oy, originsB[0]!.oy);
  const periodX = resolveTransitCloudWrapPeriod(sprite.w);
  const relA = wrapParallaxOffset(originsA[0]!.ox - originsA[1]!.ox, periodX);
  const relB = wrapParallaxOffset(originsB[0]!.ox - originsB[1]!.ox, periodX);
  assert.equal(Math.abs(relA - relB) < 0.01, true);

  const dests = originsA.map((origin) =>
    resolveTransitCloudSpriteDest({
      canvasW,
      canvasH,
      spriteW: sprite.w,
      spriteH: sprite.h,
      ox: origin.ox,
      oy: origin.oy,
    }),
  );
  const visible = countTransitCloudsOverlappingViewport(dests, canvasW, canvasH);
  assert.equal(visible >= 1 && visible <= 2, true);
});

test('later ticks keep one or two clouds in view, never a tile grid', () => {
  const canvasW = 360;
  const canvasH = 800;
  const sprite = resolveTransitCloudSpriteSize(canvasW, canvasH);
  const layers = resolveTransitCloudLayerMotions();
  for (let t = 0; t < 200; t += 17) {
    const dests = layers.map((layer) => {
      const origin = resolveTransitCloudScrollOrigin({
        spriteW: sprite.w,
        spriteH: sprite.h,
        elapsedSec: t,
        vx: layer.vx,
        vy: layer.vy,
        wrapPhaseFrac: layer.wrapPhaseFrac,
      });
      return resolveTransitCloudSpriteDest({
        canvasW,
        canvasH,
        spriteW: sprite.w,
        spriteH: sprite.h,
        ox: origin.ox,
        oy: origin.oy,
      });
    });
    const visible = countTransitCloudsOverlappingViewport(dests, canvasW, canvasH);
    assert.equal(visible >= 1 && visible <= 2, true);
  }
});
