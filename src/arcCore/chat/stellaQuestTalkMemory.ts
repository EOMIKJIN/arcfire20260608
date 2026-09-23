/**
 * 함장 1차 종료 직후만 기억하는 세션 스칼라.
 * persist 없음. 허브 route_blur·계정 purge에서 비운다.
 */
export type StellaQuestTalkMemory = {
  sceneId: string;
  speakerCaptainId: string;
  missionId: string;
  objectiveId: string;
};

let lastTalk: StellaQuestTalkMemory | null = null;

export function missionIdFromObjectiveId(objectiveId: string): string {
  const story = /^obj_story_(\d+)/.exec(objectiveId);
  if (story) return `story_${story[1]}`;
  const side = /^obj_s(\d+)/.exec(objectiveId);
  if (side) return `sandbox_${side[1]}`;
  return '';
}

export function rememberStellaQuestTalk(next: StellaQuestTalkMemory | null): void {
  if (!next?.sceneId) {
    lastTalk = null;
    return;
  }
  lastTalk = {
    sceneId: next.sceneId,
    speakerCaptainId: next.speakerCaptainId,
    missionId: next.missionId,
    objectiveId: next.objectiveId,
  };
}

export function readLastStellaQuestTalk(): StellaQuestTalkMemory | null {
  if (!lastTalk) return null;
  return {
    sceneId: lastTalk.sceneId,
    speakerCaptainId: lastTalk.speakerCaptainId,
    missionId: lastTalk.missionId,
    objectiveId: lastTalk.objectiveId,
  };
}

export function clearStellaQuestTalkMemory(): void {
  lastTalk = null;
}
