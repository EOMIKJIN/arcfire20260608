// ============================================================
// 바 종업원 초상 — 1등급 고유 키만. 빈 키는 placeholder.
// 정본 키: bar_attendants.csv portraitImageAssetKey
// 금지: critical session 전수 prefetch · 10장 순환
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import { resolveNpcCaptainPortraitSource } from '../../npcCaptainPortraitAssets';
import { resolveBarAttendantPortraitAsset } from '../../barAttendantPortraitAssets';
import { getNpcCaptain } from '../../../npc/npcFleetRegistry';
import { getBarAttendantById } from './barPatronageTables';

/** attendant CSV 키 → 고유 초상. 빈 키는 폴백 없이 비움 */
export function resolveBarAttendantPortraitSource(
  portraitImageAssetKey: string | null | undefined,
): ImageSourcePropType | undefined {
  return resolveBarAttendantPortraitAsset(portraitImageAssetKey) ?? undefined;
}

export function resolveBarAttendantPortraitById(
  attendantId: string | null | undefined,
): ImageSourcePropType | undefined {
  if (!attendantId) return undefined;
  const row = getBarAttendantById(attendantId);
  return resolveBarAttendantPortraitSource(row?.portraitImageAssetKey);
}

/** 주인 함장 초상 — 범용 함장 경로 */
export function resolveBarHostPortraitByCaptainId(
  hostCaptainId: string | null | undefined,
): ImageSourcePropType | undefined {
  if (!hostCaptainId) return undefined;
  const captain = getNpcCaptain(hostCaptainId);
  return resolveNpcCaptainPortraitSource(captain?.portraitImageAssetKey) ?? undefined;
}
