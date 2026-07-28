/**
 * 성계 노드라인 회귀 테스트 — 이동(GALAXY)/분쟁·보급(STAR·CSV) 이중 그래프 일치 (2026-07-28)
 * npx tsx --test src/galaxyMap/systemNodeGraphRegression.test.ts
 */
import assert from 'node:assert/strict';
import { STAR_SYSTEMS_FROM_CSV } from '../data/generated/csvSystems';
import { GALAXY_SYSTEMS_PRECOMPUTED } from '../data/generated/galaxySystems100.generated';
import { GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('1) helios 1홉에 perseus 없음 · perseus 1홉에 helios 없음(직접 엣지 삭제 회귀 방지)', () => {
  assert.ok(STAR_SYSTEMS_FROM_CSV.helios, 'helios 성계가 있어야 함');
  assert.ok(STAR_SYSTEMS_FROM_CSV.perseus, 'perseus 성계가 있어야 함');
  assert.equal(STAR_SYSTEMS_FROM_CSV.helios!.connections.includes('perseus'), false);
  assert.equal(STAR_SYSTEMS_FROM_CSV.perseus!.connections.includes('helios'), false);
});

test('2) sirius↔draco_nebula 대칭(단방향 회귀 방지)', () => {
  assert.ok(STAR_SYSTEMS_FROM_CSV.draco_nebula!.connections.includes('sirius'));
  assert.ok(STAR_SYSTEMS_FROM_CSV.sirius!.connections.includes('draco_nebula'));
});

test('3) 정본 항로(헬리오스→오메가→뉴에덴→베가→드라코→페르세우스) 5홉 엣지 전부 유효', () => {
  const route = ['helios', 'omega_station', 'new_eden', 'vega_outpost', 'draco_nebula', 'perseus'];
  for (let i = 1; i < route.length; i += 1) {
    const a = route[i - 1]!;
    const b = route[i]!;
    assert.ok(
      STAR_SYSTEMS_FROM_CSV[a]?.connections.includes(b),
      `${a} -> ${b} 1홉이어야 함(정본 항로)`,
    );
    assert.ok(
      STAR_SYSTEMS_FROM_CSV[b]?.connections.includes(a),
      `${b} -> ${a} 역방향도 1홉이어야 함(대칭)`,
    );
  }
});

test('4) omega_station↔draco_nebula는 정상 1홉 유지(BFS 최단 부산물이 아니라 실제 엣지 — 삭제 대상 아님)', () => {
  assert.ok(STAR_SYSTEMS_FROM_CSV.omega_station!.connections.includes('draco_nebula'));
  assert.ok(STAR_SYSTEMS_FROM_CSV.draco_nebula!.connections.includes('omega_station'));
});

test('5) STAR_SYSTEMS_FROM_CSV 전역 비대칭 0(모든 21성계)', () => {
  const asymmetric: string[] = [];
  for (const [id, sys] of Object.entries(STAR_SYSTEMS_FROM_CSV)) {
    for (const connId of sys.connections) {
      const other = STAR_SYSTEMS_FROM_CSV[connId];
      if (!other || !other.connections.includes(id)) {
        asymmetric.push(`${id}->${connId}`);
      }
    }
  }
  assert.deepEqual(asymmetric, []);
});

test('6) 플레이 성계↔플레이 성계 엣지 — 이동(GALAXY_SYSTEMS_PRECOMPUTED)과 분쟁/보급(STAR_SYSTEMS_FROM_CSV)이 동일(drop/extra=0)', () => {
  const dropped: string[] = [];
  const extra: string[] = [];
  for (const id of GAMEPLAY_SYSTEM_IDS) {
    const csvConns = new Set(STAR_SYSTEMS_FROM_CSV[id]?.connections ?? []);
    const mapConns = new Set(
      (GALAXY_SYSTEMS_PRECOMPUTED[id]?.connections ?? []).filter((c) => GAMEPLAY_SYSTEM_IDS.has(c)),
    );
    for (const c of csvConns) {
      if (!mapConns.has(c)) dropped.push(`${id}->${c}`);
    }
    for (const c of mapConns) {
      if (!csvConns.has(c)) extra.push(`${id}->${c}`);
    }
  }
  assert.deepEqual(dropped, [], `지도에서 사라진 CSV 플레이↔플레이 엣지가 없어야 함: ${dropped.join(',')}`);
  assert.deepEqual(extra, [], `CSV에 없는 플레이↔플레이 엣지가 지도에 생기면 안 됨: ${extra.join(',')}`);
});

test('7) star_system_connections.csv 파생 규칙 — 21개 플레이 성계 전량 star 행 보유(부분 3성계 회귀 방지, 빌드 함정)', () => {
  // build-content-from-csv.mjs: star_system_connections.csv에 행이 있으면 planets pipe를 완전히 무시하므로
  // 부분 기재 시 나머지 성계는 pipe와 어긋난 채 방치된다 — csvSystems.ts가 실제 CSV pipe 전량과 일치하는지 확인.
  assert.equal(Object.keys(STAR_SYSTEMS_FROM_CSV).length, GAMEPLAY_SYSTEM_IDS.size);
});

console.log('[systemNodeGraphRegression] all tests passed');
