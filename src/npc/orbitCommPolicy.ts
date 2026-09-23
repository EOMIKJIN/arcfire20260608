// ============================================================
// 궤도 통신요청 판정 — NPC 함장 설정만. 레지스트리/씬 인덱스 비의존.
// ============================================================

import type { NpcCaptain } from '../types';
import { PLAYER_FLAGSHIP_HUB_INFO_SLOT } from '../game/planetHub/nearbyPresenceContract';
import type { IngameDialogTextContext } from '../game/ingameDialog/ingameDialogTypes';

export const ORBIT_COMM_REFUSE_HOSTILE_SCENE_ID = 'npc_dialog_orbit_comm_refuse_hostile';
export const ORBIT_COMM_REFUSE_UNIDENTIFIED_SCENE_ID = 'npc_dialog_orbit_comm_refuse_unidentified';

export type OrbitCommRowRef = {
  captainId?: string;
  shipId?: string;
  isPlayerFlagship?: boolean;
  keySlot?: number;
  /** 허브 현재 행성 — 없으면 세축 기억 skip */
  planetId?: string;
  /** 퀘스트·총사령관 INFO — talk off/미식별이어도 수락 */
  commGuaranteed?: boolean;
};

export type OrbitCommDecision =
  | { outcome: 'none' }
  | {
      outcome: 'accept';
      sceneId: string;
      captainId: string;
      context: IngameDialogTextContext;
    }
  | {
      outcome: 'refuse';
      reason: 'hostile' | 'unidentified' | 'talk_disabled';
      sceneId: string;
      captainId?: string;
      context: IngameDialogTextContext;
    };

export type OrbitCommCaptainRef = Pick<
  NpcCaptain,
  | 'id'
  | 'displayName'
  | 'displayNameEn'
  | 'mainStageTalkEnabled'
  | 'operationalState'
  | 'combatTeam'
  | 'arcOrbitPresenceFill'
  | 'mainStageTalkSceneId'
>;

/** 적대 — 운용 상태 또는 레드 팀 (함장 CSV) */
export function isOrbitCommHostile(
  captain: Pick<NpcCaptain, 'operationalState' | 'combatTeam'>,
): boolean {
  return captain.operationalState === 'hostile' || captain.combatTeam === 'red';
}

function resolveAcceptSceneId(captain: OrbitCommCaptainRef): string {
  if (captain.arcOrbitPresenceFill) return 'npc_dialog_arc_transport_temp';
  const explicit = String(captain.mainStageTalkSceneId ?? '').trim();
  if (explicit) return explicit;
  return `npc_dialog_${captain.id.replace(/^npc_cpt_/, '')}`;
}

/**
 * 플레이어 기함은 통신 없음.
 * 미식별 · 대화 비활성(적대 포함) → 거부.
 * 대화 활성 함장은 적대해도 CSV 씬으로 수락(NPC 설정 우선).
 */
export function decideOrbitCommForCaptain(
  row: OrbitCommRowRef,
  captain: OrbitCommCaptainRef | undefined,
): OrbitCommDecision {
  if (row.isPlayerFlagship === true || row.keySlot === PLAYER_FLAGSHIP_HUB_INFO_SLOT) {
    return { outcome: 'none' };
  }

  if (row.commGuaranteed === true) {
    const guaranteedId = String(captain?.id ?? row.captainId ?? '').trim();
    if (guaranteedId) {
      const context: IngameDialogTextContext = {
        npcCaptainId: guaranteedId,
        npcName: captain?.displayName,
        npcNameEn: captain?.displayNameEn,
      };
      return {
        outcome: 'accept',
        sceneId: captain
          ? resolveAcceptSceneId(captain)
          : `npc_dialog_${guaranteedId.replace(/^npc_cpt_/, '')}`,
        captainId: guaranteedId,
        context,
      };
    }
  }

  if (!captain) {
    return {
      outcome: 'refuse',
      reason: 'unidentified',
      sceneId: ORBIT_COMM_REFUSE_UNIDENTIFIED_SCENE_ID,
      context: {},
    };
  }

  const context: IngameDialogTextContext = {
    npcCaptainId: captain.id,
    npcName: captain.displayName,
    npcNameEn: captain.displayNameEn,
  };

  if (!captain.mainStageTalkEnabled) {
    return {
      outcome: 'refuse',
      reason: isOrbitCommHostile(captain) ? 'hostile' : 'talk_disabled',
      sceneId: ORBIT_COMM_REFUSE_HOSTILE_SCENE_ID,
      captainId: captain.id,
      context,
    };
  }

  return {
    outcome: 'accept',
    sceneId: resolveAcceptSceneId(captain),
    captainId: captain.id,
    context,
  };
}
