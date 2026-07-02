// ============================================================
// synth 행성·성계 식별 — A(21 CSV)와 구분
// C=잠금 미개척 · B=개방→coreOpenGameplayPlanets(A 편입)
// worldStore·resolvePlanet* import 금지(순환 참조 방지)
// ============================================================

/** synth autogen 행성(synth_NNN_p) — C(잠금) 또는 B(개방) 모두 해당 */
export function isSynthFrontierPlanetId(planetId: string | null | undefined): boolean {
  const id = planetId?.trim();
  if (!id) return false;
  return id.startsWith('synth_');
}

export function isSynthFrontierSystemId(systemId: string | null | undefined): boolean {
  const id = systemId?.trim();
  return Boolean(id?.startsWith('synth_'));
}
