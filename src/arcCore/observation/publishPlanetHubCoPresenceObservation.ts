// ============================================================
// 행성 허브 co-presence → ArcCore Observation Bus (throttled)
// ============================================================

import type { CaptainCoPresencePair } from '../captainPresence/captainPresenceTypes';
import { publishArcCoreObservation } from './arcCoreObservationBus';
import { ARC_CORE_OBS_SUBCORE } from './arcCoreObservationTypes';
import {
  resolvePlanetHubCoPresenceInteractionHints,
  type PlanetHubCoPresenceInteractionHint,
} from './resolvePlanetHubCoPresenceInteractionHints';

const MIN_PUBLISH_INTERVAL_MS = 30_000;

let lastSig = '';
let lastPublishMs = 0;

function pairsSignature(pairs: readonly CaptainCoPresencePair[]): string {
  return pairs
    .map((p) => `${p.captainIdA}:${p.captainIdB}:${p.stance}`)
    .sort()
    .join('|');
}

export type PlanetHubCoPresencePublishResult = {
  published: boolean;
  hints: readonly PlanetHubCoPresenceInteractionHint[];
};

/**
 * 동일 co-presence 시그니처는 30s 스로틀. hot path 할당 최소(문자열 sig만).
 */
export function publishPlanetHubCoPresenceObservationIfChanged(
  planetId: string,
  systemId: string | null | undefined,
  pairs: readonly CaptainCoPresencePair[],
  nowMs: number = Date.now(),
): PlanetHubCoPresencePublishResult {
  const hints = resolvePlanetHubCoPresenceInteractionHints(pairs);
  const sig = `${planetId}|${pairsSignature(pairs)}`;
  if (sig === lastSig && nowMs - lastPublishMs < MIN_PUBLISH_INTERVAL_MS) {
    return { published: false, hints };
  }
  if (pairs.length === 0) {
    lastSig = sig;
    return { published: false, hints };
  }

  lastSig = sig;
  lastPublishMs = nowMs;

  publishArcCoreObservation({
    kind: 'npc.co_presence',
    planetId,
    systemId: systemId ?? undefined,
    subCoreId: ARC_CORE_OBS_SUBCORE.npc,
    payload: {
      pairCount: pairs.length,
      hostileOrRivalCount: pairs.filter((p) => p.stance === 'hostile' || p.stance === 'rival').length,
      hints: hints.slice(0, 8).map((h) => ({
        kind: h.kind,
        captainIdA: h.captainIdA,
        captainIdB: h.captainIdB,
        interactionInstanceKey: h.interactionInstanceKey,
        preferredDialogSceneId: h.preferredDialogSceneId,
      })),
    },
  });

  return { published: true, hints };
}

/** STAGE 이탈 시 planet.tsx cleanup에서 호출 */
export function resetPlanetHubCoPresenceObservationThrottle(): void {
  lastSig = '';
  lastPublishMs = 0;
}
