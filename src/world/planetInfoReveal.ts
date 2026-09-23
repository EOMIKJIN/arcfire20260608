/** 현재 착륙한 행성에서만 행성정보 실데이터를 열 수 있다. 원격 탭·항로 이동 중은 봉인. */
export function isPlayerLandedOnPlanet(
  planetId: string,
  currentPlanetId?: string | null,
): boolean {
  const id = planetId.trim();
  return id.length > 0 && currentPlanetId?.trim() === id;
}

export function isPlanetInfoInspected(
  planetId: string,
  inspectedPlanetInfoIds: readonly string[],
): boolean {
  const id = planetId.trim();
  return id.length > 0 && inspectedPlanetInfoIds.includes(id);
}

/** 도착 후 행성정보를 한 번 연 뒤에만 실데이터 */
export function isPlanetInfoRevealed(params: {
  planetId: string;
  inspectedPlanetInfoIds: readonly string[];
}): boolean {
  return isPlanetInfoInspected(params.planetId, params.inspectedPlanetInfoIds);
}

/** 착륙 상태에서 행성정보를 열 때만 persist. 지도에서 원격으로 찍으면 기록하지 않음. */
export function tryRevealPlanetInfoOnPresent(planetId: string): boolean {
  const id = planetId.trim();
  if (!id) return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../store/worldStore') as typeof import('../store/worldStore');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  const player = usePlayerStore.getState().player;
  if (!isPlayerLandedOnPlanet(id, player?.currentPlanetId)) return false;
  useWorldStore.getState().markPlanetInfoInspected(id);
  return true;
}
