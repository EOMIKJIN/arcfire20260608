# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-08-08T14:27:41.963Z
Verdict: **PASS**

- profile samples: 3
- mem-timeline samples: 18371
- logcat [MEM_PROFILE] markers: 1880
- close events audited: 18
- retention failures: 0

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
  "hermesRetainedWarnMb": 8
}
```

## Results
### planet_hub / route_blur (08-07 23:43:02.666 17518 17631 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 00:14:56.927 18177 18264 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 00:20:39.900 18177 19397 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 00:26:54.587 19660 19765 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 00:28:35.908 19660 19765 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 00:35:57.413 19660 20030 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-08 00:35:57.418 19660 20030 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 00:35:58.195 19660 20030 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 09:28:00.487 21451 21555 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 09:30:33.574 21451 11102 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 09:36:09.694 21451 11211 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-08 09:36:09.698 21451 11211 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 09:36:10.070 21451 11211 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 09:43:04.860 21451 11211 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-08 09:43:04.861 21451 11211 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 09:43:05.253 21451 11211 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-08 20:24:19.122  2786  3023 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-08 23:00:56.739  2786  3023 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
