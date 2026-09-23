import { useEffect } from 'react';
import {
  beginPreHubWorldOpsAlertSuppress,
  endPreHubWorldOpsAlertSuppress,
} from './worldOpsNotifyPresence';

/** 스토리·파일럿 등록·차원항로 마운트 동안 접전·운영 팝업 억제. */
export function usePreHubWorldOpsAlertSuppress(): void {
  useEffect(() => {
    beginPreHubWorldOpsAlertSuppress();
    return () => {
      endPreHubWorldOpsAlertSuppress();
    };
  }, []);
}
