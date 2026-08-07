# Table-First × 런타임 전수 감사 (2026-08-06)

코드 수정 없음 · 조사 전용. Canvas: `canvases/table-system-full-audit-20260806.canvas.tsx`  
헤더 스캔: `tools/memory-profiler/reports/_tables-header-scan-20260806.tsv`

## 인벤토리

| 폴더 | CSV | 비고 |
|------|-----|------|
| content | 33 | 콘텐츠 정본 |
| balance | 110 | 정책·밸런스 → generated |
| balance/_audit | 2 | 런타임 비소비 |
| **합계** | **145** | |

빌드: `build:content-tables` · `build:balance-tables` · postinstall balance gen.

## 중점 5축 SoT

| 축 | 편집 CSV | 런타임 | Persist/DB |
|----|----------|--------|------------|
| 무기 | `weapon_list.csv` | `CAPITAL_WEAPON_LIST_FROM_CSV` | 장착은 `player.ship.equipSlots` |
| 상점 아이템 | `item_defs.csv` + **빌드 merge** (weapon/capital) | `ITEM_DEFS_FROM_CSV` / tradePortDb | 진열=메모리; ownership/Firebase 단발 |
| 전함 | `npc_ai_ships.csv` + `capital_ship_*` | `npcFleetRegistry` · classification 4단 | hangar=`npcCapitalShipId` |
| 함장 | `npc_ai_captains.csv` | fleet + presence + governor | `NpcCaptainProgressStore` |
| 행성 | `planets.csv` (21) | STAR + GALAXY + coreRuntime | `arcfire_planet_core_runtime_v1` |

## P0

1. **`src/data/ships.ts` vs `SHIP_TEMPLATES_FROM_CSV`** — playerStore가 하드코드 템플릿·`pulse_laser_i` 사용.
2. **`ItemCatalogRegistry` / `weaponCatalogSeed`** — Full 부트에서 로드되나 전투 정본과 분리된 레거시.

## P1

3. 상점 weapon/capital SKU는 `item_defs.csv`에 없고 build-content 합성만.
4. 행성 그래프 `STAR_SYSTEMS_FROM_CSV` ↔ `GALAXY_SYSTEMS` 이중.
5. `planetTradePortDb` 비영속 — sync 타이밍 리스크.
6. `npc_capital_ship_equip_slots.csv` ≈1행.

## P2

7. SCHEMA.md 드리프트 (`ship_stats`/`star_systems` 문서만 존재).
8. orphan/디자인 CSV · `mission_reward_items` 0행 · dead generated 소비.
9. `getItemDef` import 파편화 (`itemRegistry` / `goods`).

## 효율 개선 적용 (2026-08-06 · 안정성 순차)

1. **DONE** `ships.ts` → `SHIP_TEMPLATES_FROM_CSV` + weapon_list 별칭 · ItemCatalog 부트 제거  
2. **DONE** `audit-item-defs-sku-merge.mjs` + SCHEMA 현행화  
3. **DONE** `resolveSystemById` · `worldStore.loadLocalWorld` → tradePort resync  
4. **DONE** equip_slots CSV 확인(시드 존재) · `getItemDef` → itemRegistry · orphan `01_*`는 빌드 스킵 유지  

