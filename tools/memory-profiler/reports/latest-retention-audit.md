# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-08T15:04:57.502Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18471
- logcat [MEM_PROFILE] markers: 0
- close events audited: 0
- retention failures: 0
- skip: 0 ({})
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
_No route_blur snapshots yet. Run `npm run profile:mem:snapshot -- -Stage planet_hub -Event route_blur` during play._
