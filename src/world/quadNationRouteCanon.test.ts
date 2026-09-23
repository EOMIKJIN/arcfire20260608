/**
 * 4대 항로 = 4대 국가 — id 분리 · 교역 F/지역 정본
 * npx tsx --test src/world/quadNationRouteCanon.test.ts
 */
import assert from 'node:assert/strict';
import { PlanetTradeRouteProfile_FROM_BALANCE_CSV } from '../data/balance/generated';
import {
  isQuadNationId,
  LOCAL_FLAVOR_FACTION_IDS,
  MEGA_FACTION_BLUE_NATION,
  MEGA_FACTION_NORTH_NATION,
  MEGA_FACTION_RED_NATION,
  MEGA_FACTION_SOUTH_NATION,
} from './megaFactionNationPolicy';
import { GALAXY_ROUTE_POLICIES } from './galaxyRouteFactionPolicy';
import {
  QUAD_TRADE_REGION_BY_FACTION,
  resolveCanonTradeCodesForPlanetId,
} from './quadNationRouteCanon';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('4대 국가 id는 mega_* 이고 flavor와 겹치지 않음', () => {
  const ids = [
    MEGA_FACTION_BLUE_NATION.megaFactionId,
    MEGA_FACTION_SOUTH_NATION.megaFactionId,
    MEGA_FACTION_RED_NATION.megaFactionId,
    MEGA_FACTION_NORTH_NATION.megaFactionId,
  ];
  assert.deepEqual(ids, [
    'mega_stellium_alliance',
    'mega_mercurium_coalition',
    'mega_crimson_legion',
    'mega_aurelium_guild',
  ]);
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) {
    assert.equal(id.startsWith('mega_'), true);
    assert.equal(isQuadNationId(id), true);
    assert.equal((LOCAL_FLAVOR_FACTION_IDS as readonly string[]).includes(id), false);
  }
  assert.equal(isQuadNationId('trade_coalition'), false);
  assert.equal(isQuadNationId('miners_guild'), false);
});

test('항로 정책 F·지역 쌍은 F1W F2S F3E F4N', () => {
  for (const policy of Object.values(GALAXY_ROUTE_POLICIES)) {
    assert.equal(policy.tradeRegionCode, QUAD_TRADE_REGION_BY_FACTION[policy.tradeFactionCode]);
  }
});

test('교역 CSV 전 행이 항로 정본(수도 잠금+좌표)과 일치', () => {
  for (const row of PlanetTradeRouteProfile_FROM_BALANCE_CSV) {
    const canon = resolveCanonTradeCodesForPlanetId(row.planetId);
    assert.ok(canon, `canon missing for ${row.planetId}`);
    assert.equal(row.tradeFactionCode, canon.tradeFactionCode, row.planetId);
    assert.equal(row.tradeRegionCode, canon.tradeRegionCode, row.planetId);
    assert.equal(row.tradeRegionCode, QUAD_TRADE_REGION_BY_FACTION[row.tradeFactionCode], row.planetId);
  }
});

test('수도 잠금 — eden_city=F1W · synth_706_p=F2S · core_prime=F3E · synth_732_p=F4N', () => {
  const west = resolveCanonTradeCodesForPlanetId('eden_city');
  const south = resolveCanonTradeCodesForPlanetId('synth_706_p');
  const east = resolveCanonTradeCodesForPlanetId('core_prime');
  const north = resolveCanonTradeCodesForPlanetId('synth_732_p');
  assert.equal(west?.route, 'west');
  assert.equal(west?.tradeFactionCode, 'F1');
  assert.equal(south?.route, 'south');
  assert.equal(south?.tradeFactionCode, 'F2');
  assert.equal(east?.route, 'east');
  assert.equal(east?.tradeFactionCode, 'F3');
  assert.equal(north?.route, 'north');
  assert.equal(north?.tradeFactionCode, 'F4');
});
