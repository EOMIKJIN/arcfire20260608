// ============================================================
// 반란 전복 — hold 중립화 · 증서·홈 해제 · 총독 재배치
// ============================================================

import type { MapFactionSide } from '../../galaxyMap/mapFactionSideCore';
import { resolveMapFactionSideFromClanIdPure } from '../../galaxyMap/mapFactionSideCore';
import { reassignPlanetGovernorForOccupationSync } from '../../game/planetGovernor/reassignPlanetGovernorForOccupation';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import type { PlanetClanHold } from '../../types';

export type ApplyRebellionOverthrowHoldResult = {
  applied: boolean;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  hadPlayerDeed: boolean;
  hadPlayerHome: boolean;
};

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 정부 전복 성공 — occupier 중립화, deed/home 초기화.
 * hold.kind=civil_war 신규 없음 — neutral hold만 사용.
 */
export function applyRebellionOverthrowHold(planetId: string, systemId: string): ApplyRebellionOverthrowHoldResult {
  const warStore = useClanWarFoundationStore.getState();
  const prevHold = warStore.planetHolds[planetId];
  const clans = warStore.clans;
  const previousSide = resolveMapFactionSideFromClanIdPure(prevHold?.occupierClanId ?? 'neutral', clans);

  const hadPlayerDeed = Boolean(prevHold?.deedOwnerClanId?.trim());
  const hadPlayerHome = prevHold?.kind === 'player_home' || Boolean(prevHold?.homePlayerUid?.trim());

  const unchanged =
    prevHold?.occupierClanId === 'neutral'
    && prevHold?.kind === 'neutral'
    && !prevHold?.deedOwnerClanId
    && !prevHold?.homePlayerUid;

  if (unchanged) {
    return {
      applied: false,
      previousSide,
      newSide: 'neutral',
      hadPlayerDeed,
      hadPlayerHome,
    };
  }

  const now = Date.now();
  const nextHold: PlanetClanHold = {
    planetId,
    systemId,
    occupierClanId: 'neutral',
    deedOwnerClanId: null,
    homePlayerUid: null,
    kind: 'neutral',
    capturedAt: prevHold?.capturedAt ?? now,
  };

  const op = {
    id: makeId('op_rebellion'),
    attackerClanId: 'neutral',
    defenderClanId: prevHold?.occupierClanId === 'neutral' ? null : prevHold?.occupierClanId ?? null,
    targetPlanetId: planetId,
    phase: 'resolved' as const,
    startedAt: now,
    updatedAt: now,
    ext: {
      source: 'rebellion_overthrow',
      previousSide,
      newSide: 'neutral',
    },
  };

  useClanWarFoundationStore.setState((state) => ({
    planetHolds: { ...state.planetHolds, [planetId]: nextHold },
    operations: [op, ...state.operations],
  }));

  reassignPlanetGovernorForOccupationSync({
    planetId,
    newFactionSide: 'NEUTRAL',
  });
  void useClanWarFoundationStore.getState().persistClanWarFoundation();

  return {
    applied: true,
    previousSide,
    newSide: 'neutral',
    hadPlayerDeed,
    hadPlayerHome,
  };
}
