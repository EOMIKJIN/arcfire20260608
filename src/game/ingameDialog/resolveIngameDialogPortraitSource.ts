import type { ImageSourcePropType } from 'react-native';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { resolveNpcCaptainPortraitSource } from '../npcCaptainPortraitAssets';

type PortraitPageRef = {
  speakerNpcCaptainId?: string | null;
  imageAssetKey?: string | null;
};

/** CSV 페이지·adhoc 공통 — speakerNpcCaptainId → portraitImageAssetKey → page.imageAssetKey */
export function resolveIngameDialogPortraitSource(
  page: PortraitPageRef | null | undefined,
): ImageSourcePropType | undefined {
  if (!page) return undefined;
  const speaker = page.speakerNpcCaptainId
    ? getNpcCaptain(page.speakerNpcCaptainId)
    : null;
  return (
    resolveNpcCaptainPortraitSource(
      speaker?.portraitImageAssetKey ?? page.imageAssetKey ?? null,
    ) ?? undefined
  );
}
