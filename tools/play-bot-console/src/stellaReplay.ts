/**
 * O4 (=D3) 스텔라 선제 빈도 재생. 봇 저널의 obs 를 사람 시간 위에 깔고, 앱과 같은 관찰 sink·감지기·게이트를 그대로 돌린다.
 * 결정 순간 = 세션 시작 · 착륙(허브 진입) · 전투 복귀 — 체류 중 판정 없음 (잠금 6).
 * 사람 시간·세션·근원체·반응은 모델 가정이다 (STELLA_REPLAY_DEFAULTS · 보고서에 그대로 적는다).
 */
import {
  forEachRecentPlayerObserve,
  playerObserveDayOf,
  readPlayerObserveDigest,
  recordPlayerObserve,
  resetPlayerObserve,
} from '../../../src/game/playerObserve/playerObserveSink';
import { detectStellaSituations, type StellaObserveSituationRow } from '../../../src/arcCore/chat/stellaObserveSituations';
import {
  decideStellaObserve,
  emptyStellaObserveGateState,
  isStellaLifeHit,
  nextOriginInboundWindowMs,
  stellaLifeAskHit,
  stellaReachHit,
  noteStellaObserveAccepted,
  noteStellaObserveIgnored,
  noteStellaObserveShown,
  type StellaObserveGatePolicy,
  type StellaObserveRecent,
} from '../../../src/arcCore/chat/stellaObserveGate';
import { isStellaLifeFreeSlot, stellaLifeSlotAt } from '../../../src/arcCore/chat/stellaLifeResolve';
import { STELLA_UNREAD_STOP } from '../../../src/arcCore/chat/stellaReachCatchUp';
import { humanSecondsFor, type HumanClock } from './humanClock';
import { createRng, type Rng } from './rng';
import type { JournalEntry, JournalKind, WorldState } from './types';

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const KST = 9 * HOUR;

export const STELLA_REPLAY_DEFAULTS = {
  /** 2026-10-01 00:00 KST */
  startMs: Date.UTC(2026, 8, 30, 15),
  sessionMinMin: 40,
  sessionMaxMin: 120,
  /** 하루 두 번 접속할 확률. 한 번이면 저녁, 두 번이면 점심·저녁. */
  twoSessionP: 0.4,
  /** 다음 접속까지 하루(0.85) · 이틀(0.10) · 3~4일(0.05) */
  skipOneP: 0.1,
  skipManyP: 0.05,
  /** 1차 통신·메신저를 받아 줄 확률. 말걸기(remark)는 반응 없음. */
  acceptP: 0.5,
  /**
   * 앱의 inbound 대화 요청 (arcCoreInboundTalkRequest — 「나야, 스텔라.」). 허브에 있는 동안 타이머로 울린다.
   * timer = 지금 앱 그대로 (첫 45~90초 · 이후 8~15분) · off = 타이머 없이 스텔라 판단만.
   */
  inbound: 'timer' as 'timer' | 'off',
  inboundFirstMinSec: 45,
  inboundFirstMaxSec: 90,
  inboundCooldownMinMin: 8,
  inboundCooldownMaxMin: 15,
  /**
   * 일상 질문(§16). daily = 지금 앱 (허브 진입 하루 1회) · judge = 관찰 상황과 같은 판단 (대표님 2026-10-06).
   * 봇에는 스텔라 기분·대화 기억이 없어 늘 lifeMotive·lifeAskId 질문거리가 있다고 본다 — 가장 자주 묻는 쪽 가정.
   */
  life: 'daily' as 'daily' | 'judge',
  lifeMotive: 'check_in',
  lifeAskId: 'care',
  /**
   * 대표님이 접속하지 않은 동안 스텔라가 자기 하루(깨어 있고 근무 아닌 칸)에 메신저로 먼저 연락 (대표님 2026-10-06 · 스텔라 하루 기준).
   * 같은 판단 · 안 읽은 연락만큼 덜 보냄. 접속하면 쌓인 연락을 읽는다.
   */
  reach: false,
  reachMotive: 'check_in',
  reachStepMin: 30,
  uid: 'playbot',
  /** 이미 걱정했으면 포착으로 친다 */
  coveredWithinMin: 30,
  /** 이 시간 안에 rough_day 를 꺼낸 적 없으면 새 힘든 시기 — 포착 합격선은 여기만 본다. */
  freshEpisodeHours: 72,
  recentMax: 16,
};

export type StellaReplayConfig = typeof STELLA_REPLAY_DEFAULTS;

export type StellaReplayDay = {
  day: number;
  /** 말한 순서대로 상황 id. 일상 질문은 'life' · 타이머 대화 요청은 'inbound'. */
  spoke: string[];
  asks: number;
  sessions: number;
};

export type StellaReplayResult = {
  seed: number;
  days: StellaReplayDay[];
  decisions: number;
  silent: Record<string, number>;
  channels: Record<string, number>;
  capture: { qualifying: number; strict: number; covered: number; freshQualifying: number; freshCovered: number };
  /** 포착 실패한 결정 순간의 판정 — 진단용. */
  captureMiss: Record<string, number>;
  inboundFired: number;
  failsafeHits: number;
  humanHours: number;
  /** 재생이 걸친 달력 일수 — 스텔라 하루 기준 지표의 분모. */
  calendarDays: number;
};

type Slot = { startMs: number; lenMs: number };

export function createStellaReplay(input: {
  seed: number;
  rows: readonly StellaObserveSituationRow[];
  policy: StellaObserveGatePolicy;
  clock: HumanClock;
  cfg?: Partial<StellaReplayConfig>;
}) {
  const cfg: StellaReplayConfig = { ...STELLA_REPLAY_DEFAULTS, ...input.cfg };
  const rng: Rng = createRng(input.seed * 7919 + 17);
  const gs = emptyStellaObserveGateState();
  const recent: StellaObserveRecent[] = [];
  const lifeHit = stellaLifeAskHit(cfg.lifeMotive, cfg.lifeAskId, input.policy);
  const reachHit = stellaReachHit(cfg.reachMotive);
  resetPlayerObserve();

  const res: StellaReplayResult = {
    seed: input.seed,
    days: [],
    decisions: 0,
    silent: {},
    channels: {},
    capture: { qualifying: 0, strict: 0, covered: 0, freshQualifying: 0, freshCovered: 0 },
    captureMiss: {},
    inboundFired: 0,
    failsafeHits: 0,
    humanHours: 0,
    calendarDays: 0,
  };
  let unread: string[] = [];

  let now = cfg.startMs;
  let queue: Slot[] = [];
  let nextDayStart = cfg.startMs;
  let inSession = false;
  let sessionStartMs = 0;
  let sessionEndMs = 0;
  let lastSessionEndMs = 0;
  let prevKind: JournalKind | '' = '';
  let originLastAtMs = 0;
  /** 앱 arcCoreInboundTalkSchedule 의 nextEligibleAt 과 같은 뜻 — 세션을 넘어 유지. */
  let inboundNextAt = 0;
  let lifeAskLastAtMs = 0;
  let lifeDay = -1;
  let lastQuestAt = 0;
  let stallCount = 0;
  let pendingCapture = false;
  let roughDay = -1;
  let captureFresh = false;
  let lastRoughAt = 0;
  let today: StellaReplayDay | null = null;
  let playMs = 0;

  const between = (a: number, b: number) => a + rng() * (b - a);

  function planDay(): void {
    const two = rng() < cfg.twoSessionP;
    const len = () => between(cfg.sessionMinMin, cfg.sessionMaxMin) * MIN;
    queue = two
      ? [
          { startMs: nextDayStart + between(12, 14) * HOUR, lenMs: len() },
          { startMs: nextDayStart + between(20, 23) * HOUR, lenMs: len() },
        ]
      : [{ startMs: nextDayStart + between(19, 23) * HOUR, lenMs: len() }];
    const r = rng();
    const skip = r < cfg.skipManyP ? 3 + Math.floor(rng() * 2) : r < cfg.skipManyP + cfg.skipOneP ? 2 : 1;
    nextDayStart += skip * DAY;
  }

  function dayBucket(): StellaReplayDay {
    const day = playerObserveDayOf(now);
    if (!today || today.day !== day) {
      today = { day, spoke: [], asks: 0, sessions: 0 };
      res.days.push(today);
    }
    return today;
  }

  function fireInbound(at: number): void {
    originLastAtMs = at;
    res.inboundFired += 1;
    const saved = now;
    now = at;
    const bucket = dayBucket();
    now = saved;
    bucket.spoke.push('inbound');
    bucket.asks += 1;
    inboundNextAt = at + between(cfg.inboundCooldownMinMin, cfg.inboundCooldownMaxMin) * MIN;
  }

  /** 허브에 있는 동안 upTo 직전까지 울렸어야 할 타이머 요청을 처리한다. */
  function catchUpInbound(upTo: number): void {
    if (cfg.inbound !== 'timer' || !inSession) return;
    if (inboundNextAt <= 0) inboundNextAt = sessionStartMs + between(cfg.inboundFirstMinSec, cfg.inboundFirstMaxSec) * 1000;
    while (inboundNextAt < upTo) fireInbound(Math.max(inboundNextAt, sessionStartMs));
  }

  function fillRecent(): void {
    recent.length = 0;
    forEachRecentPlayerObserve(cfg.recentMax, (e) => recent.push({ verb: e.verb, at: e.at }));
  }

  function decide(world: WorldState, moment: 'session' | 'land' | 'combat'): void {
    res.decisions += 1;
    const day = playerObserveDayOf(now);
    const digest = readPlayerObserveDigest(now);
    const hits = detectStellaSituations(
      input.rows,
      {
        digest,
        hullPct: null,
        sessionStart: moment === 'session',
        sessionGapHours: moment === 'session' && lastSessionEndMs > 0 ? (sessionStartMs - lastSessionEndMs) / HOUR : 0,
        sessionMinutes: (now - sessionStartMs) / MIN,
        localHour: new Date(now + KST).getUTCHours(),
        level: world.level,
        objectiveStallCount: stallCount,
        objectiveStallMinutes: lastQuestAt > 0 ? (now - lastQuestAt) / MIN : (now - cfg.startMs) / MIN,
        adviceIgnoredThenDestroyed: false,
        adviceFollowedThenWon: false,
        announcedFirsts: gs.announcedFirsts,
        lastLevelMark: gs.lastLevelMark,
      },
      { includeDisabled: true },
    );
    // 일상 질문은 허브 진입(세션 시작·착륙)에서만 — 앱도 허브 바인드 때 띄운다.
    if (cfg.life === 'judge' && moment !== 'combat') hits.push(lifeHit);
    fillRecent();
    catchUpInbound(now);
    const originPendingNow = cfg.inbound === 'timer' && inboundNextAt > 0 && inboundNextAt <= now;
    const d = decideStellaObserve(
      hits,
      gs,
      {
        nowMs: now,
        day,
        safeSlot: true,
        otherPopupThisEntry: false,
        originLastAtMs,
        originPendingNow,
        lifeAskLastAtMs,
        stellaOnDuty: false,
        casualFirstHigh: false,
        recent,
      },
      input.policy,
    );
    const bucket = dayBucket();
    let spokeRough = false;
    if (d.kind === 'speak') {
      noteStellaObserveShown(gs, d, { nowMs: now, day, level: world.level });
      const life = isStellaLifeHit(d.hit.row);
      bucket.spoke.push(life ? 'life' : d.hit.row.id);
      const ch = life ? 'life' : d.channel;
      res.channels[ch] = (res.channels[ch] ?? 0) + 1;
      if (d.channel === 'ask' || life) bucket.asks += 1;
      if (d.channel !== 'remark') {
        if (rng() < cfg.acceptP) noteStellaObserveAccepted(gs, d.hit.row.id);
        else noteStellaObserveIgnored(gs, d.hit.row.id, now, input.policy);
      }
      spokeRough = d.hit.row.id === 'sit_rough_day';
    } else {
      res.silent[d.reason] = (res.silent[d.reason] ?? 0) + 1;
      if (d.reason === 'failsafe') res.failsafeHits += 1;
      const blocked = d.reason === 'unsafe' || d.reason === 'popup' || d.reason === 'gap' || d.reason === 'failsafe';
      // §16 라이프 선제 — 현재 앱 동작 그대로 허브 진입 하루 1회, 관찰 상황이 말하지 않았고 대화 요청 대기도 없을 때만.
      if (cfg.life === 'daily' && !blocked && !originPendingNow && moment !== 'combat' && lifeDay !== day) {
        lifeDay = day;
        lifeAskLastAtMs = now;
        bucket.spoke.push('life');
        bucket.asks += 1;
        res.channels.life = (res.channels.life ?? 0) + 1;
      }
    }
    if (originPendingNow) {
      if (d.kind === 'speak') inboundNextAt = nextOriginInboundWindowMs(gs, inboundNextAt, input.policy);
      else fireInbound(now);
    }
    if (pendingCapture) {
      if (!spokeRough) {
        const why = d.kind === 'speak' ? `other:${d.hit.row.id}` : d.reason;
        res.captureMiss[why] = (res.captureMiss[why] ?? 0) + 1;
      }
      const covered = spokeRough || (lastRoughAt > 0 && now - lastRoughAt <= cfg.coveredWithinMin * MIN);
      res.capture.qualifying += 1;
      if (spokeRough) res.capture.strict += 1;
      if (covered) res.capture.covered += 1;
      if (captureFresh) {
        res.capture.freshQualifying += 1;
        if (covered) res.capture.freshCovered += 1;
      }
      pendingCapture = false;
    }
    if (spokeRough) lastRoughAt = now;
    stallCount += 1;
  }

  /** 접속 안 한 동안 스텔라 하루 — 깨어 있고 근무 아닌 칸마다 같은 판단으로 메신저 연락을 남길지 정한다. */
  function reachWhileAway(fromMs: number, toMs: number, world: WorldState): void {
    const step = cfg.reachStepMin * MIN;
    const saved = now;
    const maxSteps = (14 * 24 * 60) / cfg.reachStepMin;
    let steps = 0;
    for (let t = Math.ceil(fromMs / step) * step; t < toMs; t += step) {
      steps += 1;
      if (steps > maxSteps) break;
      if (unread.length >= STELLA_UNREAD_STOP) break;
      const slot = stellaLifeSlotAt(t, cfg.uid);
      if (!isStellaLifeFreeSlot(slot)) continue;
      const day = playerObserveDayOf(t);
      const d = decideStellaObserve(
        [reachHit],
        gs,
        {
          nowMs: t,
          day,
          safeSlot: true,
          otherPopupThisEntry: false,
          originLastAtMs: 0,
          originPendingNow: false,
          lifeAskLastAtMs: 0,
          stellaOnDuty: false,
          casualFirstHigh: false,
          recent: [],
          unread: unread.length,
        },
        input.policy,
      );
      if (d.kind !== 'speak') continue;
      noteStellaObserveShown(gs, d, { nowMs: t, day, level: world.level });
      unread.push(d.hit.row.id);
      now = t;
      dayBucket().spoke.push('reach');
      res.channels.reach = (res.channels.reach ?? 0) + 1;
    }
    now = saved;
  }

  /** 접속하면 쌓인 연락을 읽는다. 읽은 것만으로 확인 — 무시로 치지 않는다. 답하면 수락. 안 읽고 쌓이는 동안은 unread 로 덜 보냄. */
  function readUnread(): void {
    for (const id of unread) if (rng() < cfg.acceptP) noteStellaObserveAccepted(gs, id);
    unread = [];
  }

  function beginSession(world: WorldState): void {
    if (queue.length === 0) planDay();
    const slot = queue.shift()!;
    const nextStart = Math.max(slot.startMs, now + 30 * MIN);
    if (cfg.reach) reachWhileAway(lastSessionEndMs > 0 ? lastSessionEndMs : cfg.startMs, nextStart, world);
    sessionStartMs = nextStart;
    sessionEndMs = sessionStartMs + slot.lenMs;
    now = sessionStartMs;
    inSession = true;
    readUnread();
    dayBucket().sessions += 1;
    recordPlayerObserve('session', '', now);
    decide(world, 'session');
  }

  return {
    onEntry(world: WorldState, e: JournalEntry): void {
      if (!inSession) beginSession(world);
      const [, real] = humanSecondsFor(input.clock, e, prevKind);
      if (real > 0) prevKind = e.kind;
      now += real * 1000;
      playMs += real * 1000;
      let moment: 'land' | 'combat' | null = null;
      const obs = e.obs ?? [];
      for (let i = 0; i < obs.length; i += 1) {
        const o = obs[i]!;
        recordPlayerObserve(o.verb, o.detail, now);
        if (o.verb === 'quest') {
          lastQuestAt = now;
          stallCount = 0;
        }
        // 포착은 「힘든 날」 단위 — 오늘 처음 파괴 2회가 된 순간 1회만 센다.
        if (o.verb === 'destroy' && readPlayerObserveDigest(now).dstr >= 2 && roughDay !== playerObserveDayOf(now)) {
          roughDay = playerObserveDayOf(now);
          pendingCapture = true;
          // 새 힘든 시기 = 최근 사흘 안에 이 걱정을 꺼낸 적 없음. 매일 반복되는 날은 일부러 덜 말한다.
          captureFresh = !(gs.recentShows.sit_rough_day ?? []).some((t) => t >= now - cfg.freshEpisodeHours * HOUR);
        }
        if (o.verb === 'combat') moment = 'combat';
        else if (o.verb === 'land' && moment === null) moment = 'land';
      }
      if (moment) decide(world, moment);
      catchUpInbound(now);
      if (now >= sessionEndMs) {
        inSession = false;
        lastSessionEndMs = now;
      }
    },
    finish(): StellaReplayResult {
      res.humanHours = Math.round((playMs / HOUR) * 10) / 10;
      res.calendarDays = playerObserveDayOf(now) - playerObserveDayOf(cfg.startMs) + 1;
      resetPlayerObserve();
      return res;
    },
  };
}

export type StellaReplayCriterion = { id: string; label: string; value: number; pass: boolean; target: string };

export type StellaReplaySummary = {
  playDays: number;
  calendarDays: number;
  /** 대표님 2026-10-06: 스텔라 하루(깨어 있는 8시간)에 3시간 1회꼴 → 3~4회. */
  requestPerStellaDay: number;
  lifePerStellaDay: number;
  reachPerStellaDay: number;
  perDay: number;
  observePerDay: number;
  lifePerDay: number;
  inboundPerDay: number;
  silentDayRatio: number;
  askHeavyDayRatio: number;
  maxShare: { id: string; share: number };
  streak3: number;
  capture: number;
  captureAll: number;
  captureAllDays: number;
  captureStrict: number;
  captureMiss: Record<string, number>;
  failsafeHits: number;
  rowCount: Record<string, number>;
  rowStreak: Record<string, number>;
  silent: Record<string, number>;
  channels: Record<string, number>;
  criteria: StellaReplayCriterion[];
};

/** §C-8 합격선. 하루 ask 는 예산이 없어졌으므로 「ask 2회 이상인 날 ≤ 10%」로 잰다. */
export function summarizeStellaReplay(results: readonly StellaReplayResult[]): StellaReplaySummary {
  let playDays = 0;
  let spoke = 0;
  let observe = 0;
  let silentDays = 0;
  let askHeavy = 0;
  let qualifying = 0;
  let strict = 0;
  let covered = 0;
  let freshQ = 0;
  let freshC = 0;
  let failsafeHits = 0;
  const captureMiss: Record<string, number> = {};
  const rowCount: Record<string, number> = {};
  const rowStreak: Record<string, number> = {};
  const silent: Record<string, number> = {};
  const channels: Record<string, number> = {};
  const channelSpoke = { life: 0, inbound: 0, reach: 0 };
  let calendarDays = 0;
  let requestsAll = 0;
  for (const r of results) {
    calendarDays += r.calendarDays;
    requestsAll += (r.channels.ask ?? 0) + (r.channels.message ?? 0) + (r.channels.reach ?? 0) + r.inboundFired;
    failsafeHits += r.failsafeHits;
    qualifying += r.capture.qualifying;
    strict += r.capture.strict;
    covered += r.capture.covered;
    freshQ += r.capture.freshQualifying;
    freshC += r.capture.freshCovered;
    for (const [k, v] of Object.entries(r.captureMiss)) captureMiss[k] = (captureMiss[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.silent)) silent[k] = (silent[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.channels)) channels[k] = (channels[k] ?? 0) + v;
    const run: Record<string, number> = {};
    for (const d of r.days) {
      if (d.sessions === 0) continue;
      playDays += 1;
      spoke += d.spoke.length;
      if (d.spoke.length === 0) silentDays += 1;
      if (d.asks >= 2) askHeavy += 1;
      const seen = new Set<string>();
      for (const id of d.spoke) {
        if (id === 'life' || id === 'inbound' || id === 'reach') {
          channelSpoke[id] += 1;
          continue;
        }
        observe += 1;
        rowCount[id] = (rowCount[id] ?? 0) + 1;
        seen.add(id);
      }
      for (const id of Object.keys(run)) if (!seen.has(id)) run[id] = 0;
      for (const id of seen) {
        run[id] = (run[id] ?? 0) + 1;
        if (run[id] === 3) rowStreak[id] = (rowStreak[id] ?? 0) + 1;
      }
    }
  }
  let maxShare = { id: '-', share: 0 };
  for (const [id, n] of Object.entries(rowCount)) {
    const share = observe > 0 ? n / observe : 0;
    if (share > maxShare.share) maxShare = { id, share };
  }
  const streak3 = Object.values(rowStreak).reduce((a, n) => a + n, 0);
  const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
  const perDay = ratio(spoke, playDays);
  const silentDayRatio = ratio(silentDays, playDays);
  const askHeavyDayRatio = ratio(askHeavy, playDays);
  const capture = freshQ > 0 ? freshC / freshQ : 1;
  const criteria: StellaReplayCriterion[] = [
    { id: 'ask_heavy', label: 'ask 2회 이상인 날', value: askHeavyDayRatio, pass: askHeavyDayRatio <= 0.1, target: '≤ 10%' },
    { id: 'max_share', label: `한 상황 점유율 (${maxShare.id})`, value: maxShare.share, pass: maxShare.share <= 0.4, target: '≤ 40%' },
    { id: 'streak3', label: '연속 3일 같은 상황', value: streak3, pass: streak3 === 0, target: '0' },
    { id: 'capture', label: `새 힘든 시기 rough_day 포착 (${freshQ}회)`, value: capture, pass: capture >= 0.8, target: '≥ 80%' },
    { id: 'failsafe', label: '고장 방지 상한 도달', value: failsafeHits, pass: failsafeHits === 0, target: '0' },
  ];
  const requestPerStellaDay = ratio(requestsAll, calendarDays);
  criteria.unshift({
    id: 'request_stella_day',
    label: '스텔라 하루당 대화 요청 (질문·연락 · 일상 질문 제외)',
    value: requestPerStellaDay,
    pass: requestPerStellaDay >= 3 && requestPerStellaDay <= 4,
    target: '3 ~ 4',
  });
  return {
    playDays,
    calendarDays,
    requestPerStellaDay,
    lifePerStellaDay: ratio(channels.life ?? 0, calendarDays),
    reachPerStellaDay: ratio(channels.reach ?? 0, calendarDays),
    perDay,
    observePerDay: ratio(observe, playDays),
    lifePerDay: ratio(channelSpoke.life, playDays),
    inboundPerDay: ratio(channelSpoke.inbound, playDays),
    silentDayRatio,
    askHeavyDayRatio,
    maxShare,
    streak3,
    capture,
    captureAll: qualifying > 0 ? covered / qualifying : 1,
    captureAllDays: qualifying,
    captureStrict: qualifying > 0 ? strict / qualifying : 1,
    captureMiss,
    failsafeHits,
    rowCount,
    rowStreak,
    silent,
    channels,
    criteria,
  };
}

/** 지금 앱에서 켤 수 없는 행 — 측정과 무관하게 후보에서 뺀다. */
export const STELLA_ROW_BLOCKED: Record<string, string> = {
  sit_rough_day: '잠금 4 — 앱 파괴 방출(G6) 전',
  sit_advice_ignored_hurt: '잠금 4 · O6 전 입력 없음',
  sit_advice_followed_ok: 'O6 전 입력 없음',
  sit_risky_launch: '봇에 내구도 % 없음 · G6 후 측정',
  sit_welcome_back: '앱 session 방출 전 (재생은 가정 방출)',
};
