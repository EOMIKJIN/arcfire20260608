/**
 * STAGE 1 blur — React focus race와 무관하게 허브 Skia(dodge overlay·useImage) 강제 해제.
 * planetHubSubcomponents 가 구독해 sticky overlay 를 내린다.
 */

type HubSkiaReclaimHandler = () => void;

const handlers = new Set<HubSkiaReclaimHandler>();
let reclaimEpoch = 0;

export function getHubSkiaNativeReclaimEpoch(): number {
  return reclaimEpoch;
}

export function signalHubSkiaNativeReclaim(reason: string): void {
  reclaimEpoch += 1;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] hubSkiaNativeReclaim epoch=${reclaimEpoch} reason=${reason}`);
  }
  for (const handler of handlers) {
    try {
      handler();
    } catch {
      /* idempotent */
    }
  }
}

export function subscribeHubSkiaNativeReclaim(handler: HubSkiaReclaimHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
