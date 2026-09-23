// 서버 MAX_PACK_CHARS(16000)와 동일. 초과 시 fetch 없이 로컬 F5.

import type { ArcCoreAgentPack } from './arcCoreAgentPack';

export const ARC_CORE_CHAT_MAX_PACK_CHARS = 16_000;

export function trySerializeArcCoreChatCloudBody(pack: ArcCoreAgentPack): string | null {
  const body = JSON.stringify({ data: pack });
  if (body.length > ARC_CORE_CHAT_MAX_PACK_CHARS) return null;
  return body;
}
