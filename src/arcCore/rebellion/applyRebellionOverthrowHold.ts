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
    // 이미 중립 hold인데 중립화 마커만 없는 경우 — 소급 부여(부트 시드 복구 보호)
    if (prevHold && !prevHold.neutralizedAt) {
      useClanWarFoundationStore.setState((state) => ({
        planetHolds: {
          ...state.planetHolds,
          [planetId]: { ...prevHold, neutralizedAt: Date.now() },
        },
      }));
      void useClanWarFoundationStore.getState().persistClanWarFoundation();
    }
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
    // 반란 전복 중립화 — CSV 국가 시드 복구·지도 시드 폴백에서 보호 (전투 승리 중립화와 동일 계약)
    neutralizedAt: now,
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
