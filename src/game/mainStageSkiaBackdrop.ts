import type { ImageSourcePropType } from 'react-native';
import type { Planet } from '../types';
import { resolvePlanetBackdropSource } from './planetBackdropAssets';

/**
 * 메인 스테이지 Skia 배경 — 베이크 성운 PNG 레이어와 테이블 배경 이미지 레이어를 독립적으로 켜고 끈다.
 * 정본: `planets.csv`의 `mainStageSkiaNebulaLayer` / `mainStageBackdropImageLayer` 및 `backdropImageAssetKey`.
 * 성운 PNG는 `npm run build:planet-nebula-bakes`로 생성(`planetNebulaBakedAssets`).
 *
 * - 두 레이어 모두 끄면: Skia 쪽은 어두운 단색 필만 채운다.
 * - 두 레이어 모두 켜면: 배경 이미지를 아래에, 베이크 성운을 위에 합성한다.
 */
export type MainStageSkiaBackdropResolved = {
  nebulaShaderEnabled: boolean;
  backdropImageEnabled: boolean;
  backdropImageSource: ImageSourcePropType | null;
};

export function resolveMainStageSkiaBackdrop(planet: Planet | null | undefined): MainStageSkiaBackdropResolved {
  const key = planet?.backdropImageAssetKey ?? null;
  const resolvedSrc = resolvePlanetBackdropSource(key);
  const nebulaShaderEnabled = planet?.mainStageSkiaNebulaEnabled !== false;
  const backdropImageEnabled = planet?.mainStageBackdropImageEnabled !== false && Boolean(resolvedSrc);
  return {
    nebulaShaderEnabled,
    backdropImageEnabled,
    backdropImageSource: backdropImageEnabled ? resolvedSrc : null,
  };
}

/** 성운 프로필을 미리 만들지 않아도 되는 행성(성운 레이어 OFF). */
export function planetSkiaNebulaProfileNotNeeded(planet: Planet | null | undefined): boolean {
  return !resolveMainStageSkiaBackdrop(planet).nebulaShaderEnabled;
}
