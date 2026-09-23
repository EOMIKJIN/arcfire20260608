/**
 * 스텔라 선제 대화 요청 — 허브 안전 슬롯에서 1차 통신을 바로 띄운다.
 * 40초 first_idle 자동닫힘 = 취소. 수락만 메신저. pending 배지 대기 없음.
 */

import { AppState } from 'react-native';
import { isIngameDialogActive } from '../../game/ingameDialog/ingameDialogApi';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { useWaveDefenseStore } from '../../game/waveDefense/waveDefenseStore';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { ARC_CORE_INBOUND_DND_DEFAULT, isInboundTalkDndBlocked } from './arcCoreInboundTalkDnd';
import {
  ARC_CORE_INBOUND_TALK_COOLDOWN_MAX_MS,
  ARC_CORE_INBOUND_TALK_COOLDOWN_MIN_MS,
  ARC_CORE_INBOUND_TALK_FIRST_DELAY_MAX_MS,
  ARC_CORE_INBOUND_TALK_FIRST_DELAY_MIN_MS,
  ARC_CORE_INBOUND_TALK_UNSAFE_RETRY_MS,
  computeInboundTalkWaitMs,
  isInboundTalkSafeSlot,
  rollBoundedDelayMs,
} from './arcCoreInboundTalkRequestPolicy';
import {
  readInboundTalkHubArmed,
  readInboundTalkNextEligibleAt,
  resetArcCoreInboundTalkSchedule,
  writeInboundTalkHubArmed,
  writeInboundTalkNextEligibleAt,
} from './arcCoreInboundTalkSchedule';
import { clearInboundTalkPending } from './arcCoreInboundTalkPending';
import { presentOperatorInboundFirstComm } from '../../game/conversation/presentOperatorInboundFirstComm';
import {
  bindArcCoreInboundTalkWhy,
  type ArcCoreInboundTalkWhySnap,
} from './arcCoreInboundTalkWhy';

export { ARC_CORE_INBOUND_TALK_ALERT_ID } from './arcCoreInboundTalkRequestPolicy';

let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function readInboundTalkWhySnap(): ArcCoreInboundTalkWhySnap {
  const { resolveDictionaryLocale } = require('../../i18n') as typeof import('../../i18n');
  const { useAppSettingsStore } = require('../../store/appSettingsStore') as typeof import('../../store/appSettingsStore');
  const { readArcCoreChatFacts } = require('./arcCoreChatTurnFacts') as typeof import('./arcCoreChatTurnFacts');
  const { readArcCoreChatGmSession } = require('./arcCoreChatGmBeat') as typeof import('./arcCoreChatGmBeat');
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const facts = readArcCoreChatFacts([]);
  const gm = readArcCoreChatGmSession(locale);
  let worldFact = '';
  let hasWorldChange = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const memory = require('../../store/orbitPresenceMemoryStore') as typeof import('../../store/orbitPresenceMemoryStore');
    const digest = memory.getLastHubWorldChangeDigest();
    worldFact = digest?.factLine?.trim() ?? '';
    hasWorldChange = Boolean(worldFact);
  } catch {
    /* node test / 미기동 */
  }
  return bindArcCoreInboundTalkWhy({
    spyAlertPending: facts.spyAlertPending,
    hasCombatRecord: facts.hasCombatRecord,
    hasStoryBeat: Boolean(facts.hasStoryBeat || gm.hasStoryBeat),
    planetLabel: facts.planetLabel,
    steerLine: gm.steerLine,
    locale,
    hasWorldChange,
    worldFact,
  });
}

function clearPendingTimer(): void {
  if (pendingTimer == null) return;
  clearTimeout(pendingTimer);
  pendingTimer = null;
}

function ensureFirstEligibleAt(nowMs = Date.now()): void {
  if (readInboundTalkNextEligibleAt() > 0) return;
  writeInboundTalkNextEligibleAt(nowMs + rollBoundedDelayMs(
    ARC_CORE_INBOUND_TALK_FIRST_DELAY_MIN_MS,
    ARC_CORE_INBOUND_TALK_FIRST_DELAY_MAX_MS,
  ));
}

function applyCooldown(nowMs = Date.now()): void {
  writeInboundTalkNextEligibleAt(nowMs + rollBoundedDelayMs(
    ARC_CORE_INBOUND_TALK_COOLDOWN_MIN_MS,
    ARC_CORE_INBOUND_TALK_COOLDOWN_MAX_MS,
  ));
}

/** 수동·전투후 등 채널이 이미 열리면 선제 요청을 바로 다시 띄우지 않는다. */
export function noteArcCoreChatPresented(): void {
  applyCooldown();
}

function readOverlayBusy(): boolean {
  const { isArcCoreAgentSurfaceOpen } =
    require('./arcCoreAgentSurfaceStore') as typeof import('./arcCoreAgentSurfaceStore');
  return useArcOverlayStore.getState().stack.length > 0 || isArcCoreAgentSurfaceOpen();
}

function readWaveActive(): boolean {
  return useWaveDefenseStore.getState().active === true;
}

function readSafeSlot(): boolean {
  return isInboundTalkSafeSlot({
    hubArmed: readInboundTalkHubArmed(),
    appActive: AppState.currentState === 'active',
    overlayBusy: readOverlayBusy(),
    dialogBusy: isIngameDialogActive(),
    waveActive: readWaveActive(),
  });
}

function presentInboundTalkRequestAlert(): boolean {
  const why = readInboundTalkWhySnap();
  const opened = presentOperatorInboundFirstComm({
    askText: why.text,
    onAccept: () => {
      const { presentArcCoreBackchannel } =
        require('./presentArcCoreBackchannel') as typeof import('./presentArcCoreBackchannel');
      void presentArcCoreBackchannel({
        reason: 'inbound_request',
        forceFreshSession: true,
        openerText: why.text,
        speakerId: 'operator',
      });
    },
    onCancel: () => {
      /* 40초 자동닫힘·취소 — 메신저 금지 */
    },
  });
  if (opened) applyCooldown();
  return opened;
}

function tryFireInboundTalkRequest(): void {
  pendingTimer = null;
  if (!readInboundTalkHubArmed()) return;
  const { isArcCoreTutorialForceActive } = require('./arcCoreChatTutorialForce') as typeof import('./arcCoreChatTutorialForce');
  if (
    !readSafeSlot()
    || isInboundTalkDndBlocked(new Date(), ARC_CORE_INBOUND_DND_DEFAULT)
    || isArcCoreTutorialForceActive()
  ) {
    pendingTimer = setTimeout(tryFireInboundTalkRequest, ARC_CORE_INBOUND_TALK_UNSAFE_RETRY_MS);
    return;
  }
  if (!presentInboundTalkRequestAlert()) {
    pendingTimer = setTimeout(tryFireInboundTalkRequest, ARC_CORE_INBOUND_TALK_UNSAFE_RETRY_MS);
  }
}

function armPendingTimer(): void {
  clearPendingTimer();
  if (!readInboundTalkHubArmed()) return;
  ensureFirstEligibleAt();
  const wait = computeInboundTalkWaitMs(readInboundTalkNextEligibleAt(), Date.now());
  pendingTimer = setTimeout(tryFireInboundTalkRequest, wait);
}

export function armArcCoreInboundTalkHubSlot(): void {
  writeInboundTalkHubArmed(true);
  armPendingTimer();
}

export function disarmArcCoreInboundTalkHubSlot(): void {
  writeInboundTalkHubArmed(false);
  clearPendingTimer();
  clearInboundTalkPending();
}

/** 계정 초기화 — 쿨다운 잔류로 신규 세션이 8–15분 침묵하지 않게 한다. */
export function resetArcCoreInboundTalkRequestForAccountPurge(): void {
  clearPendingTimer();
  clearInboundTalkPending();
  resetArcCoreInboundTalkSchedule();
}

/** 행성 허브 포커스 동안만 타이머 보유 — blur/세션 dispose에서 해제 */
export function bindArcCoreInboundTalkRequestToPlanetSession(planetId: string): () => void {
  armArcCoreInboundTalkHubSlot();
  const token = registerPlanetSessionResource({
    ownerId: 'arc_core_inbound_talk_request',
    planetId,
    dispose: () => {
      disarmArcCoreInboundTalkHubSlot();
    },
  });
  return () => {
    token.release();
  };
}
