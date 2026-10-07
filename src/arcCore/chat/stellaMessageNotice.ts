// 스텔라 선제 메시지는 메신저 보관함에 남는다. 확인 안 한 묶음의 첫 메시지만 팝업으로 알린다.
// 팝업의 [확인]은 메신저로 간다. 다만 첫 입장이 아직이거나 허브 가이드가 진행 중이면
// 수락/거절 통신이 메신저로 가는 문이라, 그 팝업은 띄우지 않는다.

import { t } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import { useArcCoreChatStore } from '../../store/arcCoreChatStore';
import { STELLA_REACH_REASON } from './stellaReachCatchUp';
import {
  markStellaMessageNotified,
  readStellaObserveGate,
  subscribeStellaHubTalkBadge,
} from './stellaObserveGateMemory';

export const STELLA_LIFE_MESSAGE_REASON = 'operator_life';
export const STELLA_MESSAGE_NOTICE_ALERT_ID = 'stella_message_notice';
const SITUATION_PREFIX = 'sit_';

export function isStellaProactiveReason(reason: string | undefined): boolean {
  if (!reason) return false;
  return reason === STELLA_REACH_REASON
    || reason === STELLA_LIFE_MESSAGE_REASON
    || reason.startsWith(SITUATION_PREFIX);
}

export function countStellaUnreadMessages(
  messages: readonly { role: string; reason?: string; atMs: number }[],
  lastReadAtMs: number,
): number {
  let n = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const row = messages[i];
    if (!row || row.atMs <= lastReadAtMs) continue;
    if (row.role === 'arc' && isStellaProactiveReason(row.reason)) n += 1;
  }
  return n;
}

/** [대화] 버튼 붉은 점. 확인으로 메신저를 열면 lastReadAtMs가 올라 꺼진다. */
export function readStellaHubTalkBadge(): boolean {
  const chat = useArcCoreChatStore.getState();
  if (!chat.hydrated) return false;
  return countStellaUnreadMessages(chat.messages, readStellaObserveGate().lastReadAtMs) > 0;
}

export { subscribeStellaHubTalkBadge };

/** 안 읽은 게 있고, 마지막으로 읽은 뒤 아직 알리지 않았을 때만. */
export function shouldNotifyStellaMessage(
  unread: number,
  gate: { lastReadAtMs: number; notifiedAtMs: number },
): boolean {
  return unread > 0 && gate.notifiedAtMs <= gate.lastReadAtMs;
}

/**
 * 수락/거절이 메신저 문인 동안에는 「메시지가 있습니다」를 띄우지 않는다.
 * 허브 가이드(착륙~출발 안내)와, 오퍼레이터 첫 입장을 아직 안 한 상태가 그 구간이다.
 */
export function shouldHoldStellaMessageNotice(input: {
  operatorIntroPlayed: boolean;
  hubTutorialInProgress: boolean;
  awaitingTalkTwoGate: boolean;
}): boolean {
  if (!input.operatorIntroPlayed) return true;
  if (input.hubTutorialInProgress) return true;
  if (input.awaitingTalkTwoGate) return true;
  return false;
}

export function isStellaMessageNoticeHeld(): boolean {
  const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
  const {
    isStellaHubTutorialInProgress,
    shouldPresentStellaHubTutorialTalkTwoGate,
  } = require('../../game/hubTutorial/stellaHubTutorialGuide') as typeof import('../../game/hubTutorial/stellaHubTutorialGuide');
  const player = usePlayerStore.getState().player;
  const seen = player?.flags.seenStorySceneIds ?? [];
  return shouldHoldStellaMessageNotice({
    operatorIntroPlayed: useArcCoreChatStore.getState().operatorIntroPlayed,
    hubTutorialInProgress: isStellaHubTutorialInProgress(seen),
    awaitingTalkTwoGate: shouldPresentStellaHubTutorialTalkTwoGate(player?.currentPlanetId),
  });
}

function openStellaMessageNoticeTarget(): void {
  const { isIngameDialogActive } = require('../../game/ingameDialog/ingameDialogApi') as typeof import('../../game/ingameDialog/ingameDialogApi');
  if (isIngameDialogActive()) {
    const { runAfterIngameDialogIdle } = require('../../game/ingameDialog/ingameDialogIdle') as typeof import('../../game/ingameDialog/ingameDialogIdle');
    runAfterIngameDialogIdle(() => {
      openStellaMessageNoticeTarget();
    });
    return;
  }
  const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
  const {
    isStellaHubTutorialInProgress,
    shouldPresentStellaHubTutorialTalkTwoGate,
  } = require('../../game/hubTutorial/stellaHubTutorialGuide') as typeof import('../../game/hubTutorial/stellaHubTutorialGuide');
  const player = usePlayerStore.getState().player;
  const seen = player?.flags.seenStorySceneIds ?? [];
  const awaiting = shouldPresentStellaHubTutorialTalkTwoGate(player?.currentPlanetId);
  const inGuide = isStellaHubTutorialInProgress(seen);
  const intro = useArcCoreChatStore.getState().operatorIntroPlayed;
  if (inGuide && !awaiting) return;
  if (awaiting) {
    const { presentHubNlMouthThenMessenger } = require('../../game/planetHubTalkRoster') as typeof import('../../game/planetHubTalkRoster');
    presentHubNlMouthThenMessenger('operator');
    return;
  }
  if (!intro) {
    const { presentOperatorHubManualFirstComm } = require('../../game/conversation/presentOperatorInboundFirstComm') as typeof import('../../game/conversation/presentOperatorInboundFirstComm');
    presentOperatorHubManualFirstComm({
      onAccept: () => {
        const { presentArcCoreBackchannel } = require('./presentArcCoreBackchannel') as typeof import('./presentArcCoreBackchannel');
        void presentArcCoreBackchannel({ reason: 'manual', speakerId: 'operator' });
      },
    });
    return;
  }
  const { presentArcCoreBackchannel } = require('./presentArcCoreBackchannel') as typeof import('./presentArcCoreBackchannel');
  void presentArcCoreBackchannel({ reason: 'manual', speakerId: 'operator' });
}

/** 조건이 맞으면 팝업을 띄우고 true. 안전한 때인지는 호출부가 본다. */
export function presentStellaMessageNotice(nowMs: number): boolean {
  const chat = useArcCoreChatStore.getState();
  const gate = readStellaObserveGate();
  const unread = countStellaUnreadMessages(chat.messages, gate.lastReadAtMs);
  if (!shouldNotifyStellaMessage(unread, gate)) return false;
  if (isStellaMessageNoticeHeld()) return false;
  const { isIngameDialogActive } = require('../../game/ingameDialog/ingameDialogApi') as typeof import('../../game/ingameDialog/ingameDialogApi');
  if (isIngameDialogActive()) return false;
  markStellaMessageNotified(nowMs);
  chat.touchPersist();
  showArcAlert(
    t('conversation.operatorName'),
    t('arcCoreChat.stellaMessage.body'),
    [
      { text: t('arcCoreChat.stellaMessage.later'), style: 'cancel' },
      {
        text: t('arcCoreChat.stellaMessage.open'),
        onPress: () => {
          openStellaMessageNoticeTarget();
        },
      },
    ],
    { id: STELLA_MESSAGE_NOTICE_ALERT_ID },
  );
  return true;
}
