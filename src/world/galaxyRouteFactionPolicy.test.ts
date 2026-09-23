/**
 * 4대 팩션 항로 정본
 * npx tsx --test src/world/galaxyRouteFactionPolicy.test.ts
 */
import assert from 'node:assert/strict';
import { EN_DICTIONARY } from '../i18n/locales/en';
import { KO_DICTIONARY } from '../i18n/locales/ko';
import { GALAXY_ROUTE_POLICIES } from './galaxyRouteFactionPolicy';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('§6-5 — 서부 F1 스텔리움 · 남부 F2 · 동부 F3 크림슨 · 북부 F4', () => {
  assert.equal(GALAXY_ROUTE_POLICIES.west.tradeFactionCode, 'F1');
  assert.equal(GALAXY_ROUTE_POLICIES.west.factionId, 'mega_stellium_alliance');
  assert.equal(GALAXY_ROUTE_POLICIES.west.displayNameKo, '스텔리움 연합');
  assert.equal(GALAXY_ROUTE_POLICIES.west.displayNameEn, 'Stellium Alliance');
  assert.equal(GALAXY_ROUTE_POLICIES.south.tradeFactionCode, 'F2');
  assert.equal(GALAXY_ROUTE_POLICIES.south.factionId, 'mega_mercurium_coalition');
  assert.equal(GALAXY_ROUTE_POLICIES.south.displayNameKo, '머큐리움 연합');
  assert.equal(GALAXY_ROUTE_POLICIES.south.displayNameEn, 'Mercurium Coalition');
  assert.equal(GALAXY_ROUTE_POLICIES.east.tradeFactionCode, 'F3');
  assert.equal(GALAXY_ROUTE_POLICIES.east.factionId, 'mega_crimson_legion');
  assert.equal(GALAXY_ROUTE_POLICIES.east.displayNameKo, '크림슨 레기온');
  assert.equal(GALAXY_ROUTE_POLICIES.east.displayNameEn, 'Crimson Legion');
  assert.equal(GALAXY_ROUTE_POLICIES.north.tradeFactionCode, 'F4');
  assert.equal(GALAXY_ROUTE_POLICIES.north.factionId, 'mega_aurelium_guild');
  assert.equal(GALAXY_ROUTE_POLICIES.north.displayNameKo, '아우렐리움 길드');
  assert.equal(GALAXY_ROUTE_POLICIES.north.displayNameEn, 'Aurelium Guild');
});

test('레거시 오배치(north=federation · west=miners_guild · east=scientists) 제거', () => {
  assert.notEqual(GALAXY_ROUTE_POLICIES.north.factionId, 'federation');
  assert.notEqual(GALAXY_ROUTE_POLICIES.west.factionId, 'miners_guild');
  assert.notEqual(GALAXY_ROUTE_POLICIES.east.factionId, 'scientists');
});

test('4대 항로 수도 — 서 eden_city · 남 synth_706_p · 동 core_prime · 북 synth_732_p', () => {
  assert.equal(GALAXY_ROUTE_POLICIES.west.centerPlanetId, 'eden_city');
  assert.equal(GALAXY_ROUTE_POLICIES.south.centerPlanetId, 'synth_706_p');
  assert.equal(GALAXY_ROUTE_POLICIES.east.centerPlanetId, 'core_prime');
  assert.equal(GALAXY_ROUTE_POLICIES.north.centerPlanetId, 'synth_732_p');
});

test('남·북 수도는 코어 21 행성 id가 아님', () => {
  const south = GALAXY_ROUTE_POLICIES.south.centerPlanetId;
  const north = GALAXY_ROUTE_POLICIES.north.centerPlanetId;
  assert.equal(south?.startsWith('synth_'), true);
  assert.equal(north?.startsWith('synth_'), true);
  assert.notEqual(south, 'draco_haven');
  assert.notEqual(north, 'helios_core');
});

test('F2/F4 국가 id는 flavor(trade_coalition/miners_guild)와 분리', () => {
  assert.notEqual(GALAXY_ROUTE_POLICIES.south.factionId, 'trade_coalition');
  assert.notEqual(GALAXY_ROUTE_POLICIES.north.factionId, 'miners_guild');
  assert.equal(GALAXY_ROUTE_POLICIES.west.tradeRegionCode, 'W');
  assert.equal(GALAXY_ROUTE_POLICIES.south.tradeRegionCode, 'S');
  assert.equal(GALAXY_ROUTE_POLICIES.east.tradeRegionCode, 'E');
  assert.equal(GALAXY_ROUTE_POLICIES.north.tradeRegionCode, 'N');
});

test('i18n 거울 — 항로 국호와 worldmap.territory.nation.* 동기', () => {
  assert.equal(KO_DICTIONARY['worldmap.territory.nation.blue'], GALAXY_ROUTE_POLICIES.west.displayNameKo);
  assert.equal(EN_DICTIONARY['worldmap.territory.nation.blue'], GALAXY_ROUTE_POLICIES.west.displayNameEn);
  assert.equal(KO_DICTIONARY['worldmap.territory.nation.south'], GALAXY_ROUTE_POLICIES.south.displayNameKo);
  assert.equal(EN_DICTIONARY['worldmap.territory.nation.south'], GALAXY_ROUTE_POLICIES.south.displayNameEn);
  assert.equal(KO_DICTIONARY['worldmap.territory.nation.red'], GALAXY_ROUTE_POLICIES.east.displayNameKo);
  assert.equal(EN_DICTIONARY['worldmap.territory.nation.red'], GALAXY_ROUTE_POLICIES.east.displayNameEn);
  assert.equal(KO_DICTIONARY['worldmap.territory.nation.north'], GALAXY_ROUTE_POLICIES.north.displayNameKo);
  assert.equal(EN_DICTIONARY['worldmap.territory.nation.north'], GALAXY_ROUTE_POLICIES.north.displayNameEn);
});
