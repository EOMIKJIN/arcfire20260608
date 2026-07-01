# Arcfire evening watch 18:00 KST comprehensive report

Generated (KST): 2026-07-01 18:00:04
Package: `com.arcfire.online`
Timeline marker: `EVENING_WATCH_6PM_START`

## 1. Runtime snapshot

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29266 | 645.4 | 43.6 | 365 |

**Verdict:** OK

## 2. Memory trend (since marker)

| Metric | Value |
|--------|-------|
| Samples | 18 |
| PSS min / max / last | 637.7 / 687.2 / 648.8 MB |
| PSS floor drift (last-first) | -28.6 MB |
| GL min / max / last | 43.6 / 45.8 / 43.6 MB |
| Views max / last | 389 / 365 |
| GL_RECOVERED events | 0 |
| PSS_SPIKE events | 0 |

### mem-timeline tail (30 rows)

```csv
2026-07-01 14:42:00,,,,,,,,,,,,EVENING_WATCH_6PM_START
2026-07-01 14:42:52,,,,,,,,,,,,EVENING_WATCH_6PM_START
2026-07-01 14:45:04,29266,677.4,635.1,45.6,19.8,65.4,255.1,48.7,,365,-22.3,2,
2026-07-01 14:46:53,,,,,,,,,,,,EVENING_WATCH_6PM_START
2026-07-01 14:47:01,,,,,,,,,,,,EVENING_WATCH_6PM_START
2026-07-01 15:08:44,29266,664.5,621.7,43.6,19.8,63.4,252.3,52.7,,364,-12.9,-2,
2026-07-01 15:15:48,29266,659.7,616.9,43.6,19.8,63.4,258.3,41.7,,367,-4.8,0,
2026-07-01 15:31:06,29266,653.9,611.4,43.6,19.8,63.4,259.7,34.3,,368,-5.8,0,
2026-07-01 15:39:02,29266,687.2,644.6,44.2,40.7,84.9,266.5,38.6,,378,33.3,0.6,
2026-07-01 15:46:24,29266,681.3,638.8,45.8,34.3,80.1,261.9,42.6,,388,-5.9,1.6,
2026-07-01 16:01:43,29266,648.6,605,43.6,19.8,63.4,262.9,25.6,,368,-32.7,-2.2,
2026-07-01 16:09:20,29266,651.6,606.2,43.6,19.8,63.4,264.3,25.2,,367,3,0,
2026-07-01 16:17:01,29266,639.8,557.2,43.6,19.8,63.4,232.7,26.9,,364,-11.8,0,
2026-07-01 16:32:20,29266,637.7,554.9,43.6,19.8,63.4,232,25.9,,363,-2.1,0,
2026-07-01 16:39:37,29266,639.6,556.9,43.6,19.8,63.4,236.9,23.9,,363,1.9,0,
2026-07-01 16:47:38,29266,643.7,561.1,43.6,19.8,63.4,241.4,23.2,,368,4.1,0,
2026-07-01 17:02:57,29266,648.2,565.6,43.6,19.8,63.4,239.9,28.6,,364,4.5,0,
2026-07-01 17:09:56,29266,677.2,594.7,44.2,40.7,84.8,239.3,36.6,,388,29,0.6,
2026-07-01 17:18:21,29266,661.1,578.6,43.8,34.3,78.1,240.8,25.4,,389,-16.1,-0.4,
2026-07-01 17:33:46,29266,646,530.3,43.6,19.8,63.4,210.1,26.8,,369,-15.1,-0.2,
2026-07-01 17:40:16,29266,656.4,539.8,45.6,19.8,65.4,213.2,33.1,,368,10.4,2,
2026-07-01 17:49:04,29266,648.8,532.2,43.6,19.8,63.4,209.5,31,,365,-7.6,-2,
```

## 3. Incidents & remediation (tail)

### incidents
```
[2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
[2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
[2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
[2026-07-01 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:08:08] DAILY_8AM_REPORT 2026-07-01 08:08:08 KST
[2026-07-01 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:10:11] DAILY_8AM_REPORT 2026-07-01 08:10:11 KST
[2026-07-01 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:12:12] DAILY_8AM_REPORT 2026-07-01 08:12:12 KST
[2026-07-01 08:12:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:14:14] DAILY_8AM_REPORT 2026-07-01 08:14:14 KST
[2026-07-01 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:20:23] DAILY_8AM_REPORT 2026-07-01 08:20:23 KST
[2026-07-01 08:20:23] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
[2026-07-01 08:22:10] GL_ELEVATED mounting_or_insufficient_samples gl=127 pss=742.9 views=558 restart_held
[2026-07-01 12:27:12] GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=751.9 views=555 restart_held
[2026-07-01 13:13:12] GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=764.6 views=556 restart_held
[2026-07-01 14:40:24] EVENING_WATCH_6PM_START 2026-07-01 14:40 KST ? watch until 18:00 comprehensive report
```

### remediation
```
[2026-06-30 17:33:19] INFO GL_ELEVATED mounting_or_insufficient_samples gl=143.5 pss=751.8 views=367 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 17:48:37] INFO GL_ELEVATED mounting_or_insufficient_samples gl=143.5 pss=750.8 views=367 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 18:03:55] INFO GL_ELEVATED mounting_or_insufficient_samples gl=142.1 pss=782.2 views=384 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 18:19:14] INFO GL_HARD_CEILING_RECORD_ONLY gl=208.4 pss=855.1 views=395 (monitor-paused ??no incident/refix spam)
[2026-06-30 18:34:33] INFO GL_ELEVATED mounting_or_insufficient_samples gl=111.5 pss=750.2 views=381 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 18:49:51] INFO GL_ELEVATED mounting_or_insufficient_samples gl=111 pss=731.7 views=373 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 19:05:10] INFO GL_ELEVATED mounting_or_insufficient_samples gl=113 pss=746.3 views=374 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 19:20:28] INFO GL_ELEVATED mounting_or_insufficient_samples gl=111.1 pss=751.3 views=369 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-30 19:51:11] INFO PSS_SOFT_CEILING pss=924.1 gl=124.8 views=558 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 20:06:39] INFO PSS_SOFT_CEILING pss=803.1 gl=139.7 views=365 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 20:22:07] INFO GL_HARD_CEILING_RECORD_ONLY gl=201.7 pss=1041.3 views=359 (monitor-paused ??no incident/refix spam)
[2026-06-30 21:23:29] INFO PSS_SOFT_CEILING pss=913.8 gl=147.7 views=383 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 22:40:00] INFO PSS_SOFT_CEILING pss=831.2 gl=39.7 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 22:55:20] INFO PSS_SOFT_CEILING pss=847.9 gl=37.8 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:10:46] INFO PSS_SOFT_CEILING pss=852.9 gl=37.9 views=370 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:26:03] INFO PSS_SOFT_CEILING pss=863.7 gl=37.9 views=369 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-30 23:56:43] INFO PSS_SOFT_CEILING pss=880.8 gl=148.8 views=374 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-07-01 08:22:10] INFO GL_ELEVATED mounting_or_insufficient_samples gl=127 pss=742.9 views=558 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 12:27:12] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=751.9 views=555 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-07-01 13:13:12] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.4 pss=764.6 views=556 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
```

### mem-alerts
```
[2026-06-30 00:43:53] GL +8.6MB views=488 (PSS 22MB) ??active hub
[2026-06-30 01:29:54] GL +13.4MB views=378 (PSS 9.7MB) ??active hub
[2026-06-30 02:00:39] PSS +214.6MB GL 25.9MB views=371
[2026-06-30 09:24:51] CRITICAL process not running ??check crash-*.log
[2026-06-30 10:24:08] PSS +43.3MB GL 39.5MB views=375
[2026-06-30 10:39:28] GL +109.8MB views=371 (PSS 69.5MB) ??active hub
[2026-06-30 12:26:49] GL +18.2MB views=379 (PSS 27.6MB) ??active hub
[2026-06-30 13:43:30] GL +16.1MB views=375 (PSS -12.3MB) ??active hub
[2026-06-30 13:58:53] GL +83.2MB views=383 (PSS 89.6MB) ??active hub
[2026-06-30 16:16:45] GL +112.7MB views=366 (PSS 181.8MB) ??active hub
[2026-06-30 18:19:09] GL +66.3MB views=395 (PSS 72.9MB) ??active hub
[2026-06-30 19:51:03] GL +89.6MB views=558 (PSS 217.9MB) ??active hub
[2026-06-30 21:38:46] CRITICAL process not running ??check crash-*.log
[2026-06-30 22:39:55] PSS +43.9MB GL 39.7MB views=369
[2026-07-01 00:42:43] PSS +40.1MB GL 22MB views=378
[2026-07-01 08:22:05] GL +99.5MB views=558 (PSS 61.7MB) ??active hub
[2026-07-01 09:38:51] CRITICAL process not running ??check crash-*.log
[2026-07-01 12:27:05] GL +110.5MB views=555 (PSS 153.3MB) ??active hub
[2026-07-01 12:57:50] GL +11.4MB views=368 (PSS -17.8MB) ??active hub
[2026-07-01 13:13:08] GL +101.7MB views=556 (PSS 136.8MB) ??active hub
```

## 4. Retention audit

- **latest-retention-audit:** `NO_DATA` ??`tools/memory-profiler/reports/latest-retention-audit.md`
- route_blur / STAGE close ?ㅻ깄??遺議???`npm run audit:memory:retention` ?ㅼ륫 ?꾩슂

## 5. Management / optimization gaps (known + watch window)

| # | Gap | Status |
|---|-----|--------|
| 1 | SUB-STAGE blur / route_blur release (Views 558) | patched / release soak pending |
| 2 | Metro HMR / galaxy dispose loop / PSS spike | devMetroReloadGuard / release verify |
| 3 | hub_periodic backdrop remount / native_heap floor | skipBackdropRemount / 60m floor |
| 4 | audit:memory:all PASS vs runtime PSS floor drift | static PASS / runtime FAIL |
| 5 | retention audit NO_DATA / route_blur snapshot | playtest snapshot missing |
| 6 | monitor-paused / auto-fix OFF | record-only by design |
| 7 | central bank + convoy 30% / mem audit gap | daily batch AsyncStorage only |
| 8 | planet ownership deedOwnerClanId persist | purge/reset linkage check |
| 9 | Galaxy map contested ring / AppState | worklet freeze patch |
| 10 | CHAT_REPORT_PENDING / session hook | schedule-6pm standalone |

## 6. Potential risks (18:00 assessment)

- **PSS floor creep** without GL spike ??native_heap / Fresco / ingress reclaim race (P1).
- **Views ??50** after Metro reload ??duplicate planet hub tree until cold restart.
- **PID_CHANGE** during soak ??baseline 鍮꾧탳 ?쒓끝; timeline marker ?꾩닔.
- **Uncommitted dev stack** (ownership쨌central bank쨌native reclaim) ??6/30 handoff ?鍮??뚭? ?щ? watch.
- **Retention NO_DATA** ??STAGE ?꾪솚 ?뚯닔 PASS/FAIL ?먯젙 遺덇?.

## 7. Future content / feature add ??memory watch focus

| Area | Pre-dev gate | Post-dev gate |
|------|--------------|---------------|
| Skia / Canvas / Reanimated | arcfire-skia-memory-lifecycle 짠1-2 | audit:skia-memory + GL mtrack 짹15MB |
| STAGE / Modal / SUB-STAGE | hubSubStageNavRef blur 寃뚯씠??| SUB-STAGE ?뺣났 5??+ route_blur snapshot |
| arcCore daily batch / economy | onBoot ?숆린 ?⑥뒪 湲덉? | audit:balance-ops + native floor 30m |
| New AsyncStorage store | purgeLocalAccountData ?곕룞 | mem-post-dev-recheck handoff |
| Galaxy map / worldmap | worklet contract | audit:worklet-contract + galaxy round-trip GL |
| Planet hub UI plate / i18n | zero tick loop | Views idle 짹20 |

## 8. Kim Team Lead ??recommended actions

1. **OK** - evening soak stable; continue floor trend watch.
2. Release 鍮뚮뱶?먯꽌 Metro HMR ?쒖쇅 soak 2h ??PSS floor쨌Views 380 ?댄븯 ?뺤씤.
3. `npm run audit:memory:retention` + route_blur ?ㅻ깄??1????NO_DATA ?댁냼.
4. ?좉퇋 湲곕뒫(以묒븰??됀룹냼?좉텒) merge ??`mem-post-dev-recheck` handoff.

