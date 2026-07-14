#!/usr/bin/env node
/**
 * 아크코어 섀도우 페어링 — 테스트 유저 시드·매칭 검증 (Firestore REST)
 *
 * 개방 rules(`allow read, write: if true`) 전제 — 인증 불필요.
 *
 * Usage:
 *   node tools/debug/test-arc-core-shadow-pairing.cjs seed      # 테스트 유저 생성 + 대기열 등록
 *   node tools/debug/test-arc-core-shadow-pairing.cjs pair      # 대기 유저와 테스트 유저 상호 페어 확정 (두 번째 유저 시뮬레이션)
 *   node tools/debug/test-arc-core-shadow-pairing.cjs status    # 대기열·페어 문서 상태 출력
 *   node tools/debug/test-arc-core-shadow-pairing.cjs status --uid <deviceUid>
 *   node tools/debug/test-arc-core-shadow-pairing.cjs cleanup   # 테스트 유저·페어 문서 정리
 *
 * 검증 절차:
 *   1) seed → arc_core_shadow_pool/waiting 에 테스트 유저 등록
 *   2) 실기기 앱 재시작(부트 12초 후 소급 페어링 패스 실행)
 *   3) status → arc_core_shadow_pairs/{테스트uid}·{기기uid} 상호 문서 확인
 *   4) eternal_throne 전투 진입 → 보스 리드 슬롯 = 테스트 전함 스펙 확인
 */
'use strict';

const PROJECT_ID = 'arcfire-49d69';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const TEST_UID = 'shadow_test_user_1';
const TEST_NICKNAME = '평행우주-테스터';

// ── Firestore REST 값 인코딩/디코딩 ─────────────────────────
function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  throw new Error(`unsupported value: ${typeof v}`);
}

function encodeFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = encodeValue(v);
  return fields;
}

function decodeValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields ?? {});
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decodeValue);
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields ?? {})) out[k] = decodeValue(v);
  return out;
}

// ── REST 헬퍼 ─────────────────────────────────────────────
async function getDoc(docPath) {
  const res = await fetch(`${BASE}/${docPath}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${docPath} → ${res.status} ${await res.text()}`);
  const json = await res.json();
  return decodeFields(json.fields);
}

async function setDoc(docPath, data) {
  const res = await fetch(`${BASE}/${docPath}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!res.ok) throw new Error(`SET ${docPath} → ${res.status} ${await res.text()}`);
}

async function deleteDoc(docPath) {
  const res = await fetch(`${BASE}/${docPath}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE ${docPath} → ${res.status} ${await res.text()}`);
  }
}

// ── 테스트 전함 스냅샷 (식별 쉬운 스펙) ─────────────────────
function buildTestShipSnapshot() {
  return {
    v: 1,
    uid: TEST_UID,
    nickname: TEST_NICKNAME,
    playerLevel: 42,
    shipDisplayName: '평행우주 시험함 PU-42',
    combat: {
      maxHp: 4242,
      maxShield: 1200,
      armor: 30,
      attackBonus: 12,
      strStat: 16,
      dexStat: 14,
      sizeClass: 1,
      expReward: 500,
      damageDiceCount: 3,
      damageDiceSides: 8,
      damageDiceBonus: 6,
      capitalShipArchetype: 'fighter',
    },
    runtime: {
      laserWeaponId: 'w_laser_light_01',
      missileWeaponId: 'w_missile_guided_single_01',
      closeRangeWeaponId: 'w_missile_arc_005',
      auxWeaponId: '',
      maxMoveSpeedPxPerMs: 0.028,
      accelPxPerMs2: 0.00004,
      maxTurnRateRadPerMs: 0.002,
      turnAccelRadPerMs2: 0.00006,
      detectRangeScale: 1.1,
    },
    equipment: {
      acBonus: 1,
      incomingDamageMul: 0.92,
      hullRegenPerTick: 0.5,
      missileMissChance: 0.05,
    },
    updatedAtMs: Date.now(),
  };
}

// ── 커맨드 ────────────────────────────────────────────────
async function cmdSeed() {
  console.log(`[seed] users/${TEST_UID} (nickname=${TEST_NICKNAME})`);
  await setDoc(`users/${TEST_UID}`, {
    uid: TEST_UID,
    nickname: TEST_NICKNAME,
    role: 'user',
    createdAt: Date.now(),
    lastLogin: Date.now(),
    deviceModel: 'shadow-pairing-test-script',
    updatedAt: Date.now(),
  });

  console.log(`[seed] arc_core_shadow_profiles/${TEST_UID} (전함 스냅샷)`);
  await setDoc(`arc_core_shadow_profiles/${TEST_UID}`, buildTestShipSnapshot());

  const existingPair = await getDoc(`arc_core_shadow_pairs/${TEST_UID}`);
  if (existingPair?.shadowUid) {
    console.log(`[seed] 이미 페어됨: ${TEST_UID} ↔ ${existingPair.shadowUid} — 대기열 등록 생략`);
    return;
  }

  const waiting = await getDoc('arc_core_shadow_pool/waiting');
  if (waiting?.uid && waiting.uid !== TEST_UID) {
    console.log(`[seed] ⚠ 대기열에 다른 유저 존재(${waiting.uid}) — 덮어쓰지 않음.`);
    console.log('       해당 유저와 먼저 매칭되게 두거나 cleanup 후 재시드하세요.');
    return;
  }

  console.log('[seed] arc_core_shadow_pool/waiting ← 테스트 유저 등록');
  await setDoc('arc_core_shadow_pool/waiting', { uid: TEST_UID, enqueuedAt: Date.now() });
  console.log('[seed] 완료. 이제 실기기에서 앱을 재시작하세요 (부트 12초 후 소급 페어링 패스).');
}

/** 두 번째 유저 시뮬레이션 — 대기 유저(실기기)와 테스트 유저를 상호 페어 확정 */
async function cmdPair() {
  const existingPair = await getDoc(`arc_core_shadow_pairs/${TEST_UID}`);
  if (existingPair?.shadowUid) {
    console.log(`[pair] 이미 페어됨: ${TEST_UID} ↔ ${existingPair.shadowUid}`);
    return;
  }
  const waiting = await getDoc('arc_core_shadow_pool/waiting');
  const waitingUid = waiting?.uid;
  if (!waitingUid || waitingUid === TEST_UID) {
    console.log('[pair] 대기 유저 없음 — 실기기에서 앱을 먼저 부팅해 대기열에 등록되게 하세요.');
    return;
  }
  const pairedAt = Date.now();
  console.log(`[pair] ${TEST_UID} ↔ ${waitingUid} 상호 페어 기록`);
  await setDoc(`arc_core_shadow_pairs/${TEST_UID}`, {
    uid: TEST_UID,
    shadowUid: waitingUid,
    pairedAt,
  });
  await setDoc(`arc_core_shadow_pairs/${waitingUid}`, {
    uid: waitingUid,
    shadowUid: TEST_UID,
    pairedAt,
  });
  await deleteDoc('arc_core_shadow_pool/waiting');
  console.log('[pair] 완료. 실기기 앱 재시작 → 부트 12초 후 페어 캐시 + 테스트 전함 스냅샷 fetch.');
}

async function cmdStatus(deviceUid) {
  const waiting = await getDoc('arc_core_shadow_pool/waiting');
  console.log('── arc_core_shadow_pool/waiting ──');
  console.log(waiting ? JSON.stringify(waiting) : '(없음)');

  const testPair = await getDoc(`arc_core_shadow_pairs/${TEST_UID}`);
  console.log(`── arc_core_shadow_pairs/${TEST_UID} ──`);
  console.log(testPair ? JSON.stringify(testPair) : '(없음 — 아직 미페어)');

  if (testPair?.shadowUid) {
    const counterPair = await getDoc(`arc_core_shadow_pairs/${testPair.shadowUid}`);
    console.log(`── arc_core_shadow_pairs/${testPair.shadowUid} (상호 문서) ──`);
    console.log(counterPair ? JSON.stringify(counterPair) : '(없음 — ⚠ 상호 문서 누락)');
    const ok = counterPair?.shadowUid === TEST_UID;
    console.log(ok ? '✅ 상호 1:1 페어 검증 PASS' : '❌ 상호 페어 불일치');

    const counterProfile = await getDoc(`arc_core_shadow_profiles/${testPair.shadowUid}`);
    console.log(`── arc_core_shadow_profiles/${testPair.shadowUid} (기기 전함 publish) ──`);
    console.log(
      counterProfile
        ? `nickname=${counterProfile.nickname} ship=${counterProfile.shipDisplayName} maxHp=${counterProfile.combat?.maxHp}`
        : '(없음 — 기기 스냅샷 publish 미도달)',
    );
  }

  if (deviceUid) {
    const devicePair = await getDoc(`arc_core_shadow_pairs/${deviceUid}`);
    console.log(`── arc_core_shadow_pairs/${deviceUid} (--uid 지정) ──`);
    console.log(devicePair ? JSON.stringify(devicePair) : '(없음)');
  }
}

async function cmdCleanup() {
  const testPair = await getDoc(`arc_core_shadow_pairs/${TEST_UID}`);
  if (testPair?.shadowUid) {
    console.log(`[cleanup] 상호 페어 문서 삭제: ${testPair.shadowUid}`);
    await deleteDoc(`arc_core_shadow_pairs/${testPair.shadowUid}`);
  }
  console.log('[cleanup] 테스트 유저 문서 삭제');
  await deleteDoc(`arc_core_shadow_pairs/${TEST_UID}`);
  await deleteDoc(`arc_core_shadow_profiles/${TEST_UID}`);
  await deleteDoc(`users/${TEST_UID}`);

  const waiting = await getDoc('arc_core_shadow_pool/waiting');
  if (waiting?.uid === TEST_UID) {
    console.log('[cleanup] 대기열에서 테스트 유저 제거');
    await deleteDoc('arc_core_shadow_pool/waiting');
  }
  console.log('[cleanup] 완료. (기기 로컬 캐시는 앱 데이터에 남음 — 재페어 테스트 시 앱 데이터 삭제 또는 무시)');
}

async function main() {
  const cmd = process.argv[2];
  const uidFlagIdx = process.argv.indexOf('--uid');
  const deviceUid = uidFlagIdx >= 0 ? process.argv[uidFlagIdx + 1] : null;

  if (cmd === 'seed') return cmdSeed();
  if (cmd === 'pair') return cmdPair();
  if (cmd === 'status') return cmdStatus(deviceUid);
  if (cmd === 'cleanup') return cmdCleanup();
  console.error('Usage: node tools/debug/test-arc-core-shadow-pairing.cjs <seed|status|cleanup> [--uid <deviceUid>]');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
