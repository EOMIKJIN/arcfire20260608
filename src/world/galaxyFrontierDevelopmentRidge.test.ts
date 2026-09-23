/**
 * 은하 발전 능선 — 코어 손맛 · 수도 봉우리 · 오지 바닥
 * npx tsx --test src/world/galaxyFrontierDevelopmentRidge.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { STAR_SYSTEMS } from '../data/systems';
import { resolvePlanetGenesisCoreGauge } from '../arcCore/planetResource/planetResourceEcosystemPolicy';
import {
  isBeaconColonyPlanetId,
  isCoreScenarioPlanetId,
  isFrontierWildernessGaugeHold,
  resolveBeaconWildernessHop,
  resolveFrontierCoreHop,
  resolveFrontierWorldFacilitySeed,
  resolveGalaxyFrontierBand,
  resolveRouteCapitalDisplayOverride,
} from './galaxyFrontierDevelopmentRidge';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function allPlanetIds(): string[] {
  const ids: string[] = [];
  for (const sys of Object.values(GALAXY_SYSTEMS)) {
    for (const p of sys.planets) ids.push(p.id);
  }
  return ids;
}

function avg5(g: { resource: number; population: number; defense: number; technology: number; environment: number }): number {
  return (g.resource + g.population + g.defense + g.technology + g.environment) / 5;
}

test('코어 21 손맛 — 뉴에덴·아크파이어 코어 genesis CSV 유지', () => {
  assert.equal(isCoreScenarioPlanetId('eden_city'), true);
  assert.equal(isCoreScenarioPlanetId('synth_706_p'), false);
  const eden = resolvePlanetGenesisCoreGauge('eden_city');
  assert.equal(eden.resource, 48);
  assert.equal(eden.population, 58);
  const core = resolvePlanetGenesisCoreGauge('core_prime');
  assert.equal(core.resource, 55);
  assert.equal(core.defense, 58);
});

test('남·북 수도는 코어 밖 봉우리', () => {
  assert.equal(resolveGalaxyFrontierBand('synth_706_p'), 'A');
  assert.equal(resolveGalaxyFrontierBand('synth_732_p'), 'A');
  const south = resolvePlanetGenesisCoreGauge('synth_706_p');
  const north = resolvePlanetGenesisCoreGauge('synth_732_p');
  assert.ok(avg5(south) >= 48, `south avg ${avg5(south)}`);
  assert.ok(avg5(north) >= 48, `north avg ${avg5(north)}`);
  const southFac = resolveFrontierWorldFacilitySeed('synth_706_p', 0);
  assert.equal(southFac.hasTradePort, true);
  assert.equal(southFac.hasShipyard, true);
  assert.equal(southFac.hasBar, true);
  assert.equal(resolveRouteCapitalDisplayOverride('synth_706_p')?.planetNameKo, '머큐리움 프라임');
});

test('뉴에덴~남단 사이는 오지(D)에 가깝다', () => {
  const midId = 'synth_079_p';
  const band = resolveGalaxyFrontierBand(midId);
  const g = resolvePlanetGenesisCoreGauge(midId);
  assert.notEqual(band, 'A');
  assert.ok(avg5(g) < 36, `${midId} avg ${avg5(g)} band=${band}`);
});

test('확장 과반이 오지 D · 평균 5지표 20 미만 존재', () => {
  const ids = allPlanetIds();
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  let lowCivic = 0;
  for (const id of ids) {
    counts[resolveGalaxyFrontierBand(id)] += 1;
    const g = resolvePlanetGenesisCoreGauge(id);
    const civic = (g.population + g.defense + g.technology + g.environment) / 4;
    if (civic < 20) lowCivic += 1;
  }
  assert.ok(counts.A >= 20 && counts.A <= 26, `A=${counts.A}`);
  assert.ok(counts.D >= 300, `D=${counts.D}`);
  assert.ok(lowCivic >= 250, `lowCivic=${lowCivic}`);
  assert.ok(counts.B + counts.C + counts.D > 700, JSON.stringify(counts));
});

test('코어 성계 수는 21', () => {
  let n = 0;
  for (const sys of Object.values(STAR_SYSTEMS)) n += sys.planets.length;
  assert.equal(n, 21);
});

test('비콘 개척지 hop — 4시설 모두 플레이어 개발', () => {
  assert.equal(isBeaconColonyPlanetId('synth_057_p'), true);
  assert.equal(resolveBeaconWildernessHop(), 5);
  assert.equal(resolveFrontierCoreHop('synth_057_p'), 5);
  const locked = resolveFrontierWorldFacilitySeed('synth_057_p', 0);
  const opened = resolveFrontierWorldFacilitySeed('synth_057_p', 1);
  assert.deepEqual(locked, { hasTradePort: false, hasShipyard: false, hasBar: false });
  assert.deepEqual(opened, { hasTradePort: false, hasShipyard: false, hasBar: false });
});

test('비콘 hop 밖은 기본 시설 0 · 남·북 수도만 재상승', () => {
  const far = resolveFrontierWorldFacilitySeed('synth_001_p', 1);
  assert.deepEqual(far, { hasTradePort: false, hasShipyard: false, hasBar: false });
  const capital = resolveFrontierWorldFacilitySeed('synth_706_p', 1);
  assert.deepEqual(capital, { hasTradePort: true, hasShipyard: true, hasBar: true });
  let wildernessWithFac = 0;
  const wildernessHop = resolveBeaconWildernessHop();
  for (const sys of Object.values(GALAXY_SYSTEMS)) {
    if (!sys.id.startsWith('synth_')) continue;
    const planetId = sys.planets[0]?.id;
    if (!planetId) continue;
    const hop = resolveFrontierCoreHop(planetId);
    if (hop < wildernessHop) continue;
    const seed = resolveFrontierWorldFacilitySeed(planetId, 1);
    if (seed.hasTradePort || seed.hasShipyard || seed.hasBar) wildernessWithFac += 1;
  }
  assert.ok(wildernessWithFac >= 2 && wildernessWithFac <= 40, `wildernessWithFac=${wildernessWithFac}`);
});

test('오지 게이지 홀드 — 코어·수도는 제외, 비콘 밖 무시설만', () => {
  assert.equal(isFrontierWildernessGaugeHold('eden_city'), false);
  assert.equal(isFrontierWildernessGaugeHold('synth_706_p'), false);
  assert.equal(isFrontierWildernessGaugeHold('synth_732_p'), false);
  assert.equal(isFrontierWildernessGaugeHold('synth_057_p'), true);
  assert.equal(isFrontierWildernessGaugeHold('synth_001_p'), true);
});
