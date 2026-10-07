// 스텔라 판단 기억. 대화 store 기존 키에 실리고, hydrate 뒤에만 디스크에 남는다.
// 상황 수만큼만 자라고 최근 발화는 상황당 3개.

import {
  emptyStellaObserveGateState,
  type StellaObserveGateState,
} from './stellaObserveGate';

const MAX_KEYS = 24;
const MAX_SHOWS = 3;
const MAX_UNREAD = 99;

let state: StellaObserveGateState = emptyStellaObserveGateState();

function finite(raw: unknown, fallback = 0): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

function numMap(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  const keys = Object.keys(raw as object);
  const n = Math.min(keys.length, MAX_KEYS);
  for (let i = 0; i < n; i += 1) {
    const key = keys[i]!;
    if (!key || key.length > 48) continue;
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

function showsMap(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  const keys = Object.keys(raw as object);
  const n = Math.min(keys.length, MAX_KEYS);
  for (let i = 0; i < n; i += 1) {
    const key = keys[i]!;
    if (!key || key.length > 48) continue;
    const value = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(value)) continue;
    const times: number[] = [];
    const m = Math.min(value.length, MAX_SHOWS);
    for (let j = 0; j < m; j += 1) {
      const t = value[j];
      if (typeof t === 'number' && Number.isFinite(t)) times.push(t);
    }
    if (times.length > 0) out[key] = times;
  }
  return out;
}

export function parseStellaObserveGate(raw: unknown): StellaObserveGateState {
  const base = emptyStellaObserveGateState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  base.day = finite(o.day);
  base.count = Math.max(0, Math.min(99, finite(o.count)));
  base.lastAtMs = Math.max(0, finite(o.lastAtMs));
  base.globalIgn = Math.max(0, finite(o.globalIgn));
  base.globalIgnAt = Math.max(0, finite(o.globalIgnAt));
  base.shownAt = numMap(o.shownAt);
  base.recentShows = showsMap(o.recentShows);
  base.saidIntensity = numMap(o.saidIntensity);
  base.ign = numMap(o.ign);
  base.ignAt = numMap(o.ignAt);
  base.announcedFirsts = Math.max(0, finite(o.announcedFirsts));
  base.lastLevelMark = Math.max(0, finite(o.lastLevelMark));
  base.lastHubAtMs = Math.max(0, finite(o.lastHubAtMs));
  base.lastReadAtMs = Math.max(0, finite(o.lastReadAtMs));
  base.unread = Math.max(0, Math.min(MAX_UNREAD, Math.round(finite(o.unread))));
  base.notifiedAtMs = Math.max(0, finite(o.notifiedAtMs));
  return base;
}

export function isStellaObserveGateEmpty(gate: StellaObserveGateState): boolean {
  return gate.lastAtMs <= 0
    && gate.lastHubAtMs <= 0
    && gate.lastReadAtMs <= 0
    && gate.unread <= 0
    && gate.notifiedAtMs <= 0
    && gate.count <= 0
    && Object.keys(gate.shownAt).length === 0;
}

export function readStellaObserveGate(): StellaObserveGateState {
  return state;
}

export function hydrateStellaObserveGate(raw: unknown): void {
  state = parseStellaObserveGate(raw);
}

export function resetStellaObserveGate(): void {
  state = emptyStellaObserveGateState();
}

export function exportStellaObserveGate(): StellaObserveGateState {
  return parseStellaObserveGate(state);
}

const hubTalkBadgeListeners = new Set<() => void>();

/** 안 읽은 스텔라 메시지가 생기거나 읽히면 [대화] 붉은 점을 다시 본다. 틱에서는 부르지 않는다. */
export function touchStellaHubTalkBadge(): void {
  hubTalkBadgeListeners.forEach((fn) => {
    fn();
  });
}

export function subscribeStellaHubTalkBadge(fn: () => void): () => void {
  hubTalkBadgeListeners.add(fn);
  return () => {
    hubTalkBadgeListeners.delete(fn);
  };
}

/** 메신저를 연 순간. 읽은 것은 무시가 아니다. */
export function markStellaReachRead(nowMs: number): void {
  state.unread = 0;
  state.lastReadAtMs = nowMs;
  touchStellaHubTalkBadge();
}

export function markStellaMessageNotified(nowMs: number): void {
  state.notifiedAtMs = nowMs;
}
