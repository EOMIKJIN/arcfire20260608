// ============================================================
// 실시간 전투 — 60fps+ 유지를 위한 설계 원칙 (구현은 타 모듈에 분산)
// ============================================================
//
// [시뮬 vs 렌더]
// - 시뮬: BATTLE_FIXED_DT_MS 고정 스텝 + accumulator(simClock). 렌더 Hz 와 분리.
// - 렌더: 가변 프레임; 상태는 SoA 버퍼에서 읽기만 (battleArenaBuffers).
//
// [수백 개 마름모(◇)]
// - React Native View 를 엔티티마다 두지 말 것 (수백 View = 프레임 드랍 위험).
// - 권장: 단일 Skia Canvas / Metal 배치 드로우 / 네이티브 뷰 1개 + GPU 인스턴싱.
// - 차선: 단일 react-native-svg 의 다중 <Polygon> 도 비용 큼 → 가능한 한 경로 통합.
//
// [무기 연출 — 이미지 없음]
// - 레이저: 세그먼트 + 두께 + core/glow RGB (weaponVisualDefaults).
// - 미사일: 꼬리 점 배열 상한(trailMaxPoints) + 색.
// - 전자파(EMP): 동심 링 개수·지속시간·색 (벡터 원/다각형).
//
// [광원]
// - BattleLightingFlags 비트로 켜고 끄기. 기본은 꺼두고 프로파일 후 단계적 활성화.
//
// [GC / 할당]
// - 풀: BattleIndexPool. 버퍼: 시작 시 createBattleArenaBuffers 한 번.
// - 런타임에 new[]/map 대량 생성 금지. 이펙트도 별도 고정 길이 버퍼 권장.
//
// [확장]
// - 시뮬 무거우면: Hermes isolate / native module 로 SoA 만 전달하는 파이프 검토.
// - 네트워크 전투: 입력 지연 + 롤백은 별도 레이어에서 이 accumulator 위에 얹을 것.
//
// ============================================================

import {
  BATTLE_FIXED_DT_MS,
  BATTLE_MAX_ENTITIES,
  BATTLE_MAX_WEAPON_VISUALS,
  BATTLE_MAX_SIM_STEPS_PER_FRAME,
  BATTLE_TARGET_SIM_HZ,
} from './battleConstants';

/** 번들/도구에서 설계 상수를 한 번에 읽기 위한 스냅샷 */
export const BATTLE_ARCHITECTURE_SNAPSHOT = {
  targetSimHz: BATTLE_TARGET_SIM_HZ,
  fixedDtMs: BATTLE_FIXED_DT_MS,
  maxEntities: BATTLE_MAX_ENTITIES,
  maxWeaponVisuals: BATTLE_MAX_WEAPON_VISUALS,
  maxSimStepsPerFrame: BATTLE_MAX_SIM_STEPS_PER_FRAME,
} as const;
