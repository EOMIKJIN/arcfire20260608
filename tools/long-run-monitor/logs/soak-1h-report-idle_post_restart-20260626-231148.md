# 1h soak watch summary ??idle_post_restart-20260626-231148

- Ended (KST): 2026-06-27 00:12:09
- Samples: 20
- Baseline: GL 30.4MB / PSS 675.1MB / PID 16272
- Peak: GL 38.8MB / PSS 709.6MB
- Floor GL: 11.5 MB
- PID changes: 1
- GL/PSS hard ceiling hits: 0
- New crash alerts: 0
- CSV: D:\arcfire20260607\tools\long-run-monitor\logs\soak-1h-idle_post_restart-20260626-231148.csv
- Log: D:\arcfire20260607\tools\long-run-monitor\logs\soak-1h-idle_post_restart-20260626-231148.log

## Verdict
STABILITY: FAIL ??investigate crash-*.log + playtest-alerts.log
GL_FLOOR_DRIFT: within +25MB soak window (or insufficient idle samples)
