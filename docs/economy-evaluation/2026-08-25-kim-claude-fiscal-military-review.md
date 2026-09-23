# 아크코어 재정·군사 구조 — 김클로드 재검수 + 보완설계 (2026-08-25)

> **대상**: `docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md`(김팀장 정본)  
> **방식**: CLAUDE.md 「김팀장 지시 재검수」— 문서 주장을 코드로 직접 재확인 후 AGREE/PARTIAL/DISAGREE 판정. 코드 미수정, 문서만.  
> **총평**: **PARTIAL AGREE** — 진단(§1)·문제 목록(§2)·구현 방향(§3-4)의 큰 틀은 코드와 정확히 일치하고 동의합니다. 다만 재검수 중 원문서의 **사실 오류 1건**과 **구현 착수 시 실제로 부딪힐 상호작용 리스크 2건**을 코드로 직접 확인했고, 이를 반영한 보완설계를 아래 붙입니다.

> **김팀장 검수 (2026-08-25)**: **PARTIAL** — 30/70 수치·삽입점·폐회로 존재 **AGREE**. 「P1 vault 지출이 fiscal WARN을 키워 가격을 깎는다」는 **메커니즘 DISAGREE** (`planetFiscalKpi`는 fee/upkeep만). F7은 정량만 P1 전, 코드 수정은 P2. 정본 반영은 설계 문서 §7.

> **김클로드 2차 재검수 (2026-08-25, 대표님 지시 「전면 정밀 재검수」)**: 김팀장 반박 **AGREE(정정 인정)** — `planetFiscalKpi.ts`/`buildPlanetFiscalSnapshot` 입력은 `dailyArcFeeCredits`/`dailyUpkeepCredits`뿐, vault 잔액 없음. 직접 코드 확인 완료. **단, 원 리스크는 사라진 게 아니라 P1이 아니라 P2로 옮겨간 것**이라는 걸 코드로 재확인했습니다 — 아래 §8. P1(`shadow_mode=false`)·P2(시설 유지비)가 이미 **오늘 라이브**로 반영돼 있어 설계 검토가 아니라 **배포된 코드 재검수**로 범위를 넓혔습니다.

---

## 1. 재검수 결과 — 파일:줄 대조

| 원문서 주장 | 판정 | 근거 |
|---|---|---|
| 함대·군사·행성개방 지출은 vault 차감만 하는 "빈 소각" | **CONFIRMED** | `arcCoreCentralBank.ts:53-69` `spendArcCoreCentralBankAccounting` — 함수 주석 자체가 "회계 지출 — 게임 자원 차감 없음". `runArcCoreCentralBankExpenditurePass.ts:68-81`에서 `spendFleetMilitary`/`spendPlanetOpening` 둘 다 이 함수 하나로만 처리. `central_bank_spend_fleet_military`/`_planet_opening` txn kind를 저장소 전체에서 grep해도 정의·소비처 2곳 외 참조 0건 — 함선/함장/전투력을 실제로 만드는 코드 없음. |
| 시설 유지비는 방위위성만, 조선소·무역소·연구소·돔은 슬롯만 있고 0 | **CONFIRMED** | `planetDevelopmentUpkeep.ts:26-49` — 방위위성 설치 여부만 체크해 `lines`에 push. 함수 상단 주석: "현재 구현 완료 엔티티: 방위위성. 그 외는 미구현(0)." 다른 시설 분기 자체가 없음. |
| 5축 라우팅(BLUE/중립/독립/RED)이 `resolveFactionVault.ts`에 실재 | **CONFIRMED** | `resolveFactionVault.ts:22-36,107-122` — hold occupier 팩션에 따라 4개 서로 다른 zustand vault 스토어로 실제 라우팅. `applyPlanetTradeTransactionFee.ts:66,109`가 실사용. |
| **수송 순마진의 90%가 선단에 남고 RED는 10%** | **⚠️ 사실 오류(수치 불일치)** | `tables/balance/trade_route_transport_policy.csv:12` 정본값은 `convoy_net_margin_arc_core_share_pct,30` — **RED 귀속 30% · 선단 잔류 70%**입니다. `applyConvoyUnloadVaultSettlement.ts:56-59`가 이 CSV 값을 실제로 읽어 계산(코드 로직 자체는 정확). 원문서가 인용한 "10%"는 `applyConvoyUnloadVaultSettlement.ts:2`의 **낡은 파일 헤더 주석**("순마진 10% 아크코어 금고 귀속")을 그대로 옮긴 것으로 보입니다 — 이 주석 자체가 CSV 정본과 어긋난 별개의 사소한 버그입니다. |
| 학습(`runArcCoreEconomyLearningDailyPass`)·전력평가(`runFactionPowerEvalDailyPass`)는 "기록 장치"이지 재정 피드백 루프가 아니다 | **⚠️ 과잉 일반화** — 지칭한 두 함수 자체는 맞지만 결론이 과장 | 두 함수는 확실히 기록만 함(`economyLearning.ts:80-94`, `runFactionPowerEvalDailyPass.ts:32-48` — 반환값이 다른 지출/함대 로직 어디서도 안 읽힘). **그러나 같은 배치 안에 실제로 동작하는 가격 피드백 루프가 이미 있습니다**: `runPlanetFiscalBalanceClosedLoopPass.ts:74-102`가 두 학습 패스와 **같은 저장소**(`getArcCoreLearningStoreSnapshot().kpiTimeline`)를 읽어 WARN/FAIL 연속일수를 계산하고, 임계치를 넘으면 `overlay.applyCategoryStep('trade_route', ...)`(96-99행)로 **무역로 가격 배율을 실제로 내립니다**. 즉 "학습 전체가 개회로"라는 결론은 정확하지 않고, "지목한 두 함수의 산출물은 개회로, 그러나 인접한 재정 폐회로가 이미 가동 중"이 정확한 서술입니다. |
| P1 배치는 "배치 말미"에 새 지출 패스를 추가하면 됨 | **⚠️ 단순화 과함** | `runArcCoreDailyOpsBatch.ts` 실제 순서(라인 태그 기준): `convoyDailySettlement`(291)→`planetUpkeep`(300)→`centralBankExpenditure`(308)→`planetFiscalClosedLoop`(316)→시설/미션류(325-353)→`planetPgp`(357)→소유권가격(364)→`economyLearning`(372)→`planetCoreGaugeComposition`(383)→`commitPlanetCoreStatOpsTrendAfterBatch`(391)→`batch_return`. 원문서가 나열한 "convoy·유지비·중앙은행·학습·전력평가" 사이·뒤에 **문서가 언급 안 한 패스가 8개 이상** 더 있고, 진짜 마지막 단계는 `commitPlanetCoreStatOpsTrendAfterBatch`(그날 트렌드 스냅샷 확정)입니다. |

---

## 2. 구현 착수 시 실제로 부딪힐 리스크 2건 (원문서 미포함, 보완설계)

### 리스크 A — P1 신규 지출이 이미 가동 중인 재정 폐회로(`runPlanetFiscalBalanceClosedLoopPass`)를 건드림

P1이 매일 새 유출(군사·전함·함장·R&D 프록시)을 만들면, 그날의 vault 잔액/재정 스냅샷이 나빠져 `fiscalOverall`이 WARN/FAIL로 넘어가는 날이 늘어날 수 있습니다. 이 값은 **이미 실전 배치에 연결된** `runPlanetFiscalBalanceClosedLoopPass`가 연속 WARN/FAIL 일수를 세는 데 그대로 들어가고, 임계치를 넘으면 **무역로 가격이 자동으로 깎입니다**(§1 대조표 근거). 즉 P1을 켜는 순간 "군사비 지출 늘림" → "재정 워닝 증가" → "무역로 가격 자동 인하"라는, 원문서가 전혀 설계하지 않은 연쇄가 이미 존재하는 인프라를 타고 자동으로 발생할 수 있습니다.

**보완**: P1 첫 배포는 **실지출 없이 계산만 로그로 남기는 shadow 모드**로 며칠 돌려, `fiscalOverall` 스트릭에 미치는 영향을 먼저 관측한 뒤 실지출을 켜는 것을 권합니다(원문서 §4-1 완료 게이트에 이 shadow 관측 단계를 한 줄 추가 권장). 최소한 FABRIC §9/§12(원문서가 이미 "구문서"로 지목한 부분) 갱신 시 이 상호작용을 명시해 두면, 나중에 "왜 무역로 가격이 자동으로 떨어졌지"를 재조사하는 반복 작업을 막을 수 있습니다.

### 리스크 B — "배치 말미" 삽입 지점이 실제로는 한 곳으로 좁혀져야 함

P1의 프록시 계수(궤도 트래픽 척수, 조선소·연구소 레벨, PGP, talkEnabled 함장 수)는 대부분 `planetPgp`(357)·`laboratoryRdSpeed`(325-341 구간)·`planetCoreGaugeComposition`(383)에서 그날 값이 갱신됩니다. 삽입 지점에 따라 결과가 달라집니다:
- `planetCoreGaugeComposition`보다 **앞**에 넣으면 → 그날 갱신 전의 어제 값을 읽어 프록시가 하루 지연됩니다.
- `commitPlanetCoreStatOpsTrendAfterBatch`보다 **뒤**에 넣으면 → 오늘 지출한 vault 델타가 오늘자로 커밋되는 트렌드 스냅샷에 반영되지 않고 다음 날에야 반영됩니다.

**보완**: P1의 정확한 삽입 지점은 **`planetCoreGaugeComposition` 직후, `commitPlanetCoreStatOpsTrendAfterBatch` 직전** 한 곳으로 명시할 것을 권합니다. 원문서 §4 P1 행에 "배치 말미" 대신 이 지점을 못박아 두면 실제 구현 시 삽입 위치를 다시 찾는 시행착오를 줄일 수 있습니다.

---

## 3. 그 외 보완 제안 (원문서 방향에 동의, 세부만 추가)

- **§3-3 선단 적립 억제 계수 재계산 요청**: 실제 선단 잔류율이 70%(문서 가정 90%보다 20p 낮음)이므로, `k_ship`/선단 일 운용비 계수를 캘리브레이션할 때 이 실제값 기준으로 다시 잡아야 목표한 "적립 억제" 강도가 의도대로 나옵니다. 코드는 이미 정확하므로 **계수 산정 시 참조값만 30%로 교체**하면 됩니다.
- **`applyConvoyUnloadVaultSettlement.ts:2` 주석 정정**(선택, 사소): "순마진 10%" → "순마진 arcSharePct%(CSV 정본, 현재 30%)"로 고쳐두면 다음 재조사 때 같은 혼선을 막습니다. 로직 변경 아님.
- **§2 F7(convoy 원금 유실, P2 예정)과 P1의 선후관계**: P1이 "수입 - 지출" 항등식을 전제로 계수를 캘리브레이션하는데, F7이 남아있으면 **수입 쪽이 이미 새고 있는 상태에서 지출 계수를 잡는 셈**이라 나중에 F7을 고치면 항등식이 다시 흔들립니다. F7을 P1보다 먼저 고치거나, 최소한 F7 유실분 규모를 P1 계수 산정 전에 한 번 정량화해 두는 걸 권장합니다(원문서도 F7을 P2로 미뤄뒀지만, 순서 문제이지 우선순위 문제는 아니라 별도 언급).

---

## 4. 결론

원문서의 진단(중앙은행이 재정부가 아니라 소각 장치라는 점, 시설 유지비 누락, 5축 라우팅 정상 동작)은 코드와 정확히 일치합니다. 목표 구조(프록시 일일 지출 패스, 기존 계약 불변, 일 1회만)도 이 프로젝트의 메모리·PSS 1순위 규칙과 정합해 방향 자체에 이견 없습니다.

재검수에서 새로 확인한 것은 (1) 인용 수치 하나(10%→30%)의 사실 오류, (2) P1이 이미 가동 중인 가격 폐회로와 만나는 상호작용을 원문서가 다루지 않았다는 점, (3) "배치 말미" 삽입 지점이 실제로는 한 지점으로 좁혀져야 한다는 점입니다. 셋 다 구현(P1) 착수 전에 반영하면 되는 종류라 구조 자체를 다시 짤 필요는 없습니다.

**PARTIAL AGREE** — 구조·방향 승인, 위 3가지만 P1 착수 전 확정 요청.

---

## 8. 2차 재검수 — 「경제고도화 작업 전면 정밀 재검수」(2026-08-25, 대표님 지시)

P1-P5가 전부 `docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md` §4에서 "완료"로 표시되고 `arc_core_fiscal_opex_policy.csv`의 `shadow_mode=false`(실지출)·`enabled=true`를 직접 확인해, **설계 재검토가 아니라 오늘 실제 배포된 코드 전체를 재검수**했습니다. `code_changes=NO`(문서만) 유지 — 전부 읽기 확인.

### 8-1. 김팀장 반박("P1은 fee/upkeep에 안 탐") — 재확인 결과 AGREE

`src/arcCore/economy/planetFiscalKpi.ts:5-9` `PlanetFiscalRowInput`은 `dailyArcFeeCredits`/`dailyUpkeepCredits` 두 필드뿐이고 `buildPlanetFiscalSnapshot`(64-106행) 어디에도 vault 잔액 참조가 없습니다. `runArcCoreFiscalOpexPass.ts`의 vault 지출(`spendUpToBalance`)은 이 입력 경로와 완전히 분리돼 있습니다. **김팀장 반박이 정확합니다 — 정정 인정.**

### 8-2. ⚠️ 그러나 리스크 자체는 살아있음 — P1이 아니라 **P2**가 같은 폐회로를 직접 건드림 (CONFIRMED, 오늘 라이브)

`runPlanetFiscalBalanceClosedLoopPass.ts:15,59`가 `computePlanetDevelopmentUpkeepBreakdown`(→ `devUpkeep`)을 **직접 import해 `dailyUpkeepCredits` 계산에 합산**합니다. 그런데 이 함수는 P2로 오늘 새로 확장돼 방위위성뿐 아니라 **조선소·연구소·무역소·거주돔 유지비**(`planetDevelopmentUpkeep.ts:52-79`, 신규 `facility_daily_upkeep_policy.csv` L1~15)까지 합산합니다. 즉:

```
P2(오늘 라이브) 시설 유지비 신설 → devUpkeep 상승 → dailyUpkeepCredits 상승
   → feeUpkeepRatio(=fee/upkeep) 하락 → warn/fail/deficit 판정 상향
   → runPlanetFiscalBalanceClosedLoopPass의 WARN/FAIL 연속일수 증가
   → 임계치 초과 시 trade_route 가격 overlay 자동 인하 (이미 실전 배치에 연결된 기존 로직)
```

이 인과관계는 원 설계 문서 §3-4도 예견은 하고 있었습니다("P2 시설 유지비를 올리면 deficit/warn이 늘 수 있으므로 **그때** 폐회로와 결합을 재확인한다") — 다만 그 "그때"가 **이미 왔습니다**(P2가 오늘 완료·라이브). 코드로 직접 확인한 결과 이 상호작용은 설계상 실재하고, 지금 활성 상태입니다.

**미확인 부분(중요)**: `npm run audit:balance-ops` 최신 실행(2026-08-25T11:20Z, 방금 재실행) 결과의 `fiscal WARN — max fee/upkeep 3.09× gini=0.379`는 설계 문서 §5(13:11 KST, 배포 전 관측치)와 **완전히 동일한 수치**입니다 — 이 감사 도구는 실시간 시뮬레이션이 아니라 `learning-state.json`에 저장된 **마지막 실제 배치 실행 결과**를 읽는 구조라, P1/P2가 오늘 라이브로 바뀐 뒤 실제 `runArcCoreDailyOpsBatch`가 한 번도 새로 돌지 않았다는 뜻입니다(하루 1회 12:00 KST 배치). **즉 시설 유지비 신설이 재정 WARN·가격 폐회로에 실제로 얼마나 영향을 주는지는 다음 배치가 돌기 전까지 아직 관측된 적이 없습니다.**

**제안**(코드 미수정, 판단 요청): 다음 12:00 KST 배치 직후 `audit:balance-ops`를 재실행해 `fiscalOverall`·`maxFeeUpkeepRatio`·`gini`가 배포 전(3.09×/0.379) 대비 얼마나 움직였는지 반드시 확인할 것을 권합니다. 만약 시설 보유 행성이 많아 WARN 스트릭이 급격히 늘면, `trade_route` 가격이 P2 배포 며칠 안에 자동으로 깎일 수 있습니다 — 원 설계가 원했던 "국가가 시설 유지비를 문다"는 의도된 효과일 수도 있지만, 첫 관측 없이 지나가면 원인 불명의 가격 변동으로 보일 위험이 있습니다.

### 8-3. 구현 품질 — 스팟체크 결과 AGREE (안전장치 정상)

- **시드 보호**: `spendableAboveSeed`(`computeArcCoreFiscalOpexProxy.ts:126-128`)와 `applyLine`의 `Math.min(requested, cap)`(`runArcCoreFiscalOpexPass.ts:100-101`) — 모든 프록시 지출이 시드 아래로 못 내려가게 정확히 캡핑됩니다.
- **P3 개발예산 락 멱등성**: `creditArcCorePlanetDevDailyBudget`(`arcCorePlanetDevBudgetState.ts:82`) — 같은 `kstDayKey`에 이미 배정됐으면 재실행 시 그대로 반환, 중복 차감 없음. 확인.
- **P4 계수 힌트 캡**: `fiscalOpexCoeffOverlay.ts:55` 같은 날 재실행 시 no-op, `clampMul`(21-24행)이 0.85~1.15 하드 캡 — 폭주 불가능.
- **F1 이중 소각 방지**: `skip_empty_central_bank_burn_when_live=true`가 P1 라이브 시 기존 "빈 소각"(`spendFleetMilitary`/`spendPlanetOpening`)을 건너뛰어(`runArcCoreCentralBankExpenditurePass.ts:73-90`) 같은 잉여금이 구·신 지출 경로에 이중으로 안 나갑니다.
- **F7 범위 준수**: `summarizeConvoyRamCargo`는 읽기 전용 집계만(로그·HUD), 실제 원금유실 수정은 없음 — 설계 문서가 약속한 "정량만, 코드 수정은 P2"와 정확히 일치.

### 8-4. 자체 검사

`tsc` 0에러 · `computeArcCoreFiscalOpexProxy.test.ts`(3/3)·`tradeRouteSectorCategories.test.ts`(2/2) PASS · 메모리 오디트 6종 전부 PASS · `audit:balance-ops` Overall FAIL은 기존과 동일 사유(3h 감사 esbuild TransformError, 경제 엔진 FAIL 아님 — 원문서·이전 관측과 일치, 신규 아님).

### 8-5. 결론(2차)

김팀장의 8-1 반박은 코드로 재확인해 인정합니다. 다만 재검수 범위를 오늘 라이브 배포분 전체로 넓힌 결과, 원래 우려("신규 지출이 가격 폐회로를 건드릴 수 있다")는 **틀린 방향이 아니라 틀린 단계(P1이 아니라 P2)를 지목했던 것**으로 확인됩니다. 구현 자체(시드 보호·멱등성·이중소각 방지)는 전부 견고하고 자체 검사도 깨끗합니다. 유일하게 남은 건 "다음 배치 이후 실제로 관측하기 전까지는 이 상호작용의 실사용 영향 크기를 아무도 모른다"는 점 — 코드 결함이 아니라 **관측 공백**입니다.

**PARTIAL AGREE (유지)** — 구현 품질 승인, 다음 12:00 KST 배치 직후 fiscal 지표 재확인만 요청.

**END(2차)** — 2026-08-25 · 김클로드

**END** — 2026-08-25 · 김클로드
