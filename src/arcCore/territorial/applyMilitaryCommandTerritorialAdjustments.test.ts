import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyMilitaryCommandCombatAdvantage,
  resolveMilitaryCommandTerritorialBonusFromLevel,
} from './applyMilitaryCommandTerritorialAdjustments';

test('military command doctrine is independent of satellite and caps at 6', () => {
  const empty = resolveMilitaryCommandTerritorialBonusFromLevel({
    installed: false,
    level: 15,
    defenderSide: 'BLUE',
  });
  assert.equal(empty.applied, false);
  assert.equal(empty.defenderAdvantagePct, 0);

  const red = resolveMilitaryCommandTerritorialBonusFromLevel({
    installed: true,
    level: 15,
    defenderSide: 'RED',
  });
  assert.equal(red.applied, false);

  const l15 = resolveMilitaryCommandTerritorialBonusFromLevel({
    installed: true,
    level: 15,
    defenderSide: 'BLUE',
  });
  assert.equal(l15.applied, true);
  assert.equal(l15.defenderAdvantagePct, 6);

  const stacked = applyMilitaryCommandCombatAdvantage(10, l15);
  assert.equal(stacked, 16);
});

test('military command L1 doctrine is 0.4', () => {
  const l1 = resolveMilitaryCommandTerritorialBonusFromLevel({
    installed: true,
    level: 1,
    defenderSide: 'INDEPENDENT',
  });
  assert.equal(l1.applied, true);
  assert.ok(Math.abs(l1.defenderAdvantagePct - 0.4) < 1e-9);
});
