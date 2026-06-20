# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-20T13:06:06.802Z
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
[2026-06-20 14:35:04] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-06-20 16:05:09] INCIDENT CRASH logged -> incidents.log (arcfire fresh=2 maxAge=65m)
[2026-06-20 16:05:09] HANDOFF packed -> outbox/cursor-incident-handoff.md (crash)
[2026-06-20 22:05:26] INCIDENT GL_HARD_CEILING gl=62 pss=985.3 views=305 -> immediate remediation (OOM imminent)
[2026-06-20 22:05:26] REFIX_REQUESTED gl_critical_active_hub -> gl-leak-refix-requested.flag
[2026-06-20 22:05:26] AUTO_FIX static audit:skia-memory start
[2026-06-20 22:05:28] AUTO_FIX audit:skia-memory PASS
[2026-06-20 22:05:28] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-06-20 22:05:46] AUTO_FIX baseline reset pid=3924 gl=6MB pss=193.2MB
[2026-06-20 22:05:46] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-06-20 22:06:06] VERIFY PASS pid=3924 gl=4.4MB pss=352.5MB views=13
[2026-06-20 22:06:06] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":985.3,"views":305,"lastGlMb":62,"hardCeiling":true}
```

## Recent incidents

```
[2026-06-20 14:34:19] GL_HARD_CEILING gl=108.6 pss=1015.4 views=932
[2026-06-20 14:34:19] REFIX_REQUESTED gl_critical_active_hub
===== CRASH 2026-06-20 16:05:09 arcfire_fresh=2 maxAge=65m =====
06-20 15:52:50.504  1909  4225 I ActivityManager: Process com.arcfire.online (pid 31767) has died: cch CAC (2046,927)
[2026-06-20 22:05:26] GL_HARD_CEILING gl=62 pss=985.3 views=305
[2026-06-20 22:05:26] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
06-19 04:17:42.427 13353 13353 F DEBUG   :       #63 pc 0000000000786138  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JsiDomNode::invalidate()+200) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #64 pc 00000000007850f4  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JsiDomNode::dispose(bool)+92) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #65 pc 0000000000783d7c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JsiDomRenderNode::dispose(bool)+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #66 pc 0000000000786274  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JsiDomNode::invalidate()+516) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #67 pc 00000000007850f4  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JsiDomNode::dispose(bool)+92) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
06-19 04:17:42.427 13353 13353 F DEBUG   :       #68 pc 0000000000783d7c  /data/app/~~fXK6tBXO2xBbtnDokMXonw==/com.arcfire.online-RoPVHoIBd2UvT9ybW5yO0A==/base.apk!librnskia.so (offset 0x414a000) (RNSkia::JsiDomRenderNode::dispose(bool)+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
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
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-20 17:05:10,11807,2362.6,1856.9,49.4,19.8,69.2,567.2,17.4,,271,175.9,2,PSS_SPIKE review=graphics+native
2026-06-20 17:35:11,11807,1977,1471.7,47.4,19.8,67.2,316.5,30.7,,279,-385.6,-2,
2026-06-20 18:05:12,11807,704,702.7,49.3,19.8,69.1,369.2,36.3,,283,-1273,1.9,
2026-06-20 18:35:14,11807,693.3,693.7,50.2,19.8,70,368.5,15.8,,282,-10.7,0.9,
2026-06-20 19:05:15,11807,686.2,676.3,25.9,19.8,45.7,366.4,30.6,,106,-7.1,-24.3,GL_RECOVERED idle_ok
2026-06-20 19:35:16,11807,826.5,820,47.2,34.3,81.5,417.5,32.5,,331,140.3,21.3,HUB_ACTIVATION gl_mount_ok
2026-06-20 20:05:17,11807,808.6,782.1,56.3,20,76.3,412.1,30.1,,318,-17.9,9.1,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-20 20:35:19,11807,796.7,715.6,54.6,19.8,74.4,361.8,26.3,,314,-11.9,-1.7,
2026-06-20 21:05:20,11807,942.6,889,53.8,19.8,73.7,478.2,34.6,,306,145.9,-0.8,PSS_SPIKE review=graphics+native
2026-06-20 21:35:21,11807,962.2,908,43.2,19.8,63.1,484.8,57,,190,19.6,-10.6,GL_RECOVERED idle_ok
2026-06-20 22:05:23,11807,985.3,830.1,62,19.8,81.9,450.2,31.9,,305,23.1,18.8,HUB_ACTIVATION gl_mount_ok
2026-06-20 22:06:06,3924,352.5,,4.4,,,,,,13,,,POST_REMEDIATION_VERIFY_OK
```
