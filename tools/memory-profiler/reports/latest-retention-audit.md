# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-06-29T14:27:56.384Z
Verdict: **NO_DATA**

- profile samples: 3
- mem-timeline samples: 15165
- logcat [MEM_PROFILE] markers: 0
- close events audited: 0
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
_No route_blur snapshots yet. Run `npm run profile:mem:snapshot -- -Stage planet_hub -Event route_blur` during play._