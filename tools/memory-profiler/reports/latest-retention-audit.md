# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-04T14:22:07.967Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18170
- logcat [MEM_PROFILE] markers: 2449
- close events audited: 85
- retention failures: 0
- skip: 85 ({"window":85})
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
### planet_hub / route_blur (10-04 03:32:31.717 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 03:32:47.332 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 03:32:48.362 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 13:56:37.213 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 13:56:53.326 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 13:56:54.278 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 13:57:10.348 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 13:57:30.082 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 13:57:30.971 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 16:45:14.347 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 16:45:20.383 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 16:45:21.513 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 17:02:34.465 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 17:02:39.952 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 17:02:40.920 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 18:21:45.852 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=88)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### galaxy_map / route_blur (10-04 18:21:45.853 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=88)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 18:21:46.634 19257 19365 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19257
- skip_reason: window

### planet_hub / route_blur (10-04 18:48:46.906  6540  6646 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 18:48:46.910  6540  6646 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 18:48:48.162  6540  6646 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 18:49:25.572  6540  6975 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 18:49:25.575  6540  6975 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 18:50:01.107  6540  7019 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 18:50:01.110  6540  7019 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 18:59:53.982  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:00:18.347  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:00:19.322  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:01:42.527  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=solar_station)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:01:52.404  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:01:53.556  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:02:12.675  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=minerva_deep)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:02:25.087  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:02:26.050  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:02:41.550  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:02:53.469  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:02:54.426  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:06:06.111  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=omega_hub)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:06:22.961  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:06:55.177  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:07:04.970  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:07:53.990  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=solar_station)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:08:04.329  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:08:05.228  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 19:22:34.977  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:22:44.821  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 19:22:45.641  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 20:04:57.961  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 20:21:01.559  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 20:25:57.964  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### galaxy_map / route_blur (10-04 20:25:57.965  6540  7095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6540
- skip_reason: window

### planet_hub / route_blur (10-04 20:32:43.952 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### planet_hub / route_blur (10-04 21:24:05.781 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### galaxy_map / route_blur (10-04 21:24:09.919 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### galaxy_map / route_blur (10-04 21:24:11.041 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### planet_hub / route_blur (10-04 21:24:42.063 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### galaxy_map / route_blur (10-04 21:25:12.654 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### planet_hub / route_blur (10-04 21:44:03.257 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### galaxy_map / route_blur (10-04 21:44:03.258 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### planet_hub / route_blur (10-04 21:44:04.010 16777 16897 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 16777
- skip_reason: window

### planet_hub / route_blur (10-04 22:18:36.471 21762 21872 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-04 22:18:45.490 21762 21872 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-04 22:18:46.377 21762 21872 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-04 22:25:41.533 21762 21872 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-04 22:25:41.534 21762 21872 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-04 22:26:18.327 21762 23801 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-04 22:26:18.329 21762 23801 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-04 22:26:59.754 21762 23859 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-04 22:26:59.756 21762 23859 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-04 22:27:44.261 21762 23925 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-04 22:27:44.263 21762 23925 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-04 22:38:35.882 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 22:38:46.664 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### planet_hub / route_blur (10-04 22:46:10.407 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 22:46:30.636 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 22:46:31.508 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### planet_hub / route_blur (10-04 22:47:27.653 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 22:47:44.022 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 22:47:45.055 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### planet_hub / route_blur (10-04 23:18:43.551 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 23:19:15.291 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 23:19:16.321 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### planet_hub / route_blur (10-04 23:19:28.029 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### galaxy_map / route_blur (10-04 23:19:28.030 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

### planet_hub / route_blur (10-04 23:19:28.760 24508 24624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=eden_city)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24508
- skip_reason: window

