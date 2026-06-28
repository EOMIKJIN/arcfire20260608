// ============================================================
// 미개척(synth) 행성·성계 식별 — 21 CSV 행성과 구분
// worldStore·resolvePlanet* import 금지(순환 참조 방지)
// ============================================================

/** worldStore synth autogen 행성(synth_NNN_p) */
export function isSynthFrontierPlanetId(planetId: string | null | undefined): boolean {
  const id = planetId?.trim();
  if (!id) return false;
  return id.startsWith('synth_');
}

export function isSynthFrontierSystemId(systemId: string | null | undefined): boolean {
  const id = systemId?.trim();
  return Boolean(id?.startsWith('synth_'));
}
