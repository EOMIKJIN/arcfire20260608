// ============================================================
// 아크코어 섀도우 정체 — 로컬 캐시 (평행우주 1:1 매칭)
//
// 분류: **ArcCore 세계 축** (faction vault 류) — 플레이어 인터랙티브 진행 아님.
//   계정 초기화(purgeLocalAccountData) 대상 **아님** — 페어 관계는 기기(uid) 기반으로
//   초기화 후에도 유지된다 (대표님 결정 2026-07-13 · 헌법 수정안 §16-A).
//
// persist: 상태 전이(waiting→paired, 공개 1회) 시에만 — 고빈도 기록 없음.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ArcCoreShadowShipSnapshot } from '../arcCore/shadow/arcCoreShadowShipSnapshot';

const STORAGE_KEY = 'arcfire_arc_core_shadow_identity_v1';

export type ArcCoreShadowPairStatus = 'unknown' | 'waiting' | 'paired';

type PersistedShape = {
  selfUid: string;
  status: ArcCoreShadowPairStatus;
  shadowUid: string | null;
  pairedAtMs: number | null;
  shadowNickname: string | null;
  revealedAtMs: number | null;
  /** 짝 유저 기함 스냅샷 — 본진 보스 「복제된 플레이어 전함」 (오프라인 폴백: null → CSV 보스) */
  shadowShipSnapshot: ArcCoreShadowShipSnapshot | null;
};

type ArcCoreShadowIdentityState = PersistedShape & {
  loaded: boolean;
  loadLocal: () => Promise<void>;
  persistLocal: () => Promise<void>;
  markWaiting: (selfUid: string) => void;
  markPaired: (selfUid: string, shadowUid: string, pairedAtMs: number) => void;
  markRevealed: (shadowNickname: string) => void;
  setShadowShipSnapshot: (snapshot: ArcCoreShadowShipSnapshot | null) => void;
  isRevealed: () => boolean;
};

const EMPTY: PersistedShape = {
  selfUid: '',
  status: 'unknown',
  shadowUid: null,
  pairedAtMs: null,
  shadowNickname: null,
  revealedAtMs: null,
  shadowShipSnapshot: null,
};

export const useArcCoreShadowIdentityStore = create<ArcCoreShadowIdentityState>((set, get) => ({
  ...EMPTY,
  loaded: false,

  loadLocal: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ ...EMPTY, loaded: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<PersistedShape>;
      set({
        selfUid: typeof parsed.selfUid === 'string' ? parsed.selfUid : '',
        status:
          parsed.status === 'waiting' || parsed.status === 'paired' ? parsed.status : 'unknown',
        shadowUid: typeof parsed.shadowUid === 'string' && parsed.shadowUid ? parsed.shadowUid : null,
        pairedAtMs: typeof parsed.pairedAtMs === 'number' ? parsed.pairedAtMs : null,
        shadowNickname:
          typeof parsed.shadowNickname === 'string' && parsed.shadowNickname
            ? parsed.shadowNickname
            : null,
        revealedAtMs: typeof parsed.revealedAtMs === 'number' ? parsed.revealedAtMs : null,
        shadowShipSnapshot:
          parsed.shadowShipSnapshot && typeof parsed.shadowShipSnapshot === 'object'
            ? (parsed.shadowShipSnapshot as ArcCoreShadowShipSnapshot)
            : null,
        loaded: true,
      });
    } catch {
      set({ ...EMPTY, loaded: true });
    }
  },

  persistLocal: async () => {
    const s = get();
    const payload: PersistedShape = {
      selfUid: s.selfUid,
      status: s.status,
      shadowUid: s.shadowUid,
      pairedAtMs: s.pairedAtMs,
      shadowNickname: s.shadowNickname,
      revealedAtMs: s.revealedAtMs,
      shadowShipSnapshot: s.shadowShipSnapshot,
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* 디스크 실패 — 다음 상태 전이 시 재시도 */
    }
  },

  markWaiting: (selfUid) => {
    set({ selfUid: selfUid.trim(), status: 'waiting' });
  },

  markPaired: (selfUid, shadowUid, pairedAtMs) => {
    set({
      selfUid: selfUid.trim(),
      status: 'paired',
      shadowUid: shadowUid.trim(),
      pairedAtMs,
    });
  },

  markRevealed: (shadowNickname) => {
    set({ shadowNickname: shadowNickname.trim(), revealedAtMs: Date.now() });
  },

  setShadowShipSnapshot: (snapshot) => {
    set({ shadowShipSnapshot: snapshot });
  },

  isRevealed: () => get().revealedAtMs != null,
}));
