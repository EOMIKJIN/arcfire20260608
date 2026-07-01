# Overnight Exception Shutdown — 2026-07-02

> **One-night only** · Daily 08:00 schedule **unchanged** (no DISABLED flags)

## Status

- **Shutdown**: user-requested exception for tonight
- **Resume**: **2026-07-02 08:00 KST** (auto-scheduled + manual OK)
- **Flags NOT set**: `schedule-8am-report-DISABLED.flag` · `perpetual-detection-DISABLED.flag`

## Commands

```powershell
# Stop all monitors tonight (already run if flag exists)
npm run monitor:stop-overnight-exception

# Manual resume tomorrow ~08:00
npm run monitor:resume-overnight-exception

# Full stack (same as resume)
npm run monitor:ensure-always-on
npm run monitor:ensure-perpetual
```

## Flag

`tools/long-run-monitor/logs/overnight-exception-shutdown.flag`

Removed automatically at resume. Cursor sessionStart skips autostart while flag active.
