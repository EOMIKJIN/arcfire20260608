# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-06T15:02:00.936Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18334
- logcat [MEM_PROFILE] markers: 1638
- close events audited: 100
- retention failures: 0
- skip: 100 ({"window":100})
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
### planet_hub / route_blur (10-06 10:27:45.296 21380 21500 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### galaxy_map / route_blur (10-06 10:27:45.298 21380 21500 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### planet_hub / route_blur (10-06 10:27:46.152 21380 21500 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### planet_hub / route_blur (10-06 10:28:29.374 21380 22935 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### galaxy_map / route_blur (10-06 10:28:29.377 21380 22935 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### planet_hub / route_blur (10-06 10:28:59.713 21380 22988 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### galaxy_map / route_blur (10-06 10:28:59.716 21380 22988 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21380
- skip_reason: window

### planet_hub / route_blur (10-06 11:21:08.361 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### galaxy_map / route_blur (10-06 11:21:14.891 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 11:21:45.212 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 11:32:52.284 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### galaxy_map / route_blur (10-06 11:32:56.173 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### galaxy_map / route_blur (10-06 11:32:57.284 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 11:33:45.716 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### galaxy_map / route_blur (10-06 11:33:45.718 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 11:33:46.841 25205 25310 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 12:18:41.964 25205 26818 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 12:41:52.712 25205 26818 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### galaxy_map / route_blur (10-06 12:42:03.264 25205 26818 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### galaxy_map / route_blur (10-06 12:42:04.402 25205 26818 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 12:42:49.647 25205 26818 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25205
- skip_reason: window

### planet_hub / route_blur (10-06 12:55:09.036 30969 31083 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 12:55:09.995 30969 31083 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 12:55:09.998 30969 31083 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 12:55:10.731 30969 31083 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 12:55:59.408 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 12:56:07.091 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 12:56:57.391 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 12:57:53.461 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 12:57:54.545 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 14:06:03.283 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 14:06:11.864 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 14:06:12.894 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 14:15:37.795 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 14:15:37.796 30969 31894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 14:16:04.865 30969  7296 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### galaxy_map / route_blur (10-06 14:16:04.868 30969  7296 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 30969
- skip_reason: window

### planet_hub / route_blur (10-06 14:21:08.768  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 14:21:13.009  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 14:21:13.989  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### planet_hub / route_blur (10-06 14:39:09.591  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 14:39:13.548  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 14:39:14.546  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### planet_hub / route_blur (10-06 14:49:33.257  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 14:49:36.669  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 14:49:37.653  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### planet_hub / route_blur (10-06 15:03:46.808  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### galaxy_map / route_blur (10-06 15:03:46.809  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### planet_hub / route_blur (10-06 15:03:47.649  7965  8076 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7965
- skip_reason: window

### planet_hub / route_blur (10-06 15:18:01.562 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 15:18:05.603 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 15:18:08.308 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 17:53:39.520 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 17:53:44.493 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 18:42:27.115 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 18:42:35.333 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 18:42:36.335 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 18:44:53.517 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 18:44:53.518 11005 11112 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 18:45:29.314 11005 23017 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 18:45:29.317 11005 23017 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 18:48:48.626 11005 23158 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 18:48:48.629 11005 23158 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:02:22.260 11005 23292 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:02:22.263 11005 23292 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:02:58.923 11005 24151 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:02:58.926 11005 24151 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:34:17.593 11005 24283 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:34:17.597 11005 24283 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:37:55.470 11005 25664 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:37:55.473 11005 25664 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:38:19.668 11005 25798 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:38:19.671 11005 25798 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:39:56.063 11005 25908 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:39:56.065 11005 25908 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:43:35.993 11005 26029 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:43:35.996 11005 26029 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:44:09.755 11005 27075 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:44:09.758 11005 27075 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:44:33.742 11005 27135 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:44:33.746 11005 27135 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:44:56.627 11005 27163 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:44:56.630 11005 27163 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:45:23.882 11005 27203 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:45:23.885 11005 27203 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:46:11.763 11005 27230 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### galaxy_map / route_blur (10-06 19:46:11.766 11005 27230 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11005
- skip_reason: window

### planet_hub / route_blur (10-06 19:53:50.292 27699 27805 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27699
- skip_reason: window

### galaxy_map / route_blur (10-06 19:53:50.296 27699 27805 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27699
- skip_reason: window

### planet_hub / route_blur (10-06 19:53:50.794 27699 27805 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27699
- skip_reason: window

### planet_hub / route_blur (10-06 20:04:35.316 28552 28646 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### galaxy_map / route_blur (10-06 20:04:47.875 28552 28646 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### galaxy_map / route_blur (10-06 20:04:49.098 28552 28646 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### planet_hub / route_blur (10-06 20:35:05.559 28552 28646 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### galaxy_map / route_blur (10-06 20:35:05.562 28552 28646 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### planet_hub / route_blur (10-06 20:58:45.496 28552 31054 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### galaxy_map / route_blur (10-06 20:58:45.500 28552 31054 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### planet_hub / route_blur (10-06 20:58:46.216 28552 31054 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### planet_hub / route_blur (10-06 20:59:21.136 28552 32163 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

### galaxy_map / route_blur (10-06 20:59:21.138 28552 32163 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 28552
- skip_reason: window

