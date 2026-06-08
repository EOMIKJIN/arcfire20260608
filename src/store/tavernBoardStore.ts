import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';

const STORAGE_KEY = 'arcfire_tavern_board_v1';
const MAX_NOTICE_COUNT = 80;

export type TavernNoticeTag = '작전' | '경제' | '외교' | '소문' | '아크코어';

export type TavernNotice = {
  id: string;
  title: string;
  body: string;
  tag: TavernNoticeTag;
  postedAtMs: number;
  dedupeKey?: string;
};

type TavernBoardState = {
  notices: TavernNotice[];
  loaded: boolean;
  loadLocalBoard: () => Promise<void>;
  persistBoard: () => Promise<void>;
  pushNotice: (notice: Omit<TavernNotice, 'id' | 'postedAtMs'> & { postedAtMs?: number }) => void;
};

function formatId(): string {
  return `board_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultNotices(): TavernNotice[] {
  const now = Date.now();
  return [
    {
      id: `seed_${now}_1`,
      title: '아크코어 공지 보드 가동',
      body: '월드 확장, 수송선단 배치, 도메인 서브코어 상태를 자동 수집합니다.',
      tag: '아크코어',
      postedAtMs: now - 2 * 60 * 1000,
      dedupeKey: 'seed_boot_1',
    },
    {
      id: `seed_${now}_2`,
      title: '은하계 운영 소식판 안내',
      body: '선술집 공지 보드는 아크코어 이벤트 로그 기반으로 자동 갱신됩니다.',
      tag: '작전',
      postedAtMs: now - 1 * 60 * 1000,
      dedupeKey: 'seed_boot_2',
    },
  ];
}

export const useTavernBoardStore = create<TavernBoardState>((set, get) => ({
  notices: getDefaultNotices(),
  loaded: false,

  loadLocalBoard: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ loaded: true });
        return;
      }
      const parsed = JSON.parse(raw) as { notices?: TavernNotice[] };
      if (!Array.isArray(parsed.notices)) {
        set({ loaded: true });
        return;
      }
      const safe = parsed.notices
        .filter((n) => n && typeof n.title === 'string' && typeof n.body === 'string')
        .map((n) => ({
          id: typeof n.id === 'string' ? n.id : formatId(),
          title: n.title,
          body: n.body,
          tag: (n.tag ?? '소문') as TavernNoticeTag,
          postedAtMs: Number.isFinite(Number(n.postedAtMs)) ? Number(n.postedAtMs) : Date.now(),
          dedupeKey: typeof n.dedupeKey === 'string' ? n.dedupeKey : undefined,
        }))
        .sort((a, b) => b.postedAtMs - a.postedAtMs)
        .slice(0, MAX_NOTICE_COUNT);
      set({ notices: safe.length > 0 ? safe : getDefaultNotices(), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  persistBoard: async () => {
    const notices = get().notices.slice(0, MAX_NOTICE_COUNT);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ notices }));
    scheduleUserCloudSync();
  },

  pushNotice: (notice) => {
    const nextPostedAtMs = notice.postedAtMs ?? Date.now();
    set((state) => {
      if (notice.dedupeKey && state.notices.some((n) => n.dedupeKey === notice.dedupeKey)) {
        return state;
      }
      const next: TavernNotice = {
        id: formatId(),
        title: notice.title,
        body: notice.body,
        tag: notice.tag,
        postedAtMs: nextPostedAtMs,
        dedupeKey: notice.dedupeKey,
      };
      return { notices: [next, ...state.notices].slice(0, MAX_NOTICE_COUNT) };
    });
    void get().persistBoard();
  },
}));

