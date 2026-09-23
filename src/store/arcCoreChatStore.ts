// ============================================================
// 아크코어 백채널 채팅 — 계정 귀속 · 40건 FIFO · 전송 후 persist
// 틱/키입력 persist 금지. 부트 동기 hydrate 금지.
// 화면은 sessionMessages (오픈마다 인사 1줄). archive(messages)는
// 「최근항목」 추후 로드용 — 오픈 시 화면에 올리지 않음.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  getArcCoreChatLastQuestion,
  getArcCoreChatRollingSummary,
  hydrateArcCoreChatLastQuestion,
  hydrateArcCoreChatRollingSummary,
  resetArcCoreChatDialogueState,
} from '../arcCore/chat/arcCoreChatDialogueState';
import { clampArcCoreChatRollingSummary } from '../arcCore/chat/arcCoreChatRollingSummary';
import { resetArcCoreChatCloudSkip } from '../arcCore/chat/arcCoreChatCloudSkip';
import { resetArcCoreInboundTalkSchedule } from '../arcCore/chat/arcCoreInboundTalkSchedule';
import {
  hydrateArcCoreChatJudgmentMemory,
  parseArcCoreChatJudgmentSnapshot,
  resetArcCoreChatJudgmentMemory,
  snapshotArcCoreChatJudgmentMemory,
} from '../arcCore/chat/arcCoreChatJudgmentMemory';
import { canCommitArcCoreChatDiskWrite } from './arcCoreChatPersistGuard';
import type { NlMouthId } from '../game/conversation/conversationGateContract';
import { getDefaultNlMouthId } from '../arcCore/chat/arcCoreChatTableIndex';
import {
  hydrateStellaLifeMemory,
  resetStellaLifeMemory,
  snapshotStellaLifeMemory,
} from '../arcCore/chat/stellaLifeMemory';
import {
  clampStellaLifeSnapshotToMaxBytes,
  isStellaLifeSnapshotEmpty,
  parseStellaLifeSnapshot,
} from '../arcCore/chat/stellaLifeSnapshot';
import type { StellaLifeSnapshot } from '../arcCore/chat/stellaLifeTypes';

export const ARC_CORE_CHAT_STORAGE_KEY = 'arcfire_arc_core_chat_v1';
export const ARC_CORE_CHAT_MAX_MESSAGES = 40;
export const ARC_CORE_CHAT_MAX_TEXT = 1200;
export const ARC_CORE_CHAT_MAX_LAST_FIRED = 16;
const PERSIST_COALESCE_MS = 1500;
const SCHEMA_VERSION = 5;

export type ArcCoreChatRole = 'user' | 'arc' | 'system';

export type ArcCoreChatMessage = {
  id: string;
  role: ArcCoreChatRole;
  text: string;
  atMs: number;
  reason?: string;
  /** 구세이브 없음 → 표시는 근원체 */
  speakerId?: NlMouthId;
};

export type ArcCoreChatLastFired = {
  key: string;
  id: string;
  atMs: number;
};

export type ArcCoreChatPayload = {
  schemaVersion: number;
  updatedAtMs: number;
  messages: ArcCoreChatMessage[];
  lastFired: ArcCoreChatLastFired[];
  rollingSummary: string;
  lastArcQuestion: string;
  judgment: ReturnType<typeof snapshotArcCoreChatJudgmentMemory>;
  activeSpeakerId: NlMouthId;
  operatorIntroPlayed: boolean;
  life: StellaLifeSnapshot;
};

const EMPTY_PAYLOAD: ArcCoreChatPayload = {
  schemaVersion: SCHEMA_VERSION,
  updatedAtMs: 0,
  messages: [],
  lastFired: [],
  rollingSummary: '',
  lastArcQuestion: '',
  judgment: {
    pendingProposalId: '',
    lastAcceptedProposalId: '',
    lastRefusedProposalId: '',
    counts: [],
  },
  activeSpeakerId: 'operator',
  operatorIntroPlayed: false,
  life: parseStellaLifeSnapshot(undefined),
};

const ROLE_OK: ReadonlySet<string> = new Set(['user', 'arc', 'system']);

export const ARC_CORE_CHAT_SESSION_WELCOME_REASON = 'session_welcome';
export const ARC_CORE_CHAT_SESSION_WELCOME_BACK_REASON = 'session_welcome_back';

const SESSION_OPENER_REASONS: ReadonlySet<string> = new Set([
  ARC_CORE_CHAT_SESSION_WELCOME_REASON,
  ARC_CORE_CHAT_SESSION_WELCOME_BACK_REASON,
]);

export function isArcCoreChatSessionOpenerReason(reason: string | undefined): boolean {
  return typeof reason === 'string' && SESSION_OPENER_REASONS.has(reason);
}

/** 이전 대화가 있으면 재방문 인사. 유저 줄만 본다. */
export function hasArchivedArcCoreChatConversation(
  messages: readonly ArcCoreChatMessage[],
): boolean {
  for (let i = 0; i < messages.length; i += 1) {
    if (messages[i]?.role === 'user') return true;
  }
  return false;
}

/** 회신 문맥에서 세션 인사·방금 보낸 유저 줄을 뺀다. */
export function filterArcCoreChatReplyPrior(
  messages: readonly ArcCoreChatMessage[],
): Array<{ role: ArcCoreChatRole; text: string }> {
  const out: Array<{ role: ArcCoreChatRole; text: string }> = [];
  for (let i = 0; i < messages.length; i += 1) {
    const row = messages[i];
    if (!row || isArcCoreChatSessionOpenerReason(row.reason)) continue;
    out.push({ role: row.role, text: row.text });
  }
  return out;
}

export function clampArcCoreChatText(text: string): string {
  const raw = String(text ?? '');
  if (raw.length <= ARC_CORE_CHAT_MAX_TEXT) return raw;
  return raw.slice(0, ARC_CORE_CHAT_MAX_TEXT);
}

function makeMessageId(atMs: number, role: string): string {
  return `${atMs}_${role}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMessage(raw: unknown): ArcCoreChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const role = typeof o.role === 'string' && ROLE_OK.has(o.role) ? (o.role as ArcCoreChatRole) : null;
  if (!role) return null;
  const text = clampArcCoreChatText(typeof o.text === 'string' ? o.text : '');
  if (!text) return null;
  const atMs = typeof o.atMs === 'number' && Number.isFinite(o.atMs) ? o.atMs : Date.now();
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : makeMessageId(atMs, role);
  const reason = typeof o.reason === 'string' && o.reason.trim() ? o.reason.trim() : undefined;
  const speakerRaw = typeof o.speakerId === 'string' ? o.speakerId.trim() : '';
  const speakerId: NlMouthId | undefined =
    speakerRaw === 'operator' || speakerRaw === 'arc_core' ? speakerRaw : undefined;
  return { id, role, text, atMs, reason, speakerId };
}

function normalizeLastFired(raw: unknown): ArcCoreChatLastFired | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const key = typeof o.key === 'string' ? o.key.trim() : '';
  const id = typeof o.id === 'string' ? o.id.trim() : '';
  if (!key || !id) return null;
  const atMs = typeof o.atMs === 'number' && Number.isFinite(o.atMs) ? o.atMs : Date.now();
  return { key, id, atMs };
}

export function normalizeArcCoreChatPayload(raw: unknown): ArcCoreChatPayload {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PAYLOAD };
  const o = raw as Record<string, unknown>;
  const messages = Array.isArray(o.messages)
    ? o.messages.map(normalizeMessage).filter((m): m is ArcCoreChatMessage => m != null)
    : [];
  const lastFired = Array.isArray(o.lastFired)
    ? o.lastFired.map(normalizeLastFired).filter((m): m is ArcCoreChatLastFired => m != null)
    : [];
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAtMs: typeof o.updatedAtMs === 'number' && Number.isFinite(o.updatedAtMs) ? o.updatedAtMs : 0,
    messages: messages.slice(-ARC_CORE_CHAT_MAX_MESSAGES),
    lastFired: lastFired.slice(-ARC_CORE_CHAT_MAX_LAST_FIRED),
    rollingSummary: clampArcCoreChatRollingSummary(
      typeof o.rollingSummary === 'string' ? o.rollingSummary : '',
    ),
    lastArcQuestion:
      typeof o.lastArcQuestion === 'string' ? o.lastArcQuestion.trim().slice(0, 200) : '',
    judgment: parseArcCoreChatJudgmentSnapshot(o.judgment),
    activeSpeakerId:
      o.activeSpeakerId === 'arc_core' || o.activeSpeakerId === 'operator'
        ? o.activeSpeakerId
        : getDefaultNlMouthId(),
    operatorIntroPlayed: o.operatorIntroPlayed === true,
    life: parseStellaLifeSnapshot(o.life),
  };
}

type ArcCoreChatState = {
  hydrated: boolean;
  messages: ArcCoreChatMessage[];
  sessionMessages: ArcCoreChatMessage[];
  lastFired: ArcCoreChatLastFired[];
  activeSpeakerId: NlMouthId;
  operatorIntroPlayed: boolean;
  originHold: boolean;
  restoreOperatorOnNextSend: boolean;
  hydrate: () => Promise<void>;
  ensureHydrated: () => Promise<void>;
  persist: () => Promise<void>;
  beginFreshSession: (input: {
    text: string;
    reason: string;
    speakerId?: NlMouthId;
  }) => ArcCoreChatMessage | null;
  appendSessionOnly: (input: {
    role: ArcCoreChatRole;
    text: string;
    reason?: string;
    speakerId?: NlMouthId;
  }) => ArcCoreChatMessage | null;
  appendMessage: (input: {
    role: ArcCoreChatRole;
    text: string;
    reason?: string;
    speakerId?: NlMouthId;
  }) => ArcCoreChatMessage | null;
  setActiveSpeakerId: (speakerId: NlMouthId) => void;
  markOperatorIntroPlayed: () => void;
  setOriginHold: (hold: boolean) => void;
  setRestoreOperatorOnNextSend: (next: boolean) => void;
  consumeRestoreOperatorOnNextSend: () => boolean;
  markTriggerFired: (key: string, id: string) => void;
  wasTriggerFired: (key: string, id: string) => boolean;
  touchPersist: () => void;
  resetLocal: () => Promise<void>;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let hydratePromise: Promise<void> | null = null;
let storeEpoch = 0;
let resetInFlight = false;

function snapshotPersistPayload(
  messages: ArcCoreChatMessage[],
  lastFired: ArcCoreChatLastFired[],
  activeSpeakerId: NlMouthId,
  operatorIntroPlayed: boolean,
): ArcCoreChatPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAtMs: Date.now(),
    messages: messages.slice(-ARC_CORE_CHAT_MAX_MESSAGES),
    lastFired: lastFired.slice(-ARC_CORE_CHAT_MAX_LAST_FIRED),
    rollingSummary: getArcCoreChatRollingSummary(),
    activeSpeakerId,
    operatorIntroPlayed,
    lastArcQuestion: getArcCoreChatLastQuestion(),
    judgment: snapshotArcCoreChatJudgmentMemory(),
    life: clampStellaLifeSnapshotToMaxBytes(snapshotStellaLifeMemory()),
  };
}

async function writePersistPayload(payload: ArcCoreChatPayload): Promise<void> {
  const empty =
    payload.messages.length === 0
    && payload.lastFired.length === 0
    && !payload.rollingSummary
    && !payload.lastArcQuestion
    && !payload.judgment.pendingProposalId
    && !payload.judgment.lastAcceptedProposalId
    && !payload.judgment.lastRefusedProposalId
    && payload.judgment.counts.length === 0
    && !payload.operatorIntroPlayed
    && isStellaLifeSnapshotEmpty(payload.life);
  if (empty) {
    await AsyncStorage.removeItem(ARC_CORE_CHAT_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(ARC_CORE_CHAT_STORAGE_KEY, JSON.stringify(payload));
}

function schedulePersist(persist: () => Promise<void>): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persist();
  }, PERSIST_COALESCE_MS);
}

function makeChatMessage(
  input: { role: ArcCoreChatRole; text: string; reason?: string; speakerId?: NlMouthId },
): ArcCoreChatMessage | null {
  const text = clampArcCoreChatText(input.text);
  if (!text) return null;
  const atMs = Date.now();
  return {
    id: makeMessageId(atMs, input.role),
    role: input.role,
    text,
    atMs,
    reason: input.reason,
    speakerId: input.role === 'arc' ? input.speakerId : undefined,
  };
}

export const useArcCoreChatStore = create<ArcCoreChatState>((set, get) => ({
  hydrated: false,
  messages: [],
  sessionMessages: [],
  lastFired: [],
  activeSpeakerId: 'operator',
  operatorIntroPlayed: false,
  originHold: false,
  restoreOperatorOnNextSend: false,

  hydrate: async () => {
    const epoch = storeEpoch;
    if (!canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
    try {
      const raw = await AsyncStorage.getItem(ARC_CORE_CHAT_STORAGE_KEY);
      if (!canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
      if (!raw) {
        hydrateArcCoreChatRollingSummary('');
        hydrateArcCoreChatLastQuestion('');
        resetArcCoreChatJudgmentMemory();
        resetStellaLifeMemory();
        set({
          hydrated: true,
          messages: [],
          lastFired: [],
          activeSpeakerId: getDefaultNlMouthId(),
          operatorIntroPlayed: false,
        });
        return;
      }
      const parsed = normalizeArcCoreChatPayload(JSON.parse(raw));
      if (!canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
      hydrateArcCoreChatRollingSummary(parsed.rollingSummary);
      hydrateArcCoreChatLastQuestion(parsed.lastArcQuestion);
      hydrateArcCoreChatJudgmentMemory(parsed.judgment);
      hydrateStellaLifeMemory(parsed.life);
      set({
        hydrated: true,
        messages: parsed.messages,
        lastFired: parsed.lastFired,
        activeSpeakerId: parsed.activeSpeakerId,
        operatorIntroPlayed: parsed.operatorIntroPlayed,
      });
    } catch {
      if (!canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
      hydrateArcCoreChatRollingSummary('');
      hydrateArcCoreChatLastQuestion('');
      resetArcCoreChatJudgmentMemory();
      resetStellaLifeMemory();
      set({
        hydrated: true,
        messages: [],
        lastFired: [],
        activeSpeakerId: getDefaultNlMouthId(),
        operatorIntroPlayed: false,
      });
    }
  },

  ensureHydrated: () => {
    if (get().hydrated) return Promise.resolve();
    if (!hydratePromise) {
      hydratePromise = get()
        .hydrate()
        .finally(() => {
          hydratePromise = null;
        });
    }
    return hydratePromise;
  },

  persist: async () => {
    const epoch = storeEpoch;
    if (!canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
    const s = get();
    const payload = snapshotPersistPayload(
      s.messages,
      s.lastFired,
      s.activeSpeakerId,
      s.operatorIntroPlayed,
    );
    if (!canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
    try {
      await writePersistPayload(payload);
    } catch {
      /* ignore */
    }
    if (canCommitArcCoreChatDiskWrite(epoch, storeEpoch, resetInFlight)) return;
    if (resetInFlight) {
      try {
        await AsyncStorage.removeItem(ARC_CORE_CHAT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    const repairEpoch = storeEpoch;
    const live = get();
    const repair = snapshotPersistPayload(
      live.messages,
      live.lastFired,
      live.activeSpeakerId,
      live.operatorIntroPlayed,
    );
    if (!canCommitArcCoreChatDiskWrite(repairEpoch, storeEpoch, resetInFlight)) return;
    try {
      await writePersistPayload(repair);
    } catch {
      /* ignore */
    }
  },

  beginFreshSession: (input) => {
    resetArcCoreChatDialogueState({ keepMemory: true });
    const next = makeChatMessage({
      role: 'arc',
      text: input.text,
      reason: input.reason,
      speakerId: input.speakerId,
    });
    set({ sessionMessages: next ? [next] : [] });
    return next;
  },

  setActiveSpeakerId: (speakerId) => {
    if (speakerId !== 'operator' && speakerId !== 'arc_core') return;
    set({ activeSpeakerId: speakerId, restoreOperatorOnNextSend: false });
  },

  markOperatorIntroPlayed: () => {
    set({ operatorIntroPlayed: true });
    schedulePersist(() => get().persist());
  },

  setOriginHold: (hold) => {
    set({ originHold: hold });
  },

  setRestoreOperatorOnNextSend: (next) => {
    set({ restoreOperatorOnNextSend: next });
  },

  consumeRestoreOperatorOnNextSend: () => {
    if (!get().restoreOperatorOnNextSend) return false;
    set({ restoreOperatorOnNextSend: false, activeSpeakerId: 'operator' });
    return true;
  },

  appendSessionOnly: (input) => {
    const next = makeChatMessage(input);
    if (!next) return null;
    set((s) => ({
      sessionMessages: [...s.sessionMessages, next].slice(-ARC_CORE_CHAT_MAX_MESSAGES),
    }));
    return next;
  },

  appendMessage: (input) => {
    const next = makeChatMessage(input);
    if (!next) return null;
    set((s) => ({
      messages: [...s.messages, next].slice(-ARC_CORE_CHAT_MAX_MESSAGES),
      sessionMessages: [...s.sessionMessages, next].slice(-ARC_CORE_CHAT_MAX_MESSAGES),
    }));
    schedulePersist(() => get().persist());
    return next;
  },

  markTriggerFired: (key, id) => {
    const k = key.trim();
    const i = id.trim();
    if (!k || !i) return;
    const atMs = Date.now();
    set((s) => {
      const filtered = s.lastFired.filter((row) => !(row.key === k && row.id === i));
      return {
        lastFired: [...filtered, { key: k, id: i, atMs }].slice(-ARC_CORE_CHAT_MAX_LAST_FIRED),
      };
    });
    schedulePersist(() => get().persist());
  },

  wasTriggerFired: (key, id) => {
    const k = key.trim();
    const i = id.trim();
    if (!k || !i) return false;
    return get().lastFired.some((row) => row.key === k && row.id === i);
  },

  touchPersist: () => {
    schedulePersist(() => get().persist());
  },

  resetLocal: async () => {
    resetArcCoreChatDialogueState();
    resetArcCoreChatJudgmentMemory();
    resetStellaLifeMemory();
    resetInFlight = true;
    storeEpoch += 1;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    hydratePromise = null;
    set({
      hydrated: true,
      messages: [],
      sessionMessages: [],
      lastFired: [],
      activeSpeakerId: 'operator',
      operatorIntroPlayed: false,
      originHold: false,
      restoreOperatorOnNextSend: false,
    });
    try {
      await AsyncStorage.removeItem(ARC_CORE_CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    } finally {
      resetInFlight = false;
    }
  },
}));

export async function resetArcCoreChatForAccountPurge(): Promise<void> {
  resetArcCoreChatCloudSkip();
  resetArcCoreInboundTalkSchedule();
  const { clearStellaQuestTalkMemory } = require('../arcCore/chat/stellaQuestTalkMemory') as typeof import('../arcCore/chat/stellaQuestTalkMemory');
  clearStellaQuestTalkMemory();
  await useArcCoreChatStore.getState().resetLocal();
}
