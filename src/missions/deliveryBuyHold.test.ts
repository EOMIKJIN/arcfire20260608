/**
 * npx tsx --test src/missions/deliveryBuyHold.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearDeliveryBuyHolds,
  isDeliveryReachDeferred,
  noteDeliveryBuyCompletedAtSystem,
} from './deliveryBuyHold';

test('같은 성계에서는 배달을 미루고, 다른 성계 착륙에서 푼다', () => {
  clearDeliveryBuyHolds();
  noteDeliveryBuyCompletedAtSystem('tq_del_01', 'solar_port');
  assert.equal(isDeliveryReachDeferred('tq_del_01', 'solar_port'), true);
  assert.equal(isDeliveryReachDeferred('tq_del_01', 'solar_port'), true);
  assert.equal(isDeliveryReachDeferred('tq_del_01', 'vega_outpost'), false);
  assert.equal(isDeliveryReachDeferred('tq_del_01', 'vega_outpost'), false);
  clearDeliveryBuyHolds();
});
