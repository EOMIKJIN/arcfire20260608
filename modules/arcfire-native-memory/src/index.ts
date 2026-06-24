import { requireNativeModule } from 'expo-modules-core';

export type TrimBitmapCachesResult = {
  ok: boolean;
  frescoCleared?: boolean;
};

type ArcfireNativeMemoryNative = {
  trimBitmapMemoryCachesAsync: () => Promise<TrimBitmapCachesResult>;
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
