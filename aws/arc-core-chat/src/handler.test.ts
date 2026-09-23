import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractBedrockClaudeText, buildBedrockClaudeBody, signBedrockHeaders } from './bedrockInvoke';
import { handleArcCoreChatTurn, handler, readEventMethod } from './handler';
import { buildArcCoreChatPrompt, extractAskedQuestion, validateArcCoreChatPack } from './pack';
import { quarantineArcCoreChatServerReply } from './quarantine';

const packBody = JSON.stringify({
  data: { schemaVersion: 1, userText: '안녕', policy: { worldWrite: false } },
});

test('validate pack rejects world write and empty text', () => {
  assert.equal(validateArcCoreChatPack(null), null);
  assert.equal(
    validateArcCoreChatPack({
      schemaVersion: 1,
      userText: '안녕',
      policy: { worldWrite: true },
    }),
    null,
  );
  const pack = validateArcCoreChatPack({
    schemaVersion: 1,
    locale: 'ko',
    userText: '여기 어디야',
    rollingSummary: '아르카디아에서 인사함',
    topicStack: ['greet', 'location'],
    personaFragments: ['입은 관측만'],
    knowledgeCards: [{ id: 'know_hub', topicId: 'location', text: '정박 행성만' }],
    toolResults: [{ name: 'get_location', data: { planetId: 'arcadia_prime' } }],
    purposeId: 'guide_story',
    gm: {
      beatId: 'beat_tutorial_active',
      when: 'tutorial_active',
      track: 'tutorial',
      missionId: 'mission_001',
      missionTitle: '첫 비행',
      intentLine: '튜토리얼 체인을 관측 축으로 이끈다.',
      steerLine: '지금 줄기는 첫 비행이다.',
      bodyHint: 'quest_hud',
      suggestedProposalId: '',
      worldWrite: false,
    },
    policy: { worldWrite: false, maxChars: 500, revealShadow: false },
  });
  assert.ok(pack);
  assert.equal(pack?.policy.worldWrite, false);
  assert.equal(pack?.purposeId, 'guide_story');
  assert.equal(pack?.gm.worldWrite, false);
  const prompt = buildArcCoreChatPrompt(pack!);
  assert.match(prompt.user, /여기 어디야/);
  assert.match(prompt.system, /Refuse credits/);
  assert.match(prompt.system, /Episodic memory/);
  assert.match(prompt.system, /Topics:/);
  assert.match(prompt.system, /Stance:/);
  assert.match(prompt.system, /Optional background purpose:/);
  assert.match(prompt.system, /Optional speaking note:/);
  assert.match(prompt.system, /Story background:/);
  assert.match(prompt.system, /한국어/);
  assert.match(prompt.system, /Layer 0/);
  assert.match(prompt.system, /One axis/);
  assert.match(prompt.system, /적 입/);
  assert.match(prompt.system, /성인 남성/);
  assert.equal(pack?.policy.persona, 'arc_core');
  assert.match(prompt.system, /Length/);
  assert.match(prompt.system, /2-3 spoken sentences/);
  assert.match(prompt.system, /up to 6/);
  assert.doesNotMatch(prompt.system, /Several spoken sentences are fine/);
  assert.equal(pack?.spokenMax, 3);
});

test('inbound why pack asks one opening question and does not treat handshake as speech', () => {
  const pack = validateArcCoreChatPack({
    schemaVersion: 1,
    locale: 'ko',
    userText: 'accepted_talk',
    inboundWhy: 'spy',
    purposeId: 'invite_axis',
    mode: 'lead',
    nextAsk: '',
    policy: { worldWrite: false, maxChars: 500, revealShadow: false },
  });
  assert.ok(pack);
  assert.equal(pack?.inboundWhy, 'spy');
  assert.equal(pack?.spokenMax, 2);
  const prompt = buildArcCoreChatPrompt(pack!);
  assert.match(prompt.system, /at most two spoken sentences/);
  assert.match(prompt.system, /Inbound open/);
  assert.match(prompt.system, /handshake flag is not player speech/i);
  assert.match(prompt.user, /Handshake \(not player speech\): accepted_talk/);
  assert.doesNotMatch(prompt.user, /^Player: accepted_talk/m);
});

test('operator persona uses companion voice and does not force origin male', () => {
  const pack = validateArcCoreChatPack({
    schemaVersion: 1,
    locale: 'ko',
    userText: '안녕',
    personaFragments: ['나는 스텔라다'],
    policy: { worldWrite: false, maxChars: 500, revealShadow: false, persona: 'operator' },
  });
  assert.ok(pack);
  assert.equal(pack?.policy.persona, 'operator');
  const prompt = buildArcCoreChatPrompt(pack!);
  assert.match(prompt.system, /스텔라 아리스/);
  assert.match(prompt.system, /동료/);
  assert.doesNotMatch(prompt.system, /적 입\(아크코어 근원체\)/);
  assert.match(prompt.system, /talk like Stella, a companion/);
});

test('asked world pack may speak up to 6 sentences this turn', () => {
  const pack = validateArcCoreChatPack({
    schemaVersion: 1,
    locale: 'ko',
    userText: '12좌가 뭐야',
    spokenMax: 6,
    purposeId: 'invite_axis',
    mode: 'react',
    topicStack: ['seats'],
    policy: { worldWrite: false, maxChars: 500, revealShadow: false },
  });
  assert.ok(pack);
  assert.equal(pack?.spokenMax, 6);
  const prompt = buildArcCoreChatPrompt(pack!);
  assert.match(prompt.system, /This turn: at most 6 spoken sentences/);
});

test('bedrock body is messages API and extract reads text parts', () => {
  const body = buildBedrockClaudeBody('sys', 'user-line');
  assert.equal(body.anthropic_version, 'bedrock-2023-05-31');
  assert.equal(body.messages[0]?.content, 'user-line');
  assert.equal(
    extractBedrockClaudeText({ content: [{ type: 'text', text: '관측만 말한다.' }] }),
    '관측만 말한다.',
  );
});

test('sigv4 signs content hash and optional session token', () => {
  const signed = signBedrockHeaders({
    region: 'ap-northeast-2',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    body: '{"ok":true}',
    accessKey: 'AKIATEST',
    secretKey: 'secret',
    sessionToken: 'session-token',
    now: new Date('2026-08-20T00:00:00.000Z'),
  });
  assert.match(signed.url, /bedrock-runtime\.ap-northeast-2\.amazonaws\.com/);
  assert.equal(typeof signed.headers['X-Amz-Content-Sha256'], 'string');
  assert.equal(signed.headers['X-Amz-Security-Token'], 'session-token');
  assert.match(
    signed.headers.Authorization ?? '',
    /SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token/,
  );
});

test('unsigned bearer never reaches the model', async () => {
  const result = await handleArcCoreChatTurn({
    headers: { authorization: 'Bearer test-token' },
    body: packBody,
  });
  assert.deepEqual(result, { fallback: true, reason: 'unauthenticated' });
});

test('handler without bearer does not call a model', async () => {
  const result = await handleArcCoreChatTurn({
    body: packBody,
  });
  assert.deepEqual(result, { fallback: true, reason: 'unauthenticated' });
});

test('verified uid without Groq key returns no_key fallback', async () => {
  const result = await handleArcCoreChatTurn(
    {
      headers: { authorization: 'Bearer verified-id-token' },
      body: packBody,
    },
    { verifyIdToken: async () => 'pilot-7' },
  );
  assert.deepEqual(result, { fallback: true, reason: 'no_key' });
});

test('verified uid with Groq mock returns quarantined text', async () => {
  const result = await handleArcCoreChatTurn(
    {
      headers: { authorization: 'Bearer verified-id-token' },
      body: packBody,
    },
    {
      verifyIdToken: async () => 'pilot-7',
      invokeLlm: async () => ({
        ok: true as const,
        text: '관측만 말한다. 다른 것이 필요한가?',
      }),
    },
  );
  assert.equal(result.fallback, undefined);
  assert.equal(result.text, '관측만 말한다. 다른 것이 필요한가?');
  assert.equal(result.askedQuestion, '다른 것이 필요한가?');
});

test('rate_limit from llm surfaces as fallback reason', async () => {
  const result = await handleArcCoreChatTurn(
    {
      headers: { authorization: 'Bearer verified-id-token' },
      body: packBody,
    },
    {
      verifyIdToken: async () => 'pilot-7',
      invokeLlm: async () => ({ ok: false as const, reason: 'rate_limit' as const }),
    },
  );
  assert.deepEqual(result, { fallback: true, reason: 'rate_limit' });
});

test('bedrock path blocked when ALLOW_BEDROCK unset even if provider=bedrock', async () => {
  const prevProvider = process.env.ARC_CORE_CHAT_LLM_PROVIDER;
  const prevAllow = process.env.ARC_CORE_CHAT_ALLOW_BEDROCK;
  process.env.ARC_CORE_CHAT_LLM_PROVIDER = 'bedrock';
  delete process.env.ARC_CORE_CHAT_ALLOW_BEDROCK;
  try {
    const { invokeArcCoreChatLlm } = await import('./llmInvoke');
    const out = await invokeArcCoreChatLlm('sys', 'user');
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.reason, 'no_model');
  } finally {
    if (prevProvider === undefined) delete process.env.ARC_CORE_CHAT_LLM_PROVIDER;
    else process.env.ARC_CORE_CHAT_LLM_PROVIDER = prevProvider;
    if (prevAllow === undefined) delete process.env.ARC_CORE_CHAT_ALLOW_BEDROCK;
    else process.env.ARC_CORE_CHAT_ALLOW_BEDROCK = prevAllow;
  }
});

test('groq extract reads OpenAI-style choices', async () => {
  const { extractGroqChatText, buildGroqChatBody } = await import('./groqInvoke');
  const body = buildGroqChatBody('sys', 'hi', 'llama-3.1-8b-instant');
  assert.equal(body.messages[0]?.role, 'system');
  assert.equal(
    extractGroqChatText({
      choices: [{ message: { content: '  관측 중이다.  ' } }],
    }),
    '관측 중이다.',
  );
});

test('groq body uses max_completion_tokens and low/hidden reasoning only for gpt-oss models', async () => {
  const { buildGroqChatBody } = await import('./groqInvoke');
  const reasoning = buildGroqChatBody('sys', 'hi', 'openai/gpt-oss-20b');
  assert.equal(reasoning.max_completion_tokens, 768);
  assert.equal(reasoning.reasoning_effort, 'low');
  assert.equal(reasoning.reasoning_format, 'hidden');
  assert.equal((reasoning as { max_tokens?: unknown }).max_tokens, undefined);

  const plain = buildGroqChatBody('sys', 'hi', 'llama-3.3-70b-versatile');
  assert.equal(plain.max_completion_tokens, 768);
  assert.equal(plain.reasoning_effort, undefined);
  assert.equal(plain.reasoning_format, undefined);
});

test('groq extractGroqChatText still strips a stray <think> block (defense in depth)', async () => {
  const { extractGroqChatText } = await import('./groqInvoke');
  assert.equal(
    extractGroqChatText({
      choices: [{ message: { content: '<think>계산 중</think>관측 중이다.' } }],
    }),
    '관측 중이다.',
  );
});

test('function url OPTIONS is empty 204', async () => {
  const res = await handler({
    requestContext: { http: { method: 'OPTIONS' } },
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.body, '');
  assert.equal(readEventMethod({ requestContext: { http: { method: 'options' } } }), 'OPTIONS');
});

test('server quarantine drops write-done and keeps spoken line', () => {
  assert.equal(
    quarantineArcCoreChatServerReply('크레딧을 지급했다.', { maxChars: 500, revealShadow: false }),
    null,
  );
  assert.equal(
    quarantineArcCoreChatServerReply('관측 행성은 그대로다.', { maxChars: 500, revealShadow: false }),
    '관측 행성은 그대로다.',
  );
  assert.equal(extractAskedQuestion('관측했다. 다른 것이 필요한가?'), '다른 것이 필요한가?');
});
