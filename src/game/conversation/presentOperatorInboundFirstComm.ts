/**
 * 오퍼레이터 선제 1차 통신 — 연락 팝업 수락 뒤에 대사창.
 * 대사창 40초 first_idle 자동닫힘 = 취소(메신저 금지). 수락만 2차.
 */

import { t } from '../../i18n';
import { ARC_CORE_INBOUND_TALK_ALERT_ID } from '../../arcCore/chat/arcCoreInboundTalkRequestPolicy';
import { getArcCoreChatSpeakerRow } from '../../arcCore/chat/arcCoreChatTableIndex';
import { COMBAT_END_OPERATOR_AUTO_DISMISS_MS } from '../ingameDialog/ingameDialogAutoDismiss';
import { resolveNpcCaptainPortraitSource } from '../npcCaptainPortraitAssets';
import { showArcAlert } from '../../utils/showArcAlert';
import { presentNlMouthComm } from './presentNlMouthComm';

function openOperatorInboundDialog(input: {
  askText: string;
  onAccept: () => void | Promise<void>;
  onCancel?: () => void;
}): boolean {
  const operatorPortrait = resolveNpcCaptainPortraitSource(
    getArcCoreChatSpeakerRow('operator')?.portraitAssetKey ?? null,
  );
  return presentNlMouthComm({
    requireAccept: true,
    label: t('dialog.comm'),
    text: `${t('conversation.gate1.operator.inboundGreet')}\n${input.askText}`,
    imageSource: operatorPortrait ?? undefined,
    buttonText: t('dialog.accept'),
    secondaryButtonText: t('dialog.cancel'),
    autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
    autoDismissMode: 'first_idle',
    onAccept: input.onAccept,
    onCancel: input.onCancel,
  });
}

/** 선제 연락 — 팝업 수락 뒤에만 인앱 대사를 연다. 거절은 대사를 열지 않는다. */
export function presentOperatorInboundFirstComm(input: {
  askText: string;
  onAccept: () => void | Promise<void>;
  onCancel?: () => void;
}): boolean {
  showArcAlert(
    t('conversation.operatorName'),
    t('conversation.gate1.operator.incomingBody'),
    [
      {
        text: t('arcCoreChat.inbound.reject'),
        style: 'cancel',
        onPress: () => {
          input.onCancel?.();
        },
      },
      {
        text: t('arcCoreChat.inbound.accept'),
        onPress: () => {
          openOperatorInboundDialog(input);
        },
      },
    ],
    { id: ARC_CORE_INBOUND_TALK_ALERT_ID },
  );
  return true;
}

/** 허브 [대화] 본기능 — 1차 통신 후 수락=메신저 · 취소=클로징. */
export function presentOperatorHubManualFirstComm(input: {
  onAccept: () => void | Promise<void>;
  onCancel?: () => void;
}): boolean {
  const operatorPortrait = resolveNpcCaptainPortraitSource(
    getArcCoreChatSpeakerRow('operator')?.portraitAssetKey ?? null,
  );
  return presentNlMouthComm({
    requireAccept: true,
    label: t('dialog.comm'),
    text: t('conversation.gate1.operator.hubBody'),
    imageSource: operatorPortrait ?? undefined,
    buttonText: t('dialog.accept'),
    secondaryButtonText: t('dialog.cancel'),
    onAccept: input.onAccept,
    onCancel: input.onCancel,
  });
}
