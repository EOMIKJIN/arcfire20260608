import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sanitizeStellaLifeAnchor } from './sanitizeStellaLifeAnchor';

test('sanitizeStellaLifeAnchor keeps short facts and drops pay/id/shadow', () => {
  assert.equal(sanitizeStellaLifeAnchor('호출은 짧게'), '호출은 짧게');
  assert.equal(sanitizeStellaLifeAnchor('크레딧 1000'), null);
  assert.equal(sanitizeStellaLifeAnchor('item_laser_01'), null);
  assert.equal(sanitizeStellaLifeAnchor('아크코어 근원체'), null);
  assert.equal(sanitizeStellaLifeAnchor(''), null);
  assert.equal((sanitizeStellaLifeAnchor('가'.repeat(80)) ?? '').length, 40);
  assert.equal(sanitizeStellaLifeAnchor('원래 짧게 말해'), '원래 짧게 말해');
  assert.equal(sanitizeStellaLifeAnchor('1000원'), null);
  assert.equal(sanitizeStellaLifeAnchor('짝 유저 닉은 알파'), null);
});
