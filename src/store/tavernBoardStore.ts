import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import type { I18nParams } from '../i18n/types';

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
  i18nKey?: string;
  i18nParams?: I18nParams;
};

type TavernBoardState = {
  notices: TavernNotice[];
  loaded: boolean;
  loadLocalBoard: () => Promise<void>;
  persistBoard: () => Promise<void>;
  resetLocalBoard: () => Promise<void>;
  pushNotice: (notice: Omit<TavernNotice, 'id' | 'postedAtMs'> & { postedAtMs?: number }) => void;
  /** dedupeKey 일치 공지를 최신 내용으로 교체(행성별 점령 갱신) */
  pushOrRefreshNotice: (
    notice: Omit<TavernNotice, 'id' | 'postedAtMs'> & { postedAtMs?: number },
    dedupeKey: string,
  ) => void;
};

function formatId(): string {
  return `board_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 삭제된 ArcCore 장거리 미사일(arc_core_message_*) 공지 — AsyncStorage 잔존분 제거용 */
function isLegacyArcCoreMissileNotice(
  notice: Pick<TavernNotice, 'title' | 'body' | 'dedupeKey'>,
): boolean {
  const dedupe = notice.dedupeKey ?? '';
  if (dedupe.startsWith('arc_core_msg_')) return true;

  const title = notice.title;
  if (title === 'Missile 공습경고') return true;
  if (title.startsWith('아크코어 메시지 미사일')) return true;
  if (title.includes('아크코어 메시지') && title.includes('근접')) return true;
  if (title.includes('방위위성') && title.includes('요격')) return true;

  const body = notice.body;
  if (body.includes('아크코어 장거리 미사일')) return true;
  if (body.includes('장거리 미사일') && body.includes('아크코어')) return true;

  return false;
}

function stripLegacyArcCoreMissileNotices(notices: TavernNotice[]): TavernNotice[] {
  return notices.filter((n) => !isLegacyArcCoreMissileNotice(n));
}

/** AsyncStorage에 한국어만 저장된 구형 공지 → i18nKey 부여(표시 시점 locale 해석) */
function migrateLegacyNoticeI18n(notice: TavernNotice): TavernNotice {
  if (notice.i18nKey) return notice;

  if (notice.dedupeKey === 'seed_boot_1' || notice.title === '아크코어 공지 보드 가동') {
    return { ...notice, i18nKey: 'news.boardBoot' };
  }
  if (notice.dedupeKey === 'seed_boot_2' || notice.title === '은하계 운영 소식판 안내') {
    return { ...notice, i18nKey: 'news.guide' };
  }
  if (notice.dedupeKey === 'arc_news_boot_notice' || notice.title === '아크코어 공지 보드 동기화 완료') {
    return { ...notice, i18nKey: 'news.sync' };
  }

  const unlockMatch = notice.title.match(/^성계 개척: (.+)$/);
  if (unlockMatch) {
    const systemName = unlockMatch[1]!.trim();
    const idMatch = notice.body.match(/\(([a-z0-9_]+)\)\s*$/i);
    return {
      ...notice,
      i18nKey: 'news.worldUnlock',
      i18nParams: { systemName, systemId: idMatch?.[1] ?? '' },
    };
  }

  if (notice.title === '수송선단 파견 보고') {
    const factionMatch = notice.body.match(/^(.+?) 소속/);
    return {
      ...notice,
      i18nKey: 'news.transport',
      i18nParams: { factionId: factionMatch?.[1]?.trim() ?? '' },
    };
  }

  if (notice.title.startsWith('경제 지시 반영:')) {
    const scopeLabel = notice.title.replace('경제 지시 반영: ', '').trim();
    const actionMatch = notice.body.match(/가 (.+?) 정책을/);
    const scopeKind = scopeLabel === '전체 무역소' ? 'all' : 'planets';
    const planetCount =
      scopeKind === 'planets' ? Number.parseInt(scopeLabel.replace(/[^\d]/g, ''), 10) || 0 : 0;
    return {
      ...notice,
      i18nKey: 'news.economyBulk',
      i18nParams: { scopeKind, planetCount, action: actionMatch?.[1]?.trim() ?? '' },
    };
  }

  if (notice.title === '아크코어 정기 브리핑') {
    const m = notice.body.match(/개방 성계 (\d+)\/(\d+), 활성 수송선 (\d+)척/);
    if (m) {
      return {
        ...notice,
        i18nKey: 'news.briefing',
        i18nParams: { unlocked: m[1]!, total: m[2]!, traffic: m[3]! },
      };
    }
  }

  return notice;
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
      i18nKey: 'news.boardBoot',
    },
    {
      id: `seed_${now}_2`,
      title: '은하계 운영 소식판 안내',
      body: '선술집 공지 보드는 아크코어 이벤트 로그 기반으로 자동 갱신됩니다.',
      tag: '작전',
      postedAtMs: now - 1 * 60 * 1000,
      dedupeKey: 'seed_boot_2',
      i18nKey: 'news.guide',
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
      const mapped = parsed.notices
        .filter((n) => n && typeof n.title === 'string' && typeof n.body === 'string')
        .map((n) => ({
          id: typeof n.id === 'string' ? n.id : formatId(),
          title: n.title,
          body: n.body,
          tag: (n.tag ?? '소문') as TavernNoticeTag,
          postedAtMs: Number.isFinite(Number(n.postedAtMs)) ? Number(n.postedAtMs) : Date.now(),
          dedupeKey: typeof n.dedupeKey === 'string' ? n.dedupeKey : undefined,
          i18nKey: typeof n.i18nKey === 'string' ? n.i18nKey : undefined,
          i18nParams:
            n.i18nParams && typeof n.i18nParams === 'object' ? (n.i18nParams as I18nParams) : undefined,
        }));
      const migrated = mapped.map(migrateLegacyNoticeI18n);
      const safe = stripLegacyArcCoreMissileNotices(migrated)
        .sort((a, b) => b.postedAtMs - a.postedAtMs)
        .slice(0, MAX_NOTICE_COUNT);
      const nextNotices = safe.length > 0 ? safe : getDefaultNotices();
      const needsPersist =
        safe.length !== mapped.length ||
        migrated.some((n, i) => n.i18nKey !== mapped[i]?.i18nKey);
      set({ notices: nextNotices, loaded: true });
      if (needsPersist) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ notices: nextNotices }));
      }
    } catch {
      set({ loaded: true });
    }
  },

  persistBoard: async () => {
    const notices = get().notices.slice(0, MAX_NOTICE_COUNT);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ notices }));
    scheduleUserCloudSync();
  },

  resetLocalBoard: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    set({ notices: getDefaultNotices(), loaded: true });
  },

  pushNotice: (notice) => {
    if (isLegacyArcCoreMissileNotice(notice)) return;
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
        i18nKey: notice.i18nKey,
        i18nParams: notice.i18nParams,
      };
      return { notices: [next, ...state.notices].slice(0, MAX_NOTICE_COUNT) };
    });
    void get().persistBoard();
  },

  pushOrRefreshNotice: (notice, dedupeKey) => {
    if (isLegacyArcCoreMissileNotice(notice)) return;
    const nextPostedAtMs = notice.postedAtMs ?? Date.now();
    set((state) => {
      const rest = state.notices.filter((n) => n.dedupeKey !== dedupeKey);
      const next: TavernNotice = {
        id: formatId(),
        title: notice.title,
        body: notice.body,
        tag: notice.tag,
        postedAtMs: nextPostedAtMs,
        dedupeKey,
        i18nKey: notice.i18nKey,
        i18nParams: notice.i18nParams,
      };
      return { notices: [next, ...rest].slice(0, MAX_NOTICE_COUNT) };
    });
    void get().persistBoard();
  },
}));

