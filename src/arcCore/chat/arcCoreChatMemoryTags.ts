// 일화 태그 — rollingSummary 접두. 벡터/임베딩/새 persist 키 없음.

export const ARC_CORE_CHAT_MEMORY_TAG_KEYS = ['좋아', '싫어', '사건', '약속', '장소'] as const;
export const ARC_CORE_CHAT_MEMORY_TAG_MAX = 8;
export const ARC_CORE_CHAT_MEMORY_TAG_KEY_MAX = 12;
export const ARC_CORE_CHAT_MEMORY_TAG_VALUE_MAX = 16;

export type ArcCoreChatMemoryTagKey = (typeof ARC_CORE_CHAT_MEMORY_TAG_KEYS)[number];

export type ArcCoreChatMemoryTag = {
  key: ArcCoreChatMemoryTagKey;
  value: string;
};

const KEY_SET: ReadonlySet<string> = new Set(ARC_CORE_CHAT_MEMORY_TAG_KEYS);
const TAG_LINE_RE = /^#tags\s+(.+)$/;

function sanitizeValue(raw: string): string {
  return raw.replace(/[#\n/]/g, '').trim().slice(0, ARC_CORE_CHAT_MEMORY_TAG_VALUE_MAX);
}

function asKey(raw: string): ArcCoreChatMemoryTagKey | null {
  const key = raw.trim();
  return KEY_SET.has(key) ? (key as ArcCoreChatMemoryTagKey) : null;
}

export function parseArcCoreChatMemoryTags(summary: string): {
  tags: ArcCoreChatMemoryTag[];
  body: string;
} {
  const raw = String(summary ?? '').trim();
  if (!raw) return { tags: [], body: '' };
  const nl = raw.indexOf('\n');
  const first = (nl >= 0 ? raw.slice(0, nl) : raw).trim();
  const matched = TAG_LINE_RE.exec(first);
  if (!matched) return { tags: [], body: raw };
  const tags: ArcCoreChatMemoryTag[] = [];
  const parts = matched[1]!.trim().split(/\s+/);
  for (let i = 0; i < parts.length && tags.length < ARC_CORE_CHAT_MEMORY_TAG_MAX; i += 1) {
    const token = parts[i]!;
    const colon = token.indexOf(':');
    if (colon <= 0) continue;
    const key = asKey(token.slice(0, colon).slice(0, ARC_CORE_CHAT_MEMORY_TAG_KEY_MAX));
    const value = sanitizeValue(token.slice(colon + 1));
    if (!key || !value) continue;
    upsertArcCoreChatMemoryTag(tags, key, value);
  }
  const body = nl >= 0 ? raw.slice(nl + 1).trim() : '';
  return { tags, body };
}

export function upsertArcCoreChatMemoryTag(
  tags: ArcCoreChatMemoryTag[],
  key: ArcCoreChatMemoryTagKey,
  value: string,
): ArcCoreChatMemoryTag[] {
  const next = sanitizeValue(value);
  if (!next) return tags;
  for (let i = 0; i < tags.length; i += 1) {
    if (tags[i]!.key === key) {
      tags[i] = { key, value: next };
      return tags;
    }
  }
  if (tags.length >= ARC_CORE_CHAT_MEMORY_TAG_MAX) {
    tags.shift();
  }
  tags.push({ key, value: next });
  return tags;
}

export function formatArcCoreChatMemoryTagLine(tags: readonly ArcCoreChatMemoryTag[]): string {
  if (tags.length === 0) return '';
  const parts: string[] = [];
  for (let i = 0; i < tags.length && i < ARC_CORE_CHAT_MEMORY_TAG_MAX; i += 1) {
    const row = tags[i]!;
    parts.push(`${row.key}:${row.value}`);
  }
  return parts.length > 0 ? `#tags ${parts.join(' ')}` : '';
}

export function extractArcCoreChatPreferenceTags(userText: string): ArcCoreChatMemoryTag[] {
  const text = userText.trim();
  if (!text) return [];
  const out: ArcCoreChatMemoryTag[] = [];
  const labeled = /(?:좋아|싫어)[:：]\s*(\S{1,16})/g;
  let labeledMatch: RegExpExecArray | null = labeled.exec(text);
  while (labeledMatch) {
    const full = labeledMatch[0] ?? '';
    const value = labeledMatch[1] ?? '';
    const key: ArcCoreChatMemoryTagKey = full.startsWith('싫어') ? '싫어' : '좋아';
    upsertArcCoreChatMemoryTag(out, key, value);
    labeledMatch = labeled.exec(text);
  }
  const like = /(\S{1,12})\s+좋아(?:해|함|한다)?(?:요|다)?(?:[.!?。]|$)/;
  const dislike = /(\S{1,12})\s+싫어(?:해|함|한다)?(?:요|다)?(?:[.!?。]|$)/;
  const likeHit = like.exec(text);
  if (likeHit?.[1] && likeHit[1] !== '너무' && likeHit[1] !== '진짜') {
    upsertArcCoreChatMemoryTag(out, '좋아', likeHit[1]);
  }
  const dislikeHit = dislike.exec(text);
  if (dislikeHit?.[1] && dislikeHit[1] !== '너무' && dislikeHit[1] !== '진짜') {
    upsertArcCoreChatMemoryTag(out, '싫어', dislikeHit[1]);
  }
  return out;
}
