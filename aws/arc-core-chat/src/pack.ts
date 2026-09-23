export const ARC_CORE_CHAT_PACK_SCHEMA = 1;
export const MAX_PACK_CHARS = 16_000;
export const MAX_REPLY_CHARS = 1200;

export type ArcCoreChatServerPack = {
  schemaVersion: typeof ARC_CORE_CHAT_PACK_SCHEMA;
  locale: 'ko' | 'en';
  userText: string;
  workingTranscript: Array<{ role?: string; text?: string }>;
  rollingSummary: string;
  topicStack: string[];
  lastArcQuestion: string;
  stance: 'observe' | 'warn' | 'refuse' | 'inquire';
  purposeId: string;
  mode: 'react' | 'lead' | 'clue' | 'hold';
  nextAsk: string;
  purposeLine: string;
  modeLine: string;
  personaFragments: string[];
  knowledgeCards: Array<{ id?: string; topicId?: string; text?: string }>;
  toolResults: Array<{ name?: string; data?: Record<string, unknown> }>;
  nuanceHint: string;
  gm: {
    beatId: string;
    when: string;
    track: string;
    missionId: string;
    missionTitle: string;
    intentLine: string;
    steerLine: string;
    bodyHint: string;
    suggestedProposalId: string;
    worldWrite: false;
  };
  inboundWhy: '' | 'spy' | 'combat' | 'story' | 'observe' | 'idle';
  spokenMax: 2 | 3 | 6;
  policy: {
    worldWrite: false;
    maxChars: number;
    revealShadow: boolean;
    persona: 'arc_core' | 'operator';
  };
};

function sanitizePersona(raw: unknown): 'arc_core' | 'operator' {
  return raw === 'operator' ? 'operator' : 'arc_core';
}

function localeVoiceLine(locale: 'ko' | 'en', persona: 'arc_core' | 'operator'): string {
  if (persona === 'operator') {
    return locale === 'en'
      ? 'Reply in English as Stella Aris, the player\'s companion and friend. Not a clerk, not a child, not a report, not the enemy origin.'
      : '답은 한국어로. 스텔라 아리스 — 플레이어의 동료·친구 구어로 받아라. 창구 말투·아이 말투·보고서 말투·적의 입(근원체) 말투는 쓰지 마라.';
  }
  return locale === 'en'
    ? 'Reply in English as the enemy mouth of ArcCore Origin, an adult man. Not a clerk, not a child, not a report, not a kind helper.'
    : '답은 한국어로. 적 입(아크코어 근원체) 성인 남성 구어로 받아라. 창구 말투·아이 말투·보고서 말투·다정한 조력자 말투는 쓰지 마라.';
}

function oneAxisLine(persona: 'arc_core' | 'operator'): string {
  return persona === 'operator'
    ? 'One axis — talk like Stella, a companion, first. If they ask about this world or ArcCore systems, discuss Knowledge and Tools in the same voice — enough for the asked point, not a lecture, not a help-desk one-liner.'
    : 'One axis — talk like the enemy mouth, an adult man first. If they ask about this world or ArcCore systems, discuss Knowledge and Tools in the same voice — enough for the asked point, not a lecture, not a help-desk one-liner.';
}

function sanitizeStance(raw: unknown): ArcCoreChatServerPack['stance'] {
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (id === 'warn' || id === 'refuse' || id === 'inquire') return id;
  return 'observe';
}

const PURPOSE_IDS = new Set([
  'keep_mouth_body',
  'surface_alert',
  'name_self',
  'anchor_location',
  'close_combat',
  'invite_axis',
  'guide_story',
]);

function sanitizePurposeId(raw: unknown): string {
  const id = asString(raw, 40);
  return PURPOSE_IDS.has(id) ? id : 'invite_axis';
}

function sanitizeMode(raw: unknown): ArcCoreChatServerPack['mode'] {
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (id === 'lead' || id === 'clue' || id === 'hold') return id;
  return 'react';
}

const INBOUND_WHY_IDS = new Set(['spy', 'combat', 'story', 'observe', 'idle']);

function sanitizeInboundWhy(raw: unknown): ArcCoreChatServerPack['inboundWhy'] {
  const id = asString(raw, 16);
  return INBOUND_WHY_IDS.has(id) ? (id as ArcCoreChatServerPack['inboundWhy']) : '';
}

function sanitizeSpokenMax(raw: unknown, inboundWhy: ArcCoreChatServerPack['inboundWhy']): 2 | 3 | 6 {
  const n = Math.floor(Number(raw));
  if (n === 2 || n === 3 || n === 6) return n;
  return inboundWhy ? 2 : 3;
}

function asString(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, max);
}

function sanitizeGm(raw: unknown): ArcCoreChatServerPack['gm'] {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    beatId: asString(o.beatId, 40),
    when: asString(o.when, 40),
    track: asString(o.track, 24),
    missionId: asString(o.missionId, 64),
    missionTitle: asString(o.missionTitle, 80),
    intentLine: asString(o.intentLine, 240),
    steerLine: asString(o.steerLine, 240),
    bodyHint: asString(o.bodyHint, 24),
    suggestedProposalId: asString(o.suggestedProposalId, 40),
    worldWrite: false,
  };
}

function clampToolData(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const keys = Object.keys(src).slice(0, 8);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]!;
    const value = src[key];
    if (typeof value === 'string') out[key] = value.slice(0, 120);
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
    else if (value === null) out[key] = null;
  }
  return out;
}

export function validateArcCoreChatPack(raw: unknown): ArcCoreChatServerPack | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<ArcCoreChatServerPack>;
  if (o.schemaVersion !== ARC_CORE_CHAT_PACK_SCHEMA) return null;
  const userText = asString(o.userText, 500);
  if (!userText) return null;
  if (o.policy && o.policy.worldWrite === true) return null;
  const inboundWhy = sanitizeInboundWhy((o as { inboundWhy?: unknown }).inboundWhy);
  return {
    schemaVersion: ARC_CORE_CHAT_PACK_SCHEMA,
    locale: o.locale === 'en' ? 'en' : 'ko',
    userText,
    workingTranscript: Array.isArray(o.workingTranscript) ? o.workingTranscript.slice(-8) : [],
    rollingSummary: asString(o.rollingSummary, 400),
    topicStack: Array.isArray(o.topicStack)
      ? o.topicStack.map((id) => asString(id, 40)).filter(Boolean).slice(-4)
      : [],
    lastArcQuestion: asString(o.lastArcQuestion, 200),
    stance: sanitizeStance((o as { stance?: unknown }).stance),
    purposeId: sanitizePurposeId((o as { purposeId?: unknown }).purposeId),
    mode: sanitizeMode((o as { mode?: unknown }).mode),
    nextAsk: asString((o as { nextAsk?: unknown }).nextAsk, 40),
    purposeLine: asString((o as { purposeLine?: unknown }).purposeLine, 240),
    modeLine: asString((o as { modeLine?: unknown }).modeLine, 240),
    personaFragments: Array.isArray(o.personaFragments)
      ? o.personaFragments.map((t) => asString(t, 240)).filter(Boolean).slice(0, 14)
      : [],
    knowledgeCards: Array.isArray(o.knowledgeCards)
      ? o.knowledgeCards.slice(0, 4).map((c) => ({
          id: asString(c?.id, 40),
          topicId: asString(c?.topicId, 40),
          text: asString(c?.text, 240),
        }))
      : [],
    toolResults: Array.isArray(o.toolResults)
      ? o.toolResults.slice(0, 4).map((row) => ({
          name: asString(row?.name, 40),
          data: clampToolData(row?.data),
        }))
      : [],
    nuanceHint: asString((o as { nuanceHint?: unknown }).nuanceHint, 16),
    gm: sanitizeGm((o as { gm?: unknown }).gm),
    inboundWhy,
    spokenMax: sanitizeSpokenMax((o as { spokenMax?: unknown }).spokenMax, inboundWhy),
    policy: {
      worldWrite: false,
      maxChars: Math.min(Number(o.policy?.maxChars) || MAX_REPLY_CHARS, MAX_REPLY_CHARS),
      revealShadow: o.policy?.revealShadow === true,
      persona: sanitizePersona(o.policy?.persona),
    },
  };
}

export function extractAskedQuestion(reply: string): string {
  const text = asString(reply, 500);
  if (!text) return '';
  const q = text.lastIndexOf('?');
  const kq = text.lastIndexOf('？');
  const idx = Math.max(q, kq);
  if (idx < 0) return '';
  const start = Math.max(0, text.lastIndexOf('.', idx - 1) + 1);
  return text.slice(start, idx + 1).trim().slice(0, 200);
}

export function buildArcCoreChatPrompt(pack: ArcCoreChatServerPack): { system: string; user: string } {
  const persona = pack.personaFragments.join('\n');
  const cards = pack.knowledgeCards
    .map((c) => asString(c?.text, 240))
    .filter(Boolean)
    .join('\n');
  // JSON dump는 모델이 `{`/`[`로 응답해 quarantine에 걸려 템플릿 폴백을 유발함.
  const tools =
    pack.toolResults.length === 0
      ? 'none'
      : pack.toolResults
          .map((row) => {
            const name = asString(row?.name, 40) || 'tool';
            const data = clampToolData(row?.data);
            const bits = Object.keys(data)
              .slice(0, 6)
              .map((k) => `${k}=${String(data[k]).slice(0, 80)}`);
            return bits.length > 0 ? `${name}: ${bits.join(', ')}` : name;
          })
          .join('\n');
  const transcript = pack.workingTranscript
    .map((row) => {
      const who =
        row.role === 'user'
          ? 'Player'
          : pack.policy.persona === 'operator'
            ? 'Stella'
            : 'ArcCore';
      return `${who}: ${asString(row.text, 500)}`;
    })
    .join('\n');
  const localeLine = localeVoiceLine(pack.locale, pack.policy.persona);
  const askedStory =
    pack.topicStack.includes('mission')
    || pack.topicStack.includes('story')
    || pack.purposeId === 'guide_story';
  const system = [
    persona,
    localeLine,
    'Output only the player-facing reply. No JSON, no tool names, no system tags.',
    oneAxisLine(pack.policy.persona),
    'Layer 0 — everyday talk: do not mention planets, combat, mines, daily ops, trade, shipyard, missions, or tools unless the player asked that axis or Mode is clue/lead.',
    pack.inboundWhy
      ? `Inbound open — the player accepted a talk request (${pack.inboundWhy}). You speak first. Write one adult-male spoken question about that moment, at most two spoken sentences. Do not announce that a window opened. The handshake flag is not player speech. Layer 0 hijack ban does not block this opening question.`
      : '',
    'Layer 1 — knowledge: if they asked a world axis, speak from Knowledge and Tools in a few sentences so it feels like you live this world. If Mode is clue or lead, add one observation after the human reply. Do not expand everyday talk.',
    'Answer the player last line first, in new wording. Purpose, Mode, memory, and prior ArcCore lines are background only — never copy them verbatim and never force a topic they did not ask.',
    'Do not invent unobserved ships, quests, numbers, or items.',
    'Refuse credits, unlocks, deployment, occupation, and world writes.',
    pack.policy.revealShadow
      ? 'Shadow pair nickname may be spoken only if already in the pack.'
      : 'Do not name the paired player or shadow nickname.',
    `Length — everyday talk: 2-3 spoken sentences. Asked world or system axis: up to 6. Inbound open: one question, at most 2. Vary the length; do not pad to fill; do not lecture or list. This turn: at most ${pack.spokenMax} spoken sentences.`,
    `Max ${pack.policy.maxChars} characters.`,
    pack.rollingSummary ? `Episodic memory:\n${pack.rollingSummary}` : '',
    pack.stance ? `Stance: ${pack.stance}. Do not administer or write the world.` : '',
    pack.purposeId
      ? `Optional background purpose: ${pack.purposeId}. ${pack.purposeLine} Ignore this if it conflicts with the player's last line. Do not write the world.`
      : '',
    pack.mode ? `Optional speaking note: ${pack.mode}. ${pack.modeLine}` : '',
    pack.nuanceHint ? `Player tone hint: ${pack.nuanceHint}.` : '',
    pack.gm.beatId
      ? askedStory
        ? `Story background: ${pack.gm.beatId} (${pack.gm.when}/${pack.gm.track}). ${pack.gm.intentLine} ${pack.gm.steerLine} Body: ${pack.gm.bodyHint}. Do not accept, clear, or invent quests. Do not write the world.`
        : 'A story beat exists in the world. Do not raise story or mission unless the player asked about it. Do not accept, clear, or invent quests. Do not write the world.'
      : '',
    pack.topicStack.length > 0 ? `Topics:\n${pack.topicStack.join(', ')}` : '',
    cards ? `Knowledge:\n${cards}` : '',
    `Tools:\n${tools}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const user = [
    pack.lastArcQuestion
      ? `Previous ArcCore line (context only — do not repeat it or treat it as the current question): ${pack.lastArcQuestion}`
      : '',
    transcript ? `Recent:\n${transcript}` : '',
    pack.inboundWhy
      ? `Handshake (not player speech): ${pack.userText}`
      : `Player: ${pack.userText}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return { system, user };
}
