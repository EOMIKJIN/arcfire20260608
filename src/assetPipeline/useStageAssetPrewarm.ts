// ============================================================
// `StageShell` — 메인 스테이지 포커스 시 레지스트리 워밍 (UI 스레드 여유 뒤)
// ============================================================

import { useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { StageRouteName } from '../stages/types';
import { STAGE_ASSET_PREWARM_REGISTRY } from './mainStagePrewarmRegistry';

const STAGE_ASSET_PREWARM_ROUTES = new Set<StageRouteName>([
  'planet',
  'worldmap',
  'trade',
  'shipyard',
  'tavern',
  'skilltree',
  'combat',
]);

export function useStageAssetPrewarm(routeName: StageRouteName): void {
  const generationRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (!STAGE_ASSET_PREWARM_ROUTES.has(routeName)) return undefined;

      const gen = (generationRef.current += 1);
      const fn = STAGE_ASSET_PREWARM_REGISTRY[routeName];
      if (!fn) return undefined;

      const handle = InteractionManager.runAfterInteractions(() => {
        if (generationRef.current !== gen) return;
        void fn({ routeName }).catch(() => {
          /* 분산 로드 실패 시 해당 화면 최초 접근 시 로드 */
        });
      });

      return () => {
        generationRef.current += 1;
        if (typeof (handle as { cancel?: () => void }).cancel === 'function') {
          (handle as { cancel: () => void }).cancel();
        }
      };
    }, [routeName]),
  );
}
