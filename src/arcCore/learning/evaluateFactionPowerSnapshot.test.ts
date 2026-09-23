/**
 * 팩션 전력 스냅샷·비교 — 순수 함수
 * npx tsx --test src/arcCore/learning/evaluateFactionPowerSnapshot.test.ts
 */
import assert from 'node:assert/strict';
import { collectTerritorialLearningOutcomes } from './collectTerritorialLearningOutcomes';
import { compareFactionPowerToTerritorialOutcomes } from './compareFactionPowerToTerritorialOutcomes';
import { evaluateFactionPowerSnapshot } from './evaluateFactionPowerSnapshot';
import { gatherFactionPowerTableInputs } from './gatherFactionPowerTableInputs';
import type { FactionPowerEvaluateInput, TerritorialLearningOutcome } from './factionPowerTypes';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function planet(
  id: string,
  holdSide: FactionPowerEvaluateInput['planets'][number]['holdSide'],
  route: FactionPowerEvaluateInput['planets'][number]['route'],
  extras?: Partial<FactionPowerEvaluateInput['planets'][number]>,
): FactionPowerEvaluateInput['planets'][number] {
  return {
    planetId: id,
    holdSide,
    pgpBmu: extras?.pgpBmu ?? 1000,
    route,
    blueFleetPower: extras?.blueFleetPower ?? 10,
    redFleetPower: extras?.redFleetPower ?? 10,
    governorSide: extras?.governorSide,
    governorTacticsGrade: extras?.governorTacticsGrade,
  };
}

test('1) 주입 hold — 블루 2 / 레드 1, 점유함대는 홀드 측만', () => {
  const snap = evaluateFactionPowerSnapshot({
    nowMs: 1_000,
    source: 'table_seed',
    vaults: { blue: 50, redArcCore: 80 },
    captains: [
      { combatTeam: 'blue', operationalState: 'combat', basePlanetId: 'west_a', initialLevel: 4 },
      { combatTeam: 'red', operationalState: 'combat', basePlanetId: 'east_a', initialLevel: 6 },
      { combatTeam: 'blue', operationalState: 'general', basePlanetId: 'west_a', initialLevel: 9 },
    ],
    planets: [
      planet('west_a', 'BLUE', 'west', { pgpBmu: 2000, blueFleetPower: 30, redFleetPower: 5, governorSide: 'BLUE', governorTacticsGrade: 2 }),
      planet('west_b', 'BLUE', 'west', { pgpBmu: 1000, blueFleetPower: 20, redFleetPower: 5 }),
      planet('east_a', 'RED', 'east', { pgpBmu: 4000, blueFleetPower: 5, redFleetPower: 40, governorSide: 'RED', governorTacticsGrade: -1 }),
      planet('south_a', 'NEUTRAL', 'south', { pgpBmu: 500, blueFleetPower: 0, redFleetPower: 0 }),
    ],
  });
  assert.equal(snap.corePlanetCount, 4);
  assert.equal(snap.war.BLUE.planetCount, 2);
  assert.equal(snap.war.RED.planetCount, 1);
  assert.equal(snap.war.BLUE.pgpBmu, 3000);
  assert.equal(snap.war.RED.pgpBmu, 4000);
  assert.equal(snap.war.BLUE.occupiedFleetPower, 50);
  assert.equal(snap.war.RED.occupiedFleetPower, 40);
  assert.equal(snap.war.BLUE.doctrineFleetPower, 55);
  assert.equal(snap.war.RED.doctrineFleetPower, 50);
  assert.equal(snap.war.BLUE.combatCaptainCount, 1);
  assert.equal(snap.war.RED.combatCaptainCount, 1);
  assert.equal(snap.war.BLUE.governorCount, 1);
  assert.equal(snap.war.RED.governorTacticsGradeSum, -1);
  assert.equal(snap.quad.F1.planetCount, 2);
  assert.equal(snap.quad.F1.holdMix.blue, 2);
  assert.equal(snap.quad.F3.holdMix.red, 1);
  assert.equal(snap.quad.F2.holdMix.neutral, 1);
  assert.equal(snap.quad.F1.combatCaptainCount, 1);
  assert.equal(snap.quad.F3.combatCaptainCount, 1);
  assert.equal(snap.war.RED.vaultLabelKo.includes('월드 공용'), true);
});

test('2) 열세 측이 연속 점유하면 괴리', () => {
  const snap = evaluateFactionPowerSnapshot({
    nowMs: 10_000,
    source: 'table_seed',
    vaults: { blue: 10, redArcCore: 100 },
    captains: [],
    planets: [
      planet('r1', 'RED', 'east', { pgpBmu: 9000, redFleetPower: 90, blueFleetPower: 10 }),
      planet('r2', 'RED', 'east', { pgpBmu: 9000, redFleetPower: 90, blueFleetPower: 10 }),
      planet('b1', 'BLUE', 'west', { pgpBmu: 1000, redFleetPower: 10, blueFleetPower: 10 }),
    ],
  });
  const outcomes: TerritorialLearningOutcome[] = [
    { wallTimeMs: 9000, decision: 'battle', holdChanged: true, previousSide: 'red', newSide: 'blue', source: 'npc_auto' },
    { wallTimeMs: 9500, decision: 'battle', holdChanged: true, previousSide: 'red', newSide: 'blue', source: 'npc_auto' },
    { wallTimeMs: 9600, decision: 'status_quo', holdChanged: false, previousSide: 'red', newSide: 'red', source: 'npc_auto' },
  ];
  const cmp = compareFactionPowerToTerritorialOutcomes(snap, outcomes);
  assert.equal(cmp.blueCaptures, 2);
  assert.equal(cmp.redCaptures, 0);
  assert.equal(cmp.statusQuo, 1);
  assert.equal(cmp.warLeaderByPlanets, 'RED');
  assert.ok(cmp.divergences.some((d) => d.id === 'weaker_blue_gaining'));
  assert.ok(cmp.divergences.some((d) => d.id === 'vault_poor_blue_gaining'));
});

test('3) 테이블 시드 스냅샷 — 21코어 · 블루/레드 · 4대 항로', () => {
  const input = gatherFactionPowerTableInputs({ nowMs: 1, source: 'table_seed' });
  const snap = evaluateFactionPowerSnapshot(input);
  assert.equal(snap.corePlanetCount, 21);
  assert.ok(snap.war.BLUE.planetCount >= 1);
  assert.ok(snap.war.RED.planetCount >= 1);
  let mixBlue = 0;
  let mixRed = 0;
  let mixNeutral = 0;
  let mixIndependent = 0;
  let quadPlanets = 0;
  for (const code of ['F1', 'F2', 'F3', 'F4'] as const) {
    quadPlanets += snap.quad[code].planetCount;
    mixBlue += snap.quad[code].holdMix.blue;
    mixRed += snap.quad[code].holdMix.red;
    mixNeutral += snap.quad[code].holdMix.neutral;
    mixIndependent += snap.quad[code].holdMix.independent;
  }
  assert.equal(quadPlanets, 21);
  assert.equal(mixBlue, snap.war.BLUE.planetCount);
  assert.equal(mixRed, snap.war.RED.planetCount);
  assert.equal(mixBlue + mixRed + mixNeutral + mixIndependent, 21);
  assert.ok(snap.quad.F1.planetCount >= 1);
  assert.ok(snap.quad.F2.planetCount >= 1);
  assert.ok(snap.quad.F3.planetCount >= 1);
  assert.ok(snap.quad.F4.planetCount >= 1);
  assert.equal(snap.quad.F2.vaultCredits, null);
  assert.equal(snap.quad.F4.vaultCredits, null);
  const cmp = compareFactionPowerToTerritorialOutcomes(snap, []);
  assert.equal(cmp.outcomeCount, 0);
  assert.equal(cmp.divergences.length, 0);
});

test('4) 관측이 있으면 operations 폴백을 쓰지 않음', () => {
  const nowMs = 50_000;
  const fromObs = collectTerritorialLearningOutcomes({
    nowMs,
    observations: [
      {
        schemaVersion: 1,
        eventId: 'obs_1',
        kind: 'territorial.pass_result',
        wallTimeMs: 49_000,
        subCoreId: 'territorial_combat_subcore',
        payload: {
          decision: 'status_quo',
          holdChanged: false,
          previousSide: 'blue',
          newSide: 'blue',
          source: 'npc_auto',
        },
      },
    ],
    operations: [
      {
        id: 'op_1',
        attackerClanId: 'balance_seed_faction_red',
        defenderClanId: 'balance_seed_faction_blue',
        targetPlanetId: 'draco_haven',
        phase: 'resolved',
        startedAt: 49_000,
        updatedAt: 49_000,
        ext: { source: 'arc_core_territorial', previousSide: 'blue', newSide: 'red' },
      },
    ],
  });
  assert.equal(fromObs.length, 1);
  assert.equal(fromObs[0]?.decision, 'status_quo');
  assert.equal(fromObs[0]?.holdChanged, false);

  const fallback = collectTerritorialLearningOutcomes({
    nowMs,
    observations: [],
    operations: [
      {
        id: 'op_1',
        attackerClanId: 'balance_seed_faction_red',
        defenderClanId: 'balance_seed_faction_blue',
        targetPlanetId: 'draco_haven',
        phase: 'resolved',
        startedAt: 49_000,
        updatedAt: 49_000,
        ext: { source: 'arc_core_territorial', previousSide: 'blue', newSide: 'red', decision: 'battle' },
      },
    ],
  });
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0]?.source, 'operation_fallback');
  assert.equal(fallback[0]?.holdChanged, true);
});

console.log('evaluateFactionPowerSnapshot.test.ts — all PASS');
