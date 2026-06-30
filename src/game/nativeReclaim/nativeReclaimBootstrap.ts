import { AppState } from 'react-native';

import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import {
  prunePlanetNebulaProfilesExceptPlanetIds,
  prunePlanetNebulaProfilesLru,
  usePlanetNebulaStore,
} from '../../store/planetNebulaStore';
import { registerNativeReclaimListener } from './nativeReclaimRegistry';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';
import {
  NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR,
  NEBULA_PROFILE_KEEP_ON_HUB_BLUR,
} from './processMemoryBudgetPolicy';

let installed = false;

/**
 * 앱 부트 1회 — deferred reclaim listener + 포그라운드 soft pass.
 * onBoot 동기 heavy path 금지(김팀장 부트 격리).
 */
export function installNativeReclaimBootstrap(): void {
  if (installed) return;
  installed = true;

  registerNativeReclaimListener({
    id: 'nebula-lru-deferred',
    stages: ['planet_hub', 'galaxy_map', 'combat'],
    phase: 'deferred',
    priority: 10,
    onReclaim: (ctx) => {
      const keep = (ctx.keepPlanetIds ?? []).filter(Boolean);
      if (keep.length > 0) {
        prunePlanetNebulaProfilesExceptPlanetIds(keep);
      } else {
        prunePlanetNebulaProfilesLru(NEBULA_PROFILE_KEEP_ON_HUB_BLUR);
      }
      compactPlanetMemoRegistryShells();
    },
  });

  registerNativeReclaimListener({
    id: 'fresco-trim-deferred',
    stages: ['planet_hub', 'galaxy_map', 'combat'],
    phase: 'deferred',
    priority: 5,
    onReclaim: () => {
      void trimNativeBitmapCachesAsync();
    },
  });

  AppState.addEventListener('change', (next) => {
    if (next === 'background' || next === 'inactive') {
      runSoftNativeReclaimPass('app_background');
      void trimNativeBitmapCachesAsync();
      return;
    }
    if (next !== 'active') return;
    const profileCount = Object.keys(usePlanetNebulaStore.getState().profilesByPlanetId).length;
    if (profileCount > NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR + 1) {
      runSoftNativeReclaimPass('app_foreground');
      void trimNativeBitmapCachesAsync();
    }
  });
}
