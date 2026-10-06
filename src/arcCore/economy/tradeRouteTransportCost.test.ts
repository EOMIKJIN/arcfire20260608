/**
 * 순차익은 이미 거리 가중된 총차익에서 운송비만 뺀다.
 * npx tsx src/arcCore/economy/tradeRouteTransportCost.test.ts
 */
import assert from 'node:assert/strict';
import {
  applyTradeRouteNetProfitPerUnit,
  computeTradeRouteTransportCostPerUnit,
  getTradeRouteMinNetProfitPerUnit,
  getTradeRouteReferenceMapDistance,
  resolvePlanetSystemMapDistance,
} from './tradeRouteTransportCost';

const gross = 510_978;
const supply = 'core_prime';
const demand = 'helios_core';
const goodId = 'tg_100';

const net = applyTradeRouteNetProfitPerUnit(gross, supply, demand, goodId);
const transport = computeTradeRouteTransportCostPerUnit(supply, demand, goodId);
const minNet = getTradeRouteMinNetProfitPerUnit();
const expected = Math.max(minNet, Math.floor(gross) - transport);

assert.equal(net, expected);
assert.ok(net <= Math.max(gross, minNet));

const distance = resolvePlanetSystemMapDistance(supply, demand);
const refDist = getTradeRouteReferenceMapDistance();
if (distance > refDist) {
  const doubled = Math.max(minNet, Math.floor(gross * (distance / refDist)) - transport);
  assert.ok(net < doubled);
}

console.log(`PASS net=${net} transport=${transport} distance=${distance} ref=${refDist}`);
