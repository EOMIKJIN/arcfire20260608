/**
 * 미확인 이상현상 정본 스폰 — 트리거 A(신규 식별) · B(식별 풀 일일 추첨).
 * 전 행성 60초 스캔 없음. payloadKind는 store applySpawn이 50:50 roll.
 */
import { getPlanetLevelingRowForZone, resolvePlanetZoneIndex } from '../../arcCore/planetBalance/planetZoneIndexRegistry';
import { resolveSystemIdForPlanetIdFromGalaxy } from '../../world/resolvePlanetSystemPosition';
import { isBarEnabledCoreOpenPlanetId } from '../listBarEnabledCoreOpenPlanetIds';
import { presentUnidentifiedAnomalyAlert, resolveUnidentifiedAnomalySystemLabel } from './presentUnidentifiedAnomalyAlert';
import {
  collectCooldownPlanetIds,
  pickWeightedAnomalySite,
  toAnomalySite,
  type UnidentifiedAnomalySite,
} from './selectUnidentifiedAnomalySite';
import {
  anomalyKstDayKey,
  nextAnomalyKstMidnightMs,
  resolveAnomalyUnacceptedTtlMs,
  resolveUnidentifiedAnomalyPolicy,
  rollAnomalyIdentifySuccess,
} from './unidentifiedAnomalyPolicy';

function requireAnomalyStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../store/unidentifiedAnomalyStore') as typeof import('../../store/unidentifiedAnomalyStore');
}

function persistSoon(): void {
  void requireAnomalyStore().useUnidentifiedAnomalyStore.getState().persistLocal();
}

function resolveSiteBand(planetId: string, systemId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const system = useWorldStore.getState().getSystem(systemId);
  const zone = resolvePlanetZoneIndex(planetId, system ?? null);
  return String(getPlanetLevelingRowForZone(zone).sectorBand ?? '').trim();
}

function listEligibleIdentifiedSites(nowMs: number): UnidentifiedAnomalySite[] {
  const policy = resolveUnidentifiedAnomalyPolicy();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const inspected = useWorldStore.getState().inspectedPlanetInfoIds;
  const cooldown = collectCooldownPlanetIds(
    useUnidentifiedAnomalyStore.getState().recentResolved,
    nowMs,
    policy,
  );
  const out: UnidentifiedAnomalySite[] = [];
  for (let i = 0; i < inspected.length; i += 1) {
    const planetId = String(inspected[i] ?? '').trim();
    if (!planetId || !isBarEnabledCoreOpenPlanetId(planetId)) continue;
    const systemId = resolveSystemIdForPlanetIdFromGalaxy(planetId);
    if (!systemId) continue;
    const site = toAnomalySite(
      { planetId, systemId, sectorBand: resolveSiteBand(planetId, systemId) },
      policy,
    );
    if (!site || cooldown.has(site.planetId)) continue;
    out.push(site);
  }
  return out;
}

function commitSpawn(site: UnidentifiedAnomalySite, nowMs: number): boolean {
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const store = useUnidentifiedAnomalyStore.getState();
  store.syncDailySpawnDay(nowMs);
  const policy = resolveUnidentifiedAnomalyPolicy();
  if (store.active) return false;
  if (store.spawnCountToday >= policy.dailySpawn) {
    store.deferNextSpawn(nextAnomalyKstMidnightMs(nowMs));
    persistSoon();
    return false;
  }
  const ttlMs = resolveAnomalyUnacceptedTtlMs(policy);
  const expiresAtMs = nowMs + ttlMs;
  const nextCount = store.spawnCountToday + 1;
  const nextSpawnAtMs =
    nextCount >= policy.dailySpawn ? nextAnomalyKstMidnightMs(nowMs) : expiresAtMs;
  const instanceId = store.applySpawn({
    systemId: site.systemId,
    planetId: site.planetId,
    startedAtMs: nowMs,
    expiresAtMs,
    nextSpawnAtMs,
  });
  if (!instanceId) return false;
  persistSoon();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const sys = useWorldStore.getState().getSystem(site.systemId);
  presentUnidentifiedAnomalyAlert(resolveUnidentifiedAnomalySystemLabel(sys, site.systemId), () => {
    const inst = useUnidentifiedAnomalyStore.getState().active?.instanceId;
    if (inst) useUnidentifiedAnomalyStore.getState().markAlerted(inst);
    persistSoon();
  });
  return true;
}

function canAttemptSpawn(nowMs: number): boolean {
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const store = useUnidentifiedAnomalyStore.getState();
  if (!store.loaded) return false;
  store.syncDailySpawnDay(nowMs);
  const policy = resolveUnidentifiedAnomalyPolicy();
  if (store.active) return false;
  if (store.spawnCountToday >= policy.dailySpawn) {
    store.deferNextSpawn(nextAnomalyKstMidnightMs(nowMs));
    persistSoon();
    return false;
  }
  return true;
}

/** 트리거 A — 착륙 후 행성정보 최초 오픈. */
export function tryUnidentifiedAnomalyIdentifySpawn(
  planetId: string,
  nowMs: number = Date.now(),
): boolean {
  const id = String(planetId ?? '').trim();
  if (!id) return false;
  if (!canAttemptSpawn(nowMs)) return false;
  if (!isBarEnabledCoreOpenPlanetId(id)) return false;
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(id);
  if (!systemId) return false;
  const policy = resolveUnidentifiedAnomalyPolicy();
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const cooldown = collectCooldownPlanetIds(
    useUnidentifiedAnomalyStore.getState().recentResolved,
    nowMs,
    policy,
  );
  if (cooldown.has(id)) return false;
  const sectorBand = resolveSiteBand(id, systemId);
  const site = toAnomalySite({ planetId: id, systemId, sectorBand }, policy);
  if (!site) return false;
  const dayKey = anomalyKstDayKey(nowMs);
  if (!rollAnomalyIdentifySuccess(id, sectorBand, dayKey, policy)) return false;
  return commitSpawn(site, nowMs);
}

/** 트리거 B — 이미 식별된 자격 풀 가중 추첨 1행성. */
export function tryUnidentifiedAnomalyDailySpawn(nowMs: number = Date.now()): boolean {
  if (!canAttemptSpawn(nowMs)) return false;
  const { useUnidentifiedAnomalyStore } = requireAnomalyStore();
  const store = useUnidentifiedAnomalyStore.getState();
  const sites = listEligibleIdentifiedSites(nowMs);
  if (sites.length === 0) {
    store.deferNextSpawn(nextAnomalyKstMidnightMs(nowMs));
    persistSoon();
    return false;
  }
  const dayKey = anomalyKstDayKey(nowMs);
  const picked = pickWeightedAnomalySite(sites, `${dayKey}:${store.spawnCountToday}`);
  if (!picked) {
    store.deferNextSpawn(nextAnomalyKstMidnightMs(nowMs));
    persistSoon();
    return false;
  }
  return commitSpawn(picked, nowMs);
}
