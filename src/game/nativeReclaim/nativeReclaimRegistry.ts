import type {
  NativeReclaimContext,
  NativeReclaimListener,
  NativeReclaimPhase,
  NativeReclaimStage,
} from './nativeReclaimContracts';

const listeners = new Map<string, NativeReclaimListener>();

export function registerNativeReclaimListener(listener: NativeReclaimListener): () => void {
  listeners.set(listener.id, listener);
  return () => {
    listeners.delete(listener.id);
  };
}

export function runNativeReclaimListeners(opts: {
  stage: NativeReclaimStage;
  reason: string;
  phase: NativeReclaimPhase;
  keepPlanetIds?: readonly string[];
}): number {
  const ctx: NativeReclaimContext = {
    stage: opts.stage,
    reason: opts.reason,
    keepPlanetIds: opts.keepPlanetIds,
  };
  const batch = [...listeners.values()]
    .filter((l) => l.phase === opts.phase && l.stages.includes(opts.stage))
    .sort((a, b) => b.priority - a.priority);
  for (const listener of batch) {
    try {
      listener.onReclaim(ctx);
    } catch {
      /* idempotent reclaim */
    }
  }
  return batch.length;
}
