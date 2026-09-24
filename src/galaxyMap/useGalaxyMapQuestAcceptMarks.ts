import { useMemo } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useMissionStore } from '../store/missionStore';
import {
  EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS,
  GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED,
  readGalaxyMapQuestAcceptMarkRevision,
  resolveGalaxyMapQuestAcceptMarks,
  type GalaxyMapQuestAcceptMarks,
} from './galaxyMapQuestAcceptMarks';

/**
 * 안개 해소 성계 + 미수락 퀘스트 리비전에서만 마크를 다시 짠다.
 * 틱·목표 토글(관계없는 sandbox)로는 재계산하지 않는다.
 */
export function useGalaxyMapQuestAcceptMarks(
  visibleSystems: readonly { readonly id: string }[],
): GalaxyMapQuestAcceptMarks {
  const enabled = GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED;
  const revision = useStoreWithEqualityFn(
    useMissionStore,
    (s) => (enabled ? readGalaxyMapQuestAcceptMarkRevision(s.progresses) : 'off'),
    Object.is,
  );

  return useMemo(() => {
    if (!enabled) return EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS;
    const ids: string[] = [];
    for (let i = 0; i < visibleSystems.length; i += 1) {
      ids.push(visibleSystems[i]!.id);
    }
    return resolveGalaxyMapQuestAcceptMarks({
      enabled: true,
      visibleSystemIds: ids,
      progresses: useMissionStore.getState().progresses,
    });
  }, [enabled, revision, visibleSystems]);
}
