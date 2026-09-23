import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseArcCoreChatActionRequest } from './arcCoreChatActionRequest';

test('named bar girl talk opens talk_bar', () => {
  const mira = parseArcCoreChatActionRequest('미라와 대화하고 싶다', {
    currentPlanetId: 'arcadia_prime',
  });
  assert.equal(mira?.id, 'talk_bar');
  assert.equal(mira?.attendantId, 'ta_att_001');
  assert.equal(mira?.attendantName, '미라');
});

test('ellen talk maps to catalog captain', () => {
  const ellen = parseArcCoreChatActionRequest('엘렌과 대화하고 싶다');
  assert.equal(ellen?.id, 'talk_npc');
  assert.equal(ellen?.captainId, 'npc_cpt_arcadia_lane_01');
});

test('arm wave uses occupation seed labels', () => {
  const arm = parseArcCoreChatActionRequest('아르카디아를 전투지역으로 설정해줘');
  assert.equal(arm?.id, 'arm_wave');
  assert.equal(arm?.planetId, 'arcadia_prime');
});

test('here-arm uses current planet', () => {
  const arm = parseArcCoreChatActionRequest('여기를 전투지역으로 해줘', {
    currentPlanetId: 'omega_hub',
  });
  assert.equal(arm?.id, 'arm_wave');
  assert.equal(arm?.planetId, 'omega_hub');
});

test('combat result question is not an arm request', () => {
  assert.equal(parseArcCoreChatActionRequest('방금 전투 어떻게 됐어'), null);
});

test('facility open phrases', () => {
  assert.equal(parseArcCoreChatActionRequest('무역소 열어줘')?.id, 'open_trade');
  assert.equal(parseArcCoreChatActionRequest('바 열어줘')?.id, 'open_bar');
  assert.equal(parseArcCoreChatActionRequest('바를 연결해줘')?.id, 'open_bar');
  assert.equal(parseArcCoreChatActionRequest('바를 오픈해줘')?.id, 'open_bar');
  assert.equal(parseArcCoreChatActionRequest('경제 창 보여줘')?.id, 'open_economy');
  assert.equal(parseArcCoreChatActionRequest('대화 목록 열어줘')?.id, 'open_talk_roster');
});

test('inquiry and topic mention do not open doors', () => {
  assert.equal(parseArcCoreChatActionRequest('바에 엘라가 있나?'), null);
  assert.equal(parseArcCoreChatActionRequest('바'), null);
  assert.equal(parseArcCoreChatActionRequest('함장'), null);
  assert.equal(parseArcCoreChatActionRequest('함장이 누구야'), null);
  assert.equal(parseArcCoreChatActionRequest('엘렌 얘기 들었어?'), null);
  assert.equal(parseArcCoreChatActionRequest('무역소는 있어?'), null);
  assert.equal(parseArcCoreChatActionRequest('경제가 어때?'), null);
  assert.equal(parseArcCoreChatActionRequest('바로 출발할까'), null);
});

test('generic captain talk opens roster not a named npc', () => {
  assert.equal(parseArcCoreChatActionRequest('함장과 대화')?.id, 'open_talk_roster');
  assert.equal(parseArcCoreChatActionRequest('함장이랑 대화하자')?.id, 'open_talk_roster');
});

test('named captain still wins over generic roster phrase', () => {
  const ellen = parseArcCoreChatActionRequest('엘렌 함장과 대화');
  assert.equal(ellen?.id, 'talk_npc');
  assert.equal(ellen?.captainId, 'npc_cpt_arcadia_lane_01');
});
