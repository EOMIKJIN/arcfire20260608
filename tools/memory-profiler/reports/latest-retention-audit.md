# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-09-23T16:58:58.529Z
Verdict: **FAIL**

- profile samples: 5
- mem-timeline samples: 21669
- logcat [MEM_PROFILE] markers: 1693
- close events audited: 209
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
### planet_hub / route_blur (09-20 11:42:03.157 13596 13790 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 11:42:03.158 13596 13790 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 11:42:03.806 13596 13790 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 11:43:04.507 13596 16549 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 11:43:04.510 13596 16549 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 11:44:59.978 13596 16591 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 11:44:59.982 13596 16591 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 11:46:31.184 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 11:48:17.730 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 11:56:28.148 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_073_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 11:56:42.102 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 11:56:42.907 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 11:58:06.293 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 12:03:17.901 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### galaxy_map / route_blur (09-20 12:03:17.903 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### galaxy_map / route_blur (09-20 12:03:18.305 13596 16681 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### planet_hub / route_blur (09-20 12:03:41.693 13596 17131 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### galaxy_map / route_blur (09-20 12:03:41.697 13596 17131 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### planet_hub / route_blur (09-20 12:04:06.830 13596 17159 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### galaxy_map / route_blur (09-20 12:04:06.833 13596 17159 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **PASS**
- baseline: PSS=864.2 GL=140.4 native=411.3 views=222
- after window min: PSS=698.1 GL=12.6 native=387.2 views=108

### planet_hub / route_blur (09-20 14:44:21.543 13596 17184 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:44:21.547 13596 17184 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:44:21.579 13596 17184 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:44:21.580 13596 17184 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:44:22.178 13596 17184 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:44:26.730 13596 17184 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:44:47.574 13596 22487 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:44:47.576 13596 22487 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:44:55.864 13596 22487 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:44:55.865 13596 22487 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:46:53.660 13596 22487 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:46:53.660 13596 22487 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:47:19.690 13596 22577 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:47:19.692 13596 22577 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:47:53.135 13596 22618 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:47:53.138 13596 22618 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:55:38.798 22698 22802 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:55:38.802 22698 22802 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:55:39.427 22698 22802 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:55:43.723 22698 22802 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:56:15.916 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:56:15.919 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:57:05.513 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:57:05.514 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:57:07.517 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:57:07.518 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:57:08.940 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:57:08.941 22698 23254 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:57:57.384 22698 23315 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:57:57.387 22698 23315 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:58:18.974 22698 23354 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:58:18.978 22698 23354 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:59:16.303 22698 23431 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:59:16.305 22698 23431 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 14:59:58.174 22698 23474 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 14:59:58.176 22698 23474 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 15:00:57.917 22698 23515 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 15:00:57.920 22698 23515 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 15:02:04.426 22698 23576 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 15:02:04.428 22698 23576 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 15:02:48.051 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 15:02:48.054 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 16:56:23.665 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 16:57:18.484 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:00:11.662 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 17:00:33.769 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48 detail=synth_057_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:01:05.208 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 17:01:12.543 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_002_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:02:57.550 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 17:06:19.329 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=iron_remnant)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:08:39.560 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 17:28:03.542 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:28:46.362 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:29:39.061 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 17:33:17.431 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=titan_ruins)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:33:41.437 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 17:33:42.335 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 18:00:40.736 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 19:40:20.437 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **PASS**
- baseline: PSS=972.4 GL=122.5 native=458.9 views=299
- after window min: PSS=463.6 GL=12.1 native=177.4 views=13

### galaxy_map / route_blur (09-20 19:41:52.112 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **PASS**
- baseline: PSS=972.4 GL=122.5 native=458.9 views=299
- after window min: PSS=463.6 GL=12.1 native=177.4 views=13

### galaxy_map / route_blur (09-20 19:41:52.940 22698 23616 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76)
- status: **PASS**
- baseline: PSS=972.4 GL=122.5 native=458.9 views=299
- after window min: PSS=463.6 GL=12.1 native=177.4 views=13

### planet_hub / route_blur (09-20 19:50:10.244 31917 32022 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 19:50:10.248 31917 32022 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 19:50:10.885 31917 32022 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=titan_ruins)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 19:52:23.282 31917 32354 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:52:23.284 31917 32354 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:54:37.734 31917 32499 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:54:37.737 31917 32499 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:55:52.394 31917 32663 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:55:52.397 31917 32663 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:56:23.292 31917 32701 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:56:23.295 31917 32701 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:57:21.426 31917 32735 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:57:21.429 31917 32735 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:57:57.884 31917   316 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:57:57.887 31917   316 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:58:21.130 31917   355 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:58:21.133 31917   355 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 19:58:22.743 31917   355 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 19:58:22.744 31917   355 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 20:01:28.897 31917   384 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### galaxy_map / route_blur (09-20 20:01:28.899 31917   384 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +206.3MB after close; NATIVE_FLOOR_UP +186.3MB after close
- baseline: PSS=463.6 GL=12.1 native=177.4 views=13
- after window min: PSS=669.9 GL=13.2 native=363.7 views=100

### planet_hub / route_blur (09-20 20:17:03.124 31917   496 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=titan_ruins)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +83.7MB after close; NATIVE_FLOOR_UP +46.4MB after close
- baseline: PSS=669.9 GL=13.2 native=363.7 views=100
- after window min: PSS=753.6 GL=37.9 native=410.1 views=395

### galaxy_map / route_blur (09-20 20:17:54.848 31917   496 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **RETENTION_FAIL**
- flags: PSS_FLOOR_UP +83.7MB after close; NATIVE_FLOOR_UP +46.4MB after close
- baseline: PSS=669.9 GL=13.2 native=363.7 views=100
- after window min: PSS=753.6 GL=37.9 native=410.1 views=395

### planet_hub / route_blur (09-20 21:28:15.565  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=solar_station)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 21:28:35.426  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 21:28:36.232  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:32:03.254  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:37:13.187  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 21:37:34.766  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:40:17.008  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 21:40:17.009  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:40:17.813  5136  5230 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:41:17.653  5136  7602 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 21:41:17.656  5136  7602 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:50:03.027  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:50:07.006  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:50:25.837  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:50:52.727  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:51:03.707  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:51:34.669  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:51:54.020  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:52:44.736  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:52:47.553  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:53:08.243  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:53:30.301  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:53:33.363  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:53:47.908  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:54:05.027  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:54:45.167  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 21:54:45.171  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:54:46.084  5136  7651 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:56:40.298  5136  8450 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 21:56:44.185  5136  8450 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 22:03:27.326  5136  8450 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 22:03:27.330  5136  8450 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 22:03:28.338  5136  8450 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 22:16:45.917  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 22:20:48.135  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 22:22:06.778  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 22:22:58.186  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 23:16:58.082  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 23:17:27.729  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 23:17:28.815  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 23:38:45.992  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 23:39:14.375  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-20 23:39:15.531  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-20 23:45:04.959  5136  8886 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 00:04:35.305 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_054_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:05:02.928 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:06:02.082 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:06:02.914 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 00:06:09.255 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=synth_069_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:06:24.544 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:06:25.363 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 00:06:29.540 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_065_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:06:42.751 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 00:06:49.353 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_060_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:13:02.353 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:13:08.976 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:13:16.369 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:15:25.389 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:17:19.145 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:20:17.011 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:22:41.411 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:24:05.538 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 00:24:32.676 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_068_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:25:05.806 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 00:25:06.632 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 00:28:41.268 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 07:51:39.319 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 08:02:12.002 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 08:02:12.003 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 08:02:12.673 16402 16506 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 08:03:22.131 16402 32437 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 08:03:22.134 16402 32437 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 08:07:50.866 16402 32501 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 08:07:50.868 16402 32501 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 08:27:53.104 16402 32615 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 08:27:53.107 16402 32615 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 08:27:53.874 16402 32615 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 09:13:10.132  3061  3167 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 09:13:10.136  3061  3167 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 10:14:34.102  7684  7790 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 10:14:47.410  7684  7790 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 11:05:00.614 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 11:05:10.256 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 11:05:11.297 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 11:05:16.807 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_052_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 11:05:38.389 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 11:05:39.274 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 11:05:48.164 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_070_p)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 11:06:02.091 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 11:06:02.985 10183 10272 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:14:18.412 11660 11751 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:14:18.418 11660 11751 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:14:18.926 11660 11751 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=synth_078_p)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:14:43.647 11660 13081 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:14:43.650 11660 13081 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:15:05.380 11660 13120 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:15:05.384 11660 13120 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:15:46.484 11660 13151 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:15:46.488 11660 13151 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=24)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:16:53.463 11660 13209 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:16:53.466 11660 13209 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:25:05.687 11660 13368 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:25:05.690 11660 13368 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (09-21 12:29:00.262 11660 13566 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (09-21 12:29:00.264 11660 13566 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48)
- status: **INSUFFICIENT_SAMPLES**
