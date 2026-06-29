// ============================================================
// 스파이 함장 — 역할·테러 프로필 결정론 할당
// ============================================================

import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';
import { resolveArcCoreSpyPolicy } from './arcCoreSpyPolicy';
import type { ArcCoreSpyRoleId } from './arcCoreSpyRolePolicy';
import { getArcCoreSpyRoleRow } from './arcCoreSpyRolePolicy';
import type { ArcCoreSpyTerrorProfileRow } from './arcCoreSpyTerrorProfilePolicy';
import { listArcCoreSpyTerrorProfilesForRole } from './arcCoreSpyTerrorProfilePolicy';

export type ArcCoreSpyCaptainAssignment = {
  captainId: string;
  roleId: ArcCoreSpyRoleId;
  profileId: string;
  profile: ArcCoreSpyTerrorProfileRow;
};

const assignmentCache = new Map<string, ArcCoreSpyCaptainAssignment>();

function pickWeightedProfile(
  captainId: string,
  roleId: ArcCoreSpyRoleId,
  profiles: readonly ArcCoreSpyTerrorProfileRow[],
): ArcCoreSpyTerrorProfileRow {
  if (profiles.length === 0) {
    const role = getArcCoreSpyRoleRow(roleId);
    return {
      profileId: `${roleId}_fallback`,
      roleId,
      enabled: true,
      weightPct: 100,
      intelNotifyWeight: 1,
      backdoorPulseMul: role?.backdoorTechPulseMul ?? 1,
      droneGuidanceAccuracyPct: role?.droneGuidanceAccuracyPct ?? 0,
      droneStrikeDamageMul: role?.droneStrikeDamageMul ?? 1,
      droneLeakBoostPct: role?.droneLeakBoostPct ?? 0,
      labelKo: roleId,
    };
  }
  if (profiles.length === 1) return profiles[0]!;

  let total = 0;
  for (let i = 0; i < profiles.length; i += 1) {
    total += profiles[i]!.weightPct;
  }
  const roll = npcDeterministicHash32(`arcCoreSpyProfile:v1:${captainId}:${roleId}`) % Math.max(1, total);
  let acc = 0;
  for (let i = 0; i < profiles.length; i += 1) {
    acc += profiles[i]!.weightPct;
    if (roll < acc) return profiles[i]!;
  }
  return profiles[profiles.length - 1]!;
}

export function resolveArcCoreSpyRoleForCaptain(captainId: string): ArcCoreSpyRoleId {
  const id = String(captainId ?? '').trim();
  const policy = resolveArcCoreSpyPolicy();
  const droneFrac = Math.max(0, Math.min(100, policy.spyDroneRoleFractionPct));
  const roll = npcDeterministicHash32(`arcCoreSpyRole:v1:${id}`) % 100;
  return roll < droneFrac ? 'drone_guidance_specialist' : 'backdoor_tech_terror';
}

export function resolveArcCoreSpyCaptainAssignment(captainId: string): ArcCoreSpyCaptainAssignment {
  const id = String(captainId ?? '').trim();
  const cached = assignmentCache.get(id);
  if (cached) return cached;

  const roleId = resolveArcCoreSpyRoleForCaptain(id);
  const profile = pickWeightedProfile(id, roleId, listArcCoreSpyTerrorProfilesForRole(roleId));
  const assignment: ArcCoreSpyCaptainAssignment = {
    captainId: id,
    roleId,
    profileId: profile.profileId,
    profile,
  };
  assignmentCache.set(id, assignment);
  return assignment;
}

export function invalidateArcCoreSpyCaptainAssignmentCache(): void {
  assignmentCache.clear();
}
