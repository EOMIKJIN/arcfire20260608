import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MILITARY_COMMAND_PATROL_DOCK_MS,
  MILITARY_COMMAND_PATROL_DOT_COUNT,
  MILITARY_COMMAND_PATROL_DOT_PARAMS,
  MILITARY_COMMAND_PATROL_EXIT_PX,
  MILITARY_COMMAND_PATROL_LAUNCH_MS,
  resolveMilitaryCommandPatrolCycleMs,
  resolveMilitaryCommandPatrolPose,
} from './militaryCommandPatrolPose';

test('patrol ships dock invisible, launch, then stay outside the hex', () => {
  assert.equal(MILITARY_COMMAND_PATROL_DOT_COUNT, 6);
  const cycle0 = resolveMilitaryCommandPatrolCycleMs(0);
  const cycle5 = resolveMilitaryCommandPatrolCycleMs(5);
  assert.ok(cycle0 !== cycle5);

  const docked = resolveMilitaryCommandPatrolPose(0, 200, cycle0);
  assert.equal(docked.opacity, 0);

  const launched = resolveMilitaryCommandPatrolPose(
    0,
    MILITARY_COMMAND_PATROL_DOCK_MS + MILITARY_COMMAND_PATROL_LAUNCH_MS * 0.85,
    cycle0,
  );
  assert.ok(launched.opacity > 0.4);
  assert.ok(Math.hypot(launched.x, launched.y) >= MILITARY_COMMAND_PATROL_EXIT_PX - 0.5);

  const cruising = resolveMilitaryCommandPatrolPose(
    0,
    MILITARY_COMMAND_PATROL_DOCK_MS + MILITARY_COMMAND_PATROL_LAUNCH_MS + 3_000,
    cycle0,
  );
  assert.equal(cruising.opacity, 1);
  assert.ok(Math.hypot(cruising.x, cruising.y) > MILITARY_COMMAND_PATROL_EXIT_PX + 4);

  const fallback = resolveMilitaryCommandPatrolPose(0, 400, 0);
  assert.equal(Number.isFinite(fallback.x) && Number.isFinite(fallback.y), true);
  assert.equal(MILITARY_COMMAND_PATROL_DOT_PARAMS.length, MILITARY_COMMAND_PATROL_DOT_COUNT);
  assert.ok(MILITARY_COMMAND_PATROL_DOT_PARAMS[0]!.patrolMs > 0);
});
