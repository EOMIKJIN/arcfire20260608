/**
 * 이번 은하지도 방문의 출발 허브(landOnPlanet 이전 스냅샷)와 착륙 행성이 같으면
 * memo 전량 폐기 불필요. 다른 행성·앵커 미상이면 기존처럼 invalidate.
 */
export function shouldInvalidatePlanetMemoOnHubLand(input: {
  landingPlanetId: string | null | undefined;
  originHubPlanetId: string | null | undefined;
}): boolean {
  const land = String(input.landingPlanetId ?? '').trim();
  const origin = String(input.originHubPlanetId ?? '').trim();
  if (!land || !origin) return true;
  return land !== origin;
}
