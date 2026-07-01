# Overnight watch until 08:00 KST

Start KST: **2026-07-01 00:48** (user request)
End KST: **2026-07-01 08:00:00**
Marker: OVERNIGHT_WATCH_UNTIL_8AM
Auto-fix: **OFF** (record-only)

## Active processes

| Role | PID | Status |
|------|-----|--------|
| watch-30m (mem 15m + crash logcat) | 21300 | running |
| schedule-8am (08:00 report) | 26052 | running · next=2026-07-01 08:00:00 |

## Baseline @ request (00:48 KST)

- adb: OK (192.168.45.197:37573)
- PID **23575** · PSS **714MB** · GL **28MB** · Views **365**
- Recent: 00:13 PID_CHANGE 21817→23575 · 00:43 PSS 696 GL 22 views 378

## P0 focus (from prior session)

- PSS_FLOOR_UP idle hub native_heap creep
- hub_periodic skipBackdropRemount patch (uncommitted)
- PSS_SOFT_CEILING advisory ≥800MB

## Outputs at 08:00 KST

- `logs/overnight-final-report-20260701-0800.md`
- `logs/DAILY_8AM_REPORT_LATEST.md`
- `logs/CHAT_REPORT_PENDING.md` → Cursor session hook
- `tools/kim-team-lead/reports/kim-economy-handoff.md` [관측]
- `logs/mem-timeline.csv` · `incidents.log` · `heartbeat.log`
