/**
 * 퀘스트 완료 대화 — 담당 NPC 해석 (순수 함수, 스토어/CSV I/O 없음).
 *
 * 대표님 정본(2026-08-24): 일반 퀘스트는 오퍼레이터. 발송지→배송지 담당이
 * 있을 배달·접선만 미션에 담당자를 심고, 그 담당자만 허브 대화에 활성화한다.
 * 배정이 어렵면 현행처럼 오퍼레이터.
 */
import type { Mission, MissionObjective } from '../types';
import { isAnyNeighborReachMission } from './missionNeighborReach';

export type MissionClearContactInput = Pick<
  Mission,
  'id' | 'type' | 'objectives' | 'clearNpcCaptainId' | 'requiresClearContact' | 'offerCaptainId'
>;

const CONTACT_MENTION_KO = '목적지 담당:';
const CONTACT_MENTION_EN = 'Destination contact:';
const OFFER_MENTION_KO = '발송지 담당:';
const OFFER_MENTION_EN = 'Origin contact:';
const AMBIGUOUS_DEST_KO = '도착 행성 바 주인';
const AMBIGUOUS_DEST_EN = 'bar host at arrival';

/**
 * 담당자 컨택이 필요한 퀘스트만 true.
 * — 미션에 명시한 담당자 / requiresClearContact
 * — type=delivery
 * — (구매·화물) + 도착 목표가 같이 있는 배달
 * 탐험·전투·단순 이동·구매만 = false (오퍼레이터).
 */
export function shouldAssignClearContact(mission: MissionClearContactInput): boolean {
  if (String(mission.clearNpcCaptainId ?? '').trim()) return true;
  if (mission.requiresClearContact === true) return true;
  if (mission.type === 'delivery') return true;
  let hasCargo = false;
  let hasReach = false;
  const objectives = mission.objectives;
  for (let i = 0; i < objectives.length; i += 1) {
    const type = objectives[i]!.type;
    if (type === 'buy_goods' || type === 'deliver_cargo') hasCargo = true;
    if (type === 'reach_planet' || type === 'reach_system') hasReach = true;
  }
  return hasCargo && hasReach;
}

/** 목적지 행성 id — reach_planet 우선, 없으면 reach_system → 성계 행성 조회.
 * 인접 성계(아무 성계)는 목적지가 모호하므로 null — 착륙 행성 바 주인이 완료. */
export function resolveMissionDestinationPlanetId(
  mission: Pick<Mission, 'id' | 'objectives'>,
  resolveFirstPlanetIdOfSystem: (systemId: string) => string | null,
): string | null {
  if (isAnyNeighborReachMission(mission)) return null;
  const objectives = mission.objectives;
  for (let i = objectives.length - 1; i >= 0; i -= 1) {
    const obj = objectives[i]!;
    if (obj.type === 'reach_planet') return obj.targetId;
  }
  for (let i = objectives.length - 1; i >= 0; i -= 1) {
    const obj = objectives[i]!;
    if (obj.type === 'reach_system') {
      const planetId = resolveFirstPlanetIdOfSystem(obj.targetId);
      if (planetId) return planetId;
    }
  }
  return null;
}

/**
 * 수락 시점 스냅샷용 — 완료 대화 담당 NPC 캡틴id.
 * 우선순위: 미션 명시 오버라이드 > (컨택 대상일 때만) 목적지 바 주인 > null(오퍼레이터).
 */
export function resolveMissionClearAssignedNpcCaptainId(
  mission: MissionClearContactInput,
  resolveFirstPlanetIdOfSystem: (systemId: string) => string | null,
  resolveBarHostCaptainId: (planetId: string) => string | null,
): string | null {
  const explicit = mission.clearNpcCaptainId?.trim();
  if (explicit) return explicit;
  if (!shouldAssignClearContact(mission)) return null;
  const destinationPlanetId = resolveMissionDestinationPlanetId(mission, resolveFirstPlanetIdOfSystem);
  if (!destinationPlanetId) return null;
  return resolveBarHostCaptainId(destinationPlanetId) || null;
}

/**
 * 완료 대화 화자.
 * 인접 성계처럼 목적 담당이 모호하면 착륙 행성 바 주인.
 * 명시 담당 > 그 외 수락 스냅샷 > 바(모호) > null(오퍼레이터).
 */
export function resolveClearDialogSpeakerCaptainId(
  mission: MissionClearContactInput & Pick<Mission, 'id' | 'objectives'>,
  assignedClearNpcCaptainId: string | null | undefined,
  landingPlanetId: string | null | undefined,
  resolveBarHostCaptainId: (planetId: string) => string | null,
): string | null {
  const explicit = mission.clearNpcCaptainId?.trim();
  if (explicit) return explicit;
  if (isAnyNeighborReachMission(mission) && shouldAssignClearContact(mission)) {
    const planetId = landingPlanetId?.trim();
    if (!planetId) return null;
    return resolveBarHostCaptainId(planetId);
  }
  return assignedClearNpcCaptainId?.trim() || null;
}

/** 활성 컨택 퀘스트의 담당자가 이 행성에서 대화 대상인지 */
export function isMissionClearContactAtPlanet(
  mission: Pick<Mission, 'id' | 'objectives'>,
  assignedCaptainId: string,
  planetId: string,
  resolveFirstPlanetIdOfSystem: (systemId: string) => string | null,
  resolveBarHostCaptainId: (planetId: string) => string | null,
): boolean {
  const assigned = assignedCaptainId.trim();
  if (!assigned || !planetId) return false;
  const dest = resolveMissionDestinationPlanetId(mission, resolveFirstPlanetIdOfSystem);
  if (dest) return dest === planetId;
  return resolveBarHostCaptainId(planetId) === assigned;
}

export type MissionClearNpcSceneKind = 'delivery' | 'arrival';

/** 담당자 제네릭 완료 씬 종류 — buy_goods/deliver_cargo면 배달, 아니면 도착·접선 */
export function resolveMissionClearNpcSceneKind(
  objectives: readonly Pick<MissionObjective, 'type'>[],
): MissionClearNpcSceneKind {
  for (let i = 0; i < objectives.length; i += 1) {
    const type = objectives[i]!.type;
    if (type === 'buy_goods' || type === 'deliver_cargo') return 'delivery';
  }
  return 'arrival';
}

export type CaptainContactLabel = { name: string; nameEn?: string };

/**
 * 인스턴스 생성·materialize 시 미션 자체에 담당자를 찍는다.
 * 컨택 대상이 아니거나 목적 담당을 못 찾으면 원본 유지(오퍼레이터).
 */
export function applyResolvedClearContactToMission(
  mission: Mission,
  resolveFirstPlanetIdOfSystem: (systemId: string) => string | null,
  resolveBarHostCaptainId: (planetId: string) => string | null,
  resolveCaptainLabel: (captainId: string) => CaptainContactLabel | null,
): Mission {
  if (isAnyNeighborReachMission(mission) && shouldAssignClearContact(mission)) {
    if (mission.description.includes(CONTACT_MENTION_KO)) return mission;
    const offerCaptainId = mission.offerCaptainId?.trim();
    const offerLabel = offerCaptainId ? resolveCaptainLabel(offerCaptainId) : null;
    const mentionKo = offerLabel
      ? `${OFFER_MENTION_KO} ${offerLabel.name} · ${CONTACT_MENTION_KO} ${AMBIGUOUS_DEST_KO}`
      : `${CONTACT_MENTION_KO} ${AMBIGUOUS_DEST_KO}`;
    const offerEn = offerLabel ? (offerLabel.nameEn ?? offerLabel.name) : '';
    const mentionEn = offerLabel
      ? `${OFFER_MENTION_EN} ${offerEn} · ${CONTACT_MENTION_EN} ${AMBIGUOUS_DEST_EN}`
      : `${CONTACT_MENTION_EN} ${AMBIGUOUS_DEST_EN}`;
    return {
      ...mission,
      description: `${mission.description}\n${mentionKo}`,
      descriptionEn: mission.descriptionEn
        ? `${mission.descriptionEn}\n${mentionEn}`
        : undefined,
    };
  }

  const destCaptainId = resolveMissionClearAssignedNpcCaptainId(
    mission,
    resolveFirstPlanetIdOfSystem,
    resolveBarHostCaptainId,
  );
  if (!destCaptainId) return mission;

  const destLabel = resolveCaptainLabel(destCaptainId);
  const offerCaptainId = mission.offerCaptainId?.trim();
  const offerLabel =
    offerCaptainId && offerCaptainId !== destCaptainId
      ? resolveCaptainLabel(offerCaptainId)
      : null;

  const next: Mission = {
    ...mission,
    clearNpcCaptainId: mission.clearNpcCaptainId?.trim() || destCaptainId,
  };
  if (!destLabel) return next;
  if (mission.description.includes(CONTACT_MENTION_KO)) return next;

  const mentionKo = offerLabel
    ? `${OFFER_MENTION_KO} ${offerLabel.name} · ${CONTACT_MENTION_KO} ${destLabel.name}`
    : `${CONTACT_MENTION_KO} ${destLabel.name}`;
  const destEn = destLabel.nameEn ?? destLabel.name;
  const offerEn = offerLabel ? (offerLabel.nameEn ?? offerLabel.name) : '';
  const mentionEn = offerLabel
    ? `${OFFER_MENTION_EN} ${offerEn} · ${CONTACT_MENTION_EN} ${destEn}`
    : `${CONTACT_MENTION_EN} ${destEn}`;

  return {
    ...next,
    description: `${mission.description}\n${mentionKo}`,
    descriptionEn: mission.descriptionEn
      ? `${mission.descriptionEn}\n${mentionEn}`
      : undefined,
  };
}
