'use strict';
/**
 * 김팀장 채팅이 커서에 부담이 되면 한 번만 고지하고 인수 파일을 남긴다.
 * 매 프롬프트 주입 금지(2026-10-04 보고 반복 회귀). 새 채팅 창은 훅이 열 수 없다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const STATE_PATH = path.join(ROOT, '.cursor', 'session-burden-state.json');
const HANDOFF_PATH = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'SESSION_BURDEN_HANDOFF.md');
const ACK_PATH = path.join(ROOT, '.cursor', 'session-burden-resume.ack');

const WARN_BYTES = Math.floor(1.5 * 1024 * 1024);
const HARD_BYTES = 4 * 1024 * 1024;
const HARD_STEP_BYTES = 4 * 1024 * 1024;
const COMPACT_DEBOUNCE_MS = 20 * 60 * 1000;
const HANDOFF_FRESH_MS = 72 * 60 * 60 * 1000;

const USER_NOTICE =
  '[세션 부담] 이 김팀장 채팅이 커서에 부담이 됩니다. 새 채팅을 여시고 첫 줄에 「김팀장 세션 이어가기」라고 보내 주세요. 이 창을 자동으로 바꾸지는 못합니다.';

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (!raw || !raw.trim()) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function conversationId(input) {
  const id = input && (input.conversation_id || input.session_id);
  return typeof id === 'string' && id.trim() ? id.trim() : '';
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { conversations: {} };
  }
}

function saveState(state) {
  const conversations = state.conversations && typeof state.conversations === 'object' ? state.conversations : {};
  const ids = Object.keys(conversations);
  if (ids.length > 24) {
    ids.sort((a, b) => (conversations[a].lastNoticeAt || 0) - (conversations[b].lastNoticeAt || 0));
    for (const id of ids.slice(0, ids.length - 24)) delete conversations[id];
  }
  state.conversations = conversations;
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state));
}

function transcriptBytes(input) {
  const transcriptPath = input && input.transcript_path;
  if (typeof transcriptPath !== 'string' || !transcriptPath.trim()) return 0;
  try {
    return fs.statSync(transcriptPath).size;
  } catch {
    return 0;
  }
}

function bucketForBytes(bytes) {
  if (bytes < WARN_BYTES) return { level: 'ok', bucket: 0 };
  if (bytes < HARD_BYTES) return { level: 'warn', bucket: 1 };
  const steps = Math.floor((bytes - HARD_BYTES) / HARD_STEP_BYTES);
  return { level: 'hard', bucket: 2 + steps };
}

function clipPrompt(input) {
  const prompt = input && typeof input.prompt === 'string' ? input.prompt : '';
  return prompt.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function writeHandoff(snapshot) {
  const lines = [
    '# 세션 부담 인수',
    '',
    '> 훅이 씀. 새 김팀장 채팅 첫 메시지: `김팀장 세션 이어가기`',
    '',
    `- 시각: ${snapshot.at}`,
    `- 이유: ${snapshot.reason}`,
    `- 대화 id: ${snapshot.conversationId || '(없음)'}`,
    `- 기록 크기: ${snapshot.bytes} bytes`,
    snapshot.contextUsage != null ? `- 컨텍스트 사용: ${snapshot.contextUsage}%` : '',
    snapshot.messageCount != null ? `- 메시지 수: ${snapshot.messageCount}` : '',
    snapshot.prompt ? `- 직전 입력 앞부분: ${snapshot.prompt}` : '',
    '',
    '이 창은 새 작업을 잇지 않는다. 대표님이 「이 채팅에서 계속」이라고 한 경우만 그 요청을 처리한다.',
    '',
  ].filter(Boolean);
  fs.mkdirSync(path.dirname(HANDOFF_PATH), { recursive: true });
  fs.writeFileSync(HANDOFF_PATH, `${lines.join('\n')}\n`, 'utf8');
}

function handoffFresh() {
  try {
    const st = fs.statSync(HANDOFF_PATH);
    if (Date.now() - st.mtimeMs > HANDOFF_FRESH_MS) return null;
    return st;
  } catch {
    return null;
  }
}

function ackMs() {
  try {
    const n = Number(fs.readFileSync(ACK_PATH, 'utf8').trim());
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function markAck() {
  const handoff = handoffFresh();
  const stamp = handoff ? String(handoff.mtimeMs) : String(Date.now());
  fs.mkdirSync(path.dirname(ACK_PATH), { recursive: true });
  fs.writeFileSync(ACK_PATH, `${stamp}\n`, 'utf8');
}

function agentNotice(reasonLine) {
  return [
    '[session-burden]',
    reasonLine,
    '대표님께 보이는 답의 첫 줄에 아래 고지를 그대로 적어라. 이 턴에서 새 대규모 구현을 시작하지 마라.',
    '대표님이 「이 채팅에서 계속」이라고 하면 그 요청만 처리하고, 같은 버킷 고지를 반복하지 마라.',
    `고지: ${USER_NOTICE}`,
    `인수 파일은 이미 기록됨: ${path.relative(ROOT, HANDOFF_PATH).replace(/\\/g, '/')}`,
  ].join('\n');
}

function noteTranscript(input) {
  const id = conversationId(input);
  const bytes = transcriptBytes(input);
  const sized = bucketForBytes(bytes);
  if (sized.bucket === 0) return null;
  const state = loadState();
  const row = (state.conversations && state.conversations[id]) || {};
  const lastBucket = Number(row.lastBucket) || 0;
  if (lastBucket >= sized.bucket) return null;
  const at = new Date().toISOString();
  state.conversations = state.conversations || {};
  if (id) {
    state.conversations[id] = {
      ...row,
      lastBucket: sized.bucket,
      lastNoticeAt: Date.now(),
    };
  }
  state.handoffConversationId = id;
  const prompt = clipPrompt(input);
  writeHandoff({
    at,
    reason: sized.level === 'hard' ? '대화 기록 상한' : '대화 기록 경고',
    conversationId: id,
    bytes,
    prompt,
  });
  saveState(state);
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return {
    additional_context: agentNotice(`level=${sized.level} transcript=${mb}MB bucket=${sized.bucket}`),
  };
}

function noteCompact(input) {
  const id = conversationId(input);
  const now = Date.now();
  const state = loadState();
  const row = (state.conversations && state.conversations[id]) || {};
  const last = Number(row.lastCompactNoticeAt) || 0;
  const first = input && input.is_first_compaction === true;
  if (!first && last && now - last < COMPACT_DEBOUNCE_MS) return null;
  state.conversations = state.conversations || {};
  if (id) {
    state.conversations[id] = { ...row, lastCompactNoticeAt: now, lastNoticeAt: now };
  }
  state.handoffConversationId = id || state.handoffConversationId || '';
  const bytes = transcriptBytes(input);
  const usage = Number(input && input.context_usage_percent);
  const messages = Number(input && input.message_count);
  writeHandoff({
    at: new Date(now).toISOString(),
    reason: '컨텍스트 압축',
    conversationId: id,
    bytes,
    contextUsage: Number.isFinite(usage) ? usage : null,
    messageCount: Number.isFinite(messages) ? messages : null,
    prompt: clipPrompt(input),
  });
  saveState(state);
  return { user_message: USER_NOTICE };
}

function noteResume(input) {
  const id = conversationId(input);
  const handoff = handoffFresh();
  if (!handoff) return null;
  if (ackMs() >= handoff.mtimeMs) return null;
  const state = loadState();
  if (id && state.handoffConversationId && id === state.handoffConversationId) return null;
  state.conversations = state.conversations || {};
  const row = (id && state.conversations[id]) || {};
  if (row.resumeAnnounced) return null;
  if (id) {
    state.conversations[id] = { ...row, resumeAnnounced: true, lastNoticeAt: Date.now() };
    saveState(state);
  }
  return {
    additional_context: [
      '[session-burden-resume]',
      '이전 김팀장 채팅이 부담 한도를 넘겼다.',
      `인수: ${path.relative(ROOT, HANDOFF_PATH).replace(/\\/g, '/')}`,
      '대표님께 한 줄로 알리고 그 파일의 다음 작업만 이어가라.',
      '알린 뒤 `node tools/kim-team-lead/ack-session-burden.cjs` 를 실행하라.',
    ].join('\n'),
  };
}

module.exports = {
  ACK_PATH,
  HANDOFF_PATH,
  STATE_PATH,
  USER_NOTICE,
  WARN_BYTES,
  HARD_BYTES,
  readStdinJson,
  noteTranscript,
  noteCompact,
  noteResume,
  markAck,
  bucketForBytes,
};
