# Content Tables (CSV)

대량 콘텐츠(전함/NPC/미션/맵) 추가용 CSV 테이블입니다.

## 사용법

1. 이 폴더의 CSV를 수정
2. 프로젝트 루트에서 실행:

```bash
npm run fix:content-csv-encoding
npm run build:content-tables
```

3. 생성 결과 확인:
   - `src/data/generated/csvShipTemplates.ts`
   - `src/data/generated/csvNpcCaptains.ts`
   - `src/data/generated/csvNpcCapitalShips.ts`
   - `src/data/generated/csvMissions.ts`
   - `src/data/generated/csvSystems.ts`

## 테이블 목록

1) 전함 스탯 테이블  
- `ship_stats.csv`

2) NPC AI 테이블  
- `npc_ai_captains.csv`  
  - 함장 기준 배치/전투/외교 컬럼: `operationalState`, `combatTeam`, `friendlyFactionIdsPipe`, `hostileFactionIdsPipe`, `basePlanetId`, `activityPlanetIdsPipe`, `baseSystemId`, `activitySystemIdsPipe`, `arcOrbitPresenceFill`
- `npc_ai_ships.csv` (전함 배치/전투값, `npcMode=general|combat`, 아크코어 궤도 수송: `arcTrafficDwellRadPerSec`, `arcTrafficPhaseDurationMul`, `arcTrafficPlanetDwellSecMin`/`Max`)
- `battle_stage_fleets.csv` (스테이지별 red/blue/orange 편대 구성)
- `weapon_list.csv` (무기 마스터; 전함은 weapon id 참조)  
  - **한글 컬럼명** 사용 가능(`이름`, `종류`, `대미지` … — `tools/content-tables/weapon-list-columns.mjs`가 빌드 시 영문 키로 정규화). `id` FK만 ASCII.  
  - **Excel에서 한글이 깨지면** `npm run fix:content-csv-encoding` 실행(UTF-8 BOM). BOM 없는 UTF-8 CSV는 Windows Excel에서 CP949로 열려 깨질 수 있음.

3) 미션 테이블  
- `missions.csv`  
- `mission_objectives.csv`  
- `mission_prerequisites.csv`  
- `mission_reward_items.csv`

4) 맵/행성 속성 테이블  
- `star_systems.csv`  
- `star_system_connections.csv`  
- `planets.csv` (`coreResource`,`corePopulation`,`coreDefense`,`coreTechnology`,`coreEnvironment` 포함)  
- `planet_trade_goods.csv`

5) 스킬 테이블
- `skills.csv`

## 규칙 (권장)

- 다중 관계는 별도 테이블 사용
  - 미션 선행: `mission_prerequisites.csv`
  - 미션 보상 아이템: `mission_reward_items.csv`
  - 성계 연결: `star_system_connections.csv`
  - 행성 거래품: `planet_trade_goods.csv`
- 레거시 호환: `*Pipe` 컬럼(`connectionsPipe`, `tradeGoodsPipe`, `prerequisiteIdsPipe`, `rewardItemsPipe`)도 여전히 읽음
- null 허용 칼럼은 빈 값 또는 `null` 사용
- CSV 인코딩은 UTF-8 권장
- Excel 직접 열기 호환을 위해 CSV는 UTF-8 BOM 권장 (`npm run fix:content-csv-encoding`)
