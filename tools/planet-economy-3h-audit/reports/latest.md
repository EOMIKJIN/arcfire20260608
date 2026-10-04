# 행성 경제 3h 전수 검사

Generated: 2026-10-04T15:02:41.537Z
KST day: 2026-10-05
**Overall:** WARN

## 시스템 동작 (헤드리스 convoy + CSV 유지비 예측)

- Convoy 일일: ran=true ok=17 fail=2 demandCovered=18
- 수송선단 금고: 545,582 cr
- RED 금고 Δ(수수료·헤드리스): 128,162 cr
- Convoy 실패: nightfall_citadel, core_prime
- 유지비 예측(점유 시드): RED 일합 8000 cr · BLUE 일합 5600 cr · 점유 22행성
- 교역 행성 수익 발생: 19/19

## 행성 재정 KPI

- **Overall (fiscal):** WARN
- max fee/upkeep: **3.07×** · min: 0.08× · Gini: 0.307
- WARN 0 · FAIL 0 · deficit 5
- policy: warn≥20× fail≥50×

## 행성별 (교역 17)

| 행성 | 점유시드 | 유지비(일) | 팩션수수료 | fee/upkeep | 상태 |
|------|---------|-----------|----------|-----------|------|
| arcadia_prime | BLUE | 901 | 566 | 0.63× | deficit |
| solar_station | BLUE | 1004 | 1136 | 1.13× | OK |
| minerva_deep | BLUE | 1460 | 3672 | 2.52× | OK |
| eden_city | BLUE | 942 | 793 | 0.84× | deficit |
| iron_remnant | BLUE | 1583 | 4353 | 2.75× | OK |
| draco_haven | BLUE | 931 | 733 | 0.79× | deficit |
| omega_hub | RED | 1332 | 2956 | 2.22× | OK |
| helios_core | NEUTRAL | 1570 | 4278 | 2.72× | OK |
| sirius_border | RED | 1023 | 1243 | 1.22× | OK |
| perseus_memorial | RED | 1152 | 1958 | 1.7× | OK |
| crimson_base | RED | 1556 | 4202 | 2.7× | OK |
| dark_haven | RED | 1129 | 1829 | 1.62× | OK |
| blood_station | RED | 811 | 63 | 0.08× | deficit |
| shadow_market | NEUTRAL | 1787 | 5486 | 3.07× | OK |
| nightfall_citadel | RED | 1078 | 1545 | 1.43× | OK |
| core_prime | RED | 1491 | 3840 | 2.58× | OK |
| genesis_origin | NEUTRAL | 1115 | 1752 | 1.57× | OK |
| synth_002_p | — | 818 | 105 | 0.13× | deficit |
| synth_003_p | — | 1474 | 3746 | 2.54× | OK |

## 3h 델타

- 이전: 2026-10-03T15:02:39.622Z
- 팩션 수수료 합계 Δ: -2202 cr

## 실기기 행성정보 팝업

- `금일 팩션 몫` = AsyncStorage `arcfire_planet_trade_fee_ledger_v1`
- 즉시: 플레이어/수송선 거래 · 12:00 KST: 일일 convoy+유지비 배치
