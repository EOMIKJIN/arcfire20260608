/** 함장 개인미션 — `cp_*` 템플릿 → `arc_cpt_{captainId}_{seq}` */

export const CAPTAIN_PERSONAL_TEMPLATE_PREFIX = 'cp_';
export const CAPTAIN_PERSONAL_MISSION_ID_PREFIX = 'arc_cpt_';
export const CAPTAIN_PERSONAL_ACTIVE_ACCOUNT_MAX = 3;
export const CAPTAIN_PERSONAL_DECLINE_COOLDOWN_DAYS = 1;

export function isCaptainPersonalTemplateId(missionId: string): boolean {
  return missionId.startsWith(CAPTAIN_PERSONAL_TEMPLATE_PREFIX);
}

export function isCaptainPersonalMissionId(missionId: string): boolean {
  return missionId.startsWith(CAPTAIN_PERSONAL_MISSION_ID_PREFIX);
}

export function parseCaptainPersonalMissionId(
  missionId: string,
): { captainId: string; seq: number } | null {
  if (!isCaptainPersonalMissionId(missionId)) return null;
  const rest = missionId.slice(CAPTAIN_PERSONAL_MISSION_ID_PREFIX.length);
  const cut = rest.lastIndexOf('_');
  if (cut <= 0) return null;
  const captainId = rest.slice(0, cut).trim();
  const seq = Math.floor(Number(rest.slice(cut + 1)));
  if (!captainId || !Number.isFinite(seq) || seq < 1) return null;
  return { captainId, seq };
}

export function buildCaptainPersonalMissionId(captainId: string, seq: number): string {
  const id = captainId.trim();
  const n = Math.max(1, Math.floor(seq));
  return `${CAPTAIN_PERSONAL_MISSION_ID_PREFIX}${id}_${String(n).padStart(2, '0')}`;
}

export function allocateCaptainPersonalMissionId(
  captainId: string,
  usedIds: ReadonlySet<string>,
): string {
  let seq = 1;
  let id = buildCaptainPersonalMissionId(captainId, seq);
  while (usedIds.has(id)) {
    seq += 1;
    id = buildCaptainPersonalMissionId(captainId, seq);
  }
  return id;
}

export function countActiveCaptainPersonalMissions(
  progresses: Readonly<Record<string, { status?: string; missionId?: string }>>,
  captainId?: string,
): number {
  const want = captainId?.trim() ?? '';
  let count = 0;
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const row = progresses[ids[i]!]!;
    if (row.status !== 'active') continue;
    const missionId = String(row.missionId ?? ids[i] ?? '').trim();
    if (!isCaptainPersonalMissionId(missionId)) continue;
    if (want) {
      const parsed = parseCaptainPersonalMissionId(missionId);
      if (!parsed || parsed.captainId !== want) continue;
    }
    count += 1;
  }
  return count;
}
