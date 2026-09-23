# Arcfire 전략·전술 시스템 문서 인덱스

> **목적**: 아크코어 자동전투·은하 전략(노드/라인)·전선 확장을 **Table-First + ArcCore 서브코어**로 구조화하기 위한 설계·인수인계 보관소.  
> **헌법 교차참조**: `.cursor/rules/Arcfire_Master_Spec_v4.0-1781368341848295041.mdc` · `AGENTS.md`

---

## 문서 목록

| 문서 | 상태 | 요약 |
|------|------|------|
| **[ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md](../ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md)** | **설계 완료 · 구현 대기** | World/Learning/Player 3계층 · Observation Bus · Policy Pack · Firebase Spark · SubCore 확장 · Phase 0~4 |
| **[WAR_ECONOMY_THEATER_AUDIT_AND_UPGRADE_DESIGN.md](./WAR_ECONOMY_THEATER_AUDIT_AND_UPGRADE_DESIGN.md)** | **v0.2.1 · Phase 0–1.5 착수** | 분쟁 삼중 정의 · 전선 주둔 군비·점령 승리금 · 여파/WDI theater 합류 |
| **[ROUTE_CAPITAL_DEFENSE_ADVANTAGE_DESIGN.md](./ROUTE_CAPITAL_DEFENSE_ADVANTAGE_DESIGN.md)** | **자동 프로세스 반영 · 웨이브 현행** | 4대 항로 수도 방위 우세 · 포위문 · 점유/반란/분쟁 배율 |
| **[ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md](./ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md)** | **분석 완료 · 구현 대기** | 성계 그래프 1홉 공격 규칙 · 접전 자동전투 갭 · 목표 아키텍처 · Phase 0~5 로드맵 |
| **[ARC_CORE_RECON_LURK_SCAN_DESIGN.md](./ARC_CORE_RECON_LURK_SCAN_DESIGN.md)** | **설계 완료 · 구현 대기** | 스캔으로 정찰매복 전함 발견·격파·도주 · 스파이와 별 축 · Phase 0~5 |
| **[ARCFIRE_ACTIVE_ECOSYSTEM_ADOPTION_v1.md](../ecosystem/ARCFIRE_ACTIVE_ECOSYSTEM_ADOPTION_v1.md)** | **검토 완료 · P1 backlog** | Active Ecosystem v1.0 **적용 가능 항목만** · 중복 제거 · 메모리 1차 감사 |
| **[ARCFIRE_CLOUD_SYNC_CONTRACT_v1.md](../ecosystem/ARCFIRE_CLOUD_SYNC_CONTRACT_v1.md)** | **RTDB·Firestore 정본** | policy/learning boot 1× read · ingest 우선순위 · 금지 목록 |
| **[PLANET_DEVELOPMENT_ARC_BRIDGE_SPEC_v0.md](../ecosystem/PLANET_DEVELOPMENT_ARC_BRIDGE_SPEC_v0.md)** | **Tier 0.2 스펙** | 행성개발 bridge · arcContributionCr · opt-in 자동 투자 (구현 전) |
| **[ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md](../ecosystem/ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md)** | **조사·우선순위 정본** | Tier 0~4 · MEM/UX 게이트 |
| 원본 (참고 전용) | `docs/ARCFIRE_ACTIVE_ECOSYSTEM_SPEC_v1_0.md` | 능동형 생태계 **전체 제안** — **엔진·PEV·RTDB는 비채택** |

---

## 에이전트 진입 규칙

다음 키워드·작업 요청 시 **본 README → 해당 정본**을 먼저 읽는다.

- 「정찰매복」「잠복 적」「스캔 고도화」「recon lurk」
- 「전쟁 경제」「분쟁 연동」「로테이션 타임」「여파 스탯」
- 「수도 방위」「수도 어드밴티지」「포위문」「4대 항로 수도」
- 「전술 자동화」「그래프 공격」「1홉 공격」「전선 확장」
- 「아크코어 자동전투」「접전지역」「draco_front」
- 「시리우스→드라코」「노드·라인 규칙」
- 「아크코어 학습」「Observation Bus」「Policy Pack」「World Memory」
- 「능동형 생태계」「Active Ecosystem」「BotEcosystem」「PEV」
- 「확장시스템」「남부·북부 선단」「국가 수송선단」「운영자 병렬」→ **`docs/expansion/README.md`**
- 「Fabric §8」「행성개발 bridge」「Territorial graph」「Learning ingest」→ **`docs/ecosystem/ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md`**
- `AiScenarioRunnerSubCore` · `AiCombatTacticsSubCore` · `arcCoreMemoryRegistry`

---

## 관련 정본 (코드·테이블)

| 영역 | 경로 |
|------|------|
| 성계 그래프 CSV | `tables/content/systems.csv` → `src/data/generated/csvSystems.ts` |
| 점유 시드 | `tables/balance/planet_occupation_seeds.csv` |
| 접전 정책 | `tables/balance/arc_core_territorial_combat_policy.csv` |
| 수도 방위 정책 | `tables/balance/arc_core_capital_defense_policy.csv` |
| 분쟁 여파 스탯 | `tables/balance/contested_zone_stat_aftermath.csv` |
| 전쟁·경제 연동 설계 | `docs/strategy/WAR_ECONOMY_THEATER_AUDIT_AND_UPGRADE_DESIGN.md` |
| 접전 함대 | `tables/balance/arc_core_territorial_fleet_composition.csv` |
| 접전 실행 | `src/arcCore/territorial/` · `ArcCoreTerritorialCombatSubCore` |
| 통합 공격 골격(inert) | `src/arcCore/planetAttack/` · `ArcCoreAttackSubCore` |
| 플레이어 이동 1홉 | `app/(game)/worldmap.tsx` (`reachableIds`) |
| 무역 그래프 BFS | `src/arcCore/economy/tradeRouteDistanceProfit.ts` |
| 점유·작전 | `src/store/clanWarFoundationStore.ts` |
| 미션·인스턴스 전투 | `docs/MISSION_SYSTEM_HANDOFF.md` |
| 경제·월드 fabric | `docs/ARC_CORE_ECONOMY_FABRIC.md` |
| **확장시스템(남·북 선단 병렬 등)** | **`docs/expansion/README.md`** · [아크파이어_확장시스템_설계안.md](../expansion/아크파이어_확장시스템_설계안.md) |
| **지속 학습 모델 v1** | `docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md` |
| 시나리오 catalog spec | `docs/balance/ARC_CORE_SCENARIO_CATALOG_SPEC.md` |

---

## 구현 게이트 (완료 선언 전)

- [ ] `npm run build:balance-tables` (신규 CSV 추가 시)
- [ ] `npx tsc --noEmit -p tsconfig.client.json`
- [ ] (신규 audit 추가 시) `tools/strategy-graph-audit/` PASS
- [ ] v4.0 §14: 고빈도 실시간 HP/밸런스 패스 금지 — probe·passInterval 유지
- [ ] 계정 초기화 분류: 전선 상태 = ArcCore 월드 vs 플레이어 귀속 명시 후 `purgeLocalAccountData` 연동

---

*최종 갱신: 2026-09-14*
