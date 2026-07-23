import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { emitMemProfileMarker } from '../devMemoryProfileBridge';
import { runGalaxyMapResidentDeepReclaimPass } from './runGalaxyMapResidentDeepReclaimPass';
import {
  resolveActivePlanetSessionAnchorId,
  resolveSinglePlanetSessionKeepIds,
} from './singlePlanetSessionKeep';

type GalaxyIngressKind = 'from_planet_hub' | 'after_hub_combat';

let pendingKind: GalaxyIngressKind | null = null;

export function markGalaxyMapIngressFromPlanetHub(): void {
  pendingKind = 'from_planet_hub';
}

/** @deprecated 호환 — teardownPlanetHubCombatForGalaxyDeparture */
export function markPostHubCombatWorldmapIngressReclaim(): void {
  pendingKind = 'after_hub_combat';
}

/**
 * worldmap focus 1회 — 허브(전투) 잔존 GL/Views 회수.
 *
 * 이전: soft + `releaseGpuLayers:false` 만 → 지도 idle에서 GL~140·Views 555 고착
 * (2026-07-23 06:50~). 지금은 **deep(GPU+Fresco)** + 전투 ingress 시 hub Skia signal.
 */
export function consumeGalaxyMapIngressReclaim(): void {
  const kind = pendingKind;
  if (!kind) return;
  pendingKind = null;

  const anchor = resolveActivePlanetSessionAnchorId();
  const keep = resolveSinglePlanetSessionKeepIds(anchor);

  const reason = kind === 'after_hub_combat' ? 'ingress_after_hub_combat' : 'ingress_from_planet_hub';
  runGalaxyMapResidentDeepReclaimPass(reason, keep, {
    // 전투 출발·허브 출발 모두 — freeze 잔존 핸들러까지 한 번 더 내린다.
    reclaimHubSkia: true,
  });

  void trimNativeBitmapCachesAsync().then((result) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[MEM] consumeGalaxyMapIngressReclaim kind=${kind} fresco=${result.frescoCleared ?? false}`,
      );
    }
  });

  emitMemProfileMarker({
    stage: 'galaxy_map',
    event: 'ingress_reclaim',
    detail: kind,
  });
}
