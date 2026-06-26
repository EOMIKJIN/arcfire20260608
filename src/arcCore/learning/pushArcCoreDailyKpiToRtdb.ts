// ============================================================
// ArcCore RTDB — 일 1회 KPI push (기기별 bounded write)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureFirebaseAnonymousAuth } from '../../firebase/firebaseAnonymousAuth';
import { isArcCoreRtdbLearningSyncEnabled } from '../../firebase/arccoreRtdbSessionFlags';
import { arccoreRtdbRef } from '../../firebase/rtdbRefs';
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

    await arccoreRtdbRef(`learning/devices/${authUid}/dailyKpi`).set(payload);
    await AsyncStorage.setItem(LAST_PUSH_DAY_KEY, dayKey);

    if (__DEV__) {
      console.log(`[ArcCore/RTDB] daily KPI push auth=${authUid.slice(0, 6)}… day=${dayKey}`);
    }

    return { pushed: true };
  } catch (e) {
    console.warn('[ArcCore/RTDB] daily KPI push skipped:', e);
    return { pushed: false, skippedReason: 'offline' };
  }
}
