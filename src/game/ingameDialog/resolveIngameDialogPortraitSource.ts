import type { ImageSourcePropType } from 'react-native';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { resolveNpcCaptainPortraitSource } from '../npcCaptainPortraitAssets';

type PortraitPageRef = {
  speakerNpcCaptainId?: string | null;
  imageAssetKey?: string | null;
};

/**
 * CSV 페이지·adhoc 공통 — speakerNpcCaptainId → portraitImageAssetKey → page.imageAssetKey.
 * `overrideCaptainId`(퀘스트 완료 담당 NPC 등 동적 화자)가 있으면 페이지 고정값보다 우선.
 */
export function resolveIngameDialogPortraitSource(
  page: PortraitPageRef | null | undefined,
  overrideCaptainId?: string | null,
): ImageSourcePropType | undefined {
  if (!page) return undefined;
  const speakerCaptainId = overrideCaptainId || page.speakerNpcCaptainId;
  const speaker = speakerCaptainId ? getNpcCaptain(speakerCaptainId) : null;
  return (
    resolveNpcCaptainPortraitSource(
      speaker?.portraitImageAssetKey ?? page.imageAssetKey ?? null,
    ) ?? undefined
  );
}
