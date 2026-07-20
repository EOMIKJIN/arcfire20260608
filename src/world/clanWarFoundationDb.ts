import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ClanBasicsRecord,
  ClanWarOperation,
  PlanetCapitalDeployment,
  PlanetClanHold,
} from '../types';

const CLAN_WAR_FOUNDATION_DB_KEY = 'arcfire_clan_war_foundation_v2';

export interface ClanWarFoundationDbState {
  clans: Record<string, ClanBasicsRecord>;
  planetHolds: Record<string, PlanetClanHold>;
  deployments: PlanetCapitalDeployment[];
  operations: ClanWarOperation[];
}

type ClanWarFoundationDbEnvelope = {
  version: 2;
  updatedAt: number;
  data: ClanWarFoundationDbState;
};

const EMPTY_STATE: ClanWarFoundationDbState = {
  clans: {},
  planetHolds: {},
  deployments: [],
  operations: [],
};

/**
 * 작전 로그 상한 — 접전지 일일 전투·반란·레이드가 매일 쌓이므로 unbounded 직렬화 금지
 * (헌법 §주기·틱 GC 규율 #3). 로그는 newest-first prepend라 slice가 최신 유지.
 * 소급 수리(repairRuntimeNeutralizedHoldsFromOperations)는 「최신」 중립화 작전만 쓰므로
 * 상한 내에서 안전하다(복원 후에는 hold 마커가 정본이라 로그 불필요).
 */
const OPERATIONS_HISTORY_CAP = 300;

function normalize(raw: unknown): ClanWarFoundationDbState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATE };
  const src = raw as Partial<ClanWarFoundationDbState>;
  return {
    clans: src.clans ?? {},
    planetHolds: src.planetHolds ?? {},
    deployments: src.deployments ?? [],
    operations: (src.operations ?? []).slice(0, OPERATIONS_HISTORY_CAP),
  };
}

export async function loadClanWarFoundationDb(): Promise<ClanWarFoundationDbState> {
  const raw = await AsyncStorage.getItem(CLAN_WAR_FOUNDATION_DB_KEY);
  if (!raw) return { ...EMPTY_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<ClanWarFoundationDbEnvelope> | ClanWarFoundationDbState;
    if ('data' in (parsed as Record<string, unknown>)) {
      const env = parsed as Partial<ClanWarFoundationDbEnvelope>;
      return normalize(env.data);
    }
    // v1 호환: 예전 스키마가 직접 state를 저장한 경우
    return normalize(parsed);
  } catch {
    return { ...EMPTY_STATE };
  }
}

export async function saveClanWarFoundationDb(state: ClanWarFoundationDbState): Promise<void> {
  const envelope: ClanWarFoundationDbEnvelope = {
    version: 2,
    updatedAt: Date.now(),
    data: normalize(state),
  };
  await AsyncStorage.setItem(CLAN_WAR_FOUNDATION_DB_KEY, JSON.stringify(envelope));
}

export async function resetClanWarFoundationDb(): Promise<void> {
  await AsyncStorage.removeItem(CLAN_WAR_FOUNDATION_DB_KEY);
}

