# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-07-27T14:16:41.270Z
Verdict: **FAIL**

- profile samples: 3
- mem-timeline samples: 17386
- logcat [MEM_PROFILE] markers: 580
- close events audited: 47
- retention failures: 5

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
