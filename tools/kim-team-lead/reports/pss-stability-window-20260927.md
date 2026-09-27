# PSS 안정화 판정 — 창 감시

- generated: 2026-09-26T23:00:00.548Z
- window: 2026-09-27 01:50:43 → 2026-09-27 08:00:00 KST
- verdict: **UNSTABLE**
- flags: PSS_FLOOR_UP
- samples: 24 · pids: 27152
- class: STAIRCASE 0 / SAWTOOTH 0 / PARTIAL 1 / FLAT 0 / SHORT 0
- primary: pid=27152 class=PARTIAL span=135.9 retain=0.63 Δfloor=85.2 late_views=382
- last sample: 2026-09-27 07:57:12 pid=27152 pss=798.7 views=185

기준: 창 안 pid+20분 세션 · 워밍 25% 제외 · 10분 rolling min · stair span≥40 & retain≥0.7 · floor Δ +25 soft / +40 FAIL · views idle≤380 / ≥450 FAIL.

| start | pid | class | span | retain | n | late_views |
|---|---|---|---|---|---|---|
| 2026-09-26T16:56:32.000Z | 27152 | PARTIAL | 135.9 | 0.63 | 24 | 382 |

