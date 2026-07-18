import firestore from '@react-native-firebase/firestore';
import { arccoreDocRef, getDoc, getDocFromCache, setDoc } from './firestoreRefs';
import { configureFirestorePersistence } from './firestoreClientConfig';
import { ensureFirebaseAnonymousAuth } from './firebaseAnonymousAuth';

/** Firestore server probe 상한 — 오프라인·지연 시 조용히 skip */
const ARCORE_SEED_PROBE_MS = 4_000;

function snapExists(snap: { exists: boolean | (() => boolean) }): boolean {
  return typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
}

/**
 * 아크코어 제어 컬렉션 기본 문서를 시드한다.
 * - 기존 users 컬렉션은 절대 건드리지 않는다.
 * - merge 저장으로 반복 실행해도 안전하다.
 * - 캐시 우선 · server probe 타임아웃 — 부트 [boot] 경고 없음.
 */
export async function ensureArcCoreCollectionSeeded(input: {
  uid: string;
}): Promise<void> {
  const uid = input.uid.trim();
  if (!uid) return;

  try {
    configureFirestorePersistence();
    const configRef = arccoreDocRef('config');

    try {
      const cached = await getDocFromCache(configRef);
      if (snapExists(cached)) return;
    } catch {
      /* 캐시 없음 */
    }

    await ensureFirebaseAnonymousAuth();
    const serverSnap = await Promise.race([
      getDoc(configRef),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), ARCORE_SEED_PROBE_MS);
      }),
    ]);
    if (serverSnap && snapExists(serverSnap)) return;
    if (!serverSnap) return;

    const now = firestore.FieldValue.serverTimestamp();
    await Promise.all([
      setDoc(
        configRef,
        {
          enabled: true,
          safeMode: false,
          tickScale: 1,
          updatedBy: uid,
          updatedAt: now,
        },
        { merge: true },
      ),
      setDoc(
        arccoreDocRef('schedule'),
        {
          dailyCycleEnabled: true,
          timeZone: 'UTC',
          runHour: 12,
          runMinute: 0,
          updatedBy: uid,
          updatedAt: now,
        },
        { merge: true },
      ),
      setDoc(
        arccoreDocRef('subcores'),
        {
          world_expansion_subcore: { enabled: true, timeScale: 1 },
          arc_news_board_subcore: { enabled: true, timeScale: 1 },
          arc_planet_nebula_subcore: { enabled: true, timeScale: 1 },
          updatedBy: uid,
          updatedAt: now,
        },
        { merge: true },
      ),
    ]);
  } catch (e) {
    if (__DEV__) {
      console.warn('[arccore] ensureArcCoreCollectionSeeded skipped:', e);
    }
  }
}
