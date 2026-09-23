// 세축 W3 — 허브 세션 진입 1회 스냅. 대사 착륙 가드와 분리.
// 정본: docs/세축_반응_잔상_세계변화_설계.md v1.1 §8-2

import { resolveDictionaryLocale } from '../../i18n';
import {
  ORBIT_PRESENCE_ROSTER_MAX,
  buildPlanetHoldSig,
  computeWorldChangeDigest,
  rememberedCaptainIdSet,
  type PlanetVisitSnapshot,
  type WorldChangeItem,
} from './orbitPresenceMemory';
import { buildWorldChangeFactLine } from './orbitPresenceWorldChange';

export function capturePlanetVisitSnapshot(
  planetId: string,
  nowMs = Date.now(),
): PlanetVisitSnapshot | null {
  const id = planetId.trim();
  if (!id) return null;

  let holdSig = buildPlanetHoldSig({});
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useClanWarFoundationStore } =
      require('../../store/clanWarFoundationStore') as typeof import('../../store/clanWarFoundationStore');
    const hold = useClanWarFoundationStore.getState().getHold(id);
    holdSig = buildPlanetHoldSig({
      occupierClanId: hold?.occupierClanId,
      deedOwnerClanId: hold?.deedOwnerClanId,
      kind: hold?.kind,
      neutralizedAt: hold?.neutralizedAt,
    });
  } catch {
    /* node test / 미기동 */
  }

  const captainIds: string[] = [];
  const seen = new Set<string>();
  const pushCaptain = (raw?: string) => {
    const cid = String(raw ?? '').trim();
    if (!cid || seen.has(cid) || captainIds.length >= ORBIT_PRESENCE_ROSTER_MAX) return;
    seen.add(cid);
    captainIds.push(cid);
  };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveSystemIdForPlanetIdFromGalaxy } =
      require('../../world/resolvePlanetSystemPosition') as typeof import('../../world/resolvePlanetSystemPosition');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
    const systemId =
      resolveSystemIdForPlanetIdFromGalaxy(id)
      ?? usePlayerStore.getState().player?.currentSystemId
      ?? '';
    if (systemId) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { resolvePlanetNearbyPresence } =
        require('../../npc/nearbyOrbitPresenceSystem') as typeof import('../../npc/nearbyOrbitPresenceSystem');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useArcNpcTrafficStore } =
        require('../../store/arcNpcTrafficStore') as typeof import('../../store/arcNpcTrafficStore');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { applyPlanetHubOrbitRenderBudget } =
        require('../planetHubOrbitRenderBudget') as typeof import('../planetHubOrbitRenderBudget');
      const table = resolvePlanetNearbyPresence(id, systemId);
      const traffic = useArcNpcTrafficStore.getState();
      const arcAtPlanet: typeof traffic.ships = [];
      for (let i = 0; i < traffic.ships.length; i += 1) {
        const ship = traffic.ships[i];
        if (ship && ship.planetId === id) arcAtPlanet.push(ship);
      }
      const budget = applyPlanetHubOrbitRenderBudget(table, arcAtPlanet);
      for (let i = 0; i < budget.tableRows.length; i += 1) {
        pushCaptain(budget.tableRows[i]?.captainId);
      }
      for (let i = 0; i < budget.arcShips.length; i += 1) {
        pushCaptain(budget.arcShips[i]?.captainId);
      }
    }
  } catch {
    /* node test / 미기동 */
  }

  let boardHeadId = '';
  let boardHeadTag: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useBarBoardStore } = require('../../store/barBoardStore') as typeof import('../../store/barBoardStore');
    const head = useBarBoardStore.getState().notices[0];
    boardHeadId = head?.id ?? '';
    boardHeadTag = head?.tag;
  } catch {
    /* node test / 미기동 */
  }

  return {
    planetId: id,
    visitedAtMs: nowMs,
    holdSig,
    captainIds,
    boardHeadId,
    boardHeadTag,
  };
}

export function applyOrbitPresenceHubVisit(planetId: string, nowMs = Date.now()): WorldChangeItem[] {
  const id = planetId.trim();
  if (!id) return [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const store = require('../../store/orbitPresenceMemoryStore') as typeof import('../../store/orbitPresenceMemoryStore');
  void store.ensureOrbitPresenceMemoryHydrated();
  const next = capturePlanetVisitSnapshot(id, nowMs);
  if (!next) return [];
  const prev = store.getPlanetVisitSnapshot(id);
  const items = computeWorldChangeDigest(
    prev,
    next,
    rememberedCaptainIdSet(store.useOrbitPresenceMemoryStore.getState().payload),
  );

  let locale: 'ko' | 'en' = 'ko';
  let planetLabel = id;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAppSettingsStore } = require('../../store/appSettingsStore') as typeof import('../../store/appSettingsStore');
    locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolvePlanetById } = require('../../world/resolvePlanetById') as typeof import('../../world/resolvePlanetById');
    const planet = resolvePlanetById(id);
    planetLabel = (locale === 'en'
      ? (planet?.nameEn?.trim() || planet?.name?.trim())
      : planet?.name?.trim()) || id;
  } catch {
    /* node test / 미기동 */
  }

  const factLine = buildWorldChangeFactLine(items[0], {
    locale,
    planetId: id,
    planetLabel,
    prev,
    next,
  });
  store.setLastHubWorldChangeDigest({
    planetId: id,
    items,
    factLine,
  });
  store.recordPlanetVisitSnapshot(next);
  return items;
}
