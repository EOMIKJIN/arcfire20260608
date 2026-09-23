// 클라우드 topicIds는 CSV·힌트 축·이번 팩 스택만. 모델이 만든 id는 버린다.

import { listArcCoreChatTopicRows, ARC_CORE_CHAT_TOPIC_HINT_ORDER } from './arcCoreChatTableIndex';

export function sanitizeArcCoreChatCloudTopicIds(
  raw: readonly string[],
  packStack: readonly string[],
): string[] {
  const allowed = new Set<string>();
  const topics = listArcCoreChatTopicRows();
  for (let i = 0; i < topics.length; i += 1) {
    const id = topics[i]!.id;
    if (id) allowed.add(id);
  }
  for (let i = 0; i < ARC_CORE_CHAT_TOPIC_HINT_ORDER.length; i += 1) {
    allowed.add(ARC_CORE_CHAT_TOPIC_HINT_ORDER[i]!);
  }
  for (let i = 0; i < packStack.length; i += 1) {
    const id = packStack[i]!.trim();
    if (id) allowed.add(id);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length && out.length < 4; i += 1) {
    const id = raw[i]!.trim();
    if (!id || seen.has(id) || !allowed.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
