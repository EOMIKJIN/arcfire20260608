/**
 * npx tsx --test src/galaxyMap/clampGalaxyVoronoiInfluenceCell.test.ts
 */
import assert from 'node:assert/strict';
import { buildGalaxyTerritoryVoronoiLayers, type GalaxyTerritorySite } from './buildGalaxyTerritoryVoronoi';
import {
  VORONOI_INFLUENCE_RADIUS_NN_MUL,
  clampVoronoiCellToInfluenceRadius,
  resolveVoronoiInfluenceRadiusPx,
} from './clampGalaxyVoronoiInfluenceCell';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function site(
  systemId: string,
  x: number,
  y: number,
  factionSide: GalaxyTerritorySite['factionSide'],
): GalaxyTerritorySite {
  return { systemId, x, y, factionSide, displayColor: '#2244aa' };
}

test('내부 사각형은 원보다 작으면 원본 참조를 유지한다', () => {
  const poly: [number, number][] = [
    [10, 10],
    [30, 10],
    [30, 30],
    [10, 30],
  ];
  const out = clampVoronoiCellToInfluenceRadius(poly, 20, 20, 40);
  assert.equal(out, poly);
});

test('펼쳐진 셀은 R 밖으로 나가지 않는다', () => {
  const poly: [number, number][] = [
    [0, 0],
    [400, 0],
    [400, 400],
    [0, 400],
  ];
  const r = 40;
  const out = clampVoronoiCellToInfluenceRadius(poly, 20, 20, r);
  assert.ok(out.length >= 3);
  for (const [x, y] of out) {
    assert.ok(Math.hypot(x - 20, y - 20) <= r + 1.2, `${x},${y} beyond R`);
  }
});

test('요새처럼 한쪽만 빈 성계 채움은 평균 간격×1.35 안에 머문다', () => {
  const sites: GalaxyTerritorySite[] = [];
  for (let gx = 0; gx < 4; gx += 1) {
    for (let gy = 0; gy < 4; gy += 1) {
      sites.push(site(`g_${gx}_${gy}`, 200 + gx * 70, 200 + gy * 70, 'blue'));
    }
  }
  sites.push(site('fortress', 40, 480, 'blue'));
  const r = resolveVoronoiInfluenceRadiusPx(sites);
  assert.ok(Math.abs(r / 70 - VORONOI_INFLUENCE_RADIUS_NN_MUL) < 0.2);
  const layers = buildGalaxyTerritoryVoronoiLayers({
    sites,
    bounds: { x0: 0, y0: 0, x1: 2000, y1: 2000 },
  });
  const fill = layers.fills.find((f) => f.key === 'fortress');
  assert.ok(fill);
  const toks = fill!.points.split(/\s+/).filter(Boolean);
  for (const tok of toks) {
    const [xs, ys] = tok.split(',');
    const x = Number(xs);
    const y = Number(ys);
    assert.ok(Math.hypot(x - 40, y - 480) <= r + 1.5, `fortress vertex ${tok}`);
  }
});

console.log('[clampGalaxyVoronoiInfluenceCell] all tests passed');
