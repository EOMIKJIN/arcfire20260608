import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveNpcCaptainDisplayName } from '../../i18n/captainText';
import { pickNpcCapitalShipDisplayName } from '../../i18n/shipTextPick';

test('info row fields switch KO/EN without frozen snapshot', () => {
  const captain = { displayName: '미레유 보스', displayNameEn: 'Mireille Voss' };
  assert.equal(resolveNpcCaptainDisplayName(captain, 'ko'), '미레유 보스');
  assert.equal(resolveNpcCaptainDisplayName(captain, 'en'), 'Mireille Voss');

  assert.equal(
    pickNpcCapitalShipDisplayName('en', { name: '기본전함 레인저 CM.I', nameEn: 'Starter Ranger CM.I' }, null, 'x'),
    'Starter Ranger CM.I',
  );
  assert.equal(
    pickNpcCapitalShipDisplayName('en', { name: '레드전함1' }, { nameEn: 'Red Hull 1 (Delivery)' }, 'x'),
    'Red Hull 1',
  );
  assert.equal(
    pickNpcCapitalShipDisplayName('ko', { name: '레드전함1' }, { nameEn: 'Red Hull 1' }, 'x'),
    '레드전함1',
  );
});
