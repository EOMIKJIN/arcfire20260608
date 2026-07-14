#!/usr/bin/env node
/**
 * 섀도우 테스트 데이터 ↔ 실제 클라이언트 생성 데이터 — 구조 동등성 검증 (1회성)
 *
 * 비교 대상 (실기기 = 실제 클라이언트 코드가 생성한 정본):
 *   1) users/{기기uid}                     vs users/shadow_test_user_1
 *   2) arc_core_shadow_profiles/{기기uid}  vs arc_core_shadow_profiles/shadow_test_user_1
 *   3) arc_core_shadow_pairs 양쪽 필드
 *
 * 판정: 섀도우 시스템이 실제로 읽는 필드가 양쪽에 동일 타입으로 존재하는가.
 */
'use strict';

const PROJECT_ID = 'arcfire-49d69';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DEVICE_UID = process.argv[2] || '519f756a7517ac11';
const TEST_UID = 'shadow_test_user_1';

function decodeValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return `<timestamp:${v.timestampValue}>`;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields ?? {});
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decodeValue);
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields ?? {})) out[k] = decodeValue(v);
  return out;
}

async function getDoc(docPath) {
  const res = await fetch(`${BASE}/${docPath}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${docPath} → ${res.status}`);
  return decodeFields((await res.json()).fields);
}

function typeOf(v) {
  if (v === null || v === undefined) return 'missing';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'string' && v.startsWith('<timestamp:')) return 'timestamp';
  return typeof v;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function compareDocs(label, realDoc, testDoc, requiredFields) {
  console.log(`\n════ ${label} ════`);
  if (!realDoc) {
    console.log('⚠ 실기기 문서 없음 — 비교 불가');
    return false;
  }
  if (!testDoc) {
    console.log('⚠ 테스트 문서 없음 — 비교 불가');
    return false;
  }
  const real = flatten(realDoc);
  const test = flatten(testDoc);
  const allKeys = [...new Set([...Object.keys(real), ...Object.keys(test)])].sort();

  let requiredOk = true;
  for (const key of allKeys) {
    const rt = typeOf(real[key]);
    const tt = typeOf(test[key]);
    const required = requiredFields.some((f) => key === f || key.startsWith(`${f}.`));
    const match = rt === tt || (rt === 'number' && tt === 'number');
    const mark = match ? '  =' : required ? '❌ ' : '  ≠';
    if (!match || required) {
      console.log(`${mark} ${key}: real=${rt}(${JSON.stringify(real[key])?.slice(0, 40)}) test=${tt}(${JSON.stringify(test[key])?.slice(0, 40)})`);
    }
    if (required && !match) requiredOk = false;
  }
  console.log(requiredOk ? '→ ✅ 시스템이 읽는 필수 필드 동등' : '→ ❌ 필수 필드 불일치');
  return requiredOk;
}

async function main() {
  console.log(`실기기(정본) uid=${DEVICE_UID} / 테스트 uid=${TEST_UID}`);

  // 1) users — 섀도우 시스템이 읽는 필드: nickname (fetchArcCoreShadowNickname)
  const ok1 = compareDocs(
    'users/{uid} — 시스템이 읽는 필드: nickname',
    await getDoc(`users/${DEVICE_UID}`),
    await getDoc(`users/${TEST_UID}`),
    ['nickname'],
  );

  // 2) shadow profiles — parseArcCoreShadowShipSnapshot 필수: nickname, combat.maxHp(>0)
  //    + 나머지 combat/runtime/equipment 필드 전부 타입 비교
  const realProfile = await getDoc(`arc_core_shadow_profiles/${DEVICE_UID}`);
  const testProfile = await getDoc(`arc_core_shadow_profiles/${TEST_UID}`);
  const ok2 = compareDocs(
    'arc_core_shadow_profiles/{uid} — parse 필수: nickname · combat.maxHp',
    realProfile,
    testProfile,
    [
      'nickname', 'playerLevel', 'shipDisplayName', 'updatedAtMs', 'v',
      'combat.maxHp', 'combat.maxShield', 'combat.armor', 'combat.attackBonus',
      'combat.strStat', 'combat.dexStat', 'combat.sizeClass', 'combat.expReward',
      'combat.damageDiceCount', 'combat.damageDiceSides', 'combat.damageDiceBonus',
      'runtime.laserWeaponId', 'runtime.missileWeaponId', 'runtime.closeRangeWeaponId',
      'equipment.acBonus', 'equipment.incomingDamageMul',
      'equipment.hullRegenPerTick', 'equipment.missileMissChance',
    ],
  );

  // 3) pairs — ensureArcCoreShadowPairing 트랜잭션 산출과 동일 필드인가
  const ok3 = compareDocs(
    'arc_core_shadow_pairs — 필수: uid · shadowUid · pairedAt',
    await getDoc(`arc_core_shadow_pairs/${DEVICE_UID}`),
    await getDoc(`arc_core_shadow_pairs/${TEST_UID}`),
    ['uid', 'shadowUid', 'pairedAt'],
  );

  console.log('\n════ 종합 ════');
  console.log(`users: ${ok1 ? 'PASS' : 'FAIL'} / profiles: ${ok2 ? 'PASS' : 'FAIL'} / pairs: ${ok3 ? 'PASS' : 'FAIL'}`);
  process.exitCode = ok1 && ok2 && ok3 ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
