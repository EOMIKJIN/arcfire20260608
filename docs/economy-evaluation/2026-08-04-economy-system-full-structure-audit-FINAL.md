# 경제 시스템 전수 구조 감사 — FINAL (2026-08-04 22:00 KST)

> **김팀장(글록 4.5)** · 대표님 지시: 경제·전행성 데이터·계정 귀속·ArcCore·Firebase·메모리·개시일 초기화를 **3회 전수 루프** 후 최종 보고  
> **방법**: Loop1(19:36~) → Loop2(20:30 재확인) → Loop3(개시일·중복 통합) → **본 FINAL**  
> **WIP 원장**: `docs/economy-evaluation/2026-08-04-economy-system-full-structure-audit-WIP.md`  
> **코드 수정**: 본 보고서는 **분석·권고만** · 구현은 대표님 승인 후 READY/김클로드·김팀장 경로  
> **병렬 Task**: API limit로 실패 → 본 세션 단독 전수

```text
[pss-pre-dev] hot_path=일1회배치·무역수수료·부트 catalog · alloc=배치패스 · cache=vault/overlay/planetCore
[pss-pre-dev] stage=월드 vs 플레이어 · Firebase once · purge≠개시일월드리셋 · risk=P1,P5,P6
[pss-pre-dev] verdict=PASS(분석 완료) — P0 API·부트 범위는 승인 후 구현
```

---

## 0. Executive Verdict

| 층 | 판정 | 한 줄 |
|----|------|--------|
| **아키텍처 계약** | **PASS** | 일 1회 배치 · `price_elasticity=0` · 경제 `onSnapshot` **없음** |
| **Firebase** | **PASS(의도적 로컬 정본)** | Firestore=프로필/`planet_holds` 단발 · RTDB=boot once + KPI 일1회(6s timeout) |
| **계정 초기화** | **PASS(계약)** | 플레이어축 리셋 · 월드 금고1~4 유지 · 독립국 vault 제로+hold 중립 |
| **금고 5축** | **코드 AGREE(A+B)** · UI Phase C 보류 | 중립·독립 라우팅·purge 연동 완료(검수 REVIEWED) |
| **서비스 개시일** | **GAP = P0** | synth **hardReset 있음** · **전행성 경제 월드 패키지 리셋 API 없음** |
| **메모리/부트** | **WARN** | onBoot 지연 OK · 전행성 catalog 이중·planetCore 단일 blob·배치 장시간 device 미완 |
| **밸런스 깊이** | **별축(08-03)** | band CPH CRITICAL 등 — 본 구조 감사와 분리 유지 |

**종합**: 현행 경제는 **싱글 로컬 ArcCore + 일 1회 수렴**으로 헌법과 대체로 일치한다.  
가장 큰 구조 구멍은 **「계정 초기화」와 「서비스 개시 월드 리셋」이 다른 레버인데, 후자 패키지가 코드에 없다**는 점이다.

---

## 1. 3루프 요약

| Loop | 초점 | 결과 |
|------|------|------|
| **1** | 배치·금고·자금·Firebase | 계약 PASS · E1 개시일 API 부재를 P0로 상정 |
| **2** | purge·hydrate·페이로드·prewarm | onSnapshot 0 · market=RAM · fee ledger 리셋 API 부재 · join 24s |
| **3** | 개시일 키 전수·중복 Top5·playbook·READY | 월드 AsyncStorage wipe 표 · Launch Day 절차 · READY 4건 |

루프마다 **처음부터** 교차 검증했으며, Loop2에서 trade market 영속성 판정(E11→E11b)을 정정했다.

---

## 2. 유지해야 할 것 (건드리지 말 것)

1. **일 1회** `runArcCoreDailyOpsBatch` · yield · step 격리(`lastBatchCompletedDayKey` 게이트)  
2. **elasticity=0** · 핫패스 재가격 금지  
3. **경제 경로 realtime listener 금지** (현 코드 준수)  
4. **계정 purge ≠ 월드 금고** (1~4 유지 · independent만 제로)  
5. **synth hardReset** (`epochDayKey` + `resetGeneration`) — 21코어·분쟁 시드 유지  
6. **금고 factory** `createFactionVaultStore` (persist coalesce · ensureHydrated)

---

## 3. 최종 리스크·보완 표 (우선순위)

| ID | Sev | 내용 | 권고 |
|----|-----|------|------|
| **E1** | **P0** | 서비스 개시 **월드 경제 패키지 리셋 API 부재** | `resetArcCoreWorldEconomyForServiceLaunch({mode})` 신설 — vault1~4 reseed/clear · fee/overlay/ingest/central ledger/dailyOps clear · market rebuild · **independent·플레이어 진행 비대상** |
| **E2** | **P0/P1** | 일일 배치·트렌드 **device_PASS 미완** | 실기 `lastBatchCompletedDayKey`·트렌드 화살표 1회 검증 |
| **E3** | **P1** | 부트 전행성 catalog resync ↔ 일일 sync **이중** | boot=현재 성계/코어 warm · 전행성은 배치만 |
| **E4** | **P1** | 카탈로그 vs trade market(RAM) vs TradeEngine | of-truth 문서화 · Fabric 점진 통합 |
| **E5** | **P1** | `planetCoreRuntime` 단일 blob | 읽기/merge 분리 · 개시일 시 RED-only 재시드 정책 명시 |
| **E6** | **P1** | 중립 vault seed 0 → upkeep shortfall | 관측 후 seed(기존값 승인) · Phase C UI |
| **E7** | **P1** | 금고 클라우드 미동기 | 운영 문서: 「월드 경제=기기 로컬」 |
| **E11** | **P1** | fee ledger 개시일 clear API 없음 | E1 패키지에 포함 |
| **E14** | **P1** | convoy 1회 reseed ≠ 개시일 full | E1과 분리·플래그 리셋 규칙 |
| **E15** | **P1** | prewarm daily join 24s | device UX 확인 · join≠cancel 유지 |
| **E12** | **P2** | convoy 정산 neutral `ensureHydrated` 비대칭 | 일괄 hydrate 헬퍼 |
| **E8~E10** | **P2** | RTDB OK · dead elasticity API · SIM 신선도 | 감사 훅·운영 주기 |
| **E11b** | **정보** | trade market RAM only | 개시일 wipe 불필요 · rebuild면 충분 |

---

## 4. 데이터 축 · 연동 (정본 매트릭스)

| Store / 원장 | 축 | 계정 purge | 개시일 world reset |
|--------------|-----|------------|-------------------|
| arc / blue / neutral / transport vault | 월드 | 유지 | **재시드/클리어** |
| playerIndependentNationVault | 플레이어 | **제로** | 비대상(또는 제품 결정) |
| planetTradeFeeLedger · price overlay · ingest · central ledger | 월드 | 유지 | **클리어** |
| dailyOps state | 월드 | 유지 | **클리어→재가동** |
| planetTradeMarket | RAM | — | rebuild |
| planetCore RED | 월드 | 유지 | **정책 분기** |
| planetCore BLUE/deed · player · missions | 플레이어 | 리셋 | 비대상 |
| independent hold | 혼합 | **중립화** | synth hardReset과 별개 |
| Firestore profile / planet_holds | 클라우드 유저 | delete/fresh | 월드 경제와 분리 |
| RTDB expansion/learning | 클라우드 월드 | KPI state clear | epoch/gen publish |

### Firebase 관계도

```text
[AsyncStorage 로컬] 금고·fee·overlay·planetCore·dailyOps  === 경제 정본
        │ 단발 get/set only
        ▼
[Firestore] player · planet_holds · (planetCore 요약)   ← 금고 없음
[RTDB]  boot once config/policy/expansion
        daily KPI set (timeout 6s) — listener 금지
```

---

## 5. 자금 흐름 (5축 · 현행 코드)

```text
수수료 → blue | neutral | independent | arccore(RED=중앙은행)
유지비 → player.credits(소유) | blue | neutral | arccore
convoy → transport → arc_share% → arccore
중앙은행 지출 → arccore
```

Phase C: 경제 UI·heavy hydrate에 neutral/independent 미표시 — **기능 라우팅과 UI 불일치 잔여**.

---

## 6. Launch Day Playbook (운영 1안)

```text
1) RTDB/CSV: epochDayKey=D, resetGeneration+=1  → synth hardReset (21코어·분쟁 유지)
2) 클라이언트: resetArcCoreWorldEconomyForServiceLaunch('full')  ← E1 구현 후
3) dailyOps clear → 즉시 probe 또는 다음 12:00 배치 1회
4) 계정 일괄 purge와 **결합 금지** (플레이어 진행 보존이 기본)
5) 검증 체크: 21코어 open · synth=target · vault≈seed · fee empty · market rebuild · completedDayKey 갱신
```

**soft mode**(선택): overlay+market+fee만 · vault 잔액 유지 — QA/핫픽스용.

---

## 7. 중복·비효율 Top 5 → 개선

| # | 이슈 | 조치 |
|---|------|------|
| 1 | 부트+일일 catalog 이중 | boot 범위 축소 (READY-2) |
| 2 | 삼중 시장 인지 | of-truth 문서 + Fabric |
| 3 | 배치 패스 과다·장시간 | 병목 KPI · device 검증 (E2) |
| 4 | vault hydrate 분산 | 일괄 헬퍼 (READY-3) |
| 5 | 클라우드 vs 로컬 경제 | 복원 가이드 문서 |

---

## 8. 후속 작업 (김클로드 READY · 승인 후)

| 우선 | task 초안 | 내용 |
|------|-----------|------|
| **1** | `economy-service-launch-world-reset` | E1 API + 단위 테스트 + playbook 코드화 |
| **2** | `economy-boot-catalog-warm-scope` | E3 부트 전행성 resync 축소 |
| **3** | `economy-vault-hydrate-helper` | E12 + AiEconomy/배치 일괄 ensure |
| **4** | vault Phase C UI | neutral/independent 라벨·hydrate recipes |

밸런스 CPH/band(08-03 rescan)는 **별 트랙** — 구조 리셋과 동시 대규모 변경 금지.

---

## 9. 완료 선언

| 항목 | 상태 |
|------|------|
| 3회 전수 루프 | **완료** |
| FINAL 보고 시각 | **2026-08-04 22:00 KST** |
| 코드 패치 | **미실시**(분석 전용) → **2026-08-04 22:03 김팀장 글록4.5 E1 착수 완료** |
| device_PASS | **미실시** — E2·E15 잔여 |
| E1 구현 | `src/arcCore/economy/resetArcCoreWorldEconomyForServiceLaunch.ts` · verify ALL PASS |

### 후속 구현 메모 (2026-08-04 22:03 · 김팀장 직접)

- `resetArcCoreWorldEconomyForServiceLaunch('full'|'soft')` 추가 — onBoot 미연결
- E12: convoy 일일 정산에 neutral/independent `ensureHydrated` 추가
- 검증: `npx tsx tools/debug/_verify-service-launch-world-reset.cjs`

---

**END FINAL** — 김팀장 · Arcfire Online 경제 구조 감사 2026-08-04
