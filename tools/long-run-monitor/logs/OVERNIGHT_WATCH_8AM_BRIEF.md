# Overnight watch until 08:00 KST

Start KST: **2026-07-03 03:00** (user request — ownership Table-First 재검수 + 감시 재가동)
End KST: **2026-07-03 08:00:00**
Marker: OVERNIGHT_WATCH_UNTIL_8AM · OWNERSHIP_ITEM_DEFS_SINGLE_TABLE
Auto-fix: **handoff+retention** (app relaunch OFF when monitor-paused)

## Active processes @ 03:00 KST

| Role | PID | Status |
|------|-----|--------|
| perpetual watchdog | 4844 | running |
| watch-30m (mem + crash logcat) | 24156 | running |
| report-watch (15m) | 19228 | running |
| schedule-8am (08:00 report) | 9156 | running |
| profiler extras (60m retention) | 21588 | running |

## Baseline @ re-arm (03:00 KST)

- adb: OK
- PSS **783.7MB** · GL **59.8MB** · Views **480** @ 02:57:05 — **VIEWS_RETAINED watch** (≥450)
- handoff_pending: **True** · chat_pending: **True**

## Code state verified (2026-07-02 18:00 UTC)

| Gate | Result |
|------|--------|
| `item_defs.csv` ownership rows | **100** (A 21 + synth 79) |
| `audit-planet-ownership-item-defs` | PASS |
| `audit-aurora-ownership-trade` G1–G8 | PASS |
| `audit:memory:all` | PASS |
| `tsc` | PASS |
| 이중 테이블 `synth_planet_ownership_item_defs.csv` | **삭제됨** |
| 빌드 merge synth ownership | **제거** — sync → item_defs only |

## P0 focus for 08:00 report

1. **Views 480** — idle hub VIEWS_RETAINED FAIL 여부 · cold restart 후 재측
2. **PSS floor** — ownership/trade 패치 후 30m+ idle Δ
3. **mem-post-dev-recheck** — kim-economy handoff [관측] 갱신
4. 오로라 synth 무역 **아이템** 탭 소유권 (앱 재시작 후 실기)

## Dev rules reflected (2026-07-02)

- `AGENTS.md` · `arcfire-main-lead-agent.mdc` · `arcfire-memory-leak-audit-first.mdc` §0-A-2
- Table-First: **item_defs.csv 단일 정본** · `[pss-pre-dev]` · render resync 금지

## Outputs at 08:00 KST

- `logs/overnight-final-report-20260703-0800.md`
- `logs/DAILY_8AM_REPORT_LATEST.md`
- `logs/CHAT_REPORT_PENDING.md`
- `tools/kim-team-lead/reports/kim-economy-handoff.md` [관측]
- `logs/mem-timeline.csv` · `incidents.log`

## Pending REDESIGN (not blocking watch)

- `resyncAllCoreOpenTradePortCatalogs()` 부트 N회 → unlock/bulk 1회 축소 (P1/P7)
