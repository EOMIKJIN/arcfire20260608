# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-08-04T14:18:47.943Z
Verdict: **FAIL**

- profile samples: 3
- mem-timeline samples: 18132
- logcat [MEM_PROFILE] markers: 2761
- close events audited: 352
- retention failures: 20

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
### planet_hub / route_blur (07-27 09:44:32.708 17709 17864 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 10:22:30.711 17709 17864 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 10:40:41.802 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 10:41:02.880 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 10:50:42.947 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 10:51:13.467 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 10:51:28.805 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 10:51:34.164 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 10:52:18.489 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 10:52:40.213 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 10:58:34.681 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 11:03:08.422 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 11:03:08.424 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 11:03:08.915 21109 21218 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 11:20:51.120 21109 22924 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 11:21:58.190 21109 22924 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +159.7MB after close
- baseline: PSS=699.5 GL=27.8 native=423.3 views=99
- after window min: PSS=609.4 GL=10.6 native=583 views=120

### galaxy_map / route_blur (07-27 11:21:58.196 21109 22924 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +159.7MB after close
- baseline: PSS=699.5 GL=27.8 native=423.3 views=99
- after window min: PSS=609.4 GL=10.6 native=583 views=120

### galaxy_map / route_blur (07-27 11:21:58.790 21109 22924 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +159.7MB after close
- baseline: PSS=699.5 GL=27.8 native=423.3 views=99
- after window min: PSS=609.4 GL=10.6 native=583 views=120

### planet_hub / route_blur (07-27 11:25:25.909 21109 23799 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=sirius_border)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +159.7MB after close
- baseline: PSS=699.5 GL=27.8 native=423.3 views=99
- after window min: PSS=609.4 GL=10.6 native=583 views=120

### galaxy_map / route_blur (07-27 11:27:24.395 21109 23799 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +159.7MB after close
- baseline: PSS=699.5 GL=27.8 native=423.3 views=99
- after window min: PSS=609.4 GL=10.6 native=583 views=120

### planet_hub / route_blur (07-27 12:15:44.659 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:16:02.059 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:16:23.620 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:16:30.148 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:16:56.845 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:17:15.878 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:17:28.558 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:17:38.759 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:28:46.536 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:28:46.539 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:28:46.883 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:28:48.031 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:28:51.189 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:28:51.190 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:29:12.152 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:29:12.153 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 12:29:29.305 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 12:29:29.306 24418 24938 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 15:55:42.446 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 17:52:21.232 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 20:10:41.583 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 20:24:22.116 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 20:24:39.613 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 20:24:46.029 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 20:26:43.800 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-27 20:27:06.504 26380 26471 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-27 20:53:24.984 14983 15078 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 04:56:33.392 14983 15078 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 04:56:33.401 14983 15078 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 04:56:33.902 14983 15078 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 05:15:00.448 14983 32717 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 05:45:29.549 14983 32717 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 05:45:29.555 14983 32717 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 05:45:30.128 14983 32717 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 05:48:46.253 14983  2657 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 05:48:46.256 14983  2657 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 05:50:55.350 14983  2980 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 05:50:55.353 14983  2980 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 09:20:37.110 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 12:58:45.407 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:58:45.412 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:58:45.552 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 12:58:55.966 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:58:55.968 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:58:56.086 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 12:58:59.409 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:58:59.411 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:58:59.699 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 12:59:10.231 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:59:10.232 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:59:10.365 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 12:59:14.941 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:59:14.943 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:59:15.075 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 12:59:20.201 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:59:20.203 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 12:59:20.325 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 13:01:35.952 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 13:01:35.953 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 13:01:36.074 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 13:01:58.906 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 13:01:58.908 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 13:01:58.927 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 13:01:58.928 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 13:01:59.056 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 14:44:03.654 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +193.3MB after close
- baseline: PSS=887.4 GL=127.2 native=390.6 views=572
- after window min: PSS=564.4 GL=8.5 native=583.9 views=99

### galaxy_map / route_blur (07-28 14:44:03.803 14983  3058 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +193.3MB after close
- baseline: PSS=887.4 GL=127.2 native=390.6 views=572
- after window min: PSS=564.4 GL=8.5 native=583.9 views=99

### planet_hub / route_blur (07-28 14:45:04.150 14983 26714 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=sirius_border)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +193.3MB after close
- baseline: PSS=887.4 GL=127.2 native=390.6 views=572
- after window min: PSS=564.4 GL=8.5 native=583.9 views=99

### planet_hub / route_blur (07-28 15:00:44.351 27017 27136 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:00:44.358 27017 27136 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:00:44.701 27017 27136 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:01:01.808 27017 27136 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:01:33.109 27017 27606 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:01:33.111 27017 27606 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:02:04.906 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:02:04.909 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:02:42.170 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:02:42.171 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:03:10.602 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:03:10.605 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:03:11.081 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:07:07.324 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:07:07.327 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:07:07.346 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:07:07.347 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:07:07.699 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:07:29.892 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:07:29.894 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:07:29.909 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 15:07:29.911 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:07:30.386 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 15:17:44.867 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 18:07:59.596 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 18:07:59.599 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 18:07:59.979 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 18:08:00.112 27017 27648 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 18:09:49.500 27017 32469 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 18:40:46.201 27017 32469 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 18:44:51.430  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 20:44:23.804  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 20:44:23.808  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 20:44:24.100  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 20:45:22.126  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 20:45:22.128  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 20:45:22.248  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 20:47:36.446  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:47:36.448  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:47:36.575  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### planet_hub / route_blur (07-28 20:48:04.417  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:48:04.421  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:48:04.543  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### planet_hub / route_blur (07-28 20:48:29.063  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:48:29.065  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:48:29.182  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:50:06.635  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### galaxy_map / route_blur (07-28 20:50:06.740  1710  1846 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### planet_hub / route_blur (07-28 20:51:07.625  1710  8132 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=sirius_border)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +206.1MB after close
- baseline: PSS=797.4 GL=100.4 native=351.9 views=644
- after window min: PSS=613.4 GL=8.5 native=558 views=99

### planet_hub / route_blur (07-28 21:01:54.703  8652  8764 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 21:08:03.762  9150  9254 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 21:59:57.338  9150  9254 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 21:59:57.345  9150  9254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 21:59:57.559  9150  9254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 21:59:58.564  9150  9254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 21:59:58.674  9150  9254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 22:00:44.603  9150 11649 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-28 22:00:44.606  9150 11649 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-28 22:11:54.427  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 10:57:41.148  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 11:56:33.646  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 15:30:59.790  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:23:03.061  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:46:34.880  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:46:34.882  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:46:35.414  9150 11678 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:47:20.434  9150  8096 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:47:20.436  9150  8096 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:48:17.868  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:48:17.870  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:48:21.620  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:48:21.621  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:48:36.371  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:50:16.097  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:50:16.101  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:50:16.299  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:50:22.603  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:50:22.606  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:50:22.774  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:50:39.919  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:50:39.920  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:50:47.403  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:50:47.404  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:53:05.187  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:53:05.188  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 22:53:23.693  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 22:53:23.694  9150  8146 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:01:30.985  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:51:22.860  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:51:22.866  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:51:23.198  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:51:38.691  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:51:38.693  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:51:38.888  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:52:06.875  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:52:06.878  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:52:06.901  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:52:06.901  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:52:07.102  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:54:19.297  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:54:19.300  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:54:19.484  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:56:11.530  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:56:11.534  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:56:11.544  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:56:11.545  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:56:11.750  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:56:27.985  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:56:27.988  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-29 23:56:28.011  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:56:28.011  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-29 23:56:28.171  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-30 08:48:17.141  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### galaxy_map / route_blur (07-30 08:48:17.287  8590  8690 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### planet_hub / route_blur (07-30 08:49:59.992  8590 26162 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=sirius_border)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### galaxy_map / route_blur (07-30 08:50:05.173  8590 26162 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### planet_hub / route_blur (07-30 08:50:08.333  8590 26162 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=sirius_border)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### galaxy_map / route_blur (07-30 08:51:08.029  8590 26162 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### planet_hub / route_blur (07-30 08:51:13.544  8590 26162 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=sirius_border)
- status: **PASS**
- baseline: PSS=779 GL=125.5 native=273.5 views=577
- after window min: PSS=710.7 GL=8.5 native=165.8 views=99

### planet_hub / route_blur (07-30 09:08:28.980 29392 29494 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-30 15:22:52.544 29392 29494 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-30 20:24:31.746 29392 29494 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:21:21.957 29392 29494 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:21:21.959 29392 29494 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:21:22.507 29392 29494 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:24:40.674 29392 17147 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:24:40.676 29392 17147 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:25:42.520 29392 17340 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:25:42.522 29392 17340 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:31:42.809 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:31:42.811 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:32:10.551 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:32:10.552 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:32:19.199 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:32:19.200 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:32:40.466 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:32:40.466 29392 17376 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:34:04.023 29392 17757 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:34:04.026 29392 17757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:34:36.857 29392 17789 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:34:36.859 29392 17789 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:36:31.076 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:36:31.079 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:36:44.915 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:36:44.916 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:36:44.929 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:36:44.930 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:36:44.940 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:36:44.941 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:36:44.951 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:36:44.952 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:36:44.973 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:36:44.974 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:43:02.296 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 08:43:02.297 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 08:44:44.324 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 13:21:07.393 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 13:22:00.727 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=sirius_border)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 13:22:21.366 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 13:22:28.049 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=draco_haven)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 13:22:41.005 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 13:22:56.779 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 13:23:20.533 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 14:43:23.210 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 14:43:40.290 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 14:44:02.270 29392 17814 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:08:22.653 12785 12992 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:23:04.753 12785 12992 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:23:04.759 12785 12992 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:23:05.251 12785 12992 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:24:59.246 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:24:59.249 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:25:09.517 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=20)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:25:09.518 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=20)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:28:25.588 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:28:25.589 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:28:31.865 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:28:31.866 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:28:40.624 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:28:40.624 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:28:51.843 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:28:51.844 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:29:14.398 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:29:14.399 12785 13528 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:36:11.387 12785 13820 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:38:09.797 12785 13820 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:38:09.803 12785 13820 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-31 19:38:10.295 12785 13820 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-31 19:42:05.289 12785 13947 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 06:20:43.557 12785 13947 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 11:34:19.637 15776 15917 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 11:59:13.141 15776 15917 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 11:59:13.147 15776 15917 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 11:59:13.640 15776 15917 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:03.671 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:03:03.677 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:03.996 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:19.839 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:03:19.841 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:20.220 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:26.291 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:03:26.292 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:26.604 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:34.092 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:03:34.093 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:03:34.428 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:04:49.999 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:04:50.002 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:04:50.545 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:05:04.151 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:05:04.153 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:05:04.541 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:08:22.577 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:08:22.578 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:08:23.077 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:08:38.011 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 12:08:38.012 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:08:38.600 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 12:10:53.575 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:52:42.884 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:52:43.051 15776 17754 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 16:56:01.336 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:56:01.338 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 16:56:31.553 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:56:31.553 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 16:56:56.273 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:56:56.273 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 16:57:13.682 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:57:13.683 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 16:57:28.348 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 16:57:28.348 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:00:49.433 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 17:00:49.434 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:01:07.676 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 17:01:07.677 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:01:07.686 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 17:01:07.686 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:01:07.706 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 17:01:07.706 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:06:45.521 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 17:06:45.522 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:06:50.094 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 17:06:50.095 15776 28245 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 17:30:18.657 29412 29501 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 21:10:02.649 29412 29501 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 21:10:02.793 29412 29501 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 21:34:47.090 29412  5165 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-01 21:59:18.632  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 22:35:04.993  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 22:35:10.171  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-01 22:35:16.077  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:20:33.712  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:23:13.960  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:23:24.443  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:23:26.379  7476  7569 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-02 01:46:20.747 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:46:27.372 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-02 01:46:31.514 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:48:55.043 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-02 01:48:58.405 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:58:52.128 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:59:09.716 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (08-02 01:59:18.014 15186 15283 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (08-02 02:02:03.096 18187 18290 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**
