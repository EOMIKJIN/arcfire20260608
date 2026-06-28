// ============================================================
// 행성개발 Lv1 설치 — 공통 게이트(크레딧·코어 런타임·선행·상태)
// ============================================================

import { t } from '../../i18n';
import { resolvePlanetInstallVictoryBlock } from './planetDevelopmentInstallCombatPolicy';
import { ensurePlanetCoreRuntimeForDev, hasPlanetCoreRuntimeEntry } from './planetFacilityModuleRuntime';

export type PlanetFacilityInstallGateInput = {
  planetId: string;
  installed: boolean;
  isCsvWorldBaseline: boolean;
  hasActiveJob: boolean;
  playerCredits: number;
  installCost: number;
  notEnoughCreditsMessage: string;
};

export type PlanetFacilityInstallGateResult = {
  canInstall: boolean;
  installBlockReason: string | null;
};

/** 설치 가능 여부 + UI/Alert용 차단 사유(크레딧·런타임·선행·상태) */
export function resolvePlanetFacilityInstallGate(
  input: PlanetFacilityInstallGateInput,
): PlanetFacilityInstallGateResult {
  const {
    planetId,
    installed,
    isCsvWorldBaseline,
    hasActiveJob,
    playerCredits,
    installCost,
    notEnoughCreditsMessage,
  } = input;

  if (installed || isCsvWorldBaseline || hasActiveJob) {
    return { canInstall: false, installBlockReason: null };
  }

  if (!hasPlanetCoreRuntimeEntry(planetId)) {
    ensurePlanetCoreRuntimeForDev(planetId);
  }

  if (!hasPlanetCoreRuntimeEntry(planetId)) {
    return { canInstall: false, installBlockReason: t('planetDev.coreNotReady') };
  }

  const victoryBlock = resolvePlanetInstallVictoryBlock(planetId);
  if (victoryBlock) {
    return { canInstall: false, installBlockReason: victoryBlock };
  }

  if (playerCredits < installCost) {
    return { canInstall: false, installBlockReason: notEnoughCreditsMessage };
  }

  return { canInstall: true, installBlockReason: null };
}
