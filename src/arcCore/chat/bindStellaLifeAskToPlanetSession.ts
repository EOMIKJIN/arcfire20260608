import { AppState } from 'react-native';
import { isIngameDialogActive } from '../../game/ingameDialog/ingameDialogApi';
import { runAfterIngameDialogIdle } from '../../game/ingameDialog/ingameDialogIdle';
import {
  forEachRecentPlayerObserve,
  playerObserveDayOf,
  readPlayerObserveDigest,
} from '../../game/playerObserve/playerObserveSink';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { useWaveDefenseStore } from '../../game/waveDefense/waveDefenseStore';
import { resolveDictionaryLocale } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useArcCoreChatStore } from '../../store/arcCoreChatStore';
import { usePlayerStore } from '../../store/playerStore';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { isArcCoreAgentSurfaceOpen } from './arcCoreAgentSurfaceStore';
import { ARC_CORE_INBOUND_DND_DEFAULT, isInboundTalkDndBlocked } from './arcCoreInboundTalkDnd';
import { hasInboundTalkPending } from './arcCoreInboundTalkPending';
import { isInboundTalkSafeSlot } from './arcCoreInboundTalkRequestPolicy';
import { isArcCoreTutorialForceActive } from './arcCoreChatTutorialForce';
import {
  STELLA_LIFE_MESSAGE_REASON,
  isStellaMessageNoticeHeld,
  presentStellaMessageNotice,
} from './stellaMessageNotice';
import { resolveStellaHumanAsk } from './stellaLifeAsk';
import { clearStellaLifeAskPending } from './stellaLifeAskPending';
import { stellaLifeKstParts } from './stellaLifeClock';
import { readStellaLifeEnv, readStellaLifeUid } from './stellaLifeEnvRead';
import { snapshotStellaLifeMemory } from './stellaLifeMemory';
import { clearStellaLifeSessionCache, readStellaLifeSession } from './stellaLifeSession';
import {
  decideStellaObserve,
  isStellaLifeHit,
  noteStellaObserveShown,
  stellaLifeAskHit,
  type StellaObserveRecent,
} from './stellaObserveGate';
import { readStellaObserveGate, touchStellaHubTalkBadge } from './stellaObserveGateMemory';
import {
  detectStellaSituations,
  renderStellaObserveLine,
  type StellaObserveHit,
} from './stellaObserveSituations';
import { getStellaObserveGatePolicy, listStellaObserveSituations } from './stellaObserveTableIndex';
import { STELLA_REACH_REASON, walkStellaReachAway } from './stellaReachCatchUp';

let hubEnteredAtMs = 0;

function readSafeSlot(): boolean {
  return isInboundTalkSafeSlot({
    hubArmed: true,
    appActive: AppState.currentState === 'active',
    overlayBusy: useArcOverlayStore.getState().stack.length > 0 || isArcCoreAgentSurfaceOpen(),
    dialogBusy: isIngameDialogActive(),
    waveActive: useWaveDefenseStore.getState().active === true,
  });
}

function fillRecent(into: StellaObserveRecent[]): void {
  into.length = 0;
  forEachRecentPlayerObserve(16, (e) => {
    into.push({ verb: e.verb, at: e.at });
  });
}

/** 접속 사이 쉬는 칸 연락을 메신저 보관함에만 넣는다. 팝업은 띄우지 않는다. */
function queueReachSinceLastHub(): void {
  const chat = useArcCoreChatStore.getState();
  if (!chat.operatorIntroPlayed) return;
  const gate = readStellaObserveGate();
  const nowMs = Date.now();
  if (gate.lastHubAtMs <= 0 || nowMs <= gate.lastHubAtMs) return;
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const lines = walkStellaReachAway({
    state: gate,
    fromMs: gate.lastHubAtMs,
    toMs: nowMs,
    uid: readStellaLifeUid(),
    level: usePlayerStore.getState().player?.level ?? 1,
  });
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    useArcCoreChatStore.getState().appendArchiveMessage({
      role: 'arc',
      text: locale === 'en' ? line.textEn : line.textKo,
      reason: STELLA_REACH_REASON,
      speakerId: 'operator',
      atMs: line.atMs,
    });
  }
}

function tryPresentStellaJudgment(disposed: () => boolean): void {
  if (disposed()) return;
  if (hasInboundTalkPending()) return;
  if (isArcCoreTutorialForceActive()) return;
  if (isInboundTalkDndBlocked(new Date(), ARC_CORE_INBOUND_DND_DEFAULT)) return;
  if (isIngameDialogActive()) {
    runAfterIngameDialogIdle(() => {
      tryPresentStellaJudgment(disposed);
    });
    return;
  }
  if (!readSafeSlot()) return;
  const chat = useArcCoreChatStore.getState();
  if (!chat.operatorIntroPlayed) return;

  const nowMs = Date.now();
  const uid = readStellaLifeUid();
  const resolved = readStellaLifeSession(nowMs, uid, readStellaLifeEnv(nowMs));
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const snapshot = snapshotStellaLifeMemory();
  const why = resolveStellaHumanAsk({
    resolved,
    snapshot,
    locale,
    tutorialForce: false,
    operatorIntroPlayed: true,
    nowMs,
    ignoreDailyQuota: true,
  });
  const gate = readStellaObserveGate();
  const policy = getStellaObserveGatePolicy();
  const hits: StellaObserveHit[] = detectStellaSituations(listStellaObserveSituations(), {
    digest: readPlayerObserveDigest(nowMs),
    hullPct: null,
    sessionStart: false,
    sessionGapHours: 0,
    sessionMinutes: hubEnteredAtMs > 0 ? (nowMs - hubEnteredAtMs) / 60_000 : 0,
    localHour: stellaLifeKstParts(nowMs).hour,
    level: usePlayerStore.getState().player?.level ?? 1,
    objectiveStallCount: 0,
    objectiveStallMinutes: 0,
    adviceIgnoredThenDestroyed: false,
    adviceFollowedThenWon: false,
    announcedFirsts: gate.announcedFirsts,
    lastLevelMark: gate.lastLevelMark,
  });
  if (why) hits.push(stellaLifeAskHit(why.motiveId, why.askId, policy));
  if (hits.length === 0) return;

  const recent: StellaObserveRecent[] = [];
  fillRecent(recent);
  const decision = decideStellaObserve(hits, gate, {
    nowMs,
    day: playerObserveDayOf(nowMs),
    safeSlot: true,
    otherPopupThisEntry: false,
    originLastAtMs: 0,
    originPendingNow: false,
    lifeAskLastAtMs: 0,
    stellaOnDuty: resolved.dutyOrOff === 'duty',
    casualFirstHigh: snapshot.cognition.casualFirst >= 70,
    recent,
  }, policy);
  if (decision.kind !== 'speak') return;

  noteStellaObserveShown(gate, decision, {
    nowMs,
    day: playerObserveDayOf(nowMs),
    level: usePlayerStore.getState().player?.level ?? 1,
  });
  const life = isStellaLifeHit(decision.hit.row);
  const text = life && why
    ? why.textKo
    : renderStellaObserveLine(decision.hit, locale);
  if (!text) return;
  // 선제는 질문이든 메시지든 메신저에 남긴다. 알림은 tryNotifyStellaMessage 하나.
  useArcCoreChatStore.getState().appendArchiveMessage({
    role: 'arc',
    text,
    reason: life ? STELLA_LIFE_MESSAGE_REASON : decision.hit.row.id,
    speakerId: 'operator',
    atMs: nowMs,
  });
}

const NOTICE_RETRY_MS = 20_000;
const NOTICE_MAX_TRIES = 6;
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

function clearNoticeTimer(): void {
  if (noticeTimer) {
    clearTimeout(noticeTimer);
    noticeTimer = null;
  }
}

function tryNotifyStellaMessage(disposed: () => boolean, tries: number): void {
  noticeTimer = null;
  if (disposed()) return;
  if (isInboundTalkDndBlocked(new Date(), ARC_CORE_INBOUND_DND_DEFAULT)) return;
  if (isIngameDialogActive()) {
    runAfterIngameDialogIdle(() => {
      tryNotifyStellaMessage(disposed, tries);
    });
    return;
  }
  // 가이드·첫 입장 수락/거절이 메신저 문인 동안은 알림을 미룬다. 본편 임무 활성은 이유가 아니다.
  // 20초 폴링은 하지 않는다. 가이드가 끝나면 watchStellaNoticeHoldRelease가 한 번 다시 본다.
  if (isStellaMessageNoticeHeld()) return;
  if (!readSafeSlot()) {
    if (tries + 1 < NOTICE_MAX_TRIES) {
      noticeTimer = setTimeout(() => tryNotifyStellaMessage(disposed, tries + 1), NOTICE_RETRY_MS);
    }
    return;
  }
  presentStellaMessageNotice(Date.now());
}

function runStellaHubTurn(disposed: () => boolean): void {
  if (disposed()) return;
  if (hubEnteredAtMs <= 0) hubEnteredAtMs = Date.now();
  queueReachSinceLastHub();
  const gate = readStellaObserveGate();
  gate.lastHubAtMs = Date.now();
  useArcCoreChatStore.getState().touchPersist();
  tryPresentStellaJudgment(disposed);
  clearNoticeTimer();
  tryNotifyStellaMessage(disposed, 0);
  touchStellaHubTalkBadge();
}

/**
 * 가이드가 끝나거나 오퍼레이터 첫 입장이 찍히면 알림을 한 번 다시 본다.
 * 플레이어 스토어의 다른 갱신(크레딧 등)은 본 장면 목록이 그대로면 바로 돌아간다.
 */
function watchStellaNoticeHoldRelease(
  disposed: () => boolean,
  onRelease: () => void,
): () => void {
  let seen = usePlayerStore.getState().player?.flags.seenStorySceneIds;
  let intro = useArcCoreChatStore.getState().operatorIntroPlayed;
  const poke = () => {
    if (disposed()) return;
    if (isStellaMessageNoticeHeld()) return;
    onRelease();
  };
  const unsubPlayer = usePlayerStore.subscribe((state) => {
    const next = state.player?.flags.seenStorySceneIds;
    if (next === seen) return;
    seen = next;
    poke();
  });
  const unsubChat = useArcCoreChatStore.subscribe((state) => {
    if (state.operatorIntroPlayed === intro) return;
    intro = state.operatorIntroPlayed;
    poke();
  });
  return () => {
    unsubPlayer();
    unsubChat();
  };
}

/** 허브를 떠나거나 앱이 화면 뒤로 갈 때 — 그 뒤부터만 「접속 안 한 동안」으로 소급한다. */
function stampStellaPresence(): void {
  if (!useArcCoreChatStore.getState().hydrated) return;
  readStellaObserveGate().lastHubAtMs = Date.now();
  useArcCoreChatStore.getState().touchPersist();
}

export function bindStellaLifeAskToPlanetSession(planetId: string): () => void {
  let disposed = false;
  const isDisposed = () => disposed;
  void useArcCoreChatStore
    .getState()
    .ensureHydrated()
    .then(() => runStellaHubTurn(isDisposed));
  const releaseHoldWatch = watchStellaNoticeHoldRelease(isDisposed, () => {
    clearNoticeTimer();
    tryNotifyStellaMessage(isDisposed, 0);
  });
  const appSub = AppState.addEventListener('change', (next) => {
    if (disposed) return;
    if (next === 'active') {
      if (useArcCoreChatStore.getState().hydrated) runStellaHubTurn(isDisposed);
    } else {
      // inactive도 찍는다. 잠깐 화면을 내렸다가 돌아오면, 허브에 있던 시간이 부재로 소급되지 않게.
      stampStellaPresence();
    }
  });
  const token = registerPlanetSessionResource({
    ownerId: 'stella_life_ask',
    planetId,
    dispose: () => {
      disposed = true;
      appSub.remove();
      releaseHoldWatch();
      stampStellaPresence();
      clearNoticeTimer();
      clearStellaLifeAskPending();
      clearStellaLifeSessionCache();
    },
  });
  return () => {
    token.release();
  };
}
