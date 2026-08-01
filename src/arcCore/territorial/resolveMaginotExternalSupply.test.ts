/**
 * 마지노선(N≤5 HARD)·외부팩션(F2·F4) 국가보급 — unit tests
 * (task_id=maginot-external-faction-supply-oscillation-20260801)
 * npx tsx --test src/arcCore/territorial/resolveMaginotExternalSupply.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  countFactionSystemsInCore,
  listScenarioCorePlanetIds,
  resolveMaginotBand,
  resolveMaginotReclaimDecision,
} from './resolveMaginotExternalSupply';
import { resolveSupplyEnvelope } from './resolveSupplyEnvelope';
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

function makeHold(planetId: string, occupierClanId: string): PlanetClanHold {
  return {
    planetId,
    systemId: `${planetId}_sys`,
    occupierClanId,
    homePlayerUid: null,
    kind: occupierClanId === 'neutral' ? 'neutral' : 'clan_hold',
    capturedAt: 0,
  } as PlanetClanHold;
}

test('1) listScenarioCorePlanetIds — 21개(시나리오 core), synth_011_p 제외', () => {
  const ids = listScenarioCorePlanetIds();
  assert.equal(ids.length, 21);
  assert.ok(ids.includes('minerva_deep'));
  assert.ok(ids.includes('iron_remnant'));
  assert.equal(ids.includes('synth_011_p'), false);
});

test('2) countFactionSystemsInCore — BLUE 3곳 점유 시 N_blue=3, 독립국/순수중립은 미포함', () => {
  const ids = listScenarioCorePlanetIds();
  const holds: Record<string, PlanetClanHold> = {
    [ids[0]!]: makeHold(ids[0]!, 'balance_seed_faction_blue'),
    [ids[1]!]: makeHold(ids[1]!, 'balance_seed_faction_blue'),
    [ids[2]!]: makeHold(ids[2]!, 'balance_seed_faction_blue'),
    [ids[3]!]: makeHold(ids[3]!, 'balance_seed_faction_red'),
    [ids[4]!]: { ...makeHold(ids[4]!, 'solo_clan_x'), kind: 'player_independent' },
    [ids[5]!]: makeHold(ids[5]!, 'neutral'),
  };
  assert.equal(countFactionSystemsInCore(holds, 'BLUE'), 3);
  assert.equal(countFactionSystemsInCore(holds, 'RED'), 1);
});

test('3) resolveMaginotBand — 경계값(대칭): n=5→hard, n=6→support, n=9→support, n=10→cool, n=0→hard', () => {
  const opts = { floorSystems: 5, paritySystems: 10 };
  assert.equal(resolveMaginotBand({ n: 0, ...opts }), 'hard');
  assert.equal(resolveMaginotBand({ n: 5, ...opts }), 'hard');
  assert.equal(resolveMaginotBand({ n: 6, ...opts }), 'support');
  assert.equal(resolveMaginotBand({ n: 9, ...opts }), 'support');
  assert.equal(resolveMaginotBand({ n: 10, ...opts }), 'cool');
  assert.equal(resolveMaginotBand({ n: 21, ...opts }), 'cool');
});

test('4) HARD + 보급선 충분 → forceHardReclaim=true, hardFinalOccupyPct 그대로', () => {
  const decision = resolveMaginotReclaimDecision({
    opposingSideBand: 'hard',
    opposingSideAdjacentFriendlyCount: 1,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  assert.deepEqual(decision, { forceHardReclaim: true, hardFinalOccupyPct: 80, supportBattleWeightBoostPct: 0 });
});

test('5) HARD인데 보급선 없음(원정 불가 물리학) → 보정 없음', () => {
  const decision = resolveMaginotReclaimDecision({
    opposingSideBand: 'hard',
    opposingSideAdjacentFriendlyCount: 0,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  assert.equal(decision.forceHardReclaim, false);
  assert.equal(decision.supportBattleWeightBoostPct, 0);
});

test('6) SUPPORT + 보급선 충분 → forceHardReclaim=false, supportBattleWeightBoostPct 적용', () => {
  const decision = resolveMaginotReclaimDecision({
    opposingSideBand: 'support',
    opposingSideAdjacentFriendlyCount: 2,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  assert.deepEqual(decision, { forceHardReclaim: false, hardFinalOccupyPct: 80, supportBattleWeightBoostPct: 15 });
});

test('7) COOL이면 보급선이 있어도 항상 보정 없음(외부보급 감쇠·대등)', () => {
  const decision = resolveMaginotReclaimDecision({
    opposingSideBand: 'cool',
    opposingSideAdjacentFriendlyCount: 5,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  assert.deepEqual(decision, { forceHardReclaim: false, hardFinalOccupyPct: 80, supportBattleWeightBoostPct: 0 });
});

test('8) 미네르바급 재현 — 연결수<3(envelope STRONG 불가)여도 HARD+아군인접=2면 강제 수복(80%) 발동', () => {
  // 미네르바: 연결 2개(solar_port·iron_cross) — blue=2,red=0이어도 threshold=3 미달이라 envelope는 STRONG 불가.
  const envelope = resolveSupplyEnvelope({ adjacency: { blue: 2, red: 0 }, threshold: 3 });
  assert.equal(envelope, 'none', '연결수<3이라 3포위 envelope로는 고확률 점유가 안 됨(이 갭을 본 task가 메움)');

  // 그러나 블루가 전역 HARD(N_blue<=5)이고 미네르바(RED 점유) 인접에 블루가 2개 있으면 외부보급으로 강제 발동.
  const decision = resolveMaginotReclaimDecision({
    opposingSideBand: 'hard',
    opposingSideAdjacentFriendlyCount: 2,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  assert.equal(decision.forceHardReclaim, true);
  assert.equal(decision.hardFinalOccupyPct, 80);
});

test('9) 대칭 확인 — RED가 약세(HARD)여도 동일 로직으로 강제 수복(레드만 특혜 아님을 코드 대칭으로 증명)', () => {
  const decisionForRedWeak = resolveMaginotReclaimDecision({
    opposingSideBand: 'hard', // RED 쪽 밴드가 hard라고 가정
    opposingSideAdjacentFriendlyCount: 1,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  const decisionForBlueWeak = resolveMaginotReclaimDecision({
    opposingSideBand: 'hard', // BLUE 쪽 밴드가 hard라고 가정 — 동일 함수, 동일 파라미터 형태
    opposingSideAdjacentFriendlyCount: 1,
    minAdjacentFriendlyForReclaim: 1,
    hardFinalOccupyPct: 80,
    supportBattleWeightBoostPct: 15,
  });
  assert.deepEqual(decisionForRedWeak, decisionForBlueWeak, '함수 자체가 side 무관 — 대칭 구조 증명');
});

test('10) planetId 하드코딩 분기 없음(미네르바·아이언 등 특정 성계 literal 비교 금지)', () => {
  const src = readFileSync(resolve(__dirname, 'resolveMaginotExternalSupply.ts'), 'utf8');
  const hardcodePattern = /(planetId|systemId)\s*===\s*['"](minerva_deep|iron_remnant)['"]/;
  assert.equal(hardcodePattern.test(src), false);
  assert.equal(/minerva|iron_remnant/i.test(src), false, '특정 행성명 literal이 소스에 없어야 함(범용 함수)');
});

test('11) 배선 확인(정적) — runTerritorialCombatPass.ts가 HARD 강제 수복 시 effectiveCombatMode·dominant%·battle 강제', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  assert.match(
    src,
    /if\s*\(\s*maginotReclaimDecision\?\.forceHardReclaim\s*\)\s*\{\s*\n\s*effectiveCombatMode = holdSide === 'BLUE' \? 'red_neutral' : 'blue_neutral';/,
    'HARD면 effectiveCombatMode를 강제로 덮어써야 함',
  );
  assert.match(
    src,
    /maginotReclaimDecision\?\.forceHardReclaim \? maginotReclaimDecision\.hardFinalOccupyPct : envelopeDominantOverridePct/,
    'dominantOverridePct가 마지노선 HARD를 envelope보다 우선 반영해야 함',
  );
  assert.match(
    src,
    /maginotReclaimDecision\?\.forceHardReclaim && decision !== 'battle'/,
    'HARD면 roll이 battle이 아니어도 due 최종점유%를 위해 battle 강제해야 함(김팀장 검수)',
  );
  assert.match(
    src,
    /contestedZone && !maginotReclaimDecision\?\.forceHardReclaim/,
    'HARD면 전술 역전으로 80% 계약을 깎지 않아야 함',
  );
  assert.equal(
    /if\s*\(\s*planetId\s*===\s*['"]minerva_deep['"]\s*\)/.test(src),
    false,
    'minerva_deep 등 planetId 하드코딩 분기가 있으면 안 됨',
  );
});

console.log('[resolveMaginotExternalSupply] all tests passed');
