/**
 * Planet PGP 모델 단위 테스트
 * npx tsx src/world/planetPgpModel.test.ts
 */
import assert from 'node:assert/strict';
import {
  PlanetPgpPlanet,
  calculatePlanetPgpFromStats,
  clampPlanetPgpStat,
  planetPgpFromCoreGauge,
} from './planetPgpModel';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('clampPlanetPgpStat — 0..100 정수', () => {
  assert.equal(clampPlanetPgpStat(-5), 0);
  assert.equal(clampPlanetPgpStat(150), 100);
  assert.equal(clampPlanetPgpStat(49.6), 50);
  assert.equal(clampPlanetPgpStat(Number.NaN), 0);
});

test('CSV 시드 50/50/50/50/50 — PGP 84375', () => {
  const planet = new PlanetPgpPlanet({
    resource: 50,
    population: 50,
    defense: 50,
    technology: 50,
    environment: 50,
  });
  // base = 75000, T=1.5, E=1.0, D=0.75 → 84375
  assert.equal(planet.calculatePgp(), 84375);
  assert.equal(planet.calculate_pgp(), 84375);
});

test('전 스탯 100 — PGP 450000', () => {
  const pgp = calculatePlanetPgpFromStats({
    resource: 100,
    population: 100,
    defense: 100,
    technology: 100,
    environment: 100,
  });
  // base=150000, T=2, E=1.5, D=1 → 450000
  assert.equal(pgp, 450000);
});

test('전 스탯 0 — PGP 0', () => {
  assert.equal(new PlanetPgpPlanet().calculatePgp(), 0);
});

test('setter 유효성 — 범위 밖 값 클램프', () => {
  const planet = new PlanetPgpPlanet({ resource: 50, population: 50, defense: 50, technology: 50, environment: 50 });
  planet.resource = 200;
  planet.defense = -10;
  assert.equal(planet.resource, 100);
  assert.equal(planet.defense, 0);
  assert.equal(planet.calculatePgp(), calculatePlanetPgpFromStats({ resource: 100, population: 50, defense: 0, technology: 50, environment: 50 }));
});

test('R만 10, 나머지 0 — base 10000 × T×E×D_mod', () => {
  const pgp = calculatePlanetPgpFromStats({
    resource: 10,
    population: 0,
    defense: 0,
    technology: 0,
    environment: 0,
  });
  // base=10000, T=1, E=0.5, D=0.5 → 2500
  assert.equal(pgp, 2500);
});

test('planetPgpFromCoreGauge — runtime 게이지 연동', () => {
  const planet = planetPgpFromCoreGauge({
    resource: 50,
    population: 50,
    defense: 50,
    technology: 50,
    environment: 50,
  });
  assert.equal(planet.calculatePgp(), 84375);
});

console.log('\nAll planet PGP tests passed.');
