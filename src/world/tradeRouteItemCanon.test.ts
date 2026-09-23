/**
 * tg_* attrs F·지역 쌍 + tags 동기
 * npx tsx --test src/world/tradeRouteItemCanon.test.ts
 */
import assert from 'node:assert/strict';
import { TradeRoutePlanetSupplyAssignments_FROM_BALANCE_CSV } from '../data/balance/generated';
import { ITEM_DEFS_FROM_CSV } from '../data/generated/csvItemDefs';
import { STORY_SCENES_FROM_CSV } from '../data/generated/csvStoryScenes';
import { resolveTradeRouteRole } from '../arcCore/economy/tradeRouteRegistry';
import { resolveGalaxyRouteDirectionForPlanet } from './galaxyRouteFactionBridge';
import { QUAD_TRADE_REGION_BY_FACTION } from './quadNationRouteCanon';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('trade_route 전 행 — F↔지역 쌍 + tags가 attrs F와 일치', () => {
  let count = 0;
  for (const def of Object.values(ITEM_DEFS_FROM_CSV)) {
    if (def.type !== 'trade_route') continue;
    const a = def.attrs ?? {};
    assert.equal(a.tradeRoute, true, def.id);
    const srcF = String(a.srcFactionCode ?? '').trim();
    const dstF = String(a.dstFactionCode ?? '').trim();
    const srcR = QUAD_TRADE_REGION_BY_FACTION[srcF as keyof typeof QUAD_TRADE_REGION_BY_FACTION];
    const dstR = QUAD_TRADE_REGION_BY_FACTION[dstF as keyof typeof QUAD_TRADE_REGION_BY_FACTION];
    assert.ok(srcR, `${def.id} src F ${srcF}`);
    assert.ok(dstR, `${def.id} dst F ${dstF}`);
    assert.equal(String(a.srcRegion ?? '').trim(), srcR, def.id);
    assert.equal(String(a.dstRegion ?? '').trim(), dstR, def.id);
    const tags = def.tags ?? [];
    assert.equal(tags.includes('trade_route'), true, def.id);
    assert.equal(tags.includes(`src_${srcF}`), true, `${def.id} tags src`);
    assert.equal(tags.includes(`dst_${dstF}`), true, `${def.id} tags dst`);
    count += 1;
  }
  assert.equal(count >= 90, true, `trade_route count ${count}`);
});

test('인트로 호칭 — 스텔리움 연합 · 동부 크림슨 (연합국/북부 잔존 없음)', () => {
  const intro = STORY_SCENES_FROM_CSV.intro01;
  const blob = intro.pages
    .map((p) => `${p.text}\n${p.textEn ?? ''}`)
    .join('\n');
  assert.equal(blob.includes('연합국'), false);
  assert.equal(blob.includes('은하계 북부'), false);
  assert.equal(blob.includes('seized the north'), false);
  assert.equal(blob.includes('스텔리움 연합'), true);
  assert.equal(blob.includes('은하계 동부'), true);
  assert.equal(blob.includes('seized the east'), true);
});

test('수도 항로 해석은 F 코드 — eden_city=west · synth_706_p=south · core_prime=east · synth_732_p=north', () => {
  assert.equal(resolveGalaxyRouteDirectionForPlanet('eden_city'), 'west');
  assert.equal(resolveGalaxyRouteDirectionForPlanet('synth_706_p'), 'south');
  assert.equal(resolveGalaxyRouteDirectionForPlanet('core_prime'), 'east');
  assert.equal(resolveGalaxyRouteDirectionForPlanet('synth_732_p'), 'north');
});

test('21코어 역할은 배정표 1순위 — F 불일치여도 supply/demand 유지', () => {
  const row = TradeRoutePlanetSupplyAssignments_FROM_BALANCE_CSV.find((r) => r.tgId === 'tg_001');
  assert.ok(row);
  assert.equal(resolveTradeRouteRole(row.supplyPlanetId, 'tg_001'), 'supply');
  assert.equal(resolveTradeRouteRole(row.demandPlanetId, 'tg_001'), 'demand');
});
