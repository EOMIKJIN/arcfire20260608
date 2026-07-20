// ============================================================
// 행성 총사령관 런타임 배정 — ArcCore 영토 상태 (계정 purge 제외)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  pickGovernorReserveCommanderAtIndex,
  type GovernorOccupationSide,
} from './planetGovernorReservePool';

const STORAGE_KEY = 'arcfire_planet_governor_assignments_v1';
const PERSIST_COALESCE_MS = 1500;

export type PlanetGovernorAssignment = {
  captainId: string;
  occupationSide: GovernorOccupationSide;
  assignedAtMs: number;
};

/**
 * 성계(행성) 상주 총사령관 슬롯 — RED/BLUE 각 1명 영구 배정 (대표님 결정 2026-07-19).
 * 최초 분쟁·점령 시점에 reserve 풀에서 할당되며, 점령이 바뀌어도 슬롯은 유지되어
 * 같은 두 함장이 그 성계의 공격자/방어자를 교대로 맡는다(함장 사망 개념 없음).
 */
type PlanetGovernorSideSlots = Partial<Record<'BLUE' | 'RED', string>>;

type Persisted = {
  byPlanetId: Record<string, PlanetGovernorAssignment>;
  sideNextIndex: Record<GovernorOccupationSide, number>;
  sideSlotsByPlanetId: Record<string, PlanetGovernorSideSlots>;
};

const EMPTY_SIDE_INDEX: Record<GovernorOccupationSide, number> = {
  BLUE: 0,
  RED: 0,
  NEUTRAL: 0,
};

let mem: Persisted = {
  byPlanetId: {},
  sideNextIndex: { ...EMPTY_SIDE_INDEX },
  sideSlotsByPlanetId: {},
};
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem)).catch(() => {
      /* ignore */
    });
  }, PERSIST_COALESCE_MS);
}

export async function hydratePlanetGovernorAssignmentStore(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      mem = {
        byPlanetId:
          parsed.byPlanetId && typeof parsed.byPlanetId === 'object'
            ? parsed.byPlanetId
            : {},
        sideNextIndex: {
          ...EMPTY_SIDE_INDEX,
          ...(parsed.sideNextIndex && typeof parsed.sideNextIndex === 'object'
            ? parsed.sideNextIndex
            : {}),
        },
        sideSlotsByPlanetId:
          parsed.sideSlotsByPlanetId && typeof parsed.sideSlotsByPlanetId === 'object'
            ? parsed.sideSlotsByPlanetId
            : {},
      };
      // 마이그레이션: 기존 단일 배정을 해당 진영 슬롯으로 승격 (v1 → 슬롯 도입)
      let migrated = false;
      for (const [planetId, assignment] of Object.entries(mem.byPlanetId)) {
        const side = assignment.occupationSide;
        if (side !== 'BLUE' && side !== 'RED') continue;
        const slots = mem.sideSlotsByPlanetId[planetId];
        if (slots?.[side]) continue;
        mem.sideSlotsByPlanetId = {
          ...mem.sideSlotsByPlanetId,
          [planetId]: { ...slots, [side]: assignment.captainId },
        };
        migrated = true;
      }
      if (migrated) schedulePersist();
      dedupeNeutralGovernorAssignments();
    }
  } catch {
    /* ignore */
  } finally {
    hydrated = true;
  }
}

export function isPlanetGovernorAssignmentStoreHydrated(): boolean {
  return hydrated;
}

export function getPlanetGovernorAssignment(planetId: string): PlanetGovernorAssignment | null {
  return mem.byPlanetId[planetId] ?? null;
}

/** 총사령관 reserve captainId → 주둔 planetId (primary presence · 전역 배타) */
export function listGovernorCaptainPrimaryPlanets(): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  for (const [planetId, assignment] of Object.entries(mem.byPlanetId)) {
    const captainId = String(assignment.captainId ?? '').trim();
    if (!captainId) continue;
    out.set(captainId, planetId);
  }
  return out;
}

/**
 * 성계 진영 슬롯 총사령관 확보 — 이미 배정돼 있으면 그대로, 없으면 reserve 풀에서
 * 최초 1회 배정 후 영구 유지. (분쟁지역 공격/방어 총사령관 판정의 정본 조회 경로)
 */
export function ensurePlanetGovernorSideSlotCaptain(
  planetId: string,
  side: 'BLUE' | 'RED',
): string | null {
  const existing = mem.sideSlotsByPlanetId[planetId]?.[side];
  if (existing) return existing;

  const index = mem.sideNextIndex[side] ?? 0;
  const reserve = pickGovernorReserveCommanderAtIndex(side, index);
  if (!reserve) return null;

  mem = {
    ...mem,
    sideNextIndex: { ...mem.sideNextIndex, [side]: index + 1 },
    sideSlotsByPlanetId: {
      ...mem.sideSlotsByPlanetId,
      [planetId]: { ...mem.sideSlotsByPlanetId[planetId], [side]: reserve.captainId },
    },
  };
  schedulePersist();
  return reserve.captainId;
}

export function getPlanetGovernorSideSlotCaptain(
  planetId: string,
  side: 'BLUE' | 'RED',
): string | null {
  return mem.sideSlotsByPlanetId[planetId]?.[side] ?? null;
}

export function assignPlanetGovernorFromReserve(params: {
  planetId: string;
  occupationSide: GovernorOccupationSide;
}): PlanetGovernorAssignment | null {
  const { planetId, occupationSide } = params;

  // RED/BLUE는 성계 상주 슬롯 함장을 재사용 — 점령이 오가도 같은 함장이 복귀한다.
  if (occupationSide === 'BLUE' || occupationSide === 'RED') {
    const slotCaptainId = ensurePlanetGovernorSideSlotCaptain(planetId, occupationSide);
    if (!slotCaptainId) return null;
    const assignment: PlanetGovernorAssignment = {
      captainId: slotCaptainId,
      occupationSide,
      assignedAtMs: Date.now(),
    };
    mem = { ...mem, byPlanetId: { ...mem.byPlanetId, [planetId]: assignment } };
    schedulePersist();
    return assignment;
  }

  // NEUTRAL — 이미 이 행성에 중립 총사령관이 있으면 유지(반복 중립 선언 시 index 낭비 방지),
  // 신규 배정은 다른 행성에 임명되지 않은 함장만 고르는 **배타 배정**.
  // (round-robin wrap으로 태온 스틸이 여러 중립 행성에 중첩 임명되던 회귀 — 2026-07-19)
  const existing = mem.byPlanetId[planetId];
  if (existing && existing.occupationSide === occupationSide) {
    return existing;
  }
  const captainId = pickExclusiveNeutralReserveCaptainId(planetId);
  if (!captainId) return null;

  const assignment: PlanetGovernorAssignment = {
    captainId,
    occupationSide,
    assignedAtMs: Date.now(),
  };

  mem = { ...mem, byPlanetId: { ...mem.byPlanetId, [planetId]: assignment } };
  schedulePersist();
  return assignment;
}

/**
 * 중립 예비 풀에서 **다른 행성에 임명되지 않은** 함장을 sideNextIndex부터 순환 탐색.
 * 전원 사용 중이면(풀 5명 초과 중립 행성) 기존 round-robin으로 폴백 — 중첩 허용은 최후 수단.
 */
function pickExclusiveNeutralReserveCaptainId(planetId: string): string | null {
  const inUse = new Set<string>();
  for (const [assignedPlanetId, assignment] of Object.entries(mem.byPlanetId)) {
    if (assignedPlanetId === planetId) continue;
    const id = String(assignment.captainId ?? '').trim();
    if (id) inUse.add(id);
  }

  const startIndex = mem.sideNextIndex.NEUTRAL ?? 0;
  const firstPick = pickGovernorReserveCommanderAtIndex('NEUTRAL', startIndex);
  if (!firstPick) return null;

  // 풀 크기만큼만 순회 — pickGovernorReserveCommanderAtIndex가 내부에서 wrap 처리
  for (let offset = 0; offset < 64; offset++) {
    const candidate = pickGovernorReserveCommanderAtIndex('NEUTRAL', startIndex + offset);
    if (!candidate) return null;
    if (offset > 0 && candidate.captainId === firstPick.captainId) break; // 한 바퀴 순회 완료
    if (!inUse.has(candidate.captainId)) {
      mem = {
        ...mem,
        sideNextIndex: { ...mem.sideNextIndex, NEUTRAL: startIndex + offset + 1 },
      };
      return candidate.captainId;
    }
  }

  // 전원 사용 중 — round-robin 폴백
  mem = {
    ...mem,
    sideNextIndex: { ...mem.sideNextIndex, NEUTRAL: startIndex + 1 },
  };
  return firstPick.captainId;
}

/**
 * hydrate 시 1회 — 이미 persist된 중립 총사령관 중첩 임명을 해소한다.
 * 같은 함장이 여러 행성에 배정돼 있으면 가장 이른 배정만 남기고 나머지는
 * 배타 풀에서 재배정. (2026-07-19 태온 스틸 중첩 회귀 소급 정리)
 */
function dedupeNeutralGovernorAssignments(): void {
  const neutralEntries = Object.entries(mem.byPlanetId)
    .filter(([, a]) => a.occupationSide === 'NEUTRAL')
    .sort(([, a], [, b]) => a.assignedAtMs - b.assignedAtMs);

  const seen = new Set<string>();
  const duplicatePlanetIds: string[] = [];
  for (const [planetId, assignment] of neutralEntries) {
    const captainId = String(assignment.captainId ?? '').trim();
    if (captainId && !seen.has(captainId)) {
      seen.add(captainId);
      continue;
    }
    duplicatePlanetIds.push(planetId);
  }
  if (duplicatePlanetIds.length === 0) return;

  for (const planetId of duplicatePlanetIds) {
    const replacement = pickExclusiveNeutralReserveCaptainId(planetId);
    if (!replacement) continue;
    mem = {
      ...mem,
      byPlanetId: {
        ...mem.byPlanetId,
        [planetId]: {
          ...mem.byPlanetId[planetId],
          captainId: replacement,
          assignedAtMs: Date.now(),
        },
      },
    };
  }
  schedulePersist();
}
