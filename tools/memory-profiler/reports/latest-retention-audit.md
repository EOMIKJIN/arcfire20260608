# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-07-11T14:19:40.773Z
Verdict: **FAIL**

- profile samples: 3
- mem-timeline samples: 16285
- logcat [MEM_PROFILE] markers: 1861
- close events audited: 118
- retention failures: 27

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
### planet_hub / route_blur (07-10 15:48:33.966 27872 28025 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 19:25:46.956  6004  6095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 19:37:56.131  6004  6095 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 19:37:56.134  6004  6095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 19:37:56.558  6004  6095 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 19:43:22.168  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 19:48:36.304  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:48:36.321  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:48:41.703  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:48:46.098  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:51:52.796  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### planet_hub / route_blur (07-10 19:52:11.785  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=synth_002_p)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:55:29.136  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### planet_hub / route_blur (07-10 19:55:33.902  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=vega_base)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:56:08.446  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### planet_hub / route_blur (07-10 19:56:45.104  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:57:10.616  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### planet_hub / route_blur (07-10 19:57:16.704  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=vega_base)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### galaxy_map / route_blur (07-10 19:57:29.625  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### planet_hub / route_blur (07-10 19:57:41.759  6004  9839 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=vega_base)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +165.1MB after close
- baseline: PSS=697.8 GL=19.9 native=392.3 views=99
- after window min: PSS=570.6 GL=8.4 native=557.4 views=99

### planet_hub / route_blur (07-10 20:28:10.583 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 20:33:49.145 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### planet_hub / route_blur (07-10 20:33:53.440 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=synth_002_p)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:36:58.365 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:37:14.737 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:37:56.388 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:38:14.716 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:38:25.071 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:38:52.592 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:39:06.120 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:39:19.882 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:39:38.750 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:42:39.372 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### galaxy_map / route_blur (07-10 20:44:38.175 10538 10643 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **RETENTION_FAIL**
- flags: NATIVE_FLOOR_UP +243.8MB after close
- baseline: PSS=692 GL=97.9 native=316.7 views=577
- after window min: PSS=594.3 GL=8.5 native=560.5 views=99

### planet_hub / route_blur (07-10 20:48:14.888 12074 12186 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=synth_002_p)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:48:27.274 12074 12186 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:51:34.997 12074 12186 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:51:35.150 12074 12186 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### planet_hub / route_blur (07-10 20:52:22.628 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=synth_002_p)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:52:41.610 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### planet_hub / route_blur (07-10 20:52:45.927 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:55:37.648 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### planet_hub / route_blur (07-10 20:55:42.746 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=iron_remnant)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:59:01.519 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:59:01.524 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:59:06.728 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:59:52.486 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### galaxy_map / route_blur (07-10 20:59:57.572 12074 12427 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **PASS**
- baseline: PSS=594.3 GL=8.5 native=null views=99
- after window min: PSS=554.8 GL=8.5 native=618.8 views=99

### planet_hub / route_blur (07-10 21:46:39.511 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=iron_remnant)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 21:46:52.530 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 21:48:49.103 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 21:48:53.536 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 21:48:58.928 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 21:49:04.968 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 21:53:53.055 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 21:54:13.005 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 22:21:30.967 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:25:42.701 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:25:42.705 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:25:51.182 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:26:10.949 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:26:18.163 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:26:20.384 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:28:34.955 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 22:28:39.398 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:29:03.383 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 22:53:41.306 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 22:54:20.503 12768 12871 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-10 23:55:41.074 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-10 23:55:59.570 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 00:32:17.013 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 00:32:38.318 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 09:35:18.422 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 09:36:12.829 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 10:51:38.879 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 10:54:33.990 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 10:54:47.213 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 10:57:14.978 18506 18624 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 10:57:45.478 11083 11180 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 10:58:08.173 11083 11180 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 10:58:08.323 11083 11180 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 10:59:14.468 11426 11534 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:00:39.024 11426 11534 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:04:25.016 11426 11534 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 11:09:48.396 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:10:06.086 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 11:12:16.677 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:12:25.746 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:12:50.534 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:12:56.296 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:12:59.314 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:13:05.392 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:13:08.444 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:13:13.654 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:13:44.197 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:13:49.198 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:13:53.999 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:17:29.188 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:17:29.354 12213 12312 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 11:18:12.808 12213 12616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:19:25.367 12213 12616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 11:23:35.991 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:24:54.414 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 11:35:33.023 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 11:36:23.473 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 11:36:31.521 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 14:04:08.618 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 14:04:28.212 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 15:28:02.036 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 15:28:18.838 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 20:55:16.040 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 20:55:35.358 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 21:40:13.196 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 21:40:42.272 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 21:41:00.739 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 21:41:22.107 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-11 21:59:18.246 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=vega_base)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-11 21:59:33.128 14204 16667 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**
