import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addDayKeyDays,
  compareDayKey,
  evaluateCaptainPersonalOfferGate,
  hashSeed,
  pickCaptainPersonalTemplateId,
  resolvePersonalDeclineUntilDayKey,
  rotateIds,
  type CaptainPersonalOfferGateInput,
} from './captainPersonalMissionOffer';
import {
  allocateCaptainPersonalMissionId,
  buildCaptainPersonalMissionId,
  countActiveCaptainPersonalMissions,
  isCaptainPersonalMissionId,
  parseCaptainPersonalMissionId,
} from './captainPersonalMissionIds';
import { listCaptainPersonalTemplateIds } from './captainPersonalMissionTemplates';

function gate(over: Partial<CaptainPersonalOfferGateInput> = {}): CaptainPersonalOfferGateInput {
  return {
    commAccepted: true,
    talkEnabled: true,
    isHostileRefuse: false,
    isFlagship: false,
    isOrbitFill: false,
    hasOfferableMainStory: false,
    hasActiveTalkContact: false,
    captainActivePersonalCount: 0,
    accountActivePersonalCount: 0,
    dayKey: '2026-09-18',
    templateAvailable: true,
    ...over,
  };
}

test('arc_cpt id parse/build/allocate', () => {
  const id = buildCaptainPersonalMissionId('npc_cpt_mireille', 1);
  assert.equal(id, 'arc_cpt_npc_cpt_mireille_01');
  assert.equal(isCaptainPersonalMissionId(id), true);
  assert.deepEqual(parseCaptainPersonalMissionId(id), { captainId: 'npc_cpt_mireille', seq: 1 });
  const used = new Set([id]);
  assert.equal(
    allocateCaptainPersonalMissionId('npc_cpt_mireille', used),
    'arc_cpt_npc_cpt_mireille_02',
  );
});

test('active personal count filters captain and status', () => {
  const progresses = {
    arc_cpt_npc_cpt_mireille_01: { status: 'active', missionId: 'arc_cpt_npc_cpt_mireille_01' },
    arc_cpt_npc_cpt_kresh_01: { status: 'active', missionId: 'arc_cpt_npc_cpt_kresh_01' },
    arc_cpt_npc_cpt_mireille_02: { status: 'complete', missionId: 'arc_cpt_npc_cpt_mireille_02' },
    sandbox_01: { status: 'active', missionId: 'sandbox_01' },
  };
  assert.equal(countActiveCaptainPersonalMissions(progresses), 2);
  assert.equal(countActiveCaptainPersonalMissions(progresses, 'npc_cpt_mireille'), 1);
  assert.equal(countActiveCaptainPersonalMissions(progresses, 'npc_cpt_sela'), 0);
});

test('offer gate blocks fill, story, contact, cap, cooldown, same-day', () => {
  assert.equal(evaluateCaptainPersonalOfferGate(gate()).reason, 'ok');
  assert.equal(evaluateCaptainPersonalOfferGate(gate({ isOrbitFill: true })).reason, 'orbit_fill');
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ hasOfferableMainStory: true })).reason,
    'main_story_priority',
  );
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ hasActiveTalkContact: true })).reason,
    'talk_contact_priority',
  );
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ captainActivePersonalCount: 1 })).reason,
    'captain_active',
  );
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ accountActivePersonalCount: 3 })).reason,
    'account_cap',
  );
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ declineUntilDayKey: '2026-09-19' })).reason,
    'decline_cooldown',
  );
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ lastPersonalOfferDayKey: '2026-09-18' })).reason,
    'same_day_offer',
  );
  assert.equal(
    evaluateCaptainPersonalOfferGate(gate({ declineUntilDayKey: '2026-09-18' })).reason,
    'ok',
  );
});

test('day key add and decline until tomorrow', () => {
  assert.equal(addDayKeyDays('2026-09-18', 1), '2026-09-19');
  assert.equal(addDayKeyDays('2026-09-30', 1), '2026-10-01');
  assert.equal(resolvePersonalDeclineUntilDayKey('2026-09-18'), '2026-09-19');
  assert.equal(compareDayKey('2026-09-18', '2026-09-19'), -1);
});

test('template pick is deterministic and pool has 6 families', () => {
  const ids = listCaptainPersonalTemplateIds();
  assert.equal(ids.length, 6);
  const a = pickCaptainPersonalTemplateId(ids, 'npc_cpt_mireille', 'arcadia_prime', '2026-09-18');
  const b = pickCaptainPersonalTemplateId(ids, 'npc_cpt_mireille', 'arcadia_prime', '2026-09-18');
  const c = pickCaptainPersonalTemplateId(ids, 'npc_cpt_kresh', 'vega_base', '2026-09-18');
  assert.equal(a, b);
  assert.ok(a);
  assert.ok(c);
  const rotated = rotateIds(['a', 'b', 'c'], 1);
  assert.deepEqual(rotated, ['b', 'c', 'a']);
  assert.ok(hashSeed(['x']) >= 0);
});
