import { createPublicKey, createVerify } from 'node:crypto';

export const DEFAULT_FIREBASE_PROJECT_ID = 'arcfire-49d69';
export const GOOGLE_SECURETOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const CERTS_TTL_MS = 6 * 60 * 60 * 1000;

type CertCache = { atMs: number; byKid: Record<string, string> };
let certCache: CertCache | null = null;

export type FirebaseJwtHeader = {
  alg?: string;
  kid?: string;
};

export type FirebaseJwtPayload = {
  iss?: unknown;
  aud?: unknown;
  exp?: unknown;
  iat?: unknown;
  sub?: unknown;
  user_id?: unknown;
  auth_time?: unknown;
};

function b64UrlJson(part: string): unknown {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

export function parseFirebaseJwt(token: string): {
  header: FirebaseJwtHeader;
  payload: FirebaseJwtPayload;
  signingInput: string;
  signature: string;
} | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) return null;
  try {
    const header = b64UrlJson(parts[0]!) as FirebaseJwtHeader;
    const payload = b64UrlJson(parts[1]!) as FirebaseJwtPayload;
    if (!header || typeof header !== 'object' || !payload || typeof payload !== 'object') {
      return null;
    }
    return {
      header,
      payload,
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: parts[2]!,
    };
  } catch {
    return null;
  }
}

export function readFirebaseProjectId(): string {
  return (
    process.env.ARC_CORE_CHAT_FIREBASE_PROJECT_ID?.trim()
    || process.env.GCLOUD_PROJECT?.trim()
    || DEFAULT_FIREBASE_PROJECT_ID
  );
}

export function assertFirebaseIdTokenClaims(
  payload: FirebaseJwtPayload,
  projectId: string,
  nowMs = Date.now(),
): string | null {
  const project = projectId.trim();
  if (!project) return null;
  const iss = String(payload.iss ?? '');
  const aud = String(payload.aud ?? '');
  if (iss !== `https://securetoken.google.com/${project}`) return null;
  if (aud !== project) return null;
  const exp = Number(payload.exp);
  const iat = Number(payload.iat);
  if (!Number.isFinite(exp) || exp * 1000 <= nowMs) return null;
  if (Number.isFinite(iat) && iat * 1000 > nowMs + 60_000) return null;
  const uid = String(payload.user_id ?? payload.sub ?? '').trim();
  if (!uid || uid.length > 128) return null;
  return uid;
}

export function verifyJwtRs256Signature(
  signingInput: string,
  signatureB64Url: string,
  pem: string,
): boolean {
  try {
    const key = createPublicKey(pem);
    const verify = createVerify('RSA-SHA256');
    verify.update(signingInput);
    verify.end();
    return verify.verify(key, signatureB64Url, 'base64url');
  } catch {
    return false;
  }
}

export async function fetchGoogleSecureTokenCerts(
  fetcher: typeof fetch = fetch,
): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (certCache && now - certCache.atMs < CERTS_TTL_MS) return certCache.byKid;
  try {
    const res = await fetcher(GOOGLE_SECURETOKEN_CERTS_URL);
    if (!res.ok) return certCache?.byKid ?? null;
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return certCache?.byKid ?? null;
    const byKid: Record<string, string> = {};
    for (const [kid, pem] of Object.entries(json as Record<string, unknown>)) {
      if (typeof pem === 'string' && pem.includes('BEGIN') && kid.trim()) {
        byKid[kid] = pem;
      }
    }
    if (Object.keys(byKid).length === 0) return certCache?.byKid ?? null;
    certCache = { atMs: now, byKid };
    return byKid;
  } catch {
    return certCache?.byKid ?? null;
  }
}

export function resetFirebaseCertCacheForTest(): void {
  certCache = null;
}

export async function verifyFirebaseIdToken(
  token: string,
  opts?: {
    projectId?: string;
    nowMs?: number;
    getCerts?: () => Promise<Record<string, string> | null>;
  },
): Promise<string | null> {
  const parsed = parseFirebaseJwt(token);
  if (!parsed) return null;
  if (parsed.header.alg !== 'RS256') return null;
  const kid = parsed.header.kid?.trim();
  if (!kid) return null;
  const projectId = opts?.projectId ?? readFirebaseProjectId();
  const uid = assertFirebaseIdTokenClaims(parsed.payload, projectId, opts?.nowMs);
  if (!uid) return null;
  const certs = opts?.getCerts
    ? await opts.getCerts()
    : await fetchGoogleSecureTokenCerts();
  const pem = certs?.[kid];
  if (!pem) return null;
  if (!verifyJwtRs256Signature(parsed.signingInput, parsed.signature, pem)) return null;
  return uid;
}
