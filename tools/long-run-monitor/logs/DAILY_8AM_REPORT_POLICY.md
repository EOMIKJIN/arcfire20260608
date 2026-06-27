# Daily 08:00 KST report — mandatory perpetual policy

> **Effective**: 2026-06-27 · **Owner**: 김팀장 + 김경제 (동일 운영)

## Rules

1. **Every day at 08:00 KST** a report is generated and logged — **no exceptions**.
2. **FAIL** if: adb not connected, report generation error, timeline has no new samples.
3. **App on/off** does not skip the report — not running is noted in the report body.
4. **No change / empty data** → still report; connection failure → **FAIL**.
5. **Do not stop** unless user or team-lead creates:
   `tools/long-run-monitor/logs/schedule-8am-report-DISABLED.flag`

## Artifacts

| File | Purpose |
|------|---------|
| `overnight-final-report-YYYYMMDD-0800.md` | Daily report |
| `daily-8am-report-ledger.csv` | Pass/fail ledger |
| `DAILY_8AM_REPORT_LATEST.md` | Latest summary |
| `schedule-8am-report.log` | Scheduler log |
| `kim-economy-handoff.md` | Handoff [관측] block |

## Start / ensure

```powershell
npm run monitor:ensure-daily-8am
# or
node tools/long-run-monitor/schedule-8am-kim-daily-auto-report.cjs
```

Session hook `on-session-start-monitor-autostart.cjs` ensures this is running.
