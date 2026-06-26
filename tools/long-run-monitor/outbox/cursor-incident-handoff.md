# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-26T14:02:52.533Z
triggerReason: mem_hard_ceiling_playtest
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-06-26 22:52:25] INVESTIGATION alert=[2026-06-26 22:52:25] [MEM_HARD_CEILING] pss=1008.8MB gl=37.3MB
[2026-06-26 22:52:26] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260626-225225.log
[2026-06-26 22:52:26] INVESTIGATION mem snapshot gl=37.5MB pss=1025.1MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260626-225225.log
[2026-06-26 22:52:27] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-26 22:52:27] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-26 22:52:27] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-26 22:52:29] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-26 22:52:29] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-26 23:02:50] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-26 23:02:50] INVESTIGATION alert=[2026-06-26 23:02:50] [MEM_HARD_CEILING] pss=1023.8MB gl=41.3MB
[2026-06-26 23:02:51] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260626-230250.log
[2026-06-26 23:02:52] INVESTIGATION mem snapshot gl=42MB pss=1042.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260626-230250.log
```

## Recent incidents

```
[2026-06-26 21:09:02] GL_ELEVATED mounting_or_insufficient_samples gl=125.3 pss=792.2 views=928 restart_held
[2026-06-26 21:29:52] PSS_SOFT_CEILING pss=942.5 gl=138.8 views=948 native_reclaim_advisory
[2026-06-26 21:36:30] PSS_SOFT_CEILING pss=944 gl=138.9 views=964 native_reclaim_advisory
[2026-06-26 21:40:13] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 22:37:22] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-26 22:52:27] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
```

## Crash signature (tail)

```
06-24 21:56:27.616 30966 30966 F DEBUG   :       #21 pc 000000000061eb5c  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #22 pc 000000000061eb00  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #23 pc 0000000000619fcc  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::shared_ptr<RNSkia::RNSkRenderer>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #24 pc 000000000061f3e0  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkView::~RNSkView()+56) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #25 pc 000000000063054c  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkDomView::~RNSkDomView()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #26 pc 000000000062d790  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>::~RNSkAndroidView()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #27 pc 000000000062d038  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::__shared_ptr_emplace<RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>, std::__ndk1::allocator<RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>>>::__on_zero_shared()+36) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #28 pc 000000000061eb5c  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #29 pc 000000000061eb00  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #30 pc 0000000000614a3c  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::shared_ptr<RNSkia::RNSkBaseAndroidView>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #31 pc 00000000006292dc  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JniSkiaBaseView::~JniSkiaBaseView()+40) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #32 pc 000000000062c5fc  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JniSkiaDomView::~JniSkiaDomView()+64) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.617 30966 30966 F DEBUG   :       #33 pc 000000000062c62c  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JniSkiaDomView::~JniSkiaDomView()+24) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-25 14:31:58.070 30675 30675 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xc0 in tid 30675 (.arcfire.online), pid 30675 (.arcfire.online)
06-25 14:31:59.241 15083 15083 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x00000000000000c0
06-25 15:40:33.455 17737 17788 F libc    : Fatal signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x776900008b in tid 17788 (mqt_v_js), pid 17737 (.arcfire.online)
06-25 15:40:34.500 18619 18619 F DEBUG   : signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x000000776900008b
06-25 22:18:19.426 19769 19769 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x2000 in tid 19769 (.arcfire.online), pid 19769 (.arcfire.online)
06-25 22:18:20.656 21045 21045 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0000000000002000
06-25 23:26:54.988 21140 25530 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xc7fae8ffffff00 in tid 25530 (hades), pid 21140 (.arcfire.online)
06-25 23:26:57.068 26572 26572 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x00c7fae8ffffff00
06-26 00:52:23.176 26724 26724 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x400000001 in tid 26724 (.arcfire.online), pid 26724 (.arcfire.online)
06-26 00:52:24.007 29766 29766 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0000000400000001
06-26 17:40:26.100 30549 22489 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x8e758000000100 in tid 22489 (hades), pid 30549 (.arcfire.online)
06-26 17:40:28.302 22743 22743 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x008e758000000100
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-26 21:36:24,23962,944,974.4,138.9,19.8,158.7,477.2,37.8,,964,1.5,0.1,
2026-06-26 21:40:04,23962,1075.7,1106.4,145.1,19.8,164.9,567.6,45.3,,972,131.7,6.2,PSS_SPIKE review=graphics+native
2026-06-26 21:50:25,23962,922.7,954.3,21.7,19.8,41.5,543,61,,111,-153,-123.4,GL_RECOVERED idle_ok
2026-06-26 22:00:50,23962,908.9,940.5,21.6,19.8,41.4,555.1,34.9,,111,-13.8,-0.1,
2026-06-26 22:06:47,23962,893.2,660.1,21.6,19.8,41.4,347.9,47.8,,111,-15.7,0,
2026-06-26 22:11:06,23962,871.9,637.8,21.6,19.8,41.4,334.7,39,,111,-21.3,0,
2026-06-26 22:21:24,23962,874.5,643.8,21.6,19.8,41.4,340.9,37.3,,111,2.6,0,
2026-06-26 22:31:41,23962,862.1,631.4,21.6,19.8,41.4,339.1,30.3,,111,-12.4,0,
2026-06-26 22:37:02,23962,1030.9,888.8,149.6,19.8,169.4,452.3,30.5,,963,168.8,128,HUB_ACTIVATION gl_mount_ok
2026-06-26 22:41:57,23962,1120.1,1066.1,158.8,19.8,178.6,562.2,44,,963,89.2,9.2,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-26 22:52:17,23962,1008.8,949.5,37.3,19.8,57.1,556.5,37.9,,313,-111.3,-121.5,GL_RECOVERED idle_ok
2026-06-26 23:02:35,23962,1023.8,964.6,41.3,19.8,61.2,556.3,43.2,,313,15,4,
```
