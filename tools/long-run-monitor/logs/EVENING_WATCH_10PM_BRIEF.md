# Arcfire intensive watch ??2026-07-03 16:04:03 KST ??22:00 report

Request: 16:00-22:00 focus ??ArcCore economy, RED planet dev automation, memory leak/abnormal occupation. Auto report 22:00. Serious issues: auto-fix ON.

## Stack

| Item | Value |
|------|-------|
| marker | INTENSIVE_WATCH_1600_START @ 2026-07-03 16:04:03 |
| watch-30m | 15m PID 25024 |
| auto-fix | ON |
| 22:00 scheduler | PID 11784 |
| runtime | pid=16676 PSS=657.8MB GL=44MB Views=361 |

## 22:00 outputs

- evening-watch-report-YYYYMMDD-2200.md
- DAILY_10PM_REPORT_LATEST.md
- CHAT_REPORT_PENDING.md
- kim-economy-handoff.md [obs]

## KPI

| Area | Target |
|------|--------|
| PSS idle floor | le 750MB, drift under +40MB |
| GL after GL_RECOVERED | le 55MB |
| GL 3x SPIKE | 0 |
| PROCESS_DEATH+crash | 0 |
| ArcCore batch | 12:00 only |
| RED planet dev | 60s tick, vault spend |

> status: intensive-watch-ACTIVE 쨌 22:00 auto-report scheduled 쨌 auto-fix=ON

