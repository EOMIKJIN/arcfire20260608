// 한 턴 계약 — 순수. 스토어/월드 import 금지.

import {
  resolveArcCoreChatDialogueDrive,
  resolveArcCoreChatStanceFromDrive,
  type ArcCoreChatDialogueDrive,
} from './arcCoreChatDialogueDrive';
import {
  classifyArcCoreChatIntent,
  type ArcCoreChatIntent,
} from './arcCoreChatIntent';
import { type ArcCoreChatStance } from './arcCoreChatStance';
import { isArcCoreChatFollowUp } from './arcCoreChatDialogueState';
import type { ArcCoreInboundTalkWhyId } from './arcCoreInboundTalkWhy';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';
import { hintArcCoreChatTopicId } from './arcCoreChatTableIndex';

export const ARC_CORE_CHAT_RECENT_TURNS = 8;

export type ArcCoreChatTurnRole = 'user' | 'arc' | 'system';

export type ArcCoreChatTurnRecent = {
  role: ArcCoreChatTurnRole;
  text: string;
  reason?: string;
};

export type ArcCoreChatFactSnapshot = {
  planetLabel: string;
  spyAlertPending: boolean;
  hasCombatRecord: boolean;
  hasStoryBeat?: boolean;
  dailyOpsSettledToday?: boolean;
  miningAllowanceExhausted?: boolean;
  vitalityTier?: string;
  hasActiveMission?: boolean;
  hasTradePort?: boolean;
  hasShipyard?: boolean;
  pendingProposalId?: string;
  lastAcceptedProposalId?: string;
  lastRefusedProposalId?: string;
  preferTag?: string;
  lastOrbitCommCaptainName?: string;
  worldChangeDigestLine?: string;
};

export type ArcCoreChatAlreadyCovered = {
  greeted: boolean;
  location: boolean;
  spy: boolean;
  combat: boolean;
  other: boolean;
  mission?: boolean;
  mining?: boolean;
  daily?: boolean;
};

export type ArcCoreChatTurnPolicy = {
  worldWrite: false;
  maxChars: number;
  persona: NlMouthId;
};

export type ArcCoreChatTurn = {
  userText: string;
  intent: ArcCoreChatIntent;
  stance: Exclude<ArcCoreChatStance, 'administer'>;
  topicId: string;
  facts: ArcCoreChatFactSnapshot;
  recent: readonly ArcCoreChatTurnRecent[];
  alreadyCovered: ArcCoreChatAlreadyCovered;
  drive: ArcCoreChatDialogueDrive;
  policy: ArcCoreChatTurnPolicy;
  inboundWhy?: ArcCoreInboundTalkWhyId;
};

const EMPTY_COVERED: ArcCoreChatAlreadyCovered = {
  greeted: false,
  location: false,
  spy: false,
  combat: false,
  other: false,
};

export const ARC_CORE_CHAT_TURN_POLICY: ArcCoreChatTurnPolicy = {
  worldWrite: false,
  maxChars: 1200,
  persona: 'arc_core',
};

export function inferArcCoreChatAlreadyCovered(
  recent: readonly ArcCoreChatTurnRecent[],
): ArcCoreChatAlreadyCovered {
  const covered: ArcCoreChatAlreadyCovered = { ...EMPTY_COVERED };
  for (let i = 0; i < recent.length; i += 1) {
    const row = recent[i];
    if (!row || row.role !== 'user') continue;
    const intent = classifyArcCoreChatIntent(row.text);
    if (intent === 'greet') covered.greeted = true;
    else if (intent === 'location') covered.location = true;
    else if (intent === 'spy') covered.spy = true;
    else if (intent === 'combat') covered.combat = true;
    else if (intent === 'other') covered.other = true;
    const topic = hintArcCoreChatTopicId(row.text);
    if (topic === 'mission' || topic === 'story') covered.mission = true;
    if (topic === 'mining') covered.mining = true;
    if (topic === 'daily') covered.daily = true;
  }
  return covered;
}

export function sliceArcCoreChatRecent(
  messages: readonly ArcCoreChatTurnRecent[],
): ArcCoreChatTurnRecent[] {
  if (messages.length <= ARC_CORE_CHAT_RECENT_TURNS) {
    return messages.slice();
  }
  return messages.slice(-ARC_CORE_CHAT_RECENT_TURNS);
}

export function buildArcCoreChatTurn(
  userText: string,
  recent: readonly ArcCoreChatTurnRecent[],
  facts: ArcCoreChatFactSnapshot,
  speakerId?: NlMouthId,
  allowLead = true,
): ArcCoreChatTurn {
  const sliced = sliceArcCoreChatRecent(recent);
  const intent = classifyArcCoreChatIntent(userText);
  const topicId = hintArcCoreChatTopicId(userText);
  const alreadyCovered = inferArcCoreChatAlreadyCovered(sliced);
  const drive = resolveArcCoreChatDialogueDrive({
    intent,
    topicId,
    facts,
    alreadyCovered,
    followUp: isArcCoreChatFollowUp(userText),
    userText,
    allowLead,
  });
  const stance = resolveArcCoreChatStanceFromDrive(drive);
  return {
    userText: userText.trim(),
    intent,
    stance,
    topicId,
    facts,
    recent: sliced,
    alreadyCovered,
    drive,
    policy: speakerId
      ? { worldWrite: false, maxChars: 1200, persona: speakerId }
      : ARC_CORE_CHAT_TURN_POLICY,
  };
}
