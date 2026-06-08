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

function normalize(raw: unknown): ClanWarFoundationDbState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATE };
  const src = raw as Partial<ClanWarFoundationDbState>;
  return {
    clans: src.clans ?? {},
    planetHolds: src.planetHolds ?? {},
    deployments: src.deployments ?? [],
    operations: src.operations ?? [],
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

