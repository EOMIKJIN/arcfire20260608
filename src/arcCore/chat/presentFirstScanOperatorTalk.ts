/**
 * A1 1차 종료 뒤 스텔라 2차 메신저 1회.
 * 통신 창과 스택하지 않음. 틱/신규 persist 없음.
 */
import { isIngameDialogActive } from '../../game/ingameDialog/ingameDialogApi';
import { runAfterIngameDialogIdle } from '../../game/ingameDialog/ingameDialogIdle';
import {
  FIRST_SCAN_BACKCHANNEL_REASON,
  firstScanOpenerText,
  firstScanTriggerId,
} from './firstScanOperatorTalk';
import { presentArcCoreBackchannel } from './presentArcCoreBackchannel';

export function presentFirstScanOperatorTalk(planetId: string): void {
  const pid = (planetId ?? '').trim();
  if (!pid) return;
  const open = (): void => {
    void presentArcCoreBackchannel({
      reason: FIRST_SCAN_BACKCHANNEL_REASON,
      triggerId: firstScanTriggerId(pid),
      openerText: firstScanOpenerText(),
      speakerId: 'operator',
    });
  };
  if (isIngameDialogActive()) {
    runAfterIngameDialogIdle(open);
    return;
  }
  open();
}
