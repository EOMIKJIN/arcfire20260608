# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-21T11:20:24.804Z
triggerReason: gl_critical_active_hub
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-06-21 19:13:27] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.8 pss=466.7 views=928 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-21 19:13:30] INFO GL_ELEVATED mounting_or_insufficient_samples gl=145.8 pss=466.2 views=928 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-21 19:13:34] INFO GL_ELEVATED mounting_or_insufficient_samples gl=180.9 pss=513.9 views=286 -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)
[2026-06-21 20:19:36] INCIDENT GL_HARD_CEILING gl=244.8 pss=582 views=937 -> immediate remediation (OOM imminent)
[2026-06-21 20:19:36] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-21 20:19:36] AUTO_FIX static audit:skia-memory start
[2026-06-21 20:19:46] AUTO_FIX audit:skia-memory PASS
[2026-06-21 20:19:46] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-21 20:20:02] AUTO_FIX baseline reset pid=20926 gl=3.7MB pss=175.7MB
[2026-06-21 20:20:02] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-21 20:20:24] VERIFY PASS pid=20926 gl=8.4MB pss=210.5MB views=93
[2026-06-21 20:20:24] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":582,"views":937,"lastGlMb":244.8,"hardCeiling":true}
```

## Recent incidents

```
[2026-06-21 19:13:24] GL_ELEVATED mounting_or_insufficient_samples gl=148.5 pss=480.8 views=928 restart_held
[2026-06-21 19:13:27] GL_ELEVATED mounting_or_insufficient_samples gl=145.8 pss=466.7 views=928 restart_held
[2026-06-21 19:13:30] GL_ELEVATED mounting_or_insufficient_samples gl=145.8 pss=466.2 views=928 restart_held
[2026-06-21 19:13:34] GL_ELEVATED mounting_or_insufficient_samples gl=180.9 pss=513.9 views=286 restart_held
[2026-06-21 20:19:36] GL_HARD_CEILING gl=244.8 pss=582 views=937
[2026-06-21 20:19:36] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
06-19 04:17:42.427 13353 13353 F DEBUG   :       #69 pc 00000000008e835c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::RNSkDomRenderer::~RNSkDomRenderer()+96) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #70 pc 0000000000630cb8  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (std::__ndk1::__shared_ptr_emplace<RNSkia::RNSkDomRenderer, std::__ndk1::allocator<RNSkia::RNSkDomRenderer>>::__on_zero_shared()+28) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #71 pc 000000000061eb5c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #72 pc 000000000061eb00  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #73 pc 0000000000619fcc  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (std::__ndk1::shared_ptr<RNSkia::RNSkRenderer>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #74 pc 000000000061f3e0  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::RNSkView::~RNSkView()+56) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #75 pc 000000000063054c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::RNSkDomView::~RNSkDomView()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #76 pc 000000000062d790  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>::~RNSkAndroidView()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #77 pc 000000000062d038  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (std::__ndk1::__shared_ptr_emplace<RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>, std::__ndk1::allocator<RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>>>::__on_zero_shared()+36) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #78 pc 000000000061eb5c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #79 pc 000000000061eb00  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #80 pc 0000000000614a3c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (std::__ndk1::shared_ptr<RNSkia::RNSkBaseAndroidView>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #81 pc 00000000006292dc  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JniSkiaBaseView::~JniSkiaBaseView()+40) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #82 pc 000000000062c5fc  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JniSkiaDomView::~JniSkiaDomView()+64) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #83 pc 000000000062c62c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JniSkiaDomView::~JniSkiaDomView()+24) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 14:38:38.667 17456 15777 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x1472000700140000 in tid 15777 (hades), pid 17456 (.arcfire.online)
06-19 14:38:40.625 16643 16643 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x1472000700140000
06-20 00:52:00.980 19274 19374 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x8 in tid 19374 (mqt_v_js), pid 19274 (.arcfire.online)
06-20 00:52:02.018 19616 19616 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0000000000000008
06-21 13:39:58.340  5542  5604 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xc0 in tid 5604 (mqt_v_js), pid 5542 (.arcfire.online)
06-21 13:39:59.428 15541 15541 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x00000000000000c0
06-21 14:31:52.128  6366  6366 F libc    : Fatal signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x77000002b4 in tid 6366 (.arcfire.online), pid 6366 (.arcfire.online)
06-21 14:31:53.014  9087  9087 F DEBUG   : signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x00000077000002b4
06-21 15:20:32.751 23643 23707 F libc    : Fatal signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x776340008b in tid 23707 (mqt_v_js), pid 23643 (.arcfire.online)
06-21 15:20:33.810 27647 27647 F DEBUG   : signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x000000776340008b
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-21 20:19:00,9392,356.7,468.2,52.8,19.8,72.7,140.8,23.9,,351,3.7,2,
2026-06-21 20:19:04,9392,357.7,469.1,52.8,19.8,72.7,141,24.6,,351,1,0,
2026-06-21 20:19:07,9392,355,466.4,50.8,19.8,70.7,141.5,23.3,,351,-2.7,-2,
2026-06-21 20:19:09,9392,358,469.4,50.8,19.8,70.7,141.1,26.3,,351,3,0,
2026-06-21 20:19:13,9392,355.2,466.6,50.8,19.8,70.7,141.2,23.9,,285,-2.8,0,
2026-06-21 20:19:16,9392,371.1,482.5,53,34.3,87.3,140.6,23.7,,294,15.9,2.2,
2026-06-21 20:19:18,9392,367,478.4,51.1,34.3,85.4,140.6,21.5,,310,-4.1,-1.9,
2026-06-21 20:19:22,9392,371.2,482.6,51.5,40.7,92.1,140.3,19.2,,308,4.2,0.4,
2026-06-21 20:19:26,9392,375.5,486.9,51.5,40.7,92.1,140.5,23.3,,296,4.3,0,
2026-06-21 20:19:30,9392,357.9,469.3,50.8,20,70.8,141.8,25.8,,295,-17.6,-0.7,
2026-06-21 20:19:33,9392,582,693.4,244.8,19.8,264.7,179.8,17.7,,937,224.1,194,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-21 20:20:24,20926,210.5,,8.4,,,,,,93,,,POST_REMEDIATION_VERIFY_OK
```
