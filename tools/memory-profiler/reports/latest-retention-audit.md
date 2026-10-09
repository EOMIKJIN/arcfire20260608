# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-09T14:05:09.043Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18556
- logcat [MEM_PROFILE] markers: 1798
- close events audited: 126
- retention failures: 0
- skip: 126 ({"window":126})
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
### planet_hub / route_blur (10-08 23:23:57.804 25922 26184 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25922
- skip_reason: window

### galaxy_map / route_blur (10-08 23:23:57.815 25922 26184 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25922
- skip_reason: window

### planet_hub / route_blur (10-08 23:24:08.477 25922 26184 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25922
- skip_reason: window

### galaxy_map / route_blur (10-08 23:24:08.480 25922 26184 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**
- pid: 25922
- skip_reason: window

### planet_hub / route_blur (10-08 23:30:33.174 27318 27426 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27318
- skip_reason: window

### galaxy_map / route_blur (10-08 23:31:00.331 27318 27426 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27318
- skip_reason: window

### planet_hub / route_blur (10-08 23:31:09.527 27318 27426 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27318
- skip_reason: window

### galaxy_map / route_blur (10-08 23:31:20.645 27318 27426 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 27318
- skip_reason: window

### planet_hub / route_blur (10-08 23:47:35.726 29253 29465 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29253
- skip_reason: window

### galaxy_map / route_blur (10-08 23:47:51.338 29253 29465 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29253
- skip_reason: window

### planet_hub / route_blur (10-09 00:04:17.815 31460 31555 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 31460
- skip_reason: window

### galaxy_map / route_blur (10-09 00:04:27.255 31460 31555 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 31460
- skip_reason: window

### planet_hub / route_blur (10-09 00:04:39.316 31460 31555 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 31460
- skip_reason: window

### galaxy_map / route_blur (10-09 00:04:52.756 31460 31555 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 31460
- skip_reason: window

### planet_hub / route_blur (10-09 00:13:31.315 31460 31555 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 31460
- skip_reason: window

### planet_hub / route_blur (10-09 00:16:58.490  1119  1221 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 1119
- skip_reason: window

### galaxy_map / route_blur (10-09 00:17:08.304  1119  1221 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 1119
- skip_reason: window

### planet_hub / route_blur (10-09 00:39:54.905  3439  3609 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 3439
- skip_reason: window

### galaxy_map / route_blur (10-09 00:40:04.058  3439  3609 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 3439
- skip_reason: window

### planet_hub / route_blur (10-09 00:41:42.577  3439  3609 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**
- pid: 3439
- skip_reason: window

### galaxy_map / route_blur (10-09 00:41:52.176  3439  3609 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 3439
- skip_reason: window

### planet_hub / route_blur (10-09 00:49:52.582  7138  7247 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7138
- skip_reason: window

### galaxy_map / route_blur (10-09 00:50:00.047  7138  7247 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7138
- skip_reason: window

### planet_hub / route_blur (10-09 01:57:48.425 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### galaxy_map / route_blur (10-09 01:57:55.323 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### planet_hub / route_blur (10-09 02:15:08.489 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=92 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### galaxy_map / route_blur (10-09 02:15:16.821 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=92)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### planet_hub / route_blur (10-09 02:18:15.812 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=96 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### galaxy_map / route_blur (10-09 02:18:20.864 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=96)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### planet_hub / route_blur (10-09 02:18:38.175 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=96 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### galaxy_map / route_blur (10-09 02:18:49.741 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=96)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### planet_hub / route_blur (10-09 02:31:05.349 15250 15336 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=116 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 15250
- skip_reason: window

### planet_hub / route_blur (10-09 02:51:13.890 19469 19574 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19469
- skip_reason: window

### planet_hub / route_blur (10-09 02:51:15.734 19469 19574 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19469
- skip_reason: window

### planet_hub / route_blur (10-09 02:51:59.950 19469 19574 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19469
- skip_reason: window

### planet_hub / route_blur (10-09 03:11:17.483 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 03:11:24.165 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 03:21:12.414 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 03:21:20.931 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 03:31:21.202 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 03:31:26.738 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 03:32:28.506 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 03:32:32.392 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 03:33:39.609 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 03:33:43.108 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 03:34:19.716 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 03:34:27.338 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 03:39:06.414 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 10:27:41.337 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 10:27:57.962 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 10:28:05.871 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 11:20:46.394 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:21:20.661 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:21:41.588 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:22:09.259 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:23:14.473 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:23:35.806 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:23:56.664 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:24:32.243 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### galaxy_map / route_blur (10-09 11:28:18.109 20711 20893 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 20711
- skip_reason: window

### planet_hub / route_blur (10-09 15:07:11.558 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=100 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:07:34.985 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=100)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:07:40.333 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=112 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:11:21.437 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=112)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:12:03.266 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=112 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:12:12.425 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=112)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:12:30.651 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=112)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:18:37.038 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=144)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:18:37.088 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=144)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:18:39.754 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=144 detail=synth_073_p hermes_alloc_mb=102.1 hermes_gc=26996)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:22:56.358 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=148 hermes_alloc_mb=116.3 hermes_gc=28069)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:22:56.410 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=148 hermes_alloc_mb=116.4 hermes_gc=28070)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:23:01.207 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=148 detail=synth_073_p hermes_alloc_mb=119.8 hermes_gc=28179)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:23:01.603 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=148 hermes_alloc_mb=120.9 hermes_gc=28186)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:23:01.656 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=148 hermes_alloc_mb=120.9 hermes_gc=28187)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:23:04.462 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=144 detail=synth_073_p hermes_alloc_mb=127.2 hermes_ext_mb=26.3 hermes_gc=28247)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:49:38.152 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=196 detail=synth_073_p hermes_alloc_mb=172.8 hermes_ext_mb=15.8 hermes_gc=34993)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:49:45.935 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=196 hermes_alloc_mb=180.4 hermes_ext_mb=18.2 hermes_gc=35025)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:59:41.420 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=216 hermes_alloc_mb=118.8 hermes_ext_mb=4.6 hermes_gc=37570)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:59:41.489 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=216 hermes_alloc_mb=119.3 hermes_ext_mb=4.6 hermes_gc=37571)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:59:46.566 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=216 detail=arcadia_prime hermes_alloc_mb=124.8 hermes_ext_mb=4.7 hermes_gc=37682)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 15:59:47.221 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=216 hermes_alloc_mb=126.4 hermes_ext_mb=4.7 hermes_gc=37692)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 15:59:49.964 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=216 detail=arcadia_prime hermes_alloc_mb=130.1 hermes_ext_mb=4.8 hermes_gc=37751)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 16:00:03.994 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=216 hermes_alloc_mb=152.8 hermes_ext_mb=10.2 hermes_gc=37989)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 16:00:04.090 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=216 hermes_alloc_mb=151.4 hermes_ext_mb=10.2 hermes_gc=37991)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 16:00:09.483 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=216 detail=arcadia_prime hermes_alloc_mb=158.6 hermes_ext_mb=10.3 hermes_gc=38102)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 16:01:17.559 19243 19503 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=216 detail=arcadia_prime hermes_alloc_mb=186.8 hermes_ext_mb=15.6 hermes_gc=38311)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 16:01:58.015 19243 14693 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 hermes_alloc_mb=27.8 hermes_ext_mb=28.9 hermes_gc=285)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 16:01:58.025 19243 14693 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32 hermes_alloc_mb=24.2 hermes_ext_mb=28.8 hermes_gc=286)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 16:06:07.624 19243 14761 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 hermes_alloc_mb=28.6 hermes_ext_mb=24.1 hermes_gc=416)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### galaxy_map / route_blur (10-09 16:06:07.629 19243 14761 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=28.6 hermes_ext_mb=24.1 hermes_gc=416)
- status: **INSUFFICIENT_SAMPLES**
- pid: 19243
- skip_reason: window

### planet_hub / route_blur (10-09 16:29:21.136 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime hermes_alloc_mb=39.3 hermes_ext_mb=0.3 hermes_gc=279)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### galaxy_map / route_blur (10-09 16:29:41.589 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=49.9 hermes_ext_mb=0.4 hermes_gc=317)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### planet_hub / route_blur (10-09 16:29:57.910 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=synth_073_p hermes_alloc_mb=31.2 hermes_ext_mb=0.3 hermes_gc=386)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### galaxy_map / route_blur (10-09 16:30:07.742 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68 hermes_alloc_mb=43.3 hermes_ext_mb=0.5 hermes_gc=416)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### planet_hub / route_blur (10-09 16:37:05.515 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=synth_052_p hermes_alloc_mb=43.1 hermes_ext_mb=6.9 hermes_gc=1587)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### galaxy_map / route_blur (10-09 16:42:22.491 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=44 hermes_ext_mb=20.2 hermes_gc=1933)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### planet_hub / route_blur (10-09 16:56:43.039 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=96 hermes_alloc_mb=53.3 hermes_ext_mb=9.1 hermes_gc=6984)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### galaxy_map / route_blur (10-09 16:56:43.140 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=96 hermes_alloc_mb=53.4 hermes_ext_mb=9.1 hermes_gc=6988)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### planet_hub / route_blur (10-09 16:56:43.663 17218 17362 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=96 detail=arcadia_prime hermes_alloc_mb=56.1 hermes_ext_mb=10.3 hermes_gc=7004)
- status: **INSUFFICIENT_SAMPLES**
- pid: 17218
- skip_reason: window

### planet_hub / route_blur (10-09 17:44:26.566 21762 21991 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=112 detail=arcadia_prime hermes_alloc_mb=72.5 hermes_ext_mb=12.6 hermes_gc=9957)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-09 19:00:35.186 21762 21991 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=192 hermes_alloc_mb=142.1 hermes_ext_mb=9 hermes_gc=39534)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### galaxy_map / route_blur (10-09 19:00:35.190 21762 21991 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=192 hermes_alloc_mb=142.1 hermes_ext_mb=9 hermes_gc=39534)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-09 19:00:38.424 21762 21991 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=192 detail=arcadia_prime hermes_alloc_mb=145.9 hermes_ext_mb=9.1 hermes_gc=39642)
- status: **INSUFFICIENT_SAMPLES**
- pid: 21762
- skip_reason: window

### planet_hub / route_blur (10-09 19:45:43.892 29913 29993 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 hermes_alloc_mb=42.2 hermes_ext_mb=9.8 hermes_gc=4439)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29913
- skip_reason: window

### galaxy_map / route_blur (10-09 19:45:43.897 29913 29993 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=42.2 hermes_ext_mb=9.8 hermes_gc=4439)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29913
- skip_reason: window

### planet_hub / route_blur (10-09 20:04:18.685 29913 29993 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime hermes_alloc_mb=39.7 hermes_ext_mb=1 hermes_gc=5655)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29913
- skip_reason: window

### galaxy_map / route_blur (10-09 20:04:31.665 29913 29993 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52 hermes_alloc_mb=48.1 hermes_ext_mb=1.2 hermes_gc=5677)
- status: **INSUFFICIENT_SAMPLES**
- pid: 29913
- skip_reason: window

### planet_hub / route_blur (10-09 21:45:48.407  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime hermes_alloc_mb=27.3 hermes_ext_mb=5.5 hermes_gc=4452)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 21:48:17.446  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=17.7 hermes_ext_mb=3.1 hermes_gc=4539)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 21:48:39.514  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=vega_base hermes_alloc_mb=18.6 hermes_ext_mb=4.8 hermes_gc=4566)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 21:48:47.780  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32 hermes_alloc_mb=21.9 hermes_ext_mb=4.9 hermes_gc=4574)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 21:49:01.808  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime hermes_alloc_mb=21.7 hermes_ext_mb=2.6 hermes_gc=4599)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 21:49:08.895  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=22.3 hermes_ext_mb=2.7 hermes_gc=4607)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 21:59:35.887  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=vega_base hermes_alloc_mb=22.5 hermes_ext_mb=4.8 hermes_gc=5168)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 21:59:39.915  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=23.4 hermes_ext_mb=4.8 hermes_gc=5173)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 22:33:35.159  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=vega_base hermes_alloc_mb=24.5 hermes_ext_mb=9.3 hermes_gc=7271)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 22:33:38.802  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=28.5 hermes_ext_mb=9.3 hermes_gc=7275)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 22:46:11.777  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=vega_base hermes_alloc_mb=23.3 hermes_ext_mb=4.6 hermes_gc=7980)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 22:47:24.173  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48 hermes_alloc_mb=30.2 hermes_ext_mb=5.3 hermes_gc=8023)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 22:49:29.796  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_052_p hermes_alloc_mb=21.5 hermes_ext_mb=4.7 hermes_gc=8138)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 22:49:52.825  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=28 hermes_ext_mb=5 hermes_gc=8157)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 23:02:21.401  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime hermes_alloc_mb=28.1 hermes_ext_mb=0.8 hermes_gc=8957)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 23:02:43.129  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=33.2 hermes_ext_mb=1.1 hermes_gc=8975)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### planet_hub / route_blur (10-09 23:03:29.927  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=eden_city hermes_alloc_mb=28 hermes_ext_mb=0.7 hermes_gc=9021)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

### galaxy_map / route_blur (10-09 23:03:49.288  5540  5583 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52 hermes_alloc_mb=31.6 hermes_ext_mb=0.9 hermes_gc=9037)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5540
- skip_reason: window

