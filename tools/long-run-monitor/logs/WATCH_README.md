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
| `PROCESS_DEATH` (PROCESS_NOT_RUNNING + **최근 크래시 로그**) | 크래시 사망 | **있음** (20m throttle) |
| `PROCESS_EXIT clean` (PROCESS_NOT_RUNNING, 크래시 흔적 없음) | 클린 종료·재설치·검증 | **없음** (기록만) |

> **v2.1 변경(2026-06-17)**: 활성 Skia 전투의 정상 GL footprint(~110~140MB)는 이탈 시 회수되므로 **절대 GL 수치(`gl_critical_active_hub`)만으로는 재시작하지 않는다**(30분 간격 모니터에서 전투 진입 첫 고-GL 샘플의 false-positive 재시작을 차단). 재시작은 **(1) 3회 연속 GL_SPIKE, (2) baseline drift, (3) 하드 실링(GL≥200MB·PSS≥950MB), (4) 크래시 동반 프로세스 사망** 시에만. 단일 GL_SPIKE 즉시 재시작은 폐지(추세 기반 판단으로 통합).

> **v2.2 변경(2026-06-18 · 김팀장)**: (a) **PROCESS_DEATH 분류 정밀화** — 프로세스 미발견은 그 자체로 크래시가 아니다. **최근(≤max(15, 2×interval)분) 크래시 로그가 있을 때만** `PROCESS_DEATH`로 재기동하고, 흔적 없으면 `PROCESS_EXIT clean`으로 **기록만**(수동 종료·검증 안전). (b) **수동 스냅샷 안전** — `manual-mem-snapshot.ps1`은 기본 **기록 전용**, 자동조치는 `-Remediate` 명시 시에만. (c) **report-watch 오탐 제거** — 단순 `PROCESS_NOT_RUNNING`은 적색 "비정상종료"로 보고하지 않음(실제 FATAL/SIGSEGV/PROCESS_DEATH/하드실링/누수만 적색).

## 검증 분리 (release·첫 빌드 검증 중 강제 재시작 차단)

검증 중 monitor가 떠 있어도 자동 재시작을 막으려면 **일시정지 플래그**를 만든다:

```powershell
New-Item -ItemType File -Force tools/long-run-monitor/logs/monitor-paused.flag
# ... 검증 진행 (감시·기록은 계속, 앱 강제 재시작만 차단) ...
Remove-Item tools/long-run-monitor/logs/monitor-paused.flag   # 검증 종료 후 자동조치 복귀
```

`apply-auto-remediation.ps1`은 이 플래그가 있으면 `AUTO_FIX SKIPPED`만 기록하고 앱을 건드리지 않는다.

## 로그 위치

- **타임라인 CSV:** `tools/long-run-monitor/logs/mem-timeline.csv`
- **알림:** `tools/long-run-monitor/logs/mem-alerts.log`
- **incident / remediation:** `incidents.log`, `remediation.log`

## 감시 시작

```powershell
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-watch-30m.ps1
```

규칙 변경 후 **기존 monitor PID 종료 후 재시작** 필요.
