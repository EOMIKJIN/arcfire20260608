# Arcfire long-run watch — no-missile isolation (2026-06)

**Package:** com.arcfire.online  
**Interval:** 30분  
**Rules:** v2 — idle→허브 mount 와 계단식 누수 분리 (`mem-gl-leak-rules.ps1`)

## 판정 기준 (v2)

| 신호 | 의미 | 자동 재시작 |
|------|------|-------------|
| `HUB_ACTIVATION gl_mount_ok` | 직전 GL \<10 MB 또는 Views \<200→≥280 | **없음** |
| `GL_SPIKE` + Views ≥280 | 활성 허브에서 ΔGL ≥8 MB | **없음** (로그만) |
| **3회 연속** `GL_SPIKE` (Views ≥280) | 계단식 누수 의심 | **있음** |
| Views ≥280 **且** GL ≥ **80 MB** | 위험 GL | **있음** |
| `PSS_SPIKE` Δ≥40 MB | Native/graphics | 로그만 |
| `GL_RECOVERED` | idle 회수 | 정상 |
| `PROCESS_NOT_RUNNING` | 크래시 | **있음** (20m throttle) |

## 로그 위치

- **타임라인 CSV:** `tools/long-run-monitor/logs/mem-timeline.csv`
- **알림:** `tools/long-run-monitor/logs/mem-alerts.log`
- **incident / remediation:** `incidents.log`, `remediation.log`

## 감시 시작

```powershell
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-watch-30m.ps1
```

규칙 변경 후 **기존 monitor PID 종료 후 재시작** 필요.
