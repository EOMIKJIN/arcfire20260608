import { create } from 'zustand';
import {
  dispatchArcCoreCommand,
  subscribeArcCoreCommands,
  type ArcCoreCommand,
} from '../arcCore/ArcCoreCommandBus';
import {
  ARC_CORE_MESSAGE_DEFAULT_KO,
  ARC_CORE_MESSAGE_MISSILE_TRAIL_FADE_MS,
  ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS,
} from '../arcCore/message/arcCoreMessagePolicy';
import { readPlanetOrbitClockMs } from '../arcCore/orbitClockMsBridge';
import { rollDefenseSatelliteInterceptSuccessForSlot } from '../arcCore/balance/planetDefenseSatelliteLevelPolicy';
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
  interceptRoll: PlanetDefenseInterceptRollResult | null;
  interceptVisualPlan: DefenseInterceptVisualPlan | null;
};

/** dev 20초 요격 버스트 — 정적 inbound/위성과 분리 */
export type ArcCoreDevInterceptBurstView = {
  planetId: string;
  strikeId: string;
  burstStartMs: number;
  interceptRoll: PlanetDefenseInterceptRollResult;
  interceptVisualPlan: DefenseInterceptVisualPlan;
  burstCompleted: boolean;
};

interface ArcCoreMessageState {
  strike: ArcCoreMessageStrikeView | null;
  devInterceptBurst: ArcCoreDevInterceptBurstView | null;
  clearStrikeForPlanet: (planetId: string) => void;
  clearDevInterceptBurstForPlanet: (planetId: string) => void;
  clearAllStrikes: () => void;
  resolveInterceptRollAtCrossing: (
    planetId: string,
    strikeId: string,
    relativeMs: number,
    slotIndex: number,
  ) => boolean;
  tryCompleteNearMiss: (planetId: string, nowMs: number, opts?: { force?: boolean; visualReady?: boolean }) => void;
  tryCompleteDevInterceptBurst: (planetId: string) => void;
}

function makeStrikeId(planetId: string): string {
  return `arc_msg_${planetId}_${Date.now()}`;
}

function applyInterceptRollAtCrossing(input: {
  planetId: string;
  strikeId: string;
  relativeMs: number;
  slotIndex: number;
  roll: PlanetDefenseInterceptRollResult;
  plan: DefenseInterceptVisualPlan | null;
}): { roll: PlanetDefenseInterceptRollResult; plan: DefenseInterceptVisualPlan | null; succeeded: boolean; mutated: boolean } {
  const { planetId, strikeId, relativeMs, slotIndex, roll, plan } = input;
  if (!roll.hasActiveSatellites || !plan) {
    return { roll, plan, succeeded: false, mutated: false };
  }
  const slot = plan.missiles[slotIndex];
  if (!slot) {
    return { roll, plan, succeeded: false, mutated: false };
  }
  if (slot.rollAttempted) {
    return { roll, plan, succeeded: slot.willHit, mutated: false };
  }

  const interceptChancePct = slot.interceptChancePct;
  const missileHit = rollDefenseSatelliteInterceptSuccessForSlot(
    strikeId,
    planetId,
    slot.satelliteId,
    slotIndex,
    interceptChancePct,
  );

  const nextPlan: DefenseInterceptVisualPlan = {
    ...plan,
    interceptSucceeded: plan.interceptSucceeded || missileHit,
    interceptAtMs: missileHit ? relativeMs : plan.interceptAtMs,
    missiles: plan.missiles.map((m, i) =>
      i === slotIndex
        ? { ...m, willHit: missileHit, rollAttempted: true }
        : m,
    ),
  };
  const nextRoll: PlanetDefenseInterceptRollResult = {
    ...roll,
    rollAttempted: roll.rollAttempted || true,
    interceptSucceeded: roll.interceptSucceeded || missileHit,
  };
  return { roll: nextRoll, plan: nextPlan, succeeded: missileHit, mutated: true };
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
  const travelMs = cmd.travelMs ?? ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS;
  const interceptRoll = resolvePlanetDefenseInterceptRoll(cmd.planetId, strikeId, {
    travelMs,
    orbitClockAtInboundMs,
  });
  const interceptVisualPlan = buildDefenseInterceptVisualPlan({
    planetId: cmd.planetId,
    strikeId,
    roll: interceptRoll,
    inboundStartMs: now,
    travelMs,
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
      missileTravelMs: travelMs,
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
  devInterceptBurst: null,

  clearStrikeForPlanet: (planetId) => {
    const s = get().strike;
    const patch: Partial<ArcCoreMessageState> = {};
    if (s?.planetId === planetId) patch.strike = null;
    const burst = get().devInterceptBurst;
    if (burst?.planetId === planetId) patch.devInterceptBurst = null;
    if (Object.keys(patch).length > 0) set(patch);
  },

  clearDevInterceptBurstForPlanet: (planetId) => {
    const burst = get().devInterceptBurst;
    if (burst?.planetId === planetId) {
      set({ devInterceptBurst: null });
    }
  },

  clearAllStrikes: () => set({ strike: null, devInterceptBurst: null }),

  resolveInterceptRollAtCrossing: (planetId, strikeId, relativeMs, slotIndex) => {
    const s = get().strike;
    if (!s || s.planetId !== planetId || s.strikeId !== strikeId) return false;
    const applied = applyInterceptRollAtCrossing({
      planetId,
      strikeId,
      relativeMs,
      slotIndex,
      roll: s.interceptRoll!,
      plan: s.interceptVisualPlan,
    });
    if (applied.mutated) {
      set({
        strike: {
          ...s,
          interceptRoll: applied.roll,
          interceptVisualPlan: applied.plan,
        },
      });
    }
    return applied.succeeded;
  },

  tryCompleteNearMiss: (planetId, _nowMs, opts) => {
    const s = get().strike;
    if (!s || s.planetId !== planetId || s.phase !== 'inbound' || s.nearMissDispatched) return;
    const roll = s.interceptRoll;
    const forceEarly = opts?.force === true;
    const visualReady = opts?.visualReady === true;
    // strike 종료는 planetHub strikeVisualGate(inbound+intercept) 경유 visualReady만 허용.
    if (!forceEarly && !visualReady) return;
    set({ strike: { ...s, nearMissDispatched: true } });

    const resolvedRoll = roll ?? resolvePlanetDefenseInterceptRoll(planetId, s.strikeId);
    if (resolvedRoll.rollAttempted && resolvedRoll.interceptSucceeded) {
      dispatchArcCoreCommand({
        type: 'arc_core_message_missile_intercepted',
        planetId,
        messageKo: s.messageKo,
        weaponId: resolvedRoll.weaponId ?? undefined,
        satelliteCount: resolvedRoll.activeSatelliteCount,
        defenseLevel: resolvedRoll.defenseLevel,
        interceptChancePct: resolvedRoll.interceptChancePct,
        meta: { origin: 'arc_core_policy', reason: 'defense_satellite_intercept' },
      });
      set({ strike: null });
      return;
    }

    dispatchArcCoreCommand({
      type: 'arc_core_message_missile_near_miss',
      planetId,
      messageKo: s.messageKo,
      defenseLevel: resolvedRoll.hasActiveSatellites ? resolvedRoll.defenseLevel : undefined,
      interceptChancePct: resolvedRoll.hasActiveSatellites ? resolvedRoll.interceptChancePct : undefined,
      interceptRollFailed: resolvedRoll.rollAttempted && !resolvedRoll.interceptSucceeded,
      meta: { origin: 'arc_core_policy', reason: 'arc_core_message_near_miss' },
    });
    set({ strike: null });
  },

  tryCompleteDevInterceptBurst: (planetId) => {
    const burst = get().devInterceptBurst;
    if (!burst || burst.planetId !== planetId || burst.burstCompleted) return;
    const roll = burst.interceptRoll;
    if (!roll.rollAttempted || !roll.interceptSucceeded) return;
    set({ devInterceptBurst: { ...burst, burstCompleted: true } });
    dispatchArcCoreCommand({
      type: 'arc_core_message_missile_intercepted',
      planetId,
      messageKo: ARC_CORE_MESSAGE_DEFAULT_KO,
      weaponId: roll.weaponId ?? undefined,
      satelliteCount: roll.activeSatelliteCount,
      defenseLevel: roll.defenseLevel,
      interceptChancePct: roll.interceptChancePct,
      meta: { origin: 'arc_core_policy', reason: 'dev_intercept_burst' },
    });
    set({ devInterceptBurst: null });
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
