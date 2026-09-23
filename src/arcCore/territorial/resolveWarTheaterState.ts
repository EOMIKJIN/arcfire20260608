// ============================================================
// War Theater 단일 상태 — 조회 함수 (부작용 없음)
// listTerritorialCombatPolicies() 리비전 캐시에 의존할 수 있음.
// ============================================================

import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import type { PlanetClanHold } from '../../types';
import { isDynamicContestedZonePlanet } from './dynamicContestedZoneStore';
import { listTerritorialCombatPolicies } from './arcCoreTerritorialCombatPolicy';
import { resolveCapitalDefenseContext } from './resolveCapitalDefenseContext';
import { resolveHoldFactionSide, type TerritorialHoldSide } from './territorialFactionSide';

export const WAR_THEATER_AFTERMATH_TEMPLATE_PLANET_ID = '__dynamic_front__';

export type WarTheaterKind =
  | 'none'
  | 'static_seed'
  | 'campaign'
  | 'dynamic'
  | 'capital_hold'
  | 'capital_siege';

export type WarTheaterEconomyDaily = 'aftermath' | 'wdi' | 'none';

export type WarTheaterState = {
  kind: WarTheaterKind;
  inRotation: boolean;
  economyDaily: WarTheaterEconomyDaily;
  garrisonEligible: boolean;
};

export function isPlanetInActiveTerritorialRotation(planetId: string): boolean {
  const id = planetId.trim();
  if (!id) return false;
  const policies = listTerritorialCombatPolicies();
  for (let i = 0; i < policies.length; i += 1) {
    const p = policies[i]!;
    if (p.planetId === id && p.enabled && p.contestedZone) return true;
  }
  return false;
}

export function resolveWarTheaterState(input: {
  planetId: string;
  systemId: string;
  holdSide: TerritorialHoldSide;
  holds: Readonly<Record<string, PlanetClanHold>>;
  seedContested?: boolean;
  dynamicContested?: boolean;
  inRotation?: boolean;
}): WarTheaterState {
  const planetId = input.planetId.trim();
  const seedContested = input.seedContested ?? isPlanetContestedZone(planetId);
  const dynamicContested = input.dynamicContested ?? isDynamicContestedZonePlanet(planetId);
  const inRotation = input.inRotation ?? isPlanetInActiveTerritorialRotation(planetId);

  const capital = resolveCapitalDefenseContext({
    planetId,
    systemId: input.systemId,
    holdSide: input.holdSide,
    holds: input.holds,
  });

  if (capital.mode === 'hold_defense') {
    return { kind: 'capital_hold', inRotation: false, economyDaily: 'none', garrisonEligible: false };
  }
  if (capital.mode === 'siege_open') {
    return {
      kind: 'capital_siege',
      inRotation,
      economyDaily: inRotation ? 'aftermath' : 'none',
      garrisonEligible: inRotation,
    };
  }

  let kind: WarTheaterKind = 'none';
  if (seedContested) kind = 'static_seed';
  else if (inRotation) kind = 'campaign';
  else if (dynamicContested) kind = 'dynamic';

  if (kind === 'none') {
    return { kind, inRotation: false, economyDaily: 'wdi', garrisonEligible: false };
  }

  return {
    kind,
    inRotation,
    economyDaily: 'aftermath',
    garrisonEligible: inRotation,
  };
}

export function shouldApplyTheaterAftermath(state: WarTheaterState): boolean {
  return state.economyDaily === 'aftermath';
}

export function shouldSkipWdiForWarTheater(
  planetId: string,
  systemId: string,
  holds: Readonly<Record<string, PlanetClanHold>>,
): boolean {
  if (isPlanetContestedZone(planetId)) return true;
  const holdSide = resolveHoldFactionSide(holds[planetId]?.occupierClanId);
  return resolveWarTheaterState({ planetId, systemId, holdSide, holds }).economyDaily === 'aftermath';
}
