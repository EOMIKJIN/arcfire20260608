// 채널 오픈 첫 줄 — opener가 있으면 그게 아크코어의 첫 대사. 월드 write 없음.

import {
  ARC_CORE_CHAT_SESSION_WELCOME_BACK_REASON,
  ARC_CORE_CHAT_SESSION_WELCOME_REASON,
} from '../../store/arcCoreChatStore';

export type ArcCoreChatOpenSpeech = {
  text: string;
  reason: string;
};

export function resolveArcCoreChatOpenSpeech(input: {
  openerText?: string;
  reason: string;
  returning: boolean;
  welcome: string;
  welcomeBack: string;
}): ArcCoreChatOpenSpeech {
  const opener = (input.openerText ?? '').trim();
  if (opener) {
    return { text: opener, reason: input.reason };
  }
  if (input.returning) {
    return {
      text: input.welcomeBack,
      reason: ARC_CORE_CHAT_SESSION_WELCOME_BACK_REASON,
    };
  }
  return {
    text: input.welcome,
    reason: ARC_CORE_CHAT_SESSION_WELCOME_REASON,
  };
}
