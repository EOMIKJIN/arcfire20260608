/**
 * 은하 지도 점령 라벨 — 독립국 면적 하한 완화 unit tests
 * npx tsx --test src/galaxyMap/buildGalaxyTerritoryVoronoi.test.ts
 */
import assert from 'node:assert/strict';
import { buildGalaxyTerritoryVoronoiLayers, type GalaxyTerritorySite } from './buildGalaxyTerritoryVoronoi';

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
  return { systemId, x, y, factionSide, displayColor: '#000000' };
}

/**
 * blue 대륙(격자, 넓은 면적) + independent 1성계(실제 버그 재현 — red 대륙에 **둘러싸여** 고립,
 * 시리우스가 크림슨 레기온 인접에 둘러싸인 실제 시나리오와 동일 기하) + red 대륙.
 * independent를 red 격자 **한복판**에 끼워 넣어 Voronoi 셀이 인접 red 사이트들에 눌려
 * 확실히 작아지도록(격자 간격 60 기준 셀 넓이 ≈ 3600px² < 기존 임계 12_000px²).
 */
function buildMixedGalaxy(): GalaxyTerritorySite[] {
  const sites: GalaxyTerritorySite[] = [];
  // blue 대륙 — 6x6 격자, 넓은 연결성분(기존 임계 12_000px² 통과 목적)
  for (let gx = 0; gx < 6; gx += 1) {
    for (let gy = 0; gy < 6; gy += 1) {
      sites.push(site(`blue_${gx}_${gy}`, gx * 60, gy * 60, 'blue'));
    }
  }
  // red 대륙 — 다른 위치, 동일 규모(단, 격자 한가운데 한 칸은 independent로 치환 — 아래)
  for (let gx = 0; gx < 6; gx += 1) {
    for (let gy = 0; gy < 6; gy += 1) {
      if (gx === 3 && gy === 3) continue; // 이 칸은 independent가 대신 차지
      sites.push(site(`red_${gx}_${gy}`, 1000 + gx * 60, gy * 60, 'red'));
    }
  }
  sites.push(site('sirius_border', 1000 + 3 * 60, 3 * 60, 'independent'));
  return sites;
}

test('M0 재현 — 기존 임계(12_000)였다면 independent 1성계 라벨이 skip됐을 시나리오에서, 완화 후엔 라벨 생성', () => {
  const sites = buildMixedGalaxy();
  const layers = buildGalaxyTerritoryVoronoiLayers({
    sites,
    bounds: { x0: -200, y0: -200, x1: 1400, y1: 1000 },
  });
  const independentLabels = layers.occupationLabels.filter((l) => l.factionSide === 'independent');
  assert.equal(independentLabels.length, 1, 'independent 라벨이 정확히 1개 생성돼야 함');
});

test('blue/red 대륙 라벨은 기존과 동일하게 생성됨(회귀 없음)', () => {
  const sites = buildMixedGalaxy();
  const layers = buildGalaxyTerritoryVoronoiLayers({
    sites,
    bounds: { x0: -200, y0: -200, x1: 1400, y1: 1000 },
  });
  const blueLabels = layers.occupationLabels.filter((l) => l.factionSide === 'blue');
  const redLabels = layers.occupationLabels.filter((l) => l.factionSide === 'red');
  assert.equal(blueLabels.length, 1, 'blue 대륙 라벨 1개');
  assert.equal(redLabels.length, 1, 'red 대륙 라벨 1개');
});

test('independent 성계가 없으면 independent 라벨도 없음(항상-표시가 아니라 존재 시에만)', () => {
  const sites: GalaxyTerritorySite[] = [];
  for (let gx = 0; gx < 6; gx += 1) {
    for (let gy = 0; gy < 6; gy += 1) {
      sites.push(site(`blue_${gx}_${gy}`, gx * 60, gy * 60, 'blue'));
    }
  }
  const layers = buildGalaxyTerritoryVoronoiLayers({
    sites,
    bounds: { x0: -200, y0: -200, x1: 400, y1: 400 },
  });
  const independentLabels = layers.occupationLabels.filter((l) => l.factionSide === 'independent');
  assert.equal(independentLabels.length, 0);
});

console.log('[buildGalaxyTerritoryVoronoi] all tests passed');
