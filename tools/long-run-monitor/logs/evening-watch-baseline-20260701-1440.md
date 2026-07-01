# Arcfire evening watch ??18:00 KST comprehensive report

Generated (KST): 2026-07-01 14:41:27
Package: `com.arcfire.online`
Timeline marker: `EVENING_WATCH_6PM_START`

## 1. Runtime snapshot

| pid | PSS (MB) | GL (MB) | Views |
|-----|----------|---------|-------|
| 29266 | 683.1 | 43.6 | 361 |

**Verdict:** OK

## 2. Memory trend (since marker)

| Metric | Value |
|--------|-------|
| Samples | 39 |
| PSS min / max / last | 362.6 / 764.6 / 699.7 MB |
| PSS floor drift (last-first) | 40 MB |
| GL min / max / last | 20 / 145.4 / 43.6 MB |
| Views max / last |  /  |
| GL_RECOVERED events | 3 |
| PSS_SPIKE events | 0 |

> **PSS_FLOOR_UP** ??idle floor +40MB during watch window.

### mem-timeline tail (30 rows)

```csv
2026-07-01 07:20:51,23575,678.1,805.7,27.5,19.8,47.4,377.3,33.3,,367,2,0,
2026-07-01 07:36:10,23575,687.1,815.9,27.5,19.8,47.4,385.2,35.4,,366,9,0,
2026-07-01 07:51:28,23575,688.2,817,27.5,19.8,47.4,387.5,33.2,,371,1.1,0,
2026-07-01 08:06:46,23575,681.2,810.2,27.5,19.8,47.4,380.9,32.2,,371,-7,0,
2026-07-01 08:22:05,23575,742.9,539.4,127,19.8,146.9,160.9,30.8,,558,61.7,99.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-01 08:37:24,23575,654.4,537.4,31.5,19.8,51.3,223.9,31.4,,371,-88.5,-95.5,GL_RECOVERED idle_ok
2026-07-01 08:52:42,23575,669.1,554.4,38.2,19.8,58.1,225.9,32.4,,367,14.7,6.7,
2026-07-01 09:08:01,23575,687.6,577.6,38.8,40.7,79.5,226.5,31,,390,18.5,0.6,
2026-07-01 09:23:20,12676,362.6,481.3,20,22,42,100.6,40.6,,15,,,
2026-07-01 09:38:51,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-01 09:53:52,17266,672.2,783.6,44.7,19.8,64.5,330.7,41.1,,374,,,
2026-07-01 10:09:10,17266,684.3,783.7,42.7,19.8,62.5,337.4,34.1,,373,,,
2026-07-01 10:24:27,17266,664.6,761.2,42.7,19.8,62.6,338.5,34,,374,-19.7,0,
2026-07-01 10:39:49,17266,643.4,733.1,42.7,19.8,62.6,335.5,35.8,,371,-21.2,0,
2026-07-01 10:55:09,17266,614.5,676.6,32.9,19.8,52.8,325,37.4,,367,-28.9,-9.8,GL_RECOVERED idle_ok
2026-07-01 11:10:26,17266,597.1,659.4,32.9,19.8,52.8,321.8,29.9,,367,-17.4,0,
2026-07-01 11:25:49,17266,592.1,654.7,32.9,19.8,52.8,317.3,33.1,,366,-5,0,
2026-07-01 11:41:08,17266,616.3,678.9,33.2,34.3,67.5,325.4,38.4,,391,24.2,0.3,
2026-07-01 11:56:30,17266,608.5,671.3,33.6,40.7,74.2,323.5,25.1,,387,-7.8,0.4,
2026-07-01 12:11:48,17266,598.6,662.6,34.9,19.8,54.8,328.7,30.3,,370,-9.9,1.3,
2026-07-01 12:27:05,17266,751.9,809.6,145.4,19.8,165.3,365.3,35.4,,555,153.3,110.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-01 12:42:25,17266,645.6,568.9,32.3,40.7,73,231.7,33.1,,371,-106.3,-113.1,GL_RECOVERED idle_ok
2026-07-01 12:57:50,17266,627.8,558.4,43.7,19.8,63.5,231.3,30.8,,368,-17.8,11.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-01 13:13:08,17266,764.6,692.2,145.4,19.8,165.3,260.4,34.2,,556,136.8,101.7,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-01 13:28:31,29266,699.6,822.7,44.2,40.7,84.8,340,35.9,,390,,,
2026-07-01 13:43:51,29266,671.5,739.2,37.5,19.8,57.3,307.8,37.7,,365,,,
2026-07-01 13:59:08,29266,679.4,661.8,37.5,19.8,57.3,228.2,34.3,,365,7.9,0,
2026-07-01 14:14:26,29266,686.1,668.6,37.7,34.3,72,222,35.2,,379,6.7,0.2,
2026-07-01 14:29:45,29266,688.9,646.4,43.3,19.8,63.1,259.4,58.1,,365,2.8,5.6,
2026-07-01 14:38:24,29266,699.7,657.3,43.6,19.8,63.4,263,60.6,,361,10.8,0.3,
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

1. **P1** - PSS floor / soft ceiling: native reclaim coalesce + ingress remount audit.
2. Release 鍮뚮뱶?먯꽌 Metro HMR ?쒖쇅 soak 2h ??PSS floor쨌Views 380 ?댄븯 ?뺤씤.
3. `npm run audit:memory:retention` + route_blur ?ㅻ깄??1????NO_DATA ?댁냼.
4. ?좉퇋 湲곕뒫(以묒븰??됀룹냼?좉텒) merge ??`mem-post-dev-recheck` handoff.

