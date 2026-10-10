// 밸런싱 안정화 기준축 회귀 (대표님 승인 2026-10-10 함선 곡선)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated/csvCapitalHullPurchasePolicy';
import { ProgressionSpine_FROM_BALANCE_CSV } from '../../data/balance/generated/csvProgressionSpine';
import { PLAYER_LEVEL_EXP_FROM_CSV } from '../../data/generated/csvPlayerLevelExp';
import { affinityKindFromHullTierKey } from './capitalHullPurchaseFromBalance';
import { resolveMineralUpgradeMaxLevel } from '../../game/shipyardMineralUpgrade/mineralUpgradeModel';

const maxLevel = PLAYER_LEVEL_EXP_FROM_CSV.reduce((m, r) => Math.max(m, Number(r.level)), 1);
const ladder = CapitalHullPurchasePolicy_FROM_BALANCE_CSV
  .filter((r) => String(r.ladderListed) === 'TRUE' && String(r.ladderStep) !== '')
  .map((r) => ({ key: r.hullTierKey, step: Number(r.ladderStep), unlock: Number(r.requiredPilotLevelMin), target: Number(r.targetPurchaseLevel), price: Number(r.purchaseCredits) }))
  .sort((a, b) => a.step - b.step);

test('사다리: L1~15 지급 함선 → L16~20 첫 구매 → L30 → 간격이 넓어진다', () => {
  assert.equal(ladder[0]!.price, 0);
  const mains = ladder.filter((s) => Number.isInteger(s.step) && s.step > 0);
  assert.ok(mains[0]!.unlock >= 16 && mains[0]!.target <= 20, `첫 구매 L${mains[0]!.unlock}~${mains[0]!.target}`);
  assert.equal(mains[1]!.target, 30);
  for (let i = 2; i < mains.length; i++) {
    assert.ok(mains[i]!.target - mains[i - 1]!.target >= mains[i - 1]!.target - mains[i - 2]!.target, '본 등급 간격은 줄지 않는다');
  }
});

test('사다리 함선은 모두 최대 레벨 안에서 살 수 있고 가격은 단계 순으로 오른다', () => {
  for (let i = 0; i < ladder.length; i++) {
    assert.ok(ladder[i]!.unlock <= maxLevel && ladder[i]!.target <= maxLevel, ladder[i]!.key);
    if (i > 0) assert.ok(ladder[i]!.price > ladder[i - 1]!.price, `${ladder[i]!.key} 가격`);
  }
  // 최대 레벨을 넘는 등급은 사다리 밖
  for (const r of CapitalHullPurchasePolicy_FROM_BALANCE_CSV) {
    if (Number(r.requiredPilotLevelMin) > maxLevel) assert.equal(r.ladderListed, 'FALSE', r.hullTierKey);
  }
});

test('기준축: 레벨마다 한 줄 · 누적 시간·수입은 줄지 않는다 · 함선 목표 구매 레벨과 일치', () => {
  assert.equal(ProgressionSpine_FROM_BALANCE_CSV.length, maxLevel);
  for (let i = 1; i < ProgressionSpine_FROM_BALANCE_CSV.length; i++) {
    const a = ProgressionSpine_FROM_BALANCE_CSV[i - 1]!;
    const b = ProgressionSpine_FROM_BALANCE_CSV[i]!;
    assert.ok(Number(b.targetCumHours) >= Number(a.targetCumHours));
    assert.ok(Number(b.targetCumCredits) >= Number(a.targetCumCredits));
  }
  for (const s of ladder) {
    if (s.step === 0) continue;
    const row = ProgressionSpine_FROM_BALANCE_CSV.find((r) => Number(r.level) === s.target)!;
    assert.equal(row.hullTierKey, s.key, `L${s.target}`);
  }
});

test('방어 성향은 사다리 표 affinityKind · 광물 강화 상한은 함선 단계 경계와 맞다', () => {
  assert.equal(affinityKindFromHullTierKey('frigate_default'), 'light');
  assert.equal(affinityKindFromHullTierKey('destroyer'), 'shielded');
  assert.equal(affinityKindFromHullTierKey('dreadnought'), 'heavy');
  assert.equal(resolveMineralUpgradeMaxLevel(15), 5);
  assert.equal(resolveMineralUpgradeMaxLevel(16), 8);
  assert.equal(resolveMineralUpgradeMaxLevel(30), 10);
  assert.equal(resolveMineralUpgradeMaxLevel(44), 12);
  assert.equal(resolveMineralUpgradeMaxLevel(60), 15);
});
