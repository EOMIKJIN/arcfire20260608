/**
 * 통신 즉석 개인 의뢰 — INFO 마지막 육각(U) 보유 판정.
 * 생성·대사·persist 없음. 허브 INFO useMemo에서 보이는 함장만 호출.
 *
 * 템플릿 선택은 해시라 확률 실패가 없다.
 * 게이트가 막거나 쓸 템플릿이 없으면 만들지 않으므로 U를 켜지 않는다.
 * 이미 진행 중인 개인 의뢰는 보유로 본다.
 */
import { getNpcCaptain } from '../npc/npcFleetRegistry';
import { getCaptainPresenceMemory } from '../store/orbitPresenceMemoryStore';
import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import { pickActiveContactQuestIdForCaptain } from '../game/planetHubNpcDialog';
import { pickAvailableMainStoryMissionIdForCaptain } from './barMissionBoard';
import { countActiveCaptainPersonalMissions } from './captainPersonalMissionIds';
import {
  evaluateCaptainPersonalOfferGate,
  kstDayKeyFromMs,
} from './captainPersonalMissionOffer';
import { hasUsableCaptainPersonalTemplate } from './captainPersonalMissionResolver';

export function captainHoldsInstantPersonalQuest(captainId: string, planetId: string): boolean {
  const id = captainId.trim();
  const pid = planetId.trim();
  if (!id || !pid) return false;
  const captain = getNpcCaptain(id);
  if (!captain) return false;

  const progresses = useMissionStore.getState().progresses;
  if (countActiveCaptainPersonalMissions(progresses, id) > 0) return true;

  const memory = getCaptainPresenceMemory(id);
  if (memory?.personalThanksPending === true) return false;

  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const dayKey = kstDayKeyFromMs();
  const gate = evaluateCaptainPersonalOfferGate({
    commAccepted: true,
    talkEnabled: captain.mainStageTalkEnabled === true,
    isHostileRefuse: false,
    isFlagship: false,
    isOrbitFill: captain.arcOrbitPresenceFill === true,
    hasOfferableMainStory: Boolean(
      pickAvailableMainStoryMissionIdForCaptain(id, pid, playerLevel, progresses),
    ),
    hasActiveTalkContact: Boolean(pickActiveContactQuestIdForCaptain(id, pid)),
    captainActivePersonalCount: 0,
    accountActivePersonalCount: countActiveCaptainPersonalMissions(progresses),
    dayKey,
    declineUntilDayKey: memory?.declineUntilDayKey,
    lastPersonalOfferDayKey: memory?.lastPersonalOfferDayKey,
    templateAvailable: hasUsableCaptainPersonalTemplate(id, pid, dayKey),
  });
  return gate.ok;
}
