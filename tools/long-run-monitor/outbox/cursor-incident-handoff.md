# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-07-24T01:24:11.179Z
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
[2026-07-24 10:23:31] AUTO_FIX app relaunch reason=gl_critical_active_hub package=com.arcfire.online
[2026-07-24 10:23:48] AUTO_FIX baseline reset pid=21744 gl=4.4MB pss=417.1MB
[2026-07-24 10:23:48] VERIFY post-remediation start reason=gl_critical_active_hub (wait 20s)
[2026-07-24 10:23:50] INVESTIGATION start reason=mem_anomaly
[2026-07-24 10:23:50] INVESTIGATION alert=[2026-07-24 10:23:29] GL_HARD_CEILING gl=158.6 pss=1044.8 views=554
[2026-07-24 10:23:50] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260724-102350.log
[2026-07-24 10:23:52] INVESTIGATION mem from timeline gl=158.6MB pss=1044.8MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260724-102350.log
[2026-07-24 10:23:53] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-07-24 10:23:53] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-07-24 10:23:53] INVESTIGATION done reason=mem_anomaly
[2026-07-24 10:24:10] VERIFY PASS pid=21744 gl=9.5MB pss=591.6MB views=335
[2026-07-24 10:24:10] AUTO_FIX done reason=gl_critical_active_hub critical=True ctx={"pssMb":1044.8,"views":554,"lastGlMb":158.6,"hardCeiling":true}
```

## Recent incidents

```
[2026-07-24 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260724-0800.md verdict=OK
[2026-07-24 09:36:49] PSS_SOFT_CEILING pss=855.1 gl=130.1 views=555 native_reclaim_advisory
[2026-07-24 09:52:21] PSS_SOFT_CEILING pss=851.5 gl=130.1 views=555 native_reclaim_advisory
[2026-07-24 10:23:29] GL_HARD_CEILING gl=158.6 pss=1044.8 views=554
[2026-07-24 10:23:29] REFIX_REQUESTED gl_critical_active_hub
[2026-07-24 10:23:53] INVESTIGATION_TRIGGERED mem_anomaly
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
2026-07-24 07:48:39,18955,713.7,664,32.3,19.8,52.1,298.6,36.3,,358,0.4,0,
2026-07-24 08:04:06,18955,721.8,672.1,32.3,19.8,52.1,298.7,44.1,,358,8.1,0,
2026-07-24 08:19:33,18955,736.1,685.7,32.6,34.3,66.9,304.9,36.8,,383,14.3,0.3,
2026-07-24 08:34:56,18955,747.9,697.7,32.9,40.7,73.5,305.3,41.5,,383,11.8,0.3,
2026-07-24 08:50:22,18955,721.9,671.7,32.4,20,52.4,300.5,41.3,,357,-26,-0.5,
2026-07-24 09:05:48,18955,748.8,698.7,34.3,19.8,54.1,308,59.1,,357,26.9,1.9,
2026-07-24 09:21:15,18955,741.6,691.4,32.3,19.8,52.1,313.7,47,,364,-7.2,-2,
2026-07-24 09:36:41,18955,855.1,804.6,130.1,19.8,149.9,335.3,41,,555,113.5,97.8,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-24 09:52:14,18955,851.5,801.4,130.1,19.8,149.9,333.6,37.7,,555,-3.6,0,
2026-07-24 10:07:48,18955,703,508.6,17.6,19.8,37.4,260.6,34,,99,-148.5,-112.5,GL_RECOVERED idle_ok
2026-07-24 10:23:23,18955,1044.8,914.4,158.6,19.8,178.4,420.7,44,,554,341.8,141,HUB_ACTIVATION gl_mount_ok
2026-07-24 10:24:10,21744,591.6,,9.5,,,,,,335,,,POST_REMEDIATION_VERIFY_OK
```
