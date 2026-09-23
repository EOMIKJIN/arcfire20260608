/**
 * 행성 정보창 상단 포트레이트 — `planets.csv`의 `infoPanelPortraitAssetKey`와 매칭.
 * 메인 스테이지 배경(`backdropImageAssetKey`)과 분리.
 *
 * 코어 21장: 480×268 JPEG. 정보창 가로(~360dp)에서 무리 없는 최소 용량.
 * synth 미발견은 fallback 1장. 전용 활성화는 차후.
 */
import { Image, type ImageSourcePropType } from 'react-native';

/** 정보창 제작 가로(px) — 폰 슬롯 ~360dp · 디코드 부담 최소 */
export const PLANET_INFO_PORTRAIT_AUTHORING_WIDTH_PX = 480;
export const PLANET_INFO_PORTRAIT_AUTHORING_HEIGHT_PX = 268;

const PLANET_INFO_PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
  'assets/images/planet/pip_core_arcadia_prime.jpg': require('../../assets/images/planet/pip_core_arcadia_prime.jpg'),
  'assets/images/planet/pip_core_solar_station.jpg': require('../../assets/images/planet/pip_core_solar_station.jpg'),
  'assets/images/planet/pip_core_minerva_deep.jpg': require('../../assets/images/planet/pip_core_minerva_deep.jpg'),
  'assets/images/planet/pip_core_vega_base.jpg': require('../../assets/images/planet/pip_core_vega_base.jpg'),
  'assets/images/planet/pip_core_eden_city.jpg': require('../../assets/images/planet/pip_core_eden_city.jpg'),
  'assets/images/planet/pip_core_iron_remnant.jpg': require('../../assets/images/planet/pip_core_iron_remnant.jpg'),
  'assets/images/planet/pip_core_draco_haven.jpg': require('../../assets/images/planet/pip_core_draco_haven.jpg'),
  'assets/images/planet/pip_core_omega_hub.jpg': require('../../assets/images/planet/pip_core_omega_hub.jpg'),
  'assets/images/planet/pip_core_helios_core.jpg': require('../../assets/images/planet/pip_core_helios_core.jpg'),
  'assets/images/planet/pip_core_sirius_border.jpg': require('../../assets/images/planet/pip_core_sirius_border.jpg'),
  'assets/images/planet/pip_core_titan_ruins.jpg': require('../../assets/images/planet/pip_core_titan_ruins.jpg'),
  'assets/images/planet/pip_core_perseus_memorial.jpg': require('../../assets/images/planet/pip_core_perseus_memorial.jpg'),
  'assets/images/planet/pip_core_crimson_base.jpg': require('../../assets/images/planet/pip_core_crimson_base.jpg'),
  'assets/images/planet/pip_core_dark_haven.jpg': require('../../assets/images/planet/pip_core_dark_haven.jpg'),
  'assets/images/planet/pip_core_blood_station.jpg': require('../../assets/images/planet/pip_core_blood_station.jpg'),
  'assets/images/planet/pip_core_shadow_market.jpg': require('../../assets/images/planet/pip_core_shadow_market.jpg'),
  'assets/images/planet/pip_core_abyss_gate.jpg': require('../../assets/images/planet/pip_core_abyss_gate.jpg'),
  'assets/images/planet/pip_core_nightfall_citadel.jpg': require('../../assets/images/planet/pip_core_nightfall_citadel.jpg'),
  'assets/images/planet/pip_core_core_prime.jpg': require('../../assets/images/planet/pip_core_core_prime.jpg'),
  'assets/images/planet/pip_core_eternal_throne.jpg': require('../../assets/images/planet/pip_core_eternal_throne.jpg'),
  'assets/images/planet/pip_core_genesis_origin.jpg': require('../../assets/images/planet/pip_core_genesis_origin.jpg'),
  'assets/images/planet/pip_synth_fallback.jpg': require('../../assets/images/planet/pip_synth_fallback.jpg'),
  'assets/images/planet/pip_synth_052.jpg': require('../../assets/images/planet/pip_synth_052.jpg'),
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
 * 번들 이미지 width/height → 화면 슬롯 aspectRatio (width ÷ height).
 * 가로 100%일 때 세로는 이 비율로만 계산 — 픽셀 높이를 UI에 고정하지 않음.
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
