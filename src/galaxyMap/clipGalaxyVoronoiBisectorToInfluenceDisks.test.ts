/**
 * npx tsx src/galaxyMap/clipGalaxyVoronoiBisectorToInfluenceDisks.test.ts
 */
import assert from 'node:assert/strict';
import { tessellateGalaxyBlueRedVoronoiBorderSegments, type GalaxyVoronoiSite } from './buildGalaxyBlueRedVoronoiBorders';
import { resolveVoronoiInfluenceRadiusPx } from './clampGalaxyVoronoiInfluenceCell';
import {
  clipSegmentToDiskIntersection,
  sameSegment,
} from './clipGalaxyVoronoiBisectorToInfluenceDisks';

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
  side: GalaxyVoronoiSite['side'],
): GalaxyVoronoiSite {
  return { systemId, x, y, side };
}

/** 격자 + 서쪽 요새(블루) + 바로 동쪽 중립 이웃 — 실기 요새 베이스와 같은 비대칭. */
function buildFortressFrontier(): { sites: GalaxyVoronoiSite[]; r: number } {
  const sites: GalaxyVoronoiSite[] = [];
  for (let gx = 0; gx < 4; gx += 1) {
    for (let gy = 0; gy < 4; gy += 1) {
      sites.push(site(`g_${gx}_${gy}`, 280 + gx * 70, 200 + gy * 70, 'blue'));
    }
  }
  sites.push(site('fortress', 40, 340, 'blue'));
  sites.push(site('east_neutral', 110, 340, 'neutral'));
  return { sites, r: resolveVoronoiInfluenceRadiusPx(sites) };
}

test('양쪽 원 안 이등분선은 i→j와 j→i가 같은 구간이다', () => {
  const a: [number, number] = [0, 0];
  const b: [number, number] = [100, 0];
  const ij = clipSegmentToDiskIntersection(a, b, { x: 30, y: 0 }, { x: 70, y: 0 }, 40);
  const ji = clipSegmentToDiskIntersection(a, b, { x: 70, y: 0 }, { x: 30, y: 0 }, 40);
  assert.ok(ij && ji);
  assert.ok(sameSegment(ij, ji));
});

test('거리 2R 초과 선분은 원 교집합이 비다', () => {
  const a: [number, number] = [0, 0];
  const b: [number, number] = [200, 0];
  const out = clipSegmentToDiskIntersection(a, b, { x: 10, y: 0 }, { x: 190, y: 0 }, 40);
  assert.equal(out, null);
});

test('요새-이웃이 맞닿으면 국경 segment가 생긴다', () => {
  const { sites, r } = buildFortressFrontier();
  assert.ok(r > 0);
  const segs = tessellateGalaxyBlueRedVoronoiBorderSegments({
    sites,
    bounds: { x0: 0, y0: 0, x1: 2000, y1: 2000 },
    influenceRadiusPx: r,
  });
  const hit = segs.filter(
    (s) =>
      (s.ownerA === 'fortress' && s.ownerB === 'east_neutral')
      || (s.ownerA === 'east_neutral' && s.ownerB === 'fortress'),
  );
  assert.ok(hit.length >= 1, '요새-동쪽 중립 국경이 있어야 한다');
  assert.equal(hit[0]!.kind, 'blue');
});

test('빈 우주 쪽에는 요새 단독 owner 국경이 없다', () => {
  const { sites, r } = buildFortressFrontier();
  const segs = tessellateGalaxyBlueRedVoronoiBorderSegments({
    sites,
    bounds: { x0: 0, y0: 0, x1: 2000, y1: 2000 },
    influenceRadiusPx: r,
  });
  for (const s of segs) {
    const ids = [s.ownerA, s.ownerB];
    assert.ok(ids[0] !== ids[1], '국경은 항상 두 성계');
    if (ids.includes('fortress')) {
      assert.ok(ids.includes('east_neutral') || ids.some((id) => id.startsWith('g_')), '요새 국경은 실재 이웃만');
    }
  }
});

test('거리 2R 넘는 성계 쌍은 segment가 없다', () => {
  const sites: GalaxyVoronoiSite[] = [
    site('a', 0, 0, 'blue'),
    site('b', 400, 0, 'neutral'),
  ];
  const r = 40;
  const segs = tessellateGalaxyBlueRedVoronoiBorderSegments({
    sites,
    bounds: { x0: -50, y0: -50, x1: 450, y1: 50 },
    influenceRadiusPx: r,
  });
  assert.equal(segs.length, 0);
});

console.log('[clipGalaxyVoronoiBisectorToInfluenceDisks] all tests passed');
