/** mission_* 활성 구간 — 본체 inbound 침묵만. 허브 [대화] 명단 NL은 숨기지 않는다. 틱 없음. */

export function isArcCoreTutorialForceActive(): boolean {
  const { useMissionStore } = require('../../store/missionStore') as typeof import('../../store/missionStore');
  const { isTutorialMissionId } = require('../../missions/missionTrack') as typeof import('../../missions/missionTrack');
  const progresses = useMissionStore.getState().progresses;
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    if (progresses[id]?.status !== 'active') continue;
    if (isTutorialMissionId(id)) return true;
  }
  return false;
}
