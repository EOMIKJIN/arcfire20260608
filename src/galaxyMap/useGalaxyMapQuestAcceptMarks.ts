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
 * 수락·현재 세부미션 revision에서만 목적지 마크를 다시 짠다.
 * 안개 가시 목록·관계없는 sandbox 토글로는 재계산하지 않는다.
 */
export function useGalaxyMapQuestAcceptMarks(): GalaxyMapQuestAcceptMarks {
  const enabled = GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED;
  const revision = useStoreWithEqualityFn(
    useMissionStore,
    (s) => (enabled ? readGalaxyMapQuestAcceptMarkRevision(s.progresses) : 'off'),
    Object.is,
  );

  return useMemo(() => {
    if (!enabled) return EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS;
    return resolveGalaxyMapQuestAcceptMarks({
      enabled: true,
      progresses: useMissionStore.getState().progresses,
    });
  }, [enabled, revision]);
}
