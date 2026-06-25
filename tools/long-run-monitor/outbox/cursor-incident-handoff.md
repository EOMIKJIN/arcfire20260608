# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-25T14:27:13.127Z
triggerReason: arcfire_crash_playtest
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-06-25 22:54:26] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-25 22:54:28] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-25 22:54:28] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-25 22:54:48] INVESTIGATION throttled reason=mem_hard_ceiling_playtest (duplicate within window)
[2026-06-25 23:04:26] INFO PSS_SOFT_CEILING pss=860 gl=25.6 views=289 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 23:14:34] INFO PSS_SOFT_CEILING pss=838.4 gl=27.4 views=284 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 23:24:41] INFO PSS_SOFT_CEILING pss=907.4 gl=44.2 views=287 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 23:24:50] INFO PSS_SOFT_CEILING pss=911.6 gl=41.2 views=294 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-25 23:27:11] INVESTIGATION start reason=arcfire_crash_playtest
[2026-06-25 23:27:11] INVESTIGATION alert=[2026-06-25 23:27:11] [ARCFIRE_CRASH age=0.3m] 06-25 23:26:54.988 21140 25530 F libc    : Fatal signal 11 (SIGSEGV), cod
[2026-06-25 23:27:12] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260625-232711.log
[2026-06-25 23:27:12] INVESTIGATION mem snapshot gl=6MB pss=198.3MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260625-232711.log
```

## Recent incidents

```
[2026-06-25 22:18:40] INVESTIGATION_TRIGGERED arcfire_crash_playtest
[2026-06-25 22:54:26] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-25 23:04:26] PSS_SOFT_CEILING pss=860 gl=25.6 views=289 native_reclaim_advisory
[2026-06-25 23:14:34] PSS_SOFT_CEILING pss=838.4 gl=27.4 views=284 native_reclaim_advisory
[2026-06-25 23:24:41] PSS_SOFT_CEILING pss=907.4 gl=44.2 views=287 native_reclaim_advisory
[2026-06-25 23:24:50] PSS_SOFT_CEILING pss=911.6 gl=41.2 views=294 native_reclaim_advisory
```

## Crash signature (tail)

```
06-24 21:56:27.616 30966 30966 F DEBUG   :       #17 pc 0000000000633358  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::shared_ptr<RNSkia::JsiDomRenderNode>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #18 pc 00000000008e8584  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #19 pc 00000000008e8380  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkDomRenderer::~RNSkDomRenderer()+132) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #20 pc 0000000000630cb8  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::__shared_ptr_emplace<RNSkia::RNSkDomRenderer, std::__ndk1::allocator<RNSkia::RNSkDomRenderer>>::__on_zero_shared()+28) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
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
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-25 22:03:48,19769,351.6,454.7,4.4,52.9,57.3,120.5,17.5,,13,,,
2026-06-25 22:13:54,19769,657.3,785.5,42,19.8,61.8,340,34.2,,299,,,
2026-06-25 22:23:59,21140,624,653.4,46.2,19.8,66,272.9,26.8,,288,,,
2026-06-25 22:24:34,21140,598.9,627.8,46.2,19.8,66,255.9,21.5,,280,,,
2026-06-25 22:34:05,21140,630.3,668.5,42.4,40.7,83.1,285.4,20.5,,304,31.4,-3.8,
2026-06-25 22:44:11,21140,672.2,687,48.1,19.8,67.9,320.2,29.2,,316,41.9,5.7,PSS_SPIKE review=graphics+native
2026-06-25 22:54:16,21140,941.2,910.2,226.8,19.8,246.6,395.7,29.3,,932,269,178.7,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 22:54:39,21140,929.6,898.6,226.8,19.8,246.6,394.3,19.2,,932,-11.6,0,
2026-06-25 23:04:21,21140,860,914.2,25.6,34.3,59.9,526.4,35.8,,289,-69.6,-201.2,GL_RECOVERED idle_ok
2026-06-25 23:14:28,21140,838.4,892.4,27.4,19.8,47.2,519.9,33.5,,284,-21.6,1.8,
2026-06-25 23:24:36,21140,907.4,957.7,44.2,19.8,64,560.4,37.9,,287,69,16.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 23:24:45,21140,911.6,961.9,41.2,34.3,75.5,558.1,32.8,,294,4.2,-3,
```
