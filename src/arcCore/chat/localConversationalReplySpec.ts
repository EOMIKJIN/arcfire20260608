// 로컬 회신 키 결정 — 순수. i18n/스토어 없음. 팩 뷰가 있으면 그걸 우선.

import type { I18nParams } from '../../i18n/types';
import {
  isArcCoreChatCasualTalk,
  isArcCoreChatHumanFirstTurn,
  isArcCoreChatSystemAxis,
} from './arcCoreChatCasualTalk';
import { clueKeyForDialogueDrive } from './arcCoreChatDialogueDrive';
import { classifyArcCoreChatProposalReply } from './arcCoreChatJudgmentMemory';
import { hintArcCoreChatTopicId } from './arcCoreChatTableIndex';
import { isArcCoreChatExecutableProposalId } from './arcCoreChatWorldProposal';
import { parseArcCoreChatActionRequest } from './arcCoreChatActionRequest';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';
import {
  firstKnowledgeCardText,
  firstStellaFieldNoteText,
  knowledgeCardTextById,
  readArcCoreChatToolFlag,
  readArcCoreChatToolNumber,
  readArcCoreChatToolText,
  type LocalConversationalPackView,
} from './localConversationalPackView';

export type LocalConversationalReplySpec = {
  key: string;
  params?: I18nParams;
  clueKey?: string;
  rawText?: string;
};

function withDriveClue(
  spec: LocalConversationalReplySpec,
  turn: ArcCoreChatTurn,
): LocalConversationalReplySpec {
  if (turn.drive.mode === 'hold' || turn.stance === 'refuse') return spec;
  const clueKey = clueKeyForDialogueDrive(turn.drive);
  if (!clueKey) return spec;
  return { ...spec, clueKey };
}

function resolveTopicId(turn: ArcCoreChatTurn, view?: LocalConversationalPackView): string {
  if (view?.topicId) return view.topicId;
  return hintArcCoreChatTopicId(turn.userText);
}

function specForLocation(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (!turn.facts.planetLabel) return withDriveClue({ key: 'arcCoreChat.reply.planetUnknown' }, turn);
  return withDriveClue(
    {
      key: turn.alreadyCovered.location ? 'arcCoreChat.reply.planetAgain' : 'arcCoreChat.reply.planet',
      params: { planet: turn.facts.planetLabel },
    },
    turn,
  );
}

function specForSpy(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (turn.facts.spyAlertPending) {
    return withDriveClue(
      { key: turn.alreadyCovered.spy ? 'arcCoreChat.reply.spyAgainYes' : 'arcCoreChat.reply.spyYes' },
      turn,
    );
  }
  return withDriveClue(
    { key: turn.alreadyCovered.spy ? 'arcCoreChat.reply.spyAgainNo' : 'arcCoreChat.reply.spyNo' },
    turn,
  );
}

function specForCombat(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (!turn.facts.hasCombatRecord) return withDriveClue({ key: 'arcCoreChat.reply.combatNone' }, turn);
  return withDriveClue(
    { key: turn.alreadyCovered.combat ? 'arcCoreChat.reply.combatAgain' : 'arcCoreChat.reply.combat' },
    turn,
  );
}

function specForSafety(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const defense = readArcCoreChatToolNumber(view, 'get_planet_cores', 'defense');
  if (defense == null) return withDriveClue({ key: 'arcCoreChat.reply.safetyNone' }, turn);
  return withDriveClue(
    { key: 'arcCoreChat.reply.safetyDefense', params: { defense } },
    turn,
  );
}

function specForNotice(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const title = readArcCoreChatToolText(view, 'get_latest_notice', 'title');
  if (readArcCoreChatToolFlag(view, 'get_latest_notice', 'hasNotice') && title) {
    return withDriveClue({ key: 'arcCoreChat.reply.notice', params: { title } }, turn);
  }
  return withDriveClue({ key: 'arcCoreChat.reply.noticeNone' }, turn);
}

function specForMission(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const fieldNote = firstStellaFieldNoteText(view);
  if (fieldNote) return withDriveClue({ key: 'arcCoreChat.reply.mission', rawText: fieldNote }, turn);
  const steer = view?.steerLine?.trim() ?? '';
  if (steer) return withDriveClue({ key: 'arcCoreChat.reply.mission', rawText: steer }, turn);
  const title = readArcCoreChatToolText(view, 'get_active_mission', 'title');
  if (readArcCoreChatToolFlag(view, 'get_active_mission', 'hasMission') && title) {
    return withDriveClue({ key: 'arcCoreChat.reply.mission', params: { title } }, turn);
  }
  return withDriveClue({ key: 'arcCoreChat.reply.missionNone' }, turn);
}

function specForSelf(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const card = firstKnowledgeCardText(view, 'self');
  if (card) return withDriveClue({ key: 'arcCoreChat.reply.self', rawText: card }, turn);
  return withDriveClue({ key: 'arcCoreChat.reply.self' }, turn);
}

function specForCanonTopic(
  topic: 'nations' | 'routes' | 'setting',
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const preferCrimson = /크림슨|레기온|crimson|legion/i.test(turn.userText);
  const preferred = topic === 'nations' && preferCrimson
    ? knowledgeCardTextById(view, 'know_crimson')
    : '';
  const card = preferred || firstKnowledgeCardText(view, topic);
  if (card) return withDriveClue({ key: `arcCoreChat.reply.${topic}`, rawText: card }, turn);
  return withDriveClue({ key: `arcCoreChat.reply.${topic}` }, turn);
}

function specForSeats(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const card = firstKnowledgeCardText(view, 'seats');
  if (card) return withDriveClue({ key: 'arcCoreChat.reply.seats', rawText: card }, turn);
  return withDriveClue({ key: 'arcCoreChat.reply.seats' }, turn);
}

function specForCores(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const defense = readArcCoreChatToolNumber(view, 'get_planet_cores', 'defense');
  const tier = readArcCoreChatToolText(view, 'get_planet_vitality', 'tier') || turn.facts.vitalityTier?.trim() || '';
  if (defense == null && !tier) return withDriveClue({ key: 'arcCoreChat.reply.coresNone' }, turn);
  if (defense != null && tier) {
    return withDriveClue({ key: 'arcCoreChat.reply.cores', params: { defense, tier } }, turn);
  }
  if (defense != null) {
    return withDriveClue({ key: 'arcCoreChat.reply.coresDefense', params: { defense } }, turn);
  }
  return withDriveClue({ key: 'arcCoreChat.reply.coresTier', params: { tier } }, turn);
}

function specForTrade(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (turn.facts.hasTradePort) return withDriveClue({ key: 'arcCoreChat.reply.tradeTalk' }, turn);
  return withDriveClue({ key: 'arcCoreChat.reply.tradeNone' }, turn);
}

function specForShipyard(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (turn.facts.hasShipyard) return withDriveClue({ key: 'arcCoreChat.reply.shipyardTalk' }, turn);
  return withDriveClue({ key: 'arcCoreChat.reply.shipyardNone' }, turn);
}

function specForMining(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (turn.facts.miningAllowanceExhausted) {
    return withDriveClue({ key: 'arcCoreChat.reply.miningExhausted' }, turn);
  }
  return withDriveClue({ key: 'arcCoreChat.reply.miningOk' }, turn);
}

function specForDaily(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  if (turn.facts.dailyOpsSettledToday) {
    return withDriveClue({ key: 'arcCoreChat.reply.dailySettled' }, turn);
  }
  return withDriveClue({ key: 'arcCoreChat.reply.dailyNone' }, turn);
}

function hashUserText(text: string): number {
  let hash = 0;
  const spoken = text.trim();
  for (let i = 0; i < spoken.length; i += 1) {
    hash = (hash * 31 + spoken.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const SMALLTALK_FIRST = [
  'arcCoreChat.reply.smalltalk',
  'arcCoreChat.reply.smalltalkB',
  'arcCoreChat.reply.smalltalkC',
] as const;

const SMALLTALK_AGAIN = [
  'arcCoreChat.reply.smalltalkAgain',
  'arcCoreChat.reply.smalltalkAgainB',
] as const;

function specForHumanTalk(turn: ArcCoreChatTurn): LocalConversationalReplySpec {
  const hash = hashUserText(turn.userText);
  if (turn.alreadyCovered.other) {
    return { key: SMALLTALK_AGAIN[hash % SMALLTALK_AGAIN.length] };
  }
  return { key: SMALLTALK_FIRST[hash % SMALLTALK_FIRST.length] };
}

function specForEmptyDrive(turn: ArcCoreChatTurn): LocalConversationalReplySpec | null {
  const clue = turn.drive.clueTopic;
  if (!clue || turn.drive.mode === 'hold') return null;
  return withDriveClue(specForHumanTalk(turn), turn);
}

function specForTopic(
  topic: string,
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec | null {
  if (topic === 'location') return specForLocation(turn);
  if (topic === 'spy') return specForSpy(turn);
  if (topic === 'combat') return specForCombat(turn);
  if (topic === 'safety') return specForSafety(turn, view);
  if (topic === 'notice') return specForNotice(turn, view);
  if (topic === 'mission' || topic === 'story') return specForMission(turn, view);
  if (topic === 'self') return specForSelf(turn, view);
  if (topic === 'seats') return specForSeats(turn, view);
  if (topic === 'cores') return specForCores(turn, view);
  if (topic === 'trade') return specForTrade(turn);
  if (topic === 'shipyard') return specForShipyard(turn);
  if (topic === 'mining') return specForMining(turn);
  if (topic === 'daily') return specForDaily(turn);
  if (topic === 'nations' || topic === 'routes' || topic === 'setting') {
    return specForCanonTopic(topic, turn, view);
  }
  if (topic === 'smalltalk') return specForHumanTalk(turn);
  if (topic === 'refuse') return { key: 'arcCoreChat.reply.refuse' };
  return null;
}

export function resolveLocalConversationalReplySpec(
  turn: ArcCoreChatTurn,
  view?: LocalConversationalPackView,
): LocalConversationalReplySpec {
  const { intent, stance, alreadyCovered } = turn;
  if (stance === 'refuse') return { key: 'arcCoreChat.reply.refuse' };
  const asked = parseArcCoreChatActionRequest(turn.userText);
  if (asked) {
    if (asked.id === 'talk_bar') {
      return { key: 'arcCoreChat.reply.talkBar', params: { name: asked.attendantName ?? '' } };
    }
    if (asked.id === 'talk_npc') {
      return { key: 'arcCoreChat.reply.talkNpc', params: { name: asked.captainName ?? '' } };
    }
    if (asked.id === 'arm_wave') {
      return { key: 'arcCoreChat.reply.armWave', params: { planet: asked.planetLabel ?? '' } };
    }
    if (asked.id === 'open_bar') return { key: 'arcCoreChat.reply.openBar' };
    if (asked.id === 'open_skilltree') return { key: 'arcCoreChat.reply.openSkilltree' };
    if (asked.id === 'open_economy') return { key: 'arcCoreChat.reply.openEconomy' };
    if (asked.id === 'open_development') return { key: 'arcCoreChat.reply.openDevelopment' };
    if (asked.id === 'open_talk_roster') return { key: 'arcCoreChat.reply.openTalkRoster' };
    return { key: 'arcCoreChat.reply.proposalOpened' };
  }
  const pending = turn.facts.pendingProposalId?.trim() ?? '';
  if (pending && isArcCoreChatExecutableProposalId(pending) && intent === 'other') {
    const verdict = classifyArcCoreChatProposalReply(turn.userText);
    if (verdict === 'accept') return { key: 'arcCoreChat.reply.proposalOpened' };
    if (verdict === 'refuse') return { key: 'arcCoreChat.reply.proposalLater' };
  }
  if (
    turn.drive.purposeId === 'guide_story'
    && (turn.topicId === 'mission' || turn.topicId === 'story')
  ) {
    const fieldNote = firstStellaFieldNoteText(view);
    if (fieldNote) return withDriveClue({ key: 'arcCoreChat.reply.mission', rawText: fieldNote }, turn);
    const steer = view?.steerLine?.trim() ?? '';
    if (steer) return withDriveClue({ key: 'arcCoreChat.reply.mission', rawText: steer }, turn);
  }
  const askedField = /함장|아까|조금 전|그 사람|언급|의뢰|본편/.test(turn.userText);
  if (askedField) {
    const fieldNote = firstStellaFieldNoteText(view);
    if (fieldNote) return withDriveClue({ key: 'arcCoreChat.reply.mission', rawText: fieldNote }, turn);
  }
  switch (intent) {
    case 'greet':
      return withDriveClue(
        { key: alreadyCovered.greeted ? 'arcCoreChat.reply.greetAgain' : 'arcCoreChat.reply.greet' },
        turn,
      );
    case 'location':
      return specForLocation(turn);
    case 'spy':
      return specForSpy(turn);
    case 'combat':
      return specForCombat(turn);
    case 'refuse':
      return { key: 'arcCoreChat.reply.refuse' };
    default: {
      const packTopic = view?.topicId?.trim() ?? '';
      if (
        view?.followUp
        && packTopic
        && isArcCoreChatSystemAxis({ intent: 'other', topicId: packTopic })
      ) {
        const fromPack = specForTopic(packTopic, turn, view);
        if (fromPack) return fromPack;
      }
      if (
        isArcCoreChatCasualTalk(turn.userText)
        || isArcCoreChatHumanFirstTurn({
          intent,
          topicId: turn.topicId,
          userText: turn.userText,
        })
      ) {
        return specForHumanTalk(turn);
      }
      const topic = resolveTopicId(turn, view);
      const fromTopic = specForTopic(topic, turn, view);
      if (fromTopic) return fromTopic;
      const fromDrive = specForEmptyDrive(turn);
      if (fromDrive) return fromDrive;
      return withDriveClue(specForHumanTalk(turn), turn);
    }
  }
}
