/**
 * Voronoi 사이트 캡 — 확장 해금은 안개 공개 전 제외
 * npx tsx --test src/galaxyMap/selectGalaxyMapVoronoiSites.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isGalaxyMapStableVoronoiSiteId,
  selectGalaxyMapVoronoiSites,
} from './selectGalaxyMapVoronoiSites';

function isLegacy(id: string): boolean {
  const m = /^synth_(\d+)$/.exec(id);
  return m != null && Number(m[1]) <= 79;
}

function isGateway(id: string): boolean {
  return id === 'synth_083' || id === 'synth_092';
}

const isStable = (id: string) => isGalaxyMapStableVoronoiSiteId(id, isLegacy, isGateway);

test('드롭할 확장이 없으면 입력 배열 신원을 유지한다', () => {
  const visible = [{ id: 'arcadia' }, { id: 'synth_001' }, { id: 'synth_073' }];
  const next = selectGalaxyMapVoronoiSites(visible, new Set(['arcadia']), isStable);
  assert.equal(next, visible);
});

test('해금된 확장 성계는 안개 공개 전 Voronoi에서 뺀다', () => {
  const visible = [
    { id: 'arcadia' },
    { id: 'synth_073' },
    { id: 'synth_083' },
    { id: 'synth_120' },
    { id: 'synth_200' },
  ];
  const next = selectGalaxyMapVoronoiSites(visible, new Set(['arcadia', 'synth_073']), isStable);
  assert.deepEqual(next.map((s) => s.id), ['arcadia', 'synth_073', 'synth_083']);
});

test('안개로 공개된 확장 성계만 격자에 합류한다', () => {
  const visible = [
    { id: 'arcadia' },
    { id: 'synth_073' },
    { id: 'synth_120' },
    { id: 'synth_200' },
  ];
  const next = selectGalaxyMapVoronoiSites(visible, new Set(['arcadia', 'synth_120']), isStable);
  assert.deepEqual(next.map((s) => s.id), ['arcadia', 'synth_073', 'synth_120']);
});
