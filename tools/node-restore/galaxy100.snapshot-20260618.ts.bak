import { StarSystem, ZoneType } from '../types';
import { STAR_SYSTEMS } from './systems';

export const GAMEPLAY_SYSTEM_IDS = new Set(Object.keys(STAR_SYSTEMS));
export const LEGACY_VISIBLE_TOTAL_SYSTEMS = 100;
export const EXPANSION_GATEWAYS_PER_DIRECTION = 4;

/** 은하 지도상 성계 중심 간 최소 거리(정규화 좌표, 대략 화면에서 노드·라벨이 겹치지 않게) */
const GALAXY_MIN_CENTER_DIST = 0.09;

export function parseSynthOrdinal(id: string): number | null {
  if (!id.startsWith('synth_')) return null;
  const n = Number.parseInt(id.slice('synth_'.length), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isExpansionGatewayOrdinal(
  ord: number,
  legacySynthCount: number,
  gatewaysPerDirection = EXPANSION_GATEWAYS_PER_DIRECTION,
): boolean {
  if (ord <= legacySynthCount) return false;
  const expansionIdx = ord - (legacySynthCount + 1);
  if (expansionIdx < 0) return false;
  const localInDirection = Math.floor(expansionIdx / 4);
  return localInDirection < gatewaysPerDirection;
}

function buildExpansionSpiderPositions(
  bases: StarSystem[],
  count: number,
  rand: () => number,
): { x: number; y: number }[] {
  const hub = centroid(bases.map((b) => b.position));
  const out: { x: number; y: number }[] = [];
  const placedByCluster: Array<Array<{ x: number; y: number }>> = [[], [], [], []];
  const clusterCenters = [
    { x: hub.x, y: hub.y - 1.62 }, // north
    { x: hub.x + 1.72, y: hub.y }, // east
    { x: hub.x, y: hub.y + 1.62 }, // south
    { x: hub.x - 1.72, y: hub.y }, // west
  ] as const;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const majorByCluster = [0.78, 0.84, 0.78, 0.84] as const;
  const minorByCluster = [0.72, 0.66, 0.72, 0.66] as const;
  const angleByCluster = [-0.1, 0.04, 0.1, -0.04] as const;
  // 중앙(legacy)과 같은 톤의 간격을 맞추기 위해 최소 간격을 동일 계열로 둔다.
  const clusterMinDist = GALAXY_MIN_CENTER_DIST * 0.92;
  const clusterMinDist2 = clusterMinDist * clusterMinDist;
  for (let i = 0; i < count; i += 1) {
    const cluster = i % 4;
    const local = Math.floor(i / 4);
    const c = clusterCenters[cluster];
    let placed: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 220 && !placed; attempt += 1) {
      const theta = (local * golden + attempt * 0.11 + rand() * 0.45) % (Math.PI * 2);
      const radius = Math.min(1, 0.18 + Math.sqrt(local + 1) * 0.058 + attempt * 0.0016);
      const ex = Math.cos(theta) * majorByCluster[cluster] * radius;
      const ey = Math.sin(theta) * minorByCluster[cluster] * radius;
      const rot = angleByCluster[cluster];
      const rx = ex * Math.cos(rot) - ey * Math.sin(rot);
      const ry = ex * Math.sin(rot) + ey * Math.cos(rot);
      const cand = {
        x: c.x + rx + (rand() - 0.5) * 0.016,
        y: c.y + ry + (rand() - 0.5) * 0.016,
      };
      let ok = true;
      for (const p of placedByCluster[cluster]!) {
        if (dist2(cand, p) < clusterMinDist2) {
          ok = false;
          break;
        }
      }
      if (ok) placed = cand;
    }
    if (!placed) {
      placed = {
        x: c.x + (rand() - 0.5) * majorByCluster[cluster] * 1.2,
        y: c.y + (rand() - 0.5) * minorByCluster[cluster] * 1.2,
      };
    }
    placedByCluster[cluster]!.push(placed);
    out.push(placed);
  }
  return out;
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function centroid(
  points: { x: number; y: number }[],
): { x: number; y: number } {
  if (!points.length) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function orient(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSeg(
  a: { x: number; y: number },
  b: { x: number; y: number },
  p: { x: number; y: number },
) {
  return (
    Math.min(a.x, b.x) - 1e-9 <= p.x &&
    p.x <= Math.max(a.x, b.x) + 1e-9 &&
    Math.min(a.y, b.y) - 1e-9 <= p.y &&
    p.y <= Math.max(a.y, b.y) + 1e-9
  );
}

function segmentsIntersect(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number },
) {
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);

  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) {
    return true;
  }
  if (Math.abs(o1) < 1e-9 && onSeg(a1, a2, b1)) return true;
  if (Math.abs(o2) < 1e-9 && onSeg(a1, a2, b2)) return true;
  if (Math.abs(o3) < 1e-9 && onSeg(b1, b2, a1)) return true;
  if (Math.abs(o4) < 1e-9 && onSeg(b1, b2, a2)) return true;
  return false;
}

/** 플레이 성계는 원래 좌표 근처를 유지, 합성은 자유 — 전 노드가 최소 간격을 갖도록 반복 보정 */
function relaxGalaxyMinDistance(
  systems: StarSystem[],
  baseOriginal: Map<string, { x: number; y: number }>,
  minDist: number,
  rand: () => number,
) {
  const minD = minDist;
  const REP = 0.52;
  const STEP = 0.1;
  const ANCHOR = 0.07;
  const ITERS = 200;

  for (let it = 0; it < ITERS; it++) {
    const forces = systems.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < systems.length; i++) {
      const pi = systems[i].position;
      const orig = baseOriginal.get(systems[i].id);
      if (orig) {
        forces[i].x += ANCHOR * (orig.x - pi.x);
        forces[i].y += ANCHOR * (orig.y - pi.y);
      }
      for (let j = 0; j < systems.length; j++) {
        if (i === j) continue;
        const pj = systems[j].position;
        let dx = pi.x - pj.x;
        let dy = pi.y - pj.y;
        let d = Math.hypot(dx, dy);
        if (d < 1e-9) {
          dx = (rand() - 0.5) * 1e-3;
          dy = (rand() - 0.5) * 1e-3;
          d = Math.hypot(dx, dy) || 1e-9;
        }
        if (d < minD) {
          const push = ((minD - d) / d) * REP;
          forces[i].x += push * dx;
          forces[i].y += push * dy;
        }
      }
    }
    for (let i = 0; i < systems.length; i++) {
      systems[i].position.x += forces[i].x * STEP;
      systems[i].position.y += forces[i].y * STEP;
    }
  }
}

/** 기존 성계와 합성 노드 모두로부터 minDist 이상 떨어진 위치에 합성 좌표를 쌓는다 */
function buildSynthPositionsMinGap(
  bases: StarSystem[],
  count: number,
  rand: () => number,
  minDist: number,
): { x: number; y: number }[] {
  const hub = centroid(bases.map((b) => b.position));
  const placed: { x: number; y: number }[] = bases.map((b) => ({ ...b.position }));
  const out: { x: number; y: number }[] = [];
  const minD2 = minDist * minDist * 0.999;
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    let found: { x: number; y: number } | null = null;
    for (let ring = 0; ring < 900 && !found; ring++) {
      const t = i + ring * 0.14;
      const r = 0.34 + Math.sqrt(t + 1) * 0.05 + ring * 0.0018;
      const ang = t * golden + rand() * 0.35;
      const p = {
        x: hub.x + Math.cos(ang) * r + (rand() - 0.5) * minDist * 0.22,
        y: hub.y + Math.sin(ang * 1.05) * r * 0.92 + (rand() - 0.5) * minDist * 0.22,
      };
      let ok = true;
      for (const q of placed) {
        if (dist2(p, q) < minD2) {
          ok = false;
          break;
        }
      }
      if (ok) found = p;
    }
    if (!found) {
      for (let extra = 0; extra < 500 && !found; extra++) {
        const ang = rand() * Math.PI * 2 + i + extra * 0.41;
        const r = 1.28 + i * 0.026 + extra * 0.011;
        const cand = {
          x: hub.x + Math.cos(ang) * r,
          y: hub.y + Math.sin(ang) * r * 0.95,
        };
        let ok = true;
        for (const q of placed) {
          if (dist2(cand, q) < minD2) {
            ok = false;
            break;
          }
        }
        if (ok) found = cand;
      }
    }
    if (!found) {
      const slot = i + placed.length * 0.13;
      found = {
        x: hub.x + Math.cos(slot) * (2.4 + slot * 0.04),
        y: hub.y + Math.sin(slot * 1.1) * (2.2 + slot * 0.035),
      };
    }
    placed.push(found);
    out.push(found);
  }
  return out;
}

function uniq(ids: string[]) {
  return Array.from(new Set(ids));
}

/**
 * 전체 구조에서 최소 거리 규칙을 최종 강제한다.
 * - 실제 플레이 성계(bases)는 우선 보존
 * - 규칙을 깨는 합성 노드(synth)는 제거(총 개수는 정확히 맞출 필요 없음)
 */
function pruneSynthByMinDistance(
  bases: StarSystem[],
  synths: StarSystem[],
  minDist: number,
) {
  const minD2 = minDist * minDist;
  const kept: StarSystem[] = [...bases];
  const keptSynths: StarSystem[] = [];

  for (const s of synths) {
    let ok = true;
    for (const k of kept) {
      if (dist2(s.position, k.position) < minD2) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    kept.push(s);
    keptSynths.push(s);
  }

  return keptSynths;
}

/** 무방향 간선 키 (id에 '|'가 없다는 전제) */
function edgePairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * 은하 지도용: 각 성계 노드의 연결(차수)을 maxDegree 이하로 자른다.
 * 플레이 성계 간 간선(tier 0)을 거리순으로 먼저 채운 뒤, 플레이 부분그래프가 단절이면 가장 짧은 가교를 추가한다.
 */
function capSystemGraphMaxDegree(
  byId: Record<string, StarSystem>,
  gameplayIds: Set<string>,
  maxDegree: number,
) {
  const ids = Object.keys(byId);
  const deg: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));

  type Scored = { a: string; b: string; d2: number; tier: number };
  const scored: Scored[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const posA = byId[id].position;
    for (const c of byId[id].connections) {
      if (!byId[c]) continue;
      const k = edgePairKey(id, c);
      if (seen.has(k)) continue;
      seen.add(k);
      const aGp = gameplayIds.has(id);
      const bGp = gameplayIds.has(c);
      const tier = aGp && bGp ? 0 : aGp !== bGp ? 1 : 2;
      scored.push({ a: id, b: c, d2: dist2(posA, byId[c].position), tier });
    }
  }

  scored.sort((u, v) => (u.tier !== v.tier ? u.tier - v.tier : u.d2 - v.d2));

  const keep = new Set<string>();
  const keptEdges: Array<{ a: string; b: string }> = [];

  function crossesExisting(a: string, b: string) {
    const a1 = byId[a].position;
    const a2 = byId[b].position;
    for (const e of keptEdges) {
      if (e.a === a || e.a === b || e.b === a || e.b === b) continue; // 공통 정점은 허용
      const b1 = byId[e.a].position;
      const b2 = byId[e.b].position;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
    return false;
  }

  for (const e of scored) {
    if (deg[e.a] >= maxDegree || deg[e.b] >= maxDegree) continue;
    if (crossesExisting(e.a, e.b)) continue;
    keep.add(edgePairKey(e.a, e.b));
    keptEdges.push({ a: e.a, b: e.b });
    deg[e.a]++;
    deg[e.b]++;
  }

  function gpNeighborsInKeep(start: string): string[] {
    const out: string[] = [];
    for (const k of keep) {
      const [x, y] = k.split('|');
      if (x === start && gameplayIds.has(y)) out.push(y);
      else if (y === start && gameplayIds.has(x)) out.push(x);
    }
    return out;
  }

  function gpComponentFromKeep(seed: string): Set<string> {
    const out = new Set<string>();
    const q = [seed];
    out.add(seed);
    while (q.length) {
      const x = q.pop()!;
      for (const n of gpNeighborsInKeep(x)) {
        if (out.has(n)) continue;
        out.add(n);
        q.push(n);
      }
    }
    return out;
  }

  const gpList = ids.filter((id) => gameplayIds.has(id));
  if (gpList.length) {
    let comp = gpComponentFromKeep(gpList[0]);
    while (comp.size < gpList.length) {
      const outside = gpList.filter((id) => !comp.has(id));
      type Bridge = { a: string; b: string; d2: number };
      let best: Bridge | null = null;
      for (const a of comp) {
        const posA = byId[a].position;
        for (const b of outside) {
          const k = edgePairKey(a, b);
          if (keep.has(k)) continue;
          const d2 = dist2(posA, byId[b].position);
          if (!best || d2 < best.d2) best = { a, b, d2 };
        }
      }
      if (!best) break;
      if (deg[best.a] >= maxDegree || deg[best.b] >= maxDegree) break;
      if (crossesExisting(best.a, best.b)) {
        const bridgeCandidates: Bridge[] = [];
        for (const a of comp) {
          const posA = byId[a].position;
          for (const b of outside) {
            const k = edgePairKey(a, b);
            if (keep.has(k)) continue;
            bridgeCandidates.push({ a, b, d2: dist2(posA, byId[b].position) });
          }
        }
        bridgeCandidates.sort((u, v) => u.d2 - v.d2);
        best = bridgeCandidates.find((c) =>
          deg[c.a] < maxDegree &&
          deg[c.b] < maxDegree &&
          !crossesExisting(c.a, c.b),
        ) ?? null;
        if (!best) break;
      }
      keep.add(edgePairKey(best.a, best.b));
      keptEdges.push({ a: best.a, b: best.b });
      deg[best.a]++;
      deg[best.b]++;
      comp = gpComponentFromKeep(gpList[0]);
    }
  }

  for (const id of ids) {
    byId[id].connections = [];
  }
  for (const k of keep) {
    const [a, b] = k.split('|');
    byId[a].connections.push(b);
    byId[b].connections.push(a);
  }
}

function pickNearestIds(
  selfPos: { x: number; y: number },
  candidates: { id: string; position: { x: number; y: number } }[],
  k: number,
  excludeId?: string,
) {
  const scored = candidates
    .filter((c) => c.id !== excludeId)
    .map((c) => ({ id: c.id, d2: dist2(selfPos, c.position) }))
    .sort((a, b) => a.d2 - b.d2);
  return scored.slice(0, k).map((s) => s.id);
}

/**
 * 기존 구현된 성계(현재 `STAR_SYSTEMS`)는 그대로 두고,
 * 은하계 지도 표현용으로만 100개 노드 규모의 “잠금 거미줄”을 합성한다.
 *
 * - 모든 성계 중심은 `GALAXY_MIN_CENTER_DIST` 이상 떨어지도록 배치·완화한다(원본 좌표는 mutate 하지 않음).
 * - 은하 지도/월드스토어 그래프는 성계당 최대 3연결로 캡된다(렌더·이동 후보는 `GALAXY_SYSTEMS` 기준).
 * - 합성 노드는 `id`가 `synth_`로 시작하며, `GAMEPLAY_SYSTEM_IDS`에 포함되지 않는다.
 */
export function buildGalaxySystems100(): Record<string, StarSystem> {
  // 중요: 원본 `STAR_SYSTEMS` 객체/connections 배열을 절대 mutate 하지 않는다.
  const bases: StarSystem[] = Object.values(STAR_SYSTEMS).map((s) => ({
    ...s,
    connections: [...s.connections],
    planets: s.planets.map((p) => ({ ...p })),
  }));

  const TARGET_TOTAL = 760;
  const synthCount = Math.max(0, TARGET_TOTAL - bases.length);
  const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - bases.length);
  const expansionSynthCount = Math.max(0, synthCount - legacySynthCount);
  const rand = mulberry32(20260415);
  const hub = centroid(bases.map((b) => b.position));
  const baseOriginal = new Map<string, { x: number; y: number }>();
  for (const b of bases) baseOriginal.set(b.id, { ...b.position });
  const legacyCoords = buildSynthPositionsMinGap(bases, legacySynthCount, rand, GALAXY_MIN_CENTER_DIST);
  const expansionCoords = buildExpansionSpiderPositions(bases, expansionSynthCount, rand);
  const synthCoords = [...legacyCoords, ...expansionCoords];
  const synths: StarSystem[] = synthCoords.map((pos, i) => {
    const idx = i + 1;
    const zone: ZoneType = 'neutral';
    // 기존 저장 데이터(synth_001 등)와 호환되도록 최소 3자리 패딩을 유지한다.
    const id = `synth_${String(idx).padStart(3, '0')}`;
    return {
      id,
      name: idx <= legacySynthCount ? `미개척-${idx}` : `미발견-${idx}`,
      position: { ...pos },
      zone,
      connections: [],
      enemyLevel: 1,
      description: idx <= legacySynthCount
        ? '아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.'
        : '아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.',
      planets: [{
        id: `${id}_p`,
        systemId: id,
        name: '미상 행성',
        description: '탐사 불가 구역.',
        hasTradePort: false,
        hasShipyard: false,
        hasTavern: false,
        tradeGoods: [],
        factionId: 'unknown',
        coreResource: 50,
        corePopulation: 50,
        coreDefense: 50,
        coreTechnology: 50,
        coreEnvironment: 50,
      }],
    };
  });

  const all = [...bases, ...synths];
  relaxGalaxyMinDistance(all, baseOriginal, GALAXY_MIN_CENTER_DIST, rand);
  const connectedSynths = synths;
  const legacySynths = connectedSynths.filter((s) => {
    const ord = parseSynthOrdinal(s.id);
    return ord !== null && ord <= legacySynthCount;
  });
  const expansionSynths = connectedSynths.filter((s) => {
    const ord = parseSynthOrdinal(s.id);
    return ord !== null && ord > legacySynthCount;
  });

  const workingById: Record<string, StarSystem> = {};
  for (const s of [...bases, ...connectedSynths]) {
    workingById[s.id] = s;
  }

  const directionOf = (p: { x: number; y: number }): 'north' | 'east' | 'south' | 'west' => {
    const dx = p.x - hub.x;
    const dy = p.y - hub.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
    return dy >= 0 ? 'south' : 'north';
  };

  // 1) 기존 미개척(legacy) 성계끼리 근접 거미줄 연결
  const legacySynthPositions = legacySynths.map((s) => ({ id: s.id, position: s.position }));
  for (const s of legacySynths) {
    const neigh = pickNearestIds(s.position, legacySynthPositions, 4, s.id);
    s.connections.push(...neigh);
  }

  // 2) 기존 미개척(legacy) ↔ 기존 성계 근접 브리지
  const basePositions = bases.map((b) => ({ id: b.id, position: b.position }));
  for (const s of legacySynths) {
    const bridges = pickNearestIds(s.position, basePositions, 2, s.id);
    s.connections.push(...bridges);
  }

  // 3) 기존 성계에서도 최근접 legacy 1개를 연결(양방향 접속 안정)
  for (const b of bases) {
    const nearestSynth = pickNearestIds(b.position, legacySynthPositions, 1, b.id)[0];
    if (nearestSynth) b.connections.push(nearestSynth);
  }

  // 4) 확장 미발견 성계는 4개 타원 클러스터 내부 중심 연결만 우선
  const expansionByDir: Record<'north' | 'east' | 'south' | 'west', StarSystem[]> = {
    north: [],
    east: [],
    south: [],
    west: [],
  };
  for (const s of expansionSynths) expansionByDir[directionOf(s.position)].push(s);
  for (const dir of Object.keys(expansionByDir) as Array<'north' | 'east' | 'south' | 'west'>) {
    const bucket = expansionByDir[dir];
    const bucketPos = bucket.map((s) => ({ id: s.id, position: s.position }));
    for (const s of bucket) {
      const neigh = pickNearestIds(s.position, bucketPos, 4, s.id);
      s.connections.push(...neigh);
    }
  }

  // 5) 동/서/남/북 관문 연결: 각 방향에서 2개 관문만 중심권(기존/legacy)에 연결
  const sectors: Array<{ key: 'north' | 'south' | 'east' | 'west'; dir: { x: number; y: number } }> = [
    { key: 'north', dir: { x: 0, y: -1 } },
    { key: 'east', dir: { x: 1, y: 0 } },
    { key: 'south', dir: { x: 0, y: 1 } },
    { key: 'west', dir: { x: -1, y: 0 } },
  ];
  function scoreAlongDir(p: { x: number; y: number }, d: { x: number; y: number }) {
    const dx = p.x - hub.x;
    const dy = p.y - hub.y;
    return dx * d.x + dy * d.y;
  }
  for (const sec of sectors) {
    const synthReps = expansionByDir[sec.key]
      .map((s) => ({ id: s.id, sc: scoreAlongDir(s.position, sec.dir) }))
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 2);
    const baseRep = bases
      .map((s) => ({ id: s.id, sc: scoreAlongDir(s.position, sec.dir) }))
      .sort((a, b) => b.sc - a.sc)[0];
    const legacyRep = legacySynths
      .map((s) => ({ id: s.id, sc: scoreAlongDir(s.position, sec.dir) }))
      .sort((a, b) => b.sc - a.sc)[0];
    if (!baseRep) continue;
    for (const gate of synthReps) {
      workingById[gate.id]!.connections.push(baseRep.id);
      workingById[baseRep.id]!.connections.push(gate.id);
      if (legacyRep) {
        workingById[gate.id]!.connections.push(legacyRep.id);
        workingById[legacyRep.id]!.connections.push(gate.id);
      }
    }
  }

  // 정리: connections uniq + 대칭 보장(렌더링/탐색 안정)
  const byId: Record<string, StarSystem> = {};
  for (const s of [...bases, ...connectedSynths]) {
    byId[s.id] = { ...s, connections: uniq(s.connections) };
  }
  for (const s of Object.values(byId)) {
    for (const c of s.connections) {
      if (!byId[c]) continue;
      if (!byId[c].connections.includes(s.id)) {
        byId[c].connections.push(s.id);
      }
    }
  }
  // 최종 정리: 존재하지 않는 링크 제거 + 중복 제거
  for (const s of Object.values(byId)) {
    s.connections = uniq(s.connections.filter((c) => byId[c]));
  }

  capSystemGraphMaxDegree(byId, GAMEPLAY_SYSTEM_IDS, 3);

  return { ...byId };
}

export const GALAXY_SYSTEMS: Record<string, StarSystem> = buildGalaxySystems100();
