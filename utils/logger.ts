import analytics from '@react-native-firebase/analytics';
import firebaseApp from '@react-native-firebase/app';
import { createBattleResultLogToFirestore } from '../src/firebase/firestore';
import { scheduleUserCloudSync } from '../src/firebase/userCloudSyncSchedule';
import { configureFirestorePersistence } from '../src/firebase/userDataSync';
import { usePlayerStore } from '../src/store/playerStore';

type AnalyticsValue = string | number | boolean | null | undefined;

function sanitizeParams(params: Record<string, AnalyticsValue>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' || typeof v === 'number') {
      out[k] = v;
    } else if (typeof v === 'boolean') {
      out[k] = v ? 1 : 0;
    }
  }
  return out;
}

export function initializeFirebase(): void {
  try {
    // Native config(google-services.json / GoogleService-Info.plist)가 정상일 때 기본 앱 핸들을 보장
    void firebaseApp.app();
    configureFirestorePersistence();
  } catch (err) {
    console.warn('[logger] Firebase init failed:', err);
  }
}

export async function logEvent(
  eventName: string,
  params: Record<string, AnalyticsValue> = {},
): Promise<void> {
  try {
    await analytics().logEvent(eventName, sanitizeParams(params));
  } catch (err) {
    console.warn(`[logger] logEvent failed (${eventName}):`, err);
  }
}

export async function logAppOpen(): Promise<void> {
  await logEvent('app_open');
}

export async function logBattleResult(
  win: boolean,
  enemyType: string,
  duration: number,
): Promise<void> {
  const durationSec = Math.max(0, Math.round(duration));
  await logEvent('pvp_battle_result', {
    win,
    enemy_type: enemyType,
    duration_sec: durationSec,
  });

  const player = usePlayerStore.getState().player;
  if (!player?.uid) return;
  await createBattleResultLogToFirestore({
    uid: player.uid,
    nickname: player.nickname?.trim() || 'Unknown',
    win,
    enemyType,
    durationSec,
    participantCount: 20,
    finishedAt: Date.now(),
  });
  scheduleUserCloudSync();
}
