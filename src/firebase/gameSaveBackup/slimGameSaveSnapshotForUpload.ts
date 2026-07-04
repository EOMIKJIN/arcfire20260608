import type { GameSaveBackupSnapshot } from './gameSaveBackupContract';

/** 백업에서 제외 — 복구 핵심 아님 · 재생성 가능 */
export const GAME_SAVE_BACKUP_OMIT_KEYS = new Set<string>([
  'arcfire_combat_match_telemetry_v1',
  'arcfire_user_session_v1',
]);

type WorldPersistShape = {
  unlockedSystemIds?: string[];
  visitedSystemIds?: string[];
  synthColonizationPhaseByPlanetId?: Record<string, number>;
};

function parseWorldPersist(raw: string | undefined): WorldPersistShape {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as WorldPersistShape;
  } catch {
    return {};
  }
}

/** 백업에 반드시 유지할 행성 id — 월드解鎖·방문·개발 phase */
export function resolvePlanetIdsForBackupRetention(worldRaw: string | undefined): Set<string> {
  const world = parseWorldPersist(worldRaw);
  const keep = new Set<string>();
  const phaseMap = world.synthColonizationPhaseByPlanetId ?? {};
  for (const [planetId, phase] of Object.entries(phaseMap)) {
    if (typeof phase === 'number' && phase >= 1) keep.add(planetId);
  }
  const systemIds = [
    ...(world.unlockedSystemIds ?? []),
    ...(world.visitedSystemIds ?? []),
  ];
  for (const systemId of systemIds) {
    if (systemId.startsWith('synth_')) {
      keep.add(`${systemId}_p`);
    }
  }
  return keep;
}

function hasPlanetCoreBackupValue(rec: Record<string, unknown>): boolean {
  if (typeof rec.pgp === 'number' && Number.isFinite(rec.pgp)) return true;
  const detail = rec.detail;
  if (!detail || typeof detail !== 'object') return false;
  const d = detail as Record<string, unknown>;
  const dev = d.development as { byModuleId?: Record<string, unknown> } | undefined;
  if (dev?.byModuleId && Object.keys(dev.byModuleId).length > 0) return true;
  if (d.masterBalance) return true;
  const sat = d.defenseSatellite as { installed?: boolean } | undefined;
  if (sat?.installed) return true;
  const rd = d.coreStatRd as { activeJob?: unknown; stages?: Record<string, unknown> } | undefined;
  if (rd?.activeJob || (rd?.stages && Object.keys(rd.stages).length > 0)) return true;
  const atk = d.attackDamage as { totalEvents?: number } | undefined;
  if (typeof atk?.totalEvents === 'number' && atk.totalEvents > 0) return true;
  if (d.economyFabric) return true;
  if (d.lastDailyUpkeep) return true;
  const keys = Object.keys(d).filter((k) => k !== 'statOpsTrend');
  return keys.length > 0;
}

function slimPlanetCoreDetail(detail: Record<string, unknown>): Record<string, unknown> {
  const next = { ...detail };
  const attack = next.attackDamage as { lastEvents?: unknown[] } | undefined;
  if (attack?.lastEvents && attack.lastEvents.length > 5) {
    next.attackDamage = { ...attack, lastEvents: attack.lastEvents.slice(-5) };
  }
  const fabric = next.economyFabric as { recentEvents?: unknown[] } | undefined;
  if (fabric?.recentEvents && fabric.recentEvents.length > 8) {
    next.economyFabric = { ...fabric, recentEvents: fabric.recentEvents.slice(-8) };
  }
  return next;
}

function slimPlanetCoreRuntimeRaw(raw: string, retainPlanetIds: Set<string>): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const byPlanetId = parsed.byPlanetId as Record<string, Record<string, unknown>> | undefined;
    if (!byPlanetId || typeof byPlanetId !== 'object') return raw;
    const filtered: Record<string, Record<string, unknown>> = {};
    for (const [planetId, rec] of Object.entries(byPlanetId)) {
      if (!rec || typeof rec !== 'object') continue;
      if (!retainPlanetIds.has(planetId) && !hasPlanetCoreBackupValue(rec)) continue;
      const copy = { ...rec };
      if (copy.detail && typeof copy.detail === 'object') {
        copy.detail = slimPlanetCoreDetail(copy.detail as Record<string, unknown>);
      }
      filtered[planetId] = copy;
    }
    return JSON.stringify({ ...parsed, byPlanetId: filtered });
  } catch {
    return raw;
  }
}

function slimWorldObjectRuntimeRaw(raw: string, retainPlanetIds: Set<string>): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    const keepKey = (key: string): boolean => {
      const planetId = key.includes(':') ? key.slice(0, key.indexOf(':')) : key;
      return retainPlanetIds.has(planetId);
    };
    const filterField = (field: string) => {
      const src = parsed[field];
      if (!src || typeof src !== 'object') return;
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(src)) {
        if (keepKey(k)) filtered[k] = v;
      }
      parsed[field] = filtered;
    };
    filterField('asteroidOrbitCountByPlanetId');
    filterField('asteroidMineralItemIdsByPlanetId');
    filterField('instanceStateByObjectId');
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

function slimItemLedgerRaw(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { ledgersByUid?: Record<string, { txns?: unknown[] }> };
    const ledgers = parsed.ledgersByUid;
    if (!ledgers || typeof ledgers !== 'object') return raw;
    const next: typeof ledgers = {};
    for (const [uid, ledger] of Object.entries(ledgers)) {
      if (!ledger || typeof ledger !== 'object') continue;
      const txns = Array.isArray(ledger.txns) ? ledger.txns.slice(-120) : [];
      next[uid] = { ...ledger, txns };
    }
    return JSON.stringify({ ...parsed, ledgersByUid: next });
  } catch {
    return raw;
  }
}

function slimClanWarRaw(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const envelope = parsed.data ? parsed : { data: parsed };
    const data = envelope.data as { operations?: unknown[] } | undefined;
    if (!data?.operations || data.operations.length <= 40) return raw;
    return JSON.stringify({
      ...envelope,
      data: { ...data, operations: data.operations.slice(-40) },
    });
  } catch {
    return raw;
  }
}

function slimTavernBoardRaw(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { notices?: unknown[]; history?: unknown[] };
    return JSON.stringify({
      notices: Array.isArray(parsed.notices) ? parsed.notices.slice(0, 20) : [],
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 60) : [],
    });
  } catch {
    return raw;
  }
}

function slimSnapshotValue(key: string, value: string, retainPlanetIds: Set<string>): string {
  switch (key) {
    case 'arcfire_planet_core_runtime_v1':
      return slimPlanetCoreRuntimeRaw(value, retainPlanetIds);
    case 'arcfire_world_object_runtime_v1':
      return slimWorldObjectRuntimeRaw(value, retainPlanetIds);
    case 'arcfire_item_ledger_v1':
      return slimItemLedgerRaw(value);
    case 'arcfire_clan_war_foundation_v2':
      return slimClanWarRaw(value);
    case 'arcfire_tavern_board_v1':
      return slimTavernBoardRaw(value);
    default:
      return value;
  }
}

export type SlimGameSaveSnapshotResult = {
  snapshot: GameSaveBackupSnapshot;
  omittedKeys: string[];
  slimmedKeys: string[];
};

/** Firestore 1MB 한계 대응 — 비핵심 키 제외·행성 코어·로그 슬림 */
export function slimGameSaveSnapshotForUpload(
  snapshot: GameSaveBackupSnapshot,
): SlimGameSaveSnapshotResult {
  const worldRaw = snapshot.arcfire_world_v1;
  const retainPlanetIds = resolvePlanetIdsForBackupRetention(worldRaw);
  const omittedKeys: string[] = [];
  const slimmedKeys: string[] = [];
  const next: GameSaveBackupSnapshot = {};

  for (const [key, value] of Object.entries(snapshot)) {
    if (GAME_SAVE_BACKUP_OMIT_KEYS.has(key)) {
      omittedKeys.push(key);
      continue;
    }
    if (typeof value !== 'string' || !value) continue;
    const slimmed = slimSnapshotValue(key, value, retainPlanetIds);
    if (slimmed.length < value.length) slimmedKeys.push(key);
    next[key] = slimmed;
  }
  return { snapshot: next, omittedKeys, slimmedKeys };
}

export function estimateGameSaveDocCharSize(payload: {
  snapshot: GameSaveBackupSnapshot;
  summary: unknown;
  schemaVersion: number;
  uid: string;
  nickname: string | null;
  createdAtMs: number;
  expiresAtMs: number;
  reason: string;
  appVersion: string;
  payloadMode?: string;
  chunkCount?: number;
}): number {
  try {
    return JSON.stringify(payload).length;
  } catch {
    let total = 0;
    for (const v of Object.values(payload.snapshot)) total += v.length;
    return total;
  }
}

export function perKeySnapshotCharSizes(snapshot: GameSaveBackupSnapshot): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    sizes[key] = value.length;
  }
  return sizes;
}
