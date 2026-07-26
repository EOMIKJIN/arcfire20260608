/**
 * 보급선(노드 연결) 전투 가산 — unit tests
 * npx tsx src/arcCore/territorial/territorialSupplyLine.test.ts
 */
import assert from 'node:assert/strict';
import {
  countAdjacentFriendlySystems,
  listAdjacentSystemIds,
  resolveSupplyPowerMul,
} from './territorialSupplyLine';
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

const SUPPLY_POLICY = {
  supplyIsolatedPenaltyPct: 35,
  supplyBonusPctPerNode: 6,
  supplyBonusCapPct: 18,
};

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

test('listAdjacentSystemIds — sirius 자기참조 없음·3개 인접', () => {
  const adj = listAdjacentSystemIds('sirius');
  assert.equal(adj.includes('sirius'), false);
  assert.deepEqual([...adj].sort(), ['crimson_zone', 'draco_nebula', 'perseus']);
});

test('listAdjacentSystemIds — unknown system → []', () => {
  assert.deepEqual(listAdjacentSystemIds('__unknown__'), []);
});

test('countAdjacentFriendlySystems — 시리우스 실측 시나리오(인접 전부 레드) → BLUE 0 / RED 3', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_red'),
    crimson_base: makeHold('crimson_base', 'crimson_zone', 'balance_seed_faction_red'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'balance_seed_faction_red'),
  };
  assert.equal(
    countAdjacentFriendlySystems({ systemId: 'sirius', side: 'BLUE', holds }),
    0,
  );
  assert.equal(
    countAdjacentFriendlySystems({ systemId: 'sirius', side: 'RED', holds }),
    3,
  );
});

test('countAdjacentFriendlySystems — 런타임 점유 변화 반영(드라코 중립화 → RED 2)', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'neutral'),
    crimson_base: makeHold('crimson_base', 'crimson_zone', 'balance_seed_faction_red'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'balance_seed_faction_red'),
  };
  assert.equal(
    countAdjacentFriendlySystems({ systemId: 'sirius', side: 'RED', holds }),
    2,
  );
});

test('resolveSupplyPowerMul — 고립 0.65 · 노드당 +6% · 상한 +18%', () => {
  assert.equal(resolveSupplyPowerMul(SUPPLY_POLICY, 0), 0.65);
  assert.equal(resolveSupplyPowerMul(SUPPLY_POLICY, 1), 1.06);
  assert.equal(resolveSupplyPowerMul(SUPPLY_POLICY, 2), 1.12);
  assert.equal(resolveSupplyPowerMul(SUPPLY_POLICY, 4), 1.18);
});

test('블루 5% 요건 — 고립 배율비가 노이즈 밴드(±12%) 하한 밖 → 전투 승리 확률 0', () => {
  // 파워 대등 가정: 블루 유효 최대 = 0.65×1.12, 레드 유효 최소 = 1.12×1.08(방어우세)×0.88
  const blueMax = resolveSupplyPowerMul(SUPPLY_POLICY, 0) * 1.12;
  const redMin = resolveSupplyPowerMul(SUPPLY_POLICY, 2) * 1.08 * 0.88;
  assert.ok(
    blueMax < redMin,
    `blueMax=${blueMax.toFixed(3)} < redMin=${redMin.toFixed(3)} 이어야 함`,
  );
});

// ── 정치관계 CSV · 동맹 보급 변수(기반 · 기본 OFF) ──
import {
  getFactionRelation,
  isHostileFactionPair,
  listSupplyEligibleFactions,
} from './factionPoliticalRelations';

test('factionPoliticalRelations — 적대·동맹 관계 CSV 정본', () => {
  assert.equal(isHostileFactionPair('BLUE', 'RED'), true);
  assert.equal(isHostileFactionPair('INDEPENDENT', 'RED'), true);
  assert.equal(getFactionRelation('INDEPENDENT', 'BLUE').relation, 'ally');
  assert.equal(getFactionRelation('RED', 'BLUE').relation, 'hostile'); // 대칭 조회
});

test('동맹 보급 변수 — 전 쌍 OFF(기본) → 보급 인정 = 자기 팩션 단독', () => {
  assert.equal(getFactionRelation('INDEPENDENT', 'BLUE').allySupplyEnabled, false);
  assert.deepEqual(listSupplyEligibleFactions('BLUE'), ['BLUE']);
  assert.deepEqual(listSupplyEligibleFactions('RED'), ['RED']);
  assert.deepEqual(listSupplyEligibleFactions('INDEPENDENT'), ['INDEPENDENT']);
});

test('동맹 보급 OFF — 인접 블루 성계는 블루에게만 보급 노드(기존 동작 유지)', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_blue'),
    crimson_base: makeHold('crimson_base', 'crimson_zone', 'balance_seed_faction_red'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'neutral'),
  };
  assert.equal(
    countAdjacentFriendlySystems({ systemId: 'sirius', side: 'BLUE', holds }),
    1,
  );
  assert.equal(
    countAdjacentFriendlySystems({ systemId: 'sirius', side: 'RED', holds }),
    1,
  );
});

// ── 독립국(플레이어 국가) 팩션 — hold side·적대 인접·공격자 후보 ──
import {
  hasAdjacentHostileFactionSystem,
  listHostileFactions,
} from './territorialSupplyLine';
import { resolveHoldFactionSide } from './territorialFactionSide';

test('resolveHoldFactionSide — 플레이어 솔로클랜 → INDEPENDENT · ai_clan은 NEUTRAL 유지', () => {
  assert.equal(resolveHoldFactionSide('solo_clan_519f756a7517ac11'), 'INDEPENDENT');
  assert.equal(resolveHoldFactionSide('ai_clan_governor_07'), 'NEUTRAL');
  assert.equal(resolveHoldFactionSide('balance_seed_faction_red'), 'RED');
  assert.equal(resolveHoldFactionSide('neutral'), 'NEUTRAL');
  assert.equal(resolveHoldFactionSide(null), 'NEUTRAL');
});

test('listHostileFactions — INDEPENDENT의 적대 = RED만(블루는 동맹)', () => {
  assert.deepEqual(listHostileFactions('INDEPENDENT'), ['RED']);
  assert.deepEqual(listHostileFactions('BLUE'), ['RED']);
});

test('hasAdjacentHostileFactionSystem — 인접 레드 有 → 편입 대상 · 전부 중립/동맹 → 대상 아님', () => {
  const holdsHostile: Record<string, PlanetClanHold> = {
    crimson_base: makeHold('crimson_base', 'crimson_zone', 'balance_seed_faction_red'),
  };
  assert.equal(
    hasAdjacentHostileFactionSystem({ systemId: 'sirius', side: 'INDEPENDENT', holds: holdsHostile }),
    true,
  );
  const holdsSafe: Record<string, PlanetClanHold> = {
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_blue'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'neutral'),
  };
  assert.equal(
    hasAdjacentHostileFactionSystem({ systemId: 'sirius', side: 'INDEPENDENT', holds: holdsSafe }),
    false,
  );
});

test('독립국 보급 — 인접 성계의 플레이어 점유(solo_clan)만 INDEPENDENT 보급 노드', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'solo_clan_519f756a7517ac11'),
    crimson_base: makeHold('crimson_base', 'crimson_zone', 'balance_seed_faction_red'),
  };
  assert.equal(
    countAdjacentFriendlySystems({ systemId: 'sirius', side: 'INDEPENDENT', holds }),
    1,
  );
  assert.equal(countAdjacentFriendlySystems({ systemId: 'sirius', side: 'RED', holds }), 1);
  assert.equal(countAdjacentFriendlySystems({ systemId: 'sirius', side: 'BLUE', holds }), 0);
});

// ── M0(front-pressure-tactics) — 보급 mul이 실제로 <1/≥1 되는지 시나리오 검증 ──
test('시리우스형 — INDEPENDENT 방어 + 인접 RED≥2 + 인접 friendly 0 → defender mul < 1(고립)', () => {
  const holds: Record<string, PlanetClanHold> = {
    draco_haven: makeHold('draco_haven', 'draco_nebula', 'balance_seed_faction_red'),
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'balance_seed_faction_red'),
  };
  const adjacentFriendly = countAdjacentFriendlySystems({
    systemId: 'sirius',
    side: 'INDEPENDENT',
    holds,
  });
  assert.equal(adjacentFriendly, 0);
  const defenderMul = resolveSupplyPowerMul(SUPPLY_POLICY, adjacentFriendly);
  assert.ok(defenderMul < 1, `defenderMul=${defenderMul} < 1 이어야 함(고립)`);
});

test('공격자 RED — perseus 등 동팩션 인접 있으면 attacker mul ≥ 1', () => {
  const holds: Record<string, PlanetClanHold> = {
    perseus_memorial: makeHold('perseus_memorial', 'perseus', 'balance_seed_faction_red'),
  };
  const adjacentFriendly = countAdjacentFriendlySystems({
    systemId: 'sirius',
    side: 'RED',
    holds,
  });
  assert.ok(adjacentFriendly >= 1);
  const attackerMul = resolveSupplyPowerMul(SUPPLY_POLICY, adjacentFriendly);
  assert.ok(attackerMul >= 1, `attackerMul=${attackerMul} >= 1 이어야 함(보급 확보)`);
});

console.log('[territorialSupplyLine] all tests passed');
