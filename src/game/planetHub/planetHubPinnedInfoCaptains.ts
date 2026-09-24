// ============================================================
// 허브 INFO 고정 함장 — 총사령관(해당 행성·체류전함 없어도 표시)
// + 현재 퀘스트 연관 중 **이 성계에 있는** 함장만
// 호출: 행성 진입 useMemo. 틱/거리정렬 경로 금지.
// ============================================================

import type { Mission, MissionProgress } from '../../types';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { useMissionStore } from '../../store/missionStore';
import { usePlayerStore } from '../../store/playerStore';
import {
  isCampaignPrimaryMissionId,
  isSubQuestMissionId,
  listQuestMissions,
} from '../../missions/missionTrack';
import { listActiveMissionBundles } from '../../missions/missionActiveBundles';
import { parseTalkNpcTarget } from '../../missions/talkNpcTarget';
import {
  listAvailableQuestOfferCaptainIds,
  pickAvailableMainStoryOfferForPlanet,
} from '../../missions/barMissionBoard';
import {
  resolveMissionDestinationPlanetId,
  shouldAssignClearContact,
} from '../../missions/resolveMissionClearNpcContext';
import {
  resolveBarHostCaptainIdAtPlanet,
  resolveMissionContactPlanetIdForSystem,
} from '../../missions/missionClearContactLookups';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { resolveMapFactionSideFromClanId } from '../../galaxyMap/resolveMapFactionSide';
import { getPlanetGovernorAssignment } from '../planetGovernor/planetGovernorAssignmentStore';
import { getPlanetGovernorCommander } from '../planetGovernor/planetGovernorRegistry';
import { reassignPlanetGovernorForOccupationSync } from '../planetGovernor/reassignPlanetGovernorForOccupation';
import type { AppLocale } from '../../i18n/types';
import { resolveNpcCaptainDisplayName } from '../../i18n/captainText';
import { resolveNpcCapitalShipDisplayName } from '../../i18n/shipText';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';
import { isCaptainPresentInHubSystemForInfo } from './isCaptainPresentInHubSystem';
import { applyQuestInfoMarkFlagsToRows } from './hubInfoSystemPresence';
import { getConfiguredQuestCaptainIdSet } from './hubInfoQuestNpcIndex';
import {
  buildNearbyInfoDetailRow,
  type NearbyInfoDetailRow,
  type NearbyInfoPinKind,
} from './nearbyPresenceDisplay';

export { applyQuestInfoMarkFlagsToRows } from './hubInfoSystemPresence';

export { mergePinnedHubInfoRows } from './mergePinnedHubInfoRows';

/** 퀘스트 핀 상한 — INFO/오버레이 폭주 방지 */
export const PINNED_INFO_QUEST_CAP = 8;

export const GOVERNOR_HUB_INFO_SLOT = -2;
export const QUEST_HUB_INFO_SLOT_BASE = -20;

export type PlanetHubPinnedInfoCaptain = {
  captainId: string;
  pinKind: NearbyInfoPinKind;
};

function addCaptainId(out: Set<string>, raw: string | null | undefined): void {
  const id = String(raw ?? '').trim();
  if (id) out.add(id);
}

function addMissionRelatedCaptainIds(
  ids: Set<string>,
  mission: Mission,
  progress: MissionProgress,
): void {
  addCaptainId(ids, mission.offerCaptainId);
  addCaptainId(ids, mission.clearNpcCaptainId);
  addCaptainId(ids, progress.assignedClearNpcCaptainId);
  const objectives = mission.objectives;
  for (let j = 0; j < objectives.length; j += 1) {
    const obj = objectives[j]!;
    if (obj.type !== 'talk_npc') continue;
    addCaptainId(ids, parseTalkNpcTarget(obj.targetId).captainId);
  }
  if (shouldAssignClearContact(mission)) {
    const destPlanetId = resolveMissionDestinationPlanetId(
      mission,
      resolveMissionContactPlanetIdForSystem,
    );
    if (destPlanetId) addCaptainId(ids, resolveBarHostCaptainIdAtPlanet(destPlanetId));
  }
}

/** CSV 고정 또는 런타임 배정이 있으면 총사령관으로 본다. */
export function resolveAssignedGovernorCaptainId(planetId: string): string | null {
  const pid = String(planetId ?? '').trim();
  if (!pid) return null;
  const assigned = getPlanetGovernorAssignment(pid);
  const fromAssign = String(assigned?.captainId ?? '').trim();
  if (fromAssign) return fromAssign;
  const gov = getPlanetGovernorCommander(pid);
  return String(gov?.governorCaptainId ?? '').trim() || null;
}

/**
 * 점유는 있는데 총사령관 슬롯이 비어 있으면 1회 배정.
 * 렌더/틱에서 호출 금지 — 행성 포커스 effect 전용.
 */
export function ensurePlanetGovernorForCurrentHold(planetId: string): boolean {
  const pid = String(planetId ?? '').trim();
  if (!pid) return false;
  if (resolveAssignedGovernorCaptainId(pid)) return false;
  const hold = useClanWarFoundationStore.getState().getHold(pid);
  if (!hold || hold.kind === 'neutral' || hold.occupierClanId === 'neutral') return false;
  const side = resolveMapFactionSideFromClanId(hold.occupierClanId);
  const occupationSide = side === 'red' ? 'RED' : side === 'blue' ? 'BLUE' : 'NEUTRAL';
  return Boolean(reassignPlanetGovernorForOccupationSync({
    planetId: pid,
    newFactionSide: occupationSide,
  }));
}

/** 활성 미션·메인스토리 오퍼·수락 가능 sandbox 의뢰 함장 id. 핀 상한 없음(INFO 스탬프용). */
export function collectAssignedQuestCaptainIds(planetId: string): string[] {
  const progresses = useMissionStore.getState().progresses;
  const ids = new Set<string>();
  const bundles = listActiveMissionBundles(progresses);
  for (let i = 0; i < bundles.length; i += 1) {
    const { mission, progress } = bundles[i]!;
    addMissionRelatedCaptainIds(ids, mission, progress);
  }
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const offer = pickAvailableMainStoryOfferForPlanet(planetId, playerLevel, progresses);
  if (offer) addCaptainId(ids, offer.offerCaptainId);
  const questOffers = listAvailableQuestOfferCaptainIds(planetId, playerLevel, progresses);
  for (let i = 0; i < questOffers.length; i += 1) {
    addCaptainId(ids, questOffers[i]);
  }
  const out: string[] = [];
  for (const id of ids) out.push(id);
  return out;
}

/** 활성 미션·메인스토리 오퍼에 묶인 함장 id. 성계 필터는 list 단계에서. */
export function collectQuestRelatedCaptainIds(planetId: string): string[] {
  const ids = collectAssignedQuestCaptainIds(planetId);
  if (ids.length <= PINNED_INFO_QUEST_CAP) return ids;
  return ids.slice(0, PINNED_INFO_QUEST_CAP);
}

/** 튜토리얼·메인스토리(캠페인)에 묶인 함장 — INFO Main Quest 태그 */
export function collectMainQuestRelatedCaptainIds(planetId: string): string[] {
  const progresses = useMissionStore.getState().progresses;
  const ids = new Set<string>();
  const bundles = listActiveMissionBundles(progresses);
  for (let i = 0; i < bundles.length; i += 1) {
    const { mission, progress } = bundles[i]!;
    if (!isCampaignPrimaryMissionId(mission.id)) continue;
    addMissionRelatedCaptainIds(ids, mission, progress);
  }
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const offer = pickAvailableMainStoryOfferForPlanet(planetId, playerLevel, progresses);
  if (offer) addCaptainId(ids, offer.offerCaptainId);
  const out: string[] = [];
  for (const id of ids) out.push(id);
  return out;
}

/**
 * 서브퀘스트(`sandbox_*` 전부)에 묶인 함장 — INFO S.
 * 바 수락 의뢰 `sandbox_001`–`033`과 챕터1 정식 `034`–`038`을 같이 본다.
 */
export function collectSubQuestRelatedCaptainIds(_planetId: string): string[] {
  const progresses = useMissionStore.getState().progresses;
  const ids = new Set<string>();
  const bundles = listActiveMissionBundles(progresses);
  for (let i = 0; i < bundles.length; i += 1) {
    const { mission, progress } = bundles[i]!;
    if (!isSubQuestMissionId(mission.id)) continue;
    addMissionRelatedCaptainIds(ids, mission, progress);
  }
  const quests = listQuestMissions();
  for (let i = 0; i < quests.length; i += 1) {
    const mission = quests[i]!;
    const status = progresses[mission.id]?.status;
    if (status === 'active' || status === 'complete' || status === 'failed') continue;
    addCaptainId(ids, mission.offerCaptainId);
  }
  const out: string[] = [];
  for (const id of ids) out.push(id);
  return out;
}

export function stampNearbyInfoMainQuestFlags(
  rows: NearbyInfoDetailRow[],
  planetId: string,
): NearbyInfoDetailRow[] {
  const pid = String(planetId ?? '').trim();
  if (!pid || rows.length === 0) return rows;
  return applyQuestInfoMarkFlagsToRows(rows, {
    assignedQuestIds: new Set(collectAssignedQuestCaptainIds(pid)),
    mainQuestIds: new Set(collectMainQuestRelatedCaptainIds(pid)),
    subQuestIds: new Set(collectSubQuestRelatedCaptainIds(pid)),
    configuredQuestIds: getConfiguredQuestCaptainIdSet(),
  });
}

export type PlanetHubPinnedInfoOpts = {
  systemId?: string | null;
  arcShips?: readonly ArcNpcTrafficShip[];
};

export function listPlanetHubPinnedInfoCaptains(
  planetId: string,
  opts?: PlanetHubPinnedInfoOpts,
): PlanetHubPinnedInfoCaptain[] {
  const pid = String(planetId ?? '').trim();
  const out: PlanetHubPinnedInfoCaptain[] = [];
  const seen = new Set<string>();
  const governorId = resolveAssignedGovernorCaptainId(pid);
  if (governorId) {
    seen.add(governorId);
    out.push({ captainId: governorId, pinKind: 'governor' });
  }
  if (!pid) return out;
  const hubSystemId = String(opts?.systemId ?? '').trim() || resolveSystemIdForPlanetId(pid);
  const arcShips = opts?.arcShips ?? [];
  const questIds = collectQuestRelatedCaptainIds(pid);
  for (let i = 0; i < questIds.length; i += 1) {
    const captainId = questIds[i]!;
    if (seen.has(captainId)) continue;
    if (!isCaptainPresentInHubSystemForInfo(captainId, pid, hubSystemId, arcShips)) continue;
    seen.add(captainId);
    out.push({ captainId, pinKind: 'quest' });
  }
  return out;
}

function buildPinnedInfoRow(
  pin: PlanetHubPinnedInfoCaptain,
  keySlot: number,
  locale: AppLocale,
): NearbyInfoDetailRow {
  const captain = getNpcCaptain(pin.captainId);
  const name = resolveNpcCaptainDisplayName(captain, locale).trim() || pin.captainId;
  const shipId = String(captain?.assignedShipId ?? '').trim();
  const shipLabel = shipId
    ? resolveNpcCapitalShipDisplayName(shipId, '', locale).trim()
    : '';
  const line = shipLabel ? `${name} · ${shipLabel}` : name;
  return buildNearbyInfoDetailRow(keySlot, line, {
    captainId: pin.captainId,
    shipId: shipId || undefined,
    pinKind: pin.pinKind,
    commGuaranteed: true,
  });
}

export function buildPlanetHubPinnedInfoRows(
  planetId: string,
  locale: AppLocale,
  opts?: PlanetHubPinnedInfoOpts,
): NearbyInfoDetailRow[] {
  const pins = listPlanetHubPinnedInfoCaptains(planetId, opts);
  const rows: NearbyInfoDetailRow[] = [];
  for (let i = 0; i < pins.length; i += 1) {
    const pin = pins[i]!;
    const keySlot = pin.pinKind === 'governor'
      ? GOVERNOR_HUB_INFO_SLOT
      : QUEST_HUB_INFO_SLOT_BASE - i;
    rows.push(buildPinnedInfoRow(pin, keySlot, locale));
  }
  return rows;
}

