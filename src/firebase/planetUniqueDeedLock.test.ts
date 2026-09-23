/**
 * 행성 유일 증서 파서·정렬 — Firebase 없이 단위 검증
 * npx tsx --test src/firebase/planetUniqueDeedLock.test.ts
 */
import assert from 'node:assert/strict';
import {
  parsePlanetUniqueDeedRow,
  sanitizePlanetUniqueDeedWrite,
  sortPlanetUniqueDeedRows,
} from './planetUniqueDeedModel';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('sanitize: 빈 닉네임·행성 거부', () => {
  assert.equal(
    sanitizePlanetUniqueDeedWrite({
      planetId: 'vega_base',
      ownerUid: 'u1',
      nickname: '  ',
      playerLevel: 3,
      megaFactionId: 'mega_stellium_alliance',
    }),
    null,
  );
});

test('parse: 확보시각 없으면 랭킹 제외', () => {
  assert.equal(
    parsePlanetUniqueDeedRow('vega_base', {
      ownerUid: 'u1',
      nickname: '엄스황제',
      playerLevel: 12,
      megaFactionId: 'mega_stellium_alliance',
    }),
    null,
  );
});

test('sort: 128캡은 정렬 후 오래된 순으로 자른다', () => {
  const rows = [];
  for (let i = 0; i < 130; i += 1) {
    rows.push({
      planetId: `p${String(i).padStart(3, '0')}`,
      ownerUid: 'u1',
      nickname: 'tester',
      playerLevel: 1,
      megaFactionId: '',
      securedAt: 1000 + i,
    });
  }
  const sorted = sortPlanetUniqueDeedRows(rows);
  assert.equal(sorted.length, 128);
  assert.equal(sorted[0]?.planetId, 'p000');
  assert.equal(sorted[127]?.planetId, 'p127');
});

test('sort: 확보 시각 오름차순 · 행성당 1장', () => {
  const rows = sortPlanetUniqueDeedRows([
    {
      planetId: 'vega_base',
      ownerUid: 'u1',
      nickname: '엄스황제',
      playerLevel: 12,
      megaFactionId: 'mega_stellium_alliance',
      securedAt: 200,
    },
    {
      planetId: 'arcadia',
      ownerUid: 'u1',
      nickname: '엄스황제',
      playerLevel: 12,
      megaFactionId: 'mega_stellium_alliance',
      securedAt: 100,
    },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.planetId, 'arcadia');
  assert.equal(rows[1]?.planetId, 'vega_base');
});

console.log('[planetUniqueDeedLock] all tests passed');
