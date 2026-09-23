// ============================================================
// planet_dwell_role.csv + captain_dwell_role_assignment.csv
// 함장 행 대량 생성 금지 — __default__ / aiRole 센티널만
// ============================================================

import {
  CaptainDwellRoleAssignment_FROM_BALANCE_CSV,
  PlanetDwellRole_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import type { NpcAiRole, NpcCaptain } from '../../types';
import { DWELL_ROLE_IDS, type DwellRoleDef, type DwellRoleId } from './planetDwellTypes';

const FALLBACK_ROLES: Record<DwellRoleId, DwellRoleDef> = {
  colonizer: {
    roleId: 'colonizer',
    frontierPreferred: true,
    civilianBannedOnFrontierPhase1: false,
    wResource: -0.08,
    wPopulation: 0.18,
    wDefense: 0.12,
    wTechnology: 0.1,
    wEnvironment: -0.1,
  },
  survey: {
    roleId: 'survey',
    frontierPreferred: true,
    civilianBannedOnFrontierPhase1: false,
    wResource: 0,
    wPopulation: 0,
    wDefense: 0,
    wTechnology: 0.28,
    wEnvironment: 0,
  },
  civilian_consumer: {
    roleId: 'civilian_consumer',
    frontierPreferred: false,
    civilianBannedOnFrontierPhase1: true,
    wResource: -0.32,
    wPopulation: 0.28,
    wDefense: 0,
    wTechnology: 0.08,
    wEnvironment: -0.24,
  },
  cultural: {
    roleId: 'cultural',
    frontierPreferred: false,
    civilianBannedOnFrontierPhase1: true,
    wResource: 0,
    wPopulation: 0.12,
    wDefense: 0,
    wTechnology: 0.22,
    wEnvironment: -0.08,
  },
  information: {
    roleId: 'information',
    frontierPreferred: false,
    civilianBannedOnFrontierPhase1: true,
    wResource: 0,
    wPopulation: 0.1,
    wDefense: 0,
    wTechnology: 0.36,
    wEnvironment: -0.06,
  },
};

function parseBool(raw: unknown): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function parseNum(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function asRoleId(raw: string): DwellRoleId | null {
  return (DWELL_ROLE_IDS as readonly string[]).includes(raw) ? (raw as DwellRoleId) : null;
}

let roleCache: Map<DwellRoleId, DwellRoleDef> | null = null;
let assignCache: Map<string, DwellRoleId> | null = null;

function getRoleIndex(): Map<DwellRoleId, DwellRoleDef> {
  if (roleCache) return roleCache;
  const map = new Map<DwellRoleId, DwellRoleDef>();
  for (const id of DWELL_ROLE_IDS) map.set(id, FALLBACK_ROLES[id]);
  for (const row of PlanetDwellRole_FROM_BALANCE_CSV) {
    const roleId = asRoleId(String(row.roleId ?? '').trim());
    if (!roleId) continue;
    const fb = FALLBACK_ROLES[roleId];
    map.set(roleId, {
      roleId,
      frontierPreferred: parseBool(row.frontierPreferred),
      civilianBannedOnFrontierPhase1: parseBool(row.civilianBannedOnFrontierPhase1),
      wResource: parseNum(row.wResource, fb.wResource),
      wPopulation: parseNum(row.wPopulation, fb.wPopulation),
      wDefense: parseNum(row.wDefense, fb.wDefense),
      wTechnology: parseNum(row.wTechnology, fb.wTechnology),
      wEnvironment: parseNum(row.wEnvironment, fb.wEnvironment),
    });
  }
  roleCache = map;
  return map;
}

function getAssignmentIndex(): Map<string, DwellRoleId> {
  if (assignCache) return assignCache;
  const map = new Map<string, DwellRoleId>();
  for (const row of CaptainDwellRoleAssignment_FROM_BALANCE_CSV) {
    const captainId = String(row.captainId ?? '').trim();
    const roleId = asRoleId(String(row.roleId ?? '').trim());
    if (!captainId || !roleId) continue;
    map.set(captainId, roleId);
  }
  assignCache = map;
  return map;
}

export function getDwellRoleDef(roleId: DwellRoleId): DwellRoleDef {
  return getRoleIndex().get(roleId) ?? FALLBACK_ROLES[roleId];
}

function roleFromAiSentinel(aiRole: NpcAiRole | string | null | undefined): DwellRoleId | null {
  const key = `__${String(aiRole ?? '').trim()}__`;
  return getAssignmentIndex().get(key) ?? null;
}

/**
 * 함장 → 시민 역할. 개별 CSV 행이 있으면 최우선.
 * 없으면 aiRole 센티널 → 프론티어는 survey, 코어는 __default__.
 */
export function resolveCaptainDwellRole(
  captain: Pick<NpcCaptain, 'id' | 'aiRole'>,
  options?: { frontierEarly?: boolean },
): DwellRoleId {
  const assign = getAssignmentIndex();
  const exact = assign.get(String(captain.id ?? '').trim());
  if (exact) return exact;

  const fromAi = roleFromAiSentinel(captain.aiRole);
  if (options?.frontierEarly) {
    if (fromAi === 'colonizer' || fromAi === 'survey') return fromAi;
    return assign.get('__frontier__') ?? 'survey';
  }
  return fromAi ?? assign.get('__default__') ?? 'civilian_consumer';
}

export function isCivilianDwellRole(roleId: DwellRoleId): boolean {
  return roleId === 'civilian_consumer' || roleId === 'cultural' || roleId === 'information';
}
