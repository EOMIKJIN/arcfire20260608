import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addWallTickFromDwellOccupancy,
  consumeDwellCivicIntegerDeltas,
  publishDwellRoleOccupancy,
  resetDwellCivicAccForTests,
} from './planetDwellCivicAcc';
import { resolveCaptainDwellRole } from './planetDwellRoleCatalog';

test('시민 acc — 민간 체류는 R·E 음수, P 양수', () => {
  resetDwellCivicAccForTests();
  publishDwellRoleOccupancy(new Map([['arcadia_prime', { civilian_consumer: 4 }]]));
  addWallTickFromDwellOccupancy(20_000);
  const delta = consumeDwellCivicIntegerDeltas('arcadia_prime', 2);
  assert.ok(delta.resource <= -1, `R ${delta.resource}`);
  assert.ok(delta.population >= 1, `P ${delta.population}`);
  assert.ok(delta.environment <= -1, `E ${delta.environment}`);
  resetDwellCivicAccForTests();
});

test('역할 폴백 — hunter→survey, garrison 프론티어→colonizer', () => {
  assert.equal(
    resolveCaptainDwellRole({ id: 'x_hunt', aiRole: 'hunter' }),
    'survey',
  );
  assert.equal(
    resolveCaptainDwellRole({ id: 'x_gar', aiRole: 'garrison' }, { frontierEarly: true }),
    'colonizer',
  );
  assert.equal(
    resolveCaptainDwellRole({ id: 'x_esc', aiRole: 'escort' }),
    'civilian_consumer',
  );
});
