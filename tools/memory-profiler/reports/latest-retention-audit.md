# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-05T15:01:51.412Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18255
- logcat [MEM_PROFILE] markers: 1842
- close events audited: 144
- retention failures: 0
- skip: 144 ({"window":144})
- contract: same-pid · baseline≤3min · views≥50 · pair-dedupe

## Thresholds
```json
{
  "recoveryWindowMin": 15,
  "minSamplesAfterClose": 2,
  "glRecoverMinDeltaMb": 12,
  "pssRetainedWarnMb": 35,
  "nativeRetainedWarnMb": 25,
  "viewsClosedHubMax": 380,
  "viewsDuplicateTreeMin": 450,
  "hermesRetainedWarnMb": 8,
  "baselineStaleMaxMin": 3,
  "coldViewsMax": 50
}
```

## Results
### galaxy_map / route_blur (10-05 06:27:08.579 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:27:09.575 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:33:36.687 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:33:48.040 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:33:49.063 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:34:05.376 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:34:55.348 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:34:56.340 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:42:42.792 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:42:42.793 28883 29130 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:44:29.052 28883 17182 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:44:44.309 28883 17182 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:50:03.770 28883 17182 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:50:03.772 28883 17182 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:50:10.252 28883 17182 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 06:51:03.093 28883 18049 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### galaxy_map / route_blur (10-05 06:51:03.096 28883 18049 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 07:53:33.892 28883 18122 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28883
- skip_reason: window

### planet_hub / route_blur (10-05 08:22:06.091 22131 22235 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 08:25:06.901 22131 22235 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:37:13.906 22131 22982 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### galaxy_map / route_blur (10-05 10:37:13.913 22131 22982 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:37:14.587 22131 22982 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:37:50.432 22131 31138 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### galaxy_map / route_blur (10-05 10:37:50.435 22131 31138 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:44:07.194 22131 31223 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### galaxy_map / route_blur (10-05 10:44:07.197 22131 31223 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:57:18.485 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### galaxy_map / route_blur (10-05 10:57:18.489 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:57:18.506 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### galaxy_map / route_blur (10-05 10:57:18.507 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:57:19.513 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:57:23.037 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### galaxy_map / route_blur (10-05 10:57:23.038 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:57:24.047 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 10:57:27.666 22131 31507 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 22131
- skip_reason: window

### planet_hub / route_blur (10-05 11:21:48.855 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:21:59.604 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:25:58.086 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:25:59.095 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 11:50:13.931 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:50:26.051 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:50:27.060 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 11:53:48.825 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 11:57:14.656 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:57:32.880 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:57:33.883 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 11:59:12.095 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=solar_station)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 11:59:19.864 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 12:02:41.754 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 12:02:42.664 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 12:02:48.758 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 12:03:01.821 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 12:03:02.796 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 12:03:07.920 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=omega_hub)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 12:03:26.292 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 13:56:42.268 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 13:56:51.253 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 13:56:52.245 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 15:22:51.308 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 15:23:03.529 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 15:23:04.554 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 15:40:38.689 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 15:40:38.690 32281 32372 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 15:41:23.435 32281 17521 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 15:41:23.438 32281 17521 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 18:01:13.338 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 18:01:25.003 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 18:16:27.574 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 18:17:07.698 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 18:17:08.589 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 18:17:13.823 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 18:18:39.430 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 18:18:40.363 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 18:26:55.977 32281 17578 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 18:46:29.688 32281 25960 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### galaxy_map / route_blur (10-05 18:46:44.536 32281 25960 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 32281
- skip_reason: window

### planet_hub / route_blur (10-05 19:17:17.685 27314 27473 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:17:17.688 27314 27473 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:17:48.946 27314 29696 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:17:48.949 27314 29696 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:18:45.752 27314 29740 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:18:45.754 27314 29740 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:32:14.013 27314 29855 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:41:24.488 27314 29855 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:48:01.944 27314 29855 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:48:01.948 27314 29855 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:48:31.370 27314 31674 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:48:31.373 27314 31674 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:49:10.086 27314 31722 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:49:10.089 27314 31722 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:53:57.096 27314 31772 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:53:57.099 27314 31772 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 19:54:23.979 27314 31953 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 19:54:23.982 27314 31953 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 20:00:50.993 27314 31982 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=108 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 20:00:52.505 27314 31982 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=108)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 20:00:52.509 27314 31982 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=108)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 20:05:18.686 27314 32356 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### galaxy_map / route_blur (10-05 20:05:18.688 27314 32356 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27314
- skip_reason: window

### planet_hub / route_blur (10-05 20:30:45.607  2726  2945 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:32:44.751  2726  2945 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:41:39.392  2726  2945 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### galaxy_map / route_blur (10-05 20:41:39.395  2726  2945 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:42:08.782  2726  4296 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### galaxy_map / route_blur (10-05 20:42:08.785  2726  4296 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:42:36.375  2726  4388 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### galaxy_map / route_blur (10-05 20:42:36.378  2726  4388 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:44:14.648  2726  4429 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### galaxy_map / route_blur (10-05 20:44:14.650  2726  4429 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:44:47.450  2726  4577 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### galaxy_map / route_blur (10-05 20:44:47.453  2726  4577 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 2726
- skip_reason: window

### planet_hub / route_blur (10-05 20:53:38.104  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### galaxy_map / route_blur (10-05 20:54:01.632  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### planet_hub / route_blur (10-05 20:55:11.237  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### planet_hub / route_blur (10-05 21:03:45.020  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### galaxy_map / route_blur (10-05 21:04:03.147  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### galaxy_map / route_blur (10-05 21:04:04.184  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### planet_hub / route_blur (10-05 22:35:19.588  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### galaxy_map / route_blur (10-05 22:35:19.589  5924  6121 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5924
- skip_reason: window

### planet_hub / route_blur (10-05 22:39:30.904 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### planet_hub / route_blur (10-05 22:41:25.160 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### galaxy_map / route_blur (10-05 22:41:33.909 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### galaxy_map / route_blur (10-05 22:41:34.934 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### planet_hub / route_blur (10-05 22:48:45.801 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### galaxy_map / route_blur (10-05 22:48:45.803 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### planet_hub / route_blur (10-05 22:48:46.760 14584 14684 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### planet_hub / route_blur (10-05 22:49:14.273 14584 15281 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### galaxy_map / route_blur (10-05 22:49:14.276 14584 15281 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### planet_hub / route_blur (10-05 23:02:44.384 14584 15317 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### galaxy_map / route_blur (10-05 23:02:53.649 14584 15317 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 14584
- skip_reason: window

### planet_hub / route_blur (10-05 23:04:21.144 16402 16512 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16402
- skip_reason: window

### galaxy_map / route_blur (10-05 23:04:31.892 16402 16512 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16402
- skip_reason: window

### galaxy_map / route_blur (10-05 23:04:32.745 16402 16512 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16402
- skip_reason: window

### planet_hub / route_blur (10-05 23:11:50.542 16402 16512 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16402
- skip_reason: window

### galaxy_map / route_blur (10-05 23:11:50.544 16402 16512 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16402
- skip_reason: window

### planet_hub / route_blur (10-05 23:29:40.905 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### galaxy_map / route_blur (10-05 23:31:19.770 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### planet_hub / route_blur (10-05 23:58:22.294 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### planet_hub / route_blur (10-05 23:58:24.138 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### planet_hub / route_blur (10-05 23:58:30.865 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### planet_hub / route_blur (10-05 23:58:58.766 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### planet_hub / route_blur (10-05 23:59:13.231 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

### planet_hub / route_blur (10-06 00:01:06.645 17717 17816 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17717
- skip_reason: window

