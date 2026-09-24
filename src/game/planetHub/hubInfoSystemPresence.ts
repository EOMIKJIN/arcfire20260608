/**
 * 허브 INFO 성계 체류 판정 — 순수. overlay/RN 없음.
 */

export type HubInfoPresenceHint = {
  presenceActivity?: string | null;
  presencePlanetId?: string | null;
  presenceSystemId?: string | null;
  basePlanetId?: string | null;
  activityPlanetIds?: readonly string[];
  barPlanetIds?: readonly string[];
};

export function isCaptainHintPresentInHubSystem(
  hubPlanetId: string,
  hubSystemId: string | null,
  hint: HubInfoPresenceHint,
  systemOfPlanet: (planetId: string) => string | null,
): boolean {
  const hubPlanet = String(hubPlanetId ?? '').trim();
  const hubSys = String(hubSystemId ?? '').trim() || (hubPlanet ? systemOfPlanet(hubPlanet) : null);
  if (!hubPlanet || !hubSys) return false;

  const activity = String(hint.presenceActivity ?? 'off_world').trim() || 'off_world';
  if (activity !== 'off_world') {
    if (String(hint.presenceSystemId ?? '').trim() === hubSys) return true;
    const at = String(hint.presencePlanetId ?? '').trim();
    if (at && (at === hubPlanet || systemOfPlanet(at) === hubSys)) return true;
    return false;
  }

  const home = String(hint.basePlanetId ?? '').trim();
  if (home && (home === hubPlanet || systemOfPlanet(home) === hubSys)) return true;
  const activityPlanets = hint.activityPlanetIds ?? [];
  for (let i = 0; i < activityPlanets.length; i += 1) {
    const at = String(activityPlanets[i] ?? '').trim();
    if (at && (at === hubPlanet || systemOfPlanet(at) === hubSys)) return true;
  }
  const bars = hint.barPlanetIds ?? [];
  for (let i = 0; i < bars.length; i += 1) {
    const bar = String(bars[i] ?? '').trim();
    if (bar && (bar === hubPlanet || systemOfPlanet(bar) === hubSys)) return true;
  }
  return false;
}

export function applyQuestInfoMarkFlagsToRows<
  T extends {
    captainId?: string;
    pinKind?: string;
    hasMainQuest?: boolean;
    hasSubQuest?: boolean;
    showQuestMarks?: boolean;
  },
>(
  rows: T[],
  opts: {
    assignedQuestIds: ReadonlySet<string>;
    mainQuestIds: ReadonlySet<string>;
    subQuestIds: ReadonlySet<string>;
    configuredQuestIds: ReadonlySet<string>;
  },
): T[] {
  if (rows.length === 0) return rows;
  let changed = false;
  const next = new Array<T>(rows.length);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    const captainId = String(row.captainId ?? '').trim();
    const hasMainQuest = !!captainId && opts.mainQuestIds.has(captainId);
    const hasSubQuest = !!captainId && opts.subQuestIds.has(captainId);
    const showQuestMarks =
      hasMainQuest
      || hasSubQuest
      || row.pinKind === 'quest'
      || (!!captainId
        && (opts.assignedQuestIds.has(captainId) || opts.configuredQuestIds.has(captainId)));
    if (
      row.hasMainQuest === hasMainQuest
      && row.hasSubQuest === hasSubQuest
      && row.showQuestMarks === showQuestMarks
    ) {
      next[i] = row;
      continue;
    }
    changed = true;
    next[i] = { ...row, hasMainQuest, hasSubQuest, showQuestMarks };
  }
  return changed ? next : rows;
}

/** @deprecated `applyQuestInfoMarkFlagsToRows` */
export function applyMainQuestFlagsToRows<T extends { captainId?: string; hasMainQuest?: boolean }>(
  rows: T[],
  mainQuestCaptainIds: ReadonlySet<string>,
): T[] {
  return applyQuestInfoMarkFlagsToRows(rows, {
    assignedQuestIds: mainQuestCaptainIds,
    mainQuestIds: mainQuestCaptainIds,
    subQuestIds: new Set<string>(),
    configuredQuestIds: mainQuestCaptainIds,
  });
}
