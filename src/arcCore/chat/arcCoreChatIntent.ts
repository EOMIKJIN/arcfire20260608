// 로컬 의도 분류 — LLM 없음. 복합문은 우선순위 고정.

export const ARC_CORE_CHAT_INTENTS = [
  'refuse',
  'location',
  'spy',
  'combat',
  'greet',
  'other',
] as const;

export type ArcCoreChatIntent = (typeof ARC_CORE_CHAT_INTENTS)[number];

const REFUSE_RE = /언락|배치|명령|크레딧|unlock|command|credit|aabs|dispatch/i;
const LOCATION_RE = /어디|행성|정박|여기\s*어디|여긴|where|planet/i;
const SPY_RE = /스파이|첩보|경보|spy|intel/i;
const COMBAT_RE = /전투|싸움|교전|이겼|패배|전투\s*결과|battle|combat|fight/i;
const GREET_RE = /안녕|반가|hello|\bhi\b|하이/i;

export function classifyArcCoreChatIntent(userText: string): ArcCoreChatIntent {
  const text = userText.trim();
  if (!text) return 'greet';
  if (REFUSE_RE.test(text)) return 'refuse';
  if (LOCATION_RE.test(text)) return 'location';
  if (SPY_RE.test(text)) return 'spy';
  if (COMBAT_RE.test(text)) return 'combat';
  if (GREET_RE.test(text)) return 'greet';
  return 'other';
}
