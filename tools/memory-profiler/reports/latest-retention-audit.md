# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-09-29T14:56:10.552Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 17765
- logcat [MEM_PROFILE] markers: 420
- close events audited: 39
- retention failures: 0
- skip: 39 ({"window":39})
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
### planet_hub / route_blur (09-29 13:41:09.648 13920 14047 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### galaxy_map / route_blur (09-29 13:41:13.659 13920 14047 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### planet_hub / route_blur (09-29 14:02:52.682 13920 14047 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### galaxy_map / route_blur (09-29 14:02:52.683 13920 14047 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### planet_hub / route_blur (09-29 19:17:34.110 13920 17986 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### galaxy_map / route_blur (09-29 19:17:38.918 13920 17986 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### galaxy_map / route_blur (09-29 19:17:39.868 13920 17986 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### planet_hub / route_blur (09-29 19:17:47.823 13920 17986 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### galaxy_map / route_blur (09-29 19:18:12.791 13920 17986 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13920
- skip_reason: window

### planet_hub / route_blur (09-29 19:47:47.096 29880 30088 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### galaxy_map / route_blur (09-29 19:47:47.099 29880 30088 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### planet_hub / route_blur (09-29 19:47:47.713 29880 30088 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### planet_hub / route_blur (09-29 19:48:15.631 29880 32188 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### galaxy_map / route_blur (09-29 19:48:15.635 29880 32188 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### planet_hub / route_blur (09-29 19:48:44.937 29880 32312 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### galaxy_map / route_blur (09-29 19:48:44.940 29880 32312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### planet_hub / route_blur (09-29 20:25:36.889 29880 32355 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### galaxy_map / route_blur (09-29 20:25:36.892 29880 32355 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### planet_hub / route_blur (09-29 20:25:38.225 29880 32355 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29880
- skip_reason: window

### planet_hub / route_blur (09-29 22:19:10.795  7015  7145 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7015
- skip_reason: window

### planet_hub / route_blur (09-29 22:19:21.179  7015  7145 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7015
- skip_reason: window

### galaxy_map / route_blur (09-29 22:19:21.187  7015  7145 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7015
- skip_reason: window

### galaxy_map / route_blur (09-29 22:19:21.677  7015  7145 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7015
- skip_reason: window

### planet_hub / route_blur (09-29 23:00:34.077  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:00:47.620  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-29 23:02:03.403  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:02:11.127  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:02:12.310  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-29 23:02:25.176  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=96 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:02:38.485  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=100)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:02:39.507  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=100)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-29 23:15:55.238  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:15:59.689  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:16:00.744  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-29 23:37:23.463  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:37:29.493  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:37:30.490  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-29 23:54:33.541  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-29 23:54:39.214  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

