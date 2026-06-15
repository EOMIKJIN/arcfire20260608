/**
 * 수송선단 교역 커버리지 정적 감사 — 생산지·수요지·왕복 가능성
 * node tools/audit-convoy-coverage.mjs
 */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, '..');

// Register ts paths via tsx runtime
const {
  listAllTradeRoutePlanetIds,
  listConvoySupplyPlanetIds,
  listConvoyDemandPlanetIds,
  listConvoySourceRoutesAtPlanet,
  listDemandPlanetIdsForTradeGood,
  getPlanetTradeRouteProfile,
} = require(resolve(ROOT, 'src/arcCore/economy/tradeRouteRegistry.ts'));

const { planArcConvoyRouteAtSupply } = require(
  resolve(ROOT, 'src/arcCore/economy/arcConvoyTradePlanner.ts'),
);

const { rebuildAllPlanetTradeMarkets } = require(
  resolve(ROOT, 'src/world/planetTradeMarketStore.ts'),
);

const { STAR_SYSTEMS } = require(resolve(ROOT, 'src/data/systems.ts'));

const allWorldPlanets = Object.values(STAR_SYSTEMS).flatMap((s) => s.planets.map((p) => p.id));
const tradePlanets = listAllTradeRoutePlanetIds();
const supplyPlanets = listConvoySupplyPlanetIds();
const demandPlanets = listConvoyDemandPlanetIds();

console.log('=== 월드 vs 교역 행성 ===');
console.log(`월드 행성 총 ${allWorldPlanets.length} · 교역 프로필 ${tradePlanets.length}`);
const nonTrade = allWorldPlanets.filter((id) => !tradePlanets.includes(id));
console.log(`교역 프로필 없음 (${nonTrade.length}):`, nonTrade.join(', ') || '(없음)');

console.log('\n=== 수송 생산지 / 수요지 ===');
console.log(`생산지(출발 가능) ${supplyPlanets.length}:`, supplyPlanets.join(', '));
console.log(`수요지(수입 배정) ${demandPlanets.length}:`, demandPlanets.join(', '));

const tradeNoSupply = tradePlanets.filter((id) => !supplyPlanets.includes(id));
console.log(`교역 행성 but 생산지 아님 (${tradeNoSupply.length}):`, tradeNoSupply.join(', ') || '(없음)');

// Bootstrap market for planning
rebuildAllPlanetTradeMarkets(tradePlanets, true);

const FAKE_BANK = 1_000_000_000;
const planOk = [];
const planFail = [];

for (const supplyId of supplyPlanets) {
  const routes = listConvoySourceRoutesAtPlanet(supplyId);
  const plan = planArcConvoyRouteAtSupply(supplyId, `audit_${supplyId}`, FAKE_BANK, {
    ignoreBankAffordability: true,
    minQty: 2,
  });
  if (plan) {
    planOk.push({ supplyId, dest: plan.destPlanetId, tg: plan.tgId, qty: plan.qty });
  } else {
    planFail.push({ supplyId, routeCount: routes.length });
  }
}

console.log('\n=== 왕복 계획 시뮬 (시장 부트·금고 무제한·minQty=2) ===');
console.log(`성공 ${planOk.length}/${supplyPlanets.length}`);
for (const row of planOk) {
  console.log(`  ${row.supplyId} → ${row.dest} ${row.tg} qty=${row.qty}`);
}
if (planFail.length) {
  console.log(`실패 ${planFail.length}:`, planFail.map((f) => `${f.supplyId}(routes=${f.routeCount})`).join(', '));
}

const coveredDemand = new Set(planOk.map((r) => r.dest));
const uncoveredDemand = demandPlanets.filter((id) => !coveredDemand.has(id));
console.log('\n=== 일일 배치 수요지 커버 (생산지 1왕복만 가정) ===');
console.log(`커버 ${coveredDemand.size}/${demandPlanets.length}`);
if (uncoveredDemand.length) {
  console.log('미커버 수요지:', uncoveredDemand.join(', '));
  const { resolveTradeRouteAssignedSupplyPlanetId } = require(
    resolve(ROOT, 'src/arcCore/economy/tradeRoutePlanetAssignmentRegistry.ts'),
  );
  const { listTradeRouteDemandImportItemIdsForPlanet } = require(
    resolve(ROOT, 'src/arcCore/economy/tradeRouteRegistry.ts'),
  );
  const { executeArcConvoyRoundTrip } = require(
    resolve(ROOT, 'src/arcCore/economy/runArcTransportTradePass.ts'),
  );
  let backfillOk = 0;
  for (const d of uncoveredDemand) {
    const imports = listTradeRouteDemandImportItemIdsForPlanet(d);
    const tg = imports[0];
    const supply = tg ? resolveTradeRouteAssignedSupplyPlanetId(tg) : null;
    if (!supply) {
      console.log(`  ${d}: backfill skip (no supply for ${tg})`);
      continue;
    }
    const trip = executeArcConvoyRoundTrip(`audit_backfill_${d}`, supply, {
      minQty: 2,
      forceDestPlanetId: d,
    });
    if (trip.ok) {
      backfillOk += 1;
      coveredDemand.add(d);
      console.log(`  backfill OK ${supply} → ${d}`);
    } else {
      console.log(`  backfill FAIL ${supply} → ${d} reason=${trip.reason}`);
    }
  }
  console.log(`백필 후 커버 ${coveredDemand.size}/${demandPlanets.length} (백필 성공 ${backfillOk})`);
}

// Which supply planets serve each demand via assignment
console.log('\n=== 수요지별 배정 공급 행성 ===');
for (const d of demandPlanets) {
  const imports = require(resolve(ROOT, 'src/arcCore/economy/tradeRouteRegistry.ts'))
    .listTradeRouteDemandImportItemIdsForPlanet(d);
  const tg = imports[0];
  if (!tg) {
    console.log(`${d}: (no import tg)`);
    continue;
  }
  const supplies = supplyPlanets.filter((s) => {
    const routes = listConvoySourceRoutesAtPlanet(s);
    return routes.some((r) => r.tgId === tg);
  });
  const dests = listDemandPlanetIdsForTradeGood(tg);
  console.log(`${d} tg=${tg} assignedDemand=${dests.join('|')} supplies=${supplies.join(',')}`);
}
