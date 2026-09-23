# AABS 능동 밸런싱 시스템 — 전수 조사

> **조사일**: 2026-08-13  
> **범위**: 런타임 코드·CSV·기존 문서 대조 (코드 미변경)  
> **상태**: 조사 스냅샷  
> **관련 헌법**: v4.0 §10-1·§10-3·§14-8·§14-14 · `AGENTS.md` 일일 배치

---

## 0. 한 줄 결론

AABS는 **CSV를 직접 고치지 않고** 전역 배율로 보상·난이도를 일 1회 보정하려는 아크코어 축이다.  
**실제로 플레이에 닿는 축은 EXP·크레딧·수송 마진·적 HP(별도 패스)뿐**이다.  
일일 정렬의 핵심인 Sim-Bot 200은 **실플레이 데이터가 아닌 합성 루프**라, 학습기처럼 보이지만 관측 기반 자율 밸런스는 아니다.

---

## 1. 무엇인가

**AABS** = ArcCore Active Balancing System. 서브코어 표시명 **테미스** (`ai_aabs_subcore`).

의도(코드 주석·헌법):

- 24시간 관측 후 **정오(Asia/Seoul 12:00) 1회**만 반영
- 콘텐츠 CSV 런타임 Overwrite 금지 → `multipliers`만 조정
- 1회 스텝 상한 5%, 누적 캡 존재
- 고빈도 실시간 HP/가격 재배치 금지

원본 기획 파일은 코드가 인용만 하고 **저장소에 없다.**

| 인용 경로 | 저장소 |
|---|---|
| `2.2.ArcCore_AABS_Final_Spec_v2.2.md` | **없음** |
| `3.Post_AABS_Automation_Roadmap.md` | **없음** |
| `4.Autonomous_Game_Development_System_Spec.md` | **없음** |

현재 정본은 구현이다. `_001` 마스터 밸런스 스펙은 AABS 배율을 다루지 않고, `_002_COMBAT_ML_BALANCE_PIPELINE.md`는 **구 서브코어 이름·12분 틱을 적어 현행과 불일치**한다.

---

## 2. 구성 (파일 지도)

```text
일일 배치 runArcCoreDailyOpsBatch
 ├─ ingestBalanceOverlayDeltaIfPending   ← Macro SIM / RTDB 정책팩
 ├─ flushDailyOpsObservationsToAabs      ← 총독·비콘·체류 큐 (실사용 거의 없음)
 ├─ runDailyPolicyAlignment              ← AABS 본체 (Sim-Bot → 배율 · NPC 배치는 §13에서 분리)
 └─ runIntegratedEngageHpAdjustPass      ← 실전투 교전시간 → 전 행성 적 HP
                                              (AABS knob이 아님, 같은 배치 슬롯)

부트: AiAabsSubCore.onBoot → aabsPolicyStore.loadAsync 만 (무거운 패스 없음)
```

| 모듈 | 역할 |
|---|---|
| `src/arcCore/aabs/aabsConstants.ts` | 스텝 5% · 누적 ±15% · Sim-Bot 200 · 가디언 50% |
| `src/arcCore/aabs/aabsPolicyStore.ts` | `arcfire_aabs_policy_v1` · 6 knobs · Safe Mode |
| `src/arcCore/aabs/simBotEngine.ts` | 합성 200봇 드리프트 |
| `src/arcCore/aabs/growthSyncEngine.ts` | 드리프트 → `applyStepToward` |
| `src/arcCore/aabs/guardianMode.ts` | 인플레/다중 크리티컬 시 배율 리셋 |
| `src/arcCore/aabs/deploymentExecutor.ts` | 잔존 API. 일일 정렬에서는 **미호출** (§13) |
| `src/arcCore/aabs/dailyPolicyAlignment.ts` | Observe→Analyze→Write→Verify 오케스트레이션 |
| `src/arcCore/aabs/agds/insightEngine.ts` | AGDS 의사결정 **미배선** |
| `src/arcCore/aabs/postAabs/userFeedbackLoop.ts` | 체류 이상 **미호출** |
| `src/arcCore/userMod/dailyOpsObservationQueue.ts` | 총독/비콘/체류 → 다음 배치 |
| `src/arcCore/balance/runIntegratedEngageHpAdjustPass.ts` | 실측 교전시간 → `globalEngageHpMul` |
| `tables/balance/dynamic_overlay.csv` | 배율 시드 (현재 exp 1.030, 나머지 1.000) |
| `tables/balance/level_band_targets.csv` | Sim-Bot 목표 분/레벨·시급 |
| `tables/balance/arc_core_daily_ops_policy.csv` | `runAabsAlignmentPass=TRUE` |

---

## 3. 6개 knob — 살아 있는 것 / 죽은 것

캡: 코드상 **0.85 ~ 1.15** (`AABS_MAX_CUMULATIVE_RATIO = 0.15`). 1회 이동 최대 **±0.05**.

Safe Mode가 켜지면 `getEffectiveMultiplier`는 전부 **1.0** (시드 CSV도 무시).

| knob | 일일 Sim-Bot이 만지나 | 플레이 적용 지점 | 실효 |
|---|---|---|---|
| **expReward** | O (분/레벨을 EXP 축으로 사용) | `playerStore.addExp` | **실효** — 미션·웨이브 클리어·(비웨이브) 격침 EXP |
| **creditReward** | O (시급) | `playerStore.addCredits` | **실효** — 미션·업킵 페이아웃·무역 판매·전투. **환불은 `refundCredits`(§13)** |
| **tradeIncome** | Sim-Bot 직접 조정 아님. `syncEconomicMultipliers`가 credit에 추종. SIM ingest는 목표값 있음 | 수송선단 하역 순마진 (`applyConvoyUnloadVaultSettlement`) | **월드 금고만** (플레이어 지갑 아님) |
| **miningYield** | credit에 0.98배로 추종 | `applyAabsMiningYieldMultiplier` **호출처 0** | **무효** |
| **dropWeight** | Sim-Bot 미조정. 비콘/총독 큐만 | 전리품/드롭 테이블 **미연결** | **무효** |
| **combatDifficulty** | Sim-Bot 미조정. SIM `combatWeight=0`이라 ingest 생략 | 전투 HP/명중 **미연결** | **무효** |

전투 난이도의 **실제** 레버는 AABS knob이 아니라:

`recordMatchSummary` → 일 1회 `runIntegratedEngageHpAdjustPass` → `planetCoreRuntimeStore.globalEngageHpMul` (0.7~1.3, 스텝 ±0.025) → 적 팀 `maxHp`에만 곱함 (`PlanetEdenRaidTestLayer` 레드/오렌지).

플레이어 기함 HP·스탠스·무기 CSV는 이 배율을 타지 않는다.

---

## 4. 일일 파이프라인 (정오 배치)

정책 `runAabsAlignmentPass=TRUE`일 때 순서:

1. **SIM overlay ingest** (시장 가격 패스 안)  
   - 현재 번들 delta `combatWeight: 0` → `combatDifficulty` 미적용  
   - `creditReward` 목표 ≈ 0.95, `tradeIncome` ≈ 0.96 (2026-07-02 SIM)  
   - 동일 `deltaId`는 재적용 안 함
2. **관측 큐 flush** — 총독/비콘/체류. UI가 `userModController`를 **호출하지 않아** 실기에서 거의 빈 큐
3. **`runDailyPolicyAlignment(force=true)`**  
   - overlay 테이블 리로드 (번들 시드)  
   - Sim-Bot 200  
   - 가디언 판정 → 발동 시 Safe Mode + baseline 리셋 후 **성장 동기화 생략**  
   - 아니면 Growth Sync + 경제 knob 추종 (**NPC gather 없음**, §13)  
4. **통합 교전 HP 패스** (실전투 로그, AABS 스토어와 별축)

부트 동기 경로에는 이 패스가 없다. `AiAabsSubCore.onBoot`는 hydrate만. 헌법(시작 화면 최소 활성)과 맞다.

---

## 5. Sim-Bot 200 — 효과의 핵심 허점

`runSimBot200Engine`은 실유저·실전투를 읽지 않는다.

- 봇 200 = 레벨 1~20 순환 + `ai_virtual_player_density` 전투/무역/탐험 비중
- `minutesPlayed` = **CSV 목표분 × 레벨 × 아키타입 계수** (합성)
- `creditsEarned` = 같은 식의 시급 × 배율 (합성)
- 그 “관측치”를 다시 `level_band_targets.csv`와 비교해 drift를 만든다

즉 **목표표로 가짜 세계를 만들고, 같은 목표표와 비교**한다. 닫힌 루프다.

### 5-1. 밴드 기준점 왜곡

봇은 1~20레벨을 섞는데, 비교 밴드는 **평균 레벨(≈11)의 mid_early** (`targetMinutesPerLevel=60`, `targetCreditsPerHour=2400`)다.  
early 밴드(1~10, 목표 15분)가 평균 분을 끌어내려, 합성 평균 분은 60분보다 **체계적으로 낮게** 나온다.  
대략 갭 ≈ **−20%** 근처 → `expReward`를 **매일 소폭 상향**하려는 압력이 생긴다. 실플레이와 무관하다.

### 5-2. EXP 축 부호

`expReward` drift의 observed는 **EXP가 아니라 분/레벨**이다.

- 분이 목표보다 많음(성장 느림) → 배율 **하향** → 더 느려짐  
- 분이 목표보다 적음(성장 빠름) → 배율 **상향** → 더 빨라짐  

크레딧 축(시급 vs 목표 시급)은 인플레/디플레 방향이 맞다. EXP 축은 **체류 보정과 반대**다.

### 5-3. 가디언

크레딧 갭 ≥ 50% 또는 critical 축 2개 이상이면 Safe Mode.  
합성 루프가 목표 근처에 붙도록 짜여 있어 **실기 인플레를 거의 못 본다.** 실크레딧 폭등은 이 가디언을 우회한다.

---

## 6. 병렬 시스템 (AABS가 아닌 것)

혼동하면 안 되는 세 층:

| 층 | 입력 | 출력 | 주기 |
|---|---|---|---|
| **AABS knobs** | Sim-Bot + SIM ingest + (미사용) 관측 큐 | EXP/CR/수송마진 배율 ±15% | 일 1회 |
| **globalEngageHpMul** | 최근 전투 최대 20건, 표본≥3 | 전 행성 **적 선체 HP** 0.7~1.3 | 일 1회 |
| **economyPriceOverlay** | `sim:economy` 카테고리 목표 | 무역 가격 미세조정 (탄력 0 헌법과 별축, 일 1회 스텝) | 일 1회 |

`docs/_002`가 말하는 12분 wall-tick 전투 학습 서브코어는 **현 코드에 없다.** 교전시간 보정은 일일 배치만.

HP 패스 기준 행성은 기본 `eden_prime`의 `targetEngageSec`다. 미네르바(48초) 등 행성별 목표와 **한 숫자로 전 우주 적 HP**를 민다. 짧은 행성에서 공격 태세로 빨리 이기면 전 행성 적이 두꺼워질 수 있다.

---

## 7. 장점 (실제로 지키는 계약)

1. **고빈도 금지 준수** — 틱/렌더에서 배율을 다시 계산하지 않는다. 배치는 정오 슬롯.
2. **부트 격리** — 시작 화면에 Sim-Bot·정렬을 묶지 않는다.
3. **CSV 정본 보호** — 함선·무기 테이블을 런타임에 덮어쓰지 않는다.
4. **스텝·누적 캡** — 한 번에 경제가 ±50%로 점프하지 못하게 막는다 (knob 축 한정).
5. **Safe Mode 킬스위치** — 이론상 배율을 1.0으로 고정. (발동 조건은 약함)
6. **관측 큐 설계** — 총독/비콘을 실시간 AABS에 넣지 않고 배치로 미루는 구조는 헌법과 맞다. (다만 UI 미연결)
7. **적 HP 소프트 스로틀** — 실전투 시간으로 전역 HP를 조금씩 맞추는 축은 AABS knob보다 **실데이터에 가깝다.**

---

## 8. 문제 (실효·설계)

### P0 — 학습처럼 보이지만 학습이 아님

Sim-Bot이 실측을 대체한다. 유저가 막히거나 학살해도 **EXP/CR 배율은 합성 드리프트 + 오래된 SIM delta**로 움직인다.

### P0 — knob 절반이 허수

`miningYield` · `dropWeight` · `combatDifficulty`는 스토어에 쌓이지만 채굴·드롭·전투에 **곱해지지 않는다.**  
총독 `security`의 `combatDifficulty 1.05` 같은 정책도, 연결되면 숫자만 변하고 전투는 그대로다.

### P1 — `addCredits` 전방 적용 — **§13에서 환불 분리**

무역 매입 롤백·행성개발 환불은 `refundCredits`. 업킵 지갑 **지급**은 보상으로 보고 `addCredits` 유지.

### P1 — EXP 부호 + 밴드 기준 왜곡

매일 합성 갭이 `expReward`를 올리는 쪽으로 밀 수 있다. CSV 시드가 이미 **1.030**. 캡 1.15까지 잠식하면 미션/전투 EXP가  basline 대비 최대 약 +15%(시드 포함 시 그 이상에서 클램프).

### P1 — NPC 배치가 궤도 트래픽 전체를 옮김 — **일일 경로는 §13에서 분리**

`npc_gather_planet`은 유인 비콘·총독 security만. `AiNpcSubCore`는 명령 시 **수송 함선 전부**를 그 행성 `entering`으로 리셋하는 계약은 유지. 함장 단위 축소는 미착수.

### P1 — 원본 스펙 유실 + 헌법 캡 불일치

v4.0 §14-8: 「AABS 1회 5%, 누적 **0.7~1.3**」  
구현 AABS: 5%, 누적 **0.85~1.15**  
0.7~1.3은 **`globalEngageHpMul`** 쪽이다. 문서가 두 시스템을 한 문장에 섞었다.

### P2 — 계정·월드 경계

`arcfire_aabs_policy_v1`는 uid가 없고 `purgeLocalAccountData` 대상도 아니다.  
월드 축으로 보면 맞지만, **EXP/CR는 플레이어 보상**이라 계정 초기화 후에도 기기 배율이 남는다.

### P2 — Post-AABS / AGDS / 총독 UI 미배선

| API | 상태 |
|---|---|
| `detectUserDwellAnomaly` / `applyUserDwellCorrection` | export만, 호출 0 |
| `shouldShowOnboardingGuide` / `shouldSpawnMissionBalanceAssist` | 호출 0 |
| `buildAgdsLogicInput` | 일일 정렬에 미사용 |
| `userModController.applyPolicyShift` / `deployProsperityBeacon` | 앱 UI 호출 0 |

`tools/aabs-verify`는 AABS 수치 검증이 아니라 **테이블 빌드 + tsc 묶음**이다. 최신 리포트(2026-06-07)는 tsc FAIL로 남아 있다.

### P2 — `_002` 문서 노후

12분 틱 `AiCombatLearningBalanceSubCore` · `AiIntegratedPlanetCombatBalanceSubCore`는 현 트리에 없다. 교전 HP는 일일 패스만.

---

## 9. 플레이어가 체감하는 효과 (현재)

| 상황 | 효과 |
|---|---|
| 미션 클리어 EXP/CR | AABS `expReward` / `creditReward` 곱셈 |
| 웨이브 클리어 EXP (`planet.tsx` `addExp`) | 동일 |
| 비웨이브 격침 EXP | 동일 (웨이브 중 per-kill EXP는 별도 스킵) |
| 무역 판매 차익 | `addCredits`면 CR 배율. 매입 환불도 배율 |
| 아크코어 수송 하역 | `tradeIncome` → 팩션/아크 금고 마진만 |
| 채굴량 | AABS 없음 (장비 `miningYieldBonusPct`만) |
| 드롭/유물 가중 | AABS `dropWeight` 없음 |
| 적 맷집 | `globalEngageHpMul`만 (표본 3전 이상, 전 행성 공통) |
| 스탠스·명중·살보 | AABS 비관여 |

기본 시드 `expReward=1.030`이라, 정렬이 한 번도 없어도 EXP는 CSV 대비 **+3%**에서 시작한다.

---

## 10. 판정

| 질문 | 답 |
|---|---|
| 시스템이 존재하는가 | 예. 스토어·일일 슬롯·캡·Safe Mode까지 구현됨 |
| 헌법(일 1회, CSV 미개조, 부트 비동기)을 지키는가 | **대체로 예** |
| 능동 학습기로서 실효인가 | **아니오.** Sim-Bot은 합성, 실전투는 HP 패스만 |
| 6 knobs가 모두 게임 수치인가 | **아니오.** 3개는 허수 |
| 경제·성장에 영향이 있는가 | **예.** EXP/CR 전역 곱셈 + 적 HP 별축 |
| 그 영향이 의도대로 적절한가 | **부분적.** 캡은 안전장치, 입력(합성·밴드 왜곡·환불 곱셈·NPC 전체 gather)은 부적절 |

**요약:** AABS는 “폭주 방지용 전역 딤머 + 일일 배치 골격”으로는 가치가 있다.  
“유저 플레이를 보고 난이도/보상을 맞추는 테미스”로는 **아직 완성되지 않았고, 허수 knob과 합성 루프가 그 인상을 과장한다.**

실전투 피드백이 필요한 난이도는 이미 `globalEngageHpMul`이 담당한다. AABS `combatDifficulty`와 역할을 나누지 않은 채 이름이만 남아 있다.

---

## 11. 후속 (조사만 — 미착수)

우선순위는 구현이 아니라 대표님 방향이다. **§13 두 건은 2026-08-13 반영.**

1. Sim-Bot을 실측(미션 클리어 분, 실시급, 교전 로그)으로 교체하거나, 합성 정렬을 **끄고** ingest+HP 패스만 남기기  
2. `miningYield` / `dropWeight` / `combatDifficulty`를 **실제 적용하거나 knob에서 제거**  
3. ~~`addCredits`에서 환불·롤백은 배율 제외~~ → §13  
4. ~~`npc_gather_planet`을 AABS 일일 배치에서 분리~~ → §13 (함장 단위 축소는 미착수)  
5. 유실 스펙(`2.2` / Post-AABS / AGDS)을 복구하거나 본 문서를 정본으로 명시  
6. v4.0 §14-8 캡 문구를 AABS ±15% vs HP 0.7~1.3으로 분리  
7. `_002`를 현행 일일 HP 패스에 맞게 수정  

---

## 12. 교차 참조

- 헌법: `.cursor/rules/Arcfire_Master_Spec_v4.0-*.mdc` §10 · §14-8 · §14-14  
- 배치: `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts`  
- 학습 설계(미완): `docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md`  
- 노후 전투 ML: `docs/_002_COMBAT_ML_BALANCE_PIPELINE.md`  
- 경제 재스캔 중 레벨링 요약: `docs/economy-evaluation/2026-08-03-economy-full-rescan.md` §4.1  

---

## 13. 조치 (2026-08-13 · 실버그만 · 안정성 우선)

코드 반영. Sim-Bot·허수 knob·적 HP 패스는 **미변경**.

| 버그 | 조치 | 유지 |
|---|---|---|
| 무역 매입 롤백·행성개발 환불에 `addCredits` → AABS 배율로 원금 왜곡 | `refundCredits` (배율·lifetime 없음) | 미션/판매/업킵/전투 보상은 `addCredits` 유지 |
| 일일 AABS가 `npc_gather_planet`으로 궤도 함선 전체 소집 | `runDailyPolicyAlignment`에서 배치 집행 제거 | 유인 비콘·총독 security 소집 계약 유지 |  
