/**
 * 전투 적 리더 계약
 * npx tsx --test src/game/combat/resolveCombatEnemyLeader.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { markFirstHostileFleetLeader, resolveCombatEnemyLeader } from './resolveCombatEnemyLeader';

test('explicit isLeader wins over slot order', () => {
  const leader = resolveCombatEnemyLeader([
    { captainId: 'npc_a' },
    { captainId: 'npc_b', isLeader: true },
    { captainId: 'npc_c' },
  ]);
  assert.equal(leader?.captainId, 'npc_b');
});

test('no mark — first enemy is leader (2+ contract)', () => {
  const leader = resolveCombatEnemyLeader([
    { captainId: 'npc_a' },
    { captainId: 'npc_b' },
  ]);
  assert.equal(leader?.captainId, 'npc_a');
  assert.equal(leader?.isLeader, true);
});

test('empty captain ids are skipped', () => {
  const leader = resolveCombatEnemyLeader([
    { captainId: '  ' },
    { captainId: 'npc_b' },
  ]);
  assert.equal(leader?.captainId, 'npc_b');
});

test('markFirstHostileFleetLeader tags the first non-blue slot', () => {
  const rows = markFirstHostileFleetLeader([
    { team: 'red' as const, id: 'r1', isLeader: undefined as boolean | undefined },
    { team: 'red' as const, id: 'r2', isLeader: undefined as boolean | undefined },
    { team: 'blue' as const, id: 'b1', isLeader: undefined as boolean | undefined },
  ]);
  assert.equal(rows[0]?.isLeader, true);
  assert.equal(rows[1]?.isLeader, undefined);
  assert.equal(rows[2]?.isLeader, undefined);
});
