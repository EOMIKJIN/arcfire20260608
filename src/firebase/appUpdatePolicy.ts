import { arccoreDocRef, getDoc, getDocFromCache } from './firestoreRefs';
import { configureFirestorePersistence } from './firestoreClientConfig';

const ARCCORE_CONFIG_DOC = 'config';

/** Firestore server read 상한 — 실패 시 조용히 empty 반환(부트 경고 없음) */
const FETCH_POLICY_SERVER_MS = 4_000;

export type AppUpdatePolicy = {
  latestVersion: string | null;
  minSupportedVersion: string | null;
  playStoreUrl: string | null;
};

export type AppUpdateGateState = {
  visible: boolean;
  required: boolean;
  latestVersion: string;
  playStoreUrl: string | null;
};

const EMPTY_POLICY: AppUpdatePolicy = {
  latestVersion: null,
  minSupportedVersion: null,
  playStoreUrl: null,
};

function parseVersionSegments(versionRaw: string): number[] {
  return versionRaw
    .trim()
    .split('.')
    .map((s) => Number.parseInt(s, 10))
    .map((n) => (Number.isFinite(n) && n >= 0 ? n : 0));
}

export function compareSemver(aRaw: string, bRaw: string): number {
  const a = parseVersionSegments(aRaw);
  const b = parseVersionSegments(bRaw);
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function parsePolicyFromData(data: Record<string, unknown> | undefined): AppUpdatePolicy {
  if (!data) return { ...EMPTY_POLICY };
  const latestVersion =
    typeof data.latest_version === 'string' && data.latest_version.trim().length > 0
      ? data.latest_version.trim()
      : null;
  const minSupportedVersion =
    typeof data.min_supported_version === 'string' && data.min_supported_version.trim().length > 0
      ? data.min_supported_version.trim()
      : null;
  const playStoreUrl =
    typeof data.play_store_url === 'string' && data.play_store_url.trim().length > 0
      ? data.play_store_url.trim()
      : null;
  return { latestVersion, minSupportedVersion, playStoreUrl };
}

function snapExists(snap: { exists: boolean | (() => boolean) }): boolean {
  return typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
}

export async function fetchAppUpdatePolicyFromArcCore(): Promise<AppUpdatePolicy> {
  configureFirestorePersistence();
  const ref = arccoreDocRef(ARCCORE_CONFIG_DOC);

  try {
    const cached = await getDocFromCache(ref);
    if (snapExists(cached)) {
      return parsePolicyFromData(cached.data() as Record<string, unknown>);
    }
  } catch {
    /* 캐시 없음 — server 시도 */
  }

  try {
    const snap = await Promise.race([
      getDoc(ref),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), FETCH_POLICY_SERVER_MS);
      }),
    ]);
    if (!snap || !snapExists(snap)) return { ...EMPTY_POLICY };
    return parsePolicyFromData(snap.data() as Record<string, unknown>);
  } catch {
    return { ...EMPTY_POLICY };
  }
}

/** 부트 후 백그라운드 — 업데이트 안내 필요 시에만 gate 상태 반환 */
export async function resolveAppUpdateGateAfterBoot(
  currentVersion: string,
): Promise<AppUpdateGateState | null> {
  const updatePolicy = await fetchAppUpdatePolicyFromArcCore();
  const latestVersion = updatePolicy.latestVersion;
  const minSupportedVersion = updatePolicy.minSupportedVersion;
  const latestAhead = latestVersion ? compareSemver(currentVersion, latestVersion) < 0 : false;
  const belowMinimum = minSupportedVersion
    ? compareSemver(currentVersion, minSupportedVersion) < 0
    : false;
  if (!latestAhead && !belowMinimum) return null;
  return {
    visible: true,
    required: belowMinimum,
    latestVersion: latestVersion ?? minSupportedVersion ?? currentVersion,
    playStoreUrl: updatePolicy.playStoreUrl,
  };
}
