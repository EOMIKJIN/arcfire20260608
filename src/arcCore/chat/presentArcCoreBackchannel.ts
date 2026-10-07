import { isIngameDialogActive } from '../../game/ingameDialog/ingameDialogApi';
import { t } from '../../i18n';
import {
  filterArcCoreChatReplyPrior,
  hasArchivedArcCoreChatConversation,
  liveArcCoreChatSession,
  pickArcCoreChatSessionHistory,
  useArcCoreChatStore,
} from '../../store/arcCoreChatStore';
import {
  ARC_CORE_CHAT_OVERLAY_ID,
  HUB_TALK_ROSTER_OVERLAY_ID,
  useArcOverlayStore,
} from '../../ui/overlay/arcOverlayStore';
import {
  isArcCoreAgentSurfaceOpen,
  isArcCoreAgentSurfaceReopenLocked,
  useArcCoreAgentSurfaceStore,
} from './arcCoreAgentSurfaceStore';
import { isArcCoreAgentSurfaceCombatBlocked } from './arcCoreAgentSurfaceCombatGate';
import { buildArcCoreBackchannelReply } from './arcCoreBackchannelReply';
import {
  arcCoreBackchannelTriggerKey,
  type PresentArcCoreBackchannelInput,
} from './arcCoreBackchannelTriggers';
import {
  applyFirstScanTalkToReply,
  countSessionUserTurns,
  isFirstScanSession,
} from './firstScanOperatorTalk';
import {
  dismissArcCoreBootChatFirstToTitle,
  isArcCoreBootChatFirstActive,
} from './arcCoreBootChatFirstGate';
import { isArcCoreBootChatFirstStartPhrase } from './arcCoreBootChatFirstPhrases';
import { resolveArcCoreChatOpenSpeech } from './arcCoreChatOpenSpeech';
import { noteArcCoreChatPresented } from './arcCoreInboundTalkRequest';
import { resetArcCoreChatCloudSkip } from './arcCoreChatCloudSkip';
import { isArcCoreTutorialForceActive } from './arcCoreChatTutorialForce';
import { isArcCoreOriginPlayerTalkUnlocked } from './arcCoreOriginTalkUnlock';
import {
  defaultNlMouthForBackchannelReason,
  resolveChatReplySpeaker,
  shouldHoldOriginMouth,
} from './resolveChatReplySpeaker';
import { markStellaReachRead, readStellaObserveGate } from './stellaObserveGateMemory';
import { STELLA_REACH_REASON, stellaReachSessionLines } from './stellaReachCatchUp';

/** 새 줄로 붙을 안 읽은 연락(최대 STELLA_REACH_KEEP)은 기록에서 뺀다 — 같은 말이 두 번 보이지 않게. */
function isQueuedReach(fresh: readonly { atMs: number }[], atMs: number): boolean {
  for (let i = 0; i < fresh.length; i += 1) if (fresh[i]!.atMs === atMs) return true;
  return false;
}

function isArcCoreChatOpen(): boolean {
  if (isArcCoreAgentSurfaceOpen()) return true;
  return useArcOverlayStore.getState().stack.some((e) => e.kind === 'arcCoreChat');
}

function presentChatPanel(): boolean {
  // 이전 클라우드 hard/transient skip 잔류로 템플릿만 나오는 회귀 방지
  resetArcCoreChatCloudSkip();
  useArcOverlayStore.getState().dismissWhere(
    (e) => e.id === ARC_CORE_CHAT_OVERLAY_ID || e.id === HUB_TALK_ROSTER_OVERLAY_ID,
  );
  return useArcCoreAgentSurfaceStore.getState().activateAgent();
}

export async function presentArcCoreBackchannel(
  input: PresentArcCoreBackchannelInput,
): Promise<boolean> {
  if (isIngameDialogActive()) return false;
  if (isArcCoreAgentSurfaceCombatBlocked()) return false;
  if (isArcCoreAgentSurfaceReopenLocked()) return false;

  const chat = useArcCoreChatStore.getState();
  if (input.immediate) {
    void chat.ensureHydrated();
  } else {
    await chat.ensureHydrated();
  }

  const fired = arcCoreBackchannelTriggerKey(input.reason, input.triggerId);
  if (fired && !input.forceFreshSession && chat.wasTriggerFired(fired.key, fired.id)) {
    if (isArcCoreChatOpen()) return true;
    return false;
  }
  if (fired && !input.immediate) {
    useArcCoreChatStore.getState().markTriggerFired(fired.key, fired.id);
  }

  const alreadyOpen = isArcCoreChatOpen();
  const opener = (input.openerText ?? '').trim();
  const openSpeaker = input.speakerId ?? defaultNlMouthForBackchannelReason(input.reason);
  if (
    input.reason === 'manual'
    && openSpeaker === 'arc_core'
    && !isArcCoreOriginPlayerTalkUnlocked()
  ) {
    return false;
  }
  const live = useArcCoreChatStore.getState();
  live.setActiveSpeakerId(openSpeaker);
  live.setOriginHold(shouldHoldOriginMouth(input.reason));
  live.setRestoreOperatorOnNextSend(false);

  if (!alreadyOpen || input.forceFreshSession) {
    const returning =
      !input.immediate && hasArchivedArcCoreChatConversation(useArcCoreChatStore.getState().messages);
    const playIntro =
      openSpeaker === 'operator'
      && !opener
      && !live.operatorIntroPlayed;
    const speech = resolveArcCoreChatOpenSpeech({
      openerText: playIntro ? t('arcCoreChat.operator.intro') : opener,
      reason: input.reason,
      returning,
      welcome: openSpeaker === 'operator' ? t('arcCoreChat.operator.welcome') : t('arcCoreChat.session.welcome'),
      welcomeBack:
        openSpeaker === 'operator'
          ? t('arcCoreChat.operator.welcomeBack')
          : t('arcCoreChat.session.welcomeBack'),
    });
    const archive = useArcCoreChatStore.getState().messages;
    const fresh = stellaReachSessionLines(archive, readStellaObserveGate().lastReadAtMs);
    const history = pickArcCoreChatSessionHistory(
      archive,
      fresh.length === 0
        ? undefined
        : (row) => row.reason === STELLA_REACH_REASON && isQueuedReach(fresh, row.atMs),
    );
    useArcCoreChatStore.getState().beginFreshSession({
      text: speech.text,
      reason: speech.reason,
      speakerId: openSpeaker,
      history,
    });
    if (playIntro) {
      useArcCoreChatStore.getState().markOperatorIntroPlayed();
    }
  } else if (opener) {
    useArcCoreChatStore.getState().appendMessage({
      role: 'arc',
      text: opener,
      reason: input.reason,
      speakerId: openSpeaker,
    });
  }

  let queuedReach = false;
  if (openSpeaker === 'operator') {
    const gate = readStellaObserveGate();
    const queued = stellaReachSessionLines(useArcCoreChatStore.getState().messages, gate.lastReadAtMs);
    for (let i = 0; i < queued.length; i += 1) {
      useArcCoreChatStore.getState().appendSessionOnly({
        role: 'arc',
        text: queued[i]!.text,
        reason: 'stella_reach',
        speakerId: 'operator',
      });
    }
    queuedReach = true;
  }

  if (!alreadyOpen) {
    if (!presentChatPanel()) return false;
    if (input.reason !== 'inbound_request') {
      noteArcCoreChatPresented();
    }
  }
  if (queuedReach) {
    markStellaReachRead(Date.now());
    useArcCoreChatStore.getState().touchPersist();
  }
  return true;
}

export type SubmitArcCoreBackchannelResult = {
  ok: boolean;
  reply: string | null;
  dismissedForTitle?: boolean;
  /** 개발자 진단용 — __DEV__ 배지 표시 외 게임 로직에서 사용 금지. */
  providerId?: 'local' | 'cloud';
  fallbackUsed?: boolean;
};

/** 유저 줄만 저장하고 회신 문장을 돌려준다. 아크 줄 append는 스크롤 정상화 후 UI가 한다. */
export async function submitArcCoreBackchannelMessage(
  raw: string,
): Promise<SubmitArcCoreBackchannelResult> {
  const text = raw.trim();
  if (!text) return { ok: false, reply: null };
  const chat = useArcCoreChatStore.getState();
  await chat.ensureHydrated();
  if (isArcCoreBootChatFirstActive() && isArcCoreBootChatFirstStartPhrase(text)) {
    chat.appendMessage({ role: 'user', text, reason: 'manual' });
    dismissArcCoreBootChatFirstToTitle();
    return { ok: true, reply: null, dismissedForTitle: true };
  }
  chat.consumeRestoreOperatorOnNextSend();
  const stayOperator =
    isArcCoreTutorialForceActive()
    || isFirstScanSession(liveArcCoreChatSession(useArcCoreChatStore.getState().sessionMessages));
  const speaker = resolveChatReplySpeaker({
    activeSpeaker: useArcCoreChatStore.getState().activeSpeakerId,
    userText: text,
    originHold: useArcCoreChatStore.getState().originHold,
    tutorialForce: stayOperator,
  });
  useArcCoreChatStore.getState().setActiveSpeakerId(speaker);
  const user = chat.appendMessage({ role: 'user', text, reason: 'manual' });
  if (!user) return { ok: false, reply: null };
  try {
    resetArcCoreChatCloudSkip();
    const session = liveArcCoreChatSession(useArcCoreChatStore.getState().sessionMessages);
    const prior = filterArcCoreChatReplyPrior(session.slice(0, -1));
    const result = await buildArcCoreBackchannelReply(user.text, prior, speaker);
    if (useArcCoreChatStore.getState().originHold || speaker === 'arc_core') {
      useArcCoreChatStore.getState().setOriginHold(false);
      useArcCoreChatStore.getState().setRestoreOperatorOnNextSend(true);
    }
    let replyText = result.text;
    if (isFirstScanSession(session)) {
      replyText = applyFirstScanTalkToReply({
        userText: user.text,
        pipelineReply: result.text,
        userTurnCount: countSessionUserTurns(session),
      });
    }
    if (!replyText.trim()) return { ok: false, reply: null };
    return {
      ok: true,
      reply: replyText,
      providerId: result.providerId,
      fallbackUsed: result.fallbackUsed,
    };
  } catch {
    return { ok: false, reply: null };
  }
}
