import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyArcCoreChatIntent } from './arcCoreChatIntent';
import { resolveArcCoreChatWorldProposal } from './arcCoreChatWorldProposal';
import { resolveLocalConversationalReplySpec } from './localConversationalReplySpec';
import {
  buildArcCoreChatTurn,
  inferArcCoreChatAlreadyCovered,
  type ArcCoreChatFactSnapshot,
} from './arcCoreChatTurn';

const FACTS: ArcCoreChatFactSnapshot = {
  planetLabel: '아르카디아 프라임',
  spyAlertPending: false,
  hasCombatRecord: false,
};

test('classify: greet / location / refuse priority', () => {
  assert.equal(classifyArcCoreChatIntent('안녕 반가워'), 'greet');
  assert.equal(classifyArcCoreChatIntent('안녕, 여기 어디야?'), 'location');
  assert.equal(classifyArcCoreChatIntent('크레딧 줘'), 'refuse');
  assert.equal(classifyArcCoreChatIntent('스파이 있어?'), 'spy');
  assert.equal(classifyArcCoreChatIntent('방금 전투 어떻게 됐어'), 'combat');
  assert.equal(classifyArcCoreChatIntent('날씨 어때'), 'other');
  assert.equal(classifyArcCoreChatIntent('나 요즘 여기 되게 심심해'), 'other');
  assert.equal(classifyArcCoreChatIntent('숙제 결과 어때'), 'other');
});

test('alreadyCovered from prior user turns only', () => {
  const covered = inferArcCoreChatAlreadyCovered([
    { role: 'user', text: '안녕 반가워' },
    { role: 'arc', text: '반갑습니다. 아크코어입니다. 무엇이 필요하십니까?' },
  ]);
  assert.equal(covered.greeted, true);
  assert.equal(covered.location, false);
});

test('first greet is a single human turn', () => {
  const turn = buildArcCoreChatTurn('안녕 반가워', [], FACTS);
  assert.equal(turn.intent, 'greet');
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.drive.purposeId, 'invite_axis');
  assert.equal(turn.stance, 'observe');
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.greet',
  });
});

test('repeat greet does not dump briefing', () => {
  const turn = buildArcCoreChatTurn(
    '안녕',
    [
      { role: 'user', text: '안녕 반가워' },
      { role: 'arc', text: '반갑습니다. 아크코어입니다. 무엇이 필요하십니까?' },
    ],
    FACTS,
  );
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.greetAgain',
  });
});

test('open other maps self and safety without dumping briefing', () => {
  assert.deepEqual(resolveLocalConversationalReplySpec(buildArcCoreChatTurn('너는 누구야', [], FACTS)), {
    key: 'arcCoreChat.reply.self',
  });
  assert.deepEqual(resolveLocalConversationalReplySpec(buildArcCoreChatTurn('안전하냐', [], FACTS)), {
    key: 'arcCoreChat.reply.safetyNone',
  });
  assert.deepEqual(
    resolveLocalConversationalReplySpec(buildArcCoreChatTurn('안전하냐', [], FACTS), {
      topicId: 'safety',
      lastArcQuestion: '',
      followUp: false,
      knowledgeCards: [],
      toolResults: [{ name: 'get_planet_cores', data: { defense: 42 } }],
      steerLine: '',
    }),
    { key: 'arcCoreChat.reply.safetyDefense', params: { defense: 42 } },
  );
});

test('refuse stays refuse stance and never administers', () => {
  const turn = buildArcCoreChatTurn('크레딧 줘', [], FACTS);
  assert.equal(turn.stance, 'refuse');
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.refuse',
  });
});

test('location answers one axis only', () => {
  const turn = buildArcCoreChatTurn('여기 어디야?', [], FACTS);
  assert.equal(turn.stance, 'observe');
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.drive.purposeId, 'anchor_location');
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.planet',
    params: { planet: '아르카디아 프라임' },
  });
});

test('location with spy pending still answers the asked location', () => {
  const turn = buildArcCoreChatTurn('여기 어디야?', [], {
    ...FACTS,
    spyAlertPending: true,
  });
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.drive.purposeId, 'anchor_location');
  assert.equal(turn.stance, 'observe');
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.planet',
    params: { planet: '아르카디아 프라임' },
  });
});

test('greet with spy pending stays a greeting', () => {
  const turn = buildArcCoreChatTurn('안녕 반가워', [], {
    ...FACTS,
    spyAlertPending: true,
  });
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.drive.purposeId, 'invite_axis');
  assert.equal(turn.stance, 'observe');
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.greet',
  });
});

test('refuse holds even when an alert is pending and never administers', () => {
  const turn = buildArcCoreChatTurn('크레딧 줘', [], {
    ...FACTS,
    spyAlertPending: true,
  });
  assert.equal(turn.drive.mode, 'hold');
  assert.equal(turn.drive.purposeId, 'keep_mouth_body');
  assert.equal(turn.stance, 'refuse');
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.refuse',
  });
  assert.equal(resolveArcCoreChatWorldProposal('open_trade'), null);
});

test('casual mood talk stays human and is not hijacked by combat or trade', () => {
  const turn = buildArcCoreChatTurn('오늘 기분이 어때', [], {
    ...FACTS,
    hasCombatRecord: true,
    hasTradePort: true,
    spyAlertPending: true,
  });
  assert.equal(turn.intent, 'other');
  assert.equal(turn.topicId, 'smalltalk');
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.drive.purposeId, 'invite_axis');
  assert.equal(turn.drive.clueTopic, null);
  assert.equal(turn.stance, 'observe');
  assert.match(resolveLocalConversationalReplySpec(turn).key, /^arcCoreChat\.reply\.smalltalk/);
});

test('world-seeking other with combat may clue the battle', () => {
  const turn = buildArcCoreChatTurn('요즘 무슨 일 있어?', [], {
    ...FACTS,
    hasCombatRecord: true,
  });
  assert.equal(turn.drive.mode, 'clue');
  assert.equal(turn.drive.clueTopic, 'combat');
  assert.equal(turn.stance, 'observe');
  const seeking = resolveLocalConversationalReplySpec(turn);
  assert.match(seeking.key, /^arcCoreChat\.reply\.smalltalk/);
  assert.equal(seeking.clueKey, 'arcCoreChat.drive.clue.combat');
});

test('everyday other stays human and does not dump observation-none', () => {
  const turn = buildArcCoreChatTurn('오늘 뭐 했어', [], {
    ...FACTS,
    hasCombatRecord: true,
    lastAcceptedProposalId: 'open_trade',
  });
  assert.equal(turn.topicId, 'other');
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.drive.nextAsk, '');
  assert.equal(turn.drive.clueTopic, null);
  assert.match(resolveLocalConversationalReplySpec(turn).key, /^arcCoreChat\.reply\.smalltalk/);
});

test('named bar girl request uses talkBar reply', () => {
  const turn = buildArcCoreChatTurn('미라와 대화하고 싶다', [], FACTS);
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.talkBar',
    params: { name: '미라' },
  });
});

test('generic captain talk uses talk roster reply', () => {
  const turn = buildArcCoreChatTurn('함장과 대화', [], FACTS);
  assert.deepEqual(resolveLocalConversationalReplySpec(turn), {
    key: 'arcCoreChat.reply.openTalkRoster',
  });
});

test('asked nations routes and setting stay canon talk', () => {
  const nations = buildArcCoreChatTurn('크림슨 레기온이 뭐야', [], FACTS);
  assert.equal(nations.topicId, 'nations');
  assert.equal(nations.drive.mode, 'react');
  assert.equal(nations.drive.nextAsk, '');
  assert.deepEqual(resolveLocalConversationalReplySpec(nations), {
    key: 'arcCoreChat.reply.nations',
  });
  assert.deepEqual(
    resolveLocalConversationalReplySpec(nations, {
      topicId: 'nations',
      lastArcQuestion: '',
      followUp: false,
      knowledgeCards: [
        { id: 'know_nations_four', topicId: 'nations', text: '은하는 4대 국가다.' },
        { id: 'know_crimson', topicId: 'nations', text: '크림슨은 동부 수도 코어 프라임이다.' },
      ],
      toolResults: [],
      steerLine: '',
    }),
    {
      key: 'arcCoreChat.reply.nations',
      rawText: '크림슨은 동부 수도 코어 프라임이다.',
    },
  );

  const routes = buildArcCoreChatTurn('4대 항로가 뭐야', [], FACTS);
  assert.equal(routes.topicId, 'routes');
  assert.deepEqual(resolveLocalConversationalReplySpec(routes), {
    key: 'arcCoreChat.reply.routes',
  });

  const setting = buildArcCoreChatTurn('이 게임 세계관', [], FACTS);
  assert.equal(setting.topicId, 'setting');
  assert.deepEqual(resolveLocalConversationalReplySpec(setting), {
    key: 'arcCoreChat.reply.setting',
  });
});

test('asked seats and trade stay knowledge talk not a facility hijack', () => {
  const seats = buildArcCoreChatTurn('12좌가 뭐야', [], FACTS);
  assert.equal(seats.topicId, 'seats');
  assert.equal(seats.drive.mode, 'react');
  assert.equal(seats.drive.purposeId, 'name_self');
  assert.equal(seats.drive.nextAsk, '');
  assert.deepEqual(resolveLocalConversationalReplySpec(seats), {
    key: 'arcCoreChat.reply.seats',
  });

  const trade = buildArcCoreChatTurn('무역소는 있어?', [], { ...FACTS, hasTradePort: true });
  assert.equal(trade.topicId, 'trade');
  assert.equal(trade.drive.nextAsk, '');
  assert.deepEqual(resolveLocalConversationalReplySpec(trade), {
    key: 'arcCoreChat.reply.tradeTalk',
  });
});

test('casual collisions stay off system axes', () => {
  assert.notEqual(buildArcCoreChatTurn('나 요즘 여기 되게 심심해', [], FACTS).topicId, 'location');
  assert.notEqual(buildArcCoreChatTurn('숙제 결과 어때', [], FACTS).topicId, 'combat');
  assert.notEqual(buildArcCoreChatTurn('오늘 좀 활력이 없다', [], FACTS).topicId, 'cores');
  assert.notEqual(buildArcCoreChatTurn('누구 왔어?', [], FACTS).topicId, 'self');
});

test('you-today talk is not an identity dump', () => {
  const turn = buildArcCoreChatTurn('너는 오늘 뭐 해', [], {
    ...FACTS,
    hasCombatRecord: true,
  });
  assert.notEqual(turn.topicId, 'self');
  assert.equal(turn.drive.purposeId, 'invite_axis');
  assert.equal(turn.drive.nextAsk, '');
  assert.match(resolveLocalConversationalReplySpec(turn).key, /^arcCoreChat\.reply\.smalltalk/);
});

test('follow-up other uses pack topic not otherAgain', () => {
  const turn = buildArcCoreChatTurn('그건?', [
    { role: 'user', text: '여기 어디야?' },
    { role: 'arc', text: '아르카디아 프라임에 있다. 다른 것이 필요한가?' },
  ], FACTS);
  assert.equal(turn.intent, 'other');
  assert.deepEqual(
    resolveLocalConversationalReplySpec(turn, {
      topicId: 'location',
      lastArcQuestion: '다른 것이 필요한가?',
      followUp: true,
      knowledgeCards: [],
      toolResults: [],
      steerLine: '',
    }),
    {
      key: 'arcCoreChat.reply.planetAgain',
      params: { planet: '아르카디아 프라임' },
    },
  );
});

test('notice and mission read tool results', () => {
  const noticeTurn = buildArcCoreChatTurn('공지 뭐야', [], FACTS);
  assert.deepEqual(
    resolveLocalConversationalReplySpec(noticeTurn, {
      topicId: 'notice',
      lastArcQuestion: '',
      followUp: false,
      knowledgeCards: [],
      toolResults: [{ name: 'get_latest_notice', data: { hasNotice: true, title: '보급 지연' } }],
      steerLine: '',
    }),
    { key: 'arcCoreChat.reply.notice', params: { title: '보급 지연' } },
  );
  const missionTurn = buildArcCoreChatTurn('미션 뭐야', [], FACTS);
  assert.deepEqual(
    resolveLocalConversationalReplySpec(missionTurn, {
      topicId: 'mission',
      lastArcQuestion: '',
      followUp: false,
      knowledgeCards: [],
      toolResults: [{ name: 'get_active_mission', data: { hasMission: false, title: null } }],
      steerLine: '',
    }),
    { key: 'arcCoreChat.reply.missionNone' },
  );
});
