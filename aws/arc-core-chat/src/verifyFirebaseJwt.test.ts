import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { test } from 'node:test';
import {
  assertFirebaseIdTokenClaims,
  DEFAULT_FIREBASE_PROJECT_ID,
  parseFirebaseJwt,
  verifyFirebaseIdToken,
  verifyJwtRs256Signature,
} from './verifyFirebaseJwt';

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

function signJwt(
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'],
  header: Record<string, string>,
  payload: Record<string, unknown>,
): string {
  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  return `${signingInput}.${sign.sign(privateKey, 'base64url')}`;
}

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicPem = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();

test('claims require firebase iss/aud and reject expired', () => {
  const now = 1_800_000_000_000;
  const uid = assertFirebaseIdTokenClaims(
    {
      iss: `https://securetoken.google.com/${DEFAULT_FIREBASE_PROJECT_ID}`,
      aud: DEFAULT_FIREBASE_PROJECT_ID,
      exp: now / 1000 + 3600,
      iat: now / 1000,
      sub: 'pilot-7',
      user_id: 'pilot-7',
    },
    DEFAULT_FIREBASE_PROJECT_ID,
    now,
  );
  assert.equal(uid, 'pilot-7');
  assert.equal(
    assertFirebaseIdTokenClaims(
      {
        iss: `https://securetoken.google.com/${DEFAULT_FIREBASE_PROJECT_ID}`,
        aud: DEFAULT_FIREBASE_PROJECT_ID,
        exp: now / 1000 - 10,
        sub: 'pilot-7',
      },
      DEFAULT_FIREBASE_PROJECT_ID,
      now,
    ),
    null,
  );
});

test('RS256 signature verifies and forged token fails', async () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const token = signJwt(
    pair.privateKey,
    { alg: 'RS256', kid: 'test-kid', typ: 'JWT' },
    {
      iss: `https://securetoken.google.com/${DEFAULT_FIREBASE_PROJECT_ID}`,
      aud: DEFAULT_FIREBASE_PROJECT_ID,
      exp: nowSec + 3600,
      iat: nowSec,
      sub: 'uid-real',
      user_id: 'uid-real',
    },
  );
  const parsed = parseFirebaseJwt(token);
  assert.ok(parsed);
  assert.equal(
    verifyJwtRs256Signature(parsed!.signingInput, parsed!.signature, publicPem),
    true,
  );
  const uid = await verifyFirebaseIdToken(token, {
    getCerts: async () => ({ 'test-kid': publicPem }),
  });
  assert.equal(uid, 'uid-real');

  const forged = `${token.slice(0, -4)}abcd`;
  const bad = await verifyFirebaseIdToken(forged, {
    getCerts: async () => ({ 'test-kid': publicPem }),
  });
  assert.equal(bad, null);
});

test('unsigned bearer and wrong kid never authenticate', async () => {
  assert.equal(await verifyFirebaseIdToken('test-token'), null);
  const nowSec = Math.floor(Date.now() / 1000);
  const token = signJwt(
    pair.privateKey,
    { alg: 'RS256', kid: 'missing', typ: 'JWT' },
    {
      iss: `https://securetoken.google.com/${DEFAULT_FIREBASE_PROJECT_ID}`,
      aud: DEFAULT_FIREBASE_PROJECT_ID,
      exp: nowSec + 3600,
      iat: nowSec,
      sub: 'uid-real',
    },
  );
  assert.equal(
    await verifyFirebaseIdToken(token, { getCerts: async () => ({ 'test-kid': publicPem }) }),
    null,
  );
});
