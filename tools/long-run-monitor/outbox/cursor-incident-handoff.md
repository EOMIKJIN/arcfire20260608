# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-24T23:52:01.482Z
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
[2026-06-25 08:51:20] AUTO_FIX static audit:skia-memory start
[2026-06-25 08:51:21] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260625-085120.log
[2026-06-25 08:51:21] INVESTIGATION mem snapshot gl=228.9MB pss=980MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260625-085120.log
[2026-06-25 08:51:21] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-25 08:51:21] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-25 08:51:21] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-25 08:51:22] AUTO_FIX audit:skia-memory PASS
[2026-06-25 08:51:22] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-25 08:51:40] AUTO_FIX baseline reset pid=25974 gl=3.7MB pss=362MB
[2026-06-25 08:51:40] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-25 08:52:01] VERIFY PASS pid=25974 gl=3.7MB pss=361.2MB views=13
[2026-06-25 08:52:01] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":991.1,"views":947,"lastGlMb":228.9,"hardCeiling":true}
```

## Recent incidents

```
[2026-06-25 00:52:22] PSS_SOFT_CEILING pss=801.5 gl=39.3 views=310 native_reclaim_advisory
[2026-06-25 01:22:38] PSS_SOFT_CEILING pss=805 gl=39.9 views=328 native_reclaim_advisory
[2026-06-25 08:16:14] PSS_SOFT_CEILING pss=800.1 gl=39.9 views=352 native_reclaim_advisory
[2026-06-25 08:51:20] GL_HARD_CEILING gl=228.9 pss=991.1 views=947
[2026-06-25 08:51:20] REFIX_REQUESTED gl_critical_active_hub
[2026-06-25 08:51:21] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
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
2026-06-25 07:35:50,7498,777.5,909.1,41.3,19.8,61.1,485.9,32.2,,329,-3.5,2,
2026-06-25 07:45:55,7498,777.1,908.3,41.3,19.8,61.1,488.9,28.1,,305,-0.4,0,
2026-06-25 07:51:03,7498,778.2,909.4,39.3,19.8,59.1,490.3,29.4,,313,1.1,-2,
2026-06-25 07:56:00,7498,784.5,915.7,41.4,30.2,71.7,479.7,33.6,,320,6.3,2.1,
2026-06-25 08:06:05,7498,787.3,918.6,39.3,19.8,59.1,491.1,37.3,,333,2.8,-2.1,
2026-06-25 08:16:10,7498,800.1,931.4,39.9,40.7,80.6,485.8,33.7,,352,12.8,0.6,
2026-06-25 08:21:08,7498,751.3,708.6,39.3,19.8,59.1,350.7,31.4,,313,-48.8,-0.6,
2026-06-25 08:26:15,7498,746.8,681.9,39.3,19.8,59.1,339.1,31.2,,317,-4.5,0,
2026-06-25 08:36:20,7498,747.2,682.3,39.4,20,59.4,338.6,31.1,,333,0.4,0.1,
2026-06-25 08:46:25,7498,754,689.1,39.3,19.8,59.1,339.5,36.8,,313,6.8,-0.1,
2026-06-25 08:51:13,7498,991.1,921.3,228.9,19.8,248.8,385.5,37.1,,947,237.1,189.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-25 08:52:01,25974,361.2,,3.7,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
```
