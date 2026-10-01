import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import {
  canCompleteQuestDefeatEnemy,
  resolveQuestCombatLock,
} from './questCombatLock';

function active(missionId: string, objectives: Record<string, boolean>): MissionProgress {
  return { missionId, status: 'active', objectives };
}

test('허브 승리는 hub_orbit 락만 끝낸다', () => {
  const lock = resolveQuestCombatLock(
    { sandbox_013: active('sandbox_013', { obj_s013_a: false }) },
    'sandbox_013',
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'hub_orbit',
      enemyTemplateId: 'pirate_cruiser',
      planetId: 'titan_ruins',
    }),
    true,
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'transit',
      enemyTemplateId: 'pirate_cruiser',
    }),
    false,
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'wave_assault',
      enemyTemplateId: 'pirate_cruiser',
      planetId: 'titan_ruins',
    }),
    false,
  );
});
