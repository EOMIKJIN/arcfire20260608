# 행성 정보창 포트레이트 — 코어 21장 (2026-09-16)

`pip_001~003` 순환은 **폐기**. 코어 21행성은 전용 480×268 JPEG.

```text
[pss-pre-dev] hot_path=없음 alloc=정적 require 21+2 cache=PLANET_INFO_PORTRAIT_BY_ASSET_KEY
[pss-pre-dev] stage=정보창 Image contain · 틱/Skia 없음 risk=없음
[pss-pre-dev] verdict=PASS
```

## 규격

- 480×268 JPEG q72 · 정보창 ~360dp에서 무리 없는 최소 용량
- 시네마틱 실사 · 16:9 · 둥근 사각 검정 모서리 · 글자 없음
- require 맵: `src/game/planetInfoPortraitAssets.ts`
- 정본 키: `tables/content/planets.csv` `infoPanelPortraitAssetKey`

## 코어 21

| 행성 id | 파일 |
|---|---|
| arcadia_prime | pip_core_arcadia_prime.jpg |
| solar_station | pip_core_solar_station.jpg |
| minerva_deep | pip_core_minerva_deep.jpg |
| vega_base | pip_core_vega_base.jpg |
| eden_city | pip_core_eden_city.jpg |
| iron_remnant | pip_core_iron_remnant.jpg |
| draco_haven | pip_core_draco_haven.jpg |
| omega_hub | pip_core_omega_hub.jpg |
| helios_core | pip_core_helios_core.jpg |
| sirius_border | pip_core_sirius_border.jpg |
| titan_ruins | pip_core_titan_ruins.jpg |
| perseus_memorial | pip_core_perseus_memorial.jpg |
| crimson_base | pip_core_crimson_base.jpg |
| dark_haven | pip_core_dark_haven.jpg |
| blood_station | pip_core_blood_station.jpg |
| shadow_market | pip_core_shadow_market.jpg |
| abyss_gate | pip_core_abyss_gate.jpg |
| nightfall_citadel | pip_core_nightfall_citadel.jpg |
| core_prime | pip_core_core_prime.jpg |
| eternal_throne | pip_core_eternal_throne.jpg |
| genesis_origin | pip_core_genesis_origin.jpg |

코어 합 ≈ 340KB (구 pip 3장 PNG ≈ 930KB 대비 감소).

## 미발견(synth) — 차후

| 키 | 상태 |
|---|---|
| `pip_synth_fallback.jpg` | `_synth_default` · synth_002 임시 1장 |
| `pip_synth_052.jpg` | 아우라 국경 시험만 |
| 그 외 synth | 전용 생성·활성화 시스템 **미착수** |
