// ============================================================
// 웨이브 트리거 순수 판정 — 스토어/CSV/RN 조회 없음.
// 입력 수집은 resolvePlanetWaveCombatTrigger가 담당한다.
// ============================================================

export type PlanetWaveCombatTriggerRule =
  | 'csv_variant'
  | 'planet_assault'
  | 'chat_armed'
  | 'territorial_turn'
  | 'victory_cooldown'
  | 'not_sequential_contested'
  | 'draco_combat_test'
  | 'quest_hub_orbit_hold'
  | 'none';

export type PlanetWaveCombatTrigger = {
  enabled: boolean;
  rule: PlanetWaveCombatTriggerRule;
  variant: string;
};

export type PlanetWaveCombatTriggerInputs = {
  variant: string;
  onSequentialList: boolean;
  stayBlocked: boolean;
  assaultActive: boolean;
  cooldownActive: boolean;
  /** 분쟁 순차 차례 + 체류 — 허브 웨이브로 이관된 due */
  territorialTurnPending: boolean;
  /** 채팅으로 지정한 진입 전투 — 점유/CSV 변경 없음 */
  chatArmedPending?: boolean;
  /** hub_orbit 퀘스트 락 — 분쟁/어썰트/채팅 웨이브를 보류(pending 소거 아님) */
  questHubOrbitHold?: boolean;
};

const WAVE_TRIGGER_VARIANTS: readonly string[] = ['draco_wave', 'endgame_boss'];
const ENDGAME_BOSS_VARIANT = 'endgame_boss';

/**
 * 우선순위: 분쟁 차례 체류 > 쿨다운 > RED [전투] 공격 진입(ActivePool 무관) > endgame_boss.
 * 순차 리스트 착륙 자동 웨이브(csv_variant)는 폐지 — 차례가 오면 territorial_turn 만 발화.
 */
export function evaluatePlanetWaveCombatTrigger(
  input: PlanetWaveCombatTriggerInputs,
): PlanetWaveCombatTrigger {
  const {
    variant,
    onSequentialList,
    stayBlocked,
    assaultActive,
    cooldownActive,
    territorialTurnPending,
    chatArmedPending,
    questHubOrbitHold,
  } = input;

  if (questHubOrbitHold && variant !== ENDGAME_BOSS_VARIANT) {
    if (territorialTurnPending || (assaultActive && stayBlocked) || chatArmedPending) {
      const holdVariant = WAVE_TRIGGER_VARIANTS.includes(variant) ? variant : 'draco_wave';
      return { enabled: false, rule: 'quest_hub_orbit_hold', variant: holdVariant };
    }
  }

  // 분쟁 차례 + 체류 — 30분 승리 쿨다운보다 선행(20분 캠페인 창이 막히지 않게)
  if (territorialTurnPending) {
    const waveVariant = WAVE_TRIGGER_VARIANTS.includes(variant) ? variant : 'draco_wave';
    return { enabled: true, rule: 'territorial_turn', variant: waveVariant };
  }

  if (cooldownActive) {
    return { enabled: false, rule: 'victory_cooldown', variant };
  }

  if (assaultActive && stayBlocked) {
    // RED [전투] 진입은 ActivePool(순차 리스트) 선행 조건 아님 · 전투 후 동적 편입
    const waveVariant = WAVE_TRIGGER_VARIANTS.includes(variant) ? variant : 'draco_wave';
    return { enabled: true, rule: 'planet_assault', variant: waveVariant };
  }

  if (chatArmedPending) {
    const waveVariant = WAVE_TRIGGER_VARIANTS.includes(variant) ? variant : 'draco_wave';
    return { enabled: true, rule: 'chat_armed', variant: waveVariant };
  }

  if (variant === ENDGAME_BOSS_VARIANT) {
    return { enabled: true, rule: 'csv_variant', variant };
  }

  if (WAVE_TRIGGER_VARIANTS.includes(variant) && !onSequentialList) {
    return { enabled: false, rule: 'not_sequential_contested', variant };
  }

  return { enabled: false, rule: 'none', variant };
}
