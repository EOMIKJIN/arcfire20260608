import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  beginUiScreenShell,
  endUiScreenShell,
  markUiScreenShellReady,
} from './uiForegroundSequence';

/** 시설·허브·월드맵 — 포커스 동안 셸을 열고, ready 되면 대기 대사를 flush. */
export function useUiScreenShell(id: string, ready: boolean): { visitGen: number } {
  const [visitGen, setVisitGen] = useState(0);
  useFocusEffect(
    useCallback(() => {
      beginUiScreenShell(id);
      setVisitGen((g) => g + 1);
      return () => {
        endUiScreenShell(id);
      };
    }, [id]),
  );

  useEffect(() => {
    if (ready) markUiScreenShellReady(id);
  }, [id, ready]);

  return { visitGen };
}
