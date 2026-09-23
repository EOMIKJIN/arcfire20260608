// 집행 직전 1건 — 이름·행성 id. persist/틱 없음.

import type { ArcCoreChatWorldProposalId } from './arcCoreChatWorldProposal';

export type ArcCoreChatActionPayload = {
  id: ArcCoreChatWorldProposalId;
  attendantId?: string;
  attendantName?: string;
  captainId?: string;
  captainName?: string;
  planetId?: string;
  planetLabel?: string;
};

let payload: ArcCoreChatActionPayload | null = null;

export function setArcCoreChatActionPayload(next: ArcCoreChatActionPayload | null): void {
  payload = next;
}

export function peekArcCoreChatActionPayload(): ArcCoreChatActionPayload | null {
  return payload;
}

export function takeArcCoreChatActionPayload(rawId: string): ArcCoreChatActionPayload | null {
  const id = rawId.trim();
  if (!payload || payload.id !== id) return null;
  const snap = payload;
  payload = null;
  return snap;
}
