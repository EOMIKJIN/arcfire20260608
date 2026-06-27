# Arcfire long-run incident — Kim Team Lead auto-triage

packedAt: 2026-06-27T11:14:32.556Z
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
[2026-06-27 20:04:07] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260627-200407.log
[2026-06-27 20:04:08] INVESTIGATION mem snapshot gl=143.4MB pss=1013.6MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-200407.log
[2026-06-27 20:04:08] packed D:\arcfire20260607\tools\long-run-monitor\outbox\cursor-incident-handoff.md
[2026-06-27 20:04:08] INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json
[2026-06-27 20:04:08] INVESTIGATION code-fix handoff only (monitor-paused ??no app relaunch)
[2026-06-27 20:04:10] INVESTIGATION audit:skia-memory completed (paused mode static gate)
[2026-06-27 20:04:10] INVESTIGATION done reason=mem_hard_ceiling_playtest
[2026-06-27 20:14:17] INFO GL_HARD_CEILING_RECORD_ONLY gl=141.5 pss=1003.9 views=559 (monitor-paused ??no incident/refix spam)
[2026-06-27 20:14:31] INVESTIGATION start reason=mem_hard_ceiling_playtest
[2026-06-27 20:14:31] INVESTIGATION alert=[2026-06-27 20:14:31] [MEM_HARD_CEILING] pss=1003.9MB gl=141.5MB
[2026-06-27 20:14:31] INVESTIGATION logcat captured -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-logcat-20260627-201431.log
[2026-06-27 20:14:32] INVESTIGATION mem snapshot gl=141.5MB pss=1014.5MB -> D:\arcfire20260607\tools\long-run-monitor\logs\incident-meminfo-20260627-201431.log
```

## Recent incidents

```
[2026-06-27 19:22:38] PSS_SOFT_CEILING pss=830.4 gl=49.6 views=470 native_reclaim_advisory
[2026-06-27 19:33:00] PSS_SOFT_CEILING pss=849.6 gl=39.7 views=382 native_reclaim_advisory
[2026-06-27 19:43:21] PSS_SOFT_CEILING pss=923.9 gl=62.2 views=483 native_reclaim_advisory
[2026-06-27 19:51:37] PSS_SOFT_CEILING pss=910.2 gl=51.4 views=504 native_reclaim_advisory
[2026-06-27 19:53:39] PSS_SOFT_CEILING pss=887.7 gl=51.2 views=475 native_reclaim_advisory
[2026-06-27 20:04:08] INVESTIGATION_TRIGGERED mem_hard_ceiling_playtest
```

## Crash signature (tail)

```
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
06-27 11:57:53.268  9967 16572 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0 in tid 16572 (hades), pid 9967 (.arcfire.online)
06-27 11:57:54.641 19090 19090 F DEBUG   : signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0000000000000000
```

## mem-timeline (tail)

```csv
﻿iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note
2026-06-27 18:50:52,20481,788.8,589.6,41.5,19.8,61.4,281.3,22.8,,390,-19.6,7.3,
2026-06-27 18:51:31,20481,782.9,583.7,39.5,19.8,59.4,274.7,25.2,,370,-5.9,-2,
2026-06-27 19:01:50,20481,805,603.9,40,34.3,74.3,280.6,29.8,,410,22.1,0.5,
2026-06-27 19:12:12,20481,733.2,677.7,28,19.8,47.9,385.3,31.4,,99,-71.8,-12,GL_RECOVERED idle_ok
2026-06-27 19:21:10,20481,832.5,783.3,51.4,19.8,71.3,429.3,31.9,,486,99.3,23.4,HUB_ACTIVATION gl_mount_ok
2026-06-27 19:22:33,20481,830.4,781.9,49.6,19.8,69.4,427.3,33.8,,470,-2.1,-1.8,
2026-06-27 19:32:56,20481,849.6,805.5,39.7,19.8,59.6,448.2,38.5,,382,19.2,-9.9,GL_RECOVERED idle_ok
2026-06-27 19:43:13,20481,923.9,883,62.2,19.8,82,495.5,43.9,,483,74.3,22.5,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-27 19:51:32,20481,910.2,869.4,51.4,34.3,85.7,480.3,38.8,,504,-13.7,-10.8,GL_RECOVERED idle_ok
2026-06-27 19:53:34,20481,887.7,847,51.2,19.8,71,479.1,31.3,,475,-22.5,-0.2,
2026-06-27 20:03:55,20481,1047.6,1006.2,165.8,19.8,185.6,513.4,37,,551,159.9,114.6,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-06-27 20:14:12,20481,1003.9,962.3,141.5,19.8,161.3,511.3,26.8,,559,-43.7,-24.3,GL_RECOVERED idle_ok
```
