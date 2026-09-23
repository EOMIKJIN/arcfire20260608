import { CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV } from '../data/generated/csvCaptainPersonalMissions';
import type { CaptainPersonalMissionTemplateRow } from '../data/generated/csvCaptainPersonalMissions';
import { hashSeed, pickCaptainPersonalTemplateId, rotateIds } from './captainPersonalMissionOffer';

const DEST_BAR_HOST_PLACEHOLDER = '__dest_bar_host__';

export type { CaptainPersonalMissionTemplateRow };

export function listCaptainPersonalMissionTemplates(): CaptainPersonalMissionTemplateRow[] {
  return CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV;
}

export function getCaptainPersonalMissionTemplate(
  templateId: string,
): CaptainPersonalMissionTemplateRow | undefined {
  const id = templateId.trim();
  if (!id) return undefined;
  const rows = CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.id === id) return rows[i];
  }
  return undefined;
}

export function listCaptainPersonalTemplateIds(): string[] {
  return CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV.map((row) => row.id);
}

export function isDestBarHostPlaceholder(targetId: string): boolean {
  return targetId.trim() === DEST_BAR_HOST_PLACEHOLDER;
}

/** 함장·행성·일차 해시로 풀을 돌리고, 사용 가능한 첫 템플릿을 고른다. */
export function pickUsableCaptainPersonalTemplateId(
  captainId: string,
  planetId: string,
  dayKey: string,
  canUse: (templateId: string) => boolean,
): string | null {
  const ids = listCaptainPersonalTemplateIds();
  const seed = hashSeed([captainId, planetId, dayKey, 'usable']);
  const rotated = rotateIds(ids, seed);
  const preferred = pickCaptainPersonalTemplateId(ids, captainId, planetId, dayKey);
  const ordered = preferred ? [preferred, ...rotated.filter((id) => id !== preferred)] : rotated;
  for (let i = 0; i < ordered.length; i += 1) {
    const id = ordered[i]!;
    if (canUse(id)) return id;
  }
  return null;
}
