import { FacilityInstallPrerequisites_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type FacilityInstallPrerequisiteRow = {
  facilityType: string;
  /** @deprecated 설치 게이트 폐기 — installDurationSec만 사용 */
  requiredFacilityType: string;
  /** @deprecated 설치 게이트 폐기 */
  requiredFacilityLevel: number;
  /** @deprecated 설치 게이트 폐기 — planetDevelopmentInstallCombatPolicy */
  requiredCombatWins: number;
  /** @deprecated v3.1 — 런타임은 facility_upgrade_duration_facility_mod.csv 정본. 감사용 미러 */
  installDurationSec: number;
  notesKo: string;
};

/** catalog moduleId → facility_upgrade_levels facility_type */
export const PLANET_DEV_MODULE_TO_FACILITY_TYPE: Record<string, string> = {
  dev_trade_port: 'trade_port',
  dev_orbit_shipyard: 'shipyard',
  defense_satellite: 'defense_satellite',
  dev_research_lab: 'laboratory',
  dev_population_dome: 'tavern',
  /** legacy saves */
  dev_laboratory: 'laboratory',
  dev_tavern: 'tavern',
};

export function resolveFacilityTypeFromModuleId(moduleId: string): string | null {
  return PLANET_DEV_MODULE_TO_FACILITY_TYPE[moduleId] ?? null;
}

let cached: FacilityInstallPrerequisiteRow[] | null = null;

function parseRow(raw: (typeof FacilityInstallPrerequisites_FROM_BALANCE_CSV)[number]): FacilityInstallPrerequisiteRow {
  return {
    facilityType: String(raw.facility_type ?? '').trim(),
    requiredFacilityType: String(raw.requiredFacilityType ?? '').trim(),
    requiredFacilityLevel: Math.max(0, Math.floor(Number(raw.requiredFacilityLevel) || 0)),
    requiredCombatWins: Math.max(0, Math.floor(Number(raw.requiredCombatWins) || 0)),
    installDurationSec: Math.max(0, Math.floor(Number(raw.installDurationSec) || 0)),
    notesKo: String(raw.notesKo ?? ''),
  };
}

export function listFacilityInstallPrerequisiteRows(): FacilityInstallPrerequisiteRow[] {
  if (cached) return cached;
  cached = FacilityInstallPrerequisites_FROM_BALANCE_CSV.map(parseRow);
  return cached;
}

export function getFacilityInstallPrerequisite(facilityType: string): FacilityInstallPrerequisiteRow | null {
  return listFacilityInstallPrerequisiteRows().find((r) => r.facilityType === facilityType) ?? null;
}
