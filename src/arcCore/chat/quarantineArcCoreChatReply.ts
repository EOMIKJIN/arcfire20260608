// 클라 검역 — 클라우드/로컬 회신 공통. 실패면 null → F5.

import { ARC_CORE_CHAT_MAX_TEXT, clampArcCoreChatText } from '../../store/arcCoreChatStore';
import type { ArcCoreAgentPack } from './arcCoreAgentPack';

const WRITE_DONE_RE =
  /크레딧을 (올렸|지급|추가)|해금했|언락했|배치를 (실행|시작)|점유를 (바꿨|변경)|unlocked|granted credit|deployed the/i;
const SHADOW_LEAK_RE = /짝 유저|섀도우 닉|shadow nickname|your pair is/i;
const SYSTEM_LEAK_RE = /^\s*(\{|\[|toolResults|systemInstruction|```)/i;

export function sanitizeArcCoreChatAskedQuestion(
  text: string,
  revealShadow: boolean,
): string {
  const raw = String(text ?? '').trim().slice(0, 200);
  if (!raw) return '';
  if (SYSTEM_LEAK_RE.test(raw) || WRITE_DONE_RE.test(raw)) return '';
  if (!revealShadow && SHADOW_LEAK_RE.test(raw)) return '';
  return raw;
}

export function quarantineArcCoreChatReply(
  text: string,
  pack: ArcCoreAgentPack,
): string | null {
  const raw = clampArcCoreChatText(String(text ?? '').trim());
  if (!raw) return null;
  if (SYSTEM_LEAK_RE.test(raw)) return null;
  if (WRITE_DONE_RE.test(raw)) return null;
  if (!pack.policy.revealShadow && SHADOW_LEAK_RE.test(raw)) return null;
  if (raw.length > pack.policy.maxChars) {
    return raw.slice(0, Math.min(pack.policy.maxChars, ARC_CORE_CHAT_MAX_TEXT));
  }
  return raw;
}
