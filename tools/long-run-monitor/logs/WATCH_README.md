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

> **v2.7 변경(2026-06-23 · 김팀장)**: (a) **report-watch v2.7** — crash는 `Get-ArcfireCrashLogEvents` **신선도+바이트 tail**만 적색. 구 PID SIGSEGV 오탐 제거. (b) **monitor-paused** 시 `GL_HARD_CEILING`/`REFIX_REQUESTED`는 incidents·heartbeat **황색 스팸 없음** — remediation 30분 throttle INFO만. (c) **scan-playtest-alerts v2** — 패턴 매칭 폐지, 신선 arcfire 크래시만 `playtest-alerts.log`. (d) **PID_CHANGE** 실시간 감지.

> **v2.6 변경(2026-06-19 · 김팀장)**: (a) **CRASH arcfire 한정 + 신선도** — `Get-ArcfireCrashLogEvents`: `.arcfire.online` FATAL/`Killing: crash`/`Process died`만, 타임스탬프 ≤max(35, 2×interval+5)분. DEBUG 백트레이스·타앱 `crashed service`·자동조치 `force-stop` 제외. (b) **handoff dedupe** — `.crash-last-event` 동일 키 재패킹 금지. (c) **hard-ceiling 단일 경로** — `run-monitor` 즉시 relaunch 제거 → `check-and-remediate` coalesce만.

> **v2.3 변경(2026-06-19 · 김팀장)**: (a) **주기당 재시작 1회** — `consecutive_gl_spikes` + `GL_HARD_CEILING` 동시 충족 시 이중 `force-stop` 방지(우선순위: hard-ceiling > spikes > drift). (b) **CRASH 오탐 제거** — Firebase `W ReactNativeJS` deprecation은 CRASH/PROCESS_DEATH 판정에서 제외(FATAL·SIGSEGV·`E ReactNativeJS`만). (c) **`.auto-remediation.lock`** — 10분 내 중복 relaunch 차단.

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

## incident → 자동조치 + 점검 + 김팀장 코드 수정 (v2.5 · 2026-06-19)

**유지 범위:** `start-watch-30m.ps1` **기본 장기앱 실행 테스트만** (30분 meminfo + crash logcat).  
전투 soak·floor 전용 샘플러·report-watch 등 **부가 테스트는 기본 가동하지 않음**.

| 단계 | 동작 |
|------|------|
| 감지 | `check-and-remediate` — 비정상종료·ABNORMAL_RESTART(조치 후 25m 내 재사망)·GL 누수·하드실링 |
| 자동조치 | `apply-auto-remediation` — `audit:skia-memory` + 앱 재기동(throttle) |
| **사후 점검** | 재기동 20s 후 프로세스 생존 + GL/PSS 하드실링 미충족 → `VERIFY PASS/FAIL` (`remediation.log`) |
| 핸드오프 | VERIFY FAIL · 반복 크래시 → `pack-incident-handoff.cjs` → `outbox/cursor-incident-handoff.md` |
| Cursor | `on-session-start-incident-triage.cjs` — 세션 시작 시 김팀장 P0 조사·코드 수정·tsc·ack |

> **v2.5 변경(2026-06-19)**: 기본 장기 테스트만 유지. 자동조치 후 **사후 VERIFY** 필수. 조치 후 25분 내 재크래시는 `ABNORMAL_RESTART`로 분류·짧은 throttle(10m) 재조치 + 핸드오프.

## incident → 김팀장 자동 조사·수정 (v2.4 · 2026-06-19)

| 단계 | 동작 |
|------|------|
| 감지 | `check-and-remediate` — GL 하드실링·누수·진짜 크래시·PROCESS_DEATH |
| 런타임 | `apply-auto-remediation` — audit:skia-memory + 앱 재시작( throttle ) |
| 핸드오프 | `pack-incident-handoff.cjs` → `outbox/cursor-incident-handoff.md` |
| Cursor | `on-session-start-incident-triage.cjs` — 세션 시작 시 P0 조사·수정 주입 |
| 완료 | `node tools/long-run-monitor/ack-incident-handoff.cjs` |

> 김경제 = 감시·기록·핸드오프 생성 · 김팀장 = logcat 근거 코드 수정

## 집중 검사 항목 (상시 · 2026-06-23 추가)

**장기 release soak(5h+) + 계단식 GL/PSS floor 상승** 환경에서 **은하계 지도(worldmap)** 크래시를 P0로 추적한다.

| 항목 | 신호 | 조치 주체 |
|------|------|-----------|
| worldmap focus 직후 SIGSEGV | `ShareableWorklet` · `libreanimated` · `ReanimatedEventDispatcher` | 김팀장 — scroll lifecycle·post-flow 지연 |
| 5h+ floor drift + worldmap | `mem-timeline.csv` floor ≥ baseline+25MB 후 크래시 | 김경제 탐지 → 김팀장 수정 |
| 이동중 전투 → worldmap | transit post-flow · `scrollAliveSv` 타이밍 | 플레이테스트 마일스톤 + precision logcat |

플레이테스트 절차: `tools/long-run-monitor/PLAYTEST_WATCH.md` · 디버그 빌드 동일 시나리오 권장.
