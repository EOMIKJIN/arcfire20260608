# 경제 시스템 전수 구조 감사 — WIP (3루프 · PM 22:00 FINAL)

> **김팀장(글록 4.5)** · 대표님 지시 2026-08-04 19:35~ · **최종 보고 목표 22:00 KST**  
> **방법**: 최초 재검수 후 **총 3회** 전수 재조사 루프 · 본 파일은 루프별 누적 · FINAL은 별도 파일로 확정  
> **코드 수정**: 본 턴은 **분석 우선** · P0 즉시 패치는 FINAL에서 권고표로만 (대표님 승인 후 착수)  
> **서브에이전트**: [Loop1 economy](ee8ed749-8c8b-4f4c-a055-40695b64e830) · [Loop1 account/Firebase](b5ce8e26-7f13-4ad5-8e9e-ee103b90393c) — **API limit로 실패** → 본 세션이 전수 조사 단독 수행

```text
[pss-pre-dev] hot_path=일1회배치·무역수수료·부트 hydrate · alloc=배치패스/카탈로그 · cache=vault·overlay·planetCore blob
[pss-pre-dev] stage=월드경제 vs 플레이어축 · Firebase once/RTDB · purge/개시일 hardReset · risk=P1,P5,P6
[pss-pre-dev] verdict=PASS(분석) — 구현은 FINAL 권고·승인 후
```

---

## Loop 1 — 경제 런타임 · 금고 · 배치 · Firebase 1차 (진행 중)

### 1.1 유지 OK (계약 준수)

| 축 | 근거 |
|----|------|
| 일 1회 배치 · elasticity=0 | `runArcCoreDailyOpsBatch` · CSV; `getTradeRoutePriceElasticity` **미사용 dead API** |
| onSnapshot 경제 경로 **없음** | `src` 전수: 경제·금고에 listener 없음 · RTDB `fetchArcCoreRtdbOnce` + KPI set(타임아웃 6s) |
| 부트 경제 hydrate 지연 | `AiEconomySubCore.onBoot` → `InteractionManager.runAfterInteractions` |
| 계정 purge ≠ 월드 금고 | `localAccountReset` 주석·독립국 vault만 제로 · 1~4 월드 유지 |
| 성계 개시일 hardReset 레버 | `worldExpansionGlobalResetDetection` + schedule `preserveAlreadyUnlocked=false` (2026-07-29 task) |
| 배치 패스 격리 | step throw → 배치 계속 (2026-08-03 incomplete 회귀 대응) |

### 1.2 P0 / P1 / P2 (Loop1 초안)

| ID | Sev | 발견 | 증거 | 보완 방향 |
|----|-----|------|------|-----------|
| E1 | **P0** | **서비스 개시일「전행성 경제 월드 리셋」단일 API 부재** | vault·fee ledger·overlay·market·fabric window는 account purge에서 **유지**; synth hardReset만 존재 | `resetArcCoreWorldEconomyForServiceLaunch()` 설계: 월드 vault 1~4 시드 재적용 · fee ledger clear · overlay clear · market rebuild · dailyOps dayKey 리셋 · **플레이어축 보존 옵션** |
| E2 | **P0/P1** | 일일 배치 완료 게이트·트렌드 — 장기 incomplete 이력 | `runArcCoreDailyOpsBatch` 격리 패치 있음 · device_PASS 미완 · trend UI 동결 이슈 | device에서 `lastBatchCompletedDayKey` 실측 · incomplete handoff 잔여 마감 |
| E3 | **P1** | 부트 `resyncAllCoreOpenTradePortCatalogs` ↔ 일일 `syncTradePortCatalog` **이중 경로** | `AiEconomySubCore` + play scenario | warm 플래그·세션 중복 스킵 · boot는 현재 행성/코어만 |
| E4 | **P1** | 무역소 카탈로그 vs `planetTradeMarketStore` **이중 시장** | FABRIC §3-D · TradeEngine+market | Fabric 스냅샷 단일화 로드맵 유지 · 단기: 가격 소스 of truth 문서화 |
| E5 | **P1** | `planetCoreRuntimeStore` **단일 AsyncStorage blob** 전행성 | BOOT roadmap · store | 읽기 1회 vs merge 분리 · purge는 BLUE/deed만 리셋·RED 유지 — 개시일 월드리셋과 교차 설계 필요 |
| E6 | **P1** | 중립 vault 시드 0 → 유지비 shortfall 증가 가능 | 5축 A+B REVIEWED | 관측 후 seed CSV 검토(기존값 승인) · UI Phase C |
| E7 | **P1** | Firestore `planet_holds` 단발 sync — 경제 금고는 **로컬만** | `userDataSync.ts` | 계약 OK · 다만 타기기 복원 시 vault 불일치 문서화 |
| E8 | **P2** | RTDB learning KPI — 일 1회 write · boot once read | `pushArcCoreDailyKpiToRtdb` · `fetchArcCoreRtdbOnce` | 타임아웃 OK · safeMode/throttle 유지 |
| E9 | **P2** | dead `getTradeRoutePriceElasticity` | balanceTableRegistry | 삭제 또는 assert-0 감사 훅 |
| E10 | **P2** | SIM overlay delta 신선도 (2026-07-02 고정 이력) | 08-03 rescan | `sim:economy` 재실행 주기 운영 |

### 1.3 데이터 축 매트릭스 (초안)

| Store / 원장 | 분류 | 계정 purge | 서비스 개시 월드리셋(필요) |
|--------------|------|------------|---------------------------|
| arcCoreVault · blue · transport · **neutral** | 월드 | **유지** | **재시드/클리어 대상** |
| playerIndependentNationVault | 플레이어 | **제로** | 플레이어 정책에 따름 |
| planetTradeFeeLedger | 월드 | 유지 | **클리어** |
| economyPriceOverlay | 월드 | 유지 | **클리어/재ingest** |
| planetTradeMarket | 월드 | ? | **rebuild** |
| planetCoreRuntime RED slots | 월드 | 유지 | 개시일 정책 필요 |
| planetCore BLUE/deed | 플레이어 | baseline 리셋 | — |
| clan holds / independent | 혼합 | independent→neutral | synth hardReset + 코어 시드 유지 |
| player credits/missions | 플레이어 | 리셋 | 보존(계정과 별개) |
| Firestore profile/planet_holds | 클라우드 | delete+fresh | 월드 경제와 분리 |
| RTDB learning/expansion | 클라우드 월드 | KPI push state clear | epoch/gen bump + 운영 publish |

### 1.4 Firebase 관계 (Loop1)

```text
[로컬 AsyncStorage] 금고·fee·overlay·planetCore·dailyOps flag  ←── 경제 정본
        │
        │ 단발 get/set (onSnapshot 금지)
        ▼
[Firestore] arcfire_player_v1 · planet_holds (프로필·점유만)
[RTDB]  boot once: config/policy/learning/worldExpansion
        daily once: learning/devices/{uid}/dailyKpi (6s timeout)
```

**위험**: 오프라인 queue로 profile 복원 ↔ fresh-start 플래그 경합(이미 선기록 완화).  
**위험**: 월드 경제는 클라우드 백업 대상 아님 → 기기 이전 시 월드 잔고 불연속(싱글 샌드박스 의도일 수 있음).

### 1.5 자금 흐름 (현행 5축)

```text
무역수수료 → resolveTradeFeeFactionVault → blue|neutral|independent|arccore
유지비 → player.credits | blue | neutral | arccore
convoy → transport fleet → arc share% → arccore
중앙은행 지출 → arccore only
```

---

## Loop 2 — 계정·메모리·중복·Firebase 페이로드 (2차 전수 · **20:30 웨이크 재확인 완료**)

> Loop1과 **독립 재스캔** — 같은 파일을 다시 열어 purge/미연결·핫패스만 재검증.  
> **20:30 tick**: purge 경로·onSnapshot 부재·prewarm join 24s 재확인 → 판정 유지(E11b market=RAM).

### 2.1 계정 purge 재매트릭스 (누락·OK)

| 대상 | purge API | Loop2 판정 |
|------|-----------|------------|
| playerIndependentNationVault | `resetPlayerIndependentNationVaultForAccountPurge` | **OK** (5축) |
| neutral / arc / blue / transport vault | 없음(의도) | **OK 월드** · 개시일 리셋과 혼동 주의 |
| planetTradeFeeLedger | **reset API 없음** | **P1** — 계정 초기화와 무관하나 개시일·장기 soak 시 비대 가능 |
| planetTradeMarketStore | RAM Map · persist 없음 | **P2↓(E11b)** — 재시작 시 소멸 · rebuild로 충분 |
| economyPriceOverlay | account purge 미호출 | 월드 OK · 개시일 클리어 필요 |
| centralBankExpenditureLedger | AsyncStorage 별키 | 개시일 클리어 후보 |
| planetCoreRuntime | `resetLocal…ForAccountPurge` + RED preserve | **OK** · blob 단일키 PSS 관심 |
| Firestore sync payload | `planet_holds` top-level 단일 · ops/deploy 캡 | **OK** (1MB 통제 주석) · vault **미동기** |

### 2.2 메모리·핫패스 (재확인)

| 항목 | 판정 |
|------|------|
| vault persist 1.5s coalesce | OK |
| planetCore persist 1.5s + dirty skip | OK |
| fee `ensureHydrated` | OK (race task 잔여 trade await는 CONDITIONAL) |
| convoy settlement hydrate | arc+blue ensure · **neutral/independent 미ensure** — fee 경로와 비대칭 **P2** |
| boot 전행성 catalog resync | **P1** 중복(E3) 재확인 |
| 틱 경로 경제 전행성 | 일 배치·커맨드 버스로 대체 — **PASS** |

### 2.3 Firebase (재확인)

| 호출 | 빈도 | 리스크 |
|------|------|--------|
| `syncUserDataWithServer` | 스케줄 단발 merge | 오프라인 queue · fresh-start 선기록으로 완화 |
| RTDB boot once | 세션 1회 | listener 없음 **PASS** |
| RTDB daily KPI set | 일 1회 · 6s timeout | warp hang 회귀 대응 **PASS** |
| onSnapshot 경제 | **0** | **PASS** |
| vault → cloud | **없음** | 기기 이전 시 월드 잔고 불연속 — 문서화 필요 |

### 2.4 Loop2에서 상향·추가

| ID | Sev | 내용 |
|----|-----|------|
| E11 | **P1** | fee ledger **영속·리셋 API 부재**(개시일) — `arcfire_planet_trade_fee_ledger_v1` |
| E11b | **P2↓** | trade market = **RAM Map만**(AsyncStorage 없음) — 프로세스 재시작 시 자연 소멸 · `rebuildAllPlanetTradeMarkets`로 충분. 개시일 전용 API는 불필요에 가깝다 |
| E12 | **P2** | convoy 일일 정산 시 neutral vault `ensureHydrated` 누락(비대칭) |
| E13 | **P2** | Firestore에 planetCore 일부 sync vs 로컬 vault 비대칭 — 복원 시나리오 혼선 |
| E14 | **P1** | `reseedCorruptConvoyFleetEconomyOnce`는 **수송만** 1회 플래그 — 개시일 full 리셋과 혼용 금지·확장 필요 |
| E15 | **P1** | prewarm이 daily batch join(상한) — 배치 장시간 시 UX·부분 완료 레이스 잔여(device) |

체크리스트:
- [x] vault hydrate/persist
- [x] purge vs 신규 스토어
- [x] Firestore payload 통제
- [x] trade market 영속성 재확인(RAM only)
- [x] dailyOps completedDayKey 게이트
- [x] prewarm join 구조
- [x] heavy UI economy session → Loop3 §3.5

---

## Loop 3 — 개시일 · 중복 · 권고 통합 (3차 전수 · 진행)

> **다시 처음부터**: 월드 축 키 목록 → 계정 축 → Firebase → 부트/배치 중복 → 개시일 시나리오.

### 3.1 월드 경제 AsyncStorage 키 전수 (개시일 wipe 후보)

| Key | 역할 | 개시일 full |
|-----|------|-------------|
| `arcfire_arc_core_vault_v1` | RED/중앙은행 | reseed |
| `arcfire_blue_team_shared_vault_v1` | BLUE | reseed |
| `arcfire_neutral_nation_vault_v1` | 중립 | clear→0 |
| `arcfire_arc_core_transport_fleet_bank_v1` | 수송 | reseed (기존 convoy reseed 패턴) |
| `arcfire_player_independent_nation_vault_v1` | **플레이어** | **건드리지 않음**(계정 축) |
| `arcfire_planet_trade_fee_ledger_v1` | 수수료 일집계 | clear |
| `arcfire_economy_price_overlay_v1` | SIM/micro overlay | clear |
| `arcfire_balance_overlay_delta_ingest_v1` | ingest 커서 | clear |
| `arcfire_arc_core_central_bank_ledger_v1` | 중앙은행 지출 로그 | clear |
| `arcfire_arc_core_daily_ops_v1` | 배치 완료 게이트 | clear→재가동 |
| `arcfire_arc_core_daily_ops_summary_pending_v1` | 요약 pending | clear |
| `arcfire_planet_core_runtime_v1` | 코어 지표(혼재) | **정책 분기**: RED 월드 슬롯만 genesis 재시드 vs 전체 유지 |
| `arcfire_convoy_fleet_economy_reseed_*` | 1회 플래그 | 개시일엔 플래그 리셋 후 reseed 허용 |
| (RAM) planetTradeMarket | 교역 재고 | rebuild 호출만 |

### 3.2 중복·비효율 Top 5 (개선 우선)

| # | 중복 | 비용 | 권고 |
|---|------|------|------|
| 1 | boot `resyncAllCoreOpenTradePortCatalogs` + 일일 `syncTradePortCatalogFromBalance` | 부트 JS·로그 | boot=현재성계/코어 warm · 전행성은 배치만 |
| 2 | 카탈로그 DB vs trade market(RAM) vs TradeEngine | 인지·버그 | Fabric 스냅샷 of-truth 문서+점진 통합 |
| 3 | 일일 배치 패스 수 20+ · 전행성 루프 다수 | 배치 장시간·incomplete 이력 | 패스 그룹 청크·이미 yield 있음 · KPI로 병목 패스 계측 |
| 4 | vault hydrate 배치마다 다수 await | 작음 | `ensureHydrated` 일괄 헬퍼 |
| 5 | Firestore sync에 planetCore 일부 + 로컬 vault 없음 | 복원 혼선 | 프로필 복원 문서: 「월드 경제는 기기 로컬」 |

### 3.3 Launch Day playbook (초안)

```text
D-day 운영 (코드 레버 준비 후):
1) RTDB/CSV: epochDayKey=D, resetGeneration+=1  → synth hardReset
2) 클라이언트: resetArcCoreWorldEconomyForServiceLaunch('full')  (신규)
3) dailyOps state clear → 12:00 또는 즉시 probe로 배치 1회
4) 계정 purge와 분리 — 기존 유저 진행(크레딧·미션) 유지 여부 제품 결정
5) 검증: 21코어 open · synth 0 또는 targetCount · vault≈seed · fee empty · market rebuild
```

### 3.4 김클로드 READY 후보 (FINAL에 확정)

1. `economy-service-launch-world-reset` — 월드 경제 패키지 리셋 API + 테스트  
2. `economy-boot-catalog-warm-scope` — 부트 전행성 resync 축소  
3. `economy-vault-hydrate-helper` — neutral convoy ensure + 일괄 hydrate  
4. (잔여) Phase C 금고 UI 5축 라벨  

### 3.5 heavy UI / prewarm (Loop2→3 교차)

| 항목 | 판정 |
|------|------|
| economy heavy session · vault hydrate recipes | 3금고(+수송) 패턴 — **neutral/independent UI hydrate 미편입 = Phase C** |
| prewarm daily join | **24s** soft cap · 배치 자체는 백그라운드 계속 (E15 device) |
| onSnapshot (arcCore/firebase/vault) | **경제 realtime listener 없음 PASS** |

체크리스트:
- [x] Launch Day playbook 초안
- [x] 중복 Top 5
- [x] READY 후보
- [x] heavy UI / prewarm
- [x] FINAL 문서 freeze 22:00 → `2026-08-04-economy-system-full-structure-audit-FINAL.md`

---

**WIP CLOSED — FINAL 확정 2026-08-04 22:00 KST**
