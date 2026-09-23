// 완성 회신 → 문장 ≤4. 서버 스트림 없음. persist는 한 줄 유지.

export const ARC_CORE_CHAT_REPLY_TURN_MAX = 4;
export const ARC_CORE_CHAT_REPLY_CHUNK_DELAY_MIN_MS = 280;
export const ARC_CORE_CHAT_REPLY_CHUNK_DELAY_MAX_MS = 900;
export const ARC_CORE_CHAT_REPLY_CHUNK_DELAY_PER_CHAR_MS = 18;

const SPLIT_RE = /(?<=[.!?。？！])\s+/;

export function splitArcCoreChatReplyTurns(text: string): string[] {
  const raw = String(text ?? '').trim();
  if (!raw) return [];
  const parts = raw.split(SPLIT_RE).map((row) => row.trim()).filter(Boolean);
  if (parts.length <= 1) return [raw];
  const merged: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]!;
    const last = merged[merged.length - 1];
    if (last && part.length < 4) {
      merged[merged.length - 1] = `${last} ${part}`;
    } else {
      merged.push(part);
    }
  }
  if (merged.length <= ARC_CORE_CHAT_REPLY_TURN_MAX) return merged;
  return [...merged.slice(0, ARC_CORE_CHAT_REPLY_TURN_MAX - 1), merged.slice(ARC_CORE_CHAT_REPLY_TURN_MAX - 1).join(' ')];
}

export function delayMsForChatTurnChunk(chunk: string): number {
  const n = String(chunk ?? '').trim().length;
  const raw = n * ARC_CORE_CHAT_REPLY_CHUNK_DELAY_PER_CHAR_MS;
  return Math.min(
    ARC_CORE_CHAT_REPLY_CHUNK_DELAY_MAX_MS,
    Math.max(ARC_CORE_CHAT_REPLY_CHUNK_DELAY_MIN_MS, raw),
  );
}

export function chunkEndOffsets(text: string): number[] {
  const chunks = splitArcCoreChatReplyTurns(text);
  if (chunks.length <= 1) return [];
  const ends: number[] = [];
  let cursor = 0;
  const full = String(text ?? '');
  for (let i = 0; i < chunks.length - 1; i += 1) {
    const chunk = chunks[i]!;
    const at = full.indexOf(chunk, cursor);
    if (at < 0) continue;
    cursor = at + chunk.length;
    ends.push(cursor);
  }
  return ends;
}
