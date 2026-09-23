# 전쟁·경제 연동 전수조사 및 고도화 설계 (v0.2.1)

> **상태**: Phase 0–1.5 구현 (여파/WDI/주둔/승리금) · Phase 2 UI 대기 · 김클로드 재검수 반영  
> **일자**: 2026-09-14 (v0.2.1)  
> **담당**: 김팀장  
> **교차**: `docs/ARC_CORE_ECONOMY_FABRIC.md` · `docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md` · `tools/kim-team-lead/reports/WAR_ECONOMY_THEATER_V02_REVIEW_20260914.md`  
> **전제 유지**: `price_elasticity=0` · 경제는 **12:00 KST 일 1회** · 플레이어 직접 웨이브 **현행** · 신규 서브코어 금지 · 수도 방위 레이어 유지 · 유지비 800·수수료율 무단 변경 금지  
> **김클로드 v0.2 재검수**: 뼈대 AGREE · 쿨다운 예시 DISAGREE(정정) · 함수명·캐시 의존 문구 정정 · 주둔 배율은 **수비 화력만** (롤 가중 체인 비삽입)

---

## 0. 한 줄 결론

전쟁은 **20분 로테이션 + 홀드 변경**으로 돌아가고, 경제는 **12:00 배치 + 금고 라우팅**으로 돌아간다.  
둘을 잇는 다리인 「분쟁」이 **시드 3행성 / 캠페인 5행성+동적 / 여파 CSV 3행성**으로 갈라져 있어, 판도는 움직이는데 스탯·무역·체감은 따라가지 않는다.  
고도화의 1순위는 **신규 전투 엔진이 아니라 War Theater 단일 상태**다.  
그 위에 얹을 군비는 **전함·함장 개체를 시뮬하지 않고**, 이미 있는 5축 금고·수수료 원장·재정 오펙스·함대 CSV를 닫는 **주둔 프록시 + 점령 승리금**만 채택한다.

```text
[pss-pre-dev] hot_path=분쟁 probe 60s(기존)·경제 일1회 alloc=신규 틱/전행성 persist 금지 cache=theater 상태 O(1)
[pss-pre-dev] stage=신규 store 최소화·일 배치에만 경제 합류 risk=P1(배치)·P6(persist 남발 금지)
[pss-pre-dev] verdict=PASS — 본 문서는 설계. 구현은 대표님 승인 후 · 기존값 재확인 후
```

---

## 1. 현행 시계 — 서로 다른 3축

| 축 | 주기 | 정본 | 하는 일 | 안 하는 일 |
|---|---|---|---|---|
| **분쟁 로테이션** | 캠페인 **1200초(20분)** 1행성 · SubCore probe **60초** | `TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC` · `arc_core_territorial_combat_policy.csv` `passIntervalSec` | 커서 전진 · NPC 퀵컴뱃 또는 플레이어 웨이브 이관 · 홀드 변경 | R/P/D/T/E · 시세 · 수송 경로 |
| **분쟁 풀 거버너** | 홀드 dirty / 부트. **랩 완료와 무관** | `arc_core_contested_pool_policy.csv` min **8** / max **12** / step **2** / cooldown **2랩** | 동적 승격·강등 · SAFE 정적 일시정지 | 일일 배치 트리거 없음 |
| **경제·코어 배치** | **12:00 KST 1회** | `arc_core_daily_ops_policy.csv` | 여파 스탯 · WDI/반란 · 금고 유지비 · 수송 정산 · 시세 캡 스텝 | 20분 전선 결과를 직접 읽지 않음 |

쿨다운 실측식: `cooldownLaps × 활성풀 수 × 1200s`. 풀 8이면 `2 × 8 × 1200s = 19,200s` ≈ **5.3시간** (김클로드 재검수 정정. 구문서 10.7시간은 공식 대비 2배 오류).

정적 `draco_front` 순서: `draco_haven → omega_hub → shadow_market → helios_core → titan_ruins` (+ 동적 append).  
시드 `contestedZone=true`는 **드라코·오메가·섀도우 3곳만**. 헬리오스·타이탄은 **캠페인 분쟁이지 시드 분쟁이 아니다.**

---

## 2. 「분쟁」 삼중 정의 — 핵심 결함

같은 단어가 세 함수로 갈라진다.

| 정의 | 판정 | 쓰는 곳 | 포함 |
|---|---|---|---|
| **A. 시드 분쟁** | `isPlanetContestedZone` = `planet_occupation_seeds.contestedZone` | 여파 패스 · WDI/반란 **스킵** | 드라코 · 오메가 · 섀도우 |
| **B. 캠페인 분쟁** | territorial policy `enabled` + `contestedZone` + `campaignGroup` | 20분 로테이션 · NPC 자동전 · 지도 링 | 위 3 + **헬리오스 · 타이탄** + 동적 |
| **C. 동적 분쟁** | `isDynamicContestedZonePlanet` | 풀 min8 채움 · 전쟁 스폴일 가 · 시드 복구 스킵 | 전선/전략중립 승격분 |

**여파 스탯**은 A∩여파CSV = **3행성만**.  
**WDI/반란**은 A를 스킵하므로, 헬리오스·타이탄·동적 전선은 **여파도 없고 내정도 그대로**다.  
**전쟁 스폴일**은 A∨C — 캠페인 B만인 헬리오스/타이탄은 시드 A가 아니라서, 동적 승격 전에는 스폴일 조건이 어긋날 수 있다.

이것이 「판도는 도는데 경제·체감이 안 따라오는」 구조 원인이다. 숫자 튜닝보다 **정의 단일화**가 선행이다.

---

## 3. 연결 맵 — 있음 / 약함 / 없음

### 3-1. 이미 연결된 것 (유지)

| 연결 | 메커니즘 | 주기 |
|---|---|---|
| 홀드 → 수수료 금고 | `resolveTradeFeeFactionVault(planetId)` | 거래 즉시 귀속 · 정산은 일 배치 |
| 홀드 → 유지비 청구 | `runArcCorePlanetUpkeepDailyPass` (행성당 800 cr) | 일 1회 |
| 홀드 → 재정 오펙스 입력 | `gatherArcCoreFiscalOpexInputs` | 일 1회 |
| 시드 분쟁 → R/P/D/T/E 여파 | `runContestedZoneAftermathDailyPass` drift **0.16/일**, 지표당 ±**3** | 일 1회 |
| 비시드 → WDI·반란 | 재정 스트레스·인구 갭 · 수도 방위 배율 | 일 1회 |
| 반란 성공 → 홀드 | `applyRebellionOverthrowHold` | 일 1회 |
| 플레이어 체류 + due → 웨이브 | `player_wave_pending` · 커서 대기 | 20분 슬롯 |
| RED 웨이브 승리 → 중립+`neutralizedAt` | `planet.tsx` (자동 패스 밖) | 이벤트 |
| 지도 색·국가 접두 | **런타임 홀드** (`clan_map_faction_color_policy`) | 홀드 변경 시 |
| 지도 분쟁 링 | **그룹당 다음 1성계만** | 패스 완료 시 전진 |
| 수도 포위문 | `hold_defense` → NPC 자동전/풀 승격 차단 | 분쟁 패스 |

### 3-2. 약하게만 연결된 것

| 연결 | 한계 |
|---|---|
| 동적 풀 ↔ 여파 | 동적은 A가 아니라 여파 미적용 |
| 캠페인 5곳 ↔ 여파 | 헬리오스·타이탄 미적용 |
| 점유 변경 ↔ 무역 체감 | 금고만 바뀜. 수수료율·진열·경로 불변 |
| 수송 독점 라벨 | 홀드 팩션을 읽지만 표시명은 동일 폴백 |
| 학습 KPI 거부 | `peekLatestFactionPowerKpi()` — 일일 hydrate 전 null |
| 재정 폐회로 → `trade_route` 카테고리 | **전선이 아니라** fee/upkeep 스트레스 |
| PGP | 여파가 스탯을 밀면 다음날 PGP가 따라옴. **여파 UI 없음** |

### 3-3. 연결 없음 (NO-LINK)

| 전쟁 쪽 | 경제 쪽이 무시 |
|---|---|
| 20분 로테이션 결과 | 시세 SIM overlay · micro adjust · 에너지(R) 광물 패스 |
| 풀 승격/강등 | 수송 배정 · 카탈로그 |
| envelope / 마지노선 / 수도 방위 | 무역 그래프 · 시세 (반란 확률만) |
| `allySupplyEnabled` | 전 행 `false` — 동맹 보급 미사용 |
| `planetAttack` / `ArcCoreAttackSubCore` | 골격. 실피해는 인바운드 드론만 |
| 그래프 1홉 공격 게이트 | 설계만 (`ARC_CORE_TACTICAL_AUTOMATION…` 헤더 「코드 미착수」는 **로테이션 기준으로는 낡음**. 그래프 게이트는 여전히 없음) |

---

## 4. 전수조사 체크리스트

아래는 **실기·로그·스토어로 확인 가능한 항목**이다. 구현 전후 QA 정본.  
판정: `OK` / `GAP` / `HOLD`(기존값·웨이브 유지).

### 4-A. 분쟁 로테이션 타임

| # | 확인 | 기대(현행) | 판정 |
|---|---|---|---|
| T1 | 캠페인 슬롯 간격 | 1200초 · 그룹당 1행성 | OK |
| T2 | probe가 20분을 기다리지 않고 60초마다 due만 봄 | `TERRITORIAL_PASS_PROBE_INTERVAL_MS=60000` | OK |
| T3 | 하드게이트(점유전투 OFF / 후방 / 수도 링) 시 커서는 전진, 전투 없음 | `advanceTerritorialCampaignCursorForSkip` | OK |
| T4 | 플레이어 착륙+due → NPC 생략, 웨이브 이관, **20분 소비 안 함** | `player_wave_pending` | OK |
| T5 | 웨이브 종료 후 `completeTerritorialPassAfterPlayerWave`로 커서 전진 | 승패 무관 슬롯 소비 | OK |
| T6 | 정적 5 < min8 → 동적 3+ 자동 승격 | 점수: 전략중립 120 > 전선 100 > 독립전선 80 | OK · 체감 GAP |
| T7 | 풀 재조정 트리거 | dirty/부트만. **1랩 완료 ≠ rebalance** | GAP |
| T8 | 강등 쿨다운 | 2랩 × 풀N × 20분 | OK |
| T9 | 캠페인 그룹 | 현재 `draco_front`만. F2/F4 전쟁 로테이션 없음 | GAP (의도적 후속) |
| T10 | 비캠페인 enabled 행 | 루프는 있음 · 현재 0행 | OK |

### 4-B. 플레이어 직접 분쟁 체감

| # | 확인 | 현행 | 판정 |
|---|---|---|---|
| P1 | 은하 지도 분쟁 링 | **다음 예정 1성계/그룹** | OK · 큐 없음 GAP |
| P2 | 전선 전체(풀 8~12) 가시성 | 없음 | GAP |
| P3 | 왜 웨이브가 떴는지 (territorial turn) | 개발 로그 · 허브 칩 없음 | GAP |
| P4 | RED 체류 차단 + 웨이브 승리 중립 | 현행 유지 계약 | HOLD |
| P5 | 블루 웨이브로 영토 자동 점령 | 안 함 (주석 계약) | HOLD |
| P6 | 점유 변경 알림 | `showTerritorialOccupationChangeAlert` + 바 뉴스 | OK |
| P7 | 허브 「분쟁」 뱃지 | 없음. 존 뱃지는 「점유지역」 | GAP |
| P8 | 허브 수도/국가 서브타이틀 | `clanTerritorySubtitle=null` (경제 오버레이로 이전) | GAP(허브) |
| P9 | 경제 오버레이 점유 라벨 | 있음 | OK |
| P10 | 경제 오버레이 여파(`detail.contestedAftermath`) | **미표시** | GAP |
| P11 | 접전에서 WDI | 0·stable + 「내정 보류」 한 줄 | OK · 설명 빈약 |
| P12 | 점유 → 무역 수수료율 | 무시. 항구 레벨+스킬만 | GAP |
| P13 | 반란 오퍼레이터 대사 | 큐 있음 | OK |
| P14 | 반란 바 뉴스 | i18n 키만 · `barBoardStore` 미푸시 | GAP |
| P15 | 일일 배치 결과 고지 | 트렌드 화살표만. 「어제 여파 ±N」 없음 | GAP |

### 4-C. 실제 세력 판도

| # | 확인 | 현행 | 판정 |
|---|---|---|---|
| M1 | 지도 보로노이 색 | 런타임 `occupierClanId` | OK |
| M2 | 국가 접두/설명 | `resolvePlanetRuntimeNationDisplay` (홀드) | OK |
| M3 | 시드 vs 홀드 | 분쟁 프로세스 행성은 시드가 덮지 않음 | OK |
| M4 | `neutralizedAt` | 시드 복구 금지 | OK |
| M5 | 수도 링 intact | NPC 함락/풀 승격 금지 | OK (2026-09-14) |
| M6 | 수도 시드 복구 | 마커 없는 중립은 접경이어도 본국 복구 · 적 국가 함락은 유지 | OK |
| M7 | 4대 수도 동일 규칙 | `isRouteCapitalPlanetId` | OK |
| M8 | 남·북(F2/F4) 전쟁 본선 | BLUE↔RED만. 수도는 NEUTRAL 프론티어인 경우 많음 | GAP |
| M9 | 동맹 보급 | `allySupplyEnabled=false` 전행 | GAP |
| M10 | 그래프 1홉 공격 게이트 | 없음. 로테이션 CSV가 공격 가능 여부를 대신함 | GAP |
| M11 | 아이언 후방 envelope | STRONG이면 `neutral_declare=0` | OK |
| M12 | 마지노선 N≤5 HARD | 21코어 카운트. F2/F4 코드는 문서만 | OK · 외부보급 GAP |

### 4-D. 일단위 경제 연동

배치 실순서(전쟁 인접만 발췌): 에너지(R) → 환경 → **여파** → **WDI** → **반란** → 마스터밸런스 → fabric → 시세 3단 → 수송정산 → 유지비 → 재정폐회로 → 평형 → PGP → 증서가.

| # | 확인 | 현행 | 판정 |
|---|---|---|---|
| E1 | 여파 대상 | 시드 분쟁 ∩ 여파 CSV = 3행성 | GAP (캠페인/동적 누락) |
| E2 | 여파 수치 | 드라코 R-2 P-5 D+8 T+6 E-6 · 오메가 +3/-4/+5/+4/-3 · 섀도우 +5/-3/+4/+3/-4 | HOLD (기존값) |
| E3 | 여파 속도 | drift 0.16 · ±3 pt/일 | HOLD |
| E4 | WDI/반란 vs 시드 분쟁 | 스킵 | OK (이중 적용 방지) |
| E5 | WDI/반란 vs 캠페인·동적 | **스킵 아님** | GAP (정의 불일치) |
| E6 | 시세 | `price_elasticity=0` · 일 캡 스텝만 | HOLD |
| E7 | SIM overlay | 점유/전선 입력 없음 | GAP (의도일 수 있음) |
| E8 | 수송 경로 | 분쟁/포위 우회 없음 | GAP |
| E9 | 수송 수수료 | 홀드→금고만. 전선 할증 0 | GAP |
| E10 | 유지비 800 | 홀드 팩션 금고. P 무시 | HOLD |
| E11 | 플레이어 소유 수익 | 소유 홀드만 지갑 | OK |
| E12 | 전쟁 스폴일 가 | `neutralizedAt` + (A∨C) · 테스트가 10 cr | OK · B 단독 GAP |
| E13 | 증서 본가 평가 | 수수료·fabric·존. **홀드 미반영** | GAP |
| E14 | 에너지(R) 광물 패스 | 전쟁 무관 | OK (별축) · 여파와 목표 충돌 가능 |
| E15 | fabric `supplyStockScale` | 수송/교역/공격 윈도. 홀드 없음 | GAP |
| E16 | 중앙은행 | RED 금고 잉여만 | OK |
| E17 | 재정·군사 프록시 | 라이브(`runArcCoreFiscalOpexPass`). 전선 배율 없음 | GAP |
| E18 | 타이틀에 배치 묶임 | 금지. 차원항로 prewarm | HOLD |

### 4-E. 행성 주요 스탯 (R P D T E · PGP)

| # | 확인 | 현행 | 판정 |
|---|---|---|---|
| S1 | 여파 기록 | `detail.contestedAftermath` persist | OK · UI GAP |
| S2 | 허브 5게이지 | 런타임 스토어 | OK |
| S3 | 일 트렌드 화살표 | 배치 스냅샷 | OK · 원인 미표기 |
| S4 | 채굴 상한 | R 연동 | OK (간접) |
| S5 | 여파 vs 에너지 패스 | 같은 날 R을 두 패스가 밈. 합성은 gauge intent | 확인 필요 |
| S6 | 여파 vs 마스터밸런스 | 여파 후 레벨링 목표로 재당김 가능 | 확인 필요 |
| S7 | PGP | `(R+P+D+T+E)/5 × 3375` 일 1회 | OK · 전쟁 원인 미표기 |

### 4-F. 전술 레이어 (자동)

| # | 확인 | 현행 | 판정 |
|---|---|---|---|
| W1 | 롤 가중 스택 | 전선압력 → 마지노 SUPPORT → envelope → 수도 방위 | OK |
| W2 | 수도 `hold_defense` | status_quo 강제 · HARD 우회 불가 | OK |
| W3 | 수도 `siege_open` | battle×0.45 · declare×0.15 | OK |
| W4 | 플레이어 웨이브에 수도 배율 | **미적용** (현행 유지) | HOLD |
| W5 | 독립국 침공 | 링 닫히면 silent status_quo | OK |
| W6 | `startRaidOnPlanet` | 기록만 | GAP |
| G1 | 전선 주둔 % · 파괴/재건 | 없음. 함대 CSV 고정 | GAP |
| G2 | 점령 승리금 → 국가 금고 | 없음. 스폴일 증서가만 | GAP |
| G3 | 행성 원장 → 군비 재투자 | 수수료는 금고로만 | GAP |
| G4 | 국가 오펙스 vs 전선 승패 | 오펙스는 승패 무관 | OK(후방) · 전선 GAP |

---

## 5. 고도화 원칙 (구현 시 헌법)

1. **기존값 재확인** — 여파 offset · 롤 가중 58/12/30 · min8/max12 · 20분 · 유지비 800 · elasticity 0 은 **승인 없이 덮지 않음**.
2. **플레이어 웨이브 현행** — 밸런스 곡선·RED 중립화·블루 비정복 계약 유지. 체감은 **설명·예고·결과 고지**만.
3. **경제는 일 1회** — 20분 패스가 시세/경로/스탯을 직접 쓰지 않음. 패스는 **관측 토큰만** 남기고 12:00가 읽는다.
4. **신규 서브코어 금지** — theater resolver는 순수 함수. 실행은 기존 Territorial + DailyOps.
5. **분쟁 단어 단일화** — UI/패스/스폴일은 같은 `WarTheaterState`만 읽는다.
6. **PSS** — 전 행성 루프는 일 배치·거버너(이미 있음)만. persist는 bounded 요약 1건.
7. **군비는 프록시** — NPC 전함·함장 인벤토리·20분 정산·행성 전용 군자금 스토어 **금지**. 주둔 강도(0–100) + 기존 금고/원장만.
8. **승리금은 점령 이전만** — 방어 성공은 자금 0 · 전력 유지. 플레이어 웨이브에는 군비/승리금 **미적용**.

---

## 6. 목표 아키텍처 — War Theater 단일 상태

신규 스토어 없이 **조회 함수**(부작용 없음). `listTerritorialCombatPolicies()` 리비전 캐시에 의존할 수 있음 — 엄밀한 순수 함수는 아님.

```text
resolveWarTheaterState(planetId, holds, pool, seeds, capitalCtx)
  → {
      kind: 'none' | 'static_seed' | 'campaign' | 'dynamic' | 'capital_hold' | 'capital_siege'
      inRotation: boolean
      economyDaily: 'aftermath' | 'wdi' | 'none'
      garrisonEligible: boolean   // 로테이션 전선만 (후방은 국가 오펙스로 흡수)
      playerFeel: { preview: boolean, waveDefer: boolean }
    }
```

| kind | 로테이션 | 일 경제 | 웨이브 이관 |
|---|---|---|---|
| `static_seed` | 예(캠페인 소속 시) | aftermath | 체류+due |
| `campaign` (헬리오스·타이탄) | 예 | **P1에서 aftermath 템플릿** (신규 행, 기존 3행 유지) | 동일 |
| `dynamic` | 예 | P1 aftermath 템플릿 또는 WDI 유지 — **대표님 선택** | 동일 |
| `capital_hold` | 풀 금지 | 여파 없음 · 반란만 감쇠 | 웨이브 현행 |
| `capital_siege` | 풀 감점 허용 | P1 검토 | 웨이브 현행 |
| `none` | 아니오 | WDI/반란 | 일반 웨이브 트리거만 |

**20분 패스 → 일 배치 브리지 (신규, bounded)**

```text
territorialPassObservation (행성당 최신 1건, 캡=풀max 12)
  lastDecision, holdBefore, holdAfter, atMs, source: npc|player_wave|skip
  garrisonAfter01, spoilsCredits, spoilsVaultKey
```

12:00만 이 버퍼를 읽어 여파·브리핑·(승인 시) 수송 스트레스에 합류. 패스 즉시 persist 금지 — 메모리 링 + 배치 직전 1회 직렬화.

---

## 7. 고도화 페이즈

### Phase 0 — 정의·관측 (기존값 0변경)

- `resolveWarTheaterState` + `audit:war-theater` (삼중 정의 불일치 리포트).
- 기존 호출부는 **읽기만** 교체 준비. 행동 변경 없음.
- 개발 로그에 theater kind 1줄.

완료 조건: 헬리오스=`campaign`·드라코=`static_seed`·뉴에덴=`capital_hold`(아군 링)·동적 승격분=`dynamic` 이 테스트로 고정.

### Phase 1 — 일단위 경제 합류 (신규 행만)

대표님 승인 항목만.

| 제안 | 기본안 | 기존값 |
|---|---|---|
| 여파 대상 = theater inRotation | 헬리오스/타이탄/동적에 **템플릿 offset** 신규 | 드라코/오메가/섀도우 3행 **불변** |
| 동적 템플릿 | 전선형 드라코에 가깝게 두되 **별도 행** (`__dynamic_front__`) | — |
| WDI | theater aftermath면 스킵 (지금 A와 동일 규칙 확장) | 비극장 행성 곡선 불변 |
| 수송 | 극장 행성 **정산 수수료 할증 0%가 기본**. 켤 때만 CSV | 경로 그래프 불변 |
| 시세 | **안 연동** (elasticity 0 유지) | overlay 불변 |
| 20분→일 관측 버퍼 | 위 §6 | 신규 |

금지: 거래마다 가격 변동 · 부트 동기 전 행성 여파.

### Phase 2 — 플레이어 체감 (UI · 숫자 불변)

1. 경제 오버레이: 「분쟁 여파」 5축 Δ · 목표 대비 · 은하 평균 갭 (`detail.contestedAftermath` 이미 있음).
2. 허브: 얇은 「분쟁 로테이션」 칩 — due면 「전선 차례」.
3. 지도: 다음 **2곳** 예고(현재+다음). 풀 전체 점찍기는 STAGE 2 예산상 기본 비활성.
4. 바: 반란 뉴스 푸시(키 이미 있음) + 일 1줄 전선 브리핑(PGP 브리핑에 합류).
5. 무역: 수수료율은 그대로, **귀속 금고/점유국**만 명시.

플레이어 웨이브 전투 수치·VFX·승패 홀드 규칙 **금지**.

### Phase 3 — 판도·전술 (그래프)

기존 `ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md`를 **현행 20분 로테이션 위에 게이트만** 얹는다.

- 1홉+점유 거점 없으면 NPC 전투 스킵(커서만).
- 풀 재조정을 **캠페인 1랩 완료**에도 dirty.
- `allySupplyEnabled` 켜는 행은 **별도 승인**.
- F2/F4 전쟁 그룹은 확장시스템 해금과 같이.

### Phase 1.5 — 전선 주둔 군비 · 점령 승리금 (신규 레이어 · 기존 800 불변)

§10에서 채택한 것만. **착수 전 준비** — 숫자 CSV는 승인 후.

- 전선 행성 `garrison01` (0–100) bounded 맵. 함선 개체 없음.
- NPC 전투 패배(점령 이전) → 잔존 % · 방어 성공 → 전력 유지 · 승리금 0.
- 점령 승자만 국가 금고 입금. 방어측 위로금 없음.
- 재건은 **12:00만**: 행성 수수료 원장 → 부족분 국가 금고 (`spendUpToBalance`).
- NPC 퀵컴뱃에만 주둔 배율 (수도 방위 스택 위). 웨이브 미적용.
- 후방 전 행성 함대 생산 시뮬 **안 함** — 국가 오펙스가 이미 흡수.

### Phase 4 — 전쟁-경제 항등식 (후속 · 축소)

1.5가 전선 루프를 닫은 뒤의 잔여만.

- 전선 수 → 기존 `runArcCoreFiscalOpexPass` 계수 힌트 ±캡 (오펙스 이중 구현 금지).
- 여파 PGP 갭 → 카테고리 힌트 ±캡 (elasticity 아님).
- `siege_open` 수도만 일 1회 수송 우선순위 하향(경로 삭제 아님).

---

## 8. 구현 전 확인 (대표님)

기존값을 건드리는 선택만 질문한다. 골격은 위가 1안. **전원 검토 후 착수.**

1. **분쟁 정의**: 여파를 시드 3곳 유지 vs 캠페인+동적까지 확장(기존 3행 수치 유지+신규 템플릿).
2. **동적 전선 내정**: 여파로 넣을지, WDI/반란을 남을지. **둘 다**는 금지.
3. **로테이션 20분 / min8·max12**: 유지가 기본. 바꿀지.
4. **수송 할증·우회**: Phase 1에서 0%·경로 유지가 기본. 넣을 수치.
5. **지도 예고**: 1곳 유지 vs 2곳.
6. **플레이어 웨이브**: 현행 유지 · 군비/승리금 **미적용** 재확인.
7. **주둔 대상**: 로테이션 전선만 (1안) vs 전 점유 행성 (오펙스와 중복 · 비권장).
8. **승리금 산식**: 행 밴드 정액 vs 일 PGP 소비율(캡). 기존 스폴일 테스트가 10 cr과 **별축** 유지.
9. **재건 분담**: 행성 원장 60% + 국가 금고 40% 제안. 기존 유지비 800은 **손대지 않음**.

승인 범위 밖에서 코딩하지 않는다.

전체 설계(본 문서 §1–§10 · 수도 방위 · 전술 그래프) 검토가 끝나기 전 **코드 착수 금지**. 지금은 문서 준비만. `src/` · `tables/` 미변경.

---

## 10. 군비 의도 전수 — 채택 / 변형 / 제외 (v0.2)

대표님 제시 개념을 현행 코드에 대조했다.  
기준: **이미 있는 축을 닫을 것** · 일 1회 · PSS · 웨이브 현행 · 기존값 무변경 · **체감·판도가 실제로 달라질 것**.

### 10-1. 현행이 이미 하는 것 (다시 만들지 않음)

| 개념 | 이미 있는 축 | 한계 |
|---|---|---|
| 국가가 영토를 먹이는 돈 | 점유 유지비 **800**/행성 · 홀드 금고 | 군사 전력이 아님. P 무시 |
| 국가 군사·함선·함장 비용 | `runArcCoreFiscalOpexPass` (D·PGP·궤도·함장 수 프록시) | **전선 승패와 무관**. 이기든 지든 같은 공식 |
| 행성 자동 수입 | 무역/수송 수수료 → `planetTradeFeeLedger` → 홀드 금고 | 군비로 **재투자되지 않음** |
| NPC 함대 모습 | `arc_core_territorial_fleet_composition.csv` 고정 편성 | 생산·파괴·유지 없음. 매번 같은 목록 |
| 전쟁 후 싼 증서 | `neutralizedAt` + 스폴일 테스트가 | 국가 금고 승리금이 아님 |

2026-08-25 재정 문서의 공백(F1: 함대 지출이 빈 소각에 가깝고 전투와 안 묶임)을 **전선 주둔 레이어로만** 닫는다. 오펙스를 두 벌로 짜지 않는다.

### 10-2. 의도별 판정

| # | 의도 | 판정 | 이유 |
|---|---|---|---|
| I1 | 분쟁 대상·행성이 전함·함장 전력을 **생산** (자금 소요) | **변형 채택** | 개체 생산은 틱/인벤/PSS에 짐. 전선 행성 `garrison01` 목표까지 **일 1회 재건비**. 함대 CSV는 스킨·퀵컴뱃 입력으로 유지 |
| I2 | 전력 **유지비** | **변형 채택** | 행성 800과 별축. 전선만 `garrison01 × 일 유지 단가`. 후방 전 행성은 기존 오펙스가 국가 군비 |
| I3 | 분쟁 발발 시 전력 **파괴** → 유지비↓ · 재생산 자금 | **채택** | NPC `battle`로 홀드가 바뀌거나 방어가 깨질 때만 잔존 %. `status_quo`·스킵은 파괴 없음 |
| I4 | 행성 자동 수익 → 군비 | **채택** | 새 지갑 없음. 재건/유지는 `feeLedger` 행성분 먼저, 부족분을 국가 금고 |
| I5 | 승리 시 전력 **유지** | **채택** | 방어 성공·현상 유지 = garrison 유지. 공격 점령은 승자가 잔존만 인수 후 다음날 재건 |
| I6 | 방어측은 특별 자금 없음 · 점령측만 승리금 | **채택** | 방어의 보상 = 행성+주둔 유지. 위로금은 판도를 흐림 |
| I7 | 점유국이 자주 바뀜 → 전쟁 수익을 **국가 금고**에 축적 | **채택** | 5축 라우팅 재사용. 행성 금고 신설 금지. 홀드가 바뀌면 다음날부터 그 금고가 유지·재건 |
| I8 | 군자금 = 개별 행성 + 국가 금고 일정 보급 | **채택** | I4와 동일. 보급 상한 %는 CSV (제안 40%). 금고 바닥이면 `spendUpToBalance` · 주둔 미달 = 다음날 전투 약화 |

### 10-3. 명시적 제외 (효율·계약)

| 제외 | 이유 |
|---|---|
| NPC 전함·함장을 행성마다 스폰/파괴/재고 | 이미 CSV 편성 + 퀵컴뱃. 개체 심은 STAGE 1 예산·틱 할당 위배 |
| 20분 패스마다 시세·유지비·재건 정산 | 경제 일 1회 헌법. 패스는 **관측+홀드+승리금 입금**만 |
| 행성 전용 군자금 AsyncStorage | 원장·5축과 삼중 장부. persist 폭주 |
| 후방 전 행성의 「함대 공장」 | 오펙스 `k_mil × ΣD × PGP`와 중복. 체감은 전선에서만 |
| 방어 성공 위로금 | 대표님 의도(방어는 자금 없음)와 어긋남 |
| 플레이어 웨이브에 주둔 소모·승리금 | 웨이브 현행 계약. 자동 경로만 |
| 기존 800·수수료율·여파 3행 덮어쓰기 | 기존값 재확인 대상. 군비는 **신규 단가**만 |
| 전쟁 → 물가 탄력 | `price_elasticity=0` 유지 |

### 10-4. 채택 구조 — 전선 주둔 루프

```text
행성 수수료 원장 (자동 수익)
        │ 재건·유지 우선 출금
        ▼
전선 garrison01 ----유지비----> 점유 국가 금고
        ^                         |
        | 부족분 보급(캡)           | 점령 승리금만 입금
        +--------- 국가 금고 <-----+

NPC 전투
  방어 성공      → garrison 유지 · 승리금 0
  점령 이전      → 잔존% · 승자 금고 += spoils · 패자 0
  status_quo     → 변화 없음
  플레이어 웨이브 → 본 루프 밖
```

| 항목 | 설계 |
|---|---|
| 상태 | `theaterGarrisonByPlanetId: { pct, updatedAtMs }` — 키 상한 = 활성 풀(≤12). 후방 키 없음 |
| 목표 | 전선 100 (CSV). 미달이면 일 1회 재건(일 상한 % · 한 날에 전부 회복 금지) |
| 유지 | `ceil(pct/100 × dailyUpkeepPerTheaterPlanet)` — **800과 별도**. 800은 내정 |
| 파괴 | NPC 점령 이전 시 `retainPct` (제안 20). 방어 승리는 100 |
| 전투 | **수비 화력에만** `lerp(min,max, pct/100)` (`defenderGarrisonMul`). 롤 가중·`defenderAdvantagePct` 체인에 넣지 않음 (김클로드 리스크 2) |
| 승리금 | `holdBefore ≠ holdAfter` 이고 승자가 BLUE/RED/INDEPENDENT일 때만. 방어·중립선포·스킵 = 0 |
| 입금 | `resolveFactionVaultForOccupierClanId` / `resolveFactionVaultForPlanetId` — 기존 5축 |
| 출금 | 재건·유지: 원장 `arcFeeCredits` 행성분 → 잔여 국가 금고 |
| 효과 | 금고가 마른 국가는 전선이 약해지고, 연승 국가는 승리금으로 재건이 빨라짐. **물가는 안 움직임** |

함장 전력은 오펙스의 `captainCount` 관측 + 함대 CSV 편성으로 **이미 대표**된다. 주둔 %는 「그 편성이 얼마나 건재한가」이지 함장을 새로 뽑지 않는다.

### 10-5. 왜 이 조합이 게임 고도화에 유효한가

1. **적립만 하던 국가 금고**에 전선 승패가 출금·입금으로 붙는다 (08-25 F1을 전투에 닫음).
2. **점유가 자주 바뀌는** 전선에서 승자 금고가 커지고 패자는 재건 부담 — 판도가 숫자로 남는다.
3. 플레이어는 오버레이에서 「주둔 / 어제 승리금 / 재건 대기」를 보면 20분 전쟁이 **경제와 같다**고 읽힌다.
4. 웨이브·시세·800을 건드리지 않아 회귀면이 좁다.

### 10-6. 준비만 (착수 전 산출물)

구현 금지. 착수 시 신규만:

| 준비 | 내용 |
|---|---|
| CSV 초안명 | `tables/balance/arc_core_theater_garrison_policy.csv` (`default_v1`) |
| 순수 함수명 | `resolveTheaterGarrisonTarget` · `applyTheaterBattleGarrison` · `planTheaterRebuildSpend` |
| 삽입점 | 관측 버퍼(§6) · 일 배치(유지비 패스 다음 또는 오펙스 직전) · NPC 퀵컴뱃 배율 |
| 금지 삽입 | `planet.tsx` 웨이브 · `runMarket*` · 부트 동기 · 타이틀 |

제안 컬럼(숫자 **미확정** · 승인 후): `theaterDailyUpkeepCredits` · `rebuildLocalFeeSharePct` · `rebuildNationSharePct` · `rebuildDailyCapPctOfTarget` · `occupyRetainPct` · `defendWinRetainPct` · `spoilsOnOccupy` · `combatMulMin`/`Max` · `applyOnPlayerWave=false`.

---

## 9. 파일 인덱스 (조사 정본)

| 영역 | 경로 |
|---|---|
| 배치 순서 | `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` |
| 분쟁 패스 | `src/arcCore/territorial/runTerritorialCombatPass.ts` |
| 풀 | `contestedPoolGovernor.ts` · `contestedPoolGovernorSync.ts` |
| 삼중 정의 | `balanceTableRegistry.isPlanetContestedZone` · territorial policy CSV · `dynamicContestedZoneStore` |
| 여파 | `runContestedZoneAftermathDailyPass.ts` · `contested_zone_stat_aftermath.csv` |
| 금고 | `src/arcCore/economy/resolveFactionVault.ts` |
| 지도 링 | `resolveContestedZonePreviewSystemIds.ts` |
| 웨이브 이관 | `territorialPlayerWavePending.ts` · `app/(game)/planet.tsx` |
| 수도 | `resolveCapitalDefenseContext.ts` |
| 경제 헌법 | `docs/ARC_CORE_ECONOMY_FABRIC.md` |
| 재정·군사 프록시 | `docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md` · `runArcCoreFiscalOpexPass.ts` |
| 함대 편성(스킨) | `tables/balance/arc_core_territorial_fleet_composition.csv` |
| 행성 수수료 원장 | `planetTradeFeeLedgerStore` · `applyPlanetTradeTransactionFee.ts` |
| 군비 준비(미착수) | `arc_core_theater_garrison_policy.csv` (초안명만) |

---

*본 문서는 설계·검수 정본이다. 구현 착수는 §8 승인 · 전체 설계 검토 후.*
