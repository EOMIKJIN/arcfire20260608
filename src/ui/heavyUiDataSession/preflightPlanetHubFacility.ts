import type { PlanetHubFacilityGateKind } from '../../hooks/usePlanetHubFacilityAccessGate';
import {
  isPlanetHubResearchLabEnabled,
  isPlanetHubShipyardEnabled,
  isPlanetHubTavernEnabled,
  isPlanetHubTradePortEnabled,
} from '../../game/planetDevelopment/planetHubFacilityGates';
import { t } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import { preflightPlanetHubSession } from './preflightPlanetHub';
import type { HeavyUiPreflightResult } from './types';

const FACILITY_ENABLED: Record<PlanetHubFacilityGateKind, (planetId: string) => boolean> = {
  trade: isPlanetHubTradePortEnabled,
  shipyard: isPlanetHubShipyardEnabled,
  tavern: isPlanetHubTavernEnabled,
  research_lab: isPlanetHubResearchLabEnabled,
};

export function preflightPlanetHubFacilitySession(
  kind: PlanetHubFacilityGateKind,
  planetId: string | null | undefined,
): HeavyUiPreflightResult {
  const base = preflightPlanetHubSession(planetId);
  if (!base.ok) return base;
  const id = planetId!.trim();
  if (!FACILITY_ENABLED[kind](id)) {
    return { ok: false, code: 'facility_not_installed' };
  }
  return { ok: true };
}

export type PlanetHubSubmenuKind = PlanetHubFacilityGateKind | 'departure';

/** 허브 SUB-STAGE 버튼 — 실패 시 알림, 성공 시 true */
export function runPlanetHubSubmenuPreflight(
  kind: PlanetHubSubmenuKind,
  planetId: string | null | undefined,
): boolean {
  if (kind === 'departure') {
    const result = preflightPlanetHubSession(planetId);
    if (result.ok) return true;
    showArcAlert(t('heavyUi.errorTitle'), t(`heavyUi.preflight.${result.code}`));
    return false;
  }
  const result = preflightPlanetHubFacilitySession(kind, planetId);
  if (result.ok) return true;
  if (result.code === 'facility_not_installed') {
    showArcAlert(t('hubFacilityGate.title'), t(`hubFacilityGate.${kind}`));
    return false;
  }
  showArcAlert(t('heavyUi.errorTitle'), t(`heavyUi.preflight.${result.code}`));
  return false;
}
