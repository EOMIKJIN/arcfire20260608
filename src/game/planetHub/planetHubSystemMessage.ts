/**
 * 행성 허브 하단 게이지 슬롯 — 범용 시스템 메시지.
 * persist 없음. 표시는 1줄. 틱/렌더에서 present 금지.
 */
export const PLANET_HUB_SYSTEM_MESSAGE_ID = {
  mining: 'hub_sys_mining',
} as const;

export type PlanetHubSystemMessageTone = 'progress' | 'info';

export type PlanetHubSystemMessage = {
  id: string;
  text: string;
  tone: PlanetHubSystemMessageTone;
};

export type PresentPlanetHubSystemMessageInput = {
  id: string;
  text: string;
  tone?: PlanetHubSystemMessageTone;
  /** 0/생략 = 명시적 clear 까지 유지 */
  ttlMs?: number;
};

type State = {
  message: PlanetHubSystemMessage | null;
};

let state: State = { message: null };
const listeners = new Set<() => void>();
let ttlTimer: ReturnType<typeof setTimeout> | null = null;

function emit(): void {
  listeners.forEach((fn) => fn());
}

function clearTtlTimer(): void {
  if (!ttlTimer) return;
  clearTimeout(ttlTimer);
  ttlTimer = null;
}

function sameMessage(a: PlanetHubSystemMessage | null, b: PlanetHubSystemMessage): boolean {
  return Boolean(a) && a!.id === b.id && a!.text === b.text && a!.tone === b.tone;
}

export function subscribePlanetHubSystemMessage(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getPlanetHubSystemMessage(): PlanetHubSystemMessage | null {
  return state.message;
}

export function presentPlanetHubSystemMessage(input: PresentPlanetHubSystemMessageInput): void {
  const id = input.id.trim();
  const text = input.text.trim();
  if (!id || !text) return;
  const next: PlanetHubSystemMessage = {
    id,
    text,
    tone: input.tone === 'progress' ? 'progress' : 'info',
  };
  clearTtlTimer();
  if (!sameMessage(state.message, next)) {
    state = { message: next };
    emit();
  }
  const ttlMs = input.ttlMs ?? 0;
  if (ttlMs > 0) {
    ttlTimer = setTimeout(() => {
      ttlTimer = null;
      clearPlanetHubSystemMessage(id);
    }, ttlMs);
  }
}

export function clearPlanetHubSystemMessage(id?: string): void {
  if (!state.message) return;
  if (id && state.message.id !== id) return;
  clearTtlTimer();
  state = { message: null };
  emit();
}

/** 테스트·행성 이탈 */
export function resetPlanetHubSystemMessageForTests(): void {
  clearTtlTimer();
  state = { message: null };
  emit();
}
