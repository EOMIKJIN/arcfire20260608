# 은하계 경제·아크코어·수송선단 — 최종 전수 보고서 · 수정안 (2026-10-03)

```text
task_id=economy-total-audit-final-20261003
작성=김팀장(글록 4.6) 주도 · 김클로드 리포트 대조 · 김클로드 협의 AGREE/PARTIAL
정본 단독본=본 파일
김클로드 단독=tools/kim-team-lead/reports/kim-claude-economy-full-audit-20261003.md
근거=실기 RKStorage(10/03 00시대 배치 직후) · audit:balance-ops 10/02 15:12Z · 3h 재가동 10/03 WARN · 코드·08-25 재정 구조
상태=대표님 1·2 승인 · 김클로드 PROCEED · Wave 2 E4·E2 적용(커밋 없음).
```

```text
[pss-pre-dev] hot_path=일1회 배치 게이트·일1줄 원장 · alloc=신규 persist 1행/일/금고 · cache=없음
[pss-pre-dev] stage=월드 경제(부트 전행성 패스 추가 금지) · risk=P6(원장 bounded만)
[pss-pre-dev] verdict=PASS — 본 문서는 설계·검수. Wave 1은 persist 상한 전제.
```

---

## 0. 한 줄 종합

엔진은 **돌아가고 있다.** 실시간 인플레(`price_elasticity=0`)·플레이어 Whale/F2P(3.12 ok)는 문제 없다.  
다만 **정오 계약이 자정에 새고**, **개발 예산이 매일 천만 단위로 선소각**되며, **수송 금고는 시드 대비 과다**(오펙스가 이미 94M→25.7M로 깎은 상태라 즉시 환류는 하지 않음), **감시가 6주 끊겼다.**  
플레이어 지갑 인플레는 없다(Lv2 · 2,402 cr). 월드 금고 쪽 불균형이다.

| 축 | 판정 | 한 줄 |
|----|------|--------|
| 헌법(일 1회·탄력 0·onSnapshot 없음) | **계약 위반 1** | 배치가 자정에 돔(E1). 코드 선반영 검수 PASS |
| 플레이어 인플레 | **없음** | Whale/F2P 3.12 · 지갑 얇음 |
| 월드 통화(선단·RED) | **과다·부분 회수 중** | 선단 2,575만(시드 50만) · 08-05 실기 94M보다 **감소** |
| 정체 | **SIM·지표** | overlay delta 2026-07-02 고정 · `windowTradeGross`는 플레이어만 |
| 미운용 | **있음** | convoy `core_prime`·`nightfall_citadel` 실패 · 개발 사용 0 |
| 감시 | **복구됨(도구)** | 3h 6주 공백 → stub 후 WARN |

---

## 1. 협의 대조 (김클로드 E1–E9 + 김팀장 E10)

| ID | 김클로드 | 김팀장 | 협의 | 채택 |
|----|----------|--------|------|------|
| E1 자정 배치 | P0 | P0 AGREE | AGREE | Wave 0 선반영 **채택** |
| E2 선단 64배 | P0 · 안 A 환류 | PARTIAL | PARTIAL | **즉시 A 기각.** 3일 관측 후 opex/상한 |
| E3 3h 공백 | P0 | P0 AGREE | AGREE | Wave 0 선반영 **채택** |
| E4 개발 선소각 | P1 · 안 A 환급 | AGREE | AGREE | Wave 2 · 익일 **환급**(이월 금지) |
| E5 지표 0 / SIM | P1 | PARTIAL | PARTIAL | KPI 이름·배선 · 통제시험 · `sim:economy` 보류 |
| E6 블루 ~10만 | P1 | PARTIAL | PARTIAL | 버그 아님. E9 이후 P2 |
| E7 밴드 CPH | P1 | AGREE · P0 아님 | PARTIAL | Wave 3 · **감사식 먼저**(가격 CSV 금지) |
| E8 재정 WARN | P2 | PARTIAL | PARTIAL | 관측. 문턱 미달(warn≥20×) |
| E9 txn 120 | P2 | AGREE | AGREE | Wave 1 · 일 1줄 요약(캡 상향 금지) |
| E10 convoy 실패 | 3h에만 | 김팀장 추가 | AGREE | Wave 1 진단. E2 관측 **이후**에 고치면 선단 유입↑ |

김클로드 권고 안 A(선단→RED 환류)는 **기각.** `red_dividend_pct=0` 유지(08-25 잠금).  
08-19 「39.9만→64배」는 헤드리스 3h와 실기 혼합. 실기 08-05 수송 **94,251,851** → 10/03 **25,754,079**(오펙스 라이브 후 감소).

---

## 2. 실측 (10/03 00시대 · 김클로드 기기 스냅)

| 금고 | 잔액 | 시드 | 비고 |
|------|------|------|------|
| 수송선단 | 25,754,079 | 500,000 | 51배. 유입 1.33억 / 유출 1.07억 |
| 아크코어 RED | 16,994,553 | 100,000 | 당일 `dev_lock` −10,090,020 |
| 중립 | 5,455,463 | 0 | 수수료 유입 |
| 블루 | 92,772 | 100,000 | 오펙스가 초과분 흡수. 직전 348k |
| 독립국 | 0 | — | 미구매 |
| 플레이어 | 2,402 | — | Lv2 |

오펙스 스냅: 요청 11,141,873 → 실지출 11,015,847 · `shadow_mode=false`.  
3h 재가동(헤드리스): convoy **17/19** 실패 `nightfall_citadel`, `core_prime` · fiscal max **3.07×** · deficit 5.

오늘 00:04 배치는 E1 버그로 돈 것. E1 채택 후 같은 날 12:00에 **한 번 더** 돌 수 있음(완료 키가 10/03이면 그날은 스킵).

---

## 3. 최종 수정안 (1안)

### Wave 0 — 선반영 채택 (이미 워킹트리 · 커밋은 대표님 지시 시)

| ID | 내용 | 검수 |
|----|------|------|
| E1 | `shouldRunArcCoreDailyBatch`: 어제 완료면 **12:00 KST 이후**만. 이틀+ 누락만 즉시 보정 | 테스트 6 PASS · 김팀장 REVIEWED |
| E3 | `tools/headless/firebase-stub.cjs` + `tsconfig.headless.json` `@react-native-firebase/*` | 앱 코드 0 · 3h WARN 재가동 |

되돌리지 않음. 앱 핫패스 할당 없음.

### Wave 1 — 김팀장 구현 (기존값 0 · 대표님 「진행」 시)

1. **E9 일 단위 금고 요약 원장**  
   - 일 1회 배치 말미: 금고 5축 `잔액·유입·유출·주요 kind 합` 1행.  
   - persist 키 1개 · 이력 캡 **≤45일**. txn 배열 120 **올리지 않음**.
2. **E10 convoy 실패 진단**  
   - `core_prime` · `nightfall_citadel` — stock=0 / 시세≤0 / 순익≤0 중 어디인지 로그만.  
   - **시드·가격 CSV 변경은 진단 후 재확인.** 고치면 선단 순유입이 늘 수 있어 E2 관측 창과 겹치지 않게.
3. **E5 지표**  
   - KPI 필드 의미 고정: `windowTradeGross` = **플레이어 무역소 총액**(convoy 제외).  
   - 학습 로그에 `windowConvoyProfit`을 같이 노출.  
   - 통제시험: 대표님 무역소 판매 1회 → **다음 정오 배치** 후 KPI(자정 배치와 섞지 않음).  
   - `npm run sim:economy` **이번 Wave 금지**(overlay 기존값).

### Wave 2 — 대표님 승인 · 적용 (2026-10-03)

| ID | 결정 | 구현 |
|----|------|------|
| **E4** | 미사용 개발비 → **다음날 RED 금고 누적**(예산 풀 이월 없음) | `resolvePlanetDevBudgetRefundCredits` → `appendInflow` kind=`fiscal_opex_dev_refund` 후 당일분만 재선지출. `prepaidFromVault`만 환급(이중 발행 금지) |
| **E2** | 선단이 늘면 운용비 **비례 상승** | 고정 2% 유지 금지. `resolveFleetOpexOfSurplusPct` = 2 + floor((mul−10)/10) · 캡 20. 51배→**6%**. `red_dividend=0`. CSV 2는 하한. 신규 키 `fleet_opex_scale_*` |
| **E6** | 보류 | — |

김클로드: E10 convoy 수정 후 재측을 권고했으나, %가 매일 잔액 배수로 다시 계산되므로 **E10을 기다리지 않음**(고치면 선단↑ → 운용비↑).

### Wave 3 — 감사·관측

- **E7**: 밴드 CPH 식을 「밴드 전 구간 수입」으로 교정해 **과장 여부 판별**. 교정 후에도 크면 별도 READY. 무기 가격 CSV 금지.
- **E8**: 문턱 미달. deficit는 행성별로 분류(E10 미도달 vs `blood_station`/`synth_002_p` 저수익).
- Macro SIM 재실행은 **별도 승인**.

---

## 4. 대표님 결정 (2026-10-03)

1. 미사용 개발비 → 다음날 RED 금고 **누적** → **적용**  
2. 선단이 늘면 운용비 **비례 상승** → **적용** (51배=6%)  
3. 김클로드 협의 **PROCEED** · E10 대기 없음  

---

## 5. 하지 않음

- 실시간 가격 · `price_elasticity`  
- 부트 동기 전행성 경제 패스  
- 금고 txn 캡 120 상향  
- 13번째 서브코어  
- 플레이어 무기 곡선 일괄 덮어쓰기  
- 김경제 세션 코드 수정  

---

## 5-1. 김클로드 검수 (2026-10-03 01:00 · 대표님 지시 「완성되면 김클로드가 검수」)

**판정: AGREE** (정정 수용 1 · 명확화 1 · 구현 유의 3)

| # | 항목 | 검수 |
|---|------|------|
| 1 | **E2 정정 수용** | 김클로드 「8/19 39.9만 → 64배」는 **오류**. 8/19 값은 3h 헤드리스(AsyncStorage stub = 빈 Map → 시드에서 시작) 결과였고 실기와 다른 출처. 실기 08-05 **94,251,851**(`2026-08-05-economy-ops-status-reaudit.md:55`) → 10/03 25,754,079 감소 확인. 안 A 기각·관측 후 조정 AGREE |
| 2 | §2 「12:00 한 번 더 돌 수 있음」 문장 | **명확화 필요** — 기기 `lastBatchCompletedDayKey="2026-10-03"`(RKStorage 01:00 재확인) → 수정 게이트로 **오늘은 재실행 없음**, 다음 배치 10/04 12:00 이후 |
| 3 | Wave 0 재검증 | E1 테스트 6 PASS · client tsc 0 · E3 3h 감사 재실행 WARN 정상 · diff = `arcCoreDailyOpsPolicy.ts`(+9/−3)·`tsconfig.headless.json`(+1)·신규 stub/test |
| 4 | E10 진단 유의 | 3h 헤드리스는 **시드 상태**에서 1일 시뮬 — 실패 행성이 실기와 다를 수 있음(위 #1과 같은 함정). 진단 로그는 **실기 배치 logcat**과 함께 확인. 실기 txn에 `convoy_cap_reject` 14건/0.1h 관측 |
| 5 | E4 구현 유의 | 환급은 `creditArcCorePlanetDevDailyBudget` 새 날짜 분기에서 **lock 전에**, `prepaidFromVault=true`일 때만, RED 금고 `appendInflow(kind='fiscal_opex_dev_refund')`. 같은 날 재호출 시 이중 환급 없게 dayKey 가드 + 테스트 |
| 6 | E9 구현 유의 | 일 1행 요약은 금고 hydrate 완료 후 기록(hydrate 레이스 패턴 회피) · 캡 45 유지 |

Wave 1 착수는 대표님 「진행」 후(김팀장 기록과 동일).

## 6. 교차

- 김클로드 단독: `kim-claude-economy-full-audit-20261003.md`  
- 08-25 구조: `docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md` F2·F3  
- 배치 게이트: `src/arcCore/schedule/arcCoreDailyOpsPolicy.ts`  
- 개발 예산: `src/arcCore/planetDevelopment/arcCorePlanetDevBudgetState.ts`  
