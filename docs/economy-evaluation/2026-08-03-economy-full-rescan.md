# 2026-08-03 — 경제 모델 전수 재조사 최종 보고서

> **작성**: 김팀장(분석 세션 · Composer/글록 — **코드 수정 없음**)  
> **범위**: 플레이어 성장 · 행성 핵심 스탯(R/P/D/T/E) · 일일 배치 전 패스 · SIM·관측 히스토리  
> **근거**: `src/arcCore/**` · `tables/balance|content` · `tools/*-audit/reports/latest.md`(2026-08-02) · `docs/economy-evaluation/*` · `docs/ARC_CORE_ECONOMY_FABRIC.md`  
> **판정 요약**: **구조(일 1회·elasticity=0) PASS · 밸런스 depth WARN · 진행·재정 CRITICAL 다층**

---

## 0. Executive Verdict

| 층 | 판정 | 한 줄 |
|----|------|--------|
| **아키텍처 계약** | **PASS** | 12:00 KST 일 1회 배치 · `price_elasticity=0` · 고빈도 reprice 없음 |
| **월드 경제 엔진** | **WARN** | Fabric·convoy·upkeep·fiscal 가동. 허브 불균등·convoy 실패 잔존 |
| **밸런스 곡선** | **CRITICAL** | level-band 무기 CPH gap 950%~**21074%** (balance-ops 2026-08-02) |
| **플레이어 성장 루프** | **WARN→구조적 thin** | 29일 베이스라인 Lv11 · **2,252 CR** · 전투→월드 경제 결합 약함 |
| **행성 핵심 스탯** | **OPS OK · semantic WARN** | CSV 시드 vs runtime 이원화 정상. R≠실매장. 오너 행성은 게이지 제한 |
| **문서·SIM 신선도** | **WARN** | SIM delta 2026-07-02 고정 · AGENTS 인용 일부 문서 부재 |

**코드 수정은 Opus(김팀장) 세션 / 김클로드 초안 → 검수 경로.** 본 보고서는 분석·보완 목록만.

---

## 1. 히스토리 타임라인 (경제)

| 시기 | 이벤트 |
|------|--------|
| 2026-06-14~ | v4.0 확정: 일 1회 배치 · elasticity=0 · Table-First |
| 2026-06-15 | 1차 평가 — 엔진 PASS, 깊이 4~5/10 (EVE/X4 대비) |
| 2026-06-16 | **부트 OOM 회귀** — 경제 패스 onBoot 동기 실행 (이후 지연·yield 조치) |
| 2026-06-말 | planet-economy 3h · fabric 골자 · fiscal gini 관측 시작 |
| 2026-07-02 | 페라이트 10CR 앵커 3단계 **CONDITIONAL_KEEP** · SIM delta 갱신 |
| 2026-07-13 | 29일 장기 베이스라인 — Lv11 · CR 얇음 · fiscal WARN · SIM 동일 delta |
| 2026-07-19 | 정오 이후 부트 **타이틀 멈춤** — batch 중 `yieldJsThread` |
| 2026-07~08 | 소유권 item_defs 단일 정본 · synth 프론티어 경제 편입 · 분쟁↔재정 연동 일부 |
| **2026-08-02** | balance-ops **WARN** · band drift **CRITICAL 전 밴드** · convoy `core_prime` 1 fail · fiscal max **3.16×** · gini **0.236** |

학습 스냅샷: `tools/balance-ops-audit/reports/learning-state.json` (6월말 PASS → 7~8월 WARN·CRITICAL band 고착 패턴).

---

## 2. 런타임 아키텍처 (현재 구현 정본)

### 2.1 트리거
- `ArcCoreDailyOpsSubCore` — 부트 **지연 probe** + 60s 벽시계 → `shouldRunArcCoreDailyBatch` (Asia/Seoul **12:00**, 관측 24h)
- 실행체: `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts`
- 플래그: AsyncStorage `arcfire_arc_core_daily_ops_v1`

### 2.2 일일 패스 순서 (실제 코드 · v4.0 6줄 요약보다 많음)

| # | 패스 | 역할 |
|---|------|------|
| 0–1 | hydrate · trend/gauge intent begin | 스냅 시작 |
| 2–4 | synth 진척 · world unlock · synth stat 편입 | 확장 성계 |
| 5–7 | energy(R) · mineral ledger · environment | 지표 생태 |
| 8–10 | contested aftermath · wealth · rebellion | 분쟁·빈부·반란 |
| 11 | master balance | 존 타겟 소프트 너지 |
| 12–13 | **fabric** · play scenario(catalog·route) | 실물→스탯·진열 |
| 14 | SIM ingest · market micro · trade route daily | 가격 1회 |
| 15 | AABS + **integrated engage HP** | 전투 난이도 |
| 16–19 | **convoy** · **upkeep** · central bank · **fiscal closed loop** | 물류·금고·재정 |
| 20–22 | equilibrium · lab/tavern · mission/PGP/ownership 가격 | 장기 평형 |
| 23–24 | learning(optional) · gauge apply · trend commit | 마감 |

패스 간 `yieldJsThread()` — 부트 블로킹 방어.

### 2.3 가격·탄성 계약
| 항목 | 상태 |
|------|------|
| CSV `price_elasticity=0` | 유지 |
| 실시간 매매 가격 변동 | **없음** (핫패스 금지) |
| 실제 변동 경로 | 일 1회 micro-adjust · SIM overlay · fiscal trade_route 너지 |
| `getTradeRoutePriceElasticity()` | **미사용 dead API** — 계약은 “호출 부재”로만 성립 |

### 2.4 무역 구조
- 21행성 중 무역소 **17** (vega·titan·abyss_gate·eternal_throne 제외)
- 카탈로그: `tradePortCatalogPolicy` (존 게이트·함선·소유권 증서)
- 루트: `tg_*` + `planetTradeMarketStore` (**카탈로그와 병행 — 이중 시장**)
- 금고 3축: 수송선단 · ArcCore(RED) · Blue — 자동 이체 없음
- Fabric: 24h KST 창 누적 → 일 1회 `supplyStockScale` [0.35,1.65] · R/P Δ≤2

---

## 3. 행성 핵심 스탯 (R/P/D/T/E) 초정밀

### 3.1 정본 이원화 (의도)
| 층 | 정본 |
|----|------|
| 시드 | `planets.csv` core* 5축 · optional genesis overlay |
| **런타임** | `planetCoreRuntimeStore` (`arcfire_planet_core_runtime_v1`) — **플레이 중 정본** |
| Persist | dirty + **1.5s coalesce** |

UI는 hydrate 후 **반드시 runtime** 읽기. CSV 직독 = stale.

### 3.2 일일 스탯 드라이버
| 축 | 주 드라이버 | 상한/노트 |
|----|-------------|-----------|
| **R** | energy pass(광물·궤도 정렬) · fabric R nudge | energy Δ cap ~7/day · fabric ≤2 |
| **P** | fabric · master · wealth | ≤2 fabric 등 소프트 |
| **D** | 공격 신호 · 분쟁 aftermath · 개발 | 전투 피해 ↔ 개발 방위 |
| **T** | 개발·마스터·환경 다양성 | 환경 패스 인근 다양성 cap |
| **E** | environment diversity | 인근 샘플 + transport-acc |

**플레이어 소유(authority) 행성**: master balance 게이지 쓰기 **메타/제한** — AI 월드 드리프트를 소유국에 강제하지 않음.

### 3.3 광물·R 의미 한계 (AGENTS·코드 주석 동일)
| 됨 | 안 됨 |
|----|--------|
| CSV 매장 프로필 → 우주 풍부도 → **R 목표** | 실시간 채굴 DB 재집계 |
| 궤도 소행성 수 ↔ R 블렌드 | 비멤버 행성 프로필 참여 |
| | mineral 스폰·소모·가격이 R 패스만으로 순환 |

→ “에너지 지표 R” ≠ “실제 매장량 원장”. 롱텀 경제 내러티브 시 보완 필요.

### 3.4 행성개발 결합
- 시설 레벨 → 업킵 할인 · TDI→PGP · (정책 fraction>0 시만) 즉시 너지
- 일일 **equilibrium** 패스가 장기 목표 정합

### 3.5 관측 (3h audit 2026-08-02 · 헤드리스+점유 시드)
- 교역 수익 발생 19/19 (synth 포함 스케일)
- deficit fee/upkeep: **eden_city 0.96×** · **shadow_market 0.04×** · **synth_002_p 0.79×**
- 상단: sirius_border · blood_station **3.16×** (정책 WARN 하한 20× 미충족 → audit WARN만)
- Convoy **core_prime fail**

---

## 4. 플레이어 성장 초정밀

### 4.1 통합 레벨링 (전투 난이도 축)
- `recordMatchSummary` (로컬 텔레메트리)
- `runIntegratedEngageHpAdjustPass`: 표본≥3 · target engage 대비 ×1.12/0.88 → **globalEngageHpMul ±0.025**, 캡 **[0.7, 1.3]**
- **개인 레벨 곡선이 아님** — 월드 적 HP 소프트 스로틀

### 4.2 크레딧 소스/싱크
| 소스 | 싱크 |
|------|------|
| 무역 차익·판매 | 매입·무역 수수료 |
| 미션/주점 보상 | 행성 개발 설치 |
| (약) 전투 보상 | 소유 행성 일일 업킵 |
| 젬→크레딧 BM | 함선·장비 카탈로그 |

### 4.3 장기 실측 (2026-07-13 베이스라인 · 약 29일)
| 지표 | 값 |
|------|-----|
| 레벨 | **11** |
| 크레딧 | **2,252** |
| SP | 7 |
| 기함 | 파이터 Mk.I |
| 방문 | 4행성+synth |

해석: 월드 vault(수송 52만+ · RED 일 Δ 15만 규모 헤드리스)와 대비하면 **플레이어 소프트커런시 루프가 얇음** — 성장은 레벨·미션에 치우치고 **경제 권력(CR·함대) 축적은 약함**.

### 4.4 성장 루프 갭
1. 전투 → 월드 경제: engage HP mul 만 · 전리품/전장 시장 약함  
2. 소유권 임대 수익: 트래픽·수수료 원장 의존 · 조기 계정에 체감 약  
3. level-band vs 무역 무기 가격: **band drift CRITICAL** 로 중·후반 성장 수학 붕괴 위험  
4. BM/시즌패스: 계정·UI 축, ArcCore 월드 SIM과 분리

---

## 5. 시뮬레이션·운영 감사 (현재)

### 5.1 balance-ops 2026-08-02
- Overall **WARN**
- 일 1회·elasticity 0·고빈도 스캔 **OK**
- Whale/F2P **3.12 ok** (<5)
- **Level-band CPH gap critical 전 밴드** (early 950% … late **21074%**) → 권고 `weapon_median_vs_band_cph_window`
- Fiscal: max fee/upkeep **3.16×** · gini **0.236** → monitor closed loop

### 5.2 planet-economy 3h 2026-08-02
- Overall **WARN**
- convoy ok=18 fail=**1 (core_prime)** · demandCovered=19
- deficit 3 · fee 합 Δ +9809

### 5.3 SIM
- deltaId **`2026-07-02-1782976813591`** — ~1개월 고정
- 재실행·테이블 재정렬 후 신규 delta 미반영 위험

---

## 6. 오류·구조 리스크 목록 (우선순위)

| P | 이슈 | 근거 | 권장 (텍스트) |
|---|------|------|----------------|
| **P0** | Level-band 무기 중앙값 대비 CPH 괴리 | balance-ops CRITICAL 전 밴드 | 밴드 창·무기 가격 테이블 정합 → `sim:economy` 재실행 |
| **P1** | 허브 재정 양극화 · shadow_market 0.04× | 3h fiscal | 루트/수요/수수료 바닥 · fiscal 목표 1~3× 설계 명문화 |
| **P1** | Convoy `core_prime` 실패 | 3h fail | round-trip 실패 경로 로그·공급 배정 수정 |
| **P1** | 플레이어 CR 성장 thin | 29d baseline | 전투/미션 무역 연계 CR 밴드 · 조기 싱크 완화 |
| **P2** | 카탈로그 vs tg 이중 시장 | fabric docs | 허브 단일 read model / fabric reconcile UI 연동 |
| **P2** | Daily started 후 중단 시 당일 재실행 공백 | mark start before complete | 완료 마커 분리·partial resume |
| **P2** | elasticity getter dead API | grep 0 | 하드 assert 또는 제거+문서 |
| **P3** | R=광물 추상 | energy pass | DB 매장 원장 로드맵 또는 카피 정정 |
| **P3** | SIM delta stale · 문서 부재 | Jul docs | SIM 주기 배치 · ECONOMY_* 문서 복원 |
| **P3** | Upkeep shortfall 무페널티 | code TODO | 소유국 스트레스 파라미터 |
| **P4** | 평가 문서 일부 구식 | fabric P2 부분 vs 문서 | eval README 갱신 |

---

## 7. 보완 로드맵 제안 (구현은 유료 김팀장)

### Phase A — 밸런스 정합 (긴급)
1. level_band × weapon median CPH 수학 감사·테이블 수정  
2. `npm run sim:economy` + overlay 반영 → whale/F2P·band 재측정  

### Phase B — 월드 재정 안정
1. `core_prime` convoy FAIL 수정  
2. shadow_market 수요/루트 부양 · fiscal closed loop 임계 정책 재검토  

### Phase C — 플레이어 성장 경제
1. 전투/미션 CR 곡선 + 무역 연동 싱크 표  
2. 소유권 fee→지갑 체감 튜토리얼·미션  

### Phase D — 운영·문서
1. SIM 주기 · AGENTS 깨진 링크 정리  
2. 배치 완료 원자성 · elasticity 계약 코드화  

---

## 8. 핵심 파일 인덱스

| 영역 | 경로 |
|------|------|
| 일일 배치 | `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` |
| Fabric | `src/arcCore/economy/planetEconomyFabric.ts` |
| 시세·ingest | `runMarketMicroAdjustPass.ts` · `ingestBalanceOverlayDelta.ts` |
| Convoy/Upkeep | `runArcCoreConvoyDailySettlementPass.ts` · `planetUpkeepPolicy.ts` |
| Core R/P/D/T/E | `planetCoreRuntimeStore.ts` · `runPlanetEnergyCorePass.ts` |
| 광물 | `src/world/mineralDepositModel.ts` |
| 전투 레벨링 | `runIntegratedEngageHpAdjustPass.ts` |
| 카탈로그 | `tradePortCatalogPolicy.ts` |
| 감사 최신 | `tools/balance-ops-audit/reports/latest.md` · `planet-economy-3h-audit/reports/latest.md` |
| 설계 | `docs/ARC_CORE_ECONOMY_FABRIC.md` |
| 베이스라인 | `docs/economy-evaluation/2026-07-13-pre-reset-longrun-baseline.md` |

---

## 9. 결론

현재 Arcfire 경제 모델은 **“일 1회 ArcCore 배치 + 탄력 0 + 로컬 vault/팩션 원장”** 으로서 모바일 싱글 아키텍처 계약은 **통과**한다.  
그러나 **(1) level-band 대 무기 경제 수학 붕괴**, **(2) 허브 간 재정 불균등·core_prime 수송 실패**, **(3) 플레이어 크레딧 성장이 월드 엔진 대비 얇음**, **(4) R/P 지표와 실물 무역의 의미 단절 잔존**이 보완 핵심이다.

다음 개발 액션은 **김경제=재측정 관측**, **김팀장(Opus)=P0·P1 코드**, **Fable=CSV/밴드** 분업이 정본 워크플로다.

---

*End of report · 2026-08-03 KST*
