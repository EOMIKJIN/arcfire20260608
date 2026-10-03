/**
 * npx tsx --test src/arcCore/territorial/resolveTerritorialPresentKind.test.ts
 */
import assert from 'node:assert/strict';
import { resolveTerritorialPresentKind } from './resolveTerritorialPresentKind';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('status_quo → quiet', () => {
  assert.equal(resolveTerritorialPresentKind({ decision: 'status_quo' }), 'quiet');
  assert.equal(
    resolveTerritorialPresentKind({ decision: 'status_quo', combatMode: 'blue_red' }),
    'quiet',
  );
});

test('neutral_declare → declare', () => {
  assert.equal(resolveTerritorialPresentKind({ decision: 'neutral_declare' }), 'declare');
  assert.equal(
    resolveTerritorialPresentKind({ decision: 'neutral_declare', combatMode: 'blue_neutral' }),
    'declare',
  );
});

test('battle + 접전/독립국 → battle', () => {
  assert.equal(
    resolveTerritorialPresentKind({ decision: 'battle', combatMode: 'blue_red' }),
    'battle',
  );
  assert.equal(
    resolveTerritorialPresentKind({ decision: 'battle', combatMode: 'independent_invasion' }),
    'battle',
  );
  assert.equal(resolveTerritorialPresentKind({ decision: 'battle' }), 'battle');
});

test('battle + 단측 → seize', () => {
  assert.equal(
    resolveTerritorialPresentKind({ decision: 'battle', combatMode: 'blue_neutral' }),
    'seize',
  );
  assert.equal(
    resolveTerritorialPresentKind({ decision: 'battle', combatMode: 'red_neutral' }),
    'seize',
  );
});

test('player_wave_pending → battle (알림 경로 외 폴백)', () => {
  assert.equal(resolveTerritorialPresentKind({ decision: 'player_wave_pending' }), 'battle');
});

console.log('resolveTerritorialPresentKind.test.ts — all PASS');
