import { requireNativeModule } from 'expo-modules-core';

export type TrimBitmapCachesResult = {
  ok: boolean;
  frescoCleared?: boolean;
};

export type RestartAppResult = {
  ok: boolean;
  reason?: string;
};

type ArcfireNativeMemoryNative = {
  trimBitmapMemoryCachesAsync: () => Promise<TrimBitmapCachesResult>;
  purgeNativeHeapAsync?: () => Promise<{ ok: boolean }>;
  restartAppAsync: () => Promise<RestartAppResult>;
};

let nativeModule: ArcfireNativeMemoryNative | null = null;

function getNativeModule(): ArcfireNativeMemoryNative | null {
  if (nativeModule !== null) return nativeModule;
  try {
    nativeModule = requireNativeModule<ArcfireNativeMemoryNative>('ArcfireNativeMemory');
    return nativeModule;
  } catch {
    return null;
  }
}

/** Fresco/RN bitmap memory cache trim (Android bg thread). iOS/no-op fallback. */
export async function trimNativeBitmapCachesAsync(): Promise<TrimBitmapCachesResult> {
  const mod = getNativeModule();
  if (!mod) {
    return { ok: false, frescoCleared: false };
  }
  try {
    return await mod.trimBitmapMemoryCachesAsync();
  } catch {
    return { ok: false, frescoCleared: false };
  }
}

export function isNativeBitmapTrimAvailable(): boolean {
  return getNativeModule() != null;
}

/** 이미 해제된 네이티브 페이지를 OS에 반환. 지도 이탈 직후 1회. */
export async function purgeNativeHeapAsync(): Promise<{ ok: boolean }> {
  const mod = getNativeModule();
  if (!mod?.purgeNativeHeapAsync) return { ok: false };
  try {
    return await mod.purgeNativeHeapAsync();
  } catch {
    return { ok: false };
  }
}

let stageExitPurgeTimer: ReturnType<typeof setTimeout> | null = null;

function logNativeHeapPurge(ok: boolean): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  console.log(`[MEM] native heap purge ok=${ok}`);
}

/** 뷰 detach·bitmap recycle 다음, 포커스 해제와 언마운트 사이보다 뒤에 한 번 더. */
export function scheduleNativeHeapPurgeAfterStageExit(): void {
  void purgeNativeHeapAsync().then((r) => logNativeHeapPurge(r.ok));
  if (stageExitPurgeTimer) clearTimeout(stageExitPurgeTimer);
  stageExitPurgeTimer = setTimeout(() => {
    stageExitPurgeTimer = null;
    void purgeNativeHeapAsync().then((r) => logNativeHeapPurge(r.ok));
  }, 900);
}

let settlePurgeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * STAGE 진입 직후 — 이전 화면 언마운트·해제가 끝난 뒤(기본 2.5초) 한 번 반환.
 * 진입 순간 purge는 이전 화면이 아직 살아 있어 반환할 페이지가 거의 없다.
 * 연속 호출은 마지막 1회로 합친다.
 */
export function scheduleNativeHeapPurgeAfterSettle(delayMs = 2500): void {
  if (settlePurgeTimer) clearTimeout(settlePurgeTimer);
  settlePurgeTimer = setTimeout(() => {
    settlePurgeTimer = null;
    void purgeNativeHeapAsync().then((r) => logNativeHeapPurge(r.ok));
  }, delayMs);
}

/** Android — 런처 액티비티 재시작. iOS·미지원 환경은 ok:false */
export async function restartNativeAppAsync(): Promise<RestartAppResult> {
  const mod = getNativeModule();
  if (!mod?.restartAppAsync) {
    return { ok: false, reason: 'module_unavailable' };
  }
  try {
    return await mod.restartAppAsync();
  } catch {
    return { ok: false, reason: 'native_error' };
  }
}
