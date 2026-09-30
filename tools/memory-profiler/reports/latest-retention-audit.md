# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-09-30T14:56:35.749Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 17856
- logcat [MEM_PROFILE] markers: 2554
- close events audited: 151
- retention failures: 0
- skip: 151 ({"window":151})
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

### planet_hub / route_blur (09-30 00:05:02.352  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:05:10.112  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:05:11.347  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:10:41.030  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:11:00.403  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:11:01.388  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:14:17.251  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:14:36.683  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:17:39.646  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:17:46.852  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:17:47.850  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:22:19.910  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:22:26.683  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:22:27.584  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:31:04.794  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:36:51.473  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:36:52.378  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:42:15.488  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:42:15.490  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:42:16.255  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:42:20.209  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:42:20.211  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:42:21.049  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:43:16.503  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:43:21.137  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:43:22.101  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=84)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:43:43.741  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=88 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:43:49.017  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=88 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:44:04.125  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=88 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:44:50.072  8765  8869 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=84 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:49:38.086  8765 12683 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### galaxy_map / route_blur (09-30 00:49:38.091  8765 12683 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:49:38.570  8765 12683 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 8765
- skip_reason: window

### planet_hub / route_blur (09-30 00:58:10.594 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 00:58:14.960 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 00:58:15.772 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 01:02:59.962 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 01:03:08.141 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 01:03:09.252 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 01:39:17.672 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 01:39:27.274 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 01:39:28.182 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 09:54:02.574 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 09:54:19.430 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 09:54:20.307 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 09:55:22.895 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 09:55:27.652 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 09:55:28.547 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 12:04:09.677 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 12:04:16.409 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 12:04:17.320 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:37:37.104 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:38:05.605 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:38:38.977 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:38:38.978 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=80)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:38:39.629 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=80 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:38:43.471 13104 13201 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:00.941 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:00.943 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:02.881 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:02.881 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:10.516 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:10.516 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:20.235 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:20.236 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:27.746 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:27.747 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:31.722 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:31.723 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:40:59.902 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:40:59.902 13104  4632 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:41:49.175 13104  4774 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:41:49.177 13104  4774 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:42:10.655 13104  4801 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:42:10.658 13104  4801 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 13:42:56.749 13104  4894 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### galaxy_map / route_blur (09-30 13:42:56.752 13104  4894 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 13104
- skip_reason: window

### planet_hub / route_blur (09-30 14:17:30.867  5675  5769 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### galaxy_map / route_blur (09-30 14:17:30.870  5675  5769 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### planet_hub / route_blur (09-30 14:18:31.252  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### galaxy_map / route_blur (09-30 14:18:31.254  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### planet_hub / route_blur (09-30 14:20:36.887  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### galaxy_map / route_blur (09-30 14:20:36.888  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### planet_hub / route_blur (09-30 14:21:07.372  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### galaxy_map / route_blur (09-30 14:21:07.373  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### planet_hub / route_blur (09-30 14:25:22.018  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### galaxy_map / route_blur (09-30 14:25:22.019  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### planet_hub / route_blur (09-30 14:25:25.954  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### galaxy_map / route_blur (09-30 14:25:25.955  5675  5985 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5675
- skip_reason: window

### planet_hub / route_blur (09-30 14:30:05.482  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 14:30:22.336  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 14:30:23.253  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:17:38.117  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:17:40.466  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:35:16.972  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 15:35:16.973  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:35:18.741  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:35:22.407  6328  6421 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:43:52.418  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:49:59.523  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:54:57.295  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:55:02.158  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 15:55:17.566  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 16:02:30.521  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 16:02:30.525  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 16:02:35.028  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 16:02:35.029  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 16:02:35.822  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 16:02:39.366  6328  9293 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### planet_hub / route_blur (09-30 16:13:42.137  6328 10002 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 16:13:53.086  6328 10002 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

### galaxy_map / route_blur (09-30 16:13:54.199  6328 10002 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
- pid: 6328
- skip_reason: window

