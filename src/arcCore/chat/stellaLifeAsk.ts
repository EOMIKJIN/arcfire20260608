import { parseArcCoreChatMemoryTags } from './arcCoreChatMemoryTags';
import { getArcCoreChatLastQuestion, getArcCoreChatRollingSummary } from './arcCoreChatDialogueState';
import { listStellaLifeAskMotives, listStellaLifeAskWhys } from './stellaLifeTableIndex';
import type {
  StellaLifeAskId,
  StellaLifeAskResolved,
  StellaLifeMotiveId,
  StellaLifeResolved,
  StellaLifeSnapshot,
} from './stellaLifeTypes';
import { stellaLifeCompareDayKey, stellaLifeDayKey } from './stellaLifeClock';

export type StellaLifeAskFuels = {
  hasPromise: boolean;
  hasCorrection: boolean;
  hasThread: boolean;
  hasCarePref: boolean;
  shareAnchor: string;
};

export function collectStellaLifeAskFuels(snapshot: StellaLifeSnapshot, resolved: StellaLifeResolved): StellaLifeAskFuels {
  const tags = parseArcCoreChatMemoryTags(getArcCoreChatRollingSummary()).tags;
  let hasPromise = false;
  let hasCarePref = false;
  for (let i = 0; i < tags.length; i += 1) {
    if (tags[i]!.key === '약속') hasPromise = true;
    if (tags[i]!.key === '좋아' || tags[i]!.key === '싫어') hasCarePref = true;
  }
  let corr = 0;
  const ev = snapshot.cognition.ev;
  for (let i = 0; i < ev.length; i += 1) corr += ev[i]!.corr;
  corr += snapshot.cognitionSession.corr;
  const lastQ = getArcCoreChatLastQuestion().trim();
  const shareAnchor = (snapshot.anchors[0] || resolved.activityKo).trim().slice(0, 24);
  return {
    hasPromise,
    hasCorrection: corr > 0,
    hasThread: lastQ.length > 0,
    hasCarePref,
    shareAnchor,
  };
}

export function resolveStellaAskMotive(
  resolved: StellaLifeResolved,
): Exclude<StellaLifeMotiveId, 'none'> | null {
  const rows = listStellaLifeAskMotives();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (row.driveId !== '*' && row.driveId !== resolved.driveId) continue;
    if (row.dutyOrOff !== '*' && row.dutyOrOff !== resolved.dutyOrOff) continue;
    if (resolved.mood < row.moodLo || resolved.mood > row.moodHi) continue;
    if (!row.allowAsk || row.motiveId === 'none') return null;
    return row.motiveId;
  }
  return null;
}

function fuelForAsk(askId: StellaLifeAskId, fuels: StellaLifeAskFuels, motiveId: StellaLifeMotiveId): boolean {
  if (askId === 'promise') return fuels.hasPromise && (motiveId === 'need_you' || motiveId === 'check_in');
  if (askId === 'correction') return fuels.hasCorrection && motiveId === 'want_right';
  if (askId === 'thread') return fuels.hasThread && motiveId === 'unfinished';
  if (askId === 'care') return (fuels.hasCarePref || motiveId === 'check_in') && (motiveId === 'need_you' || motiveId === 'check_in');
  if (askId === 'share') return Boolean(fuels.shareAnchor) && motiveId === 'want_share';
  return false;
}

export function bindStellaAskWhy(
  motiveId: Exclude<StellaLifeMotiveId, 'none'>,
  fuels: StellaLifeAskFuels,
  locale: 'ko' | 'en',
): StellaLifeAskResolved | null {
  const rows = listStellaLifeAskWhys().slice().sort((a, b) => a.priority - b.priority);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (!row.motiveIds.includes(motiveId)) continue;
    if (!fuelForAsk(row.askId, fuels, motiveId)) continue;
    const raw = locale === 'en' ? row.lineEn : row.lineKo;
    const text = raw.split('{anchor}').join(fuels.shareAnchor || (locale === 'en' ? 'today' : '오늘'));
    return { motiveId, askId: row.askId, textKo: text, textEn: text };
  }
  return null;
}

export function shouldSuppressStellaLifeAsk(input: {
  tutorialForce: boolean;
  operatorIntroPlayed: boolean;
  askedToday: boolean;
  lastAskDay: string;
  todayKey: string;
}): boolean {
  if (input.tutorialForce) return true;
  if (!input.operatorIntroPlayed) return true;
  if (input.askedToday) return true;
  if (input.lastAskDay && stellaLifeCompareDayKey(input.lastAskDay, input.todayKey) >= 0) return true;
  return false;
}

export function resolveStellaHumanAsk(input: {
  resolved: StellaLifeResolved;
  snapshot: StellaLifeSnapshot;
  locale: 'ko' | 'en';
  tutorialForce: boolean;
  operatorIntroPlayed: boolean;
  nowMs: number;
}): StellaLifeAskResolved | null {
  const today = stellaLifeDayKey(input.nowMs);
  if (
    shouldSuppressStellaLifeAsk({
      tutorialForce: input.tutorialForce,
      operatorIntroPlayed: input.operatorIntroPlayed,
      askedToday: input.snapshot.lastAskDay === today,
      lastAskDay: input.snapshot.lastAskDay,
      todayKey: today,
    })
  ) {
    return null;
  }
  const motive = resolveStellaAskMotive(input.resolved);
  if (!motive) return null;
  const fuels = collectStellaLifeAskFuels(input.snapshot, input.resolved);
  if (input.snapshot.cognition.casualFirst >= 70 && motive === 'want_share') return null;
  return bindStellaAskWhy(motive, fuels, input.locale);
}
