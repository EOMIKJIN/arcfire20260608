// ============================================================
// 행성 대테러·스파이 탐지 — 스킬 + 과학 연구소 레벨
// ============================================================

import {
  resolveLaboratoryAntiTerrorMitigationPct,
  resolveLaboratoryDroneInterceptBonusPct,
  resolveLaboratorySpyDetectBonusPct,
} from '../arcCore/balance/facilityLaboratoryLevelPolicy';
import { resolveFacilityLevelByType } from './planetDevelopment/planetFacilityLevelResolver';
import { resolvePlayerOwnedSkillStatBonus } from './playerOwnedSkillStatBonus';

export type PlanetCounterIntelBonuses = {
  /** 스파이·테러 정보원 알림·감지 (%p) */
  spyDetectBonusPct: number;
  /** 드론·백도어 테러 피해 완화 (% — impact intensity cap) */
  antiTerrorMitigationPct: number;
  /** 방위위성 요격 명중 보정 (%p) */
  droneInterceptBonusPct: number;
};

const EMPTY: PlanetCounterIntelBonuses = {
  spyDetectBonusPct: 0,
  antiTerrorMitigationPct: 0,
  droneInterceptBonusPct: 0,
};

export function resolvePlanetCounterIntelBonuses(planetId: string): PlanetCounterIntelBonuses {
  const pid = String(planetId ?? '').trim();
  if (!pid) return EMPTY;

  const labLevel = resolveFacilityLevelByType(pid, 'laboratory');
  const fromLabSpy = labLevel > 0 ? resolveLaboratorySpyDetectBonusPct(labLevel) : 0;
  const fromLabAnti = labLevel > 0 ? resolveLaboratoryAntiTerrorMitigationPct(labLevel) : 0;
  const fromLabIntercept = labLevel > 0 ? resolveLaboratoryDroneInterceptBonusPct(labLevel) : 0;

  return {
    spyDetectBonusPct: Math.min(
      100,
      resolvePlayerOwnedSkillStatBonus('spy_detect') + fromLabSpy,
    ),
    antiTerrorMitigationPct: Math.min(
      75,
      resolvePlayerOwnedSkillStatBonus('anti_terror') + fromLabAnti,
    ),
    droneInterceptBonusPct: Math.min(
      40,
      resolvePlayerOwnedSkillStatBonus('drone_intercept') + fromLabIntercept,
    ),
  };
}
