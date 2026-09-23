/**
 * Voronoi 사이트 — 카메라/존용 visible 전체와 분리.
 * 확장 해금(synth_080+)을 격자에 넣으면 Delaunay가 전 은하를 흔들고
 * 셀 문자열·국경이 해금 일수에 비례해 커진다. 코어·레거시·관문 + 안개 공개분만.
 */

export function isGalaxyMapStableVoronoiSiteId(
  id: string,
  isLegacyVisibleSynth: (systemId: string) => boolean,
  isExpansionGatewaySynth: (systemId: string) => boolean,
): boolean {
  if (!id.startsWith('synth_')) return true;
  if (isLegacyVisibleSynth(id)) return true;
  if (isExpansionGatewaySynth(id)) return true;
  return false;
}

export function selectGalaxyMapVoronoiSites<T extends { id: string }>(
  visibleSystems: readonly T[],
  revealedIds: ReadonlySet<string>,
  isStableSite: (id: string) => boolean,
): T[] {
  let dropped = 0;
  for (let i = 0; i < visibleSystems.length; i += 1) {
    const id = visibleSystems[i]!.id;
    if (!isStableSite(id) && !revealedIds.has(id)) dropped += 1;
  }
  if (dropped === 0) return visibleSystems as T[];

  const out: T[] = [];
  for (let i = 0; i < visibleSystems.length; i += 1) {
    const sys = visibleSystems[i]!;
    if (isStableSite(sys.id) || revealedIds.has(sys.id)) out.push(sys);
  }
  return out;
}
