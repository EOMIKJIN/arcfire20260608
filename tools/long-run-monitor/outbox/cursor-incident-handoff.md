# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-24T12:56:37.750Z
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
[2026-06-24 19:38:44] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-24 19:39:05] VERIFY PASS pid=20679 gl=3.7MB pss=381.5MB views=13
[2026-06-24 19:39:05] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1009.4,"views":288,"lastGlMb":43.5,"hardCeiling":true}
[2026-06-24 19:39:05] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-24 20:39:38] INFO PSS_SOFT_CEILING pss=847.3 gl=23.6 views=321 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-24 20:49:46] INFO PSS_SOFT_CEILING pss=851 gl=43.5 views=301 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-24 20:59:53] INFO PSS_SOFT_CEILING pss=841.9 gl=41.6 views=314 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-24 21:30:15] INFO PSS_SOFT_CEILING pss=829.4 gl=39.5 views=294 -> no restart (Native Reclaim Tier soft zone; app STAGE reclaim)
[2026-06-24 21:56:36] INVESTIGATION start reason=arcfire_crash_playtest
[2026-06-24 21:56:36] INVESTIGATION alert=[2026-06-24 21:56:36] [ARCFIRE_CRASH age=0.2m] 06-24 21:56:26.392 28783 28792 F libc    : Fatal signal 11 (SIGSEGV), cod
[2026-06-24 21:56:37] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260624-215636.log
[2026-06-24 21:56:37] INVESTIGATION mem snapshot gl=MB pss=MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260624-215636.log
```

## Recent incidents

```
[2026-06-24 19:38:25] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
[2026-06-24 20:39:38] PSS_SOFT_CEILING pss=847.3 gl=23.6 views=321 native_reclaim_advisory
[2026-06-24 20:40:43] PLAYTEST_MILESTONE arcadia_idle_watch_until_11am_20260625
[2026-06-24 20:49:46] PSS_SOFT_CEILING pss=851 gl=43.5 views=301 native_reclaim_advisory
[2026-06-24 20:59:53] PSS_SOFT_CEILING pss=841.9 gl=41.6 views=314 native_reclaim_advisory
[2026-06-24 21:30:15] PSS_SOFT_CEILING pss=829.4 gl=39.5 views=294 native_reclaim_advisory
```

## Crash signature (tail)

```
06-24 21:56:27.616 30966 30966 F DEBUG   :       #09 pc 000000000064f2b4  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNJsi::RuntimeAwareCache<std::__ndk1::map<std::__ndk1::basic_string<char, std::__ndk1::char_traits<char>, std::__ndk1::allocator<char>>, facebook::jsi::Function, std::__ndk1::less<std::__ndk1::basic_string<char, std::__ndk1::char_traits<char>, std::__ndk1::allocator<char>>>, std::__ndk1::allocator<std::__ndk1::pair<std::__ndk1::basic_string<char, std::__ndk1::char_traits<char>, std::__ndk1::allocator<char>> const, facebook::jsi::Function>>>>::~RuntimeAwareCache()+240) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #10 pc 000000000064f194  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNJsi::JsiHostObject::~JsiHostObject()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #11 pc 0000000000784f68  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomNode::~JsiDomNode()+124) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #12 pc 0000000000784d48  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomRenderNode::~JsiDomRenderNode()+52) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #13 pc 0000000000820c68  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiGroupNode::~JsiGroupNode()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #14 pc 00000000008208d4  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::__shared_ptr_emplace<RNSkia::JsiGroupNode, std::__ndk1::allocator<RNSkia::JsiGroupNode>>::__on_zero_shared()+36) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #15 pc 000000000061eb5c  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-24 21:56:27.616 30966 30966 F DEBUG   :       #16 pc 000000000061eb00  /data/app/~~gTjyQhScJaRgI3Ks0cjwVg==/com.arcfire.online-yw82bpuEz5A7u7FxIfivKA==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
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
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-24 20:40:48,20679,810.9,816.3,25,19.8,44.8,469.3,23.1,,298,-1.9,2,PROFILE_SNAP stage=unknown event=manual id=20260624-204047-609
2026-06-24 20:40:51,20679,819,824.4,25,19.8,44.8,470.1,30.4,,298,8.1,0,arcadia_hub_user_session_2039
2026-06-24 20:49:41,20679,851,856.7,43.5,20,63.4,474.4,34.3,,301,32,18.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-24 20:59:47,20679,841.9,851.3,41.6,19.8,61.4,468.3,29.8,,314,-9.1,-1.9,
2026-06-24 21:09:55,28783,649.9,779.2,39.2,20,59.2,323.3,32.7,,294,,,
2026-06-24 21:17:31,28783,669.8,799.6,44.7,19.8,64.6,336.4,37.1,,408,19.9,5.5,mem_priority_watch_2115
2026-06-24 21:19:04,28783,655.8,786,33.8,19.8,53.6,342.3,26.6,,291,-14,-10.9,GL_RECOVERED idle_ok
2026-06-24 21:20:01,28783,651.4,781.7,35.8,19.8,55.6,335.7,26,,294,-4.4,2,
2026-06-24 21:30:10,28783,829.4,957.9,39.5,19.8,59.3,432.3,62.6,,294,178,3.7,PSS_SPIKE review=graphics+native
2026-06-24 21:40:16,28783,793.5,922.4,40.1,40.7,80.8,401.7,41,,302,-35.9,0.6,
2026-06-24 21:49:11,28783,765.1,893.2,39.9,19.8,59.7,400.7,34.6,,301,-28.4,-0.2,
2026-06-24 21:50:22,28783,767.3,895.4,41.9,19.8,61.7,404.9,29.7,,293,2.2,2,
```
