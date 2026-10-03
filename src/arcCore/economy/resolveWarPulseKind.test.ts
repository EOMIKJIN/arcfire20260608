/**
 * npx tsx --test src/arcCore/economy/resolveWarPulseKind.test.ts
 */
import assert from 'node:assert/strict';
import { resolveWarPulseKind } from './resolveWarPulseKind';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('침묵이 기본', () => {
  assert.equal(resolveWarPulseKind({}), null);
  assert.equal(resolveWarPulseKind({ windowConvoyTrips: 0 }), null);
  assert.equal(resolveWarPulseKind({ windowConvoyTrips: 0, prevWindowConvoyTrips: 0 }), null);
  assert.equal(resolveWarPulseKind({ windowConvoyTrips: 3, prevWindowConvoyTrips: 2 }), null);
  assert.equal(resolveWarPulseKind({ blueAnnexDelta: 0 }), null);
  assert.equal(resolveWarPulseKind({ blueAnnexDelta: 8000 }), null);
});

test('전날 운항 → 오늘 0 = convoyCut 우선', () => {
  assert.equal(
    resolveWarPulseKind({
      windowConvoyTrips: 0,
      prevWindowConvoyTrips: 4,
      blueAnnexDelta: -8000,
    }),
    'convoyCut',
  );
});

test('편입 지출만 = vaultAnnex', () => {
  assert.equal(resolveWarPulseKind({ blueAnnexDelta: -8000 }), 'vaultAnnex');
});

console.log('resolveWarPulseKind.test.ts — all PASS');
