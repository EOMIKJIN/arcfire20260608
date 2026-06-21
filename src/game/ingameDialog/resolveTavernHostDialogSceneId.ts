// ============================================================
// 여관 함장 — CSV mainStageTalkSceneId / npc_dialog_* 씬 id 해석
// ============================================================

import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import {
  resolveIngameDialogFallbackSceneId,
  resolveNpcCaptainDialogSceneId,
} from './resolveNpcCaptainDialogSceneId';

export function resolveTavernHostDialogSceneId(captainId: string): string {
  const captain = getNpcCaptain(captainId);
  if (!captain) return resolveIngameDialogFallbackSceneId();
  return resolveNpcCaptainDialogSceneId(captain) ?? resolveIngameDialogFallbackSceneId();
}
