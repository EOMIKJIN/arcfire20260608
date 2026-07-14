// ============================================================
// 아크코어 섀도우 공개 — 본진(eternal_throne · endgame_boss) 격파 시 1회
//
// P2 연동 (대표님 승인 2026-07-13):
//   전투 종료 블록(틱 아님 · 전투당 1회)에서 sync 가드 → 통과 시에만
//   setTimeout 0 으로 JS 큐에 넘겨 단발 getDoc + 오버레이 공개.
// ============================================================

import { fetchArcCoreShadowNickname } from '../../firebase/arcCoreShadowPairing';
import { useArcCoreShadowIdentityStore } from '../../store/arcCoreShadowIdentityStore';
import { showArcAlert } from '../../utils/showArcAlert';
import { t } from '../../i18n';
import { runArcCoreShadowPairingPass } from './runArcCoreShadowPairingPass';

/** 아크코어 본진 — zoneIndex 20 · mainStageCombatVariant=endgame_boss */
export const ARC_CORE_SHADOW_HOME_BASE_PLANET_ID = 'eternal_throne';

let revealInFlight = false;

async function revealShadowIdentity(): Promise<void> {
  const store = useArcCoreShadowIdentityStore.getState();
  await store.loadLocal();

  // 미페어 상태(소급 누락·오프라인 온보딩)면 이 시점에 1회 페어링 재시도
  if (useArcCoreShadowIdentityStore.getState().status !== 'paired') {
    await runArcCoreShadowPairingPass();
  }

  const s = useArcCoreShadowIdentityStore.getState();
  if (s.revealedAtMs != null) return;

  let nickname = s.shadowNickname;
  if (!nickname && s.shadowUid) {
    nickname = await fetchArcCoreShadowNickname(s.shadowUid);
  }

  if (nickname) {
    s.markRevealed(nickname);
    await useArcCoreShadowIdentityStore.getState().persistLocal();
    showArcAlert(
      t('arcCoreShadow.reveal.title'),
      t('arcCoreShadow.reveal.message', { nickname }),
      undefined,
      { id: 'arc_core_shadow_reveal', autoDismissMs: 0 },
    );
    return;
  }

  // 페어 미확정(대기 중·오프라인) — 정체 미관측 연출, 공개 플래그는 남기지 않는다(재도전 시 재시도)
  showArcAlert(
    t('arcCoreShadow.reveal.title'),
    t('arcCoreShadow.reveal.unobserved'),
    undefined,
    { id: 'arc_core_shadow_reveal', autoDismissMs: 0 },
  );
}

/**
 * 전투 종료 훅 — 본진 행성에서 플레이어 승리 시 섀도우 정체 공개.
 * 동기 비용: 행성 id 비교 + 플래그 체크뿐 (본진 외 전투는 즉시 return).
 */
export function maybeTriggerArcCoreShadowRevealOnCombatVictory(
  planetId: string | null | undefined,
  playerWon: boolean,
): void {
  if (!playerWon) return;
  if (planetId !== ARC_CORE_SHADOW_HOME_BASE_PLANET_ID) return;
  if (revealInFlight) return;
  const s = useArcCoreShadowIdentityStore.getState();
  if (s.loaded && s.revealedAtMs != null) return;
  revealInFlight = true;
  setTimeout(() => {
    void revealShadowIdentity().finally(() => {
      revealInFlight = false;
    });
  }, 0);
}
