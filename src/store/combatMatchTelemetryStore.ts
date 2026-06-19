// ============================================================
// STAGE 3 전투 종료 로컬 텔레메트리 — v4.0 §10-3 (Firestore 금지)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcfire_combat_match_telemetry_v1';
const MAX_ENTRIES = 80;

export type CombatMatchSummary = {
  planetId: string;
  systemId: string | null;
  engageSec: number;
  playerWon: boolean;
  recordedAt: number;
};

type TelemetryPayload = {
  entries: CombatMatchSummary[];
};

function normalizeEntry(raw: unknown): CombatMatchSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const planetId = typeof o.planetId === 'string' ? o.planetId.trim() : '';
  if (!planetId) return null;
  const engageSec = Number(o.engageSec);
  if (!Number.isFinite(engageSec) || engageSec <= 0) return null;
  return {
    planetId,
    systemId: typeof o.systemId === 'string' ? o.systemId : null,
    engageSec,
    playerWon: o.playerWon === true,
    recordedAt:
      typeof o.recordedAt === 'number' && Number.isFinite(o.recordedAt) ? o.recordedAt : Date.now(),
  };
}

async function readPayload(): Promise<TelemetryPayload> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as { entries?: unknown[] };
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.map(normalizeEntry).filter((e): e is CombatMatchSummary => e != null)
      : [];
    return { entries: entries.slice(-MAX_ENTRIES) };
  } catch {
    return { entries: [] };
  }
}

async function writePayload(payload: TelemetryPayload): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** UI·선행조건 — 동기 조회용 in-memory 캐시(부트 시 hydrate) */
let winCountByPlanetCache: Record<string, number> | null = null;

function rebuildWinCountCache(entries: CombatMatchSummary[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (!e.playerWon || !e.planetId) continue;
    out[e.planetId] = (out[e.planetId] ?? 0) + 1;
  }
  return out;
}

/** 행성별 전투 승리 누적 — facility_install_prerequisites 검사용 */
export function countPlanetCombatWinsSync(planetId: string): number {
  if (!planetId) return 0;
  if (!winCountByPlanetCache) return 0;
  return winCountByPlanetCache[planetId] ?? 0;
}

/** 앱 부트·계정 리셋 후 1회 호출 */
export async function hydrateCombatMatchTelemetryCache(): Promise<void> {
  const payload = await readPayload();
  winCountByPlanetCache = rebuildWinCountCache(payload.entries);
}

/** STAGE 3 전투 종료 시 1회 기록 — 일일 배치에서만 HP 배율 보정에 사용 */
export async function recordMatchSummary(entry: Omit<CombatMatchSummary, 'recordedAt'>): Promise<void> {
  const payload = await readPayload();
  const recorded: CombatMatchSummary = {
    ...entry,
    recordedAt: Date.now(),
  };
  payload.entries.push(recorded);
  if (payload.entries.length > MAX_ENTRIES) {
    payload.entries = payload.entries.slice(-MAX_ENTRIES);
  }
  await writePayload(payload);
  if (!winCountByPlanetCache) {
    winCountByPlanetCache = rebuildWinCountCache(payload.entries);
  } else if (recorded.playerWon && recorded.planetId) {
    winCountByPlanetCache[recorded.planetId] = (winCountByPlanetCache[recorded.planetId] ?? 0) + 1;
  }
}

export async function listRecentMatchSummaries(limit = 20): Promise<CombatMatchSummary[]> {
  const payload = await readPayload();
  return payload.entries.slice(-Math.max(1, limit));
}

/** 계정 초기화 — 플레이어 전투 텔레메트리(교전 기록) 제거 */
export async function resetCombatMatchTelemetry(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    winCountByPlanetCache = {};
  } catch {
    /* ignore */
  }
}
