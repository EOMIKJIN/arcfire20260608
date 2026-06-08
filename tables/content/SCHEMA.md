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
- `portraitImageAssetKey` string (선택) — 전함 실사 이미지 경로(예: 플레이어 `assets/images/ship/ship_001.png`, NPC 임시 `assets/images/ship/npc_test_ship_001.png`). 번들에 포함하려면 `src/game/npcCapitalShipPortraitAssets.ts` 정적 맵에 동일 키를 등록한다.
- `topViewImageAssetKey` string (선택) — 전투 탑뷰 스프라이트(예: `assets/images/ship/ship_top_001.png`). `build-content-from-csv`·궤도 전투 렌더가 우선 참조한다.
- `tradePortListed` bool — `true`이면 `item_defs`에 `capital_ship_<id>`가 병합되고, 무역소(`hasTradePort`) 진열에 포함된다. 플레이어 기함(`Player_` id) 등 무역 비노출은 `false`.
- `strStat`, `dexStat`, `sizeClass`, `expReward` — 전투 스탯·보상
- `combatLevel`, `proficiencyMultiplier` — NPC 전투 등급·숙련 배율(`ShipPerformanceCalculator` 입력)
- `size` int (2~5) — 전투 탑뷰 스케일 등급(`combatVisualSize`, 3=100%)
- 수송선 다음 행성: 월드에 등록된 **전 행성**에서 균등 선택(아크코어 `AiNpcSubCore`)

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
- `id` string PK
- `title,description,type` string
- `rewardCredits,rewardExp,rewardSkillPointBonus,dc` int
- `nextMissionId` string|null
- 레거시 호환 컬럼: `rewardItemsPipe`, `prerequisiteIdsPipe`

### `mission_objectives.csv`
- `missionId` FK -> missions.id
- `id` objective PK (mission 내부 unique)
- `description,type,targetId` string
- `quantity` int nullable

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
