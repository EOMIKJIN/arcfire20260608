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

/** 라이프 선제 — 1차 자동팝업. 수락 시에만 메신저. 40초 닫힘은 취소. */
export function presentStellaLifeAskComm(why: StellaLifeAskResolved): boolean {
  const askText = why.textKo;
  return presentOperatorInboundFirstComm({
    askText,
    onAccept: () => {
      closeStellaLifeAskCourtesy();
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
      closeStellaLifeAskCourtesy();
    },
  });
}
