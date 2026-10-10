// 전함 강화 규칙 회귀 (2026-10-10 대표님 결정)
// 1 광물 강화 함선별(넘겨주지 않음) · 2 장비 1회 적용·합산 상한 · 3 효과 없는 항목 숨김 · 4 무기 계열별 피해 · 5 Table-First
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Player, PlayerHangarShip } from '../types';
import {
  findActiveShipHangarIndex,
  getActiveShipMineralUpgrades,
  migrateLegacyMineralUpgradesToActiveShip,
  settleShipMineralUpgradeJobs,
} from './shipyardMineralUpgrade/shipMineralUpgradeState';
import {
  getHullUpgradeTier,
  getMineralUpgradeCost,
  isMineralUpgradeStatId,
  listMineralUpgradeStats,
  resolveMineralUpgradeDurationSec,
} from './shipyardMineralUpgrade/mineralUpgradeModel';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated/csvNpcCapitalShips';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../data/balance/generated/csvCapitalHullPurchasePolicy';
import { applyMineralUpgradeToShipPerformance } from '../combat/ShipPerformanceCalculator';
import {
  aggregateShipEquipmentBonuses,
  applyShipEquipmentStatBonusToCombat,
  resolveShipEquipmentFlatStatBonus,
  resolveShipEquipmentSlotForItemDef,
} from './shipEquipment/shipEquipmentModel';
import { applyShipEquipmentToShipPerformance } from './shipEquipment/shipEquipmentCombatBridge';
import { formatShipEquipmentEffectNotice } from './shipEquipment/shipEquipmentDisplay';
import {
  SHIP_EQUIPMENT_EFFECT_POLICY_KEYS,
  shipEquipmentPolicy,
} from './shipEquipment/shipEquipmentEffectPolicy';
import { skillCombatPolicyNum, skillCombatPolicyStr } from './skillAutoCombatPolicy';
import { resolvePlayerCombatSkillBind } from './playerOwnedSkillCombatBind';
import { applyInvestorDealToRepairCost } from './playerOwnedSkillTradeAdjust';
import { getItemDef } from '../data/itemRegistry';
import { SURVIVAL_POD_NPC_SHIP_ID } from './survivalPodIds';
import type { NpcCapitalCombatStats, PlayerShip } from '../types';

function hangar(npc: string, extra: Partial<PlayerHangarShip> = {}): PlayerHangarShip {
  return { id: `hg_${npc}`, npcCapitalShipId: npc, acquiredAt: 1, durabilityPct: 100, ...extra };
}
function playerOn(npc: string, hangarShips: PlayerHangarShip[], extra: Partial<Player> = {}): Player {
  return {
    ship: { portraitNpcCapitalShipId: npc } as PlayerShip,
    shipHangar: hangarShips,
    ...extra,
  } as Player;
}
const slot = (id: string) => ({ itemDefId: id, name: id });
const combat = (hp: number, shield: number, armor: number): NpcCapitalCombatStats => ({
  maxHp: hp, maxShield: shield, armor, attackBonus: 0, damageDice: { count: 1, sides: 6, bonus: 0 },
  expReward: 0, strStat: 10, dexStat: 10, sizeClass: 0,
});

// ── 1 함선별 광물 강화 ──────────────────────────────────────
test('구세이브 계정 강화는 탑승 함선 항목으로 1회 이전되고 계정 필드는 지워진다', () => {
  const p = playerOn('Player_destroyer_mk1', [hangar('Player_scout_ship'), hangar('Player_destroyer_mk1')], {
    mineralUpgrades: { ship_hull_hp: 4 },
  });
  const m = migrateLegacyMineralUpgradesToActiveShip(p);
  assert.equal(m.mineralUpgrades, undefined);
  assert.deepEqual(getActiveShipMineralUpgrades(m), { ship_hull_hp: 4 });
  assert.equal(m.shipHangar[0]!.mineralUpgrades, undefined, '다른 함선에는 넘기지 않는다');
});

test('함선을 바꾸면 그 함선의 강화만 적용된다(넘겨주기 없음)', () => {
  const ships = [hangar('Player_scout_ship', { mineralUpgrades: { ship_hull_hp: 5 } }), hangar('Player_destroyer_mk1')];
  assert.deepEqual(getActiveShipMineralUpgrades(playerOn('Player_scout_ship', ships)), { ship_hull_hp: 5 });
  assert.equal(getActiveShipMineralUpgrades(playerOn('Player_destroyer_mk1', ships)), undefined);
});

test('생존포드는 강화 대상이 아니다', () => {
  const p = playerOn(SURVIVAL_POD_NPC_SHIP_ID, [hangar(SURVIVAL_POD_NPC_SHIP_ID)]);
  assert.equal(findActiveShipHangarIndex(p), -1);
});

test('강화 완료 정산은 job 을 건 그 함선에만 반영된다', () => {
  const ships = [
    hangar('Player_scout_ship', { mineralUpgradeJobs: { ship_shield: { targetLevel: 2, startedAtMs: 0, completeAtMs: 10 } } }),
    hangar('Player_destroyer_mk1', { mineralUpgradeJobs: { ship_shield: { targetLevel: 1, startedAtMs: 0, completeAtMs: 999 } } }),
  ];
  const r = settleShipMineralUpgradeJobs(playerOn('Player_destroyer_mk1', ships), 100);
  assert.ok(r);
  assert.deepEqual(r.player.shipHangar[0]!.mineralUpgrades, { ship_shield: 2 });
  assert.equal(r.player.shipHangar[0]!.mineralUpgradeJobs, undefined);
  assert.equal(r.player.shipHangar[1]!.mineralUpgrades, undefined);
  assert.ok(r.player.shipHangar[1]!.mineralUpgradeJobs?.ship_shield);
});

// ── 3·5 광물 강화 CSV ─────────────────────────────────────
test('사거리 강화(효과 미구현)는 강화 목록에서 숨기고 강화 불가', () => {
  const ids = listMineralUpgradeStats().map((s) => s.statId);
  assert.ok(!ids.includes('weapon_laser_range'));
  assert.ok(!ids.includes('weapon_missile_range'));
  assert.equal(isMineralUpgradeStatId('weapon_laser_range'), false);
  assert.equal(resolveMineralUpgradeDurationSec('ship_hull_hp', 1), 60);
});

// ── 4 무기 계열별 피해 ─────────────────────────────────────
test('레이저 강화는 레이저 계열, 미사일 강화는 미사일 계열 배수로 나뉜다(선체 주사위 불변 · 등급별 %)', () => {
  const tier = getHullUpgradeTier('destroyer')!;
  const perf = applyMineralUpgradeToShipPerformance(
    { combat: combat(100, 50, 5) },
    { weapon_laser_damage: 3, weapon_missile_damage: 2 },
    'destroyer',
  );
  assert.equal(perf.combat.damageDice.bonus, 0);
  assert.ok(Math.abs((perf.combat.laserDamageMul ?? 1) - (1 + 3 * tier.damagePctPerLevel)) < 1e-9);
  assert.ok(Math.abs((perf.combat.missileDamageMul ?? 1) - (1 + 2 * tier.damagePctPerLevel)) < 1e-9);
});

// ── 대표님 결정(10-10): 강화 완료 = 원래 능력치 160% · 다음 본 등급 87.5% · 비용 = 다음 구매가 80% ──
test('강화 완료(등급 상한) = 원래 HP·실드·화력의 160%', () => {
  for (const key of ['frigate_default', 'destroyer', 'cruiser', 'battlecruiser', 'dreadnought']) {
    const tier = getHullUpgradeTier(key)!;
    const full = Object.fromEntries(listMineralUpgradeStats().map((s) => [s.statId, tier.upgradeCap]));
    const perf = applyMineralUpgradeToShipPerformance({ combat: combat(1000, 500, 10) }, full, key);
    assert.equal(perf.combat.maxHp, 1600, `${key} HP`);
    assert.equal(perf.combat.maxShield, 800, `${key} 실드`);
    // 화력 = 피해 배수 × 연사(재장전 역수)
    const dps = (perf.combat.laserDamageMul ?? 1) / Math.pow(tier.fireRateCooldownMulPerLevel, tier.upgradeCap);
    assert.ok(Math.abs(dps - 1.6) < 0.01, `${key} 화력 ${dps}`);
  }
});

test('다음 본 등급 기본 HP = 강화 완료 HP ÷ 0.875 · 강화 총비용 = 다음 구매가 × 0.8 (크레딧 환산 ±광물)', () => {
  const ships = NPC_CAPITAL_SHIPS_FROM_CSV;
  const hp = (id: string) => ships.find((s) => s.id === id)!.combat.maxHp;
  const pairs: [string, string][] = [['Player_npc_red_fleet_1', 'Player_destroyer_mk1'], ['Player_destroyer_mk1', 'Player_cruiser_mk1'], ['Player_cruiser_mk1', 'Player_battlecruiser_mk1'], ['Player_battlecruiser_mk1', 'Player_dreadnought_mk1']];
  for (const [a, b] of pairs) {
    const ratio = (hp(a) * 1.6) / hp(b);
    assert.ok(Math.abs(ratio - 0.875) < 0.01, `${a}→${b} ${ratio}`);
  }
  const price = (k: string) => Number(CapitalHullPurchasePolicy_FROM_BALANCE_CSV.find((r) => r.hullTierKey === k)!.purchaseCredits);
  const tier = getHullUpgradeTier('destroyer')!;
  assert.equal(tier.totalCostCredits, Math.round(price('cruiser') * 0.8));
  let credits = 0;
  for (const s of listMineralUpgradeStats()) for (let lv = 1; lv <= tier.upgradeCap; lv++) credits += getMineralUpgradeCost('destroyer', s.statId, lv)!.credits;
  assert.ok(credits <= tier.totalCostCredits && credits > tier.totalCostCredits * 0.95, `크레딧 합 ${credits}`);
});

// ── 2 장비 1회 적용 · 합산 상한 ─────────────────────────────
test('전투 브리지는 HP·실드·장갑을 다시 더하지 않는다(이중 적용 제거)', () => {
  const eq = { ARMOR: slot('eq_def_molecular_armor_3'), EX_02: slot('eq_def_shield_amp_3') } as PlayerShip['equipSlots'];
  const base = combat(600, 250, 18);
  const out = applyShipEquipmentToShipPerformance({ combat: base }, eq);
  assert.equal(out.combat.maxHp, 600);
  assert.equal(out.combat.maxShield, 250);
  assert.equal(out.combat.armor, 18);
  // 스탯은 단일 식(조선소 표시와 같은 값) 1회
  const once = applyShipEquipmentStatBonusToCombat(base, eq);
  const flat = resolveShipEquipmentFlatStatBonus({ maxHp: 600, maxShield: 250, armor: 18, speed: 0 } as PlayerShip, eq);
  assert.equal(once.maxHp, 600 + flat.bonusHp);
  assert.equal(once.maxShield, 250 + flat.bonusShield);
});

test('같은 효과 장비 여러 개는 합산되지만 상한까지만', () => {
  const eq = {
    ARMOR: slot('eq_def_molecular_armor_3'),
    EX_02: slot('eq_def_shield_amp_3'),
    SYSTEM: slot('eq_def_shield_amp_3'),
    EX_01: slot('eq_def_shield_amp_3'),
    EX_03: slot('eq_def_shield_amp_3'),
  } as PlayerShip['equipSlots'];
  const b = aggregateShipEquipmentBonuses(eq);
  assert.equal(b.shieldBonusPct, shipEquipmentPolicy('cap_shield_pct'));
});

test('장착 칸은 item_defs equipmentSlot 에서 읽는다', () => {
  assert.equal(resolveShipEquipmentSlotForItemDef('eq_prop_ion_booster_1'), 'ENGINE');
  assert.equal(resolveShipEquipmentSlotForItemDef('eq_def_shield_amp_2'), 'EX_02');
});

// ── 3 효과 없는 장비 숨김 ──────────────────────────────────
test('효과 없는 장비 4계열은 미구현 표시·무역소 미진열·집계 제외', () => {
  for (const id of ['eq_ew_tac_datalink_1', 'eq_sup_hull_patch_2', 'eq_nav_jump_calc_3', 'eq_mining_drone_1']) {
    const def = getItemDef(id);
    assert.ok(def, id);
    assert.equal(def.tradeable, false, id);
    assert.equal((def.attrs as Record<string, unknown>).effectPending, true, id);
  }
  const b = aggregateShipEquipmentBonuses({ EX_02: slot('eq_ew_tac_datalink_3') } as PlayerShip['equipSlots']);
  assert.ok(Object.values(b).every((v) => v === 0));
});

test('장비 고지 — 실제 HP 환산·합산 상한을 알린다', () => {
  const ko = formatShipEquipmentEffectNotice('eq_def_molecular_armor_2', 'ko') ?? '';
  assert.match(ko, /최대 HP \+13\.5%/);
  assert.match(ko, /합산/);
  assert.match(ko, /최대 \+35%/);
  assert.match(formatShipEquipmentEffectNotice('eq_nav_jump_calc_1', 'ko') ?? '', /구현되지 않아/);
});

// ── 5 Table-First 정책 키 ─────────────────────────────────
test('장비·스킬 정책 키가 CSV 에 모두 있다(코드 기본값 없음)', () => {
  for (const k of SHIP_EQUIPMENT_EFFECT_POLICY_KEYS) {
    assert.ok(Number.isFinite(shipEquipmentPolicy(k)), k);
  }
  for (const k of [
    'damage_reduction_cap_pct', 'incoming_damage_mul_floor', 'crit_range_min', 'shield_pen_cap_pct',
    'weapon_haste_cap_pct', 'cooldown_reduction_cap_pct', 'weapon_cooldown_mul_floor',
    'weapon_haste_missile_salvo_bonus', 'aura_ally_hit_bonus', 'aura_enemy_hit_penalty',
    'weapon_cooldown_floor_laser_ms', 'weapon_cooldown_floor_missile_ms', 'weapon_cooldown_floor_close_ms',
  ]) {
    assert.ok(Number.isFinite(skillCombatPolicyNum(k)), k);
  }
  assert.equal(skillCombatPolicyStr('stat_multiplier_requires_stats'), 'party_attack_bonus|auto_escape');
});

test('스킬은 id 가 아니라 효과 스탯으로 판정 — 기존 결과와 같다', () => {
  const b = resolvePlayerCombatSkillBind(['double_shot', 'perfect_defense', 'singularity_cannon', 'overlord_presence']);
  assert.equal(b.missileSalvoBonus, 1);
  assert.equal(b.perfectDefense, true);
  assert.equal(b.gravityPull, true);
  assert.equal(b.auraAllyHit, 4);
  assert.equal(b.auraEnemyHit, 4);
  const link = resolvePlayerCombatSkillBind(['tactical_link', 'fleet_command', 'emergency_warp']);
  assert.ok(link.statMultiplierPct > 0);
  assert.equal(resolvePlayerCombatSkillBind(['tactical_link', 'fleet_command']).statMultiplierPct, 0);
  assert.equal(applyInvestorDealToRepairCost(500, ['investor_deal']), 0);
  assert.equal(applyInvestorDealToRepairCost(500, []), 500);
});
