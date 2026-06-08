// ============================================================
// 실시간 전투 — 성능·규모 상수 (D20 턴제 엔진과 별도)
// ============================================================

/** 시뮬레이션 목표 Hz (렌더 프레임과 분리) */
export const BATTLE_TARGET_SIM_HZ = 60;

/** 고정 시뮬 스텝(ms). accumulator 로 여러 번 돌릴 수 있음 */
export const BATTLE_FIXED_DT_MS = 1000 / BATTLE_TARGET_SIM_HZ;

/**
 * 마름모(◇) 대체 엔티티 상한 — React View N개가 아니라 배치 드로우 전제
 * (Skia / 단일 Canvas / 네이티브 배치 등에서 한 번에 그릴 슬롯 수)
 */
export const BATTLE_MAX_ENTITIES = 640;

/** 레이저/미사일/EMP 등 시각 이펙트 슬롯 (엔티티와 별도 풀) */
export const BATTLE_MAX_WEAPON_VISUALS = 256;

/** 한 프레임에 허용할 시뮬 서브스텝 상한 (스파이럴 방지) */
export const BATTLE_MAX_SIM_STEPS_PER_FRAME = 5;
