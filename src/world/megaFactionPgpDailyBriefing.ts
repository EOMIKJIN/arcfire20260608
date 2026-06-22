// ============================================================
// 블루·레드 세력 PGP 합산 — 선술집 일 1회 공지 (앱 기동 시)
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../data/balance/generated';
import { resolveMapFactionSideFromClanIdPure } from '../galaxyMap/mapFactionSideCore';
import type { MapFactionSide } from '../galaxyMap/mapFactionSideCore';
import {
  planetCoreRuntimeToGaugeView,
  planetCsvBaselineToRuntime,
  type PlanetCoreRuntime,
} from '../store/planetCoreRuntimeStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { useTavernBoardStore } from '../store/tavernBoardStore';
import { useWorldStore } from '../store/worldStore';
import {
  calculatePlanetPgpFromStats,
  formatPlanetPgpBmu,
} from './planetPgpModel';
import {
  MEGA_FACTION_BLUE_NATION,
  MEGA_FACTION_RED_NATION,
} from './megaFactionNationPolicy';

export type MegaFactionPgpSnapshot = {
  bluePgpBmu: number;
  redPgpBmu: number;
  bluePlanetCount: number;
  redPlanetCount: number;
  leader: 'blue' | 'red' | 'tie';
};

const PGP_BRIEFING_DEDUPE_PREFIX = 'mega_faction_pgp_briefing_';
const TIE_MARGIN_RATIO = 0.05;

function resolveOccupationSeedOwner(planetId: string): 'BLUE' | 'RED' | 'NEUTRAL' {
  const row = PlanetOccupationSeeds_FROM_BALANCE_CSV.find((r) => r.planetId === planetId);
  const o = String(row?.initialOwner ?? '').trim().toUpperCase();
  if (o === 'RED') return 'RED';
  if (o === 'BLUE') return 'BLUE';
  return 'NEUTRAL';
}

function resolvePlanetFactionSide(planetId: string): MapFactionSide {
  const { planetHolds, clans } = useClanWarFoundationStore.getState();
  const hold = planetHolds[planetId];
  if (hold && hold.occupierClanId && hold.occupierClanId !== 'neutral') {
    return resolveMapFactionSideFromClanIdPure(hold.occupierClanId, clans);
  }
  const seedOwner = resolveOccupationSeedOwner(planetId);
  if (seedOwner === 'BLUE') return 'blue';
  if (seedOwner === 'RED') return 'red';
  return 'neutral';
}

function resolvePlanetPgpBmu(planetId: string, runtimeByPlanet: Record<string, PlanetCoreRuntime>): number {
  const rec = runtimeByPlanet[planetId];
  if (rec) {
    if (typeof rec.pgp === 'number' && Number.isFinite(rec.pgp)) {
      return Math.max(0, Math.floor(rec.pgp));
    }
    return calculatePlanetPgpFromStats(planetCoreRuntimeToGaugeView(rec));
  }
  const systems = useWorldStore.getState().systems;
  for (const sys of Object.values(systems)) {
    const planet = sys.planets.find((p) => p.id === planetId);
    if (planet) {
      return calculatePlanetPgpFromStats(planetCoreRuntimeToGaugeView(planetCsvBaselineToRuntime(planet)));
    }
  }
  return 0;
}

export function computeMegaFactionPgpSnapshot(): MegaFactionPgpSnapshot {
  const runtimeByPlanet = usePlanetCoreRuntimeStore.getState().byPlanetId;
  const planetIds = new Set<string>();
  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    planetIds.add(String(row.planetId).trim());
  }

  let bluePgpBmu = 0;
  let redPgpBmu = 0;
  let bluePlanetCount = 0;
  let redPlanetCount = 0;

  for (const planetId of planetIds) {
    const side = resolvePlanetFactionSide(planetId);
    if (side !== 'blue' && side !== 'red') continue;
    const pgp = resolvePlanetPgpBmu(planetId, runtimeByPlanet);
    if (side === 'blue') {
      bluePgpBmu += pgp;
      bluePlanetCount += 1;
    } else {
      redPgpBmu += pgp;
      redPlanetCount += 1;
    }
  }

  const total = bluePgpBmu + redPgpBmu;
  let leader: MegaFactionPgpSnapshot['leader'] = 'tie';
  if (total > 0) {
    const margin = Math.abs(bluePgpBmu - redPgpBmu) / total;
    if (margin >= TIE_MARGIN_RATIO) {
      leader = bluePgpBmu > redPgpBmu ? 'blue' : 'red';
    }
  }

  return {
    bluePgpBmu,
    redPgpBmu,
    bluePlanetCount,
    redPlanetCount,
    leader,
  };
}

function todayDedupeKey(): string {
  return `${PGP_BRIEFING_DEDUPE_PREFIX}${new Date().toISOString().slice(0, 10)}`;
}

/** 앱 기동 1회 — 당일 중복 dedupeKey 로 선술집 공지 1건 */
export function publishMegaFactionPgpDailyBriefingNotice(): void {
  const snap = computeMegaFactionPgpSnapshot();
  const leaderKey =
    snap.leader === 'blue' ? 'blue' : snap.leader === 'red' ? 'red' : 'tie';

  useTavernBoardStore.getState().pushNotice({
    i18nKey: 'news.megaFactionPgp',
    i18nParams: {
      blueNation: MEGA_FACTION_BLUE_NATION.displayNameKo,
      blueNationEn: MEGA_FACTION_BLUE_NATION.displayNameEn,
      redNation: MEGA_FACTION_RED_NATION.displayNameKo,
      redNationEn: MEGA_FACTION_RED_NATION.displayNameEn,
      bluePgp: formatPlanetPgpBmu(snap.bluePgpBmu).replace(' BMU', ''),
      redPgp: formatPlanetPgpBmu(snap.redPgpBmu).replace(' BMU', ''),
      blueCount: snap.bluePlanetCount,
      redCount: snap.redPlanetCount,
      leader: leaderKey,
    },
    title: '세력 PGP 전력 브리핑',
    body: `${MEGA_FACTION_BLUE_NATION.displayNameKo} ${formatPlanetPgpBmu(snap.bluePgpBmu)} vs ${MEGA_FACTION_RED_NATION.displayNameKo} ${formatPlanetPgpBmu(snap.redPgpBmu)} — ${
      leaderKey === 'blue' ? '블루 우세' : leaderKey === 'red' ? '레드 우세' : '팽팽'
    }`,
    tag: '외교',
    dedupeKey: todayDedupeKey(),
  });
}
