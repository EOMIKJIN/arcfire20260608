import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAYER_FLAGSHIP_HUB_INFO_SLOT } from '../game/planetHub/nearbyPresenceContract';
import {
  ORBIT_COMM_REFUSE_HOSTILE_SCENE_ID,
  ORBIT_COMM_REFUSE_UNIDENTIFIED_SCENE_ID,
  decideOrbitCommForCaptain,
  isOrbitCommHostile,
  type OrbitCommCaptainRef,
} from './orbitCommPolicy';

function stubCaptain(partial: {
  id: string;
  mainStageTalkEnabled: boolean;
  operationalState: OrbitCommCaptainRef['operationalState'];
  combatTeam: OrbitCommCaptainRef['combatTeam'];
  mainStageTalkSceneId?: string | null;
}): OrbitCommCaptainRef {
  return {
    id: partial.id,
    displayName: partial.id,
    displayNameEn: partial.id,
    mainStageTalkEnabled: partial.mainStageTalkEnabled,
    operationalState: partial.operationalState,
    combatTeam: partial.combatTeam,
    arcOrbitPresenceFill: false,
    mainStageTalkSceneId: partial.mainStageTalkSceneId ?? null,
  };
}

test('player flagship has no orbit comm', () => {
  const decision = decideOrbitCommForCaptain(
    { isPlayerFlagship: true, keySlot: PLAYER_FLAGSHIP_HUB_INFO_SLOT },
    undefined,
  );
  assert.equal(decision.outcome, 'none');
});

test('missing captain is unidentified refuse', () => {
  const decision = decideOrbitCommForCaptain({ captainId: 'npc_cpt_does_not_exist' }, undefined);
  assert.equal(decision.outcome, 'refuse');
  if (decision.outcome !== 'refuse') return;
  assert.equal(decision.reason, 'unidentified');
  assert.equal(decision.sceneId, ORBIT_COMM_REFUSE_UNIDENTIFIED_SCENE_ID);
});

test('friendly talk-enabled captain accepts own scene', () => {
  const captain = stubCaptain({
    id: 'npc_cpt_mireille',
    mainStageTalkEnabled: true,
    operationalState: 'general',
    combatTeam: 'blue',
    mainStageTalkSceneId: 'npc_dialog_mireille',
  });
  assert.equal(isOrbitCommHostile(captain), false);
  const decision = decideOrbitCommForCaptain({ captainId: captain.id }, captain);
  assert.equal(decision.outcome, 'accept');
  if (decision.outcome !== 'accept') return;
  assert.equal(decision.sceneId, 'npc_dialog_mireille');
  assert.equal(decision.captainId, 'npc_cpt_mireille');
});

test('hostile talk-enabled captain still accepts NPC scene', () => {
  const captain = stubCaptain({
    id: 'npc_cpt_kresh',
    mainStageTalkEnabled: true,
    operationalState: 'hostile',
    combatTeam: 'none',
    mainStageTalkSceneId: 'npc_dialog_kresh',
  });
  assert.equal(isOrbitCommHostile(captain), true);
  const decision = decideOrbitCommForCaptain({ captainId: captain.id }, captain);
  assert.equal(decision.outcome, 'accept');
  if (decision.outcome !== 'accept') return;
  assert.equal(decision.sceneId, 'npc_dialog_kresh');
});

test('hostile talk-disabled captain refuses', () => {
  const captain = stubCaptain({
    id: 'npc_cpt_enemy_arcadia_01',
    mainStageTalkEnabled: false,
    operationalState: 'general',
    combatTeam: 'red',
  });
  assert.equal(isOrbitCommHostile(captain), true);
  const decision = decideOrbitCommForCaptain({ captainId: captain.id }, captain);
  assert.equal(decision.outcome, 'refuse');
  if (decision.outcome !== 'refuse') return;
  assert.equal(decision.reason, 'hostile');
  assert.equal(decision.sceneId, ORBIT_COMM_REFUSE_HOSTILE_SCENE_ID);
});

test('퀘스트·총사령관 commGuaranteed — talk off여도 수락', () => {
  const captain = stubCaptain({
    id: 'npc_cpt_story_contact',
    mainStageTalkEnabled: false,
    operationalState: 'general',
    combatTeam: 'blue',
    mainStageTalkSceneId: 'story_dialog_talk_contact',
  });
  const decision = decideOrbitCommForCaptain(
    { captainId: captain.id, commGuaranteed: true },
    captain,
  );
  assert.equal(decision.outcome, 'accept');
  if (decision.outcome !== 'accept') return;
  assert.equal(decision.captainId, 'npc_cpt_story_contact');
  assert.equal(decision.sceneId, 'story_dialog_talk_contact');
});

test('commGuaranteed — 레지스트리 없어도 captainId면 수락', () => {
  const decision = decideOrbitCommForCaptain(
    { captainId: 'npc_cpt_missing_quest', commGuaranteed: true },
    undefined,
  );
  assert.equal(decision.outcome, 'accept');
  if (decision.outcome !== 'accept') return;
  assert.equal(decision.captainId, 'npc_cpt_missing_quest');
  assert.equal(decision.sceneId, 'npc_dialog_missing_quest');
});

test('기억 있어도 적대+talk off면 거부', () => {
  const captain = stubCaptain({
    id: 'npc_cpt_enemy_arcadia_01',
    mainStageTalkEnabled: false,
    operationalState: 'hostile',
    combatTeam: 'red',
  });
  const decision = decideOrbitCommForCaptain(
    { captainId: captain.id, planetId: 'arcadia_prime' },
    captain,
  );
  assert.equal(decision.outcome, 'refuse');
  if (decision.outcome !== 'refuse') return;
  assert.equal(decision.reason, 'hostile');
});
