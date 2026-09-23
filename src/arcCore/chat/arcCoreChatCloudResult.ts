export type CloudArcCoreChatReply = {
  text: string;
  topicIds: string[];
  askedQuestion: string;
};

type CloudTurnResult = {
  text?: string;
  fallback?: boolean;
  reason?: string;
  topicIds?: unknown;
  askedQuestion?: unknown;
};

function readTopicIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length && out.length < 4; i += 1) {
    const id = typeof raw[i] === 'string' ? raw[i].trim().slice(0, 40) : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function readArcCoreChatCloudTurnResult(json: unknown): CloudTurnResult | null {
  if (!json || typeof json !== 'object') return null;
  const root = json as {
    result?: unknown;
    text?: unknown;
    fallback?: unknown;
    reason?: unknown;
    topicIds?: unknown;
    askedQuestion?: unknown;
  };
  if (root.result && typeof root.result === 'object') {
    return root.result as CloudTurnResult;
  }
  if (typeof root.text === 'string' || root.fallback === true) {
    return {
      text: typeof root.text === 'string' ? root.text : undefined,
      fallback: root.fallback === true,
      reason: typeof root.reason === 'string' ? root.reason : undefined,
      topicIds: root.topicIds,
      askedQuestion: root.askedQuestion,
    };
  }
  return null;
}

export function parseCloudArcCoreChatReply(json: unknown): CloudArcCoreChatReply | null {
  const result = readArcCoreChatCloudTurnResult(json);
  if (!result || result.fallback) return null;
  const text = typeof result.text === 'string' ? result.text.trim() : '';
  if (!text) return null;
  return {
    text,
    topicIds: readTopicIds(result.topicIds),
    askedQuestion: typeof result.askedQuestion === 'string' ? result.askedQuestion.trim().slice(0, 200) : '',
  };
}

export function isArcCoreChatCloudHardFailReason(reason: string | undefined): boolean {
  // no_model 은 Groq 일시 실패·한도(429)에서도 올 수 있어 hard-skip 금지.
  return reason === 'not_deployed';
}

/** Groq Free 한도(429) 또는 서버 분당 쿼터. */
export function isArcCoreChatFreeTierExhaustedReason(reason: string | undefined): boolean {
  return reason === 'rate_limit' || reason === 'quota';
}
