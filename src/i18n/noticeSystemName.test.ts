import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveLocalizedSystemNameById } from './systemText';
import { normalizeSynthSystemId } from '../arcCore/balance/balanceTableRegistry';

test('synth_60 pads to synth_060 and resolves English name', () => {
  assert.equal(normalizeSynthSystemId('synth_60'), 'synth_060');
  assert.equal(normalizeSynthSystemId('synth_060'), 'synth_060');
  assert.equal(
    resolveLocalizedSystemNameById('synth_60', '트레일 개척지', 'en'),
    'Trail Colony',
  );
  assert.equal(
    resolveLocalizedSystemNameById('synth_060', '트레일 개척지', 'ko'),
    '트레일 개척지',
  );
});
