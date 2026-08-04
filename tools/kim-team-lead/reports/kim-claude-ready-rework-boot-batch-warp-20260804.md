# 김클로드 재작업 — 김팀장 검수 반영 (2026-08-04)

> **배정**: 김팀장 · **2026-08-04** · 대표님 「김클로드 분석·수정 검수 후 재작업 지시」  
> **task_id**: `kim-claude-rework-boot-batch-warp-20260804`  
> **전제**: 김클로드 PENDING/초안 **코드 검수 완료** (아래 §1). 본 문서는 **재작업 DoD만**.  
> **commit 금지** · 종료 시 `kim-claude-handoff-pending.md` 상단 **PENDING 1블록 통합** · 김팀장 재검수.

---

## 0. [pss-pre-dev]

```text
[pss-pre-dev] hot_path=이어하기 prewarm·일일배치 gate·RTDB write · alloc=타임아웃 race 외 무신설 · cache=무
[pss-pre-dev] stage=title 즉시 / continue-warp 합류 / 배치 SubCore · risk=P1 경합·P5 warp · verdict=PASS(재작업 범위 한정)
```

---

## 1. 김팀장 검수 판정 (김클로드 분석·코드 기준)

| task / 산출 | 판정 | 근거 |
|-------------|------|------|
| **일일 배치 동시 중복 (TOCTOU)** `ArcCoreDailyOpsSubCore.probeDailyBatch` | **AGREE** | `batchRunning=true`를 `hydrate` await **이전** + 상위 `try/finally` — logcat 이중 micro-adjust/trade-route 와 정합 |
| **타이틀 12s 잠금 해제 · catch-up/배치 차원항로 이관** | **AGREE (초안 유지)** | `postBootSettled` 즉시 · `continueSessionPrewarm` wait 합류 · 규칙 문서 정합 |
| **RTDB daily KPI `.set` 타임아웃** (`push…` + `ARCORE_RTDB_DAILY_KPI_WRITE_TIMEOUT_MS=6s`) | **AGREE** | 대표님 차원항로 고착 + deprecation `set` WARN 분석과 정합. 타임아웃 시 skip + batch 계속 |
| **prewarm join 상한** + **RTDB `.set` 6s** (`continue-warp-infinite-wait`) | **AGREE** | 근본 원인(RTDB offline hang) + 이중 방어 AGREE. **45s UX → R1 하향** |
| **교전/영유권 알림 galaxy 게이트** | **AGREE (soft)** | worldmap focus만 · 타이틀 부하 해소. 행성 허브 미노출 — R0 명시 |
| 분석 A **device uid 재시도 ~3.2s** | **DEFER** | 기기 식별 무결성 — **값 변경 금지**(대표님/김팀장 별도 승인 전) |
| 분석 B **set_catalog 행성 단위 로그 폭주** | **AGREE 원인** · **P2 재작업** | 정상 루프이나 DEV 스팸·JS 부담 가능 — Wave R2 |
| title READY `ASSIGNED` | **미결** | DoD 체크리스트 handoff **한 블록으로 마감** 필요 |
| handoff 상단에 RTDB/join 타임아웃 미기록 | **문서 누락** | 코드는 반영됨 → **handoff 동기화 필수** |

```text
team_lead_verdict=
  race_fix=AGREE_CODE
  title_warp_move=AGREE_CODE
  rtdb_kpi_timeout=AGREE_CODE
  prewarm_join_cap=AGREE_SOFT
  territorial_galaxy_gate=AGREE_SOFT
  auth_device_retry=DEFER_NO_CHANGE
  catalog_resync_spam=P2_REWORK
```

---

## 2. 김클로드 재작업 Wave (순서 고정)

### Wave R0 — handoff 정리 (코드 변경 최소/없음 · 먼저)

1. 상단 PENDING **하나만** 남긴다 (`task_id=kim-claude-rework-boot-batch-warp-20260804`).  
2. 이미 반영된 코드 항목을 표로 명시 (race / title-gate / RTDB timeout / join cap / territorial gate).  
3. **team_lead_recheck** 각 AGREE/SOFT/DEFER 인용.  
4. `ASSIGNED` title-button task → **본 rework에 흡수·닫음** 표기.  
5. territorial soft: 「행성 허브에서는 팝업 안 뜸 · 은하 지도 진입 시 보류분 1건」을 대표님 의도(시작화면 부하 제거)로 명시.

### Wave R1 — 차원항로 UX (P0 · 코드)

**문제**: join 45s 안이라도 **일일 배치 + 부트 economy resync**가 차원항로에서 동시에 돌아 **체감 로딩 과다**. 또한 배치가 **아직 register 전**이면 wait no-op 후 허브 진입해도 batch는 백그라운드 — OK.  
**이미 TOCTOU/RTDB 고착은 막음** — 다음만:

| # | 작업 | 합격 |
|---|------|------|
| R1-a | prewarm 단계별 **`console.log`/`markBootPerf`** (또는 existing boot perf) — `join_catchup` / `join_daily` / `assets` / `bootstrap` — DEV only, **임시 아님, 짧은 1줄** 유지 OK | 실기에서 어디가 긴지 즉시 판별 |
| R1-b | **일일배치 join 상한 재검토**: 이미 `DAILY_BATCH_JOIN_TIMEOUT_MS=45_000` 있음 → 대표님 UX 기준 **20~25s soft cap**으로 하향 검토(초과 시 planet, 배치 계속). **완료 마크·trend는 배치 완료 시** (join 포기 ≠ cancel) | handoff에 before/after |
| R1-c | 긴급 패치 handoff(`continue-warp-infinite-wait`)와 본 rework **1 PENDING으로 통합** · RTDB 6s / join 이중방어 표 유지 | 문서 |
| R1-d | `registerRunningArcCoreDailyBatch` 주석 타이틀 게이트 잔여 → prewarm 전담 문구 정리 | 정합 |

**금지**: 일일 배치 패스 로직/밸런스 CSV 변경 · `onBoot` 동기 배치 재도입 · 타이틀에 다시 wait 걸기.

### Wave R2 — catalog resync 로그·호출 정돈 (P2 · 선택 권장)

김클로드 분석 B + 대표님 logcat (`trade_port_planet_resync` 행성당 1줄):

| # | 작업 |
|---|------|
| R2-a | `__DEV__` bulk log: 행성 단위 폭주 방지 — **배치 요약 1줄** 또는 reason 단위 throttle (동작 무변경) |
| R2-b | (선택) `resyncAllCoreOpenTradePortCatalogs` 와 일배치 `syncTradePortCatalogFromBalance(force)` **같은 세션 이중 전행성 resync** 여부 코드로 확인 후, 불필요 중복이면 1회만 (의미론 동일할 때만) |

### Wave R3 — territorial gate 문서·미세 (soft only · 범위 확대 금지)

- 코드 추가 수정 **하지 않음** (AGREE).  
- R0 handoff에 soft 표기만.  
- 대표님이 「행성 허브에서도 즉시 고지」 원하면 **별 ready** (이번 rework 밖).

### Wave R4 — DEFER 명시 (수정 금지)

- auth `resolveDeviceScopedUid` 재시도 상수  
- 일일 배치 내부 40s 알고리즘 추가 최적화 (이미 follow-up perf REVIEWED)  
- tools/debug `_repro*` 커밋

---

## 3. 수정 금지 / 커밋 제외

- `tables/` balance 숫자 · Stage1 레이아웃 상수  
- monitor logs · balance-ops reports · RKStorage dumps  
- git commit

---

## 4. self-check

```bash
npx tsc --noEmit -p tsconfig.client.json
# 변경 파일만
# wait 타이틀 경로 금: grep waitForArcCoreDailyBatchIdle app/_layout.tsx → 0
# prewarm join cap 존재 확인
```

실기 (handoff에 기록, 미검증 명시):

1. 타이틀 버튼 **즉시** (12s 아님)  
2. 이어하기 → 차원항로 **최대 ~join cap 이내** planet 진입 (영구 정지 없음)  
3. micro-adjust / trade-route **동일 수치 이중 로그 소실**  
4. 영유권 팝업 타이틀 미표시 · worldmap 진입 시 보류 1건  
5. RTDB WARN만으로 로딩 무한 정지 **없음**

---

## 5. 김클로드에게 한 줄 지시

> 김팀장 검수: race·title·RTDB·join cap·territorial **AGREE**.  
> **지금**: R0 handoff 통합 → R1 join cap UX(20~25s 권장)·단계 로그 → (가능 시) R2 catalog 로그 스로틀.  
> auth 재시도·일배치 대수 재밸런스 **손대지 말 것**. commit 금지.

---

## 6. 김팀장 전체 재검수 공유 (2026-08-04)

전수검사 결과 전문·dirty 분류·실기 3문항·김클로드 복사 지시:

→ **`tools/kim-team-lead/reports/kim-claude-share-full-reaudit-20260804.md`**

착수 전 **본 READY + 공유 정본 둘 다** 읽고, 공유 §7 지시문 순서를 따른다.

**끝.**
