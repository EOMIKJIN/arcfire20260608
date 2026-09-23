import {
  extractArcCoreChatPreferenceTags,
  formatArcCoreChatMemoryTagLine,
  parseArcCoreChatMemoryTags,
  upsertArcCoreChatMemoryTag,
} from './arcCoreChatMemoryTags';

export const ARC_CORE_CHAT_ROLLING_SUMMARY_MAX = 400;
export const ARC_CORE_CHAT_ASKED_QUESTION_MAX = 200;

export function composeArcCoreChatMemorySummary(
  tags: Parameters<typeof formatArcCoreChatMemoryTagLine>[0],
  body: string,
): string {
  const prefix = formatArcCoreChatMemoryTagLine(tags);
  const rest = String(body ?? '').trim();
  if (!prefix) return clampArcCoreChatRollingSummary(rest);
  const maxBody = Math.max(0, ARC_CORE_CHAT_ROLLING_SUMMARY_MAX - prefix.length - 1);
  let cut = rest;
  if (cut.length > maxBody) {
    const slice = cut.slice(-maxBody);
    const slash = slice.indexOf(' / ');
    cut = (slash >= 0 && slash < 48 ? slice.slice(slash + 3) : slice).trim();
  }
  const next = cut ? `${prefix}\n${cut}` : prefix;
  return next.length <= ARC_CORE_CHAT_ROLLING_SUMMARY_MAX
    ? next
    : next.slice(0, ARC_CORE_CHAT_ROLLING_SUMMARY_MAX);
}

export function clampArcCoreChatRollingSummary(text: string): string {
  const raw = String(text ?? '').trim();
  if (raw.length <= ARC_CORE_CHAT_ROLLING_SUMMARY_MAX) return raw;
  const cut = raw.slice(-ARC_CORE_CHAT_ROLLING_SUMMARY_MAX);
  const slash = cut.indexOf(' / ');
  return (slash >= 0 && slash < 48 ? cut.slice(slash + 3) : cut).trim();
}

export function foldArcCoreChatRollingSummaryText(
  prev: string,
  userText: string,
  reply: string,
): string {
  const parsed = parseArcCoreChatMemoryTags(prev);
  const extra = extractArcCoreChatPreferenceTags(userText);
  for (let i = 0; i < extra.length; i += 1) {
    upsertArcCoreChatMemoryTag(parsed.tags, extra[i]!.key, extra[i]!.value);
  }
  const user = userText.trim().slice(0, 80);
  const arc = reply.trim().slice(0, 80);
  if (!user && !arc && parsed.tags.length === 0) return clampArcCoreChatRollingSummary(prev);
  const pair = arc ? `${user} → ${arc}` : user;
  const body = parsed.body
    ? (pair ? `${parsed.body} / ${pair}` : parsed.body)
    : pair;
  return composeArcCoreChatMemorySummary(parsed.tags, body);
}

export function extractArcCoreChatAskedQuestion(reply: string): string {
  const text = String(reply ?? '').trim();
  if (!text) return '';
  const q = text.lastIndexOf('?');
  const kq = text.lastIndexOf('？');
  const idx = Math.max(q, kq);
  if (idx < 0) return '';
  const start = Math.max(0, text.lastIndexOf('.', idx - 1) + 1);
  return text.slice(start, idx + 1).trim().slice(0, ARC_CORE_CHAT_ASKED_QUESTION_MAX);
}
