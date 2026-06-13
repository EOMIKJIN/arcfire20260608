# Arcfire Online — 경제·무역 생태계 참고 자료 v3.1

> **문서 상태**: 🚀 v3.1 Master Spec 호환 검수 완료
> **변경 요약**: 실시간 시장 탄력이 없음을 아키텍처 스펙으로 공식 확정(`price_elasticity=0`).

## 1. 설계 비전 (싱글 샌드박스 경제)
행성별 **레벨 밴드 진열** + **플레이어 성장 레벨 구매 게이트** + **행성 간 SKU 중복** + **생산·소비·거리 차익**이 어우러진 RPG 하이브리드 무역 시스템.

## 2. 아키텍처 (일 1회 배치)
- 실시간 시장 변동(플레이어의 대량 매매에 즉각적인 가격 폭등/폭락 발생)은 ❌ 지원하지 않습니다. (System Rule 14)
- **모든 시장 탄력 및 가격 동기화는 일 1회 12:00 `runArcCoreDailyOpsBatch()` 내 `runPlayScenarioEconomyPass()`를 통해서만 이루어집니다.**
- `price_elasticity=0`가 기본 정책입니다. 시장 충격은 일괄 평가하여 다음 날 시세로 반영합니다.

## 3. 핵심 코드·CSV 인덱스
- `tradePortCatalogPolicy.ts`, `tradeRouteCommercePolicy.ts`를 통해 Map O(1) 조회를 수행합니다. (System Rule 7 준수)
- 구매/판매 진열은 행성 zone 권장 레벨을 따르며, 실제 구매 가능 여부는 플레이어의 파일럿 레벨과 장비 제한 레벨에 따라 클라이언트에서 필터링합니다.

## 4. 행성·무역 허브 현황
- `planets.csv` 기준 21행성 중 17곳이 무역소 보유.
- 무역소 없음 (4곳): 군사 전초(`vega_base`), 고대 유적(`titan_ruins`), 심연 관문(`abyss_gate`), 엔드 왕좌(`eternal_throne`).
