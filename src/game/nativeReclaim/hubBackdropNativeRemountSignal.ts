/**
 * 허브 RN Image / Skia 백드롭 주기 remount — Native bitmap floor 회수.
 * STAGE blur(reclaim)과 분리: 프로세스 유지 중 PSS 상한 완화.
 */

type HubBackdropRemountHandler = () => void;

const handlers = new Set<HubBackdropRemountHandler>();
let remountEpoch = 0;

export function getHubBackdropNativeRemountEpoch(): number {
  return remountEpoch;
}

export function signalHubBackdropNativeRemount(reason: string): void {
  remountEpoch += 1;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] hubBackdropNativeRemount epoch=${remountEpoch} reason=${reason}`);
  }
  for (const handler of handlers) {
    try {
      handler();
    } catch {
      /* idempotent */
    }
  }
}

export function subscribeHubBackdropNativeRemount(handler: HubBackdropRemountHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
