/**
 * 이동중 전투 종료 대화 — 적 함장 화자 + 팩션 패배 대사
 * npx tsx src/game/transitCombat/resolveTransitCombatEndDialog.test.ts
 */
import assert from 'node:assert/strict';
import { TransitCombatEndDialog_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated/csvNpcCaptains';
import {
  invalidateTransitCombatEndDialogCache,
  resolveTransitCombatEndDialogCopy,
} from './resolveTransitCombatEndDialog';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const kyle = {
  id: 'npc_cpt_enemy_arcadia_01',
  displayName: '카일 드레이',
  displayNameEn: 'Kyle Dray',
  factionId: 'pirates',
  portraitImageAssetKey: 'assets/images/npc/npc_cpt_enemy_arcadia_01.png',
};

test('CSV — defeat/flee 행과 해적·범용 폴백이 있다', () => {
  const kinds = new Set(TransitCombatEndDialog_FROM_BALANCE_CSV.map((r) => r.kind));
  assert.equal(kinds.has('defeat'), true);
  assert.equal(kinds.has('flee'), true);
  const pirateDefeat = TransitCombatEndDialog_FROM_BALANCE_CSV.filter(
    (r) => r.kind === 'defeat' && r.factionId === 'pirates',
  );
  assert.ok(pirateDefeat.length >= 1);
  const defaultDefeat = TransitCombatEndDialog_FROM_BALANCE_CSV.filter(
    (r) => r.kind === 'defeat' && r.factionId === '*',
  );
  assert.ok(defaultDefeat.length >= 1);
});

test('함장 없음 — 오퍼레이터 폴백', () => {
  invalidateTransitCombatEndDialogCache();
  const copy = resolveTransitCombatEndDialogCopy({
    kind: 'defeat',
    captain: null,
    locale: 'ko',
    fallbackLabel: '함선 AI',
    fallbackText: '교전 종료.',
  });
  assert.equal(copy.usedCaptain, false);
  assert.equal(copy.label, '함선 AI');
  assert.equal(copy.text, '교전 종료.');
  assert.equal(copy.portraitAssetKey, null);
});

test('해적 승리 — 함장 이름·초상키·해적 패배 대사', () => {
  invalidateTransitCombatEndDialogCache();
  const copy = resolveTransitCombatEndDialogCopy({
    kind: 'defeat',
    captain: kyle,
    locale: 'ko',
    fallbackLabel: '함선 AI',
    fallbackText: '교전 종료.',
  });
  assert.equal(copy.usedCaptain, true);
  assert.equal(copy.label, '카일 드레이');
  assert.equal(copy.portraitAssetKey, kyle.portraitImageAssetKey);
  assert.notEqual(copy.text, '교전 종료.');
  // 문구가 아니라 «해적 패배 행 중 하나인가»로 검사 — 대사 교정에 깨지지 않는다
  const pirateDefeatKo: readonly string[] = TransitCombatEndDialog_FROM_BALANCE_CSV
    .filter((r) => r.kind === 'defeat' && r.factionId === 'pirates')
    .map((r) => r.lineKo);
  assert.ok(pirateDefeatKo.includes(copy.text), `해적 패배 행이 아님: ${copy.text}`);
});

test('같은 함장은 같은 대사(결정적)', () => {
  invalidateTransitCombatEndDialogCache();
  const a = resolveTransitCombatEndDialogCopy({
    kind: 'defeat',
    captain: kyle,
    locale: 'ko',
    fallbackLabel: '함선 AI',
    fallbackText: '교전 종료.',
  });
  const b = resolveTransitCombatEndDialogCopy({
    kind: 'defeat',
    captain: kyle,
    locale: 'ko',
    fallbackLabel: '함선 AI',
    fallbackText: '교전 종료.',
  });
  assert.equal(a.text, b.text);
});

test('영문 로케일 — 표시명·영문 대사', () => {
  invalidateTransitCombatEndDialogCache();
  const copy = resolveTransitCombatEndDialogCopy({
    kind: 'defeat',
    captain: kyle,
    locale: 'en',
    fallbackLabel: 'Ship AI',
    fallbackText: 'Engagement complete.',
  });
  assert.equal(copy.label, 'Kyle Dray');
  assert.match(copy.text, /[A-Za-z]/);
});

test('미등록 팩션 — 범용 패배 대사 + 초상키 유지', () => {
  invalidateTransitCombatEndDialogCache();
  const copy = resolveTransitCombatEndDialogCopy({
    kind: 'defeat',
    captain: {
      id: 'npc_cpt_enemy_unknown_faction',
      displayName: '테스트',
      displayNameEn: 'Test',
      factionId: 'not_a_real_faction',
      portraitImageAssetKey: 'assets/images/npc/npc_cpt_enemy_arcadia_01.png',
    },
    locale: 'ko',
    fallbackLabel: '함선 AI',
    fallbackText: '교전 종료.',
  });
  assert.equal(copy.usedCaptain, true);
  assert.equal(copy.label, '테스트');
  assert.ok(copy.portraitAssetKey);
  assert.notEqual(copy.text, '교전 종료.');
});

test('전용적 npc_cpt_enemy_* 전원 — 표시명·초상키 있음', () => {
  const enemies = NPC_CAPTAINS_FROM_CSV.filter((c) => c.id.startsWith('npc_cpt_enemy_'));
  assert.ok(enemies.length >= 20);
  const missing = enemies.filter((c) => {
    const name = String(c.displayName ?? '').trim();
    const key = String(c.portraitImageAssetKey ?? '').trim();
    return !name || !key;
  });
  assert.deepEqual(missing.map((c) => c.id), []);
});

test('도주 — 적 화자 + 도주 대사', () => {
  invalidateTransitCombatEndDialogCache();
  const copy = resolveTransitCombatEndDialogCopy({
    kind: 'flee',
    captain: kyle,
    locale: 'ko',
    fallbackLabel: '함선 AI',
    fallbackText: '교전을 이탈했습니다.',
  });
  assert.equal(copy.usedCaptain, true);
  assert.equal(copy.label, '카일 드레이');
  assert.notEqual(copy.text, '교전을 이탈했습니다.');
  const pirateFleeKo: readonly string[] = TransitCombatEndDialog_FROM_BALANCE_CSV
    .filter((r) => r.kind === 'flee' && r.factionId === 'pirates')
    .map((r) => r.lineKo);
  assert.ok(pirateFleeKo.includes(copy.text), `해적 도주 행이 아님: ${copy.text}`);
});

console.log('ok resolveTransitCombatEndDialog');
