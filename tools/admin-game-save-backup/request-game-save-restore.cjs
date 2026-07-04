#!/usr/bin/env node
/**
 * 특정 계정 게임 저장 복구 예약 — users/{uid}.adminGameSaveRestorePending
 * 클라이언트 다음 기동 시 1회 소비·복구.
 *
 * Usage:
 *   npm run admin:game-save:restore -- --uid <firebase_uid> --backup-id <backupId>
 *   npm run admin:game-save:restore -- --uid abc --backup-id 1751606400000_scheduled --dry-run
 */
'use strict';

const path = require('path');

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_FIELD = 'adminGameSaveRestorePending';

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function initAdmin() {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS required');
      process.exit(1);
    }
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return admin;
}

async function main() {
  const uid = argValue('--uid');
  const backupId = argValue('--backup-id');
  const dryRun = process.argv.includes('--dry-run');
  if (!uid || !backupId) {
    console.error(
      'Usage: npm run admin:game-save:restore -- --uid <uid> --backup-id <backupId>',
    );
    process.exit(1);
  }

  const admin = initAdmin();
  const db = admin.firestore();
  const backupRef = db.collection('users').doc(uid).collection('game_save_backups').doc(backupId);
  const backupSnap = await backupRef.get();
  if (!backupSnap.exists) {
    console.error(`Backup not found: users/${uid}/game_save_backups/${backupId}`);
    process.exit(1);
  }
  const backup = backupSnap.data();
  const nowMs = Date.now();
  if (backup.expiresAtMs && backup.expiresAtMs < nowMs) {
    console.error(`Backup expired at ${new Date(backup.expiresAtMs).toISOString()}`);
    process.exit(1);
  }

  const pending = {
    backupId,
    requestedAtMs: nowMs,
    expiresAtMs: nowMs + RETENTION_MS,
    requestedBy: 'admin_cli',
  };

  console.log('Target uid:', uid);
  console.log('Backup:', backupId);
  console.log('Summary:', JSON.stringify(backup.summary ?? {}, null, 2));
  console.log('Pending payload:', JSON.stringify(pending, null, 2));

  if (dryRun) {
    console.log('(dry-run — no write)');
    return;
  }

  await db.collection('users').doc(uid).set(
    {
      [PENDING_FIELD]: pending,
      server_updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log('OK — client will restore on next app boot (consumePendingAdminGameSaveRestore).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
