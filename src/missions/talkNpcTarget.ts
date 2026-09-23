/** `captainId` 또는 `captainId|planetId` */
export function parseTalkNpcTarget(targetId: string): {
  captainId: string;
  planetId: string | null;
} {
  const raw = (targetId ?? '').trim();
  const sep = raw.indexOf('|');
  if (sep < 0) return { captainId: raw, planetId: null };
  const captainId = raw.slice(0, sep).trim();
  const planetId = raw.slice(sep + 1).trim();
  return { captainId, planetId: planetId || null };
}

export function resolveTalkNpcSceneId(objectiveId: string): string {
  return `story_dialog_${objectiveId}`;
}
