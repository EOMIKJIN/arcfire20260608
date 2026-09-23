// overlay store 상수와 동일 id. 이 파일은 RN/zustand를 끌어오지 않는다.

import { ARC_CORE_INBOUND_TALK_ALERT_ID } from './arcCoreInboundTalkRequestPolicy';

export const ARC_CORE_CHAT_OVERLAY_DISMISS_ID = 'arc-core-chat';

export function isArcCoreChatOverlayToDismiss(entry: { kind: string; id: string }): boolean {
  return entry.kind === 'arcCoreChat'
    || entry.id === ARC_CORE_CHAT_OVERLAY_DISMISS_ID
    || entry.id === ARC_CORE_INBOUND_TALK_ALERT_ID;
}
