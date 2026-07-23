/**
 * Instruments/Profiler 유사 마커 (logcat `[MEM_PROFILE]`).
 * 김경제 memory-profiler · retention audit 입력.
 *
 * - __DEV__: 항상 출력
 * - release soak: EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1 빌드 시 출력
 */

export type MemProfileStage =
  | 'planet_hub'
  | 'galaxy_map'
  | 'combat_transit'
  | 'sub_stage'
  | 'unknown';

export type MemProfileEvent =
  | 'route_blur'
  | 'route_focus'
  | 'ingress_reclaim'
  | 'deep_reclaim'
  | 'system_change'
  | 'transit_combat_nav'
  | 'planet_change'
  | 'manual';

type EmitOpts = {
  stage: MemProfileStage;
  event: MemProfileEvent;
  detail?: string;
};

function isMemProfileLogEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  try {
    return process.env.EXPO_PUBLIC_ARCFIRE_MEM_PROFILE === '1';
  } catch {
    return false;
  }
}

function readHermesHeapMb(): number | null {
  if (typeof globalThis === 'undefined') return null;
  const hermes = (globalThis as { HermesInternal?: { getInstrumentedStats?: () => Record<string, number> } })
    .HermesInternal;
  if (!hermes?.getInstrumentedStats) return null;
  try {
    const stats = hermes.getInstrumentedStats();
    const bytes = stats.js_heapSize ?? stats['JS heap size'] ?? 0;
    if (!Number.isFinite(bytes) || bytes <= 0) return null;
    return Math.round((bytes / (1024 * 1024)) * 10) / 10;
  } catch {
    return null;
  }
}

/** Metro logcat — `pull-mem-profile-logcat.ps1` / retention audit 입력 */
export function emitMemProfileMarker(opts: EmitOpts): void {
  if (!isMemProfileLogEnabled()) return;
  const hermesMb = readHermesHeapMb();
  const hermesPart = hermesMb != null ? ` hermes_mb=${hermesMb}` : '';
  const detail = opts.detail?.trim() ? ` detail=${opts.detail.trim().replace(/\s+/g, '_')}` : '';
  // eslint-disable-next-line no-console
  console.log(`[MEM_PROFILE] stage=${opts.stage} event=${opts.event}${hermesPart}${detail}`);
}
