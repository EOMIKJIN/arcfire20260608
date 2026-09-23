// inbound 요청 이유 — 순수. persist/틱/스토어 없음. 입은 이유만 말한다.

export const ARC_CORE_INBOUND_TALK_WHY_IDS = [
  'spy',
  'combat',
  'story',
  'world',
  'observe',
  'idle',
] as const;

export type ArcCoreInboundTalkWhyId = (typeof ARC_CORE_INBOUND_TALK_WHY_IDS)[number];

export type ArcCoreInboundTalkWhySnap = {
  id: ArcCoreInboundTalkWhyId;
  text: string;
};

const INBOUND_WHY_TEXT: Record<
  ArcCoreInboundTalkWhyId,
  { ko: string; en: string }
> = {
  spy: {
    ko: '방금 스파이 경보가 떴다. 신경 쓰이나?',
    en: 'A spy alert just came up. Does it bother you?',
  },
  combat: {
    ko: '방금 전투, 어땠나?',
    en: 'That last fight — how was it?',
  },
  story: {
    ko: '줄기가 하나 남아 있다. 지금은 어때?',
    en: 'A story stem is still open. How is it now?',
  },
  world: {
    ko: '{fact} 지금은 어때?',
    en: '{fact} How is it now?',
  },
  observe: {
    ko: '{planet}에 계속 있을 건가, 아니면 다른 데로 갈 생각인가?',
    en: 'Staying at {planet}, or heading somewhere else?',
  },
  idle: {
    ko: '그냥 말 걸어봤다. 요즘 어때?',
    en: 'Just checking in. How have you been?',
  },
};

const INBOUND_WHY_TOPIC: Record<ArcCoreInboundTalkWhyId, string> = {
  spy: 'spy',
  combat: 'combat',
  story: 'story',
  world: 'location',
  observe: 'location',
  idle: 'smalltalk',
};

const INBOUND_WHY_TOOL: Record<ArcCoreInboundTalkWhyId, string | null> = {
  spy: 'get_spy_alert',
  combat: 'get_last_combat',
  story: 'get_active_mission',
  world: null,
  observe: 'get_location',
  idle: null,
};

export function isArcCoreSpokenQuestion(text: string): boolean {
  const spoken = text.trim();
  if (!spoken) return false;
  if (/[?？]/.test(spoken)) return true;
  return /(?:까|나|인가|어때|할래|거야|있을까|있나)\s*[.…]?$/.test(spoken);
}

export function topicIdForInboundWhy(id: ArcCoreInboundTalkWhyId): string {
  return INBOUND_WHY_TOPIC[id];
}

export function clueTopicForInboundWhy(id: ArcCoreInboundTalkWhyId): string | null {
  if (id === 'idle') return null;
  if (id === 'story') return 'mission';
  return INBOUND_WHY_TOPIC[id];
}

export function toolNameForInboundWhy(id: ArcCoreInboundTalkWhyId): string | null {
  return INBOUND_WHY_TOOL[id];
}

export function pickArcCoreInboundTalkWhyId(input: {
  spyAlertPending: boolean;
  hasCombatRecord: boolean;
  hasStoryBeat: boolean;
  planetLabel: string;
  hasWorldChange?: boolean;
}): ArcCoreInboundTalkWhyId {
  if (input.spyAlertPending) return 'spy';
  if (input.hasCombatRecord) return 'combat';
  if (input.hasStoryBeat) return 'story';
  if (input.hasWorldChange) return 'world';
  if (input.planetLabel.trim()) return 'observe';
  return 'idle';
}

export function textForArcCoreInboundTalkWhy(input: {
  id: ArcCoreInboundTalkWhyId;
  locale: 'ko' | 'en';
  steerLine: string;
  planetLabel: string;
  worldFact?: string;
}): string {
  if (input.id === 'story') {
    const steer = input.steerLine.trim();
    if (steer) {
      const sliced = steer.slice(0, 220);
      if (isArcCoreSpokenQuestion(sliced)) return sliced.slice(0, 240);
      const ask = input.locale === 'en' ? ' How is it now?' : ' 지금은 어때?';
      return `${sliced}${ask}`.slice(0, 240);
    }
  }
  const row = INBOUND_WHY_TEXT[input.id];
  const raw = input.locale === 'en' ? row.en : row.ko;
  if (input.id === 'world') {
    const fact = (input.worldFact ?? '').trim()
      || (input.locale === 'en' ? 'Something shifted at the dock.' : '정박 거점에 변화가 있다.');
    return raw.split('{fact}').join(fact).slice(0, 240);
  }
  if (input.id === 'observe') {
    const planet = input.planetLabel.trim() || (input.locale === 'en' ? 'the dock' : '정박 거점');
    return raw.split('{planet}').join(planet).slice(0, 240);
  }
  return raw.slice(0, 240);
}

export function bindArcCoreInboundTalkWhy(input: {
  spyAlertPending: boolean;
  hasCombatRecord: boolean;
  hasStoryBeat: boolean;
  planetLabel: string;
  steerLine: string;
  locale: 'ko' | 'en';
  hasWorldChange?: boolean;
  worldFact?: string;
}): ArcCoreInboundTalkWhySnap {
  const id = pickArcCoreInboundTalkWhyId(input);
  return {
    id,
    text: textForArcCoreInboundTalkWhy({
      id,
      locale: input.locale,
      steerLine: input.steerLine,
      planetLabel: input.planetLabel,
      worldFact: input.worldFact,
    }),
  };
}

