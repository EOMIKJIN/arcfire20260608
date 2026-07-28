# 김팀장 전수검증 — ArcCore 분쟁·점령·소유권 프로세스 일관성·효율 (2026-07-28)

> **요청**: 대표님 — 누적 분쟁/점령/소유권 + 최근 플레이어 간섭·우선순위가 **일관·연동**되는지 검증 · 주기적 점유 변경이 핵심 · 메모리/불필요 코드 집중 검수 · 효율 최적화  
> **본 세션**: 유료 모델 게이트(Composer) → **src 패치 없음** · 검증 리포트 + 김클로드 READY 발령  
> **task_id (후속)**: `territorial-stack-consistency-opt-20260728`

---

## 1. 총평 (한 줄)

**자동 분쟁↔점령 골격은 살아 있고**, 최근 P0(중립 인접)·소유권 중립화·독립국 침공·FrontPressure가 **같은 패스에 대부분 연동**된다.  
다만 **우선순위 문서 vs 실행 계층이 여전히 이중**이고, **캠페인 희석·status_quo·시드 그래프 검증·정책 목록 재빌드·죽은 상수**가 효율·일관성을 깎는다. 「모든 행성이 주기적으로 전략에 따라 바뀐다」는 체감은 **캠페인 1h×N곳 순차** 구조상 원래부터 제한적이다.

| 축 | 판정 |
|----|------|
| 분쟁 지역 구분 (CSV+동적) | ✅ 동작 |
| 1h 순차 점령 판정 | ✅ 동작 · ⚠️ N↑ 시 희석 |
| 중립 인접 P0 | ✅ 배선됨 · ⚠️ battle일 때만 |
| 플레이어 독립국 | ✅ 별도 침공 분기 · 주둔 억지 |
| 소유권·시드 reconcile | ✅ neutralizedAt / independent skip |
| geo-flank CSV vs P0 | ✅ P0가 중립에서 덮음 · DEV graph warn은 잔존 노이즈 |
| 메모리/핫패스 | ⚠️ 정책 배열 매 호출 재생성 · 시드 그래프 O(연결×시드행) · dead 상수 |
| 프로세스 단일 정본 문서 | ❌ 코드에 산재 · 통합 assert 부족 |

---

## 2. 현재 실행 파이프라인 (1회 probe → 행성 1곳)

```text
ArcCoreTerritorialCombatSubCore (60s probe, onBoot 지연)
  ├─ hydrate territorial state + dynamic contested
  ├─ ensure preview schedule
  ├─ hydrate governor + clanWar (필요 시)
  └─ runTerritorialCombatPass
        ├─ campaign 그룹별 due 1행성 (draco_front · 3600s)
        └─ runTerritorialCombatPassForPlanet
              ① DEV: CSV combatMode vs 시드그래프 (경고만)
              ② INDEPENDENT? → 침공 분기 (주둔억지·보급 최다 적대)
              ③ rollDecision: battle 58% / neutral_declare 12% / status_quo 30%
              ④ status_quo / neutral_declare → 점유 거의 불변 (이미 중립이면 무변)
              ⑤ battle:
                   supplyAdjacency(런타임 holds 1홉)
                   effectiveCombatMode = P0(NEUTRAL만)  ← 2026-07-28
                   blue/red_neutral → dominantSideWeightPct(~70%)
                   blue_red → 퀵컴뱃 + 보급 mul + (선택) 전술 역전
                   applyArcCoreTerritorialHold → FrontPressure invalidate
```

**분쟁 vs 점령 구분**

| 개념 | 정본 | UI |
|------|------|-----|
| 분쟁(순환 판정 대상) | policy `contestedZone` + 동적 편입 | 맵 링 = **다음 예고 1곳** |
| 점유(팩션) | `planetHolds.occupierClanId` | Voronoi·국가 라벨 |
| 소유권(증서) | `deedOwner` / `player_independent` | 플레이트·구매 |

---

## 3. 의도 우선순위 vs 실제

| 순위 | 대표님·김팀장 의도 | 실제 코드 |
|------|-------------------|-----------|
| P0 | 중립 + 적국 미인접 → 인접 팩션 고확률 | ✅ `resolveEffectiveTerritorialCombatMode` → battle 시 dominant 70% |
| P0b | 플레이어 독립국 보호/침공 규칙 | ✅ INDEPENDENT 조기 분기 (P0 인접 오버라이드 **비적용** — 의도 OK) |
| P1 | CSV combatMode / geo-flank | ✅ 비중립·고립·접전 폴백 |
| P2 | battle / status_quo / neutral_declare | ✅ **P0보다 바깥** — status_quo면 P0 미실행 |
| P3 | FrontPressure 빈도·보급 mul | ✅ aggressive 시 창 내 추가 판정 |
| P4 | 전술 역전 | ✅ contestedZone |

**일관성 갭 (중요)**  
P0는 「우세 축」만 고치고, **「이번 패스에 싸울지」**는 여전히 P2가 먼저다.  
→ 중립+블루만 인접이어도 `status_quo`(≈30%)면 **점유 불변**. 규칙과 체감이 어긋날 수 있음.

---

## 4. 중첩·데드·노이즈

| 항목 | 상태 | 조치 권고 |
|------|------|-----------|
| `DRACO_FRONT_CAMPAIGN_PLANET_ORDER` (3행성만) | **dead** · CSV가 정본(5+) | 삭제 또는 CSV 정렬 assert · 주석 「미사용」 |
| 시드그래프 `validateTerritorial…` every pass | DEV warn · P0와 어긋남 일상화 | effective 기준 비교 or DEV 끄기/샘플링 |
| `blue_red` 내부 보급 공격자 확정 vs P0 | 중복이나 **모순 없음**(effective가 먼저 갈래) | 문서화 유지 |
| geo-flank CSV 고정 + P0 런타임 | 의도적 이중 | OK · graph warn만 정리 |
| `listTerritorialCombatPolicies()` | 호출마다 `[...csv, ...dyn]` **신규 배열** | revision 캐시 |
| `isContestedZoneSystemId` | dyn에 `.includes` O(n) | Set |
| `resolveAdjacentSystemFactionPresence` | 연결×시드행 전수 | systemId→owner 인덱스 1회 |
| `resolveSystemPrimarySide` | holds 전 키 스캔 | system→planets 인덱스(선택) |
| worldmap preview | 60s 타이머 + revision — 양호 | 유지 |
| probe 매 60s hydrate×N | hydrated 플래그로 대개 no-op | OK |

---

## 5. 「주기적 점유 변경」 실측 구조

| 파라미터 | 값 |
|----------|-----|
| probe | 60s (실제 due는 3600s 게이트) |
| 캠페인 | **1h에 1행성** |
| 정적 멤버 | 5 (geo-flank 후) + 동적 |
| 타이탄 재판정 주기 | ≈ **5h+** (동적 늘면 더 김) |
| battle 확률 | ≈58% → 그중 dominant 70% |

**결론**: 시스템은 「전 행성 동시 재배치」가 아니라 **전선 순차 로테이션**.  
체감 최적화가 필요하면 (기존값 변경·승인 후) battle↑ / 캠페인 병렬 / aggressive 슬롯 분리 — **본 READY 1차에서는 밸런스 CSV 수치 무단 변경 금지**, 구조·효율만.

---

## 6. 소유권·플레이어 간섭 연동 체크

| 시나리오 | 연동 |
|----------|------|
| 구매 → independent | ✅ hold kind · FrontPressure invalidate · 동적 분쟁 promote 가능 |
| 독립국 + 플레이어 주둔 | ✅ 침공 보류 |
| 계정 purge | ✅ independent → neutral+neutralizedAt (REVIEWED) |
| 시드 reconcile | ✅ independent / neutralizedAt skip |
| 독립국에 P0 인접 오버라이드 | ❌ 비적용 (국가전 규칙 유지 — OK) |

---

## 7. 최적화 1안 (김클로드 범위)

**목표**: 프로세스 **정본 문서+회귀 테스트**로 일관성 고정 · **핫패스/데드코드** 제거 · **밸런스 수치·CSV combatMode 무단 변경 없음**.

자세한 작업 단위 → `kim-claude-ready-territorial-stack-consistency-opt.md`
