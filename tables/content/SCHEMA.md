# CSV Table Schema

## 1) 전함 스탯 (`ship_stats.csv`)
- `id` string PK
- `name` string
- `description` string
- `maxHp,maxShield,armor,speed,cargoCapacity,weaponSlots,equipSlots` int
- `baseWeaponId,baseWeaponName,baseWeaponType` string
- `baseWeaponAttackBonus,baseWeaponRange,baseWeaponDiceCount,baseWeaponDiceSides,baseWeaponDiceBonus` int
- `pixelSpriteKey` string

## 2) NPC AI
### `npc_ai_captains.csv`
- 플레이어 기함 전용 함장 예: `Player_pilot` — 행성/성계 매칭 필드를 비워 두면 NPC 궤도 슬롯에 오르지 않는다.
- `id` string PK
- `displayName,rank,factionId,bioShort` string
- `aiAggression` enum: `passive|cautious|standard|aggressive|berserk`
- `aiRole` enum: `patrol|garrison|fleet_leader|hunter|escort|merchant_guard`
- `operationalState` enum: `combat|general|neutral|hostile` (함장 운용 상태)
- `combatTeam` enum: `red|blue|orange|none` (전투 상태일 때 팀; `orange` = 자유교전/FFA)
- `friendlyFactionIdsPipe` string (`|` 구분 우호 팩션 목록)
- `hostileFactionIdsPipe` string (`|` 구분 적대 팩션 목록)
- `basePlanetId` string|null (함장 거점 행성 id, 궤도 배치 우선 기준)
- `activityPlanetIdsPipe` string (`|` 구분 활동 행성 목록)
- `baseSystemId` string|null (함장 거점 성계 id)
- `activitySystemIdsPipe` string (`|` 구분 활동 성계 목록)
- 메인스테이지 궤도 근접함: `operationalState`가 `general|neutral|hostile` 이고, 위 **행성** 또는 **성계** 필드가 현재 착륙 행성·그 성계와 맞으면 `assignedShipId`가 가리키는 `npc_ai_ships.csv` 전함이 궤도에 올라간다.
- `initialLevel,initialExp` int (함장 진행도 초기값)
- `expCurveBase,expCurveLinear,expCurveQuadratic` int (레벨업 요구 경험치 곡선 파라미터)
- `arcOrbitPresenceFill` bool — `true`이면 (1) 행성·성계 매칭 없을 때 `resolvePlanetNearbyPresence`가 등록 전함·함장으로 슬롯을 채우고, (2) 아크코어 궤도 수송 시뮬(`listArcNpcTrafficRowsFromTables`)에도 **동일 함·함장**만 오른다.
- `mainStageTalkEnabled` bool — 메인스테이지에서 조우 시 대화 버튼 등 인터랙션 UI 활성 후보 여부
- `mainStageMissionTriggerId` string|null — 대화 시작과 함께 발동할 미션 트리거 id(미설정 가능)
- `mainStageEventTriggerId` string|null — 대화 시작과 함께 발동할 이벤트 트리거 id(미설정 가능)

### `npc_ai_ships.csv`
- `npcMode` enum: `general|combat` (`general`은 행성 INFO 궤도 표시 전용, 전투 미진입)
- `id` string PK — 플레이어 소유 기함은 **`Player_` 접두사**(예: `Player_npc_red_fleet_1`)로 두고, 참조할 NPC 전함과 동일 컬럼을 맞춘다. `listNpcCapitalShips*` 등 NPC 전용 목록에서는 자동 제외된다.
- `name,hullTypeId,captainId,homeSystemId` string
- `maxHp,maxShield,armor,attackBonus,damageDiceCount,damageDiceSides,damageDiceBonus` int
- `maxMoveSpeedPxPerMs,accelPxPerMs2,maxTurnRateRadPerMs,turnAccelRadPerMs2,detectRangeScale` number
- `laserCooldownJitterMinMs,laserCooldownJitterMaxMs` number
- `missileCooldownJitterMinMs,missileCooldownJitterMaxMs` number
- `salvoStepMinMs,salvoStepMaxMs` number
- `engageStartDelayMinMs,engageStartDelayMaxMs` number
- `laserWeaponId,missileWeaponId` FK -> weapon_list.id
- `infoLineSuffix` string (선택)
- `arcTrafficDwellRadPerSec` number — 아크코어 행성 궤도 수송선 체류 각속도(rad/s)
- `arcTrafficPhaseDurationMul` number — 접근·체류·이탈 위상 지속시간 랜덤에 곱함(예: 2 ≈ 2배 길이)
- `arcTrafficPlanetDwellSecMin`, `arcTrafficPlanetDwellSecMax` number — 행성 **체류(dwell)** 지속(초) 균등 샘플 구간; 엔진 상한 **600초(10분)**
- `portraitImageAssetKey` string (선택) — 전함 실사 이미지 경로(레거시·조선소 등). 번들: `src/game/npcCapitalShipPortraitAssets.ts`.
- `tradePortPortraitUniqueId` int (선택) — **무역소 BUY 구매정보창** 전용. 고유숫자 N → `assets/images/ship/trade_ship_{N}.png` (`trade_` 접두사 필수). N은 전함 영구 식별 번호(예: **100** = 기본전함 Mk.I). 번들: `src/game/tradePortShipPortraitAssets.ts`. 미설정 시 코드 레지스트리·`portraitImageAssetKey` 순 폴백. 기존 `ship_*` 네이밍은 추후 이전.
- `topViewImageAssetKey` string (선택) — 전투 탑뷰 스프라이트(예: `assets/images/ship/ship_top_001.png`). `build-content-from-csv`·궤도 전투 렌더가 우선 참조한다.
- `tradePortListed` bool — `true`이면 `item_defs`에 `capital_ship_<id>`가 병합되고, 무역소(`hasTradePort`) 진열에 포함된다. 플레이어 기함(`Player_` id) 등 무역 비노출은 `false`.
- `strStat`, `dexStat`, `sizeClass`, `expReward` — 전투 스탯·보상
- `capitalShipArchetype` enum: `fighter|ranger|survival|special|neutral` — D&D3 스타일 구분(격투 STR·중장갑 vs 정찰 DEX·경장갑). 플레이어 전함 필수; NPC 기본 `neutral`
- `combatLevel`, `proficiencyMultiplier` — NPC 전투 등급·숙련 배율(`ShipPerformanceCalculator` 입력)
- `size` int (2~5) — 전투 탑뷰 스케일 등급(`combatVisualSize`, 3=100%)
- 수송선 다음 행성: 월드에 등록된 **전 행성**에서 균등 선택(아크코어 `AiNpcSubCore`)

### `npc_capital_ship_equip_slots.csv`
- `id` string PK — `{npcShipId}__{slotId}` 권장
- `npcShipId` FK → `npc_ai_ships.csv`.id
- `slotOrder` int 1~4 — **전함당 최대 4슬롯** (무기 슬롯 제외)
- `slotId` enum — 플레이어와 동일 slotId (`ARMOR`, `ENGINE`, `SYSTEM`, `EX_01` 등; `WEAPON_*` 제외 권장)
- `itemDefId` FK → `item_defs.csv` (`type: ship_equipment`) — **비워도 됨**(슬롯만 예약)
- `notesKo` string (선택)
- 장착된 행만 `resolveNpcCapitalShipEquipSlots` → 전투 `applyShipEquipmentToShipPerformance`
- 생성: `node tools/gen-npc-capital-ship-equip-slots.mjs` (기본 4슬롯·미장착 시드)

### `weapon_list.csv` (범용 무기 단일 정본)

아크파이어 **전투 무기 전체**의 단일 카탈로그. NPC(`npc_ai_ships.laserWeaponId`/`missileWeaponId`), 플레이어 장착, 아이템(`weapon_item_*`)은 모두 여기 FK. 빌드 시 다른 ID로 치환하지 않는다.

- `id` string PK
- `name` string
- `kind` enum: `laser|missile`
- `damage` number
- `cooldownMs` number
- `rangePx` number
- `salvoCount` number (미사일 기준: 표준 1, 연사 3)
- `unguidedPerSalvo` number (살보 내 비유도 탄 수)
- `functionKindId`, `weaponClassKo`, `featureDescription`, `targeting` — `src/game/weaponCombat/weaponCombatProfile.ts` 연출·판정 분기용

임시 ID(이후 범용 행으로 이관): `w_laser_wave`, `w_missile_wave`, 구 세트 `w_missile_standard_01` / `w_missile_guided_*` 등. 신규는 `w_*_arc_*` 카탈로그 우선.

## 3) 미션
### `missions.csv`
- `id` string PK (`mission_*` 스토리 체인 · `sandbox_*` 행성 퀘스트 · **`tq_*` 선술집 인스턴스 템플릿**)
- `title,description,type` string (`type`은 메타; 런타임은 `mission_objectives` 조합이 근거)
- `offerCaptainId` string|null — 인스턴스 의뢰 NPC (`npc_ai_captains.id`)
- `offerPlanetId` string|null — 선술집 게시 행성 (`planets.id`); **`tq_*`는 비움**(행성별 ArcCore clone)
- `levelRequired` int — 수락 최소 파일럿 레벨
- `rewardCredits,rewardExp,rewardSkillPointBonus,dc` int — **`tq_*`의 CR/EXP = NORMAL 등급 기준선**; 런타임 `tavernInstanceMissionDifficulty.ts`가 측정 등급(EASY~EXPERT)에 따라 배율 적용
- `dc` int — 템플릿 난이도 앵커(인스턴스 점수 산출에 사용; 구 스토리 체크용 잔존)
- `nextMissionId` string|null — 스토리 체인만 사용
- `clearDialogSceneId` string|null — 클리어 인게임 대화 scene id (선택)
- `title_en`, `description_en` string (i18n)
- 레거시 호환: `rewardItemsPipe`, `prerequisiteIdsPipe`

**선술집 ArcCore 인스턴스 (`tq_*` → `arc_inst_*`)**
- 생성: `arcCoreInstanceMissionGenerator.ts` — 코어 개방·선술집 행성당 listed 10건 · 40/40/20(배달/전투·현상금/기타)
- 목표 패치: `__neighbor_system__` / `__discovery_planet__` — BFS 1~3홉 가변 배달 거리(`arcCoreInstanceMissionPlanetContext.ts`)
- **난이도 등급**: 배송 홉·구역(safe/neutral/pvp) transit 위험·전투 적 템플릿·dc·levelRequired → EASY/NORMAL/HARD/EXPERT
- **보상**: CSV NORMAL 기준 × 등급 배율(EASY 0.8 · NORMAL 1.0 · HARD 1.3 · EXPERT 1.65) — `arcCoreInstanceMissionResolver.ts`

### `mission_objectives.csv`
- `missionId` FK -> missions.id
- `id` objective PK (mission 내부 unique)
- `description,type,targetId` string
- `quantity` int nullable
- `description_en` string (i18n)
- **타입 계약**: `reach_planet` · `reach_system` · `defeat_enemy` · `buy_goods` · `deliver_cargo`(v1 미연동)
- **카테고리 파생**: `defeat_enemy`만 → 전투 · `buy_goods`+`reach_system` → 배달 · `reach_*` → 이동

### `mission_combat_captains.csv`
- `id` string PK
- `enemyTemplateId` FK -> `enemy_templates.id` (퀘스트 태그)
- `planetId` string|null — 행성별 우선 매핑 (비우면 템플릿 default)
- `captainId` FK -> `npc_ai_captains.id`
- `priority` int — 동일 템플릿·행성 내 우선순위
- 런타임: `resolveMissionCombatCaptain()` → transit 전투 적 함장

### `enemy_templates.csv`
- `id` string PK (`pirate_fighter`, `pirate_cruiser`, `bounty_hunter` …)
- 미션 `defeat_enemy.targetId`와 일치해야 승리 시 objective 완료
- 전투 스탯 정본은 `npc_ai_ships.csv` (템플릿은 퀘스트 태그·즉시 보상용)

### `mission_prerequisites.csv` (권장)
- `missionId` FK -> missions.id
- `prerequisiteMissionId` FK -> missions.id

### `mission_reward_items.csv` (권장)
- `missionId` FK -> missions.id
- `itemId` string

## 4) 맵/행성
### `star_systems.csv`
- `id` string PK
- `name,zone,description` string
- `posX,posY` number
- `enemyLevel` int
- 레거시 호환 컬럼: `connectionsPipe`

### `star_system_connections.csv` (권장)
- `systemId` FK -> star_systems.id
- `connectedSystemId` FK -> star_systems.id

### `planets.csv`
- `systemId` FK -> star_systems.id
- `id` string PK
- `name,description,factionId` string
- `hasTradePort,hasShipyard,hasTavern` boolean
- `backdropImageAssetKey` string nullable (행성 배경 이미지 에셋 키; 미할당 시 Skia 성운만 표시)
- 핵심 대표 지표(0..100): `coreResource,corePopulation,coreDefense,coreTechnology,coreEnvironment`
- 행성 중심 디지털 게이지(`R,P,D,T,E`)는 위 5개를 20% 단위(5칸)로 표시
- 레거시 호환 컬럼: `tradeGoodsPipe`

### `planet_trade_goods.csv` (권장)
- `planetId` FK -> planets.id
- `goodId` string

## 5) 스킬
### `skills.csv`
- `id` string PK
- `name,description` string
- `category` enum: `combat|navigation|trade|fleet`
- `tier,levelRequired` int
- `prerequisiteIdsPipe` string (`|` 구분 선행 스킬 id 목록)
- `effectType` enum: `passive|active`
- `effectStat` string nullable (passive 권장)
- `effectValue` number nullable (passive 권장)
- `effectDescription` string
- `icon` string

## 8) 아이템 정의 (`item_defs.csv`) — 행성 소유권 (2026-07-02~)

- **단일 정본**: `tables/content/item_defs.csv` only — `id=ownership_{planetId}` · `type=planet_ownership` · `tradeable=true`
- A(21): 수동 행 · synth(79): `synth_system_colonization.csv` → `sync-synth-ownership-into-item-defs.mjs` append
- **금지**: 별도 ownership CSV · 빌드 merge-only · 런타임 lazy ItemDef
- 무역 진열: item_defs 등록 ≠ 진열 — synth는 unlock+phase≥1 eligibility · 카탈로그 resync는 hydrate/unlock 이벤트만
- 감사: `npx tsx tools/debug/audit-planet-ownership-item-defs.ts`
