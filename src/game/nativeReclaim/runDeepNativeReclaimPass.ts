import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { prunePlanetNebulaProfilesExceptPlanetIds } from '../../store/planetNebulaStore';
import { signalHubBackdropNativeRemount } from './hubBackdropNativeRemountSignal';
import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { tryBeginHubNativeReclaim } from './hubNativeReclaimCoalesce';
import {
  HUB_BACKDROP_NATIVE_REMOUNT_DEFER_MS,
  HUB_BACKDROP_REMOUNT_COOLDOWN_MS,
  HUB_POST_REMOUNT_TRIM_DELAY_MS,
} from './processMemoryBudgetPolicy';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';

export type DeepNativeReclaimPassOptions = {
  planetId: string;
  reason: string;
  /** true — Fresco trim 완료 후에도 RN Image key remount 생략 (백그라운드 등) */
  skipBackdropRemount?: boolean;
};

/**
 * app_background → JS 루트 풀 리로드("Running main") 시 모듈 스코프 변수가 리셋되어
 * 쿨다운이 무력화되던 문제(worldmap-native-heap-pss-audit-recheck-20260801 재검수에서 실측 확인:
 * 리로드 직후 첫 hub_inbound_drone_end가 쿨다운 없이 remount 실행됨) — AsyncStorage로 리로드 경계를
 * 넘겨 영속화. waveCombatCooldownStore.ts와 동일 패턴(하이드레이트 경합 시 최신값 우선).
 */
const BACKDROP_REMOUNT_COOLDOWN_STORAGE_KEY = 'arcfire_hub_backdrop_remount_cooldown_v1';

let backdropRemountTimer: ReturnType<typeof setTimeout> | null = null;
let backdropRemountRaf1 = 0;
let backdropRemountRaf2 = 0;
let postRemountTrimTimer: ReturnType<typeof setTimeout> | null = null;
let lastBackdropRemountAtMs = 0;
let backdropRemountCooldownHydrateStarted = false;

/** 모듈 로드(=JS 리로드 포함) 시 1회 하이드레이트 — 트리거 판정보다 항상 선행 시도 */
function hydrateBackdropRemountCooldown(): void {
  if (backdropRemountCooldownHydrateStarted) return;
  backdropRemountCooldownHydrateStarted = true;
  void AsyncStorage.getItem(BACKDROP_REMOUNT_COOLDOWN_STORAGE_KEY)
    .then((raw) => {
      if (!raw) return;
      const at = Number(raw);
      // 하이드레이트 경합 — 그 사이 실제 remount가 먼저 기록됐으면 더 최신 값을 유지
      if (Number.isFinite(at) && at > lastBackdropRemountAtMs) {
        lastBackdropRemountAtMs = at;
      }
    })
    .catch(() => {
      /* 손상/미가용 시 쿨다운 없이 시작(기존 동작과 동일 — 더 나빠지지 않음) */
    });
}

hydrateBackdropRemountCooldown();

function schedulePostRemountTrim(reason: string): void {
  if (postRemountTrimTimer) clearTimeout(postRemountTrimTimer);
  postRemountTrimTimer = setTimeout(() => {
    postRemountTrimTimer = null;
    void trimNativeBitmapCachesAsync().then((result) => {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log(`[MEM] postRemountTrim reason=${reason} fresco=${result.frescoCleared ?? false}`);
      }
    });
  }, HUB_POST_REMOUNT_TRIM_DELAY_MS);
}

/**
 * RN Image remount — 1차 Fresco trim **이후**만 실행 (native floor 계단 방지).
 * post-Skia-peak GL floor 회수에서도 재사용 (15m deep pass와 동일 경로).
 */
export function scheduleHubBackdropNativeRemountAfterTrim(reason: string): void {
  const now = Date.now();
  if (now - lastBackdropRemountAtMs < HUB_BACKDROP_REMOUNT_COOLDOWN_MS) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[MEM] backdropRemount cooldown skip reason=${reason}`);
    }
    return;
  }
  lastBackdropRemountAtMs = now;
  void AsyncStorage.setItem(BACKDROP_REMOUNT_COOLDOWN_STORAGE_KEY, String(now)).catch(() => {
    /* 디스크 기록 실패는 무해 — 다음 remount 시도에서 재기록 */
  });

  if (backdropRemountTimer) {
    clearTimeout(backdropRemountTimer);
    backdropRemountTimer = null;
  }
  if (backdropRemountRaf1) cancelAnimationFrame(backdropRemountRaf1);
  if (backdropRemountRaf2) cancelAnimationFrame(backdropRemountRaf2);

  signalHubSkiaNativeReclaim(`${reason}:pre_backdrop`);

  InteractionManager.runAfterInteractions(() => {
    backdropRemountRaf1 = requestAnimationFrame(() => {
      backdropRemountRaf2 = requestAnimationFrame(() => {
        backdropRemountRaf1 = 0;
        backdropRemountRaf2 = 0;
        backdropRemountTimer = setTimeout(() => {
          backdropRemountTimer = null;
          signalHubBackdropNativeRemount(reason);
          schedulePostRemountTrim(reason);
        }, HUB_BACKDROP_NATIVE_REMOUNT_DEFER_MS);
      });
    });
  });
}

/**
 * PID 유지 중 Native(PSS) floor 2차 회수 — Fresco trim 선행 → (쿨다운 OK 시) RN 백드롭 remount.
 * 전투·route_blur full reclaim 과 별도. hub 체류 ~15분 주기.
 */
export function runDeepNativeReclaimPass(opts: DeepNativeReclaimPassOptions): void {
  if (!tryBeginHubNativeReclaim(opts.reason)) return;

  runSoftNativeReclaimPass(opts.reason);
  prunePlanetNebulaProfilesExceptPlanetIds([opts.planetId]);
  compactPlanetMemoRegistryShells();

  void trimNativeBitmapCachesAsync().then((result) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[MEM] runDeepNativeReclaimPass reason=${opts.reason} fresco=${result.frescoCleared ?? false}`,
      );
    }
    if (!opts.skipBackdropRemount) {
      scheduleHubBackdropNativeRemountAfterTrim(opts.reason);
    }
  });
}

/** 테스트 전용 */
export function resetDeepNativeReclaimStateForTests(): void {
  if (backdropRemountTimer) clearTimeout(backdropRemountTimer);
  if (postRemountTrimTimer) clearTimeout(postRemountTrimTimer);
  backdropRemountTimer = null;
  postRemountTrimTimer = null;
  if (backdropRemountRaf1) cancelAnimationFrame(backdropRemountRaf1);
  if (backdropRemountRaf2) cancelAnimationFrame(backdropRemountRaf2);
  backdropRemountRaf1 = 0;
  backdropRemountRaf2 = 0;
  lastBackdropRemountAtMs = 0;
  backdropRemountCooldownHydrateStarted = false;
}
