// ============================================================
// 아크코어 섀도우 페어링 패스 — 온보딩 직후 + 기존 유저 소급 (전 유저 동일)
//
// 호출 시점 (전부 단발 · 부트 동기 경로 밖):
//   1) completePilotRegistration 성공 직후 (fire-and-forget)
//   2) 부트 후 지연 1회 (기존 유저 소급 · waiting 재확인)
//
// 헌법 수정안 §16-A: 트랜잭션은 미페어 상태에서만 1회. paired 캐시가 있으면
// 네트워크 접근 없이 즉시 반환. 주기 폴링·onSnapshot 없음.
// ============================================================

import { getCurrentUser } from '../../firebase/auth';
import {
  ensureArcCoreShadowPairing,
  fetchArcCoreShadowShipProfile,
  publishArcCoreShadowShipProfile,
} from '../../firebase/arcCoreShadowPairing';
import { useArcCoreShadowIdentityStore } from '../../store/arcCoreShadowIdentityStore';
import { usePlayerStore } from '../../store/playerStore';

let passRanThisBoot = false;
let passInFlight: Promise<void> | null = null;
let profileSyncedThisBoot = false;

/**
 * 전함 스냅샷 publish(자기 기함) + fetch(짝 유저 기함) — 부트당 1회.
 * 스냅샷 빌더는 lazy require — 부트 정적 체인에 generated CSV를 끌어오지 않는다.
 */
async function syncShadowShipProfilesOnce(uid: string): Promise<void> {
  if (profileSyncedThisBoot) return;
  profileSyncedThisBoot = true;

  const { buildLocalArcCoreShadowShipSnapshot } =
    require('./arcCoreShadowShipSnapshot') as typeof import('./arcCoreShadowShipSnapshot');

  const localSnapshot = buildLocalArcCoreShadowShipSnapshot();
  if (localSnapshot) {
    await publishArcCoreShadowShipProfile(uid, localSnapshot);
  }

  const s = useArcCoreShadowIdentityStore.getState();
  if (s.status === 'paired' && s.shadowUid) {
    const shadowSnapshot = await fetchArcCoreShadowShipProfile(s.shadowUid);
    if (shadowSnapshot) {
      useArcCoreShadowIdentityStore.getState().setShadowShipSnapshot(shadowSnapshot);
      await useArcCoreShadowIdentityStore.getState().persistLocal();
    }
  }
}

/** 섀도우 페어링 확보 — paired 로컬 캐시 있으면 no-op. */
export async function runArcCoreShadowPairingPass(): Promise<void> {
  if (passInFlight) return passInFlight;
  passInFlight = (async () => {
    const store = useArcCoreShadowIdentityStore.getState();
    await store.loadLocal();

    const uid = getCurrentUser().uid?.trim();
    if (!uid || uid === 'local-guest') return;

    // 닉네임 등록(온보딩 완료) 전에는 매칭 풀에 넣지 않는다
    const player = usePlayerStore.getState().player;
    if (!player?.nickname?.trim()) return;

    const cached = useArcCoreShadowIdentityStore.getState();
    if (cached.status === 'paired' && cached.selfUid === uid && cached.shadowUid) {
      // 이미 페어 확정 — 전함 스냅샷만 부트당 1회 갱신(스펙 신선도)
      await syncShadowShipProfilesOnce(uid).catch(() => {});
      return;
    }

    try {
      const result = await ensureArcCoreShadowPairing(uid);
      const s = useArcCoreShadowIdentityStore.getState();
      if (result.status === 'paired') {
        s.markPaired(uid, result.shadowUid, result.pairedAtMs);
      } else {
        s.markWaiting(uid);
      }
      await useArcCoreShadowIdentityStore.getState().persistLocal();
      await syncShadowShipProfilesOnce(uid).catch(() => {});
    } catch {
      /* 오프라인·규칙 거부 — 다음 부트 소급 패스에서 재시도 */
    }
  })().finally(() => {
    passInFlight = null;
  });
  return passInFlight;
}

/**
 * 부트 후 지연 소급 패스 — 부트당 1회, 타이틀 표시 이후 백그라운드.
 * (waiting 상태 유저의 페어 확정 여부 재확인 포함)
 */
export function scheduleArcCoreShadowPairingPassAfterBoot(delayMs = 12_000): void {
  if (passRanThisBoot) return;
  passRanThisBoot = true;
  setTimeout(() => {
    void runArcCoreShadowPairingPass();
  }, Math.max(0, delayMs));
}
