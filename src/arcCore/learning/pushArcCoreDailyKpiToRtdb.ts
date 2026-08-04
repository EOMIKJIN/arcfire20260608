// ============================================================
// ArcCore RTDB — 일 1회 KPI push (기기별 bounded write)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureFirebaseAnonymousAuth } from '../../firebase/firebaseAnonymousAuth';
import { isArcCoreRtdbLearningSyncEnabled } from '../../firebase/arccoreRtdbSessionFlags';
import { arccoreRtdbRef } from '../../firebase/rtdbRefs';
import { ARCORE_RTDB_DAILY_KPI_WRITE_TIMEOUT_MS } from '../../firebase/arccoreRtdbConfig';
import {
  ARCORE_RTDB_SCHEMA_VERSION,
  type ArcCoreRtdbDeviceDailyKpi,
} from '../../firebase/arccoreRtdbTypes';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import type { ArcCoreEconomyLearningDailyPassResult } from './runArcCoreEconomyLearningDailyPass';
import { EconomySimOverlayDelta_FROM_SIM } from '../../data/balance/generated/economySimOverlayDelta';

const LAST_PUSH_DAY_KEY = 'arcfire_arc_core_rtdb_last_push_day_v1';

export async function clearArcCoreRtdbDailyKpiPushState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_PUSH_DAY_KEY);
  } catch {
    /* ignore */
  }
}

export type PushArcCoreDailyKpiToRtdbResult = {
  pushed: boolean;
  skippedReason?: 'no_uid' | 'no_auth' | 'same_day' | 'offline' | 'disabled';
};

/**
 * 일일 배치 tail — `arccore/learning/devices/{uid}/dailyKpi` 1 write/day max.
 * 리스너·tick write 없음.
 */
export async function pushArcCoreDailyKpiToRtdbIfDue(input: {
  localDeviceId?: string | null;
  learningResult: ArcCoreEconomyLearningDailyPassResult;
  rtdbAvailable?: boolean;
}): Promise<PushArcCoreDailyKpiToRtdbResult> {
  if (input.rtdbAvailable === false) {
    return { pushed: false, skippedReason: 'disabled' };
  }
  if (!isArcCoreRtdbLearningSyncEnabled()) {
    return { pushed: false, skippedReason: 'disabled' };
  }

  const authUid = await ensureFirebaseAnonymousAuth();
  if (!authUid) return { pushed: false, skippedReason: 'no_auth' };

  const dayKey = planetAttackKstDayKey();
  try {
    const lastDay = await AsyncStorage.getItem(LAST_PUSH_DAY_KEY);
    if (lastDay === dayKey) {
      return { pushed: false, skippedReason: 'same_day' };
    }

    const localDeviceId = input.localDeviceId?.trim() || undefined;
    const payload: ArcCoreRtdbDeviceDailyKpi = {
      schemaVersion: ARCORE_RTDB_SCHEMA_VERSION,
      dayKey,
      economy: {
        planetsReconciled: input.learningResult.planetsReconciled,
        windowTradeGross: input.learningResult.windowTradeGross,
        windowConvoyTrips: input.learningResult.windowConvoyTrips,
        deltaId: EconomySimOverlayDelta_FROM_SIM.deltaId,
        simKpiStatus: EconomySimOverlayDelta_FROM_SIM.kpi?.status,
      },
      ...(localDeviceId ? { localDeviceId } : {}),
      updatedAt: Date.now(),
    };

    // 오프라인이면 SDK가 재연결 전까지 promise를 안 풀 수 있어(Wave 후속, 2026-08-04
    // 대표님 실기 재현: 차원항로 진입 로딩 무한 대기) 타임아웃으로 상한을 둔다.
    // 타임아웃되면 실제 write는 SDK 내부에 큐잉된 채로 남을 수 있으나, 이 write는
    // 매일 1회짜리 최선노력 텔레메트리라 유실돼도 다음날 재시도로 충분하다.
    await Promise.race([
      arccoreRtdbRef(`learning/devices/${authUid}/dailyKpi`).set(payload),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('rtdb_daily_kpi_write_timeout')), ARCORE_RTDB_DAILY_KPI_WRITE_TIMEOUT_MS);
      }),
    ]);
    await AsyncStorage.setItem(LAST_PUSH_DAY_KEY, dayKey);

    if (__DEV__) {
      console.log(`[ArcCore/RTDB] daily KPI push auth=${authUid.slice(0, 6)}… day=${dayKey}`);
    }

    return { pushed: true };
  } catch (e) {
    // 오프라인·타임아웃은 정상적으로 처리되는 기대 경로(다음날 재시도)라 console.warn을 쓰면
    // RN LogBox 경고창이 화면에 뜬다(2026-08-04 대표님 실기 확인 — 차원항로 로딩 중 팝업).
    // ensureFirebaseAnonymousAuth의 동일 성격 catch와 동일하게 __DEV__ console.log로 낮춘다.
    if (__DEV__) {
      console.log('[ArcCore/RTDB] daily KPI push skipped:', e);
    }
    return { pushed: false, skippedReason: 'offline' };
  }
}
