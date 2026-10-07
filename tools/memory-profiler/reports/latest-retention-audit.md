# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-07T12:03:02.116Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18382
- logcat [MEM_PROFILE] markers: 620
- close events audited: 58
- retention failures: 0
- skip: 58 ({"window":58})
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
### planet_hub / route_blur (10-07 11:55:29.342 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 11:57:03.771 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 11:58:21.395 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 11:58:22.411 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 11:58:59.807 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 11:59:14.558 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 11:59:15.625 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:01:18.239 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 12:01:18.241 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:01:18.948 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:01:24.177 25900 26087 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:02:06.291 25900 27354 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 12:02:06.294 25900 27354 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:07:00.336 25900 27626 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 12:07:37.836 25900 27626 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### galaxy_map / route_blur (10-07 12:07:38.837 25900 27626 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:08:29.681 25900 27626 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25900
- skip_reason: window

### planet_hub / route_blur (10-07 12:11:45.982 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:12:04.136 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:13:29.062 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:13:30.016 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:14:58.096 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:14:58.097 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:14:59.018 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:15:06.268 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:15:06.269 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:15:07.336 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:16:43.054 28007 28109 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:17:33.632 28007 28760 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:18:02.011 28007 28760 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:21:42.402 28007 28760 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:21:42.403 28007 28760 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:21:42.895 28007 28760 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:22:22.003 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:22:22.006 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:22:23.445 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:22:23.446 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:34:08.152 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:35:12.469 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### galaxy_map / route_blur (10-07 12:35:13.489 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:35:39.913 28007 29093 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28007
- skip_reason: window

### planet_hub / route_blur (10-07 12:37:08.611 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:37:36.352 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:39:27.444 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:39:28.285 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:41:41.067 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:41:41.068 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:41:41.829 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:41:45.510 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:41:45.511 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:41:49.730 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:41:49.731 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:41:50.650 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:46:10.023 29930 30033 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:46:43.409 29930 30720 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:46:43.412 29930 30720 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### planet_hub / route_blur (10-07 12:47:07.104 29930 30766 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

### galaxy_map / route_blur (10-07 12:47:07.107 29930 30766 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29930
- skip_reason: window

