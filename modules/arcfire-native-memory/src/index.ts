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
