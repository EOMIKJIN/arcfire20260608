// ============================================================
// 번들 이미지 프리페치 — `Image.resolveAssetSource` + `Image.prefetch`
// 네트워크 전용이 아닌 로컬 URI도 플랫폼에 따라 캐시/워밍에 도움이 될 수 있음(실패는 무시).
// ============================================================

import { Image, type ImageSourcePropType } from 'react-native';

export async function prefetchImageSources(sources: readonly ImageSourcePropType[]): Promise<void> {
  await Promise.all(
    sources.map(async (src) => {
      try {
        const resolved = Image.resolveAssetSource(src);
        if (resolved?.uri) {
          await Image.prefetch(resolved.uri);
        }
      } catch {
        /* 프리페치 미지원·URI 없음 등 — 인게임 1차 로드로 폴백 */
      }
    }),
  );
}
