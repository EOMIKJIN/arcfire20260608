#!/usr/bin/env node
/**
 * SIM delta + learning seed → Firebase RTDB arccore/* publish
 *
 * Prerequisites:
 *   - firebase login (로컬 CLI 경로 · 기본)
 *   - 또는 GOOGLE_APPLICATION_CREDENTIALS (Admin SDK)
 *   - firebase deploy --only database (rules)
 *
 * Usage:
 *   npm run arc-core:rtdb:publish-policy
 *   npm run arc-core:rtdb:publish-policy -- --dry-run
 *   npm run arc-core:rtdb:publish-policy -- --admin   # Admin SDK 강제
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createRequire } = require('module');

const ROOT = path.resolve(__dirname, '../..');
const DELTA_TS = path.join(ROOT, 'src/data/balance/generated/economySimOverlayDelta.ts');
const LEARNING_SEED = path.join(ROOT, 'tools/arc-core-learning/reports/learning-store-seed.json');
const PAYLOAD_OUT = path.join(ROOT, 'tools/arc-core-learning/reports/rtdb-publish-payload.json');

const dryRun = process.argv.includes('--dry-run');
const forceAdmin = process.argv.includes('--admin');
const useCli = process.argv.includes('--cli') || (!forceAdmin && !process.env.GOOGLE_APPLICATION_CREDENTIALS);

function readSimDeltaFromGeneratedTs() {
  const raw = fs.readFileSync(DELTA_TS, 'utf8');
  const marker = 'BalanceOverlayDelta = ';
  const start = raw.indexOf(marker);
  if (start < 0) throw new Error('economySimOverlayDelta.ts parse failed');
  const jsonStart = start + marker.length;
  let depth = 0;
  let end = -1;
  for (let i = jsonStart; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('economySimOverlayDelta.ts JSON bounds failed');
  return JSON.parse(raw.slice(jsonStart, end));
}

function readLearningSeed() {
  try {
    return JSON.parse(fs.readFileSync(LEARNING_SEED, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const delta = readSimDeltaFromGeneratedTs();
  const packId = delta.deltaId;
  if (!packId) throw new Error('deltaId missing');

  const now = Date.now();
  const config = {
    schemaVersion: 1,
    activePolicyPackId: packId,
    learningSyncEnabled: true,
    safeMode: false,
    updatedAt: now,
  };

  const policyPack = {
    schemaVersion: 1,
    packId,
    status: 'approved',
    balanceOverlay: delta,
    issuedAt: delta.generatedAt ?? new Date().toISOString(),
    issuedBy: 'sim',
    approvedAt: now,
  };

  const seed = readLearningSeed();
  const kpiTimelineTail = (seed?.kpiTimeline ?? []).slice(-14).map((row) => ({
    dayKey: row.dayKey,
    economy: row.economy,
  }));

  const learningGlobal = {
    schemaVersion: 1,
    dayKey: new Date().toISOString().slice(0, 10),
    activePolicyPackId: packId,
    kpiTimelineTail,
    updatedAt: now,
  };

  const arccorePayload = {
    config,
    policy_packs: { [packId]: policyPack },
    learning: { global: learningGlobal },
  };

  if (dryRun) {
    console.log('[arc-core-rtdb] dry-run payload keys:', Object.keys(arccorePayload));
    console.log(JSON.stringify(config, null, 2));
    console.log(`[arc-core-rtdb] publish mode: ${useCli ? 'firebase-cli' : 'admin-sdk'}`);
    return;
  }

  if (useCli) {
    fs.writeFileSync(PAYLOAD_OUT, JSON.stringify(arccorePayload, null, 2));
    execFileSync(
      'firebase',
      ['database:update', '/arccore', PAYLOAD_OUT, '--force'],
      { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' },
    );
    console.log(`[arc-core-rtdb] published via CLI packId=${packId} (+ config, learning/global)`);
    return;
  }

  const flatUpdates = {
    'arccore/config': config,
    [`arccore/policy_packs/${packId}`]: policyPack,
    'arccore/learning/global': learningGlobal,
  };

  const requireFromFunctions = createRequire(path.join(ROOT, 'functions/package.json'));
  const admin = requireFromFunctions('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
    });
  }

  const db = admin.database();
  db.ref('/')
    .update(flatUpdates)
    .then(() => {
      console.log(`[arc-core-rtdb] published via Admin SDK packId=${packId}`);
    })
    .catch((e) => {
      console.error('[arc-core-rtdb] Admin SDK publish failed:', e.message);
      console.error('[arc-core-rtdb] hint: npm run arc-core:rtdb:publish-policy (firebase login CLI 기본)');
      process.exit(1);
    });
}

main();
