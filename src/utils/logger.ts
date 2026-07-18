import analytics from '@react-native-firebase/analytics';
import firebaseApp from '@react-native-firebase/app';
import { configureFirestorePersistence } from '../firebase/userDataSync';

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

/**
 * 전투 결과 Analytics 이벤트 — Firestore `battles` 로그 체인은 정식 출시 정리에서 폐기
 * (호출부 없는 데드 코드 + rules default deny 대상).
 */
export async function logBattleResult(
  win: boolean,
  enemyType: string,
  duration: number,
): Promise<void> {
  const durationSec = Math.max(0, Math.round(duration));
  await logEvent('battle_result', {
    win,
    enemy_type: enemyType,
    duration_sec: durationSec,
  });
}
