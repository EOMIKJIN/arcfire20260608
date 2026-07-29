# 김클로드 착수 — 정식 서비스 성계 개방(탐사) · 세대 리셋 재개방

> **배정**: 김팀장 (Cursor 본창) · **2026-07-29**  
> **대표님 제품 지시**:  
> - 정식 서비스 시작 = **21개 코어 행성** + **레드·블루 팩션 분쟁** 상태로 개시  
> - **시작일(epoch)부터** 아크코어 탐사(자동 개방)가 **미개척 synth 성계를 일 1개** 열어 감  
> - 향후·정식일 **특정일에 다시 처음부터 재개방**할 수 있어야 함  
> **선행 검토**: 김팀장 2026-07-29 분석 — 현행은 일 1개방은 동작하나 **`resetGeneration`/`epochDayKey`만으로는 기존 기기 초과 개방이 롤백되지 않음**  
> **김클로드 즉시 착수** · 완료 후 `kim-claude-handoff-pending.md` **PENDING** · **git commit 금지**  
> **task_id**: `service-launch-world-expansion-reset-20260729`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=부트·일일배치1회 sync · alloc=reconcile시 unlocked배열1회 · cache=정책캐시·applied상태
[pss-pre-dev] stage=worldmap unlock 집합 · risk=P6(persist)·세대리셋시대량 remove
[pss-pre-dev] verdict=PASS — 틱/루프 신규 금지 · gen mismatch 때만 강제 reconcile · 21코어·분쟁 CSV 무단변경 금지
```

---

## 0. 제품 1안 (고정 · 대표님 지시 반영)

| 축 | 정식 서비스 개시 상태 |
|----|----------------------|
| **코어 21** | `GAMEPLAY_SYSTEM_IDS` / 기존 코어 행성 — **항상 개방** (리셋 대상 아님) |
| **분쟁(블루·레드)** | 기존 `arc_core_territorial_combat_policy` · 시드 점유 **유지** — **본 task에서 combatMode/가중치/passInterval 변경 금지** |
| **미개척(synth)** | epoch **당일부터** `systemsPerDay=1` 로 전역 동일 일정 개방 (플레이어 수동 발견 없음) |
| **재초기화** | `epochDayKey` = 새 시작일 + `resetGeneration` += 1 → **모든 클라이언트**가 초과 synth **잠금** 후 새 epoch부터 재개방 |

**운영 절차(코드 완료 후 · 김클로드가 날짜를 임의로 박지 말 것)**:  
정식일 `D`가 정해지면 김팀장/운영이 CSV·RTDB에 `epochDayKey=D`, `resetGeneration=N+1` 반영.  
김클로드 구현은 **레버가 실제로 동작**하게 만드는 것.

---

## 1. 현황 결함 (반드시 고칠 것)

정본: `src/arcCore/syncArcCoreGlobalWorldExpansion.ts` · `worldExpansionGlobalSchedule.ts` · `worldExpansionGlobalPolicy.ts` · `worldStore.reconcileGlobalSynthUnlocks`

| # | 결함 | 결과 |
|---|------|------|
| A | `buildDeterministicGlobalSynthUnlockSchedule`가 `alreadyUnlockedSynthIds`를 **무제한 접두 고정** | `targetCount`↓ 해도 기존 unlock **유지** → 리셋 불가 |
| B | `arcfire_world_expansion_global_applied_v1`에 `resetGeneration`을 **쓰기만** 하고 **비교 안 함** | 세대 bump가 reconcile 트리거가 아님 |
| C | 정책 캐시 `arcfire_world_expansion_global_policy_v1` / RTDB가 CSV보다 우선 | CSV만 바꾸면 옛 epoch 잔존 가능 |
| D | remove 시 economy 비활성·위치 보정은 있으나 **synth hold/점유 잔존** 정리 미흡 | 지도 닫혀도 월드 상태 꼬일 수 있음 |

정상 일일 진행(세대 동일)에서는 **이미 연 성계가 랜덤 재계산으로 사라지는 회귀**를 다시 만들면 안 됨.  
→ **세대/epoch 변경 감지 시에만** “접두 고정”을 끄고 **순수 epoch 목표 집합**으로 reconcile.

---

## 2. 범위 (M0~M6)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 소비처·저장키 표 1장: world unlock · daily batch · WorldExpansionSubCore · RTDB ingest · account purge → sync · applied/policy keys. (전 repo 스캔 금지 — 위 경로만) |
| **M1** | **세대/epoch mismatch 감지**: `loadAppliedState` vs `resolveArcCoreWorldExpansionGlobalPolicy()`. mismatch(또는 applied 없음+정책 존재) 시 `hardReset=true` |
| **M2** | `hardReset=true`이면 schedule 빌드에 **`alreadyUnlockedSynthIds=[]`** (또는 무시) → `targetCount`만으로 `targetSynthIds` 산출 → `reconcileGlobalSynthUnlocks`가 **초과 synth remove** |
| **M3** | `hardReset=false`(일상)면 현행 증분 접두 유지 — **열린 성계 되돌림 회귀 금지** (단위 테스트로 고정) |
| **M4** | remove된 synth에 대해: 기존 `deactivateRemovedSynthFrontierEconomies` + `ensurePlayerNotOnRemovedSystems` 유지. **추가**: 해당 행성 `planetHolds`가 synth frontier면 **neutral hold로 정리 또는 hold 제거**(ArcCore 시드 BLUE/RED **21코어·분쟁 행성 hold는 절대 건드리지 말 것**). phase맵·visited는 기존 reconcile 동작 유지 |
| **M5** | 단위 테스트: (a) gen bump → 기존 다수 unlock이 targetCount로 축소 (b) gen 동일 + 일수+1 → 1개만 추가·기존 유지 (c) epoch 전날 → targetCount=0·synth 전부 잠금(hardReset 시) (d) 21 `GAMEPLAY_SYSTEM_IDS`는 항상 unlocked |
| **M6** | self-check: `npx tsc --noEmit -p tsconfig.client.json` · 관련 `npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts`(+신규 테스트) PASS · handoff PENDING |

### ❌ 김클로드 금지

- `tables/balance/arc_core_territorial_combat_policy.csv` · 분쟁 가중치·passInterval·combatMode **변경**
- 21코어 planets/시드 점유 CSV **무단 변경**
- 실제 정식 `epochDayKey`를 **임의 날짜로 확정 기록**(플레이스홀더·주석만). 운영 날짜는 김팀장/대표님 승인 후
- Skia/worldmap UI 대규모 리팩터 · `onSnapshot` · 틱 경로 신규 루프
- **git commit / 「완료」 선언**

### 기존값 변경

- `world_expansion_timing_policy.csv`의 **현행** `epochDayKey`/`resetGeneration`을 “정식일”로 바꾸지 말 것(아직 미정).  
- 필요 시 **주석/문서/테스트 fixture**만 새 epoch 예시 사용.  
- 코드 레버·테스트로 “바꿨을 때 동작”을 증명.

---

## 3. 구현 힌트 (정본 파일)

| 파일 | 역할 |
|------|------|
| `src/arcCore/syncArcCoreGlobalWorldExpansion.ts` | hardReset 분기 · applied read/compare · sync 본문 |
| `src/arcCore/worldExpansionGlobalSchedule.ts` | schedule API에 `preserveAlreadyUnlocked?: boolean` 또는 hardReset 인자 |
| `src/arcCore/worldExpansionGlobalPolicy.ts` | 정책 resolve (캐시 이슈는 handoff에 운영 주의 1줄) |
| `src/store/worldStore.ts` | `reconcileGlobalSynthUnlocks` (가능하면 최소 변경) |
| `src/store/clanWarFoundationStore.ts` / hold 헬퍼 | synth-only hold 정리 (M4) |
| `src/arcCore/worldExpansionGlobalSchedule.test.ts` | M5 확장 |
| `tables/balance/world_expansion_timing_policy.csv` | **읽기만** (운영 값 변경은 본 task 밖) |

권장 시그니처 스케치(강제 아님):

```ts
// hardReset이면 alreadyUnlocked 무시하고 targetCount만으로 집합 산출
buildGlobalSynthUnlockTargetIds(systems, policy, nowMs, {
  alreadyUnlockedSynthIds,
  preserveAlreadyUnlocked: !hardReset,
});
```

---

## 4. 정식 서비스 런칭 체크리스트 (handoff에 복붙)

김클로드는 구현 후 handoff에 아래를 **운영 체크리스트**로 남긴다(실행은 김팀장).

```text
[ ] epochDayKey = 정식 시작일(KST YYYY-MM-DD)
[ ] resetGeneration = 이전 값 + 1
[ ] systemsPerDay = 1 · globalScheduleEnabled = true
[ ] build:balance-tables
[ ] RTDB worldExpansion/master/state 동일 값 publish (캐시 덮어쓰기)
[ ] 기존 기기: 부트/일일배치 후 synth unlock 수 == 경과일치 · 21코어 유지
[ ] 분쟁 3~5행성 로테이션·hold 시드 회귀 없음(본 task 무변경 확인)
```

---

## 5. 완료 시 handoff 형식

`tools/kim-team-lead/reports/kim-claude-handoff-pending.md` **파일 최상단**에:

```text
status=PENDING
task_id=service-launch-world-expansion-reset-20260729
verdict=(김팀장 검수 대기)
commit 금지
변경 파일:
self-check: tsc= · schedule.test= · (신규 테스트)=
리스크:
운영 체크리스트: (위 §4)
```

대표님께: **「김팀장(Cursor 본창) 검수 요청」** 안내.

---

## 6. 비범위 (명시)

- 탐사 UX 카피·월드맵 연출 개편
- 분쟁 주기/우세 밸런스 재조정
- 클라우드 세이브 `unlockedSystemIds` 세대 가드(필요 시 handoff **후속 P1**로만 기록, 본 task 필수 아님)
- 계정 purge 정책 전면 개편(이미 별도 READY 있을 수 있음 — 본 task와 충돌 시 **synth 개방 축만** 수정)
