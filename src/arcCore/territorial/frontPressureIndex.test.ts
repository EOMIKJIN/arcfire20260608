/**
 * FrontPressure(전선 압박) posture·battlesPerInterval — unit tests
 * npx tsx --test src/arcCore/territorial/frontPressureIndex.test.ts
 */
import assert from 'node:assert/strict';
import { recomputeFrontPressureForSystem, invalidateFrontPressure } from './frontPressureIndex';
import type { PlanetClanHold } from '../../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function makeHold(planetId: string, systemId: string, occupierClanId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId,
    homePlayerUid: null,
    kind: occupierClanId === 'neutral' ? 'neutral' : 'clan_hold',
    capturedAt: 0,
  } as PlanetClanHold;
}

test('시리우스 시나리오 — 인접 draco_nebula·perseus 모두 RED(적대) → hostileNeighborCount=2 → aggressive', () => {
  invalidateFrontPressure();
  const holds: Record<string, PlanetClanHold> = {
    sirius_border: makeHold('sirius_border', 'sirius', 'solo_clan_player'),
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_red'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'balance_seed_faction_red'),
  };
  const snap = recomputeFrontPressureForSystem('sirius', holds);
  assert.equal(snap.side, 'INDEPENDENT');
  assert.equal(snap.hostileNeighborCount, 2);
  assert.equal(snap.posture, 'aggressive');
  assert.equal(snap.battlesPerInterval, 2);
  assert.equal(snap.flanked, false);
});

test('flanked — 인접 3곳(crimson_zone 포함) 전부 적대면 flanked=true', () => {
  invalidateFrontPressure();
  const holds: Record<string, PlanetClanHold> = {
    sirius_border: makeHold('sirius_border', 'sirius', 'solo_clan_player'),
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_red'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'balance_seed_faction_red'),
    crimson_base: makeHold('crimson_base', 'crimson_zone', 'balance_seed_faction_red'),
  };
  const snap = recomputeFrontPressureForSystem('sirius', holds);
  assert.equal(snap.hostileNeighborCount, 3);
  assert.equal(snap.flanked, true);
  assert.equal(snap.posture, 'aggressive');
});

test('평시 — 적대 인접 0 · 아군(동일 side) 인접 有 → defensive, battlesPerInterval=1', () => {
  invalidateFrontPressure();
  // 동맹 보급(allySupplyEnabled) 기본 OFF — BLUE는 INDEPENDENT의 보급 노드로 안 잡힘(기존 계약 유지).
  // friendlySupplyCount>0을 성립시키려면 동일 side(INDEPENDENT) 점유 인접이 필요.
  const holds: Record<string, PlanetClanHold> = {
    sirius_border: makeHold('sirius_border', 'sirius', 'solo_clan_player'),
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'solo_clan_player_2'),
  };
  const snap = recomputeFrontPressureForSystem('sirius', holds);
  assert.equal(snap.hostileNeighborCount, 0);
  assert.equal(snap.friendlySupplyCount, 1);
  assert.equal(snap.posture, 'defensive');
  assert.equal(snap.battlesPerInterval, 1);
});

test('적대 인접 1곳(임계 미만) → normal, battlesPerInterval=1', () => {
  invalidateFrontPressure();
  const holds: Record<string, PlanetClanHold> = {
    sirius_border: makeHold('sirius_border', 'sirius', 'solo_clan_player'),
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_red'),
  };
  const snap = recomputeFrontPressureForSystem('sirius', holds);
  assert.equal(snap.hostileNeighborCount, 1);
  assert.equal(snap.posture, 'normal');
  assert.equal(snap.battlesPerInterval, 1);
});

test('점유 없는 성계(NEUTRAL) — hostileNeighborCount=0 · posture=normal(defensive 아님, 보급 개념 비적용)', () => {
  invalidateFrontPressure();
  const snap = recomputeFrontPressureForSystem('sirius', {});
  assert.equal(snap.side, 'NEUTRAL');
  assert.equal(snap.hostileNeighborCount, 0);
  assert.equal(snap.posture, 'normal');
});

console.log('[frontPressureIndex] all tests passed');
