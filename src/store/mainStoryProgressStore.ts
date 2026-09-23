/**
 * 본편 메인스토리 분기 플래그·챕터 엔딩 연출 대기.
 * 계정 귀속 · 클리어/선택 시에만 persist (틱 금지).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export const MAIN_STORY_PROGRESS_STORAGE_KEY = 'arcfire_main_story_progress_v1';
const MAX_FLAGS = 32;
const MAX_SEEN_SCENES = 16;

export type MainStoryProgressState = {
  choiceFlags: Record<string, string>;
  lastCompletedQuestId: string | null;
  pendingChapterEndSceneId: string | null;
  seenChapterEndSceneIds: string[];
  loaded: boolean;
  loadLocal: () => Promise<void>;
  persistLocal: () => Promise<void>;
  resetLocal: () => Promise<void>;
  setChoiceFlag: (key: string, value: string) => boolean;
  recordQuestCompleted: (questId: string, pendingChapterEndSceneId?: string | null) => void;
  markChapterEndSeen: (sceneId: string) => void;
};

type PersistedV1 = {
  v: 1;
  choiceFlags: Record<string, string>;
  lastCompletedQuestId: string | null;
  pendingChapterEndSceneId: string | null;
  seenChapterEndSceneIds: string[];
};

function emptySlice(): Pick<
  MainStoryProgressState,
  'choiceFlags' | 'lastCompletedQuestId' | 'pendingChapterEndSceneId' | 'seenChapterEndSceneIds'
> {
  return {
    choiceFlags: {},
    lastCompletedQuestId: null,
    pendingChapterEndSceneId: null,
    seenChapterEndSceneIds: [],
  };
}

function sanitizeFlags(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_FLAGS) break;
    if (typeof key !== 'string' || !key.trim()) continue;
    if (typeof value !== 'string') continue;
    out[key.trim()] = value.slice(0, 64);
  }
  return out;
}

function sanitizeSeen(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string' || !item.trim()) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= MAX_SEEN_SCENES) break;
  }
  return out;
}

export const useMainStoryProgressStore = create<MainStoryProgressState>((set, get) => ({
  ...emptySlice(),
  loaded: false,

  loadLocal: async () => {
    try {
      const raw = await AsyncStorage.getItem(MAIN_STORY_PROGRESS_STORAGE_KEY);
      if (!raw) {
        set({ ...emptySlice(), loaded: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<PersistedV1>;
      set({
        choiceFlags: sanitizeFlags(parsed.choiceFlags),
        lastCompletedQuestId:
          typeof parsed.lastCompletedQuestId === 'string' ? parsed.lastCompletedQuestId : null,
        pendingChapterEndSceneId:
          typeof parsed.pendingChapterEndSceneId === 'string'
            ? parsed.pendingChapterEndSceneId
            : null,
        seenChapterEndSceneIds: sanitizeSeen(parsed.seenChapterEndSceneIds),
        loaded: true,
      });
    } catch {
      set({ ...emptySlice(), loaded: true });
    }
  },

  persistLocal: async () => {
    const state = get();
    const payload: PersistedV1 = {
      v: 1,
      choiceFlags: state.choiceFlags,
      lastCompletedQuestId: state.lastCompletedQuestId,
      pendingChapterEndSceneId: state.pendingChapterEndSceneId,
      seenChapterEndSceneIds: state.seenChapterEndSceneIds,
    };
    await AsyncStorage.setItem(MAIN_STORY_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
  },

  resetLocal: async () => {
    await AsyncStorage.removeItem(MAIN_STORY_PROGRESS_STORAGE_KEY);
    set({ ...emptySlice(), loaded: true });
  },

  setChoiceFlag: (key, value) => {
    const trimmed = key.trim();
    if (!trimmed) return false;
    const prev = get().choiceFlags;
    if (!(trimmed in prev) && Object.keys(prev).length >= MAX_FLAGS) return false;
    set({ choiceFlags: { ...prev, [trimmed]: value.slice(0, 64) } });
    void get().persistLocal();
    return true;
  },

  recordQuestCompleted: (questId, pendingChapterEndSceneId) => {
    const id = questId.trim();
    if (!id) return;
    set({
      lastCompletedQuestId: id,
      pendingChapterEndSceneId: pendingChapterEndSceneId?.trim() || null,
    });
    void get().persistLocal();
  },

  markChapterEndSeen: (sceneId) => {
    const id = sceneId.trim();
    if (!id) return;
    const prev = get().seenChapterEndSceneIds;
    const nextSeen = prev.includes(id) ? prev : [...prev, id].slice(-MAX_SEEN_SCENES);
    set({
      pendingChapterEndSceneId: get().pendingChapterEndSceneId === id ? null : get().pendingChapterEndSceneId,
      seenChapterEndSceneIds: nextSeen,
    });
    void get().persistLocal();
  },
}));
