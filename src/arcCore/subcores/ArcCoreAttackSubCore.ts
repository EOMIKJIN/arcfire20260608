// ============================================================
// 아크코어 통합 공격 서브코어 — 구조 골격 (기반작업)
// 3종 공격(inbound_drone / orbit_raid / transit)을 단일 서브코어로 수렴시키기 위한 뼈대.
//
// 판테온 12좌(아테나) — registerDefaultArcSubCores 에 등록됨.
// onWallTick 미정의: 드론/스파이와 이중 틱 금지. onBoot 정책 워밍만.
// 추후: 카테고리 디스패치 수렴 시에만 onWallTick 추가(zero/low-allocation).
// ============================================================

import { ARC_ATTACK_LEVEL_BASELINE } from '../planetAttack/arcCoreAttackModel';
import { getArcCorePlanetAttackLevelPolicy } from '../planetAttack/arcCorePlanetAttackLevelPolicy';
import { BaseArcSubCore } from './BaseArcSubCore';

export class ArcCoreAttackSubCore extends BaseArcSubCore {
  constructor() {
    super('arc_attack_subcore', '아테나 · 통합 공격');
  }

  override onBoot(): void {
    // 정책 인덱스 워밍만(경량, 전 행성 루프 없음) — 부트 프레임 차단 금지.
    void getArcCorePlanetAttackLevelPolicy(ARC_ATTACK_LEVEL_BASELINE);
  }

  // onWallTick 미정의: 등록돼도 틱 작업 없음(메모리/프레임 무영향).
}
