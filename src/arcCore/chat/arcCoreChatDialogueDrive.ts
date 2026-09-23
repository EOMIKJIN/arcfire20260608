// 목적 → 대화 방식. 월드 write 없음.
// 기본층 = 일상 대화. 시스템 연동은 물은 축·정세 탐색 위에만.

import {
  isArcCoreChatHumanFirstTurn,
  isArcCoreChatWorldSeeking,
} from './arcCoreChatCasualTalk';
import type { ArcCoreChatIntent } from './arcCoreChatIntent';
import type { ArcCoreChatStance } from './arcCoreChatStance';
import type { ArcCoreChatAlreadyCovered, ArcCoreChatFactSnapshot } from './arcCoreChatTurn';
import { suggestArcCoreChatWorldProposal } from './arcCoreChatWorldProposal';

export const ARC_CORE_CHAT_DIALOGUE_MODES = ['react', 'lead', 'clue', 'hold'] as const;

export type ArcCoreChatDialogueMode = (typeof ARC_CORE_CHAT_DIALOGUE_MODES)[number];

export type ArcCoreChatDialogueDrive = {
  purposeId: string;
  mode: ArcCoreChatDialogueMode;
  reactTopic: string | null;
  clueTopic: string | null;
  nextAsk: string;
};

const ASKED_SYSTEM_TOPICS = new Set([
  'location',
  'spy',
  'combat',
  'safety',
  'notice',
  'mission',
  'story',
  'self',
  'mining',
  'daily',
  'seats',
  'cores',
  'trade',
  'shipyard',
  'nations',
  'routes',
  'setting',
]);

function askedSystemTopic(intent: ArcCoreChatIntent, topicId: string): string | null {
  const topic = topicId.trim();
  if (ASKED_SYSTEM_TOPICS.has(topic)) return topic;
  if (intent === 'location') return 'location';
  if (intent === 'spy') return 'spy';
  if (intent === 'combat') return 'combat';
  return null;
}

function purposeForAsked(asked: string | null): string {
  if (asked === 'self' || asked === 'seats') return 'name_self';
  if (asked === 'location' || asked === 'safety' || asked === 'cores') return 'anchor_location';
  if (asked === 'combat') return 'close_combat';
  if (asked === 'spy') return 'surface_alert';
  if (asked === 'mission' || asked === 'story') return 'guide_story';
  return 'invite_axis';
}

function pickEmptyAxisDrive(
  facts: ArcCoreChatFactSnapshot,
  covered: ArcCoreChatAlreadyCovered,
): Pick<ArcCoreChatDialogueDrive, 'purposeId' | 'mode' | 'clueTopic' | 'nextAsk'> | null {
  if (facts.spyAlertPending && !covered.spy) {
    return { purposeId: 'surface_alert', mode: 'clue', clueTopic: 'spy', nextAsk: 'spy' };
  }
  if (facts.miningAllowanceExhausted && !covered.mining) {
    return { purposeId: 'invite_axis', mode: 'clue', clueTopic: 'mining', nextAsk: 'mining' };
  }
  if (facts.dailyOpsSettledToday && !covered.daily) {
    return { purposeId: 'invite_axis', mode: 'lead', clueTopic: 'daily', nextAsk: 'daily' };
  }
  if (facts.hasCombatRecord && !covered.combat) {
    return { purposeId: 'close_combat', mode: 'clue', clueTopic: 'combat', nextAsk: 'combat' };
  }
  if (facts.hasStoryBeat && !covered.mission) {
    return { purposeId: 'guide_story', mode: 'clue', clueTopic: 'mission', nextAsk: 'mission' };
  }
  const proposal = suggestArcCoreChatWorldProposal({
    hasTradePort: facts.hasTradePort,
    hasShipyard: facts.hasShipyard,
    lastRefusedProposalId: facts.lastRefusedProposalId,
  });
  if (proposal === 'open_trade') {
    return { purposeId: 'invite_axis', mode: 'lead', clueTopic: 'trade', nextAsk: 'open_trade' };
  }
  if (proposal === 'open_shipyard') {
    return { purposeId: 'invite_axis', mode: 'lead', clueTopic: 'shipyard', nextAsk: 'open_shipyard' };
  }
  return null;
}

function keepHumanTalk(reactTopic: string | null): ArcCoreChatDialogueDrive {
  return {
    purposeId: 'invite_axis',
    mode: 'react',
    reactTopic,
    clueTopic: null,
    nextAsk: '',
  };
}

export function resolveArcCoreChatDialogueDrive(input: {
  intent: ArcCoreChatIntent;
  topicId: string;
  facts: ArcCoreChatFactSnapshot;
  alreadyCovered: ArcCoreChatAlreadyCovered;
  followUp?: boolean;
  userText?: string;
  /** 스텔라 숙련 밴드. 기본 true(근원체·미지정). false면 lead를 clue로 낮춤 */
  allowLead?: boolean;
}): ArcCoreChatDialogueDrive {
  const topic = input.topicId.trim();
  if (input.intent === 'refuse' || topic === 'refuse') {
    return {
      purposeId: 'keep_mouth_body',
      mode: 'hold',
      reactTopic: null,
      clueTopic: null,
      nextAsk: '',
    };
  }

  const spoken = input.userText?.trim() ?? '';
  if (
    isArcCoreChatHumanFirstTurn({
      intent: input.intent,
      topicId: topic,
      userText: spoken,
    })
  ) {
    const humanTopic = topic === 'smalltalk' || input.intent === 'greet' ? topic || 'greet' : topic || null;
    return keepHumanTalk(humanTopic === 'other' ? null : humanTopic);
  }

  const asked = askedSystemTopic(input.intent, topic);
  if (asked) {
    return {
      purposeId: purposeForAsked(asked),
      mode: 'react',
      reactTopic: asked,
      clueTopic: null,
      nextAsk: '',
    };
  }

  if (!spoken || !isArcCoreChatWorldSeeking(spoken)) {
    return keepHumanTalk(null);
  }

  const empty = pickEmptyAxisDrive(input.facts, input.alreadyCovered);
  if (empty) {
    const mode = empty.mode === 'lead' && input.allowLead === false ? 'clue' : empty.mode;
    return {
      purposeId: empty.purposeId,
      mode,
      reactTopic: null,
      clueTopic: empty.clueTopic,
      nextAsk: empty.nextAsk,
    };
  }

  return keepHumanTalk(null);
}

export function resolveArcCoreChatStanceFromDrive(
  drive: ArcCoreChatDialogueDrive,
): Exclude<ArcCoreChatStance, 'administer'> {
  if (drive.mode === 'hold') return 'refuse';
  if (drive.purposeId === 'surface_alert') return 'warn';
  return 'observe';
}

export function clueKeyForDialogueDrive(drive: ArcCoreChatDialogueDrive): string | undefined {
  if (drive.mode === 'hold' || !drive.clueTopic) return undefined;
  if (drive.clueTopic === drive.reactTopic) return undefined;
  if (drive.clueTopic === 'spy') return 'arcCoreChat.drive.clue.spy';
  if (drive.clueTopic === 'combat') return 'arcCoreChat.drive.clue.combat';
  if (drive.clueTopic === 'location') return 'arcCoreChat.drive.clue.location';
  if (drive.clueTopic === 'mission' || drive.clueTopic === 'story') {
    return 'arcCoreChat.drive.clue.mission';
  }
  if (drive.clueTopic === 'mining') return 'arcCoreChat.drive.clue.mining';
  if (drive.clueTopic === 'daily') return 'arcCoreChat.drive.clue.daily';
  if (drive.clueTopic === 'trade') return 'arcCoreChat.drive.clue.trade';
  if (drive.clueTopic === 'shipyard') return 'arcCoreChat.drive.clue.shipyard';
  if (drive.clueTopic === 'cores') return 'arcCoreChat.drive.clue.cores';
  if (drive.clueTopic === 'seats') return 'arcCoreChat.drive.clue.seats';
  return undefined;
}

export function toolNameForDialogueClue(clueTopic: string | null): string | null {
  if (clueTopic === 'spy') return 'get_spy_alert';
  if (clueTopic === 'combat') return 'get_last_combat';
  if (clueTopic === 'mining') return 'get_mining_allowance';
  if (clueTopic === 'daily') return 'get_daily_ops_status';
  if (clueTopic === 'mission' || clueTopic === 'story') return 'get_active_mission';
  if (clueTopic === 'location' || clueTopic === 'safety' || clueTopic === 'cores') {
    return 'get_planet_cores';
  }
  return null;
}
