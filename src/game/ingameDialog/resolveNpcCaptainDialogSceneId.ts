// ============================================================
// NPC 함장 — CSV mainStageTalkSceneId 우선 · ingame_dialog 씬 해석
// ============================================================

import type { NpcCaptain } from '../../types';
import { getIngameDialogSceneById } from './ingameDialogSceneIndex';

export const INGAME_DIALOG_FALLBACK_SCENE_ID = 'npc_dialog_default';

type CaptainDialogSource = Pick<
  NpcCaptain,
  'id' | 'arcOrbitPresenceFill' | 'mainStageTalkSceneId'
>;

function resolveDerivedNpcDialogSceneId(captainId: string): string {
  return `npc_dialog_${captainId.replace(/^npc_cpt_/, '')}`;
}

/** 함장 CSV `mainStageTalkSceneId` → 유효 ingame_dialog 씬 id (없으면 null) */
export function resolveNpcCaptainDialogSceneId(captain: CaptainDialogSource): string | null {
  if (captain.arcOrbitPresenceFill) {
    const arcSceneId = 'npc_dialog_arc_transport_temp';
    return getIngameDialogSceneById(arcSceneId) ? arcSceneId : null;
  }

  const explicit = String(captain.mainStageTalkSceneId ?? '').trim();
  if (explicit && getIngameDialogSceneById(explicit)) {
    return explicit;
  }

  const derived = resolveDerivedNpcDialogSceneId(captain.id);
  return getIngameDialogSceneById(derived) ? derived : null;
}

/** CSV 씬 없을 때 범용 폴백(항상 테이블 정본) */
export function resolveIngameDialogFallbackSceneId(): string {
  if (getIngameDialogSceneById(INGAME_DIALOG_FALLBACK_SCENE_ID)) {
    return INGAME_DIALOG_FALLBACK_SCENE_ID;
  }
  return 'npc_dialog_orbit_captain_temp';
}
