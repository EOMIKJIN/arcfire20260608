import { presentOperatorInboundFirstComm } from '../../game/conversation/presentOperatorInboundFirstComm';
import { consumeStellaLifeAskPending } from './stellaLifeAskPending';
import type { StellaLifeAskResolved } from './stellaLifeTypes';

/** 라이프 선제 — 연락 팝업 뒤에 1차. 수락 시에만 메신저. 하루 소진은 판단 기억이 맡는다. */
export function presentStellaLifeAskComm(
  why: StellaLifeAskResolved,
  hooks?: { onAccept?: () => void; onCancel?: () => void },
): boolean {
  consumeStellaLifeAskPending();
  const askText = why.textKo;
  return presentOperatorInboundFirstComm({
    askText,
    onAccept: () => {
      hooks?.onAccept?.();
      const { presentArcCoreBackchannel } =
        require('./presentArcCoreBackchannel') as typeof import('./presentArcCoreBackchannel');
      void presentArcCoreBackchannel({
        reason: 'operator_life',
        forceFreshSession: true,
        openerText: askText,
        speakerId: 'operator',
      });
    },
    onCancel: () => {
      hooks?.onCancel?.();
    },
  });
}
