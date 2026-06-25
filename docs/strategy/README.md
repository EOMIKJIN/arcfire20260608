# Arcfire 전략·전술 시스템 문서 인덱스

> **목적**: 아크코어 자동전투·은하 전략(노드/라인)·전선 확장을 **Table-First + ArcCore 서브코어**로 구조화하기 위한 설계·인수인계 보관소.  
> **헌법 교차참조**: `.cursor/rules/Arcfire_Master_Spec_v4.0-1781368341848295041.mdc` · `AGENTS.md`

---

## 문서 목록

| 문서 | 상태 | 요약 |
|------|------|------|
| **[ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md](./ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md)** | **분석 완료 · 구현 대기** | 성계 그래프 1홉 공격 규칙 · 접전 자동전투 갭 · 목표 아키텍처 · Phase 0~5 로드맵 |

---

## 에이전트 진입 규칙

다음 키워드·작업 요청 시 **본 README → 해당 정본**을 먼저 읽는다.

- 「전술 자동화」「그래프 공격」「1홉 공격」「전선 확장」
- 「아크코어 자동전투」「접전지역」「draco_front」
- 「시리우스→드라코」「노드·라인 규칙」
- `ArcCoreTerritorialCombatSubCore` · `GalaxyTacticalGraph` (신규) 확장

---

## 관련 정본 (코드·테이블)

| 영역 | 경로 |
|------|------|
| 성계 그래프 CSV | `tables/content/systems.csv` → `src/data/generated/csvSystems.ts` |
| 점유 시드 | `tables/balance/planet_occupation_seeds.csv` |
| 접전 정책 | `tables/balance/arc_core_territorial_combat_policy.csv` |
| 접전 함대 | `tables/balance/arc_core_territorial_fleet_composition.csv` |
| 접전 실행 | `src/arcCore/territorial/` · `ArcCoreTerritorialCombatSubCore` |
| 통합 공격 골격(inert) | `src/arcCore/planetAttack/` · `ArcCoreAttackSubCore` |
| 플레이어 이동 1홉 | `app/(game)/worldmap.tsx` (`reachableIds`) |
| 무역 그래프 BFS | `src/arcCore/economy/tradeRouteDistanceProfit.ts` |
| 점유·작전 | `src/store/clanWarFoundationStore.ts` |
| 미션·인스턴스 전투 | `docs/MISSION_SYSTEM_HANDOFF.md` |
| 경제·월드 fabric | `docs/ARC_CORE_ECONOMY_FABRIC.md` |

---

## 구현 게이트 (완료 선언 전)

- [ ] `npm run build:balance-tables` (신규 CSV 추가 시)
- [ ] `npx tsc --noEmit -p tsconfig.client.json`
- [ ] (신규 audit 추가 시) `tools/strategy-graph-audit/` PASS
- [ ] v4.0 §14: 고빈도 실시간 HP/밸런스 패스 금지 — probe·passInterval 유지
- [ ] 계정 초기화 분류: 전선 상태 = ArcCore 월드 vs 플레이어 귀속 명시 후 `purgeLocalAccountData` 연동

---

*최종 갱신: 2026-06-25*
