/**
 * 이동중 전투 — 목적지 전용적 · 헐 행성 · 플레이어 TCL 캡
 * npx tsx src/npc/transitHostileCaptainResolve.test.ts
 */
import assert from 'node:assert/strict';
import { TransitCombatCaptainFallback_FROM_BALANCE_CSV } from '../data/balance/generated';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated/csvNpcCaptains';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated/csvNpcCapitalShips';
import {
  resolvePlayScenarioPrimaryPlanetId,
  resolveTransitCombatEncounterTargetLevel,
  resolveCombatEncounterTargetLevel,
} from '../arcCore/balance/balanceTableRegistry';
import { applyPlanetHostileHullScale } from '../combat/planetHostileHullScale';
import {
  pickTransitHostileCaptain,
  resolveTransitHostileHullScalePlanetIdForCaptain,
} from './pickTransitHostileCaptain';
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

function pick(systemId: string | null): NpcCaptain | undefined {
  return pickTransitHostileCaptain(NPC_CAPTAINS_FROM_CSV, systemId, {
    hasShip: (id) => SHIP_IDS.has(id),
    allowedInCombat: () => true,
    fallbackCaptainId: systemId ? fallbackCaptainId(systemId) : null,
    destTcl: resolveCombatEncounterTargetLevel('__transit__', systemId),
    tclForSystem: (sid) => resolveCombatEncounterTargetLevel('__transit__', sid),
  });
}

test('아르카디아 — 전용적 카일, 허브/예비 해적 아님', () => {
  const c = pick('arcadia');
  assert.equal(c?.id, 'npc_cpt_enemy_arcadia_01');
});

test('베가 — enemy_vega_01, raid_scar 아님', () => {
  const c = pick('vega_outpost');
  assert.equal(c?.id, 'npc_cpt_enemy_vega_01');
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

test('크림슨 — 전용적 로크, 함장Lv 15', () => {
  const c = pick('crimson_zone');
  assert.equal(c?.id, 'npc_cpt_enemy_crimson_01');
  assert.equal(c?.progression.initialLevel, 15);
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

test('헐 행성 — 목적지 전용적은 목적지 주 행성', () => {
  assert.equal(resolvePlayScenarioPrimaryPlanetId('crimson_zone'), 'crimson_base');
  assert.equal(
    resolveTransitHostileHullScalePlanetIdForCaptain('crimson_zone', pick('crimson_zone')),
    'crimson_base',
  );
});

test('헐 행성 — 제네시스 폴백은 이터니티 거점(6× 미적용)', () => {
  assert.equal(
    resolveTransitHostileHullScalePlanetIdForCaptain('genesis', pick('genesis')),
    'eternal_throne',
  );
  const scaled = applyPlanetHostileHullScale('eternal_throne', {
    maxHp: 790,
    maxShield: 265,
    armor: 19,
  });
  assert.equal(scaled.maxHp, 2370);
});

test('무기 TCL 캡 — 플레이어 8 · 크림슨 25 → 8', () => {
  assert.equal(resolveTransitCombatEncounterTargetLevel('crimson_zone', 8), 8);
  assert.equal(resolveTransitCombatEncounterTargetLevel('crimson_zone', 40), 25);
  assert.equal(resolveTransitCombatEncounterTargetLevel('arcadia', 40), 1);
  assert.equal(resolveTransitCombatEncounterTargetLevel('eternity', 60), 60);
});

test('신스 캠프 — 전용적 없으면 TCL 최근접 폴백(공란 아님)', () => {
  const c = pick('synth_011');
  assert.ok(c, 'synth fallback captain');
  assert.ok(c!.id.startsWith('npc_cpt_enemy_'));
});

test('systemId 없음 — 시드 없음', () => {
  assert.equal(pick(null), undefined);
  assert.equal(pick(''), undefined);
});

console.log('transitHostileCaptainResolve.test.ts — all PASS');
