# Arcfire 오후 감시 브리프 — 2026-07-03 11:32 KST → 18:00 종합보고

**요청**: 지금~18:00 감시 · 어제밤(08:00) 리포트 통합 · 메모리 추이 면밀 감시 · ArcCore 경제·밸런스 통합 분석(18:00) · **코드 작업 금지**(비정상 오류 수정만)

## 감시 체계 가동 상태

| 구성 | 상태 | PID/비고 |
|------|------|----------|
| watchdog | ON | 4844 |
| watch-30m (15m meminfo) | ON | 24156 |
| report-watch (crash/incident) | ON | 19228 |
| adb | OK | 192.168.45.67:36803 |
| auto-fix | **OFF** | `monitor-paused.flag` — record-only |
| 18:00 스케줄러 | **대기 중** | `npm run monitor:schedule-6pm-report` (11:32 시작) |
| timeline marker | **삽입됨** | `EVENING_WATCH_6PM_START` @ 11:32:39 |

**18:00 자동 산출물**
- `tools/long-run-monitor/logs/evening-watch-report-20260703-1800.md`
- `tools/long-run-monitor/logs/DAILY_6PM_REPORT_LATEST.md`
- `tools/long-run-monitor/logs/CHAT_REPORT_PENDING.md`
- `tools/kim-team-lead/reports/kim-economy-handoff.md` (## [obs] 섹션 prepend)

---

## 1. 어제밤(08:00) + 오늘 오전 통합 메모리 판정

### 야간 핵심 (overnight-final-report-20260703-0800)

| 시각 (KST) | 이벤트 | PSS | GL | Views | 판정 |
|------------|--------|-----|-----|-------|------|
| 02:10 | 앱 기동 (pid 4540) | 793 | 136 | 451 | GL_ELEVATED (mount) |
| 03:12~03:28 | 허브 Skia 활성 | 892→**1084** | 136→**145** | 570→560 | GL_SPIKE ×2 · PSS_SOFT |
| 03:43 | idle 회수 | 919 | **16** | 560 | **GL_RECOVERED** ✓ |
| 03:58 | PROCESS_NOT_RUNNING | — | — | — | 클린/수동 종료 추정 |
| 04:13~08:00 | pid **10002** 안정 구간 | 664~709 | 33~34 | 359~392 | **OK** (floor 안정) |

**야간 verdict**: GL spike 후 **회수 패턴 정상**. PSS peak 1083MB는 활성 허브+Skia footprint — hard-ceiling record-only(monitor-paused). **계단식 floor 상승 없음**(재기동 후 PSS ~665–710MB band).

### 오늘 08:00~11:32 (marker 이전 · 참고)

| 시각 | 이벤트 | PSS | GL | Views |
|------|--------|-----|-----|-------|
| 09:51 | GL_SPIKE (허브) | **852** | 133 | 564 |
| 10:06 | GL_RECOVERED | 604 | 13 | 99 |
| 10:21 | HUB_ACTIVATION | 691 | 23 | 362 |
| 11:07 | **PID_CHANGE** 10002→**1499** | 537 | 9 | 99 |
| 11:23 | 현재 샘플 | **556** | 31 | 362 |

**오전 verdict**: 09:51 spike → 10:06 **완전 GL 회수** ✓. 11:07 PID 변경(재기동) 후 PSS **556MB** — 야간 재기동 직후(586MB)와 유사한 **낮은 floor**. Views 362 — VIEWS_RETAINED **미해당**(450 미만).

### 오후 감시 창 (11:32~18:00) KPI 목표

| KPI | 목표 | 현재 baseline |
|-----|------|---------------|
| PSS idle floor | ≤750MB, drift <+40MB | ~556MB @ 11:23 |
| GL idle | ≤55MB after GL_RECOVERED | ~31MB |
| Views idle | ≤400 | 362 |
| GL 3연속 SPIKE | 0 (자동조치 트리거) | 0 since 10:06 |
| PROCESS_DEATH+crash | 0 | 0 since 11:07 restart |

---

## 2. ArcCore 경제·밸런스 통합 분석 (11:33 audit:balance-ops)

**Overall: WARN** — `tools/balance-ops-audit/reports/latest.md`

### 일 1회 배치 계약 (v4.0 §10) — PASS

- Policy: Asia/Seoul 12:00 · 24h window ✓
- `ArcCoreDailyOpsSubCore` 60s probe → `runArcCoreDailyOpsBatch` ✓
- `price_elasticity=0` · realtime disabled ✓
- Economy SIM ingest: 일일 배치 `runMarketPricePass` 내부만 ✓
- 고빈도 밸런스 호출: **없음** (daily-only confined) ✓

### Macro SIM — PASS

- Whale/F2P: **3.12** (ok, critical≥8 미만)
- deltaId: 2026-07-02

### Level-band drift — **CRITICAL (정적)**

| 밴드 | gap | 권고 |
|------|-----|------|
| band_early | 950% | code_change · weapon_median_vs_band_cph_window |
| band_mid_early | 5838% | 동일 |
| band_mid | 7503% | 동일 |
| band_late | 21074% | 동일 |

→ **장기 P1 밸런스** (오늘 코드 수정 금지 · 김팀장 백로그)

### 행성 재정 3h — WARN

- max fee/upkeep: **3×** · Gini 0.288 · deficit **5**행성
- Convoy: ok=18 fail=**1** (core_prime) · 수송선단 금고 566,811 cr
- 교역 수익: 19/19 발생
- 3h Δ: **0 cr** (KST 동일일·배치 전·무거래 → 정상 정체)

### deficit 행성 (fee/upkeep <1×)

- solar_station, eden_city, crimson_base, dark_haven, synth_002_p

---

## 3. 이상징후 요약 (야간+오전 통합)

| # | 신호 | 심각도 | 조치 |
|---|------|--------|------|
| 1 | PSS 1083 @ 03:28 (허브 Skia) | INFO/WARN | GL_RECOVERED 확인됨 · release soak 계속 |
| 2 | PSS 852 @ 09:51 | WARN | 10:06 회수 · native reclaim advisory |
| 3 | PID_CHANGE 11:07 | INFO | baseline 리셋 · 18:00 report에서 post-restart drift 측정 |
| 4 | monitor-paused | INFO | 자동 재시작 OFF · handoff만 |
| 5 | balance-ops level-band CRITICAL | P1 backlog | weapon CPH window — **오늘 미수정** |
| 6 | convoy fail core_prime | P2 | 12:00 배치 후 재확인 |
| 7 | retention audit NO_DATA | P2 | `audit:memory:retention` 실측 필요 |

**크래시/SIGSEGV**: 03:58·11:07 PROCESS_NOT_RUNNING — **신선 FATAL logcat 없음**(clean exit 패턴).

---

## 4. 개선방안 (김팀장 · 코드는 본 세션 P0만)

### P0 (메모리 · 오늘 저녁 soak 후)

1. **Release soak 2h** (Metro HMR 제외): PSS floor ≤750MB · Views ≤380 · GL idle ≤55MB 확인.
2. **11:07 PID_CHANGE 이후 floor**: 18:00까지 +40MB drift 없으면 **OK** — 있으면 ingress reclaim·Fresco coalesce 점검.
3. **`npm run audit:memory:retention`** 1회 — NO_DATA 해소 · route_blur 스냅샷.

### P1 (ArcCore 경제 · 배치 후)

4. **12:00 KST Daily Batch** 실행 후 `audit:balance-ops` 재실행 — convoy fail(core_prime)·deficit 5행성 fee/upkeep 추이.
5. **Level-band weapon CPH window** — band_early~late gap CRITICAL · SIM KPI는 ok → **무기 중앙값 vs 밴드 CPH** 테이블 정렬 (별도 스프린트).
6. **monitor_fiscal_closed_loop** — max fee/upkeep 3× · Gini 0.288 지속 감시.

### P2 (운영)

7. 검증 완료 후 `monitor-paused.flag` 제거 → auto-fix ON (hard-ceiling·3×GL_SPIKE만).
8. AI 클랜 registry 배정(오전 개발) 반영 후 **`mem-post-dev-recheck`** — 본 감시 창 PSS/Views 추이에 포함.

---

## 5. 18:00 최종보고 체크리스트

- [ ] `DAILY_6PM_REPORT_LATEST.md` 생성 확인
- [ ] marker 이후 PSS floor drift · GL_RECOVERED 횟수 · Views max
- [ ] incidents tail — GL_SPIKE / PSS_SOFT / PROCESS_DEATH
- [ ] `audit:balance-ops` **18:00 재실행** (12:00 배치 반영 여부)
- [ ] `CHAT_REPORT_PENDING.md` → 김팀장 세션 공유

> **status**: afternoon-watch **ACTIVE** · scheduler **WAITING 18:00** · auto-fix **OFF** · code **FROZEN**
