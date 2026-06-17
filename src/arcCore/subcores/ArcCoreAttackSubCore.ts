// ============================================================
// 아크코어 통합 공격 서브코어 — 구조 골격 (기반작업)
// 3종 공격(inbound_drone / orbit_raid / transit)을 단일 서브코어로 수렴시키기 위한 뼈대.
//
// ⚠️ 아직 registerDefaultArcSubCores 에 미등록 → 부트/게임루프에 진입하지 않으며
//    런타임 프레임·메모리·성능에 전혀 영향 없음(완전 inert).
//
// 추후 단계(실제 반영):
//  1) registerDefaultArcSubCores 에 등록
//  2) onWallTick 에서 카테고리별 디스패치(드론 스폰은 resolveEffectiveInboundDronePolicy 경유)
//     — onWallTick 은 zero/low-allocation 유지(arcfire-skia-memory-lifecycle / 틱 메모리 규율)
//  3) 행성별 레벨은 resolvePlanetAttackLevel 로 조회, 동시객체는 ARC_ATTACK_SAFETY 상한 준수
// ============================================================

import { ARC_ATTACK_LEVEL_BASELINE } from '../planetAttack/arcCoreAttackModel';
import { getArcCorePlanetAttackLevelPolicy } from '../planetAttack/arcCorePlanetAttackLevelPolicy';
import { BaseArcSubCore } from './BaseArcSubCore';

export class ArcCoreAttackSubCore extends BaseArcSubCore {
  constructor() {
    super('arc_attack_subcore', 'ArcCore Attack');
  }

  override onBoot(): void {
    // 정책 인덱스 워밍만(경량, 전 행성 루프 없음) — 부트 프레임 차단 금지.
    void getArcCorePlanetAttackLevelPolicy(ARC_ATTACK_LEVEL_BASELINE);
  }

  // onWallTick 미정의: 등록 전까지 틱 작업 없음(메모리/프레임 무영향).
}
