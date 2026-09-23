import { extractArcCoreChatPreferenceTags } from './arcCoreChatMemoryTags';
import { isArcCoreChatHumanFirstTurn, isArcCoreChatSystemAxis } from './arcCoreChatCasualTalk';
import { hintArcCoreChatTopicId } from './arcCoreChatTableIndex';
import { sanitizeStellaLifeAnchor } from './sanitizeStellaLifeAnchor';
import { observeStellaLifeCognition, isStellaLifeCorrectionText } from './stellaLifeCognition';
import { mutateStellaLifeMemory } from './stellaLifeMemory';
import { stellaLifeDayKey } from './stellaLifeClock';
import { STELLA_LIFE_ANCHORS_MAX } from './stellaLifeSnapshot';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';

const POS_RE = /좋아|고마|괜찮|다행/;
const NEG_RE = /싫어|미안|힘들|지쳐/;

export function noteStellaLifeAfterOperatorReply(input: {
  turn: ArcCoreChatTurn;
  usedLifeLine: boolean;
}): void {
  if (input.turn.policy.persona !== 'operator') return;
  const userText = input.turn.userText;
  const topicId = hintArcCoreChatTopicId(userText);
  const humanFirst = isArcCoreChatHumanFirstTurn({
    intent: input.turn.intent,
    topicId: input.turn.topicId || topicId,
    userText,
  });
  const prefs = extractArcCoreChatPreferenceTags(userText);
  mutateStellaLifeMemory((life) => {
    const today = stellaLifeDayKey(Date.now());
    let next = { ...life, todayKey: today, withPlayerToday: true, lastPlayerDay: today };
    let mood = next.sessionMoodDelta;
    if (POS_RE.test(userText)) mood += 2;
    if (NEG_RE.test(userText)) mood -= 2;
    next.sessionMoodDelta = Math.max(-10, Math.min(10, mood));
    if (prefs.length > 0) {
      const anchors = next.anchors.slice();
      for (let i = 0; i < prefs.length; i += 1) {
        const cleaned = sanitizeStellaLifeAnchor(`${prefs[i]!.key} ${prefs[i]!.value}`);
        if (!cleaned) continue;
        if (anchors.includes(cleaned)) continue;
        anchors.push(cleaned);
      }
      next.anchors = anchors.slice(-STELLA_LIFE_ANCHORS_MAX);
    }
    next = observeStellaLifeCognition(next, {
      operatorTurn: true,
      humanFirst,
      usedLifeLine: input.usedLifeLine,
      h5Pref: prefs.length > 0,
      topicFollow: isArcCoreChatSystemAxis({ intent: input.turn.intent, topicId: input.turn.topicId || topicId }),
      correction: isStellaLifeCorrectionText(userText),
    });
    return next;
  });
}
