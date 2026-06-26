/**
 * 로컬 월드스토어 초기 상태와 동일한 잠금 집합으로
 * pickArcCoreDailyUnlockCandidate 알고리즘(프론티어 수집 + 무작위)이 후보를 내는지 검증한다.
 * 실행: npx tsx tools/world-expansion/verify-arc-core-daily-unlock.ts
 */
import {
  GALAXY_SYSTEMS,
  GAMEPLAY_SYSTEM_IDS,
  LEGACY_VISIBLE_TOTAL_SYSTEMS,
  parseSynthOrdinal,
} from '../../src/data/galaxy100';
import {
  ARC_CORE_ACCOUNT_FRESH_START_SEED_SYSTEM_ID,
  ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS,
} from '../../src/arcCore/worldExpansionConstants';
import { isArcCoreLegacyGuaranteedUnlockEnabled } from '../../src/arcCore/arcCoreExpansionTestFlags';
import {
  buildDeterministicGlobalSynthUnlockSchedule,
  computeGlobalSynthUnlockTargetCount,
} from '../../src/arcCore/worldExpansionGlobalSchedule';
import { resolveArcCoreWorldExpansionGlobalPolicy } from '../../src/arcCore/worldExpansionGlobalPolicy';

function normalizeSynthSystemId(id: string): string {
  if (!id.startsWith('synth_')) return id;
  const raw = id.slice('synth_'.length);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return id;
  return `synth_${String(n).padStart(3, '0')}`;
}

function buildGuaranteedUnlockIds(): string[] {
  if (!isArcCoreLegacyGuaranteedUnlockEnabled()) return [];
  return [...ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS];
}

const defaultUnlocked = Array.from(
  new Set([
    ...Array.from(GAMEPLAY_SYSTEM_IDS),
    ARC_CORE_ACCOUNT_FRESH_START_SEED_SYSTEM_ID,
    ...buildGuaranteedUnlockIds(),
  ]),
).sort();

function isLegacySynthSystemId(id: string): boolean {
  const ord = parseSynthOrdinal(id);
  if (ord === null) return false;
  const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);
  return ord <= legacySynthCount;
}

function isExpansionSynthSystemId(id: string): boolean {
  const ord = parseSynthOrdinal(id);
  if (ord === null) return false;
  const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);
  return ord > legacySynthCount;
}

function pickCandidate(currentSystemId: string | null): string | null {
  const systems = GALAXY_SYSTEMS;
  const unlocked = new Set(defaultUnlocked);
  const unlockedIds = defaultUnlocked.filter((id) => systems[id]).sort();
  const orderedFromIds =
    currentSystemId && systems[currentSystemId]
      ? [currentSystemId, ...unlockedIds.filter((id) => id !== currentSystemId)]
      : unlockedIds;

  const collectFrontierSynthIds = (pred: (id: string) => boolean): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const fromId of orderedFromIds) {
      const sys = systems[fromId];
      if (!sys) continue;
      for (const cid of [...sys.connections].sort()) {
        if (unlocked.has(cid)) continue;
        const t = systems[cid];
        if (!t || !cid.startsWith('synth_')) continue;
        if (!pred(cid)) continue;
        if (seen.has(cid)) continue;
        seen.add(cid);
        out.push(cid);
      }
    }
    return out;
  };

  const pickRandom = (ids: string[]): string | null => {
    if (ids.length === 0) return null;
    const i = Math.floor(Math.random() * ids.length);
    return ids[i] ?? null;
  };

  const legacyFrontier = collectFrontierSynthIds(isLegacySynthSystemId);
  const legacyPick = pickRandom(legacyFrontier);
  if (legacyPick) return legacyPick;
  const expansionFrontier = collectFrontierSynthIds(isExpansionSynthSystemId);
  return pickRandom(expansionFrontier);
}

function main(): void {
  const systems = GALAXY_SYSTEMS;
  const unlocked = new Set(defaultUnlocked);
  const unlockedIds = defaultUnlocked.filter((id) => systems[id]).sort();
  const orderedFromIds = unlockedIds;

  const collectAll = (pred: (id: string) => boolean): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const fromId of orderedFromIds) {
      const sys = systems[fromId];
      if (!sys) continue;
      for (const cid of [...sys.connections].sort()) {
        if (unlocked.has(cid)) continue;
        const t = systems[cid];
        if (!t || !cid.startsWith('synth_')) continue;
        if (!pred(cid)) continue;
        if (seen.has(cid)) continue;
        seen.add(cid);
        out.push(cid);
      }
    }
    return out;
  };

  const legacy = collectAll(isLegacySynthSystemId);
  const expansion = collectAll(isExpansionSynthSystemId);

  console.log('--- ArcCore 일일 개방(로컬) 검증 ---');
  console.log('기본 개방 성계 수:', defaultUnlocked.length);
  console.log('레거시 미개척 프론티어(연결된 잠금 synth) 수:', legacy.length);
  if (legacy.length) console.log('  예시 id:', legacy.slice(0, 12).join(', '), legacy.length > 12 ? '...' : '');
  console.log('확장 synth 프론티어 수:', expansion.length);

  const trials: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const c = pickCandidate('arcadia');
    if (c) trials.push(c);
  }
  const sample = pickCandidate(null);

  console.log('');
  console.log('무작위 샘플(arcadia 우선):', [...new Set(trials)].join(', ') || '(없음)');
  console.log('무작위 샘플(current=null):', sample ?? '(null)');

  const target = sample ?? pickCandidate('arcadia');
  const ok = Boolean(target && systems[target]?.planets?.[0]?.id);
  console.log('');
  console.log('개방 시뮬레이션(후보 행성 존재):', ok ? '성공' : '실패');
  if (target && systems[target]) {
    const p0 = systems[target].planets[0];
    console.log('  선택 성계:', target);
    console.log('  첫 행성 id:', p0?.id ?? '(없음)');
    console.log('  첫 행성 표기(자동생성 시): 방위 미개척 행성-*** 형태');
  }

  if (!legacy.length && !expansion.length) {
    console.error('\n[오류] 프론티어 후보가 없습니다. 은하 그래프·잠금 집합을 확인하세요.');
    process.exitCode = 1;
  } else if (!ok) {
    console.error('\n[오류] 후보는 있으나 행성 데이터가 비었습니다.');
    process.exitCode = 1;
  }

  const globalPolicy = resolveArcCoreWorldExpansionGlobalPolicy();
  const nowMs = Date.now();
  const targetCount = computeGlobalSynthUnlockTargetCount(globalPolicy, nowMs);
  const schedule = buildDeterministicGlobalSynthUnlockSchedule(
    systems,
    targetCount,
    Array.from(GAMEPLAY_SYSTEM_IDS),
  );
  console.log('');
  console.log('--- 전역 epoch 일정 (RTDB/CSV) ---');
  console.log('enabled:', globalPolicy.globalScheduleEnabled, 'source:', globalPolicy.source);
  console.log('epoch:', globalPolicy.epochDayKey, 'gen:', globalPolicy.resetGeneration);
  console.log('오늘 목표 synth 개수:', targetCount);
  if (schedule.length) {
    console.log('  결정적 순서(처음 12):', schedule.slice(0, 12).join(', '), schedule.length > 12 ? '...' : '');
  }
}

main();
