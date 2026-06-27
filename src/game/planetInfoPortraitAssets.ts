/**
 * 행성 정보창 상단 포트rait — `planets.csv`의 `infoPanelPortraitAssetKey`와 매칭.
 * 메인 스테이지 배경(`backdropImageAssetKey`)과 분리.
 *
 * 제작(@2x): 가로 {@link PLANET_INFO_PORTRAIT_AUTHORING_WIDTH_PX}px 고정.
 * 세로는 마스터 원본 height를 그대로 비율 유지(리사이즈·UI 고정 184dp 금지).
 */
import { Image, type ImageSourcePropType } from 'react-native';

/** @2x PNG 제작 가로(px) — 세로는 원본 height × (660 / 원본 width) */
export const PLANET_INFO_PORTRAIT_AUTHORING_WIDTH_PX = 660;

const PLANET_INFO_PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
  'assets/images/planet/pip_001.png': require('../../assets/images/planet/pip_001.png'),
  'assets/images/planet/pip_002.png': require('../../assets/images/planet/pip_002.png'),
  'assets/images/planet/pip_003.png': require('../../assets/images/planet/pip_003.png'),
};

export function resolvePlanetInfoPortraitSource(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return PLANET_INFO_PORTRAIT_BY_ASSET_KEY[k] ?? null;
}

/**
 * 번들 PNG IHDR width/height → 화면 슬롯 aspectRatio (width ÷ height).
 * 가로 100%일 때 세로는 이 비율로만 계산 — PNG 픽셀 높이를 UI에 고정하지 않음.
 */
export function resolvePlanetInfoPortraitAspectRatio(
  source: ImageSourcePropType | null | undefined,
): number | null {
  if (source == null) return null;
  const resolved = Image.resolveAssetSource(source);
  const w = resolved?.width;
  const h = resolved?.height;
  if (!w || !h) return null;
  return w / h;
}
