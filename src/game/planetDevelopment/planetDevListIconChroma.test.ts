import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPlanetDevListLevelTag, resolvePlanetDevIconChromaPct } from './planetDevListIconChroma';

const base = {
  enabled: true,
  installed: false,
  level: 0,
  maxLevel: 15,
  isInstalling: false,
  isUpgrading: false,
  upgradeProgressPct: 0,
};

test('planet dev icon chroma: idle / level / upgrade / install', () => {
  assert.equal(resolvePlanetDevIconChromaPct({ ...base, enabled: false }), 0);
  assert.equal(resolvePlanetDevIconChromaPct(base), 0);
  assert.equal(resolvePlanetDevIconChromaPct({ ...base, installed: true, level: 3 }), 3 / 15);
  assert.equal(resolvePlanetDevIconChromaPct({ ...base, installed: true, level: 15 }), 1);
  assert.equal(
    resolvePlanetDevIconChromaPct({
      ...base,
      installed: true,
      level: 3,
      isUpgrading: true,
      upgradeProgressPct: 50,
    }),
    3.5 / 15,
  );
  assert.equal(
    resolvePlanetDevIconChromaPct({
      ...base,
      isInstalling: true,
      upgradeProgressPct: 100,
    }),
    1 / 15,
  );
});

test('planet dev list level tag is LV.n', () => {
  assert.equal(formatPlanetDevListLevelTag(1), 'LV.1');
  assert.equal(formatPlanetDevListLevelTag(15), 'LV.15');
  assert.equal(formatPlanetDevListLevelTag(0), 'LV.0');
  assert.equal(formatPlanetDevListLevelTag(-2), 'LV.0');
});
