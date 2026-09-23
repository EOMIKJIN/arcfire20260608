/**
 * 플레이어 방위위성 → NPC 분쟁 어드밴티지
 * npx tsx --test src/arcCore/territorial/applyDefenseSatelliteTerritorialAdjustments.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPlanetDefenseSatelliteLevelRow } from '../balance/planetDefenseSatelliteLevelPolicy';
import {
  applyDefenseSatelliteCombatAdvantage,
  applyDefenseSatelliteRollWeights,
  isPlayerInvestedDefenseSatelliteEligible,
  resolveDefenseSatelliteTerritorialBonusFromDetail,
  TERRITORIAL_SAT_ABSORB_CAP,
  TERRITORIAL_SAT_ADVANTAGE_CAP,
} from './applyDefenseSatelliteTerritorialAdjustments';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('게이트 — player+BLUE/INDEPENDENT만 · RED·ArcCore 제외', () => {
  assert.equal(isPlayerInvestedDefenseSatelliteEligible('player', 'BLUE'), true);
  assert.equal(isPlayerInvestedDefenseSatelliteEligible('player', 'INDEPENDENT'), true);
  assert.equal(isPlayerInvestedDefenseSatelliteEligible('player', 'RED'), false);
  assert.equal(isPlayerInvestedDefenseSatelliteEligible('arc_core', 'BLUE'), false);
  assert.equal(isPlayerInvestedDefenseSatelliteEligible('arc_core', 'RED'), false);
  assert.equal(isPlayerInvestedDefenseSatelliteEligible(undefined, 'INDEPENDENT'), true);
  assert.equal(isPlayerInvestedDefenseSatelliteEligible(undefined, 'BLUE'), false);
});

test('곡선 — 기존 hp/영역 유지 · L1/L10/L15 분쟁 가산', () => {
  const l1 = getPlanetDefenseSatelliteLevelRow(1);
  const l10 = getPlanetDefenseSatelliteLevelRow(10);
  const l15 = getPlanetDefenseSatelliteLevelRow(15);
  assert.ok(l1 && l10 && l15);
  assert.equal(l1.hpMax, 100);
  assert.equal(l1.defenseZoneDiameterPx, 120);
  assert.equal(l1.territorialDefenderAdvantagePct, 1);
  assert.equal(l1.territorialStatusQuoAbsorbPct, 0);
  assert.equal(l10.territorialDefenderAdvantagePct, 6);
  assert.equal(l10.territorialStatusQuoAbsorbPct, 2);
  assert.equal(l15.territorialDefenderAdvantagePct, TERRITORIAL_SAT_ADVANTAGE_CAP);
  assert.equal(l15.territorialStatusQuoAbsorbPct, TERRITORIAL_SAT_ABSORB_CAP);
  assert.equal(l15.hpMax, 3950);
  assert.equal(l15.defenseZoneDiameterPx, 320);
});

test('전투 — 수비 가산만 · 미적용은 원본', () => {
  const applied = resolveDefenseSatelliteTerritorialBonusFromDetail({
    installed: true,
    level: 15,
    installedBy: 'player',
    defenderSide: 'INDEPENDENT',
  });
  assert.equal(applied.applied, true);
  assert.equal(applyDefenseSatelliteCombatAdvantage(8, applied), 18);
  const skipped = resolveDefenseSatelliteTerritorialBonusFromDetail({
    installed: true,
    level: 15,
    installedBy: 'arc_core',
    defenderSide: 'RED',
  });
  assert.equal(skipped.applied, false);
  assert.equal(applyDefenseSatelliteCombatAdvantage(8, skipped), 8);
});

test('롤 — battle→status_quo만 이동 · declare 유지 · 수도 8+18 위에 L15+10이 전선을 닫지 않음', () => {
  const bonus = resolveDefenseSatelliteTerritorialBonusFromDetail({
    installed: true,
    level: 15,
    installedBy: 'player',
    defenderSide: 'BLUE',
  });
  const next = applyDefenseSatelliteRollWeights({
    weights: { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 },
    bonus,
  });
  assert.deepEqual(next, {
    battleWeightPct: 54,
    neutralDeclareWeightPct: 12,
    statusQuoWeightPct: 34,
  });
  assert.ok(next.battleWeightPct >= 50, 'L15 억제 후에도 battle≥50 — 전선 동결 금지');
  const capitalThenSat = applyDefenseSatelliteRollWeights({
    weights: { battleWeightPct: 40.6, neutralDeclareWeightPct: 8.4, statusQuoWeightPct: 51 },
    bonus,
  });
  assert.ok(capitalThenSat.battleWeightPct >= 36, '수도 포위 스택 후에도 battle 잔존');
});

test('배선 — NPC 패스만 · 웨이브 컨트롤러 비삽입', () => {
  const pass = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  assert.match(pass, /applyDefenseSatelliteCombatAdvantage/);
  assert.match(pass, /applyDefenseSatelliteRollWeights/);
  const wave = readFileSync(
    resolve(__dirname, '../../game/waveDefense/useWaveDefenseController.ts'),
    'utf8',
  );
  assert.equal(
    /applyDefenseSatelliteTerritorialAdjustments/.test(wave),
    false,
    '플레이어 웨이브는 분쟁 위성 보너스를 읽지 않음',
  );
});
