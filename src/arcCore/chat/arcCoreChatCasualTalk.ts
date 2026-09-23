// 일상 잡담 vs 세계 탐색. 순수.
// 기본층 = 사람 말. 시스템 축은 명시 질문·정세 탐색일 때만.

import { isArcCoreChatActionRequestText } from './arcCoreChatActionRequest';

const CASUAL_RE =
  /기분|심심|재미|괜찮|잘\s*지내|외로|보고\s*싶|고마|미안|사랑|심기|뭐\s*했|그냥\s*얘기|할\s*말|잡담|오늘\s*하루|feeling|mood|bored|how are you/i;
const HOW_ARE_RE = /어때|어떠|how's|how is|how are/i;
const WORLD_SEEK_RE =
  /요즘|무슨\s*일|별일|현황|정세|새로운\s*일|세계는|what's going on|anything new|what happened/i;

const SYSTEM_TOPIC_IDS = new Set([
  'location',
  'spy',
  'combat',
  'safety',
  'notice',
  'mission',
  'story',
  'self',
  'mining',
  'daily',
  'seats',
  'cores',
  'trade',
  'shipyard',
  'nations',
  'routes',
  'setting',
  'refuse',
]);

export function isArcCoreChatWorldSeeking(userText: string): boolean {
  return WORLD_SEEK_RE.test(userText.trim());
}

export function isArcCoreChatCasualTalk(userText: string): boolean {
  const text = userText.trim();
  if (!text) return false;
  if (isArcCoreChatWorldSeeking(text)) return false;
  if (CASUAL_RE.test(text)) return true;
  return HOW_ARE_RE.test(text);
}

export function isArcCoreChatSystemAxis(input: {
  intent: string;
  topicId: string;
}): boolean {
  if (input.intent === 'location' || input.intent === 'spy' || input.intent === 'combat') {
    return true;
  }
  if (input.intent === 'refuse' || input.topicId.trim() === 'refuse') return true;
  return SYSTEM_TOPIC_IDS.has(input.topicId.trim());
}

export function isArcCoreChatHumanFirstTurn(input: {
  intent: string;
  topicId: string;
  userText: string;
}): boolean {
  if (isArcCoreChatSystemAxis(input)) return false;
  if (isArcCoreChatWorldSeeking(input.userText)) return false;
  if (isArcCoreChatActionRequestText(input.userText)) return false;
  return true;
}
