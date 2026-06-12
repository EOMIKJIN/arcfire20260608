import { create } from 'zustand';
import {
  dispatchArcCoreCommand,
  subscribeArcCoreCommands,
  type ArcCoreCommand,
} from '../arcCore/ArcCoreCommandBus';
import {
  ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS,
  ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS,
} from '../arcCore/message/arcCoreMessagePolicy';
import { readPlanetOrbitClockMs } from '../arcCore/orbitClockMsBridge';
import { rollDefenseSatelliteInterceptSuccess } from '../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { resolvePlanetDefenseInterceptRoll } from '../systems/planetaryDefense';
import type { PlanetDefenseInterceptRollResult } from '../systems/planetaryDefense/planetDefenseSatelliteService';
import {
  buildDefenseInterceptVisualPlan,
  type DefenseInterceptVisualPlan,
} from '../arcCore/message/defenseInterceptVisualPlan';

export type ArcCoreMessageStrikePhase = 'warning' | 'inbound';

export type ArcCoreMessageStrikeView = {
  strikeId: string;
  planetId: string;
  messageKo: string;
  phase: ArcCoreMessageStrikePhase;
  warningEndsAtMs: number;
  missileStartMs: number;
  missileTravelMs: number;
  nearMissDispatched: boolean;
  /** inbound 시 1회 선행 롤 — 연출·최종 판정 동기 */
  interceptRoll: PlanetDefenseInterceptRollResult | null;
  interceptVisualPlan: DefenseInterceptVisualPlan | null;
};

interface ArcCoreMessageState {
  strike: ArcCoreMessageStrikeView | null;
  clearStrikeForPlanet: (planetId: string) => void;
  clearAllStrikes: () => void;
  /** 주 요격탄 예측 교차점 통과 시 1회 확률 롤 */
  resolveInterceptRollAtCrossing: (
    planetId: string,
    strikeId: string,
    relativeMs: number,
  ) => boolean;
  /** inbound 애니메이션 종료 시 1회 호출 */
  tryCompleteNearMiss: (planetId: string, nowMs: number) => void;
}

function makeStrikeId(planetId: string): string {
  return `arc_msg_${planetId}_${Date.now()}`;
}

function applyWarningCommand(cmd: Extract<ArcCoreCommand, { type: 'arc_core_message_missile_warning' }>): void {
  const now = Date.now();
  useArcCoreMessageStore.setState({
    strike: {
      strikeId: makeStrikeId(cmd.planetId),
      planetId: cmd.planetId,
      messageKo: cmd.messageKo,
      phase: 'warning',
      warningEndsAtMs: now + cmd.warningDurationSec * 1000,
      missileStartMs: 0,
      missileTravelMs: ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS,
      nearMissDispatched: false,
      interceptRoll: null,
      interceptVisualPlan: null,
    },
  });
}

function applyInboundCommand(cmd: Extract<ArcCoreCommand, { type: 'arc_core_message_missile_inbound' }>): void {
  const now = Date.now();
  const prev = useArcCoreMessageStore.getState().strike;
  const strikeId = prev?.planetId === cmd.planetId ? prev.strikeId : makeStrikeId(cmd.planetId);
  const orbitClockAtInboundMs = readPlanetOrbitClockMs();
  const interceptRoll = resolvePlanetDefenseInterceptRoll(cmd.planetId, strikeId, {
    travelMs: cmd.travelMs,
    orbitClockAtInboundMs,
  });
  const interceptVisualPlan = buildDefenseInterceptVisualPlan({
    planetId: cmd.planetId,
    strikeId,
    roll: interceptRoll,
    inboundStartMs: now,
    travelMs: cmd.travelMs,
    trajectoryPattern: cmd.trajectoryPattern ?? null,
  });
  const rollWithEngagement: PlanetDefenseInterceptRollResult = {
    ...interceptRoll,
    engagementEligible: interceptVisualPlan?.engagementEligible ?? false,
  };
  useArcCoreMessageStore.setState({
    strike: {
      strikeId,
      planetId: cmd.planetId,
      messageKo: cmd.messageKo,
      phase: 'inbound',
      warningEndsAtMs: prev?.warningEndsAtMs ?? now,
      missileStartMs: now,
      missileTravelMs: cmd.travelMs,
      nearMissDispatched: false,
      interceptRoll: rollWithEngagement,
      interceptVisualPlan,
    },
  });
}

let commandBridgeInstalled = false;

function ensureArcCoreMessageCommandBridge(): void {
  if (commandBridgeInstalled) return;
  commandBridgeInstalled = true;
  subscribeArcCoreCommands((cmd) => {
    if (cmd.type === 'arc_core_message_missile_warning') {
      applyWarningCommand(cmd);
      return;
    }
    if (cmd.type === 'arc_core_message_missile_inbound') {
      applyInboundCommand(cmd);
    }
  });
}

ensureArcCoreMessageCommandBridge();

export const useArcCoreMessageStore = create<ArcCoreMessageState>((set, get) => ({
  strike: null,

  clearStrikeForPlanet: (planetId) => {
    const s = get().strike;
    if (s?.planetId === planetId) {
      set({ strike: null });
    }
  },

  clearAllStrikes: () => set({ strike: null }),

  resolveInterceptRollAtCrossing: (planetId, strikeId, relativeMs) => {
    const s = get().strike;
    if (!s || s.planetId !== planetId || s.strikeId !== strikeId) return false;
    const roll = s.interceptRoll;
    if (!roll?.hasActiveSatellites) return false;
    if (roll.rollAttempted) return roll.interceptSucceeded;

    const interceptSucceeded = rollDefenseSatelliteInterceptSuccess(
      strikeId,
      planetId,
      roll.defenseLevel,
    );
    const nextRoll: PlanetDefenseInterceptRollResult = {
      ...roll,
      rollAttempted: true,
      interceptSucceeded,
    };
    let nextPlan = s.interceptVisualPlan;
    if (nextPlan && interceptSucceeded) {
      nextPlan = {
        ...nextPlan,
        interceptSucceeded: true,
        interceptAtMs: relativeMs,
        missiles: nextPlan.missiles.map((m, i) =>
          i === 0 ? { ...m, willHit: true } : m,
        ),
      };
    }
    set({
      strike: {
        ...s,
        interceptRoll: nextRoll,
        interceptVisualPlan: nextPlan,
      },
    });
    return interceptSucceeded;
  },

  tryCompleteNearMiss: (planetId, nowMs) => {
    const s = get().strike;
    if (!s || s.planetId !== planetId || s.phase !== 'inbound' || s.nearMissDispatched) return;
    const endMs = s.missileStartMs + s.missileTravelMs + ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS;
    if (nowMs < endMs) return;
    set({ strike: { ...s, nearMissDispatched: true } });

    const roll = s.interceptRoll ?? resolvePlanetDefenseInterceptRoll(planetId, s.strikeId);
    if (roll.rollAttempted && roll.interceptSucceeded) {
      dispatchArcCoreCommand({
        type: 'arc_core_message_missile_intercepted',
        planetId,
        messageKo: s.messageKo,
        weaponId: roll.weaponId ?? undefined,
        satelliteCount: roll.activeSatelliteCount,
        defenseLevel: roll.defenseLevel,
        interceptChancePct: roll.interceptChancePct,
        meta: { origin: 'arc_core_policy', reason: 'defense_satellite_intercept' },
      });
      set({ strike: null });
      return;
    }

    dispatchArcCoreCommand({
      type: 'arc_core_message_missile_near_miss',
      planetId,
      messageKo: s.messageKo,
      defenseLevel: roll.hasActiveSatellites ? roll.defenseLevel : undefined,
      interceptChancePct: roll.hasActiveSatellites ? roll.interceptChancePct : undefined,
      interceptRollFailed: roll.rollAttempted && !roll.interceptSucceeded,
      meta: { origin: 'arc_core_policy', reason: 'arc_core_message_near_miss' },
    });
    set({ strike: null });
  },
}));

export function isArcCoreMessageWarningVisible(
  strike: ArcCoreMessageStrikeView | null,
  planetId: string | null | undefined,
  nowMs: number,
): boolean {
  if (!strike || !planetId || strike.planetId !== planetId) return false;
  return strike.phase === 'warning' && nowMs < strike.warningEndsAtMs;
}

export function isArcCoreMessageMissileVisible(
  strike: ArcCoreMessageStrikeView | null,
  planetId: string | null | undefined,
  nowMs: number,
): boolean {
  if (!strike || !planetId || strike.planetId !== planetId) return false;
  if (strike.phase !== 'inbound' || strike.missileStartMs <= 0) return false;
  const endMs = strike.missileStartMs + strike.missileTravelMs + ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS;
  return nowMs < endMs;
}
