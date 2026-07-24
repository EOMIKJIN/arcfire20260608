// ============================================================
// 아크코어 판테온 12좌 — 최종 게이트 STUB (Phase E, 미구현)
//
// 이 파일은 자리·타입만 예약한다. 스토리모드 진입·전체 리셋 등 실제 최종
// 게이트 로직은 이후 별도 승인·구현(Phase E) 전까지 절대 실행하지 않는다.
// 어떤 SubCore onWallTick·부트 경로에서도 호출하지 말 것.
// ============================================================

/** 최종 게이트 진행 상태 — 현재는 예약 타입일 뿐, 실제 저장/전이 로직 없음(기본 pending 고정) */
export type ArcCoreFinalGateFlag = 'pending' | 'armed' | 'triggered';

/**
 * 본체+서브코어 거점 전점유 판정 자리 — Phase E 전까지 **항상 false**.
 * (유물 도감 해금 ≠ 행성 점유. 혼동 금지. 호출부 없음.)
 */
export function onArcCoreWorldNodesAllPlayerOwned(): boolean {
  return false;
}
