/**
 * 은하 지도 별빛 — 외곽 샘플 + 안개 성계 전량
 * npx tsx --test src/galaxyMap/galaxyMapStarlightPaths.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  GALAXY_MAP_AMBIENT_STARLIGHT_COLS,
  GALAXY_MAP_AMBIENT_STARLIGHT_ROWS,
  GALAXY_MAP_STARLIGHT_FOG_COLORS,
  GALAXY_MAP_STARLIGHT_OPACITY_BUCKETS,
  GALAXY_MAP_STARLIGHT_SHOW_PCT,
  buildGalaxyMapAmbientStarlightSites,
  buildGalaxyMapStarlightPaths,
  hashGalaxyMapStarlightId,
} from './galaxyMapStarlightPaths';

const toScreen = (pos: { x: number; y: number }) => ({
  x: pos.x * 100,
  y: pos.y * 100,
});

function countMoves(paths: { d: string }[]): number {
  let n = 0;
  for (const p of paths) {
    n += (p.d.match(/M/g) ?? []).length;
  }
  return n;
}

test('이동 안개 성계는 샘플링 없이 전부 별빛', () => {
  const always = [
    { id: 'minerva', position: { x: 0.1, y: 0.2 } },
    { id: 'new_eden', position: { x: 0.3, y: 0.4 } },
    { id: 'draco_nebula', position: { x: 0.5, y: 0.6 } },
  ];
  const paths = buildGalaxyMapStarlightPaths({
    sampledSystems: [],
    alwaysVisibleSystems: always,
    toScreen,
  });
  assert.equal(countMoves(paths), 3);
  assert.ok(paths.every((p) => p.opacity > 0 && p.color.startsWith('#')));
});

test('같은 id가 안개·외곽에 겹치면 별빛 1개만', () => {
  const site = { id: 'minerva', position: { x: 0.2, y: 0.3 } };
  const paths = buildGalaxyMapStarlightPaths({
    sampledSystems: [site],
    alwaysVisibleSystems: [site],
    toScreen,
  });
  assert.equal(countMoves(paths), 1);
});

test('비유한 좌표는 별빛에서 제외', () => {
  const paths = buildGalaxyMapStarlightPaths({
    sampledSystems: [],
    alwaysVisibleSystems: [{ id: 'broken', position: { x: Number.NaN, y: 0 } }],
    toScreen: () => ({ x: Number.NaN, y: 0 }),
  });
  assert.equal(countMoves(paths), 0);
});

test('빈 구역 채움은 성계 없는 모서리까지 깐다', () => {
  const sites = buildGalaxyMapAmbientStarlightSites({
    minX: 0,
    minY: 0,
    maxX: 1,
    maxY: 1,
    occupierPositions: [{ x: 0.5, y: 0.5 }],
  });
  assert.ok(sites.length > 0);
  assert.ok(sites.length < GALAXY_MAP_AMBIENT_STARLIGHT_COLS * GALAXY_MAP_AMBIENT_STARLIGHT_ROWS);
  const near = (x: number, y: number) =>
    sites.some((s) => Math.hypot(s.position.x - x, s.position.y - y) < 0.12);
  assert.ok(near(0, 0));
  assert.ok(near(1, 0));
  assert.ok(near(0, 1));
  assert.ok(near(1, 1));
  assert.equal(
    sites.some((s) => Math.hypot(s.position.x - 0.5, s.position.y - 0.5) < 0.038),
    false,
  );
});

test('채움 별빛은 색×opacity 배칭만 늘린다', () => {
  const fillSites = buildGalaxyMapAmbientStarlightSites({
    minX: 0,
    minY: 0,
    maxX: 1,
    maxY: 1,
    occupierPositions: [],
  });
  const paths = buildGalaxyMapStarlightPaths({
    sampledSystems: [],
    fillSites,
    toScreen,
  });
  assert.ok(countMoves(paths) >= fillSites.length);
  assert.ok(paths.length <= GALAXY_MAP_STARLIGHT_FOG_COLORS.length * GALAXY_MAP_STARLIGHT_OPACITY_BUCKETS.length);
  assert.deepEqual([...GALAXY_MAP_STARLIGHT_OPACITY_BUCKETS], [0.08, 0.18, 0.3, 0.43, 0.59]);
});

test('외곽 미발견은 기존 36% 샘플을 유지한다', () => {
  const sampled = [];
  for (let i = 80; i < 180; i += 1) {
    sampled.push({
      id: `synth_${String(i).padStart(3, '0')}`,
      position: { x: i / 200, y: 0.2 },
    });
  }
  const expected = sampled.filter(
    (s) => hashGalaxyMapStarlightId(s.id) % 100 < GALAXY_MAP_STARLIGHT_SHOW_PCT,
  ).length;
  const paths = buildGalaxyMapStarlightPaths({
    sampledSystems: sampled,
    toScreen,
  });
  assert.equal(countMoves(paths), expected);
  assert.ok(expected > 0);
  assert.ok(expected < sampled.length);
});
