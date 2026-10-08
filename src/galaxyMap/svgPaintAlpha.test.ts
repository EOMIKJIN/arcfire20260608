import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withSvgPaintAlpha } from './svgPaintAlpha';

test('withSvgPaintAlpha leaves full opacity colors unchanged', () => {
  assert.equal(withSvgPaintAlpha('#F0F3FA', 1), '#F0F3FA');
  assert.equal(withSvgPaintAlpha('rgba(255,255,255,0.48)', 1), 'rgba(255,255,255,0.48)');
});

test('withSvgPaintAlpha folds group opacity into the paint', () => {
  assert.equal(withSvgPaintAlpha('#F0F3FA', 0.7), 'rgba(240,243,250,0.7)');
  assert.equal(withSvgPaintAlpha('rgba(255,255,255,0.48)', 0.55), 'rgba(255,255,255,0.264)');
  assert.equal(withSvgPaintAlpha('#FFFFFF33', 0.5), 'rgba(255,255,255,0.1)');
});
