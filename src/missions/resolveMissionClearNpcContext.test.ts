import assert from 'node:assert/strict';
import type { Mission, MissionObjective, MissionType } from '../types';
import {
  applyResolvedClearContactToMission,
  isMissionClearContactAtPlanet,
  resolveMissionDestinationPlanetId,
  resolveMissionClearAssignedNpcCaptainId,
  resolveMissionClearNpcSceneKind,
  shouldAssignClearContact,
} from './resolveMissionClearNpcContext';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

function obj(type: MissionObjective['type'], targetId: string, extra?: Partial<MissionObjective>): MissionObjective {
  return { id: `o_${type}_${targetId}`, description: '', type, targetId, complete: false, ...extra };
}

function mission(
  objectives: MissionObjective[],
  extra?: Partial<Pick<Mission, 'type' | 'clearNpcCaptainId' | 'requiresClearContact' | 'offerCaptainId' | 'id'>>,
): Pick<Mission, 'id' | 'type' | 'objectives' | 'clearNpcCaptainId' | 'requiresClearContact' | 'offerCaptainId'> {
  return { id: extra?.id ?? 'm_test', type: extra?.type ?? 'explore', objectives, ...extra };
}

function fullMission(
  objectives: MissionObjective[],
  extra?: Partial<Mission> & { type?: MissionType },
): Mission {
  return {
    id: extra?.id ?? 'm_test',
    title: extra?.title ?? '테스트',
    description: extra?.description ?? '설명',
    descriptionEn: extra?.descriptionEn ?? 'Desc',
    type: extra?.type ?? 'explore',
    objectives,
    rewards: { credits: 1, exp: 1 },
    prerequisiteIds: [],
    nextMissionId: null,
    dc: 8,
    offerCaptainId: extra?.offerCaptainId,
    clearNpcCaptainId: extra?.clearNpcCaptainId,
    requiresClearContact: extra?.requiresClearContact,
  };
}

const noSystemPlanet = () => null;
const vegaSystemToPlanet = (systemId: string) => (systemId === 'vega_outpost' ? 'vega_base' : null);
const noBarHost = () => null;
const vegaBarHost = (planetId: string) => (planetId === 'vega_base' ? 'npc_cpt_vega_watch_01' : null);
const labels = (id: string) =>
  id === 'npc_cpt_vega_watch_01'
    ? { name: '세린 코프', nameEn: 'Serin Koff' }
    : id === 'npc_cpt_arcadia_lane_02'
      ? { name: '마르크 세인', nameEn: 'Mark Sain' }
      : null;

test('reach_planet objective resolves destination directly', () => {
  const m = mission([obj('buy_goods', 'food', { quantity: 3 }), obj('reach_planet', 'vega_base')]);
  assert.equal(resolveMissionDestinationPlanetId(m, noSystemPlanet), 'vega_base');
});

test('reach_system objective resolves via system-to-planet lookup', () => {
  const m = mission([obj('buy_goods', 'minerals', { quantity: 3 }), obj('reach_system', 'vega_outpost')]);
  assert.equal(resolveMissionDestinationPlanetId(m, vegaSystemToPlanet), 'vega_base');
});

test('reach_system with no landable planet in system yields null (operator fallback)', () => {
  const m = mission([obj('reach_system', 'empty_relay')]);
  assert.equal(resolveMissionDestinationPlanetId(m, noSystemPlanet), null);
});

test('defeat_enemy-only mission has no destination (operator fallback)', () => {
  const m = mission([obj('defeat_enemy', 'pirate_scout_01')], { type: 'combat' });
  assert.equal(resolveMissionDestinationPlanetId(m, noSystemPlanet), null);
});

test('explore/travel reach-only is not a contact quest (operator)', () => {
  const m = mission([obj('reach_system', 'vega_outpost')], { type: 'explore' });
  assert.equal(shouldAssignClearContact(m), false);
  assert.equal(
    resolveMissionClearAssignedNpcCaptainId(m, vegaSystemToPlanet, vegaBarHost),
    null,
  );
});

test('combat has no dest officer even if a bar host exists', () => {
  const m = mission([obj('defeat_enemy', 'pirate_scout_01')], { type: 'combat' });
  assert.equal(shouldAssignClearContact(m), false);
  assert.equal(resolveMissionClearAssignedNpcCaptainId(m, noSystemPlanet, vegaBarHost), null);
});

test('trade buy-only is operator (no dest officer)', () => {
  const m = mission([obj('buy_goods', 'tech', { quantity: 2 })], { type: 'trade' });
  assert.equal(shouldAssignClearContact(m), false);
});

test('delivery type assigns destination bar host', () => {
  const m = mission([obj('reach_system', 'vega_outpost')], { type: 'delivery' });
  assert.equal(shouldAssignClearContact(m), true);
  assert.equal(
    resolveMissionClearAssignedNpcCaptainId(m, vegaSystemToPlanet, vegaBarHost),
    'npc_cpt_vega_watch_01',
  );
});

test('buy_goods + reach assigns dest host even without type=delivery', () => {
  const m = mission([obj('buy_goods', 'minerals', { quantity: 3 }), obj('reach_system', 'vega_outpost')]);
  const captainId = resolveMissionClearAssignedNpcCaptainId(m, vegaSystemToPlanet, vegaBarHost);
  assert.equal(captainId, 'npc_cpt_vega_watch_01');
});

test('requiresClearContact rendezvous assigns dest host (tq_oth_05)', () => {
  const m = mission([obj('reach_planet', 'vega_base')], { type: 'travel', requiresClearContact: true });
  assert.equal(shouldAssignClearContact(m), true);
  assert.equal(
    resolveMissionClearAssignedNpcCaptainId(m, noSystemPlanet, vegaBarHost),
    'npc_cpt_vega_watch_01',
  );
});

test('assigned NPC falls back to null when no bar host at destination', () => {
  const m = mission([obj('reach_planet', 'unmapped_planet')], { type: 'delivery' });
  const captainId = resolveMissionClearAssignedNpcCaptainId(m, noSystemPlanet, noBarHost);
  assert.equal(captainId, null);
});

test('explicit clearNpcCaptainId override takes priority (special quest)', () => {
  const m = mission([obj('reach_planet', 'vega_base')], {
    type: 'explore',
    clearNpcCaptainId: 'npc_cpt_special_story',
  });
  const captainId = resolveMissionClearAssignedNpcCaptainId(m, noSystemPlanet, vegaBarHost);
  assert.equal(captainId, 'npc_cpt_special_story');
});

test('scene kind — delivery when cargo present, arrival otherwise', () => {
  assert.equal(
    resolveMissionClearNpcSceneKind([obj('buy_goods', 'minerals'), obj('reach_system', 'vega_outpost')]),
    'delivery',
  );
  assert.equal(resolveMissionClearNpcSceneKind([obj('reach_planet', 'vega_base')]), 'arrival');
});

test('contact activates only at destination planet', () => {
  const m = mission([obj('buy_goods', 'food'), obj('reach_system', 'vega_outpost')]);
  assert.equal(
    isMissionClearContactAtPlanet(m, 'npc_cpt_vega_watch_01', 'vega_base', vegaSystemToPlanet, vegaBarHost),
    true,
  );
  assert.equal(
    isMissionClearContactAtPlanet(m, 'npc_cpt_vega_watch_01', 'arcadia_prime', vegaSystemToPlanet, vegaBarHost),
    false,
  );
});

test('instance stamp mentions origin and dest officers on contact delivery', () => {
  const stamped = applyResolvedClearContactToMission(
    fullMission(
      [obj('buy_goods', 'minerals', { quantity: 3 }), obj('reach_system', 'vega_outpost')],
      { type: 'delivery', offerCaptainId: 'npc_cpt_arcadia_lane_02' },
    ),
    vegaSystemToPlanet,
    vegaBarHost,
    labels,
  );
  assert.equal(stamped.clearNpcCaptainId, 'npc_cpt_vega_watch_01');
  assert.match(stamped.description, /발송지 담당: 마르크 세인/);
  assert.match(stamped.description, /목적지 담당: 세린 코프/);
  assert.match(String(stamped.descriptionEn), /Destination contact: Serin Koff/);
});

test('neighbor-system delivery has no fixed dest (bar at landing completes)', () => {
  const m = mission(
    [obj('buy_goods', 'minerals', { quantity: 3 }), obj('reach_system', '__neighbor_system__')],
    { type: 'delivery' },
  );
  assert.equal(shouldAssignClearContact(m), true);
  assert.equal(resolveMissionDestinationPlanetId(m, vegaSystemToPlanet), null);
  assert.equal(
    resolveMissionClearAssignedNpcCaptainId(m, vegaSystemToPlanet, vegaBarHost),
    null,
  );
});

test('instance stamp mentions bar-at-arrival for neighbor delivery', () => {
  const stamped = applyResolvedClearContactToMission(
    fullMission(
      [obj('buy_goods', 'minerals', { quantity: 3 }), obj('reach_system', '__neighbor_system__')],
      { type: 'delivery', offerCaptainId: 'npc_cpt_arcadia_lane_02' },
    ),
    vegaSystemToPlanet,
    vegaBarHost,
    labels,
  );
  assert.equal(stamped.clearNpcCaptainId, undefined);
  assert.match(stamped.description, /도착 행성 바 주인/);
});

test('instance stamp is a no-op for explore travel', () => {
  const original = fullMission([obj('reach_system', 'vega_outpost')], { type: 'explore' });
  const stamped = applyResolvedClearContactToMission(
    original,
    vegaSystemToPlanet,
    vegaBarHost,
    labels,
  );
  assert.equal(stamped.clearNpcCaptainId, undefined);
  assert.equal(stamped.description, original.description);
});
