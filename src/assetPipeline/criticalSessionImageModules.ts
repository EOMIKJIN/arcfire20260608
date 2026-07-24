// ============================================================
// 이어하기 로딩 직전에 프리페치할 정적 이미지 목록
// — 새 핵심 에셋 추가 시 여기 + `npcCapitalShipPortraitAssets` 등에 반영
// — 금지: listNpcCaptainPortraitSources() 전수 편입 (함장 초상은 대화 온디맨드)
//   계약: docs/NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import { listNpcCapitalPortraitSources } from '../game/npcCapitalShipPortraitAssets';

export function listCriticalSessionImageSources(): ImageSourcePropType[] {
  return [
    ...listNpcCapitalPortraitSources(),
    require('../../assets/images/arcfire_logo_02.png') as ImageSourcePropType,
    // 행성 메인/전투 배경은 로딩 화면에서 미리 디코드해 첫 진입 스파이크를 줄인다.
    require('../../assets/images/planet/planet_bg001.png') as ImageSourcePropType,
    require('../../assets/images/planet/planet_bg002.png') as ImageSourcePropType,
  ];
}
