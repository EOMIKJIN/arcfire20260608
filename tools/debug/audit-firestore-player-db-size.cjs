#!/usr/bin/env node
/**
 * Firestore 플레이어 DB 전수검사 (읽기 전용) — users 문서 크기·필드 구성 실측
 * 개방 rules 전제 REST read. 어떤 쓰기도 하지 않는다.
 *
 * Usage: node tools/debug/audit-firestore-player-db-size.cjs
 */
'use strict';

const PROJECT_ID = 'arcfire-49d69';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function listDocs(collectionPath, pageSize = 50) {
  const out = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${collectionPath}?pageSize=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LIST ${collectionPath} → ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const d of json.documents ?? []) out.push(d);
    pageToken = json.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

function jsonSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

function countFieldsDeep(fields, depth = 0) {
  let n = 0;
  for (const v of Object.values(fields ?? {})) {
    n += 1;
    if (v.mapValue) n += countFieldsDeep(v.mapValue.fields ?? {}, depth + 1);
    if (v.arrayValue) {
      for (const item of v.arrayValue.values ?? []) {
        if (item.mapValue) n += countFieldsDeep(item.mapValue.fields ?? {}, depth + 1);
      }
    }
  }
  return n;
}

async function main() {
  const users = await listDocs('users');
  console.log(`users 문서 수: ${users.length}`);
  for (const docu of users) {
    const id = docu.name.split('/').pop();
    const fields = docu.fields ?? {};
    const totalBytes = jsonSize(fields);
    const fieldCount = countFieldsDeep(fields);
    console.log(`\n== users/${id} — 총 ${(totalBytes / 1024).toFixed(1)}KB (REST JSON 기준) · 리프+맵 필드 ${fieldCount}개`);
    const rows = Object.entries(fields)
      .map(([k, v]) => ({ k, bytes: jsonSize(v), leafs: v.mapValue ? countFieldsDeep(v.mapValue.fields ?? {}) : 1 }))
      .sort((a, b) => b.bytes - a.bytes);
    for (const r of rows) {
      console.log(`  ${r.k.padEnd(24)} ${(r.bytes / 1024).toFixed(1).padStart(8)}KB  fields=${r.leafs}`);
    }
    // 백업 서브컬렉션 개수·크기
    try {
      const backups = await listDocs(`users/${id}/game_save_backups`);
      let backupBytes = 0;
      for (const b of backups) backupBytes += jsonSize(b.fields ?? {});
      console.log(`  [subcol] game_save_backups: ${backups.length}개 · 합계 ${(backupBytes / 1024).toFixed(1)}KB`);
    } catch (e) {
      console.log(`  [subcol] game_save_backups: 조회 실패 (${e.message?.slice(0, 80)})`);
    }
  }

  for (const col of ['arc_core_shadow_pairs', 'arc_core_shadow_profiles', 'arc_core_shadow_pool', 'battles', 'arccore']) {
    try {
      const docs = await listDocs(col);
      let bytes = 0;
      for (const d of docs) bytes += jsonSize(d.fields ?? {});
      console.log(`\n${col}: ${docs.length}개 문서 · 합계 ${(bytes / 1024).toFixed(1)}KB`);
    } catch (e) {
      console.log(`\n${col}: 조회 실패 (${e.message?.slice(0, 80)})`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
