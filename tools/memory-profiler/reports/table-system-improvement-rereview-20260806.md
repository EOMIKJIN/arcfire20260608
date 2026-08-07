# 테이블 효율 개선 — 정밀 재검수 (2026-08-06)

대상: Table-First 효율 개선 패치(ships / ItemCatalog 부트 / tradePort / SCHEMA / SKU audit / resolveSystemById)

## 게이트

| 검사 | 결과 |
|------|------|
| `tsc --noEmit -p tsconfig.client.json` | PASS |
| `audit-item-defs-sku-merge` | PASS (weapons=83, ships=22) |

## 재검수 판정

| 등급 | 항목 | 판정 | 조치 |
|------|------|------|------|
| P1 | `normalizeLoadedPlayerShip` — 미지 templateId 시 equipCapacity=0 덮어쓰기 | **결함 확인** | **수정함** (starter 폴백 + created.equipCapacity 유지) |
| P1 | `freighter` → `Player_freighter`(생존포드) 별칭 | **의미 불일치** | **수정함** (레거시 화물선 동결 스냅샷, CSV 생존포드는 `Player_freighter` 키만) |
| P2 | `data/ships` → `game/capitalWeaponRowLookup` 계층 역전 | 리스크 | **수정함** (`csvWeapons` 직접 import) |
| P2 | Full 부트 `getItemDef(고정id)` warm | 약한 warm | **수정함** (`listItemDefIds().length`) |
| P2 | EN 표시명 구버전(Arcfire Mk.I) | 드리프트 | **수정함** (CSV KO 대응 EN) |
| OK | `starter_fighter` → `Player_npc_red_fleet_1` | 정합 | default hull과 일치 · 신규 HP 560(CSV) |
| OK | ItemCatalog 부트 제거 | 정합 | combat/trade는 weapon_list·item_defs |
| OK | worldStore loaded 후 tradePort resync | 정합 | AiEconomy deferred와 이중 호출 가능하나 idempotent |
| OK | `resolveSystemById` | 정합 | facade 추가 · 기존 STAR/GALAXY 직접 경로 잔존(의도적 점진) |
| OK | SKU merge 감사·SCHEMA | 정합 | 편집 CSV에 merge SKU 없음 |
| OK | equip_slots CSV | 정합 | Player_ 시드 존재 · 전량 재시드 불필요 |
| NOTE | 신규 계정 스타터 스탯 | 밸런스 변화 | CSV 정본 채택(기존 세이브 HP 유지) |
| NOTE | `weaponCatalogSeed` 모듈 잔존 | dead path | 부트 미호출 · 어댑터 2순위만 · 삭제 보류(안정) |
| NOTE | `resolveSystemById` 미소비 | 신규 API | 점진 치환 대상 |

## 잔여(의도적 비수정)

1. STAR_SYSTEMS vs GALAXY 전면 단일화 — 회귀면 넓어 점진 facade만
2. ItemCatalog/weaponCatalogSeed 파일 삭제 — 테스트·어댑터 폴백용 잔존
3. NPC 전함 장비슬롯 전량 시드 — 밸런스 영향 · 현 CSV Player_ 시드 유지

## 최종

**재검수 후 결함 3건 핫픽스 완료 · 게이트 PASS · 완료 선언 가능(앱 `r` 리로드).**
