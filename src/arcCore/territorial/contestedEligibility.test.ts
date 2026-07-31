/**
 * 분쟁지역 Eligibility 분류 — unit tests (task_id=contested-eligibility-pool-governor-20260731)
 * npx tsx --test src/arcCore/territorial/contestedEligibility.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  classifyContestedEligibility,
  isContestedEligibilityActive,
  resolveContestedEligibilityForSystem,
} from './contestedEligibility';
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

test('1) BLUE hold + 적대 인접=0 → safe_hinterland', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'BLUE',
    adjacency: { blue: 2, red: 0 },
    hasAdjacentHostile: false,
  });
  assert.equal(cls, 'safe_hinterland');
});

test('2) 섀도우 넥서스 RED 완포위 실측 재현 — resolveContestedEligibilityForSystem으로 safe_hinterland', () => {
  // shadow_nexus 1홉: titan_gate·dark_rift·abyss — 전부 RED 점유로 완포위 시뮬레이션
  const holds: Record<string, PlanetClanHold> = {
    titan_ruins: makeHold('titan_ruins', 'titan_gate', 'balance_seed_faction_red'),
    dark_haven: makeHold('dark_haven', 'dark_rift', 'balance_seed_faction_red'),
    abyss_gate: makeHold('abyss_gate', 'abyss', 'balance_seed_faction_red'),
  };
  const cls = resolveContestedEligibilityForSystem({
    systemId: 'shadow_nexus',
    holdSide: 'RED',
    holds,
  });
  assert.equal(cls, 'safe_hinterland', '섀도우가 RED 완포위면 분쟁 로테이션에서 제외돼야 함');
});

test('2b) 섀도우 넥서스 — 인접 1곳만 BLUE로 바뀌면 더 이상 safe 아님(eligible_front, RED hold+블루 인접)', () => {
  const holds: Record<string, PlanetClanHold> = {
    titan_ruins: makeHold('titan_ruins', 'titan_gate', 'balance_seed_faction_blue'),
    dark_haven: makeHold('dark_haven', 'dark_rift', 'balance_seed_faction_red'),
    abyss_gate: makeHold('abyss_gate', 'abyss', 'balance_seed_faction_red'),
  };
  const cls = resolveContestedEligibilityForSystem({
    systemId: 'shadow_nexus',
    holdSide: 'RED',
    holds,
  });
  assert.equal(cls, 'eligible_front');
});

test('3) 1홉에 블루·레드 둘 다 → eligible_front (holdSide 무관 — BLUE hold라도)', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'BLUE',
    adjacency: { blue: 1, red: 1 },
    hasAdjacentHostile: true,
  });
  assert.equal(cls, 'eligible_front');
});

test('4) NEUTRAL hold + 블루만 인접 → eligible_strategic_neutral', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'NEUTRAL',
    adjacency: { blue: 1, red: 0 },
    hasAdjacentHostile: false,
  });
  assert.equal(cls, 'eligible_strategic_neutral');
});

test('4b) NEUTRAL hold + 레드만 인접 → eligible_strategic_neutral', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'NEUTRAL',
    adjacency: { blue: 0, red: 2 },
    hasAdjacentHostile: false,
  });
  assert.equal(cls, 'eligible_strategic_neutral');
});

test('4c) NEUTRAL hold + 인접 0(고립 중립) → ineligible', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'NEUTRAL',
    adjacency: { blue: 0, red: 0 },
    hasAdjacentHostile: false,
  });
  assert.equal(cls, 'ineligible');
});

test('5) INDEPENDENT hold + 적대(RED) 인접 → eligible_independent_front', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'INDEPENDENT',
    adjacency: { blue: 0, red: 1 },
    hasAdjacentHostile: true,
  });
  assert.equal(cls, 'eligible_independent_front');
});

test('5b) INDEPENDENT hold + 적대 인접 없음(동맹 BLUE만) → ineligible(SAFE 대상 아님 — 독립국은 safe_hinterland 미해당)', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'INDEPENDENT',
    adjacency: { blue: 1, red: 0 },
    hasAdjacentHostile: false,
  });
  assert.equal(cls, 'ineligible');
});

test('6) BLUE hold + 적대(RED)만 인접(아군 인접 없음) → adjBlue&&adjRed 미충족이라 ineligible(스펙 리터럴)', () => {
  const cls = classifyContestedEligibility({
    holdSide: 'BLUE',
    adjacency: { blue: 0, red: 1 },
    hasAdjacentHostile: true,
  });
  assert.equal(cls, 'ineligible');
});

test('7) RED hold + 적대(INDEPENDENT)만 인접, BLUE 없음 → NOT SAFE(hasAdjacentHostile=true)지만 adjRed 자기자신 카운트 아니므로 ineligible', () => {
  // RED hold인데 인접에 BLUE/RED 점유가 전혀 없고 INDEPENDENT만 있는 경우 —
  // adjacency(blue/red 카운트)는 0/0이지만 hasAdjacentHostile=true(INDEPENDENT는 RED의 적대)라 safe는 아님.
  const cls = classifyContestedEligibility({
    holdSide: 'RED',
    adjacency: { blue: 0, red: 0 },
    hasAdjacentHostile: true,
  });
  assert.equal(cls, 'ineligible');
});

test('8) isContestedEligibilityActive — safe만 false, 나머지는 true', () => {
  assert.equal(isContestedEligibilityActive('safe_hinterland'), false);
  assert.equal(isContestedEligibilityActive('eligible_front'), true);
  assert.equal(isContestedEligibilityActive('eligible_strategic_neutral'), true);
  assert.equal(isContestedEligibilityActive('eligible_independent_front'), true);
  assert.equal(isContestedEligibilityActive('ineligible'), true);
});

test('9) M2 배선 확인(정적) — runTerritorialCombatPass.ts가 SAFE면 판정 없이 커서만 전진(advanceTerritorialCampaignCursorForSkip)', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  assert.match(src, /classification !== 'safe_hinterland'/);
  assert.match(src, /advanceTerritorialCampaignCursorForSkip\(group, due\.orderIndex, groupPolicies\.length\)/);
});

test('10) M6 배선 확인(정적) — runTerritorialCombatPass()가 dirty일 때만 풀 거버너 rebalance 호출(onBoot 동기 전수 아님)', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  assert.match(src, /rebalanceContestedPoolsIfDirty\(nowMs\)/);
});

test('11) planetId 하드코딩 없음(shadow_market/shadow_nexus 등) — contestedEligibility·contestedPoolGovernor·glue 전부', () => {
  const files = [
    'contestedEligibility.ts',
    'contestedPoolGovernor.ts',
    'contestedPoolGovernorSync.ts',
  ];
  const hardcodePattern = /planetId\s*===\s*['"](shadow_market|omega_hub|draco_haven|helios_core|titan_ruins)['"]/;
  for (const file of files) {
    const src = readFileSync(resolve(__dirname, file), 'utf8');
    assert.equal(hardcodePattern.test(src), false, `${file}에 planetId 하드코딩 분기가 있으면 안 됨`);
  }
});

console.log('[contestedEligibility] all tests passed');
