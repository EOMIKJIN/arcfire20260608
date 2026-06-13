# 전함 분류 표준 (Capital Ship Classification) v3.1

> **문서 상태**: 🚀 v3.1 Master Spec 호환 검수 완료 (Table-First 원칙 준수)
> **변경 요약**: PvP 암시 식별자(`npc_mock_pvp_ship`)를 AI 가상 전함(`npc_mock_ai_ship`)으로 명칭 순화.

## 인지 우선순위 (1순위)
플레이어 및 AI 적 전함을 아래 순서로 **즉시 인지**할 수 있어야 한다.
`Tier N · 함급(한·영) · Loadout형 · 전투거리 · 역할 한 줄`
예: `Tier 2 · 구축함 (Destroyer) · Fighter형 · 중단거리 · 호위함을 사냥하는 포식자. 강력한 전면 화력 집중.`

| 순위 | 축 | 정본 CSV |
|------|-----|----------|
| 1 | Tier + 함급 | `capital_ship_class_master.csv` + `capital_ship_hull_tier_mapping.csv` |
| 2 | Loadout (전투 프로필) | `capital_ship_loadout_profile.csv` |
| 3 | 역할 문구 | class master `roleSummaryKo` (instance `roleOverrideKo`로 덮어쓰기) |

## 함급 체계
| Tier | 함급 (KO / EN) |
|------|----------------|
| 1 | 코벳, 호위함 |
| 2 | 구축함, 순양함 |
| 3 | 전함, 항공모함 |
| 4 | 드레드노트, 슈퍼캐피털, 아펙스 (엔드게임) |

## Loadout vs capitalShipArchetype
- UI·인지: **함급이 먼저**, Loadout(Fighter형/Ranger형)은 2축.
- 전투 수학: STAGE 3 로컬 물리 시뮬레이션을 위한 `capitalShipArchetype` → `ShipPerformanceCalculator`.

## 함선별 확정 vs 폴백 (Table-First)
1. `capital_ship_instance_class.csv` — 플레이어 24척·특수함 (최우선)
2. `capital_ship_trade_listing_policy` + hull tier mapping — 무역소 catalog 함선
3. `npc_wave_invader_tN` → `capital_ship_wave_tier_class.csv`
4. `combat.expReward` → `capital_ship_combat_level_class.csv` (zone 적 NPC 폴백)
