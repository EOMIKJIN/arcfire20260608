import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeRgbaToPng, encodeRgbaToPngDataUri } from './planetGlobePngEncode';
import { hasBundledPlanetGlobeBake } from './planetGlobeBundledIds';

test('encodeRgbaToPng — PNG 시그니처·크기', () => {
  const rgba = new Uint8Array(2 * 2 * 4);
  rgba.set([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
  const png = encodeRgbaToPng(rgba, 2, 2);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.length > 64);
  const uri = encodeRgbaToPngDataUri(rgba, 2, 2);
  assert.ok(uri.startsWith('data:image/png;base64,'));
});

test('hasBundledPlanetGlobeBake — 정본·현재 개척 번들만', () => {
  assert.equal(hasBundledPlanetGlobeBake('arcadia_prime'), true);
  assert.equal(hasBundledPlanetGlobeBake('synth_002_p'), true);
  assert.equal(hasBundledPlanetGlobeBake('synth_999_p'), false);
});
