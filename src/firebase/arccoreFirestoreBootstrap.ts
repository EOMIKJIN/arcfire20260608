import firestore from '@react-native-firebase/firestore';

const ARCCORE_COLLECTION = 'arccore';

/**
 * 아크코어 제어 컬렉션 기본 문서를 시드한다.
 * - 기존 users 컬렉션은 절대 건드리지 않는다.
 * - merge 저장으로 반복 실행해도 안전하다.
 */
export async function ensureArcCoreCollectionSeeded(input: {
  uid: string;
}): Promise<void> {
  const uid = input.uid.trim();
  if (!uid) return;

  try {
    const col = firestore().collection(ARCCORE_COLLECTION);
    const configRef = col.doc('config');
    const existingConfig = await configRef.get();
    // 관리자가 이미 만든 arccore를 사용: 앱 실행마다 재시드하지 않는다.
    if (existingConfig.exists()) return;

    const now = firestore.FieldValue.serverTimestamp();
    await Promise.all([
      configRef.set(
        {
          enabled: true,
          safeMode: false,
          tickScale: 1,
          updatedBy: uid,
          updatedAt: now,
        },
        { merge: true },
      ),
      col.doc('schedule').set(
        {
          dailyCycleEnabled: true,
          timeZone: 'UTC',
          runHour: 0,
          runMinute: 0,
          updatedBy: uid,
          updatedAt: now,
        },
        { merge: true },
      ),
      col.doc('subcores').set(
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
    console.warn('[arccore] ensureArcCoreCollectionSeeded skipped:', e);
  }
}

