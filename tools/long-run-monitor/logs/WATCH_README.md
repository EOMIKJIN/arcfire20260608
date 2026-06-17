# Arcfire long-run watch — no-missile isolation (2026-06)

**Package:** com.arcfire.online  
**Interval:** 30분  
**Rules:** v2.1 — idle→허브 mount·계단식 누수 분리 + **활성 전투 footprint 보호** (`mem-gl-leak-rules.ps1`)

## 판정 기준 (v2.1)

| 신호 | 의미 | 자동 재시작 |
|------|------|-------------|
| `HUB_ACTIVATION gl_mount_ok` | 직전 GL \<10 MB 또는 Views \<200→≥280 | **없음** |
| `GL_SPIKE` + Views ≥280 | 활성 허브에서 ΔGL ≥8 MB | **없음** (로그만, 추세 판단은 check-and-remediate 위임) |
| **3회 연속** `GL_SPIKE` (Views ≥280) | 계단식 누수 의심 | **있음** |
| `GL_ELEVATED_STABLE` / `GL_ELEVATED` (Views ≥280, GL ≥80MB) | 전투·웨이브 등 활성 Skia footprint | **없음** (보류 · 절대 수치만으로 재시작 안 함) |
| `baseline_gl_drift` (peak ≥ baseline+25, 미회수) | 계단식 누수 | **있음** |
| **하드 실링** GL ≥ **200MB** 또는 PSS ≥ **950MB** | 진짜 OOM 임박 | **있음** (footprint 무관 강제) |
| `PSS_SPIKE` Δ≥40 MB | Native/graphics | 로그만 |
| `GL_RECOVERED` | idle 회수 | 정상 |
| `PROCESS_NOT_RUNNING` | 크래시 | **있음** (20m throttle) |

> **v2.1 변경(2026-06-17)**: 활성 Skia 전투의 정상 GL footprint(~110~140MB)는 이탈 시 회수되므로 **절대 GL 수치(`gl_critical_active_hub`)만으로는 재시작하지 않는다**(30분 간격 모니터에서 전투 진입 첫 고-GL 샘플의 false-positive 재시작을 차단). 재시작은 **(1) 3회 연속 GL_SPIKE, (2) baseline drift, (3) 하드 실링(GL≥200MB·PSS≥950MB), (4) 프로세스 사망** 시에만. 단일 GL_SPIKE 즉시 재시작은 폐지(추세 기반 판단으로 통합).

## 로그 위치

- **타임라인 CSV:** `tools/long-run-monitor/logs/mem-timeline.csv`
- **알림:** `tools/long-run-monitor/logs/mem-alerts.log`
- **incident / remediation:** `incidents.log`, `remediation.log`

## 감시 시작

```powershell
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-watch-30m.ps1
```

규칙 변경 후 **기존 monitor PID 종료 후 재시작** 필요.
