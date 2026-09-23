/**
 * 웨이브 착륙 게이트 — 순수 판정 (RN 스토어 비의존)
 * npx tsx src/game/waveDefense/resolvePlanetWaveCombatTrigger.test.ts
 */
import assert from 'node:assert/strict';
import { evaluatePlanetWaveCombatTrigger } from './evaluatePlanetWaveCombatTrigger';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('분쟁외 블루 웨이브 착륙 — 차단', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: false,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, false);
  assert.equal(r.rule, 'not_sequential_contested');
});

test('순차 리스트 중립 착륙 — 자동 웨이브 없음(차례 대기)', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: true,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, false);
  assert.equal(r.rule, 'none');
});

test('순차 리스트 체류 + 분쟁 차례 — territorial_turn', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: true,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: true,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'territorial_turn');
});

test('분쟁 차례는 승리 쿨다운보다 선행', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'default',
    onSequentialList: true,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: true,
    territorialTurnPending: true,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'territorial_turn');
  assert.equal(r.variant, 'draco_wave');
});

test('순차 리스트 RED 일반 착륙 — 웨이브 없음', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: true,
    stayBlocked: true,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, false);
  assert.equal(r.rule, 'none');
});

test('순차 리스트 RED [전투] — planet_assault', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: true,
    stayBlocked: true,
    assaultActive: true,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'planet_assault');
});

test('분쟁외 RED [전투] — 허용·planet_assault', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: false,
    stayBlocked: true,
    assaultActive: true,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'planet_assault');
  assert.equal(r.variant, 'draco_wave');
});

test('분쟁외 RED [전투] default variant — planet_assault·draco_wave', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'default',
    onSequentialList: false,
    stayBlocked: true,
    assaultActive: true,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'planet_assault');
  assert.equal(r.variant, 'draco_wave');
});

test('endgame_boss — 리스트 없어도 웨이브 유지', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'endgame_boss',
    onSequentialList: false,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'csv_variant');
});

test('draco_boss — 웨이브 아님', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_boss',
    onSequentialList: true,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, false);
  assert.equal(r.rule, 'none');
});

test('채팅 지정 진입 — chat_armed·stay 무관', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'default',
    onSequentialList: false,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
    chatArmedPending: true,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'chat_armed');
  assert.equal(r.variant, 'draco_wave');
});

test('hub_orbit 락 — 분쟁 차례 웨이브 보류', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: true,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: true,
    questHubOrbitHold: true,
  });
  assert.equal(r.enabled, false);
  assert.equal(r.rule, 'quest_hub_orbit_hold');
});

test('hub_orbit 락 — endgame_boss 는 보류하지 않음', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'endgame_boss',
    onSequentialList: false,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: false,
    territorialTurnPending: false,
    questHubOrbitHold: true,
  });
  assert.equal(r.enabled, true);
  assert.equal(r.rule, 'csv_variant');
});

test('승리 쿨다운 — 분쟁 차례가 없으면 선행 차단', () => {
  const r = evaluatePlanetWaveCombatTrigger({
    variant: 'draco_wave',
    onSequentialList: true,
    stayBlocked: false,
    assaultActive: false,
    cooldownActive: true,
    territorialTurnPending: false,
  });
  assert.equal(r.enabled, false);
  assert.equal(r.rule, 'victory_cooldown');
});

console.log('resolvePlanetWaveCombatTrigger.test.ts — all PASS');
