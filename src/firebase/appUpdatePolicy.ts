import { arccoreDocRef, getDoc } from './firestoreRefs';

const ARCCORE_CONFIG_DOC = 'config';

export type AppUpdatePolicy = {
  latestVersion: string | null;
  minSupportedVersion: string | null;
  playStoreUrl: string | null;
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

export async function fetchAppUpdatePolicyFromArcCore(): Promise<AppUpdatePolicy> {
  try {
    const snap = await getDoc(arccoreDocRef(ARCCORE_CONFIG_DOC));
    if (!snap.exists) {
      return {
        latestVersion: null,
        minSupportedVersion: null,
        playStoreUrl: null,
      };
    }
    const data = (snap.data() ?? {}) as Record<string, unknown>;
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
    return {
      latestVersion,
      minSupportedVersion,
      playStoreUrl,
    };
  } catch (e) {
    console.warn('[appUpdatePolicy] fetchAppUpdatePolicyFromArcCore skipped:', e);
    return {
      latestVersion: null,
      minSupportedVersion: null,
      playStoreUrl: null,
    };
  }
}

