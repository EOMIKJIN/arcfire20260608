// ============================================================
// 채굴 보상 — playerStore.persist 직렬화·디바운스
// (백그라운드·연속 tick 시 AsyncStorage 중복 쓰기 방지)
// ============================================================

import { AppState } from 'react-native';
import { usePlayerStore } from '../../store/playerStore';

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistChain: Promise<void> = Promise.resolve();

const MINING_PERSIST_DEBOUNCE_MS = 500;

function enqueuePersist(force = false): void {
  persistChain = persistChain
    .then(async () => {
      if (!force && AppState.currentState !== 'active') return;
      await usePlayerStore.getState().persist();
    })
    .catch(() => {});
}

/** 채굴 tick 보상 후 계정 저장 — 짧게 묶어 1회 persist */
export function scheduleMiningPlayerPersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    enqueuePersist(false);
  }, MINING_PERSIST_DEBOUNCE_MS);
}

/** 백그라운드·화면 이탈 직전 — 대기 중인 디바운스를 즉시 flush(앱 상태 무관) */
export function flushMiningPlayerPersist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  enqueuePersist(true);
}
