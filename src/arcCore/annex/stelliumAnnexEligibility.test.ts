/**
 * 스텔리움 편입 게이트
 * npx tsx --test src/arcCore/annex/stelliumAnnexEligibility.test.ts
 */
import assert from 'node:assert/strict';
import type { PlanetClanHold } from '../../types';
import {
  evaluateStelliumAnnexEligibility,
  hasStelliumAnnexFriendlyAdjacency,
  shouldHoldNpcOccupyAfterPlayerNeutralize,
  shouldShowStelliumAnnexAction,
} from './stelliumAnnexEligibility';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const BASE = {
  policyEnabled: true,
  isCorePlanet: true,
  excluded: false,
  occupationCombatEnabled: true,
  hold: undefined as PlanetClanHold | undefined,
  landedHere: true,
  defenseSatLevel: 1,
  requireDefenseSatLevel: 1,
  hasFriendlyAdjacency: true,
  vaultCredits: 8000,
  costCredits: 8000,
};

test('코어 중립 + 위성 L1 + 접선 + 금고 — 허용', () => {
  assert.deepEqual(evaluateStelliumAnnexEligibility(BASE), { ok: true });
});

test('위성 미달 — sat_required · 버튼은 보임', () => {
  const gate = evaluateStelliumAnnexEligibility({ ...BASE, defenseSatLevel: 0 });
  assert.deepEqual(gate, { ok: false, reason: 'sat_required' });
  assert.equal(shouldShowStelliumAnnexAction(gate), true);
});

test('RED 홀드 — not_neutral · 버튼 숨김', () => {
  const hold = {
    planetId: 'sirius_border',
    systemId: 'sirius',
    occupierClanId: 'balance_seed_faction_red',
    kind: 'clan_hold',
    capturedAt: 1,
  } as PlanetClanHold;
  const gate = evaluateStelliumAnnexEligibility({ ...BASE, hold });
  assert.deepEqual(gate, { ok: false, reason: 'not_neutral' });
  assert.equal(shouldShowStelliumAnnexAction(gate), false);
});

test('분쟁 풀 여부는 게이트에 없음 — 중립이면 통과', () => {
  const hold = {
    planetId: 'sirius_border',
    systemId: 'sirius',
    occupierClanId: 'neutral',
    kind: 'neutral',
    capturedAt: 1,
    neutralizedAt: 10,
  } as PlanetClanHold;
  assert.deepEqual(evaluateStelliumAnnexEligibility({ ...BASE, hold }), { ok: true });
});

test('독립국 홀드 — player_hold', () => {
  const hold = {
    planetId: 'x',
    systemId: 's',
    occupierClanId: 'solo_abc',
    kind: 'player_independent',
    capturedAt: 1,
  } as PlanetClanHold;
  assert.deepEqual(
    evaluateStelliumAnnexEligibility({ ...BASE, hold }),
    { ok: false, reason: 'player_hold' },
  );
});

test('이터니티 제외', () => {
  assert.deepEqual(
    evaluateStelliumAnnexEligibility({ ...BASE, excluded: true }),
    { ok: false, reason: 'excluded' },
  );
});

test('인접 블루 또는 독립국이면 접선', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: {
      planetId: 'draco_haven',
      systemId: 'draco_nebula',
      occupierClanId: 'balance_seed_faction_blue',
      kind: 'clan_hold',
      capturedAt: 1,
    } as PlanetClanHold,
  };
  assert.equal(hasStelliumAnnexFriendlyAdjacency('sirius', holds), true);
  assert.equal(hasStelliumAnnexFriendlyAdjacency('sirius', {}), false);
});

test('인접 player_home이면 접선 — 아르카디아 부트스트랩', () => {
  const holds: Record<string, PlanetClanHold> = {
    arcadia_prime: {
      planetId: 'arcadia_prime',
      systemId: 'arcadia',
      occupierClanId: 'balance_seed_faction_blue',
      kind: 'player_home',
      capturedAt: 1,
    } as PlanetClanHold,
  };
  assert.equal(hasStelliumAnnexFriendlyAdjacency('solar_port', holds), true);
  assert.equal(hasStelliumAnnexFriendlyAdjacency('vega_outpost', holds), true);
  assert.equal(hasStelliumAnnexFriendlyAdjacency('sirius', holds), false);
});

test('웨이브 중립화 보호창 — 만료 전 NPC 점유 보류', () => {
  const hold = {
    planetId: 'p',
    systemId: 's',
    occupierClanId: 'neutral',
    kind: 'neutral',
    capturedAt: 1,
    neutralizedAt: 1_000,
  } as PlanetClanHold;
  assert.equal(
    shouldHoldNpcOccupyAfterPlayerNeutralize({ hold, nowMs: 1_000 + 1_799_999, protectMs: 1_800_000 }),
    true,
  );
  assert.equal(
    shouldHoldNpcOccupyAfterPlayerNeutralize({ hold, nowMs: 1_000 + 1_800_000, protectMs: 1_800_000 }),
    false,
  );
  assert.equal(
    shouldHoldNpcOccupyAfterPlayerNeutralize({ hold: { ...hold, occupierClanId: 'balance_seed_faction_red' }, nowMs: 2_000, protectMs: 1_800_000 }),
    false,
  );
});

console.log('stelliumAnnexEligibility.test.ts — all PASS');
