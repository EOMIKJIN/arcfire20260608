// 대화 전용 판단 기억 — 기존 chat persist 키에만 태움.
// ObservationBus · learning-state · Policy Pack 과 공유 금지.

import { isReservedArcCoreChatWorldProposalId } from './arcCoreChatWorldProposal';

export const ARC_CORE_CHAT_PROPOSAL_COUNT_MAX = 8;

export type ArcCoreChatProposalVerdict = 'accept' | 'refuse';

export type ArcCoreChatProposalCount = {
  id: string;
  accept: number;
  refuse: number;
};

export type ArcCoreChatJudgmentSnapshot = {
  pendingProposalId: string;
  lastAcceptedProposalId: string;
  lastRefusedProposalId: string;
  counts: ArcCoreChatProposalCount[];
};

const EMPTY: ArcCoreChatJudgmentSnapshot = {
  pendingProposalId: '',
  lastAcceptedProposalId: '',
  lastRefusedProposalId: '',
  counts: [],
};

let pendingProposalId = '';
let lastAcceptedProposalId = '';
let lastRefusedProposalId = '';
let counts: ArcCoreChatProposalCount[] = [];

function sanitizeProposalId(raw: string): string {
  const id = String(raw ?? '').trim().slice(0, 32);
  if (!id || !isReservedArcCoreChatWorldProposalId(id)) return '';
  return id;
}

function normalizeCount(raw: unknown): ArcCoreChatProposalCount | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = sanitizeProposalId(typeof o.id === 'string' ? o.id : '');
  if (!id) return null;
  const accept = typeof o.accept === 'number' && Number.isFinite(o.accept) ? Math.max(0, Math.min(99, o.accept)) : 0;
  const refuse = typeof o.refuse === 'number' && Number.isFinite(o.refuse) ? Math.max(0, Math.min(99, o.refuse)) : 0;
  return { id, accept, refuse };
}

export function resetArcCoreChatJudgmentMemory(): void {
  pendingProposalId = '';
  lastAcceptedProposalId = '';
  lastRefusedProposalId = '';
  counts = [];
}

export function parseArcCoreChatJudgmentSnapshot(raw: unknown): ArcCoreChatJudgmentSnapshot {
  if (!raw || typeof raw !== 'object') return { ...EMPTY, counts: [] };
  const o = raw as Record<string, unknown>;
  const next: ArcCoreChatProposalCount[] = [];
  if (Array.isArray(o.counts)) {
    for (let i = 0; i < o.counts.length && next.length < ARC_CORE_CHAT_PROPOSAL_COUNT_MAX; i += 1) {
      const row = normalizeCount(o.counts[i]);
      if (row) next.push(row);
    }
  }
  return {
    pendingProposalId: sanitizeProposalId(typeof o.pendingProposalId === 'string' ? o.pendingProposalId : ''),
    lastAcceptedProposalId: sanitizeProposalId(
      typeof o.lastAcceptedProposalId === 'string' ? o.lastAcceptedProposalId : '',
    ),
    lastRefusedProposalId: sanitizeProposalId(
      typeof o.lastRefusedProposalId === 'string' ? o.lastRefusedProposalId : '',
    ),
    counts: next,
  };
}

export function hydrateArcCoreChatJudgmentMemory(raw: unknown): void {
  const parsed = parseArcCoreChatJudgmentSnapshot(raw);
  pendingProposalId = parsed.pendingProposalId;
  lastAcceptedProposalId = parsed.lastAcceptedProposalId;
  lastRefusedProposalId = parsed.lastRefusedProposalId;
  counts = parsed.counts.slice();
}

export function snapshotArcCoreChatJudgmentMemory(): ArcCoreChatJudgmentSnapshot {
  return {
    pendingProposalId,
    lastAcceptedProposalId,
    lastRefusedProposalId,
    counts: counts.slice(0, ARC_CORE_CHAT_PROPOSAL_COUNT_MAX),
  };
}

export function getArcCoreChatPendingProposalId(): string {
  return pendingProposalId;
}

export function getArcCoreChatLastAcceptedProposalId(): string {
  return lastAcceptedProposalId;
}

export function getArcCoreChatLastRefusedProposalId(): string {
  return lastRefusedProposalId;
}

export function setArcCoreChatPendingProposalId(rawId: string): void {
  pendingProposalId = sanitizeProposalId(rawId);
}

function upsertCount(id: string, verdict: ArcCoreChatProposalVerdict): void {
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i]!.id === id) {
      if (verdict === 'accept') counts[i]!.accept += 1;
      else counts[i]!.refuse += 1;
      return;
    }
  }
  if (counts.length >= ARC_CORE_CHAT_PROPOSAL_COUNT_MAX) counts.shift();
  counts.push({
    id,
    accept: verdict === 'accept' ? 1 : 0,
    refuse: verdict === 'refuse' ? 1 : 0,
  });
}

export function recordArcCoreChatProposalDecision(
  rawId: string,
  verdict: ArcCoreChatProposalVerdict,
): void {
  const id = sanitizeProposalId(rawId);
  if (!id) return;
  upsertCount(id, verdict);
  if (verdict === 'accept') lastAcceptedProposalId = id;
  else lastRefusedProposalId = id;
  if (pendingProposalId === id) pendingProposalId = '';
}

const ACCEPT_RE = /^(응|그래|열어|열어줘|열자|좋아|yes|ok|okay)$/i;
const REFUSE_RE = /^(아니|나중에|됐어|싫어|no|later)$/i;

export function classifyArcCoreChatProposalReply(userText: string): ArcCoreChatProposalVerdict | null {
  const text = userText.trim();
  if (!text || text.length > 16) return null;
  if (ACCEPT_RE.test(text)) return 'accept';
  if (REFUSE_RE.test(text)) return 'refuse';
  return null;
}
