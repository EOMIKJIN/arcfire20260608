// 회신 Provider — 클라는 벤더 SDK/키를 갖지 않는다. cloud 실패면 로컬 F5.

import { t } from '../../i18n';
import { useArcCoreChatStore } from '../../store/arcCoreChatStore';
import { useArcCoreShadowIdentityStore } from '../../store/arcCoreShadowIdentityStore';
import { buildArcCoreAgentPack, type ArcCoreAgentPack } from './arcCoreAgentPack';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';
import {
  foldArcCoreChatRollingSummary,
  pushArcCoreChatTopic,
  rememberArcCoreChatAskedFromReply,
  rememberArcCoreChatTopics,
  setArcCoreChatLastQuestion,
} from './arcCoreChatDialogueState';
import { resolveArcCoreChatReplyOrLastResort } from './arcCoreChatReplyFallback';
import { endArcCoreChatTurn, tryBeginArcCoreChatTurn } from './arcCoreChatTurnGate';
import { finalizeArcCoreChatSpokenReply } from './arcCoreChatSpokenLength';
import { tryCompleteCloudArcCoreChatReply } from './cloudConversationalProvider';
import { localConversationalProvider } from './localConversationalProvider';
import {
  quarantineArcCoreChatReply,
  sanitizeArcCoreChatAskedQuestion,
} from './quarantineArcCoreChatReply';
import { sanitizeArcCoreChatCloudTopicIds } from './sanitizeArcCoreChatCloudTopicIds';
import {
  classifyArcCoreChatProposalReply,
  recordArcCoreChatProposalDecision,
  setArcCoreChatPendingProposalId,
} from './arcCoreChatJudgmentMemory';
import { isArcCoreChatExecutableProposalId } from './arcCoreChatWorldProposal';
import {
  executeArcCoreChatWorldProposal,
  presentArcCoreChatWorldProposalConfirm,
} from './arcCoreChatWorldProposalExecute';
import { parseArcCoreChatActionRequest } from './arcCoreChatActionRequest';
import { setArcCoreChatActionPayload } from './arcCoreChatActionPayload';
import { noteStellaLifeAfterOperatorReply } from './stellaLifeNote';

export type ArcCoreChatReplyProviderId = 'local' | 'cloud';

export type ArcCoreChatReplyResult = {
  text: string;
  providerId: ArcCoreChatReplyProviderId;
  fallbackUsed: boolean;
};

export type ArcCoreChatReplyProvider = {
  readonly id: ArcCoreChatReplyProviderId;
  complete(turn: ArcCoreChatTurn, pack?: ArcCoreAgentPack): Promise<ArcCoreChatReplyResult>;
};

/** 외부 훅용. 본선은 로컬. 클라우드는 Spark 기간 게이트 off. */
export function getArcCoreChatReplyProvider(): ArcCoreChatReplyProvider {
  return localConversationalProvider;
}

function rememberDialogue(
  packTopic: string | undefined,
  text: string,
  userText: string,
  extra?: { topicIds?: readonly string[]; askedQuestion?: string; revealShadow?: boolean },
): void {
  if (extra?.topicIds && extra.topicIds.length > 0) {
    rememberArcCoreChatTopics(extra.topicIds);
  } else if (packTopic) {
    pushArcCoreChatTopic(packTopic);
  }
  const asked = extra?.askedQuestion
    ? sanitizeArcCoreChatAskedQuestion(extra.askedQuestion, extra.revealShadow === true)
    : '';
  if (asked) setArcCoreChatLastQuestion(asked);
  else rememberArcCoreChatAskedFromReply(text);
  foldArcCoreChatRollingSummary(userText, text);
  useArcCoreChatStore.getState().touchPersist();
}

function readCurrentPlanetId(): string {
  try {
    const { usePlayerStore } =
      require('../../store/playerStore') as typeof import('../../store/playerStore');
    return usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
  } catch {
    return '';
  }
}

function applyArcCoreChatJudgmentAfterReply(turn: ArcCoreChatTurn): void {
  const explicit = parseArcCoreChatActionRequest(turn.userText, {
    currentPlanetId: readCurrentPlanetId(),
  });
  if (explicit) {
    setArcCoreChatActionPayload(explicit);
    if (!executeArcCoreChatWorldProposal(explicit.id)) {
      presentArcCoreChatWorldProposalConfirm(explicit.id);
    }
    useArcCoreChatStore.getState().touchPersist();
    return;
  }

  const pending = turn.facts.pendingProposalId?.trim() ?? '';
  const verdict = classifyArcCoreChatProposalReply(turn.userText);
  if (pending && isArcCoreChatExecutableProposalId(pending) && verdict === 'accept') {
    if (!executeArcCoreChatWorldProposal(pending)) {
      presentArcCoreChatWorldProposalConfirm(pending);
    }
    useArcCoreChatStore.getState().touchPersist();
    return;
  }
  if (pending && verdict === 'refuse') {
    recordArcCoreChatProposalDecision(pending, 'refuse');
    useArcCoreChatStore.getState().touchPersist();
    return;
  }
  const ask = turn.drive.nextAsk.trim();
  if (turn.drive.mode === 'lead' && isArcCoreChatExecutableProposalId(ask)) {
    setArcCoreChatPendingProposalId(ask);
    presentArcCoreChatWorldProposalConfirm(ask);
    useArcCoreChatStore.getState().touchPersist();
  }
}

export async function completeArcCoreChatReply(
  turn: ArcCoreChatTurn,
): Promise<ArcCoreChatReplyResult> {
  const lastResort = t('arcCoreChat.fail');
  if (!tryBeginArcCoreChatTurn()) {
    return { text: lastResort, providerId: 'local', fallbackUsed: true };
  }
  try {
    const revealShadow = useArcCoreShadowIdentityStore.getState().revealedAtMs != null;
    const pack = buildArcCoreAgentPack(turn, revealShadow);
    const topic = pack.topicStack[pack.topicStack.length - 1];

    try {
      const cloud = await tryCompleteCloudArcCoreChatReply(pack);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[arcCoreChat] cloud', cloud.status);
      }
      if (cloud.status === 'ok') {
        const rawCloud = cloud.reply.text;
        let quarantined = quarantineArcCoreChatReply(rawCloud, pack);
        // 검역이 과도하게 버린 경우(형식만 문제) 짧은 본문은 소프트 수용
        if (!quarantined) {
          const soft = String(rawCloud ?? '').trim().slice(0, pack.policy.maxChars);
          if (soft && !/^\s*(\{|\[|```)/.test(soft)) {
            quarantined = soft;
          }
        }
        if (quarantined) {
          quarantined = finalizeArcCoreChatSpokenReply(quarantined, turn);
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              '[arcCoreChat] provider=cloud len=',
              quarantined.length,
              'preview=',
              quarantined.slice(0, 40),
            );
          }
          rememberDialogue(topic, quarantined, turn.userText, {
            topicIds: sanitizeArcCoreChatCloudTopicIds(cloud.reply.topicIds, pack.topicStack),
            askedQuestion: cloud.reply.askedQuestion,
            revealShadow,
          });
          noteStellaLifeAfterOperatorReply({
            turn,
            usedLifeLine: Boolean(pack.lifeLine && quarantined.includes(pack.lifeLine)),
          });
          applyArcCoreChatJudgmentAfterReply(turn);
          return { text: quarantined, providerId: 'cloud', fallbackUsed: false };
        }
      }
      if (cloud.status === 'free_tier_exhausted') {
        const notice = t('arcCoreChat.freeTierExhausted');
        rememberDialogue(topic, notice, turn.userText);
        applyArcCoreChatJudgmentAfterReply(turn);
        return { text: notice, providerId: 'local', fallbackUsed: true };
      }
    } catch {
      /* F5 */
    }

    try {
      const fallback = await localConversationalProvider.complete(turn, pack);
      const localText = quarantineArcCoreChatReply(fallback.text, pack);
      const text = finalizeArcCoreChatSpokenReply(
        resolveArcCoreChatReplyOrLastResort(localText ?? '', lastResort),
        turn,
      );
      if (text) {
        rememberDialogue(topic, text, turn.userText);
        noteStellaLifeAfterOperatorReply({
          turn,
          usedLifeLine: Boolean(pack.lifeLine && text.includes(pack.lifeLine)),
        });
        applyArcCoreChatJudgmentAfterReply(turn);
        return { ...fallback, text, fallbackUsed: true };
      }
    } catch {
      /* last-resort */
    }

    return {
      text: lastResort,
      providerId: 'local',
      fallbackUsed: true,
    };
  } finally {
    endArcCoreChatTurn();
  }
}
