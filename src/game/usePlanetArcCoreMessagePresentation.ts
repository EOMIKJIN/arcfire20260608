import { useCallback, useEffect, useState } from 'react';
import { ARC_CORE_MESSAGE_WARNING_TICK_MS } from '../arcCore/message/arcCoreMessagePolicy';
import { registerPlanetSessionResource } from './planetSessionRegistry';
import {
  isArcCoreMessageWarningVisible,
  useArcCoreMessageStore,
} from '../store/arcCoreMessageStore';

/**
 * 행성 허브 — 아크코어 메시지(경고·미사일) 프레젠테이션.
 * 미사일 비행은 `PlanetArcCoreMessageMissileSkiaLayer` Reanimated frame callback — React 틱 없음.
 */
export function usePlanetArcCoreMessagePresentation(
  planetId: string | null | undefined,
  presentationActive: boolean,
) {
  const strike = useArcCoreMessageStore((s) => s.strike);
  const tryCompleteNearMiss = useArcCoreMessageStore((s) => s.tryCompleteNearMiss);
  const clearStrikeForPlanet = useArcCoreMessageStore((s) => s.clearStrikeForPlanet);
  const [warningNowMs, setWarningNowMs] = useState(() => Date.now());

  const warningActive = Boolean(
    presentationActive
    && planetId
    && strike
    && strike.planetId === planetId
    && strike.phase === 'warning',
  );

  useEffect(() => {
    if (!warningActive) return undefined;
    const id = setInterval(() => setWarningNowMs(Date.now()), ARC_CORE_MESSAGE_WARNING_TICK_MS);
    return () => clearInterval(id);
  }, [warningActive]);

  useEffect(() => {
    if (!planetId) return undefined;
    const token = registerPlanetSessionResource({
      ownerId: 'planet_arc_core_message',
      planetId,
      dispose: () => clearStrikeForPlanet(planetId),
    });
    return () => token.release();
  }, [planetId, clearStrikeForPlanet]);

  const handleMissileFlightComplete = useCallback(() => {
    if (!planetId) return;
    tryCompleteNearMiss(planetId, Date.now());
  }, [planetId, tryCompleteNearMiss]);

  const warningVisible = warningActive
    && isArcCoreMessageWarningVisible(strike, planetId, warningNowMs);

  const missileVisible = Boolean(
    presentationActive
    && planetId
    && strike
    && strike.planetId === planetId
    && strike.phase === 'inbound',
  );

  return {
    strike,
    warningVisible,
    missileVisible,
    missileStartMs: strike?.missileStartMs ?? 0,
    missileTravelMs: strike?.missileTravelMs ?? 0,
    interceptVisualPlan: strike?.interceptVisualPlan ?? null,
    interceptSucceeded: strike?.interceptRoll?.interceptSucceeded ?? false,
    onMissileFlightComplete: handleMissileFlightComplete,
  };
}
