import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePlayerCombatSkillBind } from '../game/playerOwnedSkillCombatBind';
import {
  createNpcAgentSkillAuto,
  createPlayerAgentSkillAuto,
  playerAutoCombatSkillsNeedTick,
  tickPlayerAutoCombatSkills,
  type AutoCombatAgent,
} from './playerAutoCombatSkills';
import { EMPTY_PLAYER_COMBAT_SKILL_BIND } from '../game/playerOwnedSkillCombatBind';

function agent(partial: Partial<AutoCombatAgent> & Pick<AutoCombatAgent, 'id' | 'team'>): AutoCombatAgent {
  return {
    captainId: partial.captainId ?? null,
    alive: partial.alive ?? true,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    headingRad: partial.headingRad ?? 0,
    hullHp: partial.hullHp ?? 100,
    maxHullHp: partial.maxHullHp ?? 100,
    shieldHp: partial.shieldHp ?? 40,
    maxShieldHp: partial.maxShieldHp ?? 40,
    skillAuto: partial.skillAuto ?? createNpcAgentSkillAuto(),
    ...partial,
  };
}

test('empty bind does not need a per-frame skill tick', () => {
  const auto = createPlayerAgentSkillAuto(EMPTY_PLAYER_COMBAT_SKILL_BIND);
  assert.equal(playerAutoCombatSkillsNeedTick(auto), false);
});

test('emp bind needs a per-frame skill tick', () => {
  const auto = createPlayerAgentSkillAuto(resolvePlayerCombatSkillBind(['emp_blast']));
  assert.equal(playerAutoCombatSkillsNeedTick(auto), true);
});

test('emp drains 25% of target max shield on first tick', () => {
  const bind = resolvePlayerCombatSkillBind(['emp_blast']);
  const player = agent({
    id: 1,
    team: 'blue',
    captainId: 'Player_pilot',
    skillAuto: createPlayerAgentSkillAuto(bind),
  });
  const red = agent({ id: 2, team: 'red', shieldHp: 40, maxShieldHp: 40 });
  tickPlayerAutoCombatSkills(player, [player, red], 0, (x, y) => ({ x, y }));
  assert.equal(red.shieldHp, 30);
  assert.equal(player.skillAuto.procLabel, 'EMP 폭발');
});

test('fortress waits until hull is at or below 30%', () => {
  const bind = resolvePlayerCombatSkillBind(['fortress_mode']);
  const player = agent({
    id: 1,
    team: 'blue',
    captainId: 'Player_pilot',
    hullHp: 80,
    maxHullHp: 100,
    skillAuto: createPlayerAgentSkillAuto(bind),
  });
  tickPlayerAutoCombatSkills(player, [player], 0, (x, y) => ({ x, y }));
  assert.equal(player.skillAuto.fortressUntilMs, 0);
  player.hullHp = 20;
  tickPlayerAutoCombatSkills(player, [player], 10, (x, y) => ({ x, y }));
  assert.ok(player.skillAuto.fortressUntilMs > 0);
  assert.equal(player.skillAuto.procLabel, '요새화 모드');
});

test('emergency warp flags flee below 10% hull', () => {
  const bind = resolvePlayerCombatSkillBind(['emergency_warp']);
  const player = agent({
    id: 1,
    team: 'blue',
    captainId: 'Player_pilot',
    hullHp: 5,
    maxHullHp: 100,
    skillAuto: createPlayerAgentSkillAuto(bind),
  });
  const r = tickPlayerAutoCombatSkills(player, [player], 0, (x, y) => ({ x, y }));
  assert.equal(r.emergencyWarpFlee, true);
  assert.equal(player.alive, false);
  assert.equal(player.skillAuto.emergencyUsed, true);
});
