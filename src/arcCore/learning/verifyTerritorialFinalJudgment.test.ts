/**
 * 분쟁 최종 판정 검증 — 확연 비논리만
 * npx tsx src/arcCore/learning/verifyTerritorialFinalJudgment.test.ts
 */
import assert from 'node:assert/strict';
import type { FactionPowerKpiCompact } from './factionPowerTypes';
import {
  resolveTerritorialLocalBlowoutWinner,
  shouldVetoWeakerHoldTransfer,
} from './verifyTerritorialFinalJudgment';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function kpi(partial: Partial<FactionPowerKpiCompact>): FactionPowerKpiCompact {
  return {
    bluePlanets: 5,
    redPlanets: 5,
    bluePgp: 100,
    redPgp: 100,
    blueFleet: 100,
    redFleet: 100,
    blueVault: 0,
    redVault: 0,
    f1Pgp: 0,
    f2Pgp: 0,
    f3Pgp: 0,
    f4Pgp: 0,
    blueCaptures24h: 0,
    redCaptures24h: 0,
    divergenceCount: 0,
    warLeaderByPlanets: 'tie',
    quadLeaderByPgp: 'tie',
    ...partial,
  };
}

test('R1 접전은 롤 승자 유지', () => {
  const r = resolveTerritorialLocalBlowoutWinner({
    attackerPower: 110,
    defenderPower: 100,
    rolledWinner: 'defender',
  });
  assert.deepEqual(r, { winner: 'defender', locked: false });
});

test('R1 1.5배 이상이면 롤과 달라도 강자 고정', () => {
  const r = resolveTerritorialLocalBlowoutWinner({
    attackerPower: 150,
    defenderPower: 100,
    rolledWinner: 'defender',
  });
  assert.deepEqual(r, { winner: 'attacker', locked: true });
});

test('R2 KPI 없거나 점유 유지면 거부 없음', () => {
  assert.equal(
    shouldVetoWeakerHoldTransfer({
      kpi: null,
      previousSide: 'red',
      newSide: 'blue',
      attackerSide: 'BLUE',
      defenderSide: 'RED',
      attackerPower: 10,
      defenderPower: 90,
    }),
    false,
  );
  assert.equal(
    shouldVetoWeakerHoldTransfer({
      kpi: kpi({ bluePlanets: 2, redPlanets: 9, bluePgp: 1, redPgp: 9, blueFleet: 1, redFleet: 9 }),
      previousSide: 'blue',
      newSide: 'blue',
      attackerSide: 'BLUE',
      defenderSide: 'RED',
      attackerPower: 10,
      defenderPower: 90,
    }),
    false,
  );
});

test('R2 은하 2축+ 열세이고 로컬도 열세인 점유 이전만 거부', () => {
  const weakBlue = kpi({
    bluePlanets: 3,
    redPlanets: 9,
    bluePgp: 10,
    redPgp: 90,
    blueFleet: 10,
    redFleet: 90,
  });
  assert.equal(
    shouldVetoWeakerHoldTransfer({
      kpi: weakBlue,
      previousSide: 'red',
      newSide: 'blue',
      attackerSide: 'BLUE',
      defenderSide: 'RED',
      attackerPower: 40,
      defenderPower: 80,
    }),
    true,
  );
  assert.equal(
    shouldVetoWeakerHoldTransfer({
      kpi: weakBlue,
      previousSide: 'red',
      newSide: 'blue',
      attackerSide: 'BLUE',
      defenderSide: 'RED',
      attackerPower: 90,
      defenderPower: 40,
    }),
    false,
  );
});

test('R2 중립화·1축 열세는 거부하지 않음', () => {
  assert.equal(
    shouldVetoWeakerHoldTransfer({
      kpi: kpi({ bluePlanets: 3, redPlanets: 9 }),
      previousSide: 'red',
      newSide: 'neutral',
      attackerSide: 'BLUE',
      defenderSide: 'RED',
      attackerPower: 10,
      defenderPower: 90,
    }),
    false,
  );
});

console.log('verifyTerritorialFinalJudgment.test.ts — all PASS');
