/**
 * 오퍼레이터 선제 1차 통신 — 허브에서 바로 띄운다. pending 배지 대기 없음.
 * 40초 first_idle 자동닫힘 = 취소(메신저 금지). 수락만 2차.
 */

import { t } from '../../i18n';
import { getArcCoreChatSpeakerRow } from '../../arcCore/chat/arcCoreChatTableIndex';
import { COMBAT_END_OPERATOR_AUTO_DISMISS_MS } from '../ingameDialog/ingameDialogAutoDismiss';
import { resolveNpcCaptainPortraitSource } from '../npcCaptainPortraitAssets';
import { presentNlMouthComm } from './presentNlMouthComm';

export function presentOperatorInboundFirstComm(input: {
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
