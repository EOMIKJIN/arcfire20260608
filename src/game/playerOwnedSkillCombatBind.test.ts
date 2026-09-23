import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SKILLS_FROM_CSV } from '../data/generated';
import {
  applySkillArmorPierceToArmorStat,
  resolvePlayerCombatSkillBind,
} from './playerOwnedSkillCombatBind';

test('armor_piercing and reactive_armor CSV values', () => {
  assert.equal(SKILLS_FROM_CSV.armor_piercing?.effect?.stat, 'armor_pierce');
  assert.equal(Number(SKILLS_FROM_CSV.armor_piercing?.effect?.value), 5);
  assert.equal(SKILLS_FROM_CSV.reactive_armor?.effect?.stat, 'damage_reduction');
  assert.equal(Number(SKILLS_FROM_CSV.reactive_armor?.effect?.value), 15);
});

test('player combat bind applies pierce and 15% incoming mul', () => {
  const bind = resolvePlayerCombatSkillBind(['armor_piercing', 'reactive_armor']);
  assert.equal(bind.armorPierce, 5);
  assert.equal(bind.incomingDamageMul, 0.85);
  assert.equal(applySkillArmorPierceToArmorStat(14, 5), 9);
  assert.equal(applySkillArmorPierceToArmorStat(3, 5), 0);
});

test('empty combat bind is identity', () => {
  const bind = resolvePlayerCombatSkillBind([]);
  assert.equal(bind.armorPierce, 0);
  assert.equal(bind.incomingDamageMul, 1);
  assert.equal(bind.critRange, 20);
  assert.equal(bind.missileSalvoBonus, 0);
});

test('double_shot and critical_focus bind haste and crit range', () => {
  const bind = resolvePlayerCombatSkillBind(['double_shot', 'critical_focus']);
  assert.equal(bind.missileSalvoBonus, 1);
  assert.ok(bind.weaponCooldownMul < 1);
  assert.equal(bind.critRange, 19);
});

test('wingman and emergency_warp flags', () => {
  const bind = resolvePlayerCombatSkillBind(['wingman', 'emergency_warp']);
  assert.equal(bind.wingman, true);
  assert.equal(bind.emergencyWarpHullPct, 10);
});
