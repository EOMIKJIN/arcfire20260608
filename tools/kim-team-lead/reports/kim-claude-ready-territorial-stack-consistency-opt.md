# 김클로드 착수 — ArcCore 분쟁·점령 스택 일관성 고정 + 효율 최적화

> **배정**: 김팀장 · **2026-07-28**  
> **근거**: `tools/kim-team-lead/reports/TERRITORIAL_STACK_CONSISTENCY_AUDIT_20260728.md`  
> **대표님**: 분쟁/점령/소유권 누적 시스템 + 최근 우선순위·플레이어 간섭의 **일관성·연동** 검증 · 주기 점유 변경이 핵심 · 메모리/불필요 코드 검수 · 효율 최적화  
> **김클로드 즉시 착수** · handoff **PENDING** · **git commit 금지**  
> **task_id**: `territorial-stack-consistency-opt-20260728`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_probe_60s·pass_1h · alloc=정책목록캐시·시드인덱스1회 · cache=revision
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱전량재스캔금지)·P6(persist빈도유지)
[pss-pre-dev] verdict=PASS — 밸런스CSV수치무단변경금지·순수캐시/데드코드/문서·회귀테스트
```

---

## 0. 범위 고정

### ✅ 한다 (구조·효율·검증)

| # | 내용 |
|---|------|
| **M0** | 감사 문서 §2 파이프라인·우선순위 표를 `docs/strategy/…`에 **「실행 정본 §6-3」** 로 짧게 이식(감사 파일 교차참조). P0 인접 / P2 rollDecision / 독립국 분기 순서 **한 다이어그램** |
| **M1** | **데드 상수** `DRACO_FRONT_CAMPAIGN_PLANET_ORDER` — 미사용 확인 후 **삭제** 또는 `listTerritorialCombatPoliciesForCampaign('draco_front')`와 **길이·순서 assert 테스트**만 남기고 상수 제거. CSV가 정본임을 주석 |
| **M2** | `listTerritorialCombatPolicies` / campaign 필터 — **revision 캐시**(동적 contested promote/reset·policy invalidate 시에만 재빌드). `isContestedZoneSystemId` dyn **Set** |
| **M3** | `territorialCombatGraph.resolveAdjacentSystemFactionPresence` — systemId→seedOwner **모듈 1회 인덱스**(시드 전행 이중 루프 제거). DEV `validateTerritorial…`는 **effective 도입 이후 노이즈** → (a) battle 직전 effective와 비교하거나 (b) `__DEV__` 샘플/끄기 — **패스 로직 변경 없이 warn만 정리** |
| **M4** | 회귀 테스트 패키지 `territorialStackConsistency.test.ts` (또는 분산): (1) NEUTRAL+블루만 → effective blue_neutral (기존 재사용 OK) (2) INDEPENDENT면 effective 경로 미사용(조기 return 존재 정적/단위) (3) campaign 목록이 CSV order 정렬 (4) dead 상수 없음 (5) `listTerritorialCombatPolicies` 연속 2회 **동일 참조**(캐시 hit) — M2 후 |
| **M5** | (선택) FrontPressure `resolveSystemPrimarySide` — holds를 systemId 버킷으로 한 번 그루핑하는 헬퍼(재계산 시에만). **틱당 전은하 스캔 도입 금지** |

### ❌ 하지 않는다

- `battleWeightPct` / `statusQuoWeightPct` / `dominantSideWeightPct` **기존 CSV 수치 변경**
- geo-flank helios/titan **combatMode 행 변경**
- 캠페인 「1h 1행성」을 다행성 동시 판정으로 바꾸는 대형 리팩터 (별도 승인)
- Skia / STAGE UI / 일일배치
- git commit

---

## 1. 김팀장 검수 포인트

- [ ] 실행 정본 §6-3에 P0→P2 순서·독립국 분기 명시
- [ ] dead `DRACO_FRONT_CAMPAIGN_PLANET_ORDER` 정리
- [ ] 정책 목록 캐시 + contested Set · 시드 그래프 인덱스
- [ ] graph DEV warn 노이즈 감소(effective와 정합)
- [ ] unit PASS · tsc PASS · CSV balance **수치 diff 없음**
- [ ] commit 없음

---

## 2. self-check

```bash
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.test.ts
npx tsx --test src/arcCore/territorial/territorialStackConsistency.test.ts
npx tsx --test src/arcCore/territorial/geoFlankHeliosTitanOccupation.test.ts
npx tsx --test src/arcCore/territorial/frontPressureIndex.test.ts
```
