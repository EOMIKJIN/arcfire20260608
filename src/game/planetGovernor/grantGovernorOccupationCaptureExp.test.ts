/**
 * 총사령관 점령 성공 EXP 게이트
 * npx tsx --test src/game/planetGovernor/grantGovernorOccupationCaptureExp.test.ts
 */
import assert from 'node:assert/strict';
import { shouldGrantGovernorOccupationCaptureExp } from './governorOccupationCaptureExpGate';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('영토 패스 BLUE 함락 — 지급', () => {
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: true,
      factionSide: 'BLUE',
      source: 'arc_core_territorial',
    }),
    true,
  );
});

test('영토 패스 RED 함락(독립국 침공 포함) — 지급', () => {
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: true,
      factionSide: 'RED',
      source: 'arc_core_territorial',
    }),
    true,
  );
});

test('hold 불변(방어 유지) — 미지급', () => {
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: false,
      factionSide: 'BLUE',
      source: 'arc_core_territorial',
    }),
    false,
  );
});

test('중립 선언·웨이브 중립화 — 미지급', () => {
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: true,
      factionSide: 'NEUTRAL',
      source: 'arc_core_territorial',
    }),
    false,
  );
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: true,
      factionSide: 'NEUTRAL',
      source: 'player_wave_defense_win',
    }),
    false,
  );
});

test('시드·반란 등 다른 source — 미지급', () => {
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: true,
      factionSide: 'BLUE',
      source: 'rebellion_overthrow',
    }),
    false,
  );
  assert.equal(
    shouldGrantGovernorOccupationCaptureExp({
      changed: true,
      factionSide: 'RED',
      source: 'occupation_seed',
    }),
    false,
  );
});
