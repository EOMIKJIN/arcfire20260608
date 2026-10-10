# 행성 경제 3h 전수 검사

Generated: 2026-10-09T15:03:29.375Z
KST day: 2026-10-10
**Overall:** WARN

## 시스템 동작 (헤드리스 convoy + CSV 유지비 예측)

- Convoy 일일: ran=true ok=17 fail=2 demandCovered=18
- 수송선단 금고: 441,920 cr
- RED 금고 Δ(수수료·헤드리스): 88,392 cr
- Convoy 실패: nightfall_citadel, core_prime
- 유지비 예측(점유 시드): RED 일합 8000 cr · BLUE 일합 5600 cr · 점유 22행성
- 교역 행성 수익 발생: 19/19

## 행성 재정 KPI

- **Overall (fiscal):** WARN
- max fee/upkeep: **2.99×** · min: 0.13× · Gini: 0.251
- WARN 0 · FAIL 0 · deficit 3
- policy: warn≥20× fail≥50×

## 행성별 (교역 17)

| 행성 | 점유시드 | 유지비(일) | 팩션수수료 | fee/upkeep | 상태 |
|------|---------|-----------|----------|-----------|------|
| arcadia_prime | BLUE | 901 | 566 | 0.63× | deficit |
| solar_station | BLUE | 1004 | 1136 | 1.13× | OK |
| minerva_deep | BLUE | 1460 | 3672 | 2.52× | OK |
| eden_city | BLUE | 1077 | 1539 | 1.43× | OK |
| iron_remnant | BLUE | 1587 | 4374 | 2.76× | OK |
| draco_haven | BLUE | 931 | 733 | 0.79× | deficit |
| omega_hub | RED | 1219 | 2329 | 1.91× | OK |
| helios_core | NEUTRAL | 1570 | 4278 | 2.72× | OK |
| sirius_border | RED | 1037 | 1318 | 1.27× | OK |
| perseus_memorial | RED | 1152 | 1958 | 1.7× | OK |
| crimson_base | RED | 1556 | 4202 | 2.7× | OK |
| dark_haven | RED | 1206 | 2260 | 1.87× | OK |
| blood_station | RED | 1520 | 4004 | 2.63× | OK |
| shadow_market | NEUTRAL | 1732 | 5183 | 2.99× | OK |
| nightfall_citadel | RED | 1078 | 1545 | 1.43× | OK |
| core_prime | RED | 1075 | 1532 | 1.43× | OK |
| genesis_origin | NEUTRAL | 1115 | 1752 | 1.57× | OK |
| synth_002_p | — | 818 | 105 | 0.13× | deficit |
| synth_003_p | — | 1474 | 3746 | 2.54× | OK |

## 3h 델타

- 이전: 2026-10-08T15:04:19.200Z
- 팩션 수수료 합계 Δ: -1295 cr

## 실기기 행성정보 팝업

- `금일 팩션 몫` = AsyncStorage `arcfire_planet_trade_fee_ledger_v1`
- 즉시: 플레이어/수송선 거래 · 12:00 KST: 일일 convoy+유지비 배치
