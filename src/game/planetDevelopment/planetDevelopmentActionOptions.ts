// ============================================================
// 행성개발 install/upgrade — 결제·게이트 옵션 (플레이어 vs ArcCore vault)
// ============================================================

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
