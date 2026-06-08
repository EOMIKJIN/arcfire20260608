// ============================================================
// 전함 테이블 `portraitImageAssetKey` → Metro 정적 require
// 새 이미지 추가 시: assets 복사 + 아래 맵에 동일 키 문자열로 등록
// ============================================================

import type { ImageSourcePropType } from 'react-native';

const PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
  'assets/images/ship/ship_001.png': require('../../assets/images/ship/ship_001.png'),
  'assets/images/ship/npc_test_ship_001.png': require('../../assets/images/ship/npc_test_ship_001.png'),
};

export function resolveNpcCapitalShipPortraitSource(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return PORTRAIT_BY_ASSET_KEY[k] ?? null;
}

/** 로딩 화면 등에서 일괄 프리페치할 전함 포트레이트(등록된 키 전부) */
export function listNpcCapitalPortraitSources(): ImageSourcePropType[] {
  return Object.values(PORTRAIT_BY_ASSET_KEY);
}
