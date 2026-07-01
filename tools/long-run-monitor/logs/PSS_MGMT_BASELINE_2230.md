# PSS Memory Baseline — 2026-07-01 22:29 KST

**Status: WARN** (즉시 검수)

## Snapshot

| Metric | Value | 기준(허브 idle) | 판정 |
|--------|-------|-----------------|------|
| PSS | **862.5 MB** | < 800 soft | WARN |
| GL mtrack | **148.8 MB** | < 55 idle | **FAIL** |
| Native Heap | 321.2 MB | ~260–320 | WARN |
| Java Heap | 31.2 MB | — | OK |
| Views | 369 | < 450 | OK |
| PID | 28942 | — | OK (21:16 재시작 후) |

## 오늘 추이 요약

- **17:00–19:15** PSS ~640–680 / GL ~44 / Views ~354–368 — idle 양호
- **19:30** PSS **770** (+126) GL flat — **native_heap floor creep** (mem-alerts)
- **20:01** Views **522** — SUB-STAGE/facility 중복 RN 트리 (일시)
- **21:01·21:16** PID 변경 — 크래시·재시작 2회
- **21:54~** GL **149MB 고착** — Skia/허브 **미회수** (GL_SPIKE, idle 복귀 실패)
- **22:29** PSS **862.5** — 누적식 점유 지속

## 메모리 관리 검토 (즉시)

| 항목 | 상태 | 비고 |
|------|------|------|
| GL Skia dispose | **FAIL** | idle 44→149MB, 30분+ 미복구 |
| PSS floor | **WARN** | +220MB vs 오후 idle (640→862) |
| Views reclaim | **OK** | 522→369 복귀 |
| Process stability | **WARN** | 21시대 PID 2회 변경 |
| Hermes/GC | 미측정 | PSS 상승 중 GL 고착 → native 쪽 의심 |

## 23:30 (밤 11:30 KST) 재검수 예약

- 스크립트: `run-scheduled-pss-mgmt-report.ps1`
- Baseline: `PSS_MGMT_BASELINE_2230` (mem-timeline)
- 보고: `PSS_MGMT_REPORT_LATEST.md` · `CHAT_REPORT_PENDING.md`
