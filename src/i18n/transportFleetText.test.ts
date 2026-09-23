import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveTransportFleetDisplayName } from './transportFleetText';

test('Trade · Occupation convoy name is English', () => {
  assert.equal(resolveTransportFleetDisplayName('en'), 'ArcCore Transport Fleet');
  assert.equal(resolveTransportFleetDisplayName('ko'), '아크코어 수송선단');
});
