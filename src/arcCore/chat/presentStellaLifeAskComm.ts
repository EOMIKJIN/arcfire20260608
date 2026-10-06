import { presentOperatorInboundFirstComm } from '../../game/conversation/presentOperatorInboundFirstComm';
import { useArcCoreChatStore } from '../../store/arcCoreChatStore';
import { consumeStellaLifeAskPending } from './stellaLifeAskPending';
import { stellaLifeDayKey } from './stellaLifeClock';
import { mutateStellaLifeMemory } from './stellaLifeMemory';
import type { StellaLifeAskResolved } from './stellaLifeTypes';

function closeStellaLifeAskCourtesy(): void {
  consumeStellaLifeAskPending();
  mutateStellaLifeMemory((life) => ({
    ...life,
    lastAskDay: stellaLifeDayKey(Date.now()),
  }));
  useArcCoreChatStore.getState().touchPersist();
}

/** 라이프 선제 — 연락 팝업 뒤에 1차. 수락 시에만 메신저. 팝업을 띄운 날은 다시 묻지 않는다. */
export function presentStellaLifeAskComm(why: StellaLifeAskResolved): boolean {
  const askText = why.textKo;
  closeStellaLifeAskCourtesy();
  return presentOperatorInboundFirstComm({
    askText,
    onAccept: () => {
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
      /* 연락을 띄운 시점에 이미 오늘 질문을 소진했다 */
    },
  });
}
