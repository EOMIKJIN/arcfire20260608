# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-22T14:41:16.799Z
triggerReason: mem_anomaly
refixPayload: (none)

## Mandatory agent action (P0)

1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.
2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.
3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.
4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.
5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.

## Recent remediation

```
[2026-07-22 23:37:37] AUTO_FIX static audit:skia-memory start
[2026-07-22 23:37:39] AUTO_FIX audit:skia-memory PASS
[2026-07-22 23:37:39] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-22 23:37:57] AUTO_FIX baseline reset pid=29010 gl=6MB pss=196.8MB
[2026-07-22 23:37:57] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-22 23:38:18] VERIFY PASS pid=29010 gl=8.5MB pss=567.2MB views=99
[2026-07-22 23:38:18] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1028.5,"views":553,"lastGlMb":203.4,"hardCeiling":true}
[2026-07-22 23:38:19] HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)
[2026-07-22 23:41:14] INVESTIGATION start reason=mem_anomaly
[2026-07-22 23:41:14] INVESTIGATION alert=[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:41:15] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260722-234114.log
[2026-07-22 23:41:16] INVESTIGATION mem from timeline gl=8.5MB pss=567.2MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260722-234114.log
```

## Recent incidents

```
[2026-07-22 20:32:28] PSS_SOFT_CEILING pss=947.4 gl=44.6 views=317 native_reclaim_advisory
[2026-07-22 22:05:13] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 22:20:47] PSS_SOFT_CEILING pss=880.8 gl=154.8 views=553 native_reclaim_advisory
[2026-07-22 23:22:12] PSS_SOFT_CEILING pss=909.5 gl=138 views=349 native_reclaim_advisory
[2026-07-22 23:37:37] GL_HARD_CEILING gl=203.4 pss=1028.5 views=553
[2026-07-22 23:37:37] REFIX_REQUESTED gl_critical_active_hub
```

## Crash signature (tail)

```
07-22 22:50:07.414 26404 26404 F DEBUG   :       #45 pc 0000000000786bcc  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #46 pc 0000000000786aa0  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #47 pc 0000000000786a10  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #48 pc 00000000007866b8  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::NodePropsContainer::dispose()+64) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #49 pc 0000000000786138  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomNode::invalidate()+200) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #50 pc 00000000007850f4  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomNode::dispose(bool)+92) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #51 pc 0000000000783d7c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomRenderNode::dispose(bool)+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #52 pc 0000000000786274  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomNode::invalidate()+516) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #53 pc 00000000007850f4  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomNode::dispose(bool)+92) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #54 pc 0000000000783d7c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JsiDomRenderNode::dispose(bool)+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #55 pc 00000000008e835c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkDomRenderer::~RNSkDomRenderer()+96) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #56 pc 0000000000630cb8  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::__shared_ptr_emplace<RNSkia::RNSkDomRenderer, std::__ndk1::allocator<RNSkia::RNSkDomRenderer>>::__on_zero_shared()+28) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #57 pc 000000000061eb5c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #58 pc 000000000061eb00  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #59 pc 0000000000619fcc  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::shared_ptr<RNSkia::RNSkRenderer>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #60 pc 000000000061f3e0  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkView::~RNSkView()+56) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #61 pc 000000000063054c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkDomView::~RNSkDomView()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #62 pc 000000000062d790  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>::~RNSkAndroidView()+20) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #63 pc 000000000062d038  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::__shared_ptr_emplace<RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>, std::__ndk1::allocator<RNSkia::RNSkAndroidView<RNSkia::RNSkDomView>>>::__on_zero_shared()+36) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #64 pc 000000000061eb5c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #65 pc 000000000061eb00  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #66 pc 0000000000614a3c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (std::__ndk1::shared_ptr<RNSkia::RNSkBaseAndroidView>::~shared_ptr()+44) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #67 pc 00000000006292dc  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JniSkiaBaseView::~JniSkiaBaseView()+40) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #68 pc 000000000062c5fc  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JniSkiaDomView::~JniSkiaDomView()+64) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
07-22 22:50:07.414 26404 26404 F DEBUG   :       #69 pc 000000000062c62c  /data/app/~~1jBCJoN39z3fV1DQIQtvXg==/com.arcfire.online-BetpbiQJUn2jx0c00be3dg==/base.apk!librnskia.so (offset 0x414b000) (RNSkia::JniSkiaDomView::~JniSkiaDomView()+24) (BuildId: a5860719700b671c6e944005d980b317d4862e34)
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-07-22 20:47:51,18309,725,846.4,48.4,40.7,89.1,366.1,39.9,,317,,,
2026-07-22 21:03:17,18309,713.6,839.1,51.2,19.8,71.1,366.3,41,,358,,,
2026-07-22 21:18:45,18309,729.6,855.3,51.2,19.8,71.1,374.2,41.2,,360,16,0,
2026-07-22 21:34:12,18309,751.6,877.4,51.4,34.3,85.8,372.1,45.6,,376,22,0.2,
2026-07-22 21:49:39,18309,734.8,861.9,51.2,19.8,71.1,372,41,,360,-16.8,-0.2,
2026-07-22 22:05:06,18309,880.8,1007.2,154.8,19.8,174.6,411.8,42.1,,553,146,103.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-22 22:36:13,18309,751.5,874.5,42.5,19.9,62.4,368.2,48.8,,99,-129.3,-112.3,GL_RECOVERED idle_ok
2026-07-22 22:51:40,,,,,,,,,,,PROCESS_NOT_RUNNING
2026-07-22 23:06:40,27063,723.3,841.4,44.5,40.7,85.1,365.4,36.2,,311,,,
2026-07-22 23:22:06,27063,909.5,1027.5,138,19.8,157.8,466,43.7,,349,,,
2026-07-22 23:37:32,27063,1028.5,1145.7,203.4,19.8,223.3,513.2,49.2,,553,119,65.4,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-22 23:38:18,29010,567.2,,8.5,,,,,,99,,,POST_REMEDIATION_VERIFY_OK
```
