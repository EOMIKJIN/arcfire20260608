#!/usr/bin/env node
/**
 * Firestore 게임 저장 백업 목록 (관리자 CLI)
 *
 * Usage:
 *   npm run admin:game-save:list -- --uid <firebase_uid>
 *   npm run admin:game-save:list -- --uid abc123 --limit 15
 */
'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function initAdmin() {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS required');
      process.exit(1);
    }
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin;
}

async function main() {
  const uid = argValue('--uid');
  if (!uid) {
    console.error('Usage: npm run admin:game-save:list -- --uid <firebase_uid>');
    process.exit(1);
  }
  const limitN = Math.min(40, Math.max(1, Number(argValue('--limit') ?? '20') || 20));
  const admin = initAdmin();
  const db = admin.firestore();
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('game_save_backups')
    .limit(limitN)
    .get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));

  console.log(`uid=${uid} backups=${rows.length}`);
  for (const row of rows) {
    const exp = row.expiresAtMs ? new Date(row.expiresAtMs).toISOString() : '?';
    const created = row.createdAtMs ? new Date(row.createdAtMs).toISOString() : '?';
    const synth = row.summary?.synthUnlockCount ?? '?';
    console.log(
      `- ${row.id} | ${created} | expires ${exp} | reason=${row.reason} | synth=${synth} | nick=${row.nickname ?? ''}`,
    );
  }
  if (rows.length === 0) {
    console.log('(no backups — play session with cloud sync or manual backup first)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
