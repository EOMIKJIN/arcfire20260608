// ============================================================
// 행성개발 install/upgrade — 결제·게이트 옵션 (플레이어 vs ArcCore vault)
// ============================================================

import { emitPlayVerb } from '../devPlayVerbLog';

export type PlanetDevFundingSource = 'player' | 'arc_core_vault';

export type PlanetDevActionOpts = {
  fundingSource?: PlanetDevFundingSource;
  /** ArcCore 자율 투자 — 플레이어 레벨·크레딧 UI 게이트 생략 */
  arcCoreAutonomous?: boolean;
};

export function resolvePlanetDevFundingSource(opts?: PlanetDevActionOpts): PlanetDevFundingSource {
  return opts?.fundingSource ?? 'player';
}

export function isArcCorePlanetDevAction(opts?: PlanetDevActionOpts): boolean {
  return opts?.fundingSource === 'arc_core_vault' || opts?.arcCoreAutonomous === true;
}

export function resolveArcCorePlanetDevActionOpts(): PlanetDevActionOpts {
  return { fundingSource: 'arc_core_vault', arcCoreAutonomous: true };
}

/** 플레이어가 직접 설치·업그레이드를 시작했을 때만 기록. ArcCore 자율 투자는 제외. */
export function emitPlayerPlanetDevVerb(
  opts: PlanetDevActionOpts | undefined,
  step: 'install' | 'upgrade',
  moduleId: string,
  planetId: string,
): void {
  if (isArcCorePlanetDevAction(opts)) return;
  emitPlayVerb('develop', `${step}:${moduleId}:${planetId}`);
}
