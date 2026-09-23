/**
 * 은하 지도 이동 안개 — 아르카디아에서 점진 공개
 * npx tsx --test src/galaxyMap/galaxyMapTravelFog.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { STAR_SYSTEMS_FROM_CSV } from '../data/generated/csvSystems';
import {
  partitionVisibleSystemsByTravelFog,
  resolveGalaxyMapTravelFogRevealedIds,
  reuseGalaxyMapIdSetIfSame,
} from './galaxyMapTravelFog';

test('아르카디아만 방문이면 본계+이웃 2곳 = 3성계', () => {
  const revealed = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia'],
    currentSystemId: 'arcadia',
    systems: STAR_SYSTEMS_FROM_CSV,
  });
  assert.deepEqual(
    [...revealed].sort(),
    ['arcadia', 'solar_port', 'vega_outpost'].sort(),
  );
  assert.equal(revealed.has('minerva'), false);
  assert.equal(revealed.has('new_eden'), false);
  assert.equal(revealed.has('draco_nebula'), false);
});

test('솔라 항구 도착 후 그 이웃이 추가되고 기존 공개는 유지', () => {
  const revealed = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia', 'solar_port'],
    currentSystemId: 'solar_port',
    systems: STAR_SYSTEMS_FROM_CSV,
  });
  assert.ok(revealed.has('arcadia'));
  assert.ok(revealed.has('vega_outpost'));
  assert.ok(revealed.has('minerva'));
  assert.ok(revealed.has('new_eden'));
  assert.equal(revealed.has('draco_nebula'), false);
  assert.equal(revealed.has('iron_cross'), false);
});

test('런타임 GALAXY_SYSTEMS — 아르카디아 이웃에 synth_073, 033은 아직 비공개', () => {
  const revealed = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia'],
    currentSystemId: 'arcadia',
    systems: GALAXY_SYSTEMS,
  });
  assert.ok(revealed.has('arcadia'));
  assert.ok(revealed.has('solar_port'));
  assert.ok(revealed.has('vega_outpost'));
  assert.ok(revealed.has('synth_073'));
  assert.equal(revealed.has('synth_033'), false);
});

test('멤버십이 같으면 Set 신원을 재사용한다', () => {
  const first = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia'],
    currentSystemId: 'arcadia',
    systems: STAR_SYSTEMS_FROM_CSV,
  });
  const second = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia'],
    currentSystemId: 'arcadia',
    systems: STAR_SYSTEMS_FROM_CSV,
  });
  assert.notEqual(first, second);
  assert.equal(reuseGalaxyMapIdSetIfSame(first, second), first);
});

test('공개/숨김 분할은 1회 순회', () => {
  const revealed = new Set(['arcadia', 'solar_port']);
  const list = [
    { id: 'arcadia' },
    { id: 'solar_port' },
    { id: 'minerva' },
  ];
  const part = partitionVisibleSystemsByTravelFog(list, revealed);
  assert.deepEqual(part.visible.map((s) => s.id), ['arcadia', 'solar_port']);
  assert.deepEqual(part.hidden.map((s) => s.id), ['minerva']);
});

test('정찰 센서 extra hop은 이웃의 이웃을 연다', () => {
  const revealed = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia'],
    currentSystemId: 'arcadia',
    systems: STAR_SYSTEMS_FROM_CSV,
    extraNeighborHops: 1,
  });
  assert.ok(revealed.has('minerva'));
  assert.ok(revealed.has('new_eden'));
});

test('이동 클릭으로 current만 바뀌면 도착 전 연결 노드는 닫힌다', () => {
  const inFlight = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: ['arcadia'],
    currentSystemId: 'solar_port',
    systems: STAR_SYSTEMS_FROM_CSV,
  });
  assert.ok(inFlight.has('arcadia'));
  assert.ok(inFlight.has('solar_port'));
  assert.ok(inFlight.has('vega_outpost'));
  assert.equal(inFlight.has('minerva'), false);
  assert.equal(inFlight.has('new_eden'), false);
});

test('현재 성계가 visited에 없으면 노드만 보이고 이웃은 닫힌다', () => {
  const revealed = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: [],
    currentSystemId: 'arcadia',
    systems: STAR_SYSTEMS_FROM_CSV,
  });
  assert.ok(revealed.has('arcadia'));
  assert.equal(revealed.has('solar_port'), false);
  assert.equal(revealed.has('vega_outpost'), false);
});

test('미방문 current + extra hop은 도착지 이웃을 열지 않는다', () => {
  const revealed = resolveGalaxyMapTravelFogRevealedIds({
    visitedSystemIds: [],
    currentSystemId: 'solar_port',
    systems: STAR_SYSTEMS_FROM_CSV,
    extraNeighborHops: 1,
  });
  assert.ok(revealed.has('solar_port'));
  assert.equal(revealed.has('minerva'), false);
  assert.equal(revealed.has('new_eden'), false);
});
