/**
 * 4대 항로 수도 방위 컨텍스트
 * npx tsx --test src/arcCore/territorial/resolveCapitalDefenseContext.test.ts
 */
import assert from 'node:assert/strict';
import type { PlanetClanHold } from '../../types';
import { getArcCoreCapitalDefensePolicy } from './arcCoreCapitalDefensePolicy';
import {
  applyCapitalDefenseCombatPolicy,
  applyCapitalDefensePoolScore,
  applyCapitalDefenseRollWeights,
  resolveCapitalDefenseRebellionMul,
} from './applyCapitalDefenseAdjustments';
import {
  resolveCapitalDefenseContext,
  shouldBanCapitalFromContestedPool,
} from './resolveCapitalDefenseContext';
import type { TerritorialCombatPolicy } from './arcCoreTerritorialCombatPolicy';

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
  };
}

test('뉴에덴 BLUE + 아군3·오메가 RED → hold_defense · 풀 승격 금지', () => {
  const holds = newEdenFrontHolds();
  const ctx = resolveCapitalDefenseContext({
    planetId: 'eden_city',
    systemId: 'new_eden',
    holdSide: 'BLUE',
    adjacency: { blue: 3, red: 1 },
    holds,
  });
  assert.equal(ctx.mode, 'hold_defense');
  assert.equal(ctx.isRouteCapital, true);
  assert.equal(ctx.alliedAdjacent, 3);
  assert.equal(ctx.hostileAdjacent, true);
  assert.equal(shouldBanCapitalFromContestedPool(ctx), true);
});

test('지방 베가는 not_capital', () => {
  const ctx = resolveCapitalDefenseContext({
    planetId: 'vega_base',
    systemId: 'vega_outpost',
    holdSide: 'BLUE',
    adjacency: { blue: 2, red: 1 },
    holds: newEdenFrontHolds(),
  });
  assert.equal(ctx.mode, 'not_capital');
  assert.equal(shouldBanCapitalFromContestedPool(ctx), false);
});

test('뉴에덴 아군 0·적만 → siege_open · 풀 허용·가중 배율', () => {
  const holds: Record<string, PlanetClanHold> = {
    eden_city: hold('eden_city', 'new_eden', BLUE),
    solar_station: hold('solar_station', 'solar_port', RED),
    vega_base: hold('vega_base', 'vega_outpost', RED),
    iron_remnant: hold('iron_remnant', 'iron_cross', RED),
    omega_hub: hold('omega_hub', 'omega_station', RED),
  };
  const ctx = resolveCapitalDefenseContext({
    planetId: 'eden_city',
    systemId: 'new_eden',
    holdSide: 'BLUE',
    adjacency: { blue: 0, red: 4 },
    holds,
  });
  assert.equal(ctx.mode, 'siege_open');
  assert.equal(shouldBanCapitalFromContestedPool(ctx), false);
  const w = applyCapitalDefenseRollWeights({
    ctx,
    weights: { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 },
  });
  assert.ok(w.battleWeightPct < 58 && w.neutralDeclareWeightPct < 12);
  assert.ok(w.statusQuoWeightPct > 30);
  assert.equal(applyCapitalDefensePoolScore(115, ctx), 115 - getArcCoreCapitalDefensePolicy().capitalPoolScorePenalty);
});

test('코어 프라임 RED + 아군만 → hold_defense (후방 수도)', () => {
  const holds: Record<string, PlanetClanHold> = {
    core_prime: hold('core_prime', 'arcfire_core', RED),
    abyss_gate: hold('abyss_gate', 'abyss', RED),
    eternal_throne: hold('eternal_throne', 'eternity', RED),
  };
  const ctx = resolveCapitalDefenseContext({
    planetId: 'core_prime',
    systemId: 'arcfire_core',
    holdSide: 'RED',
    adjacency: { blue: 0, red: 2 },
    holds,
  });
  assert.equal(ctx.mode, 'hold_defense');
  assert.equal(ctx.hostileAdjacent, false);
});

test('남부 수도 NEUTRAL → fallen_recapture · 풀 승격 금지', () => {
  const ctx = resolveCapitalDefenseContext({
    planetId: 'synth_706_p',
    systemId: 'synth_706',
    holdSide: 'NEUTRAL',
    adjacency: { blue: 1, red: 0 },
    holds: { synth_706_p: hold('synth_706_p', 'synth_706', 'neutral') },
  });
  assert.equal(ctx.mode, 'fallen_recapture');
  assert.equal(shouldBanCapitalFromContestedPool(ctx), true);
});

test('반란 배율 — hold_defense는 0.35×0.55, 지방은 1', () => {
  const holds = newEdenFrontHolds();
  const capital = resolveCapitalDefenseContext({
    planetId: 'eden_city',
    systemId: 'new_eden',
    holdSide: 'BLUE',
    adjacency: { blue: 3, red: 1 },
    holds,
  });
  const province = resolveCapitalDefenseContext({
    planetId: 'vega_base',
    systemId: 'vega_outpost',
    holdSide: 'BLUE',
    adjacency: { blue: 2, red: 1 },
    holds,
  });
  assert.ok(Math.abs(resolveCapitalDefenseRebellionMul(capital) - 0.35 * 0.55) < 1e-9);
  assert.equal(resolveCapitalDefenseRebellionMul(province), 1);
});

test('siege_open 전투 정책 — 수비 가산·dominance 감', () => {
  const ctx = resolveCapitalDefenseContext({
    planetId: 'eden_city',
    systemId: 'new_eden',
    holdSide: 'BLUE',
    adjacency: { blue: 0, red: 4 },
    holds: {
      eden_city: hold('eden_city', 'new_eden', BLUE),
      solar_station: hold('solar_station', 'solar_port', RED),
      vega_base: hold('vega_base', 'vega_outpost', RED),
      iron_remnant: hold('iron_remnant', 'iron_cross', RED),
      omega_hub: hold('omega_hub', 'omega_station', RED),
    },
  });
  const next = applyCapitalDefenseCombatPolicy(
    { defenderAdvantagePct: 8, dominantSideWeightPct: 70 } as TerritorialCombatPolicy,
    ctx,
  );
  assert.equal(next.defenderAdvantagePct, 26);
  assert.equal(next.dominantSideWeightPct, 50);
});

test('정책 CSV default_v1 로드', () => {
  const p = getArcCoreCapitalDefensePolicy();
  assert.equal(p.policyId, 'default_v1');
  assert.equal(p.enabled, true);
  assert.equal(p.siegeGateAlliedMin, 1);
});

console.log('[resolveCapitalDefenseContext] all tests passed');
