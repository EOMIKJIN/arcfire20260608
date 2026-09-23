import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickLocalized } from './pickLocalized';

test('default Korean keeps CSV KO even when EN exists', () => {
  assert.equal(pickLocalized('ko', '아크코어 수송선단', 'ArcCore Transport Fleet'), '아크코어 수송선단');
  assert.equal(pickLocalized('ko', '관문순찰대장', ''), '관문순찰대장');
});

test('English setting uses EN and falls back to KO when empty', () => {
  assert.equal(pickLocalized('en', '아크코어 수송선단', 'ArcCore Transport Fleet'), 'ArcCore Transport Fleet');
  assert.equal(pickLocalized('en', '관문순찰대장', '  '), '관문순찰대장');
  assert.equal(pickLocalized('en', '관문순찰대장', null), '관문순찰대장');
});

test('pending locales follow English display, not Korean', () => {
  assert.equal(pickLocalized('ja', '한글', 'English'), 'English');
});
