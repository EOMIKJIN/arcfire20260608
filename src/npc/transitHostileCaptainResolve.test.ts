/**
 * 이동중 전투 — 목적지 전용적 · 헐 행성 · 플레이어 TCL 캡
 * npx tsx src/npc/transitHostileCaptainResolve.test.ts
 */
import assert from 'node:assert/strict';
import { TransitCombatCaptainFallback_FROM_BALANCE_CSV } from '../data/balance/generated';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated/csvNpcCaptains';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated/csvNpcCapitalShips';
import { resolveTransitCombatEncounterTargetLevel } from '../arcCore/balance/balanceTableRegistry';
import {
  resolvePlanetIdForCombatLevel,
  resolveTransitHopDangerPolicyForSystem,
} from '../combat/transitHopDangerPolicy';
import { pickTransitHostileCaptain } from './pickTransitHostileCaptain';
import type { NpcCaptain } from '../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const SHIP_IDS = new Set(
  (NPC_CAPITAL_SHIPS_FROM_CSV as ReadonlyArray<{ id: string }>).map((s) => s.id),
);

function fallbackCaptainId(systemId: string): string | null {
  const row = TransitCombatCaptainFallback_FROM_BALANCE_CSV.find((r) => r.systemId === systemId);
  return row?.captainId ?? null;
}

function pick(systemId: string | null, pickOrdinal = 0): NpcCaptain | undefined {
  const policy = systemId ? resolveTransitHopDangerPolicyForSystem(systemId) : null;
  return pickTransitHostileCaptain(NPC_CAPTAINS_FROM_CSV, systemId, {
    hasShip: (id) => SHIP_IDS.has(id),
    allowedInCombat: () => true,
    fallbackCaptainId: systemId ? fallbackCaptainId(systemId) : null,
    levelMin: policy?.levelMin,
    levelMax: policy?.levelMax,
    pickOrdinal,
  });
}

test('아르카디아 — 카일(착륙 전용)은 항로 전용적이 아님', () => {
  const c = pick('arcadia');
  assert.notEqual(c?.id, 'npc_cpt_enemy_arcadia_01');
});

test('베가 — 아르카디아에서 옮긴 일반 항로 해적 니나', () => {
  const c = pick('vega_outpost');
  assert.equal(c?.id, 'npc_cpt_enemy_arcadia_02');
  assert.equal(c?.displayNameEn, 'Nina Forr');
});

test('드라코 — void_walkers 전용적', () => {
  const c = pick('draco_nebula');
  assert.equal(c?.id, 'npc_cpt_enemy_draco_01');
  assert.equal(c?.factionId, 'void_walkers');
});

test('아이언 — scavengers 전용적', () => {
  const c = pick('iron_cross');
  assert.equal(c?.id, 'npc_cpt_enemy_iron_01');
  assert.equal(c?.factionId, 'scavengers');
});

test('시리우스 — 3홉 빈 레벨은 Lv4 신규 함장', () => {
  const c = pick('sirius');
  assert.equal(c?.id, 'npc_cpt_enemy_hop_l04_a');
  assert.equal(c?.progression.initialLevel, 4);
});

test('크림슨 — 4홉 대역 8~14. Lv15 전용적은 빠진다', () => {
  const c = pick('crimson_zone');
  assert.notEqual(c?.id, 'npc_cpt_enemy_crimson_01');
  const lv = c?.progression.initialLevel ?? 0;
  assert.ok(lv >= 8 && lv <= 14, String(lv));
  assert.equal(c?.id, 'npc_cpt_enemy_helios_01');
});

test('이터니티 — ancients 전용적', () => {
  const c = pick('eternity');
  assert.equal(c?.id, 'npc_cpt_enemy_eternity_01');
  assert.equal(c?.factionId, 'ancients');
});

test('제네시스 — CSV 폴백 이터니티 전용적', () => {
  const c = pick('genesis');
  assert.equal(c?.id, 'npc_cpt_enemy_eternity_01');
});

test('헐 행성 — 고른 전투 레벨의 기존 코어 행성', () => {
  const crimson = pick('crimson_zone');
  assert.equal(
    resolvePlanetIdForCombatLevel(crimson?.progression.initialLevel ?? 1),
    'draco_haven',
  );
  const genesis = pick('genesis');
  assert.equal(
    resolvePlanetIdForCombatLevel(genesis?.progression.initialLevel ?? 1),
    'titan_ruins',
  );
});

test('무기 레벨 — 홉 함장 레벨. 플레이어 캡 없음', () => {
  assert.equal(resolveTransitCombatEncounterTargetLevel('crimson_zone', 8), 9);
  assert.equal(resolveTransitCombatEncounterTargetLevel('crimson_zone', 40), 9);
  assert.equal(resolveTransitCombatEncounterTargetLevel('arcadia', 40), 1);
  assert.equal(resolveTransitCombatEncounterTargetLevel('eternity', 60), 35);
});

test('신스 캠프 — 홉 대역 안 전용적', () => {
  const c = pick('synth_011');
  const policy = resolveTransitHopDangerPolicyForSystem('synth_011');
  assert.ok(c, 'synth fallback captain');
  const lv = c!.progression.initialLevel;
  assert.ok(lv >= policy.levelMin && lv <= policy.levelMax, `${c!.id} ${lv}`);
});

test('같은 성계 재조우 — 다음 번호는 다른 함장', () => {
  const first = pick('vega_outpost', 0);
  const second = pick('vega_outpost', 1);
  assert.equal(first?.id, 'npc_cpt_enemy_arcadia_02');
  assert.equal(second?.id, 'npc_cpt_enemy_vega_01');
});

test('systemId 없음 — 시드 없음', () => {
  assert.equal(pick(null), undefined);
  assert.equal(pick(''), undefined);
});

console.log('transitHostileCaptainResolve.test.ts — all PASS');
