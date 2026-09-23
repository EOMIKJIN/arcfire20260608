// ContextPack — 전송 1회 조립. 전 행성/프로필/금고 금지.

import { resolveDictionaryLocale } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import type { ArcCoreChatDialogueMode } from './arcCoreChatDialogueDrive';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';
import type { ArcCoreChatStance } from './arcCoreChatStance';
import {
  getArcCoreChatRollingSummary,
  getArcCoreChatTopicStack,
} from './arcCoreChatDialogueState';
import { toolNameForDialogueClue } from './arcCoreChatDialogueDrive';
import {
  mergeArcCoreChatKnowledgeTopics,
  resolveArcCoreChatPackTopic,
  resolveInboundOpenerPackTopic,
} from './arcCoreChatPackTopic';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';
import {
  findArcCoreChatModeRow,
  findArcCoreChatPurposeRow,
  listArcCoreChatKnowledgeRows,
  listArcCoreChatPersonaRowsForSpeaker,
} from './arcCoreChatTableIndex';
import { hintArcCoreChatNuance, type ArcCoreChatNuanceHint } from './arcCoreChatNuanceHint';
import { readArcCoreChatGmSession, type ArcCoreChatGmSession } from './arcCoreChatGmBeat';
import { runArcCoreChatReadTools, type ArcCoreChatToolResult } from './arcCoreChatReadTools';
import { spokenLineBudgetForTurn } from './arcCoreChatSpokenLength';
import type { ArcCoreInboundTalkWhyId } from './arcCoreInboundTalkWhy';
import { toolNameForInboundWhy } from './arcCoreInboundTalkWhy';
import { isArcCoreChatHumanFirstTurn } from './arcCoreChatCasualTalk';
import { readStellaLifeEnv, readStellaLifeUid } from './stellaLifeEnvRead';
import { snapshotStellaLifeMemory } from './stellaLifeMemory';
import { buildStellaLifePackFragment, shouldAttachStellaLifeToPack } from './stellaLifePack';
import { readStellaLifeSession } from './stellaLifeSession';
import { pickStellaQuestFieldNoteCards } from './stellaQuestFieldNote';

export const ARC_CORE_AGENT_PACK_SCHEMA = 1;
export const ARC_CORE_CHAT_CLOUD_TIMEOUT_MS = 8000;
/** 오퍼레이터 14행·근원체 9행을 한 팩에 담는 상한. 전송 1회 조립. */
export const ARC_CORE_CHAT_PERSONA_PACK_MAX = 14;

export type ArcCoreAgentPackPolicy = {
  worldWrite: false;
  maxChars: number;
  revealShadow: boolean;
  persona: NlMouthId;
};

const ORIGIN_IDENTITY_KNOWLEDGE_IDS = new Set([
  'know_identity',
  'know_office',
  'know_origin_motive',
]);

export type ArcCoreAgentPackCard = {
  id: string;
  topicId: string;
  text: string;
};

export type ArcCoreAgentPack = {
  schemaVersion: typeof ARC_CORE_AGENT_PACK_SCHEMA;
  locale: 'ko' | 'en';
  userText: string;
  workingTranscript: Array<{ role: 'user' | 'arc' | 'system'; text: string }>;
  rollingSummary: string;
  topicStack: string[];
  lastArcQuestion: string;
  stance: Exclude<ArcCoreChatStance, 'administer'>;
  purposeId: string;
  mode: ArcCoreChatDialogueMode;
  nextAsk: string;
  purposeLine: string;
  modeLine: string;
  personaFragments: string[];
  knowledgeCards: ArcCoreAgentPackCard[];
  toolResults: ArcCoreChatToolResult[];
  nuanceHint: ArcCoreChatNuanceHint;
  gm: ArcCoreChatGmSession;
  inboundWhy?: ArcCoreInboundTalkWhyId;
  spokenMax: number;
  policy: ArcCoreAgentPackPolicy;
  lifeBlock?: string;
  lifeLine?: string;
};

function pickLocaleText(ko: string, en: string, locale: 'ko' | 'en'): string {
  if (locale === 'en') return en || ko;
  return ko || en;
}

function knowledgeAllowed(
  speakIf: string,
  revealShadow: boolean,
  spyPending: boolean,
  hasCombat: boolean,
  speakerId: NlMouthId,
  knowledgeId: string,
): boolean {
  if (speakIf === 'never_before_reveal' && revealShadow) return false;
  if (speakIf === 'revealed_shadow' && !revealShadow) return false;
  if (speakIf === 'spy_pending' && !spyPending) return false;
  if (speakIf === 'has_combat' && !hasCombat) return false;
  if (speakIf === 'operator_mouth' && speakerId !== 'operator') return false;
  if (speakIf === 'origin_mouth' && speakerId !== 'arc_core') return false;
  if (speakerId === 'operator' && ORIGIN_IDENTITY_KNOWLEDGE_IDS.has(knowledgeId)) return false;
  return true;
}

export function buildArcCoreAgentPack(
  turn: ArcCoreChatTurn,
  revealShadow: boolean,
): ArcCoreAgentPack {
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const resolved = turn.inboundWhy
    ? resolveInboundOpenerPackTopic(turn.inboundWhy)
    : resolveArcCoreChatPackTopic(turn.userText, getArcCoreChatTopicStack());
  const topicId = resolved.topicId;
  const humanFirst = turn.drive.purposeId === 'invite_axis' && !turn.drive.clueTopic && turn.drive.mode === 'react';
  const cardTopicIds = mergeArcCoreChatKnowledgeTopics({
    cardTopicIds: resolved.cardTopicIds,
    clueTopic: turn.drive.clueTopic,
    humanFirst,
  });
  const toolNames = resolved.toolNames.slice();
  const askedStory = topicId === 'mission' || topicId === 'story';
  if (askedStory) {
    if (!cardTopicIds.includes('mission') && !cardTopicIds.includes('story') && cardTopicIds.length < 4) {
      cardTopicIds.push('mission');
    }
    if (!toolNames.includes('get_active_mission') && toolNames.length < 4) {
      toolNames.push('get_active_mission');
    }
  }
  const clueTool = toolNameForDialogueClue(turn.drive.clueTopic);
  if (clueTool && !toolNames.includes(clueTool) && toolNames.length < 4) {
    toolNames.push(clueTool);
  }
  const inboundTool = turn.inboundWhy ? toolNameForInboundWhy(turn.inboundWhy) : null;
  if (inboundTool && !toolNames.includes(inboundTool) && toolNames.length < 4) {
    toolNames.push(inboundTool);
  }
  if (turn.facts.vitalityTier && !toolNames.includes('get_planet_vitality') && toolNames.length < 4) {
    if (
      turn.drive.clueTopic === 'daily'
      || topicId === 'daily'
      || topicId === 'safety'
      || topicId === 'cores'
    ) {
      toolNames.push('get_planet_vitality');
    }
  }
  const toolResults = runArcCoreChatReadTools(toolNames, turn);

  const speakerId = turn.policy.persona;
  const personaFragments = listArcCoreChatPersonaRowsForSpeaker(speakerId)
    .slice(0, ARC_CORE_CHAT_PERSONA_PACK_MAX)
    .map((row) => pickLocaleText(row.textKo, row.textEn, locale))
    .filter(Boolean);

  const fieldNotes = pickStellaQuestFieldNoteCards({
    speakerId,
    locale,
    userText: turn.userText,
  });
  const knowledgeCards: ArcCoreAgentPackCard[] = [];
  for (let i = 0; i < fieldNotes.length && knowledgeCards.length < 3; i += 1) {
    knowledgeCards.push(fieldNotes[i]!);
  }
  const knowledgeCap = fieldNotes.length > 0 ? 6 : 4;
  const knowledge = listArcCoreChatKnowledgeRows();
  for (let i = 0; i < knowledge.length && knowledgeCards.length < knowledgeCap; i += 1) {
    const row = knowledge[i]!;
    if (!cardTopicIds.includes(row.topicId)) continue;
    if (
      !knowledgeAllowed(
        row.speakIf,
        revealShadow,
        turn.facts.spyAlertPending,
        turn.facts.hasCombatRecord,
        speakerId,
        row.id,
      )
    ) {
      continue;
    }
    const text = pickLocaleText(row.textKo, row.textEn, locale);
    if (!text) continue;
    knowledgeCards.push({ id: row.id, topicId: row.topicId, text });
  }

  const workingTranscript: ArcCoreAgentPack['workingTranscript'] = [];
  for (let i = 0; i < turn.recent.length && workingTranscript.length < 8; i += 1) {
    const row = turn.recent[i];
    if (!row?.text) continue;
    workingTranscript.push({ role: row.role, text: row.text });
  }

  const topicStack = [...getArcCoreChatTopicStack()];
  if (topicId && topicStack[topicStack.length - 1] !== topicId) {
    topicStack.push(topicId);
    if (topicStack.length > 4) topicStack.splice(0, topicStack.length - 4);
  }

  const purposeRow = findArcCoreChatPurposeRow(turn.drive.purposeId);
  const modeRow = findArcCoreChatModeRow(turn.drive.mode);
  const inboundWhy = turn.inboundWhy;
  const humanFirstTalk = isArcCoreChatHumanFirstTurn({
    intent: turn.intent,
    topicId: turn.topicId || topicId,
    userText: turn.userText,
  });
  let lifeBlock = '';
  let lifeLine = '';
  if (shouldAttachStellaLifeToPack({ speakerId, inboundWhy, originHold: false })) {
    const nowMs = Date.now();
    const frag = buildStellaLifePackFragment({
      resolved: readStellaLifeSession(nowMs, readStellaLifeUid(), readStellaLifeEnv(nowMs)),
      snapshot: snapshotStellaLifeMemory(),
      humanFirst: humanFirstTalk || humanFirst,
      locale,
    });
    lifeBlock = frag.block;
    lifeLine = frag.lifeLine;
  }
  const purposeLine = inboundWhy
    ? pickLocaleText(
      '플레이어가 대화 요청을 수락했다. 네가 먼저 질문 하나로 말하라.',
      'The player accepted the talk request. You speak first with one question.',
      locale,
    )
    : purposeRow
      ? pickLocaleText(purposeRow.textKo, purposeRow.textEn, locale)
      : '';
  const modeLine = inboundWhy
    ? pickLocaleText(
      '적 입(근원체) 구어 질문 하나만. 창을 열었다고 말하지 마라.',
      'One enemy-mouth spoken question. Do not announce that a window opened.',
      locale,
    )
    : modeRow
      ? pickLocaleText(modeRow.textKo, modeRow.textEn, locale)
      : '';

  return {
    schemaVersion: ARC_CORE_AGENT_PACK_SCHEMA,
    locale,
    userText: turn.userText.slice(0, 500),
    workingTranscript,
    rollingSummary: getArcCoreChatRollingSummary(),
    topicStack,
    lastArcQuestion: '',
    stance: turn.stance,
    purposeId: turn.drive.purposeId,
    mode: turn.drive.mode,
    nextAsk: turn.drive.nextAsk,
    purposeLine,
    modeLine,
    personaFragments,
    knowledgeCards,
    toolResults,
    nuanceHint: hintArcCoreChatNuance(turn.userText),
    gm: readArcCoreChatGmSession(locale),
    inboundWhy,
    spokenMax: spokenLineBudgetForTurn(turn),
    policy: {
      worldWrite: false,
      maxChars: 1200,
      revealShadow,
      persona: speakerId,
    },
    lifeBlock,
    lifeLine,
  };
}
