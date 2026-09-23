# Overnight worldmap soak — baseline (김팀장)

```text
status=WATCHING
task_id=overnight-worldmap-soak-20260908
started_kst=2026-09-08 00:12
report_due_kst=2026-09-08 ~10:00
stage_claim=대표님 — 앱 재시작 후 은하계지도(worldmap) 체류 · 밤새 경과 후 오전 보고
pid_at_baseline=18017
adb=RFCW31QCRAZ connected
```

## 기준선 (2026-09-08 ~00:11 KST · dumpsys)

| 지표 | 값 | 비고 |
|------|-----|------|
| TOTAL PSS | **~776 MB** (795303 KB) | soft ceiling 근처~하회 |
| Native Heap | **~379 MB** (387680 KB) | 높음 |
| GL mtrack | **~111 MB** (113868 KB) | 월드맵 체류치고 높음(허브급 footprint) |
| Views | **608** | idle 목표 ≤380 · **VIEWS_RETAINED 위험** |
| ViewRootImpl | 1 | |

## mem-timeline 직전 추이 (pid 교체 포함)

| 시각 | pid | PSS | GL | Views | note |
|------|-----|-----|-----|-------|------|
| 23:03 | 28348 | 826 | 39 | 369 | soft ceiling |
| 23:18 | 28348 | 948 | 114 | 608 | GL_SPIKE |
| 23:34 | 28348 | 950 | 114 | 608 | GL_HARD_CEILING → REFIX |
| 23:35 | **18017** | 389 | — | 13 | POST_REMEDIATION_VERIFY_OK |
| 23:50 | 18017 | 772 | 121 | 608 | VIEWS_NATIVE_ADVISORY |
| 00:06 | 18017 | 773 | 109 | 608 | GL_RECOVERED idle_ok · Views 미회수 |

## 운영 메모

- 23:34 자동조치로 **프로세스 재기동**됨(pid 28348→18017). 대표님 「재시작 후 월드맵」과 시각 정합.
- Views 608이 재기동 후에도 유지 → **월드맵 트리/잔류 Views** 또는 허브 잔상 의심 — 오전 보고 핵심 축.
- retention audit 최신(09-07 15:04Z)은 과거 샘플 FAIL·INSUFFICIENT — 오전 `audit:memory:retention` 재실행 권장.
- 08:00 데일리 리포트는 자동 생성 예정 → 10:00 보고에 합류.

## 10:00 보고 체크리스트

1. mem-timeline 00:06~10:00 전 구간 floor/peak (PSS·GL·Views·native)
2. pid 안정성 · PROCESS_DEATH/REFIX 여부
3. incidents.log · crash-* 신선분
4. dumpsys 실측 1회 (월드맵 유지 여부)
5. `latest-retention-audit` / 08:00 overnight-final
6. 판정: OK / WARN / FAIL + 김팀장 조치 필요 여부
