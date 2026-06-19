import { FacilityLaboratoryLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { buildFacilityGenericLevelPolicy } from './facilityGenericLevelPolicy';

const policy = buildFacilityGenericLevelPolicy(FacilityLaboratoryLevelPolicy_FROM_BALANCE_CSV);

export const listFacilityLaboratoryLevelRows = policy.listRows;
export const getFacilityLaboratoryMaxLevel = policy.getMaxLevel;
export const getFacilityLaboratoryLevelRow = policy.getLevelRow;
export const resolveLaboratoryUpgradeCostCredits = policy.resolveUpgradeCostCredits;
export const resolveLaboratoryInstantUpgradeCostCredits = policy.resolveInstantUpgradeCostCredits;
export const resolveLaboratoryUpgradeDurationSec = policy.resolveUpgradeDurationSec;
export const resolveLaboratoryUpgradeRequiredPlayerLevel = policy.resolveUpgradeRequiredPlayerLevel;
export const resolveLaboratoryUpgradeRequiredStat = policy.resolveUpgradeRequiredStat;

export function resolveLaboratoryRdSpeedReductionPct(level: number): number {
  const n = policy.getLevelRow(level)?.extras.labRdSpeedReductionPct;
  return Math.max(0, Math.min(50, Number(n) || 0));
}

export function resolveLaboratoryEquipmentTierUnlock(level: number): string {
  return String(policy.getLevelRow(level)?.extras.labEquipmentTierUnlock ?? '');
}

export function resolveLaboratoryEnvRegenPctDaily(level: number): number {
  const n = policy.getLevelRow(level)?.extras.labEnvRegenPctDaily;
  return Math.max(0, Number(n) || 0);
}

/** v2.0 §5-3 — R&D 기본 시간에 연구소 레벨 보정 곱적용 */
export function getEffectiveRdTimeHours(baseHours: number, laboratoryLevel: number): number {
  const bonus = resolveLaboratoryRdSpeedReductionPct(laboratoryLevel) / 100;
  return Math.max(1, Math.floor(baseHours * (1 - bonus)));
}
