/**
 * 허브 교전 vs 분쟁 차례 웨이브 게이트
 * npx tsx src/game/waveDefense/evaluateHubMainStageCombatGate.test.ts
 */
import assert from 'node:assert/strict';
import { evaluateHubMainStageCombatEntered } from './evaluateHubMainStageCombatGate';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const hubOpen = {
  hubOrbitHostileEntered: true,
  mainStageCombatEnabled: true,
  cooldownActive: false,
  territorialTurnPending: false,
  waveDefenseActiveHere: false,
  waveDefenseSessionHere: false,
};

test('허브 전용 행성 — 메인스테이지 교전 허용', () => {
  assert.equal(evaluateHubMainStageCombatEntered(hubOpen), true);
});

test('분쟁 차례 pending — 허브 교전 억제(웨이브 대기)', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({ ...hubOpen, territorialTurnPending: true }),
    false,
  );
});

test('웨이브 진행 중 — 전투 레이어 유지', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({
      ...hubOpen,
      territorialTurnPending: true,
      waveDefenseActiveHere: true,
      waveDefenseSessionHere: true,
    }),
    true,
  );
});

test('웨이브 ended(결과창) — 허브 재점화 금지', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({
      ...hubOpen,
      waveDefenseActiveHere: false,
      waveDefenseSessionHere: true,
    }),
    false,
  );
});

test('쿨다운 — 허브 재교전 차단', () => {
  assert.equal(evaluateHubMainStageCombatEntered({ ...hubOpen, cooldownActive: true }), false);
});

test('드라코 시험 베뉴 — 웨이브 시작 전 허브 보스 억제', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({ ...hubOpen, dracoCombatTestVenue: true }),
    false,
  );
  assert.equal(
    evaluateHubMainStageCombatEntered({
      ...hubOpen,
      dracoCombatTestVenue: true,
      waveDefenseActiveHere: true,
    }),
    true,
  );
});

test('드라코 베뉴 OFF — CSV 허브 보스 교전 허용', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({ ...hubOpen, dracoCombatTestVenue: false }),
    true,
  );
});

test('mainStage 비활성 — 허브 교전 없음', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({ ...hubOpen, mainStageCombatEnabled: false }),
    false,
  );
});

test('hub_orbit 퀘스트 — 분쟁 pending·허브 OFF여도 Ready', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({
      ...hubOpen,
      mainStageCombatEnabled: false,
      territorialTurnPending: true,
      questHubOrbitActive: true,
    }),
    true,
  );
});

test('hub_orbit 퀘스트 — 쿨다운·웨이브 세션은 그대로 차단', () => {
  assert.equal(
    evaluateHubMainStageCombatEntered({
      ...hubOpen,
      questHubOrbitActive: true,
      cooldownActive: true,
    }),
    false,
  );
  assert.equal(
    evaluateHubMainStageCombatEntered({
      ...hubOpen,
      questHubOrbitActive: true,
      waveDefenseSessionHere: true,
    }),
    false,
  );
});

console.log('evaluateHubMainStageCombatGate.test.ts — all PASS');
