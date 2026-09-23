/**
 * War Theater 단일 상태
 * npx tsx --test src/arcCore/territorial/resolveWarTheaterState.test.ts
 */
import assert from 'node:assert/strict';
import type { PlanetClanHold } from '../../types';
import {
  resolveWarTheaterState,
  shouldSkipWdiForWarTheater,
} from './resolveWarTheaterState';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function hold(planetId: string, systemId: string, occupierClanId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId,
    homePlayerUid: null,
    kind: occupierClanId === 'neutral' ? 'neutral' : 'clan_hold',
    capturedAt: 0,
  } as PlanetClanHold;
}

const BLUE = 'balance_seed_faction_blue';
const RED = 'balance_seed_faction_red';

function newEdenFrontHolds(): Record<string, PlanetClanHold> {
  return {
    eden_city: hold('eden_city', 'new_eden', BLUE),
    solar_station: hold('solar_station', 'solar_port', BLUE),
    vega_base: hold('vega_base', 'vega_outpost', BLUE),
    iron_remnant: hold('iron_remnant', 'iron_cross', BLUE),
    omega_hub: hold('omega_hub', 'omega_station', RED),
    draco_haven: hold('draco_haven', 'draco_nebula', BLUE),
    helios_core: hold('helios_core', 'helios', BLUE),
  };
}

test('뉴에덴 수도 hold_defense → capital_hold · 여파/주둔 없음', () => {
  const holds = newEdenFrontHolds();
  const state = resolveWarTheaterState({
    planetId: 'eden_city',
    systemId: 'new_eden',
    holdSide: 'BLUE',
    holds,
    inRotation: true,
  });
  assert.equal(state.kind, 'capital_hold');
  assert.equal(state.inRotation, false);
  assert.equal(state.economyDaily, 'none');
  assert.equal(state.garrisonEligible, false);
  assert.equal(shouldSkipWdiForWarTheater('eden_city', 'new_eden', holds), false);
});

test('드라코 시드 분쟁 → static_seed · 여파 · 로테이션이면 주둔', () => {
  const holds = newEdenFrontHolds();
  const state = resolveWarTheaterState({
    planetId: 'draco_haven',
    systemId: 'draco_nebula',
    holdSide: 'BLUE',
    holds,
    seedContested: true,
    inRotation: true,
  });
  assert.equal(state.kind, 'static_seed');
  assert.equal(state.economyDaily, 'aftermath');
  assert.equal(state.garrisonEligible, true);
  assert.equal(shouldSkipWdiForWarTheater('draco_haven', 'draco_nebula', holds), true);
});

test('헬리오스 캠페인 → campaign · 여파+주둔 · WDI 스킵', () => {
  const holds = newEdenFrontHolds();
  const state = resolveWarTheaterState({
    planetId: 'helios_core',
    systemId: 'helios',
    holdSide: 'BLUE',
    holds,
    seedContested: false,
    dynamicContested: false,
    inRotation: true,
  });
  assert.equal(state.kind, 'campaign');
  assert.equal(state.economyDaily, 'aftermath');
  assert.equal(state.garrisonEligible, true);
  assert.equal(shouldSkipWdiForWarTheater('helios_core', 'helios', holds), true);
});

test('후방 행성 → WDI 유지 · 주둔 없음', () => {
  const holds = newEdenFrontHolds();
  const state = resolveWarTheaterState({
    planetId: 'solar_station',
    systemId: 'solar_port',
    holdSide: 'BLUE',
    holds,
    seedContested: false,
    dynamicContested: false,
    inRotation: false,
  });
  assert.equal(state.kind, 'none');
  assert.equal(state.economyDaily, 'wdi');
  assert.equal(state.garrisonEligible, false);
  assert.equal(shouldSkipWdiForWarTheater('solar_station', 'solar_port', holds), false);
});
