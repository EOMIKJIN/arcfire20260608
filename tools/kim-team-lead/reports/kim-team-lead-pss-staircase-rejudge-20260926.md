# PSS 계단식 누적 — 김팀장 재판정 · 2026-09-26

```text
status=REVIEWED
task_id=pss-staircase-full-survey-20260926
kind=TOOLS_APPLIED (런타임 0)
verdict=계단 «실존» AGREE · 원인=잔류 스테이지 트리 «주범» DISAGREE · 도구 결함 AGREE
원본=tools/kim-team-lead/reports/kim-claude-pss-staircase-full-survey-20260926.md
적용=retentionAuditCore D-1~D-4 · audit:memory:session-floor
```

```text
[pss-pre-dev] hot_path=감사도구(오프라인 CSV) alloc=세션당 1회 cache=없음
[pss-pre-dev] stage=미변경 risk=없음(런타임 0)
[pss-pre-dev] verdict=PASS — 도구만. 시설 replace·이중 trim 금지
```

## 판정

| 김클로드 주장 | 김팀장 | 근거 |
|---|---|---|
| 장시간 세션에서 PSS floor가 비가역 상승 | **AGREE** | 동일 CSV 재계산. 대표 pid 재현: 14983 +511 / 28324 +510 / 29392 +531. 정의(pid+20분 공백·45분+·앞 25% 제외·잔류율≥70%)로 장시간 세션의 약 절반이 계단 |
| native_heap이 PSS 상승의 큰 몫 | **AGREE (최악 세션)** | 위 3건 dNat 285~414MB. 전 계단의 «74% median»은 정의·모집단이 달라 숫자는 재인용하지 않음 |
| 정적 감사 PASS와 계단 공존 · 시간축 floor 감사 없음 | **AGREE** | 패턴 감사는 세션 floor를 안 봄 |
| retention 도구 D-1~D-4 | **AGREE** | `auditCloseEvent`가 pid 미필터(`run-retention-audit.cjs` 156–172). 최신 리포트 FAIL 20건 = **+206.3×16 + +83.7×2**. baseline PSS 463.6 / views 13 = 콜드 기동 |
| Views +264 = 스테이지 트리 1개 미해제 = 1순위 원인 | **DISAGREE** | ① 시설은 `router.push` + `hubSubStageNavRef`로 **허브 트리를 고의 유지** (`usePlanetSubStageMemory`). ~575는 시설 체류 설계값일 수 있음. ② 전 샘플 중 views≥450은 **8%**. ③ 계단 119건 중 후반 views≥450은 **19건(16%)**, views가 평탄한 채 계단인 건 **86건(72%)** |
| C-1~C-6 배제(replace·캡·Skia dispose) | **AGREE (해당 축)** | 금지 패턴 위반으로 계단을 설명할 수 없음 |
| P0 = 잔류 트리 실기 특정이 전부 | **PARTIAL** | 트리는 **시설 pop 후에도 575가 남는지**만 확인. 본축은 **views 평탄 + native floor 상승** |

세션 수(김클로드 64 vs 재계산 286)는 유효행·샘플 간격 필터 차로 본다. **대표 장시간 pid의 규모는 양측이 같다.**

## 수정 방향 (착수 순서 · 런타임 추측 패치 금지)

1. **P1 도구** — `run-retention-audit.cjs`: before/after를 **같은 pid**만. baseline 신선도(예 3분). 동일 (pid, baseline, afterMin) **1회**. 콜드 views&lt;50은 baseline 제외.
2. **P2 상설** — `audit:memory:session-floor`: pid+공백 세션 · 10분 롤링 floor · 잔류율. 김클로드 임시 스크립트를 저장소에 고정.
3. **P0 실기 (좁힘)** — 허브 단독 views ~285 → 시설 push ~575 → **back 후 285 복귀**. 복귀 실패만 트리 잔류. 장시간 허브 idle에서 views 평탄·native만 오르면 Fresco/allocator 축.
4. **런타임 (3번 근거 후)** — 트리 잔류면 pop/release 계약만. native-only면 **기존** `trimNativeBitmapCachesAsync`·soft reclaim이 **실제로 도는지** 계측. 신규 이중 trim·시설을 replace로 바꾸기 **금지**(이미 톱니·크래시 교훈).

**지금 하지 말 것**: 허브 트리 전면 언마운트, 시설 `replace`, 감사 PASS를 이유로 계단 무시, 깨진 retention FAIL 20건을 심각도로 쓰기.

## 도구 적용 (2026-09-27)

| 항목 | 상태 |
|---|---|
| D-1 same-pid | `retentionAuditCore.cjs` before/after |
| D-2 cold views&lt;50 | baseline skip |
| D-3 stale ≤3min | `baselineStaleMaxMin` |
| D-4 pair dedupe | pid+baseline+afterMin 1회 |
| logcat pid·초 단위 시각 | 잘린 분 단위 시각 수정 |
| `audit:memory:session-floor` | 최근 7일 STAIRCASE만 FAIL. `audit:memory:all` 미포함 |
| 런타임 | 미변경 |

다음: 실기 허브→시설→back views. 복귀 실패만 트리 잔류로 본다.
