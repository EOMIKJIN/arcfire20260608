# 게임 내 경제 시스템 총괄 운용 — 김클로드 전수조사 리포트 (2026-10-03)

```text
task_id=economy-full-audit-kim-claude-20261003
kind=AUDIT (코드·CSV 변경 0)
요청=대표님 「김팀장 경제 총괄 분석과 동일 전수조사 → 김클로드 리포트 → 김팀장 협의 → 최종 보고서 1개」
근거=기기 실데이터(RKStorage 2026-10-03 00:1x 스냅샷, 배치 직후) · 코드 · 자동감사 이력 · 학습 KPI 타임라인
상태=김클로드 단독본. 김팀장 리포트 수령 후 대조·통합 예정
```

## 0. 요약

| # | 등급 | 영역 | 한 줄 |
|---|------|------|-------|
| E1 | **P0** | 일일 배치 시각 | 「12:00 KST 1회」가 실제로는 **자정 직후 실행**(오늘 00:04:06) — 게이트의 누락보정 분기가 기본 경로가 됨 |
| E2 | **P0** | 통화량 | **수송선단 금고 8/19 39.9만 → 10/03 2,575만(약 64배)**, 시드 50만. 누적 유입 1.33억. 상한·소각 경로 없음 |
| E3 | **P0** | 감시 공백 | 3시간 경제 감사 **8/19 이후 미실행(6주)** · 오늘 실행은 도구 오류(react-native 변환 실패) |
| E4 | **P1** | 개발 예산 | 아크코어 금고가 매일 **1,009만을 개발 예산으로 선지출**, 당일 사용 0 · **다음날 잔액 미환급 덮어쓰기** → 사실상 매일 소각 + RED 개발은 실제로 안 일어남 |
| E5 | **P1** | 지표 | `windowTradeGross` **매일 0**(convoy 4~280회 운항에도) · 시뮬 KPI(f2p/whale 3.119) **7/02 이후 고정** · `deltaId` 10/02부터 null |
| E6 | P1 | 블루 금고 | 매일 시드(10만) 초과분 전액이 군사 오펙스로 나감 → **블루는 저축 불가(항상 ~10만)** · 오늘 348k → 92.8k |
| E7 | P1 | 플레이어 밸런스 | 레벨 밴드별 무기가 vs 시간당 수입 격차 **critical 4밴드(최대 21,074%)** — 8월부터 코드 변경 권고 상태로 미해결 |
| E8 | P2 | 재정 폐회로 | fee/upkeep 최대 3.03× · gini 0.151 · **WARN 3일 연속** |
| E9 | P2 | 감사 추적 | 금고 txn 이력 120건 캡이 convoy 소액 거래로 **0.1~3.6시간 만에 덮임** → 일 단위 흐름 사후 추적 불가 |

## 1. 실측 — 금고 상태 (배치 직후)

| 금고 | 잔액 | 누적 유입 | 누적 유출 | 최근 txn 창 | 주요 흐름 |
|------|------|-----------|-----------|-------------|-----------|
| 수송선단(fleet) | **25,754,079** | 132,831,025 | 107,076,946 | 0.1h | convoy_buy −478k · trade_margin +186k · arc_core_share −53k |
| 아크코어(RED) | **16,994,553** | 39,739,377 | 22,744,824 | 0.2h | dev_lock **−10,090,020** · residual −2,966,681 · military −699,672 · convoy share +349,507 |
| 중립국 | 5,455,463 | 9,769,648 | 4,314,185 | 0.2h | trade_fee_convoy +64k |
| 블루 | 92,772 | 559,808 | 467,036 | 3.6h | military **−253,064** · convoy fee +58,750 · annex −8,000 |
| 플레이어 독립국 | 0 | 0 | 0 | — | — |
| 플레이어 지갑 | 2,402 | — | — | — | Lv2 |

재정 오펙스 스냅샷(10/03): 요청 11,141,873 → 실지출 11,015,847 · 계수 kMil/kShip 1.075.

## 2. 상세

### E1 일일 배치가 자정에 돈다 (`src/arcCore/schedule/arcCoreDailyOpsPolicy.ts:137-164`)
- `shouldRunArcCoreDailyBatch`: `lastBatchCompletedDayKey < todayKey`면 **시각 조건 없이 true**(158행). 앱이 켜진 채 KST 날짜가 바뀌면 00:0x에 즉시 실행.
- 의도(주석): 「전날 완료 후 앱 꺼짐 → 다음 실행 시 즉시 보정」. 실제: 매일 기본 경로.
- 영향: v4.0 「정오 1회」 계약 위반 · 24h 관측창이 자정 기준으로 어긋남 · 00:00 데일리 스냅샷 커밋·플레이봇 일일 처리와 시각 충돌.
- 권고: 오늘 정오 이전이면 `nowMinute >= batchMinute`까지 대기, **이틀 이상 누락**(`completed < yesterday`)일 때만 즉시 보정.

### E2 수송선단 금고 폭증
- 8/19 3시간 감사: 39.9만 → 오늘 2,575만. 시드 50만의 51배.
- convoy가 행성 시장에서 매매 마진을 금고에 적립하는 구조(사실상 발행). 지출은 오펙스 「선단 운용 2%」 수준이라 순유입 지속.
- 상한·환류(RED/BLUE 배당은 0 유지 정책)·소각 경로가 없어 장기 단조 증가.
- 권고: 김팀장 재정 설계(08-25 §12)와 함께 **선단 금고 상한 또는 초과분 환류 규칙** 결정 필요(대표님 결정 사항).

### E3 경제 자동 감시 6주 공백
- `tools/planet-economy-3h-audit/reports`: 06-15~08-19 결과 108건 → 이후 없음 → 10/03 `TransformError: node_modules/react-native/index.js Unexpected "typeof"`(감사 스크립트 import 체인이 react-native를 끌어옴).
- `audit:balance-ops`는 돌지만 3h 결과를 못 받아 「Overall FAIL」.
- 권고: 3h 감사 import 체인에서 RN 의존 제거 후 복구, 스케줄 재가동 확인.

### E4 개발 예산 선지출 후 소멸 (`src/arcCore/planetDevelopment/arcCorePlanetDevBudgetState.ts:76-119`)
- 매일 `creditArcCorePlanetDevDailyBudget(lockFromVault)` → 금고 `fiscal_opex_dev_lock` 차감 → 예산 풀.
- 새 날짜면 `budgetRemainingCr: credits`로 **덮어씀** — 전날 잔액 환급 없음.
- 오늘 할당 10,090,020 · 사용 0. 설계(08-25)는 「예산 풀 적립 → 실제 건설 시 차감(선소각 없음)」였으나 라이브에서 선지출로 바뀜 → **미사용분 = 회계 소각**.
- 문제: 의도된 소각인지 불명확 + RED 행성 개발이 실제로 거의 일어나지 않음(사용 0).
- 권고: 미사용 잔액 익일 환급 또는 이월, 혹은 「개발 소각」으로 명시하고 KPI에 노출.

### E5 경제 지표 정지
- `kpiTimeline`: `windowTradeGross` 10/01·10/02·10/03 모두 0, `windowConvoyTrips` 280·4·93.
- `f2pWhaleRatio` 3.119 = 7/02 delta 그대로. `deltaId` 10/02부터 null — 경제 SIM 오버레이 갱신 중단.
- 권고: 무역 총액 집계 배선 확인 · SIM 파이프(`sim:economy` → overlay delta) 재가동 여부 결정.

### E6 블루 금고 저축 불가
- 오펙스는 시드 초과분만 지출(`runArcCoreFiscalOpexPass.ts:100`) → 블루는 매 배치 후 ~10만으로 복귀.
- 편입 8,000·개척 비용은 지금 충분하나 블루 측 성장·투자 여지 없음(「블루 0 문제」와 연결).

### E7 플레이어 밴드 CPH 격차 (기존 미해결)
- `audit:balance-ops` 레벨밴드: early 950% · mid_early 5,837% · mid 7,503% · late 21,074% (critical, code_change 권고). 8/03 전수 재조사부터 지속.

### E8·E9
- 재정 WARN 3일 연속(max fee/upkeep 3.03×).
- 금고 txn 캡 120 — convoy 소액 txn이 대부분을 차지해 배치 한 번의 흐름도 다 못 남김. 일 단위 요약 원장 필요.

## 3. 권고 우선순위 (김팀장 협의용)

1. E1 배치 시각 게이트 수정(작은 diff, 계약 복구)
2. E3 3h 감사 복구(감시 재개)
3. E2 선단 금고 상한/환류 정책 결정(대표님) + E4 개발 예산 미사용분 처리 결정
4. E5 지표 배선(trade gross·SIM)
5. E9 일 단위 금고 요약 원장 → 이후 E6·E7·E8 밸런스 판단 근거 확보

## 3-1. 대응 진행 (2026-10-03 00:35~ · 대표님 지시 「김팀장과 협의해 검수·대응 진행」)

| 항목 | 상태 | 내용 |
|------|------|------|
| **E1** | **수정 완료(검수 대기)** | `arcCoreDailyOpsPolicy.ts` — 어제 완료면 **12:00 KST 이후**만 실행, 이틀 이상 누락일 때만 즉시 보정 · 신규 `arcCoreDailyOpsPolicy.test.ts` 6건 PASS · client tsc 0 · 호출처 1(`ArcCoreDailyOpsSubCore` 60s probe) |
| **E3** | **수정 완료(검수 대기)** | 원인: `src/firebase/planetUniqueDeedLock.ts` → `@react-native-firebase/firestore` → `app` → `react-native`(헤드리스 경로치환은 `react-native`만 stub) · 조치: `tools/headless/firebase-stub.cjs` 신규 + `tsconfig.headless.json`에 `@react-native-firebase/*` 매핑 · 앱 코드 0 · `audit:planet-economy-3h` **재가동 → WARN**(convoy 17/19, 실패 nightfall_citadel·core_prime, deficit 5, max fee/upkeep 3.07×) |
| E5 | 조사 중 | `windowTradeGross`는 **플레이어 무역소 거래 합계**(이름이 전체 무역처럼 보임). 10/02 23:25 플레이어 `trade_sell` 존재(아이템 장부) · 수수료 장부는 일자 리셋이라 10/03분 0이 정상. 패브릭 window 기록 여부 미확정 → 통제 시험(무역소 판매 1회 → 다음 배치 KPI) 제안 |
| E2·E4·E6 | **결정 필요** | 정책 판단 — 아래 협의안 |

## 4. 김팀장 리포트와 대조 계획

김팀장 경제 총괄 리포트 수령 후: 동일 항목 AGREE/PARTIAL/DISAGREE 표 → 상충 항목 실측 재확인 → **최종 단일 보고서** `economy-total-audit-final-20261003.md` 작성.
