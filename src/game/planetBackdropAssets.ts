/**
 * 행성별 정적 배경 PNG — `planets.csv`의 `backdropImageAssetKey`와 매칭.
 * 메인 스테이지에서 성운 셰이더·이미지 레이어 합성 여부는 같은 CSV의
 * `mainStageSkiaNebulaLayer` / `mainStageBackdropImageLayer`로 제어한다(`resolveMainStageSkiaBackdrop`).
 */
import type { ImageSourcePropType } from 'react-native';

const PLANET_BACKDROP_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
  'assets/images/planet/planet_bg001.png': require('../../assets/images/planet/planet_bg001.png'),
};

export function resolvePlanetBackdropSource(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return PLANET_BACKDROP_BY_ASSET_KEY[k] ?? null;
}

