// ============================================================
// 무역소 BUY 탭 — 전함 구매정보창 이미지 (trade_ 네이밍 규칙)
//
// 규칙:
//   - 경로: assets/images/ship/trade_ship_{고유숫자}.png
//   - 파일명은 반드시 trade_ 접두사
//   - {고유숫자} = 전함 영구 식별 번호 (예: 100 = 기본전함 Mk.I)
//   - 동일 번호는 프로젝트 전역에서 동일 전함을 가리킴
//   - 기존 ship_* · portraitImageAssetKey 네이밍은 추후 이전
//
// 신규 이미지: assets/images/ship/ 복사 + REGISTERED_TRADE_PORTRAITS 등록
// (또는 npc_ai_ships.csv tradePortPortraitUniqueId — SCHEMA.md)
// ============================================================

import type { ImageSourcePropType } from 'react-native';

export function buildTradePortShipPortraitAssetKey(uniqueShipId: number): string {
  const id = Math.trunc(uniqueShipId);
  if (!Number.isFinite(id) || id <= 0) return '';
  return `assets/images/ship/trade_ship_${id}.png`;
}

const REGISTERED_TRADE_PORTRAITS: Record<string, ImageSourcePropType> = {
  'assets/images/ship/trade_ship_100.png': require('../../assets/images/ship/trade_ship_100.png'),
};

/** CSV tradePortPortraitUniqueId 점진 이전 — npcCapitalShipId → 고유번호 */
const TRADE_PORT_PORTRAIT_UNIQUE_ID_BY_NPC_SHIP_ID: Readonly<Record<string, number>> = {
  Player_npc_red_fleet_1: 100,
};

export function resolveTradePortPortraitUniqueIdForNpcShip(
  npcCapitalShipId: string | undefined | null,
  csvUniqueId?: number | null,
): number | null {
  if (csvUniqueId != null && Number.isFinite(csvUniqueId) && csvUniqueId > 0) {
    return Math.trunc(csvUniqueId);
  }
  if (!npcCapitalShipId) return null;
  const mapped = TRADE_PORT_PORTRAIT_UNIQUE_ID_BY_NPC_SHIP_ID[npcCapitalShipId.trim()];
  return mapped != null && mapped > 0 ? mapped : null;
}

export function resolveTradePortShipPortraitSource(
  uniqueShipId: number | null | undefined,
): ImageSourcePropType | null {
  if (uniqueShipId == null || !Number.isFinite(uniqueShipId)) return null;
  const key = buildTradePortShipPortraitAssetKey(uniqueShipId);
  if (!key) return null;
  return REGISTERED_TRADE_PORTRAITS[key] ?? null;
}
