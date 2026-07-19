# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-07-19T14:31:39.589Z
Verdict: **PASS**

- profile samples: 3
- mem-timeline samples: 16670
- logcat [MEM_PROFILE] markers: 427
- close events audited: 3
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
### planet_hub / route_blur (07-17 12:15:59.889 21904 22039 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime)
- status: **INSUFFICIENT_SAMPLES**

### galaxy_map / route_blur (07-17 12:17:20.413 21904 22039 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36)
- status: **INSUFFICIENT_SAMPLES**

### planet_hub / route_blur (07-17 20:12:19.525 21904 22039 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=52)
- status: **INSUFFICIENT_SAMPLES**
