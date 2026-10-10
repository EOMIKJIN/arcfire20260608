# Memory retention audit (STAGE close → recovery diff)

Generated: 2026-10-10T14:03:47.242Z
Verdict: **NO_DATA**

- profile samples: 5
- mem-timeline samples: 18646
- logcat [MEM_PROFILE] markers: 1576
- close events audited: 63
- retention failures: 0
- skip: 63 ({"window":63})
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
### planet_hub / route_blur (10-10 02:10:54.810  9440  9489 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=arcadia_prime hermes_alloc_mb=25.3 hermes_ext_mb=1.1 hermes_gc=246)
- status: **INSUFFICIENT_SAMPLES**
- pid: 9440
- skip_reason: window

### galaxy_map / route_blur (10-10 02:11:23.076  9440  9489 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=21.9 hermes_ext_mb=1.2 hermes_gc=275)
- status: **INSUFFICIENT_SAMPLES**
- pid: 9440
- skip_reason: window

### planet_hub / route_blur (10-10 02:40:39.447 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=32 detail=arcadia_prime hermes_alloc_mb=29.8 hermes_ext_mb=1.4 hermes_gc=619)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 02:40:55.886 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=19.4 hermes_ext_mb=0.5 hermes_gc=637)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 02:41:43.761 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32 hermes_alloc_mb=27.3 hermes_ext_mb=6.9 hermes_gc=727)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 02:42:28.639 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=32 hermes_alloc_mb=20.7 hermes_ext_mb=5.3 hermes_gc=811)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:03:41.716 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime hermes_alloc_mb=34.3 hermes_ext_mb=6.1 hermes_gc=25400)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:04:04.266 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=23.2 hermes_ext_mb=0.6 hermes_gc=25419)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:05:49.826 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=arcadia_prime hermes_alloc_mb=35.8 hermes_ext_mb=1.5 hermes_gc=25586)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:05:58.144 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=38.5 hermes_ext_mb=1.5 hermes_gc=25594)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:06:33.910 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=arcadia_prime hermes_alloc_mb=39.8 hermes_ext_mb=0.9 hermes_gc=25639)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:06:48.442 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=25.1 hermes_ext_mb=0.6 hermes_gc=25653)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:07:06.154 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=26.2 hermes_ext_mb=5.1 hermes_gc=25691)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:10:25.092 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=perseus_memorial hermes_alloc_mb=29.5 hermes_ext_mb=1.5 hermes_gc=26037)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:10:38.098 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=34.3 hermes_ext_mb=1.7 hermes_gc=26049)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:11:03.336 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=26.8 hermes_ext_mb=4.9 hermes_gc=26087)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:11:05.683 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=draco_haven hermes_alloc_mb=31.3 hermes_ext_mb=5 hermes_gc=26093)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:11:12.437 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=33.3 hermes_ext_mb=5 hermes_gc=26102)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:11:16.125 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=vega_base hermes_alloc_mb=40.1 hermes_ext_mb=5.2 hermes_gc=26108)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### galaxy_map / route_blur (10-10 11:11:23.052 11963 12036 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48 hermes_alloc_mb=40.8 hermes_ext_mb=5.2 hermes_gc=26117)
- status: **INSUFFICIENT_SAMPLES**
- pid: 11963
- skip_reason: window

### planet_hub / route_blur (10-10 11:29:41.632 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=28 detail=arcadia_prime hermes_alloc_mb=19.3 hermes_ext_mb=0.3 hermes_gc=109)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:30:02.097 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=28 hermes_alloc_mb=22.3 hermes_ext_mb=0.4 hermes_gc=127)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### planet_hub / route_blur (10-10 11:33:00.439 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=crimson_base hermes_alloc_mb=23 hermes_ext_mb=2.4 hermes_gc=359)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:33:13.608 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=25.9 hermes_ext_mb=2.5 hermes_gc=372)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### planet_hub / route_blur (10-10 11:36:00.029 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=36 detail=dark_haven hermes_alloc_mb=20.9 hermes_ext_mb=5.4 hermes_gc=602)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:36:09.953 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=25.8 hermes_ext_mb=5.6 hermes_gc=613)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:36:40.416 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=36 hermes_alloc_mb=27.6 hermes_ext_mb=11 hermes_gc=648)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### planet_hub / route_blur (10-10 11:42:14.190 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=omega_hub hermes_alloc_mb=28 hermes_ext_mb=8.3 hermes_gc=938)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:42:42.037 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=34.2 hermes_ext_mb=9.8 hermes_gc=958)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:42:58.508 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=26.2 hermes_ext_mb=10.9 hermes_gc=983)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### planet_hub / route_blur (10-10 11:56:15.541 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=perseus_memorial hermes_alloc_mb=37.6 hermes_ext_mb=6.5 hermes_gc=1767)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### galaxy_map / route_blur (10-10 11:56:48.800 24712 24757 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=48 hermes_alloc_mb=26.6 hermes_ext_mb=1.1 hermes_gc=1790)
- status: **INSUFFICIENT_SAMPLES**
- pid: 24712
- skip_reason: window

### planet_hub / route_blur (10-10 12:22:40.774  1201  2362 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=40 detail=perseus_memorial hermes_alloc_mb=32.2 hermes_ext_mb=40 hermes_gc=237)
- status: **INSUFFICIENT_SAMPLES**
- pid: 1201
- skip_reason: window

### galaxy_map / route_blur (10-10 12:23:16.485  1201  2362 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=52 hermes_alloc_mb=45.2 hermes_ext_mb=40.1 hermes_gc=282)
- status: **INSUFFICIENT_SAMPLES**
- pid: 1201
- skip_reason: window

### planet_hub / route_blur (10-10 13:01:37.242  5380  5491 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=perseus_memorial hermes_alloc_mb=42.8 hermes_ext_mb=10.9 hermes_gc=854)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5380
- skip_reason: window

### galaxy_map / route_blur (10-10 13:06:37.743  5380  5491 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=40 hermes_alloc_mb=26.6 hermes_ext_mb=0.4 hermes_gc=1129)
- status: **INSUFFICIENT_SAMPLES**
- pid: 5380
- skip_reason: window

### planet_hub / route_blur (10-10 13:13:39.835  7016  7111 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=44 detail=perseus_memorial hermes_alloc_mb=30.7 hermes_ext_mb=2.6 hermes_gc=342)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7016
- skip_reason: window

### galaxy_map / route_blur (10-10 13:13:44.723  7016  7111 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=44 hermes_alloc_mb=37.7 hermes_ext_mb=4.8 hermes_gc=357)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7016
- skip_reason: window

### planet_hub / route_blur (10-10 13:16:23.954  7777  7887 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=perseus_memorial hermes_alloc_mb=22.6 hermes_ext_mb=0.2 hermes_gc=298)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7777
- skip_reason: window

### galaxy_map / route_blur (10-10 13:16:33.238  7777  7887 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=31.4 hermes_ext_mb=0.4 hermes_gc=320)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7777
- skip_reason: window

### galaxy_map / route_blur (10-10 13:16:49.821  7777  7887 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=46.6 hermes_ext_mb=7.5 hermes_gc=426)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7777
- skip_reason: window

### planet_hub / route_blur (10-10 13:42:23.900  7777  7887 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=crimson_base hermes_alloc_mb=50.4 hermes_ext_mb=18.1 hermes_gc=2766)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7777
- skip_reason: window

### galaxy_map / route_blur (10-10 13:42:42.343  7777  7887 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=35.5 hermes_ext_mb=4.8 hermes_gc=2802)
- status: **INSUFFICIENT_SAMPLES**
- pid: 7777
- skip_reason: window

### planet_hub / route_blur (10-10 14:28:41.751 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=crimson_base hermes_alloc_mb=38.8 hermes_ext_mb=8.8 hermes_gc=2801)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 14:28:56.103 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=47.2 hermes_ext_mb=13.3 hermes_gc=2828)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 14:29:04.373 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=perseus_memorial hermes_alloc_mb=31.4 hermes_ext_mb=2.4 hermes_gc=2851)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 14:29:15.789 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=40.1 hermes_ext_mb=4.7 hermes_gc=2875)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 14:29:26.945 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=56 detail=draco_haven hermes_alloc_mb=46.9 hermes_ext_mb=6.9 hermes_gc=2902)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 14:29:42.637 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=60 hermes_alloc_mb=33.8 hermes_ext_mb=6.7 hermes_gc=2932)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 14:29:52.298 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=60 detail=perseus_memorial hermes_alloc_mb=43.1 hermes_ext_mb=11.2 hermes_gc=2958)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 14:30:09.846 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=56 hermes_alloc_mb=34.6 hermes_ext_mb=2.6 hermes_gc=2987)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 15:42:14.658 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=76 detail=crimson_base hermes_alloc_mb=54 hermes_ext_mb=7 hermes_gc=9826)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 15:42:26.715 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=76 hermes_alloc_mb=58.1 hermes_ext_mb=7.2 hermes_gc=9845)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 20:11:07.768 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=68 detail=crimson_base hermes_alloc_mb=43.1 hermes_ext_mb=4.8 hermes_gc=32773)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 20:11:31.706 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=68 hermes_alloc_mb=52 hermes_ext_mb=5.1 hermes_gc=32801)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 20:13:18.340 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=draco_haven hermes_alloc_mb=45.3 hermes_ext_mb=7.7 hermes_gc=32999)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 20:16:59.018 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64 hermes_alloc_mb=56.6 hermes_ext_mb=10.1 hermes_gc=33147)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 21:00:08.917 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=draco_haven hermes_alloc_mb=58.6 hermes_ext_mb=6.5 hermes_gc=37495)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 21:00:45.257 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72 hermes_alloc_mb=38.4 hermes_ext_mb=0.8 hermes_gc=37532)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 21:06:30.726 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=64 detail=arcadia_prime hermes_alloc_mb=43.8 hermes_ext_mb=4.7 hermes_gc=38367)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 21:06:44.204 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=64 hermes_alloc_mb=50.5 hermes_ext_mb=4.9 hermes_gc=38389)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### planet_hub / route_blur (10-10 21:07:06.106 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=72 detail=draco_haven hermes_alloc_mb=48.6 hermes_ext_mb=0.5 hermes_gc=38467)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

### galaxy_map / route_blur (10-10 21:07:09.388 10203 10323 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=route_blur hermes_mb=72 hermes_alloc_mb=52.7 hermes_ext_mb=0.6 hermes_gc=38479)
- status: **INSUFFICIENT_SAMPLES**
- pid: 10203
- skip_reason: window

