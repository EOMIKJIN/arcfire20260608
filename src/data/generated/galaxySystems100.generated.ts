// AUTO-GENERATED — tools/galaxy-graph/generate-galaxy-systems.ts 로 재생성.
// 은하 그래프(성계 좌표·연결) 프리컴파일 — buildGalaxySystems100()은 순수·결정적 함수라
// 매 부팅마다 런타임 재계산이 불필요함(760개 O(n²)x200 좌표 완화 비용 제거).
// STAR_SYSTEMS(src/data/systems)나 생성 알고리즘이 바뀌면 위 명령으로 재생성할 것.
import type { StarSystem } from '../../types';

export const GALAXY_SYSTEMS_PRECOMPUTED: Record<string, StarSystem> = {
  "arcadia": {
    "id": "arcadia",
    "name": "아르카디아",
    "nameEn": "Arcadia",
    "position": {
      "x": 0.22,
      "y": 0.72
    },
    "zone": "safe",
    "planets": [
      {
        "id": "arcadia_prime",
        "systemId": "arcadia",
        "name": "아르카디아 프라임",
        "nameEn": "Arcadia Prime",
        "description": "[국가: 스텔리움 연합] 광활한 초원이 펼쳐진 평화로운 행성.",
        "descriptionEn": "[Nation: Stellium Alliance] A peaceful planet of vast grasslands.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "federation",
        "coreResource": 50,
        "corePopulation": 54,
        "coreDefense": 42,
        "coreTechnology": 44,
        "coreEnvironment": 58,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": "assets/images/planet/pip_001.png",
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "solar_port",
      "vega_outpost",
      "synth_073"
    ],
    "enemyLevel": 1,
    "description": "아크파이어 은하의 관문. 신규 파일럿들의 시작점.",
    "descriptionEn": "Gateway of the Arcfire galaxy. Starting point for new pilots."
  },
  "solar_port": {
    "id": "solar_port",
    "name": "솔라 항구",
    "nameEn": "Solar Port",
    "position": {
      "x": 0.35,
      "y": 0.6
    },
    "zone": "safe",
    "planets": [
      {
        "id": "solar_station",
        "systemId": "solar_port",
        "name": "솔라 항구 스테이션",
        "nameEn": "Solar Port Station",
        "description": "[국가: 스텔리움 연합] 거대한 우주 정거장이 행성을 대신한다.",
        "descriptionEn": "[Nation: Stellium Alliance] A massive space station in place of a planet.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "federation",
        "coreResource": 50,
        "corePopulation": 56,
        "coreDefense": 44,
        "coreTechnology": 50,
        "coreEnvironment": 46,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "new_eden",
      "arcadia",
      "minerva"
    ],
    "enemyLevel": 2,
    "description": "은하 최대의 무역 허브. 항상 북적이는 항구 도시.",
    "descriptionEn": "The galaxy's largest trade hub. A bustling port city."
  },
  "minerva": {
    "id": "minerva",
    "name": "미네르바",
    "nameEn": "Minerva",
    "position": {
      "x": 0.2,
      "y": 0.45
    },
    "zone": "safe",
    "planets": [
      {
        "id": "minerva_deep",
        "systemId": "minerva",
        "name": "미네르바 딥",
        "nameEn": "Minerva Deep",
        "description": "[국가: 스텔리움 연합] 지하 광산이 행성 전체를 뒤덮고 있다.",
        "descriptionEn": "[Nation: Stellium Alliance] Underground mines cover the entire planet.",
        "hasTradePort": true,
        "hasShipyard": false,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "miners_guild",
        "coreResource": 52,
        "corePopulation": 44,
        "coreDefense": 48,
        "coreTechnology": 46,
        "coreEnvironment": 38,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "iron_cross",
      "solar_port",
      "synth_002"
    ],
    "enemyLevel": 3,
    "description": "광업의 중심지. 풍부한 광물 자원으로 유명.",
    "descriptionEn": "Mining center. Famous for rich mineral resources."
  },
  "vega_outpost": {
    "id": "vega_outpost",
    "name": "베가 전초기지",
    "nameEn": "Vega Outpost",
    "position": {
      "x": 0.42,
      "y": 0.78
    },
    "zone": "safe",
    "planets": [
      {
        "id": "vega_base",
        "systemId": "vega_outpost",
        "name": "베가 전초기지 베이스",
        "nameEn": "Vega Outpost Base",
        "description": "[국가: 스텔리움 연합] 군사 기지를 중심으로 형성된 도시.",
        "descriptionEn": "[Nation: Stellium Alliance] A city built around a military base.",
        "hasTradePort": false,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "federation_military",
        "coreResource": 36,
        "corePopulation": 46,
        "coreDefense": 55,
        "coreTechnology": 48,
        "coreEnvironment": 42,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "new_eden",
      "draco_nebula",
      "arcadia"
    ],
    "enemyLevel": 3,
    "description": "연방의 군사 전초기지. 훈련된 파일럿들이 모인다.",
    "descriptionEn": "Federation military outpost. Trained pilots gather here."
  },
  "new_eden": {
    "id": "new_eden",
    "name": "뉴에덴",
    "nameEn": "New Eden",
    "position": {
      "x": 0.52,
      "y": 0.62
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "eden_city",
        "systemId": "new_eden",
        "name": "뉴에덴 프라임",
        "nameEn": "New Eden Prime",
        "description": "[국가: 스텔리움 연합] 수도 행성. 연합 의회와 대규모 무역 허브.",
        "descriptionEn": "[Nation: Stellium Alliance] Capital planet. Alliance parliament and major trade hub.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "independent",
        "coreResource": 48,
        "corePopulation": 58,
        "coreDefense": 46,
        "coreTechnology": 52,
        "coreEnvironment": 52,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "omega_station",
      "solar_port",
      "vega_outpost",
      "iron_cross"
    ],
    "enemyLevel": 5,
    "description": "상업수도 성계. 은하 서부 무역 정치의 중심.",
    "descriptionEn": "Commercial capital system. Center of western galactic trade and politics."
  },
  "iron_cross": {
    "id": "iron_cross",
    "name": "아이언 크로스",
    "nameEn": "Iron Cross",
    "position": {
      "x": 0.38,
      "y": 0.42
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "iron_remnant",
        "systemId": "iron_cross",
        "name": "아이언 크로스 레므난트",
        "nameEn": "Iron Cross Remnant",
        "description": "[국가: 스텔리움 연합] 잔해 속에서 살아남은 자들의 정착지.",
        "descriptionEn": "[Nation: Stellium Alliance] A settlement of survivors among the wreckage.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "scavengers",
        "coreResource": 26,
        "corePopulation": 40,
        "coreDefense": 52,
        "coreTechnology": 44,
        "coreEnvironment": 34,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "helios",
      "minerva",
      "titan_gate",
      "new_eden"
    ],
    "enemyLevel": 6,
    "description": "고대 전쟁의 흔적이 남아있는 성계.",
    "descriptionEn": "A system scarred by an ancient war."
  },
  "draco_nebula": {
    "id": "draco_nebula",
    "name": "드라코 성운",
    "nameEn": "Draco Nebula",
    "position": {
      "x": 0.62,
      "y": 0.82
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "draco_haven",
        "systemId": "draco_nebula",
        "name": "드라코 성운 헤이븐",
        "nameEn": "Draco Nebula Haven",
        "description": "[국가: 스텔리움 연합] 성운의 에너지를 이용한 특수 연구소.",
        "descriptionEn": "[Nation: Stellium Alliance] A special research facility powered by nebula energy.",
        "hasTradePort": true,
        "hasShipyard": false,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "scientists",
        "coreResource": 36,
        "corePopulation": 46,
        "coreDefense": 42,
        "coreTechnology": 54,
        "coreEnvironment": 50,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "sirius",
      "vega_outpost",
      "omega_station",
      "perseus"
    ],
    "enemyLevel": 7,
    "description": "짙은 성운 안에 숨겨진 신비로운 성계.",
    "descriptionEn": "A mysterious system hidden inside a dense nebula."
  },
  "omega_station": {
    "id": "omega_station",
    "name": "오메가 스테이션",
    "nameEn": "Omega Station",
    "position": {
      "x": 0.65,
      "y": 0.55
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "omega_hub",
        "systemId": "omega_station",
        "name": "오메가 스테이션 허브",
        "nameEn": "Omega Station Hub",
        "description": "[국가: 크림슨 레기온] 대형 우주 정거장. 24시간 운영.",
        "descriptionEn": "[Nation: Crimson Legion] A large space station operating around the clock.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "independent",
        "coreResource": 48,
        "corePopulation": 54,
        "coreDefense": 46,
        "coreTechnology": 50,
        "coreEnvironment": 44,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "new_eden",
      "titan_gate",
      "helios",
      "draco_nebula"
    ],
    "enemyLevel": 8,
    "description": "은하의 중간지점. 모든 항로가 교차한다.",
    "descriptionEn": "Midpoint of the galaxy. All routes cross here."
  },
  "helios": {
    "id": "helios",
    "name": "헬리오스",
    "nameEn": "Helios",
    "position": {
      "x": 0.5,
      "y": 0.35
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "helios_core",
        "systemId": "helios",
        "name": "헬리오스 코어",
        "nameEn": "Helios Core",
        "description": "태양에너지 배터리 생산의 중심지.",
        "descriptionEn": "Center of solar battery production.",
        "hasTradePort": true,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "energy_corp",
        "coreResource": 50,
        "corePopulation": 44,
        "coreDefense": 42,
        "coreTechnology": 56,
        "coreEnvironment": 48,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "titan_gate",
      "iron_cross",
      "omega_station"
    ],
    "enemyLevel": 9,
    "description": "항성 에너지 수집 시설이 있는 성계.",
    "descriptionEn": "A system with stellar energy collection facilities."
  },
  "sirius": {
    "id": "sirius",
    "name": "시리우스",
    "nameEn": "Sirius",
    "position": {
      "x": 0.75,
      "y": 0.7
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "sirius_border",
        "systemId": "sirius",
        "name": "시리우스 보더",
        "nameEn": "Sirius Border",
        "description": "[국가: 크림슨 레기온] 변경 지대의 마지막 안전한 정착지.",
        "descriptionEn": "[Nation: Crimson Legion] The last safe settlement on the frontier.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "border_watch",
        "coreResource": 38,
        "corePopulation": 44,
        "coreDefense": 50,
        "coreTechnology": 46,
        "coreEnvironment": 42,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "crimson_zone",
      "draco_nebula",
      "perseus"
    ],
    "enemyLevel": 10,
    "description": "중립과 PvP 구역의 경계. 위험이 가까워진다.",
    "descriptionEn": "Border between neutral and PvP zones. Danger draws near."
  },
  "titan_gate": {
    "id": "titan_gate",
    "name": "타이탄 게이트",
    "nameEn": "Titan Gate",
    "position": {
      "x": 0.6,
      "y": 0.4
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "titan_ruins",
        "systemId": "titan_gate",
        "name": "타이탄 게이트 유적",
        "nameEn": "Titan Gate Ruins",
        "description": "고대 문명의 흔적. 연구자들이 끊임없이 찾아온다.",
        "descriptionEn": "Traces of an ancient civilization. Researchers visit constantly.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "archaeologists",
        "coreResource": 30,
        "corePopulation": 40,
        "coreDefense": 44,
        "coreTechnology": 52,
        "coreEnvironment": 46,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "helios",
      "omega_station",
      "shadow_nexus",
      "iron_cross"
    ],
    "enemyLevel": 10,
    "description": "고대 타이탄 종족이 남긴 거대 게이트 유적.",
    "descriptionEn": "Ruins of a massive gate left by the ancient Titan race."
  },
  "perseus": {
    "id": "perseus",
    "name": "페르세우스",
    "nameEn": "Perseus",
    "position": {
      "x": 0.78,
      "y": 0.48
    },
    "zone": "neutral",
    "planets": [
      {
        "id": "perseus_memorial",
        "systemId": "perseus",
        "name": "페르세우스 메모리얼",
        "nameEn": "Perseus Memorial",
        "description": "[국가: 크림슨 레기온] 과거 영웅들을 기리는 기념 행성.",
        "descriptionEn": "[Nation: Crimson Legion] A memorial planet honoring past heroes.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "veterans",
        "coreResource": 32,
        "corePopulation": 42,
        "coreDefense": 54,
        "coreTechnology": 48,
        "coreEnvironment": 44,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "crimson_zone",
      "sirius",
      "draco_nebula"
    ],
    "enemyLevel": 11,
    "description": "영웅들이 이름을 남긴 격전지.",
    "descriptionEn": "A fierce battleground where heroes made their names."
  },
  "crimson_zone": {
    "id": "crimson_zone",
    "name": "크림슨 구역",
    "nameEn": "Crimson Zone",
    "position": {
      "x": 0.82,
      "y": 0.62
    },
    "zone": "pvp",
    "planets": [
      {
        "id": "crimson_base",
        "systemId": "crimson_zone",
        "name": "크림슨 구역 베이스",
        "nameEn": "Crimson Zone Base",
        "description": "[국가: 크림슨 레기온] 해적과 용병의 거점. 고위험 고수익.",
        "descriptionEn": "[Nation: Crimson Legion] Pirate and mercenary stronghold. High risk",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "pirates",
        "coreResource": 34,
        "corePopulation": 38,
        "coreDefense": 56,
        "coreTechnology": 42,
        "coreEnvironment": 34,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "sirius",
      "blood_field",
      "perseus",
      "dark_rift"
    ],
    "enemyLevel": 15,
    "description": "⚠ PvP 구역. 다른 파일럿의 공격에 노출된다.",
    "descriptionEn": "⚠ PvP zone. You may be attacked by other pilots."
  },
  "dark_rift": {
    "id": "dark_rift",
    "name": "다크 리프트",
    "nameEn": "Dark Rift",
    "position": {
      "x": 0.72,
      "y": 0.28
    },
    "zone": "pvp",
    "planets": [
      {
        "id": "dark_haven",
        "systemId": "dark_rift",
        "name": "다크 리프트 헤이븐",
        "nameEn": "Dark Rift Haven",
        "description": "[국가: 크림슨 레기온] 왜곡된 공간 속 비밀 기지.",
        "descriptionEn": "[Nation: Crimson Legion] A secret base inside warped space.",
        "hasTradePort": true,
        "hasShipyard": false,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "void_walkers",
        "coreResource": 32,
        "corePopulation": 38,
        "coreDefense": 48,
        "coreTechnology": 52,
        "coreEnvironment": 36,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "shadow_nexus",
      "abyss",
      "crimson_zone"
    ],
    "enemyLevel": 17,
    "description": "⚠ PvP 구역. 공간 왜곡이 심하다.",
    "descriptionEn": "⚠ PvP zone. Spatial distortion is severe."
  },
  "blood_field": {
    "id": "blood_field",
    "name": "블러드 필드",
    "nameEn": "Blood Field",
    "position": {
      "x": 0.88,
      "y": 0.75
    },
    "zone": "pvp",
    "planets": [
      {
        "id": "blood_station",
        "systemId": "blood_field",
        "name": "블러드 필드 스테이션",
        "nameEn": "Blood Field Station",
        "description": "[국가: 크림슨 레기온] 전투의 상흔이 가득한 부유 정거장.",
        "descriptionEn": "[Nation: Crimson Legion] A floating station filled with scars of battle.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "trade_coalition",
        "coreResource": 28,
        "corePopulation": 36,
        "coreDefense": 58,
        "coreTechnology": 40,
        "coreEnvironment": 32,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "crimson_zone",
      "nightfall",
      "synth_066"
    ],
    "enemyLevel": 18,
    "description": "⚠ PvP 구역. 이름처럼 잔인한 격전지.",
    "descriptionEn": "⚠ PvP zone. A brutal battlefield, as the name suggests."
  },
  "shadow_nexus": {
    "id": "shadow_nexus",
    "name": "섀도우 넥서스",
    "nameEn": "Shadow Nexus",
    "position": {
      "x": 0.65,
      "y": 0.22
    },
    "zone": "pvp",
    "planets": [
      {
        "id": "shadow_market",
        "systemId": "shadow_nexus",
        "name": "섀도우 넥서스 마켓",
        "nameEn": "Shadow Nexus Market",
        "description": "불법 거래의 중심지.",
        "descriptionEn": "Center of illegal trade.",
        "hasTradePort": true,
        "hasShipyard": false,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "black_market",
        "coreResource": 40,
        "corePopulation": 42,
        "coreDefense": 46,
        "coreTechnology": 50,
        "coreEnvironment": 38,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "dark_rift",
      "abyss",
      "titan_gate"
    ],
    "enemyLevel": 16,
    "description": "⚠ PvP 구역. 어둠 속의 교차점.",
    "descriptionEn": "⚠ PvP zone. A crossroads in the dark."
  },
  "abyss": {
    "id": "abyss",
    "name": "어비스",
    "nameEn": "Abyss",
    "position": {
      "x": 0.78,
      "y": 0.18
    },
    "zone": "pvp",
    "planets": [
      {
        "id": "abyss_gate",
        "systemId": "abyss",
        "name": "어비스 게이트",
        "nameEn": "Abyss Gate",
        "description": "[국가: 크림슨 레기온] 최종 구역으로 향하는 마지막 관문.",
        "descriptionEn": "[Nation: Crimson Legion] The last gate toward the final zone.",
        "hasTradePort": false,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 40,
        "corePopulation": 34,
        "coreDefense": 56,
        "coreTechnology": 54,
        "coreEnvironment": 32,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "arcfire_core",
      "dark_rift",
      "shadow_nexus",
      "nightfall"
    ],
    "enemyLevel": 20,
    "description": "⚠ PvP 구역. 심연의 끝. 여기서 살아남으면 전설이 된다.",
    "descriptionEn": "⚠ PvP zone. Edge of the abyss. Survive here and become legend."
  },
  "nightfall": {
    "id": "nightfall",
    "name": "나이트폴",
    "nameEn": "Nightfall",
    "position": {
      "x": 0.88,
      "y": 0.3
    },
    "zone": "pvp",
    "planets": [
      {
        "id": "nightfall_citadel",
        "systemId": "nightfall",
        "name": "나이트폴 시타델",
        "nameEn": "Nightfall Citadel",
        "description": "[국가: 크림슨 레기온] 어둠의 군주들이 지배하는 요새.",
        "descriptionEn": "[Nation: Crimson Legion] A fortress ruled by lords of darkness.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "dark_lords",
        "coreResource": 30,
        "corePopulation": 36,
        "coreDefense": 52,
        "coreTechnology": 48,
        "coreEnvironment": 30,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "abyss",
      "genesis",
      "blood_field"
    ],
    "enemyLevel": 19,
    "description": "⚠ PvP 구역. 영원한 밤이 지배하는 성계.",
    "descriptionEn": "⚠ PvP zone. Eternal night rules this system."
  },
  "arcfire_core": {
    "id": "arcfire_core",
    "name": "아크파이어 코어",
    "nameEn": "Arcfire Core",
    "position": {
      "x": 0.8422528641900253,
      "y": 0.10221346737427854
    },
    "zone": "endgame",
    "planets": [
      {
        "id": "core_prime",
        "systemId": "arcfire_core",
        "name": "아크파이어 코어 프라임",
        "nameEn": "Arcfire Core Prime",
        "description": "[국가: 크림슨 레기온] 수도 행성. 은하 에너지가 모이는 동부 최종 거점.",
        "descriptionEn": "[Nation: Crimson Legion] Capital planet. Final eastern stronghold where galactic energy converges.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "ancients",
        "coreResource": 55,
        "corePopulation": 46,
        "coreDefense": 58,
        "coreTechnology": 56,
        "coreEnvironment": 48,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "abyss",
      "eternity",
      "synth_025"
    ],
    "enemyLevel": 30,
    "description": "★ 크림슨 레기온 수도 성계. 아크파이어 은하 동쪽의 심장부·최종 거점.",
    "descriptionEn": "★ Crimson Legion capital system. Eastern heart of the galaxy."
  },
  "eternity": {
    "id": "eternity",
    "name": "이터니티",
    "nameEn": "Eternity",
    "position": {
      "x": 0.92,
      "y": 0.18
    },
    "zone": "endgame",
    "planets": [
      {
        "id": "eternal_throne",
        "systemId": "eternity",
        "name": "이터니티 스론",
        "nameEn": "Eternity Throne",
        "description": "은하를 지배했던 고대 제국의 왕좌.",
        "descriptionEn": "Throne of the ancient empire that once ruled the galaxy.",
        "hasTradePort": false,
        "hasShipyard": true,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "ancients",
        "coreResource": 58,
        "corePopulation": 42,
        "coreDefense": 60,
        "coreTechnology": 58,
        "coreEnvironment": 46,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "genesis",
      "arcfire_core",
      "synth_037"
    ],
    "enemyLevel": 35,
    "description": "★ 엔드게임. 시간이 멈춘 것 같은 영원의 성계.",
    "descriptionEn": "★ Endgame. A system where time seems to stand still."
  },
  "genesis": {
    "id": "genesis",
    "name": "제네시스",
    "nameEn": "Genesis",
    "position": {
      "x": 0.9277471358099747,
      "y": 0.07778653262572147
    },
    "zone": "endgame",
    "planets": [
      {
        "id": "genesis_origin",
        "systemId": "genesis",
        "name": "제네시스 오리진",
        "nameEn": "Genesis Origin",
        "description": "우주의 기원. 여기에 도달한 자는 신화가 된다.",
        "descriptionEn": "Origin of the universe. Those who arrive here become myth.",
        "hasTradePort": true,
        "hasShipyard": true,
        "hasTavern": true,
        "tradeGoods": [],
        "factionId": "creators",
        "coreResource": 65,
        "corePopulation": 44,
        "coreDefense": 62,
        "coreTechnology": 60,
        "coreEnvironment": 52,
        "backdropImageAssetKey": null,
        "infoPanelPortraitAssetKey": null,
        "mainStageSkiaNebulaEnabled": true,
        "mainStageBackdropImageEnabled": false
      }
    ],
    "connections": [
      "eternity",
      "nightfall",
      "synth_045"
    ],
    "enemyLevel": 40,
    "description": "★ 엔드게임. 모든 것의 시작이자 끝. 아크파이어 온라인의 최종 목적지.",
    "descriptionEn": "★ Endgame. Beginning and end of all things. Arcfire Online's final destination."
  },
  "synth_001": {
    "id": "synth_001",
    "name": "미개척-1",
    "position": {
      "x": 1.0247356081299601,
      "y": 0.5422425134130963
    },
    "zone": "neutral",
    "connections": [
      "synth_011",
      "synth_006",
      "synth_003"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_001_p",
        "systemId": "synth_001",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_002": {
    "id": "synth_002",
    "name": "미개척-2",
    "position": {
      "x": 0.231398484386254,
      "y": 0.3273953451080641
    },
    "zone": "neutral",
    "connections": [
      "minerva",
      "synth_062",
      "synth_067"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_002_p",
        "systemId": "synth_002",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_003": {
    "id": "synth_003",
    "name": "미개척-3",
    "position": {
      "x": 1.0485412723741112,
      "y": 0.4285661825115052
    },
    "zone": "neutral",
    "connections": [
      "synth_001",
      "synth_037",
      "synth_011"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_003_p",
        "systemId": "synth_003",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_004": {
    "id": "synth_004",
    "name": "미개척-4",
    "position": {
      "x": 0.8339742591014029,
      "y": 0.8568714450288177
    },
    "zone": "neutral",
    "connections": [
      "synth_021"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_004_p",
        "systemId": "synth_004",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_005": {
    "id": "synth_005",
    "name": "미개척-5",
    "position": {
      "x": 0.19861261514368056,
      "y": 0.16946054381069664
    },
    "zone": "neutral",
    "connections": [
      "synth_013",
      "synth_010",
      "synth_062"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_005_p",
        "systemId": "synth_005",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_006": {
    "id": "synth_006",
    "name": "미개척-6",
    "position": {
      "x": 1.0861331486279038,
      "y": 0.6266495639697761
    },
    "zone": "neutral",
    "connections": [
      "synth_001",
      "synth_022",
      "synth_066"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_006_p",
        "systemId": "synth_006",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_008": {
    "id": "synth_008",
    "name": "미개척-8",
    "position": {
      "x": 0.5559986619370794,
      "y": 0.10545749442775249
    },
    "zone": "neutral",
    "connections": [
      "synth_067",
      "synth_047"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_008_p",
        "systemId": "synth_008",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_009": {
    "id": "synth_009",
    "name": "미개척-9",
    "position": {
      "x": 1.0868038460184672,
      "y": 0.8998816745515867
    },
    "zone": "neutral",
    "connections": [
      "synth_018",
      "synth_016",
      "synth_019"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_009_p",
        "systemId": "synth_009",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_010": {
    "id": "synth_010",
    "name": "미개척-10",
    "position": {
      "x": 0.147132557981043,
      "y": 0.06409208787393036
    },
    "zone": "neutral",
    "connections": [
      "synth_015",
      "synth_005",
      "synth_023"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_010_p",
        "systemId": "synth_010",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_011": {
    "id": "synth_011",
    "name": "미개척-11",
    "position": {
      "x": 0.9347646028934443,
      "y": 0.5730129304139694
    },
    "zone": "neutral",
    "connections": [
      "synth_001",
      "synth_003"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_011_p",
        "systemId": "synth_011",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_013": {
    "id": "synth_013",
    "name": "미개척-13",
    "position": {
      "x": 0.27692920783911285,
      "y": 0.08796377143446792
    },
    "zone": "neutral",
    "connections": [
      "synth_014",
      "synth_005",
      "synth_017"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_013_p",
        "systemId": "synth_013",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_014": {
    "id": "synth_014",
    "name": "미개척-14",
    "position": {
      "x": 0.3413917962267485,
      "y": 0.15089722225207927
    },
    "zone": "neutral",
    "connections": [
      "synth_013",
      "synth_017",
      "synth_067"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_014_p",
        "systemId": "synth_014",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_015": {
    "id": "synth_015",
    "name": "미개척-15",
    "position": {
      "x": 0.09566988370371544,
      "y": -0.03646663637101328
    },
    "zone": "neutral",
    "connections": [
      "synth_010",
      "synth_068",
      "synth_070"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_015_p",
        "systemId": "synth_015",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_016": {
    "id": "synth_016",
    "name": "미개척-16",
    "position": {
      "x": 0.9753211068615762,
      "y": 0.8634634012624725
    },
    "zone": "neutral",
    "connections": [
      "synth_024",
      "synth_009",
      "synth_066"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_016_p",
        "systemId": "synth_016",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_017": {
    "id": "synth_017",
    "name": "미개척-17",
    "position": {
      "x": 0.4171587262951638,
      "y": 0.07773398861926778
    },
    "zone": "neutral",
    "connections": [
      "synth_028",
      "synth_014",
      "synth_013"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_017_p",
        "systemId": "synth_017",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_018": {
    "id": "synth_018",
    "name": "미개척-18",
    "position": {
      "x": 1.163259790073931,
      "y": 0.9812456160253172
    },
    "zone": "neutral",
    "connections": [
      "synth_009",
      "synth_019",
      "synth_064"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_018_p",
        "systemId": "synth_018",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_019": {
    "id": "synth_019",
    "name": "미개척-19",
    "position": {
      "x": 1.2024591704826626,
      "y": 0.8732829806248755
    },
    "zone": "neutral",
    "connections": [
      "synth_056",
      "synth_018",
      "synth_009"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_019_p",
        "systemId": "synth_019",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_020": {
    "id": "synth_020",
    "name": "미개척-20",
    "position": {
      "x": 0.2723730320568396,
      "y": -0.06255914078474231
    },
    "zone": "neutral",
    "connections": [
      "synth_068",
      "synth_028",
      "synth_075"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_020_p",
        "systemId": "synth_020",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_021": {
    "id": "synth_021",
    "name": "미개척-21",
    "position": {
      "x": 0.8664157770279147,
      "y": 0.967993158800629
    },
    "zone": "neutral",
    "connections": [
      "synth_024",
      "synth_004",
      "synth_079"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_021_p",
        "systemId": "synth_021",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_022": {
    "id": "synth_022",
    "name": "미개척-22",
    "position": {
      "x": 1.199685837447404,
      "y": 0.6851147888643875
    },
    "zone": "neutral",
    "connections": [
      "synth_006",
      "synth_058",
      "synth_053"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_022_p",
        "systemId": "synth_022",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_023": {
    "id": "synth_023",
    "name": "미개척-23",
    "position": {
      "x": 0.05966028886982558,
      "y": 0.1555056907109335
    },
    "zone": "neutral",
    "connections": [
      "synth_010",
      "synth_057",
      "synth_062"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_023_p",
        "systemId": "synth_023",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_024": {
    "id": "synth_024",
    "name": "미개척-24",
    "position": {
      "x": 0.9769312161550101,
      "y": 0.9805875791299299
    },
    "zone": "neutral",
    "connections": [
      "synth_021",
      "synth_016",
      "synth_059"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_024_p",
        "systemId": "synth_024",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_025": {
    "id": "synth_025",
    "name": "미개척-25",
    "position": {
      "x": 0.8004029647996603,
      "y": -0.01463617762900401
    },
    "zone": "neutral",
    "connections": [
      "arcfire_core",
      "synth_045",
      "synth_047"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_025_p",
        "systemId": "synth_025",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_026": {
    "id": "synth_026",
    "name": "미개척-26",
    "position": {
      "x": 0.307540202207787,
      "y": 0.8817759919475749
    },
    "zone": "neutral",
    "connections": [
      "synth_041",
      "synth_046",
      "synth_034"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_026_p",
        "systemId": "synth_026",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_027": {
    "id": "synth_027",
    "name": "미개척-27",
    "position": {
      "x": 1.2490109540739958,
      "y": 0.5009400430649769
    },
    "zone": "neutral",
    "connections": [
      "synth_053",
      "synth_032",
      "synth_077"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_027_p",
        "systemId": "synth_027",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_028": {
    "id": "synth_028",
    "name": "미개척-28",
    "position": {
      "x": 0.3902744196048132,
      "y": -0.02092614445172749
    },
    "zone": "neutral",
    "connections": [
      "synth_017",
      "synth_020",
      "synth_050"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_028_p",
        "systemId": "synth_028",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_029": {
    "id": "synth_029",
    "name": "미개척-29",
    "position": {
      "x": 0.6248910108732892,
      "y": 1.013717333124635
    },
    "zone": "neutral",
    "connections": [
      "synth_076",
      "synth_072",
      "synth_051"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_029_p",
        "systemId": "synth_029",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_030": {
    "id": "synth_030",
    "name": "미개척-30",
    "position": {
      "x": 1.1149449089485857,
      "y": -0.026955660978092436
    },
    "zone": "neutral",
    "connections": [
      "synth_035",
      "synth_043",
      "synth_045"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_030_p",
        "systemId": "synth_030",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_031": {
    "id": "synth_031",
    "name": "미개척-31",
    "position": {
      "x": 0.03344352688128193,
      "y": 0.6344199336396558
    },
    "zone": "neutral",
    "connections": [
      "synth_033",
      "synth_049",
      "synth_036"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_031_p",
        "systemId": "synth_031",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_032": {
    "id": "synth_032",
    "name": "미개척-32",
    "position": {
      "x": 1.212781677421712,
      "y": 0.35620114267523434
    },
    "zone": "neutral",
    "connections": [
      "synth_077",
      "synth_027",
      "synth_042"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_032_p",
        "systemId": "synth_032",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_033": {
    "id": "synth_033",
    "name": "미개척-33",
    "position": {
      "x": 0.10079572912186224,
      "y": 0.5702067102603363
    },
    "zone": "neutral",
    "connections": [
      "synth_031",
      "synth_073",
      "synth_052"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_033_p",
        "systemId": "synth_033",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_034": {
    "id": "synth_034",
    "name": "미개척-34",
    "position": {
      "x": 0.19422018933428098,
      "y": 1.0390658442636207
    },
    "zone": "neutral",
    "connections": [
      "synth_041",
      "synth_039",
      "synth_026"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_034_p",
        "systemId": "synth_034",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_035": {
    "id": "synth_035",
    "name": "미개척-35",
    "position": {
      "x": 1.2662028820684557,
      "y": -0.053046682661367056
    },
    "zone": "neutral",
    "connections": [
      "synth_040",
      "synth_030",
      "synth_048"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_035_p",
        "systemId": "synth_035",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_036": {
    "id": "synth_036",
    "name": "미개척-36",
    "position": {
      "x": 0.08483999062940847,
      "y": 0.7821192036207062
    },
    "zone": "neutral",
    "connections": [
      "synth_049",
      "synth_031",
      "synth_041"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_036_p",
        "systemId": "synth_036",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_037": {
    "id": "synth_037",
    "name": "미개척-37",
    "position": {
      "x": 0.9983153962037744,
      "y": 0.32316974064540666
    },
    "zone": "neutral",
    "connections": [
      "eternity",
      "synth_042",
      "synth_003"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_037_p",
        "systemId": "synth_037",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_039": {
    "id": "synth_039",
    "name": "미개척-39",
    "position": {
      "x": 0.05040533022064698,
      "y": 1.022796380971312
    },
    "zone": "neutral",
    "connections": [
      "synth_044",
      "synth_034"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_039_p",
        "systemId": "synth_039",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_040": {
    "id": "synth_040",
    "name": "미개척-40",
    "position": {
      "x": 1.3060452934165723,
      "y": -0.14722047192985438
    },
    "zone": "neutral",
    "connections": [
      "synth_035",
      "synth_048"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_040_p",
        "systemId": "synth_040",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_041": {
    "id": "synth_041",
    "name": "미개척-41",
    "position": {
      "x": 0.1759581166017311,
      "y": 0.9141646075329539
    },
    "zone": "neutral",
    "connections": [
      "synth_034",
      "synth_026",
      "synth_036"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_041_p",
        "systemId": "synth_041",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_042": {
    "id": "synth_042",
    "name": "미개척-42",
    "position": {
      "x": 1.0835090723008018,
      "y": 0.24921841657901866
    },
    "zone": "neutral",
    "connections": [
      "synth_037",
      "synth_043",
      "synth_032"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_042_p",
        "systemId": "synth_042",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_043": {
    "id": "synth_043",
    "name": "미개척-43",
    "position": {
      "x": 1.1721216337045275,
      "y": 0.13024654808025554
    },
    "zone": "neutral",
    "connections": [
      "synth_042",
      "synth_048",
      "synth_030"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_043_p",
        "systemId": "synth_043",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_044": {
    "id": "synth_044",
    "name": "미개척-44",
    "position": {
      "x": -0.01909754984721892,
      "y": 0.951057462518734
    },
    "zone": "neutral",
    "connections": [
      "synth_039",
      "synth_049"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_044_p",
        "systemId": "synth_044",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_045": {
    "id": "synth_045",
    "name": "미개척-45",
    "position": {
      "x": 0.9097343120752078,
      "y": -0.04906747631588179
    },
    "zone": "neutral",
    "connections": [
      "genesis",
      "synth_025",
      "synth_030"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_045_p",
        "systemId": "synth_045",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_046": {
    "id": "synth_046",
    "name": "미개척-46",
    "position": {
      "x": 0.45525449758566855,
      "y": 0.9829532958275936
    },
    "zone": "neutral",
    "connections": [
      "synth_072",
      "synth_051",
      "synth_026"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_046_p",
        "systemId": "synth_046",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_047": {
    "id": "synth_047",
    "name": "미개척-47",
    "position": {
      "x": 0.6959845295796313,
      "y": -0.06292059585918412
    },
    "zone": "neutral",
    "connections": [
      "synth_025",
      "synth_050",
      "synth_008"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_047_p",
        "systemId": "synth_047",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_048": {
    "id": "synth_048",
    "name": "미개척-48",
    "position": {
      "x": 1.3118605904788412,
      "y": 0.18747549057454793
    },
    "zone": "neutral",
    "connections": [
      "synth_043",
      "synth_035",
      "synth_040"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_048_p",
        "systemId": "synth_048",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_049": {
    "id": "synth_049",
    "name": "미개척-49",
    "position": {
      "x": -0.0593919700699059,
      "y": 0.7575169936847609
    },
    "zone": "neutral",
    "connections": [
      "synth_036",
      "synth_031",
      "synth_044"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_049_p",
        "systemId": "synth_049",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_050": {
    "id": "synth_050",
    "name": "미개척-50",
    "position": {
      "x": 0.5265743717933342,
      "y": -0.08122682949136661
    },
    "zone": "neutral",
    "connections": [
      "synth_055",
      "synth_028",
      "synth_047"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_050_p",
        "systemId": "synth_050",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_051": {
    "id": "synth_051",
    "name": "미개척-51",
    "position": {
      "x": 0.4821569002037202,
      "y": 1.1083332291739632
    },
    "zone": "neutral",
    "connections": [
      "synth_046",
      "synth_076",
      "synth_029"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_051_p",
        "systemId": "synth_051",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_052": {
    "id": "synth_052",
    "name": "미개척-52",
    "position": {
      "x": -0.062330483660192726,
      "y": 0.5057431691548231
    },
    "zone": "neutral",
    "connections": [
      "synth_054",
      "synth_033",
      "synth_073"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_052_p",
        "systemId": "synth_052",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_053": {
    "id": "synth_053",
    "name": "미개척-53",
    "position": {
      "x": 1.345750486630248,
      "y": 0.5213871593274467
    },
    "zone": "neutral",
    "connections": [
      "synth_027",
      "synth_077",
      "synth_022"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_053_p",
        "systemId": "synth_053",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_054": {
    "id": "synth_054",
    "name": "미개척-54",
    "position": {
      "x": -0.07263218120045031,
      "y": 0.3410472585597491
    },
    "zone": "neutral",
    "connections": [
      "synth_078",
      "synth_052"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_054_p",
        "systemId": "synth_054",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_055": {
    "id": "synth_055",
    "name": "미개척-55",
    "position": {
      "x": 0.4845122724372149,
      "y": -0.1904175357956288
    },
    "zone": "neutral",
    "connections": [
      "synth_050"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_055_p",
        "systemId": "synth_055",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_056": {
    "id": "synth_056",
    "name": "미개척-56",
    "position": {
      "x": 1.2942236482593321,
      "y": 0.8831892340669619
    },
    "zone": "neutral",
    "connections": [
      "synth_019",
      "synth_074",
      "synth_058"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_056_p",
        "systemId": "synth_056",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_057": {
    "id": "synth_057",
    "name": "미개척-57",
    "position": {
      "x": -0.07900731570337384,
      "y": 0.17422687622485059
    },
    "zone": "neutral",
    "connections": [
      "synth_078",
      "synth_023",
      "synth_070"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_057_p",
        "systemId": "synth_057",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_058": {
    "id": "synth_058",
    "name": "미개척-58",
    "position": {
      "x": 1.36230701135552,
      "y": 0.752653947596914
    },
    "zone": "neutral",
    "connections": [
      "synth_056",
      "synth_022",
      "synth_074"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_058_p",
        "systemId": "synth_058",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_059": {
    "id": "synth_059",
    "name": "미개척-59",
    "position": {
      "x": 1.0205291950315176,
      "y": 1.1280415413844258
    },
    "zone": "neutral",
    "connections": [
      "synth_079",
      "synth_071",
      "synth_024"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_059_p",
        "systemId": "synth_059",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_060": {
    "id": "synth_060",
    "name": "미개척-60",
    "position": {
      "x": -0.013937162071177438,
      "y": -0.17765119255186904
    },
    "zone": "neutral",
    "connections": [
      "synth_065",
      "synth_069",
      "synth_075"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_060_p",
        "systemId": "synth_060",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_061": {
    "id": "synth_061",
    "name": "미개척-61",
    "position": {
      "x": 1.36686479731372,
      "y": 1.0350754236307607
    },
    "zone": "neutral",
    "connections": [
      "synth_063",
      "synth_074",
      "synth_064"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_061_p",
        "systemId": "synth_061",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_062": {
    "id": "synth_062",
    "name": "미개척-62",
    "position": {
      "x": 0.13251790572015126,
      "y": 0.2887042013217887
    },
    "zone": "neutral",
    "connections": [
      "synth_002",
      "synth_005",
      "synth_023"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_062_p",
        "systemId": "synth_062",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_063": {
    "id": "synth_063",
    "name": "미개척-63",
    "position": {
      "x": 1.3946671017361312,
      "y": 1.1289631843883163
    },
    "zone": "neutral",
    "connections": [
      "synth_061",
      "synth_071"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_063_p",
        "systemId": "synth_063",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_064": {
    "id": "synth_064",
    "name": "미개척-64",
    "position": {
      "x": 1.246096334665326,
      "y": 1.0974538118560302
    },
    "zone": "neutral",
    "connections": [
      "synth_071",
      "synth_061",
      "synth_018"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_064_p",
        "systemId": "synth_064",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_065": {
    "id": "synth_065",
    "name": "미개척-65",
    "position": {
      "x": -0.10321075956928787,
      "y": -0.23364939746756783
    },
    "zone": "neutral",
    "connections": [
      "synth_060",
      "synth_069"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_065_p",
        "systemId": "synth_065",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_066": {
    "id": "synth_066",
    "name": "미개척-66",
    "position": {
      "x": 0.9894593584985887,
      "y": 0.733225739969189
    },
    "zone": "neutral",
    "connections": [
      "blood_field",
      "synth_016",
      "synth_006"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_066_p",
        "systemId": "synth_066",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_067": {
    "id": "synth_067",
    "name": "미개척-67",
    "position": {
      "x": 0.48108789750901026,
      "y": 0.2552809845653344
    },
    "zone": "neutral",
    "connections": [
      "synth_008",
      "synth_014",
      "synth_002"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_067_p",
        "systemId": "synth_067",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_068": {
    "id": "synth_068",
    "name": "미개척-68",
    "position": {
      "x": 0.21394273717732024,
      "y": -0.1512454998159441
    },
    "zone": "neutral",
    "connections": [
      "synth_020",
      "synth_075",
      "synth_015"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_068_p",
        "systemId": "synth_068",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_069": {
    "id": "synth_069",
    "name": "미개척-69",
    "position": {
      "x": -0.13444685000136244,
      "y": -0.10676573811632233
    },
    "zone": "neutral",
    "connections": [
      "synth_065",
      "synth_060",
      "synth_070"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_069_p",
        "systemId": "synth_069",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_070": {
    "id": "synth_070",
    "name": "미개척-70",
    "position": {
      "x": -0.06381179120331246,
      "y": 0.027126367374679647
    },
    "zone": "neutral",
    "connections": [
      "synth_057",
      "synth_069",
      "synth_015"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_070_p",
        "systemId": "synth_070",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_071": {
    "id": "synth_071",
    "name": "미개척-71",
    "position": {
      "x": 1.1628763169008018,
      "y": 1.1477659146648678
    },
    "zone": "neutral",
    "connections": [
      "synth_064",
      "synth_059",
      "synth_063"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_071_p",
        "systemId": "synth_071",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_072": {
    "id": "synth_072",
    "name": "미개척-72",
    "position": {
      "x": 0.5430805677135874,
      "y": 0.9345074885148194
    },
    "zone": "neutral",
    "connections": [
      "synth_046",
      "synth_029"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_072_p",
        "systemId": "synth_072",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_073": {
    "id": "synth_073",
    "name": "미개척-73",
    "position": {
      "x": 0.1970075931872902,
      "y": 0.6033551309019357
    },
    "zone": "neutral",
    "connections": [
      "arcadia",
      "synth_033",
      "synth_052"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_073_p",
        "systemId": "synth_073",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_074": {
    "id": "synth_074",
    "name": "미개척-74",
    "position": {
      "x": 1.4111450741284328,
      "y": 0.9304438178172767
    },
    "zone": "neutral",
    "connections": [
      "synth_061",
      "synth_056",
      "synth_058"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_074_p",
        "systemId": "synth_074",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_075": {
    "id": "synth_075",
    "name": "미개척-75",
    "position": {
      "x": 0.15721045301725872,
      "y": -0.25672773052868697
    },
    "zone": "neutral",
    "connections": [
      "synth_068",
      "synth_060",
      "synth_020"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_075_p",
        "systemId": "synth_075",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_076": {
    "id": "synth_076",
    "name": "미개척-76",
    "position": {
      "x": 0.6242450429613846,
      "y": 1.1203109083961227
    },
    "zone": "neutral",
    "connections": [
      "synth_029",
      "synth_051"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_076_p",
        "systemId": "synth_076",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_077": {
    "id": "synth_077",
    "name": "미개척-77",
    "position": {
      "x": 1.3511127909242875,
      "y": 0.38264192094194255
    },
    "zone": "neutral",
    "connections": [
      "synth_053",
      "synth_032",
      "synth_027"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_077_p",
        "systemId": "synth_077",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_078": {
    "id": "synth_078",
    "name": "미개척-78",
    "position": {
      "x": -0.14315155608028773,
      "y": 0.25846883990323516
    },
    "zone": "neutral",
    "connections": [
      "synth_057",
      "synth_054"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_078_p",
        "systemId": "synth_078",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_079": {
    "id": "synth_079",
    "name": "미개척-79",
    "position": {
      "x": 0.9265705037391139,
      "y": 1.1499150791540615
    },
    "zone": "neutral",
    "connections": [
      "synth_059",
      "synth_021"
    ],
    "enemyLevel": 1,
    "description": "아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.",
    "planets": [
      {
        "id": "synth_079_p",
        "systemId": "synth_079",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_080": {
    "id": "synth_080",
    "name": "미발견-80",
    "position": {
      "x": 0.8171323455277009,
      "y": -1.1523616111833006
    },
    "zone": "neutral",
    "connections": [
      "synth_100",
      "synth_132"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_080_p",
        "systemId": "synth_080",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_081": {
    "id": "synth_081",
    "name": "미발견-81",
    "position": {
      "x": 2.558554944665393,
      "y": 0.4713228981884128
    },
    "zone": "neutral",
    "connections": [
      "synth_101",
      "synth_133"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_081_p",
        "systemId": "synth_081",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_082": {
    "id": "synth_082",
    "name": "미발견-82",
    "position": {
      "x": 0.8063393265134265,
      "y": 2.171325171219179
    },
    "zone": "neutral",
    "connections": [
      "synth_114",
      "synth_102",
      "synth_094"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_082_p",
        "systemId": "synth_082",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_083": {
    "id": "synth_083",
    "name": "미발견-83",
    "position": {
      "x": -0.8845184132070629,
      "y": 0.49291062828837034
    },
    "zone": "neutral",
    "connections": [
      "synth_115",
      "synth_103"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_083_p",
        "systemId": "synth_083",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_084": {
    "id": "synth_084",
    "name": "미발견-84",
    "position": {
      "x": 0.45588897664076494,
      "y": -1.0707085046321698
    },
    "zone": "neutral",
    "connections": [
      "synth_116",
      "synth_104"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_084_p",
        "systemId": "synth_084",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_085": {
    "id": "synth_085",
    "name": "미발견-85",
    "position": {
      "x": 2.154014230565039,
      "y": 0.5302241969157188
    },
    "zone": "neutral",
    "connections": [
      "synth_117",
      "synth_137",
      "synth_105"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_085_p",
        "systemId": "synth_085",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_086": {
    "id": "synth_086",
    "name": "미발견-86",
    "position": {
      "x": 0.4386440716019145,
      "y": 2.1198781153392012
    },
    "zone": "neutral",
    "connections": [
      "synth_118",
      "synth_106",
      "synth_170"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_086_p",
        "systemId": "synth_086",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_087": {
    "id": "synth_087",
    "name": "미발견-87",
    "position": {
      "x": -1.2844594643854168,
      "y": 0.5347830346349399
    },
    "zone": "neutral",
    "connections": [
      "synth_107"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_087_p",
        "systemId": "synth_087",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_088": {
    "id": "synth_088",
    "name": "미발견-88",
    "position": {
      "x": 0.7213721122763227,
      "y": -1.349397954534491
    },
    "zone": "neutral",
    "connections": [
      "synth_140",
      "synth_108"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_088_p",
        "systemId": "synth_088",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_089": {
    "id": "synth_089",
    "name": "미발견-89",
    "position": {
      "x": 2.3831658667577265,
      "y": 0.27712179866071157
    },
    "zone": "neutral",
    "connections": [
      "synth_141",
      "synth_161",
      "synth_109"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_089_p",
        "systemId": "synth_089",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_090": {
    "id": "synth_090",
    "name": "미발견-90",
    "position": {
      "x": 0.699565789698804,
      "y": 1.8801564853904615
    },
    "zone": "neutral",
    "connections": [
      "synth_142",
      "synth_110",
      "synth_122"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_090_p",
        "systemId": "synth_090",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_091": {
    "id": "synth_091",
    "name": "미발견-91",
    "position": {
      "x": -1.0303474641507955,
      "y": 0.267525013585602
    },
    "zone": "neutral",
    "connections": [
      "synth_123",
      "synth_111"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_091_p",
        "systemId": "synth_091",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_092": {
    "id": "synth_092",
    "name": "미발견-92",
    "position": {
      "x": 0.7309799253036624,
      "y": -0.9648559725007868
    },
    "zone": "neutral",
    "connections": [
      "synth_124",
      "synth_144",
      "synth_112"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_092_p",
        "systemId": "synth_092",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_093": {
    "id": "synth_093",
    "name": "미발견-93",
    "position": {
      "x": 2.46913420263077,
      "y": 0.6317384495453737
    },
    "zone": "neutral",
    "connections": [
      "synth_145",
      "synth_113",
      "synth_125"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_093_p",
        "systemId": "synth_093",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_094": {
    "id": "synth_094",
    "name": "미발견-94",
    "position": {
      "x": 0.6973017656583421,
      "y": 2.2776793570130858
    },
    "zone": "neutral",
    "connections": [
      "synth_146",
      "synth_114",
      "synth_082"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_094_p",
        "systemId": "synth_094",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_095": {
    "id": "synth_095",
    "name": "미발견-95",
    "position": {
      "x": -1.0066807157872146,
      "y": 0.6394426195329362
    },
    "zone": "neutral",
    "connections": [
      "synth_127",
      "synth_179"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_095_p",
        "systemId": "synth_095",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_096": {
    "id": "synth_096",
    "name": "미발견-96",
    "position": {
      "x": 0.4185225547038502,
      "y": -1.238490918725907
    },
    "zone": "neutral",
    "connections": [
      "synth_148",
      "synth_128",
      "synth_180"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_096_p",
        "systemId": "synth_096",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_097": {
    "id": "synth_097",
    "name": "미발견-97",
    "position": {
      "x": 2.1236940847703645,
      "y": 0.36831030236529533
    },
    "zone": "neutral",
    "connections": [
      "synth_149",
      "synth_129"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_097_p",
        "systemId": "synth_097",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_098": {
    "id": "synth_098",
    "name": "미발견-98",
    "position": {
      "x": 0.43867693890171927,
      "y": 1.951069111299553
    },
    "zone": "neutral",
    "connections": [
      "synth_130",
      "synth_150",
      "synth_182"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_098_p",
        "systemId": "synth_098",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_099": {
    "id": "synth_099",
    "name": "미발견-99",
    "position": {
      "x": -1.3401314428555215,
      "y": 0.4272439199224332
    },
    "zone": "neutral",
    "connections": [
      "synth_119",
      "synth_151",
      "synth_131"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_099_p",
        "systemId": "synth_099",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_100": {
    "id": "synth_100",
    "name": "미발견-100",
    "position": {
      "x": 0.8832507510743591,
      "y": -1.2346148060625048
    },
    "zone": "neutral",
    "connections": [
      "synth_152",
      "synth_080",
      "synth_120"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_100_p",
        "systemId": "synth_100",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_101": {
    "id": "synth_101",
    "name": "미발견-101",
    "position": {
      "x": 2.612764697044322,
      "y": 0.3751210977839206
    },
    "zone": "neutral",
    "connections": [
      "synth_121",
      "synth_081",
      "synth_153"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_101_p",
        "systemId": "synth_101",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_102": {
    "id": "synth_102",
    "name": "미발견-102",
    "position": {
      "x": 0.8862458548335898,
      "y": 2.07115749753236
    },
    "zone": "neutral",
    "connections": [
      "synth_134",
      "synth_082"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_102_p",
        "systemId": "synth_102",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_103": {
    "id": "synth_103",
    "name": "미발견-103",
    "position": {
      "x": -0.8507804837563582,
      "y": 0.3419392108431011
    },
    "zone": "neutral",
    "connections": [
      "synth_155",
      "synth_123",
      "synth_083"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_103_p",
        "systemId": "synth_103",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_104": {
    "id": "synth_104",
    "name": "미발견-104",
    "position": {
      "x": 0.5242505581837317,
      "y": -0.9439263058049973
    },
    "zone": "neutral",
    "connections": [
      "synth_156",
      "synth_136",
      "synth_084"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_104_p",
        "systemId": "synth_104",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_105": {
    "id": "synth_105",
    "name": "미발견-105",
    "position": {
      "x": 2.219753932905191,
      "y": 0.6471902080985623
    },
    "zone": "neutral",
    "connections": [
      "synth_177",
      "synth_137",
      "synth_085"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_105_p",
        "systemId": "synth_105",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_106": {
    "id": "synth_106",
    "name": "미발견-106",
    "position": {
      "x": 0.45329252400213443,
      "y": 2.251459253965623
    },
    "zone": "neutral",
    "connections": [
      "synth_158",
      "synth_138",
      "synth_086"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_106_p",
        "systemId": "synth_106",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_107": {
    "id": "synth_107",
    "name": "미발견-107",
    "position": {
      "x": -1.1986090078335458,
      "y": 0.6614087059028915
    },
    "zone": "neutral",
    "connections": [
      "synth_159",
      "synth_127",
      "synth_087"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_107_p",
        "systemId": "synth_107",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_108": {
    "id": "synth_108",
    "name": "미발견-108",
    "position": {
      "x": 0.5885099415069422,
      "y": -1.4113112071692888
    },
    "zone": "neutral",
    "connections": [
      "synth_160",
      "synth_088"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_108_p",
        "systemId": "synth_108",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_109": {
    "id": "synth_109",
    "name": "미발견-109",
    "position": {
      "x": 2.2553788741270417,
      "y": 0.24034667897500847
    },
    "zone": "neutral",
    "connections": [
      "synth_193",
      "synth_129",
      "synth_089"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_109_p",
        "systemId": "synth_109",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_110": {
    "id": "synth_110",
    "name": "미발견-110",
    "position": {
      "x": 0.5984553894919294,
      "y": 1.8323186070340503
    },
    "zone": "neutral",
    "connections": [
      "synth_162",
      "synth_090",
      "synth_194"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_110_p",
        "systemId": "synth_110",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_111": {
    "id": "synth_111",
    "name": "미발견-111",
    "position": {
      "x": -1.1585199278043594,
      "y": 0.24014916487370544
    },
    "zone": "neutral",
    "connections": [
      "synth_143",
      "synth_195",
      "synth_091"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_111_p",
        "systemId": "synth_111",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_112": {
    "id": "synth_112",
    "name": "미발견-112",
    "position": {
      "x": 0.8525683021365591,
      "y": -1.0121232310416506
    },
    "zone": "neutral",
    "connections": [
      "synth_164",
      "synth_184",
      "synth_092"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_112_p",
        "systemId": "synth_112",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_113": {
    "id": "synth_113",
    "name": "미발견-113",
    "position": {
      "x": 2.591664574081025,
      "y": 0.6054731763841182
    },
    "zone": "neutral",
    "connections": [
      "synth_145",
      "synth_197",
      "synth_093"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_113_p",
        "systemId": "synth_113",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_114": {
    "id": "synth_114",
    "name": "미발견-114",
    "position": {
      "x": 0.8260897581042611,
      "y": 2.267001132310674
    },
    "zone": "neutral",
    "connections": [
      "synth_082",
      "synth_198",
      "synth_094"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_114_p",
        "systemId": "synth_114",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_115": {
    "id": "synth_115",
    "name": "미발견-115",
    "position": {
      "x": -0.8351789376517442,
      "y": 0.5797769894647933
    },
    "zone": "neutral",
    "connections": [
      "synth_083",
      "synth_167",
      "synth_147"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_115_p",
        "systemId": "synth_115",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_116": {
    "id": "synth_116",
    "name": "미발견-116",
    "position": {
      "x": 0.36589040711991233,
      "y": -1.0712159333786744
    },
    "zone": "neutral",
    "connections": [
      "synth_084",
      "synth_188",
      "synth_168"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_116_p",
        "systemId": "synth_116",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_117": {
    "id": "synth_117",
    "name": "미발견-117",
    "position": {
      "x": 2.064214816806935,
      "y": 0.48350582805380693
    },
    "zone": "neutral",
    "connections": [
      "synth_169",
      "synth_085",
      "synth_157"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_117_p",
        "systemId": "synth_117",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_118": {
    "id": "synth_118",
    "name": "미발견-118",
    "position": {
      "x": 0.36498443257983665,
      "y": 2.0459151033702967
    },
    "zone": "neutral",
    "connections": [
      "synth_150",
      "synth_170",
      "synth_086"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_118_p",
        "systemId": "synth_118",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_119": {
    "id": "synth_119",
    "name": "미발견-119",
    "position": {
      "x": -1.3825554430906366,
      "y": 0.506617580815742
    },
    "zone": "neutral",
    "connections": [
      "synth_171",
      "synth_099",
      "synth_139"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_119_p",
        "systemId": "synth_119",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_120": {
    "id": "synth_120",
    "name": "미발견-120",
    "position": {
      "x": 0.8546369977206584,
      "y": -1.3455513272492035
    },
    "zone": "neutral",
    "connections": [
      "synth_204",
      "synth_100",
      "synth_172"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_120_p",
        "systemId": "synth_120",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_121": {
    "id": "synth_121",
    "name": "미발견-121",
    "position": {
      "x": 2.5794003537281087,
      "y": 0.28069536149402646
    },
    "zone": "neutral",
    "connections": [
      "synth_205",
      "synth_101"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_121_p",
        "systemId": "synth_121",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_122": {
    "id": "synth_122",
    "name": "미발견-122",
    "position": {
      "x": 0.817738066801784,
      "y": 1.8682033984959543
    },
    "zone": "neutral",
    "connections": [
      "synth_206",
      "synth_142",
      "synth_090"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_122_p",
        "systemId": "synth_122",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_123": {
    "id": "synth_123",
    "name": "미발견-123",
    "position": {
      "x": -0.9216303254443065,
      "y": 0.24326267412924943
    },
    "zone": "neutral",
    "connections": [
      "synth_175",
      "synth_091",
      "synth_103"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_123_p",
        "systemId": "synth_123",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_124": {
    "id": "synth_124",
    "name": "미발견-124",
    "position": {
      "x": 0.677945130791487,
      "y": -0.8921420771937576
    },
    "zone": "neutral",
    "connections": [
      "synth_092",
      "synth_196"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_124_p",
        "systemId": "synth_124",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_125": {
    "id": "synth_125",
    "name": "미발견-125",
    "position": {
      "x": 2.3406893354951595,
      "y": 0.708869285741824
    },
    "zone": "neutral",
    "connections": [
      "synth_209",
      "synth_093"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_125_p",
        "systemId": "synth_125",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_126": {
    "id": "synth_126",
    "name": "미발견-126",
    "position": {
      "x": 0.5581329154147002,
      "y": 2.344575015561844
    },
    "zone": "neutral",
    "connections": [
      "synth_210",
      "synth_178",
      "synth_158"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_126_p",
        "systemId": "synth_126",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_127": {
    "id": "synth_127",
    "name": "미발견-127",
    "position": {
      "x": -1.1145248097779643,
      "y": 0.7052795123795137
    },
    "zone": "neutral",
    "connections": [
      "synth_211",
      "synth_107",
      "synth_095"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_127_p",
        "systemId": "synth_127",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_128": {
    "id": "synth_128",
    "name": "미발견-128",
    "position": {
      "x": 0.4375371659546143,
      "y": -1.3659810887148383
    },
    "zone": "neutral",
    "connections": [
      "synth_160",
      "synth_180",
      "synth_096"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_128_p",
        "systemId": "synth_128",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_129": {
    "id": "synth_129",
    "name": "미발견-129",
    "position": {
      "x": 2.1478514054247118,
      "y": 0.261445454479011
    },
    "zone": "neutral",
    "connections": [
      "synth_181",
      "synth_097",
      "synth_109"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_129_p",
        "systemId": "synth_129",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_130": {
    "id": "synth_130",
    "name": "미발견-130",
    "position": {
      "x": 0.4694541307540669,
      "y": 1.8469082179392546
    },
    "zone": "neutral",
    "connections": [
      "synth_162",
      "synth_202",
      "synth_098"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_130_p",
        "systemId": "synth_130",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_131": {
    "id": "synth_131",
    "name": "미발견-131",
    "position": {
      "x": -1.3368737792632852,
      "y": 0.3112357201008238
    },
    "zone": "neutral",
    "connections": [
      "synth_183",
      "synth_163",
      "synth_099"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_131_p",
        "systemId": "synth_131",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_132": {
    "id": "synth_132",
    "name": "미발견-132",
    "position": {
      "x": 0.9521576411328734,
      "y": -1.131913587565133
    },
    "zone": "neutral",
    "connections": [
      "synth_216",
      "synth_152",
      "synth_080"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_132_p",
        "systemId": "synth_132",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_133": {
    "id": "synth_133",
    "name": "미발견-133",
    "position": {
      "x": 2.6811588850778274,
      "y": 0.49668733182224967
    },
    "zone": "neutral",
    "connections": [
      "synth_153",
      "synth_185",
      "synth_081"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_133_p",
        "systemId": "synth_133",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_134": {
    "id": "synth_134",
    "name": "미발견-134",
    "position": {
      "x": 0.9492921263318014,
      "y": 2.1461209055331625
    },
    "zone": "neutral",
    "connections": [
      "synth_166",
      "synth_186",
      "synth_102"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_134_p",
        "systemId": "synth_134",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_135": {
    "id": "synth_135",
    "name": "미발견-135",
    "position": {
      "x": -0.7502663328895527,
      "y": 0.4617398167168023
    },
    "zone": "neutral",
    "connections": [
      "synth_187",
      "synth_167",
      "synth_219"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_135_p",
        "systemId": "synth_135",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_136": {
    "id": "synth_136",
    "name": "미발견-136",
    "position": {
      "x": 0.4298420319456859,
      "y": -0.9484838567596858
    },
    "zone": "neutral",
    "connections": [
      "synth_168",
      "synth_176",
      "synth_104"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_136_p",
        "systemId": "synth_136",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_137": {
    "id": "synth_137",
    "name": "미발견-137",
    "position": {
      "x": 2.1251601798267497,
      "y": 0.6485587282144301
    },
    "zone": "neutral",
    "connections": [
      "synth_105",
      "synth_157",
      "synth_085"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_137_p",
        "systemId": "synth_137",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_138": {
    "id": "synth_138",
    "name": "미발견-138",
    "position": {
      "x": 0.357230775022005,
      "y": 2.2056480472034603
    },
    "zone": "neutral",
    "connections": [
      "synth_222",
      "synth_106",
      "synth_190"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_138_p",
        "systemId": "synth_138",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_139": {
    "id": "synth_139",
    "name": "미발견-139",
    "position": {
      "x": -1.3716059438522896,
      "y": 0.6004210220339864
    },
    "zone": "neutral",
    "connections": [
      "synth_171",
      "synth_119",
      "synth_223"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_139_p",
        "systemId": "synth_139",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_140": {
    "id": "synth_140",
    "name": "미발견-140",
    "position": {
      "x": 0.6969726198403938,
      "y": -1.4597853686643927
    },
    "zone": "neutral",
    "connections": [
      "synth_192",
      "synth_224",
      "synth_088"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_140_p",
        "systemId": "synth_140",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_141": {
    "id": "synth_141",
    "name": "미발견-141",
    "position": {
      "x": 2.4350276392059165,
      "y": 0.19273739973670734
    },
    "zone": "neutral",
    "connections": [
      "synth_161",
      "synth_173",
      "synth_089"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_141_p",
        "systemId": "synth_141",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_142": {
    "id": "synth_142",
    "name": "미발견-142",
    "position": {
      "x": 0.7378148222614767,
      "y": 1.790291663839004
    },
    "zone": "neutral",
    "connections": [
      "synth_214",
      "synth_090",
      "synth_122"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_142_p",
        "systemId": "synth_142",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_143": {
    "id": "synth_143",
    "name": "미발견-143",
    "position": {
      "x": -1.0912883180690396,
      "y": 0.1801706440868686
    },
    "zone": "neutral",
    "connections": [
      "synth_111",
      "synth_203",
      "synth_195"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_143_p",
        "systemId": "synth_143",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_144": {
    "id": "synth_144",
    "name": "미발견-144",
    "position": {
      "x": 0.7972910502297731,
      "y": -0.9019767292950222
    },
    "zone": "neutral",
    "connections": [
      "synth_228",
      "synth_092",
      "synth_184"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_144_p",
        "systemId": "synth_144",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_145": {
    "id": "synth_145",
    "name": "미발견-145",
    "position": {
      "x": 2.5564246612638306,
      "y": 0.6935154979293274
    },
    "zone": "neutral",
    "connections": [
      "synth_217",
      "synth_113",
      "synth_093"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_145_p",
        "systemId": "synth_145",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_146": {
    "id": "synth_146",
    "name": "미발견-146",
    "position": {
      "x": 0.7589189093400432,
      "y": 2.3581473190828737
    },
    "zone": "neutral",
    "connections": [
      "synth_218",
      "synth_230",
      "synth_094"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_146_p",
        "systemId": "synth_146",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_147": {
    "id": "synth_147",
    "name": "미발견-147",
    "position": {
      "x": -0.8712187300029018,
      "y": 0.6813196869981469
    },
    "zone": "neutral",
    "connections": [
      "synth_179",
      "synth_199",
      "synth_115"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_147_p",
        "systemId": "synth_147",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_148": {
    "id": "synth_148",
    "name": "미발견-148",
    "position": {
      "x": 0.3167658302464921,
      "y": -1.217369217180452
    },
    "zone": "neutral",
    "connections": [
      "synth_200",
      "synth_220",
      "synth_096"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_148_p",
        "systemId": "synth_148",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_149": {
    "id": "synth_149",
    "name": "미발견-149",
    "position": {
      "x": 2.0346044864352018,
      "y": 0.35555374392387956
    },
    "zone": "neutral",
    "connections": [
      "synth_189",
      "synth_097"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_149_p",
        "systemId": "synth_149",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_150": {
    "id": "synth_150",
    "name": "미발견-150",
    "position": {
      "x": 0.32256831578521494,
      "y": 1.966537064620118
    },
    "zone": "neutral",
    "connections": [
      "synth_118",
      "synth_234",
      "synth_098"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_150_p",
        "systemId": "synth_150",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_151": {
    "id": "synth_151",
    "name": "미발견-151",
    "position": {
      "x": -1.4375340595394908,
      "y": 0.4193046423570812
    },
    "zone": "neutral",
    "connections": [
      "synth_099",
      "synth_235"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_151_p",
        "systemId": "synth_151",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_152": {
    "id": "synth_152",
    "name": "미발견-152",
    "position": {
      "x": 0.9690428200667582,
      "y": -1.2618126165978931
    },
    "zone": "neutral",
    "connections": [
      "synth_100",
      "synth_236",
      "synth_132"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_152_p",
        "systemId": "synth_152",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_153": {
    "id": "synth_153",
    "name": "미발견-153",
    "position": {
      "x": 2.722352507539558,
      "y": 0.4117974621437068
    },
    "zone": "neutral",
    "connections": [
      "synth_225",
      "synth_133",
      "synth_101"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_153_p",
        "systemId": "synth_153",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_154": {
    "id": "synth_154",
    "name": "미발견-154",
    "position": {
      "x": 0.9311989514234598,
      "y": 1.92571120518475
    },
    "zone": "neutral",
    "connections": [
      "synth_226",
      "synth_174"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_154_p",
        "systemId": "synth_154",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_155": {
    "id": "synth_155",
    "name": "미발견-155",
    "position": {
      "x": -0.7660788028645844,
      "y": 0.31151512081888477
    },
    "zone": "neutral",
    "connections": [
      "synth_103",
      "synth_175",
      "synth_207"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_155_p",
        "systemId": "synth_155",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_156": {
    "id": "synth_156",
    "name": "미발견-156",
    "position": {
      "x": 0.5576777260095646,
      "y": -0.8566517528876699
    },
    "zone": "neutral",
    "connections": [
      "synth_104",
      "synth_208",
      "synth_176"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_156_p",
        "systemId": "synth_156",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_157": {
    "id": "synth_157",
    "name": "미발견-157",
    "position": {
      "x": 2.0305560215344456,
      "y": 0.5951310138876493
    },
    "zone": "neutral",
    "connections": [
      "synth_137",
      "synth_169",
      "synth_117"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_157_p",
        "systemId": "synth_157",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_158": {
    "id": "synth_158",
    "name": "미발견-158",
    "position": {
      "x": 0.46153011788207854,
      "y": 2.344409452025382
    },
    "zone": "neutral",
    "connections": [
      "synth_210",
      "synth_106",
      "synth_126"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_158_p",
        "systemId": "synth_158",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_159": {
    "id": "synth_159",
    "name": "미발견-159",
    "position": {
      "x": -1.2733967779317863,
      "y": 0.7114583628971615
    },
    "zone": "neutral",
    "connections": [
      "synth_231",
      "synth_107",
      "synth_191"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_159_p",
        "systemId": "synth_159",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_160": {
    "id": "synth_160",
    "name": "미발견-160",
    "position": {
      "x": 0.5026927365518724,
      "y": -1.4594961848334111
    },
    "zone": "neutral",
    "connections": [
      "synth_108",
      "synth_212",
      "synth_128"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_160_p",
        "systemId": "synth_160",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_161": {
    "id": "synth_161",
    "name": "미발견-161",
    "position": {
      "x": 2.3508619380323923,
      "y": 0.16086695254622224
    },
    "zone": "neutral",
    "connections": [
      "synth_277",
      "synth_141",
      "synth_089"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_161_p",
        "systemId": "synth_161",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_162": {
    "id": "synth_162",
    "name": "미발견-162",
    "position": {
      "x": 0.5189324020326452,
      "y": 1.7717290940333097
    },
    "zone": "neutral",
    "connections": [
      "synth_130",
      "synth_266",
      "synth_110"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_162_p",
        "systemId": "synth_162",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_163": {
    "id": "synth_163",
    "name": "미발견-163",
    "position": {
      "x": -1.3029730958095613,
      "y": 0.2234885633195598
    },
    "zone": "neutral",
    "connections": [
      "synth_131"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_163_p",
        "systemId": "synth_163",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_164": {
    "id": "synth_164",
    "name": "미발견-164",
    "position": {
      "x": 0.9476809256667442,
      "y": -1.0107689853775723
    },
    "zone": "neutral",
    "connections": [
      "synth_112",
      "synth_248",
      "synth_268"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_164_p",
        "systemId": "synth_164",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_165": {
    "id": "synth_165",
    "name": "미발견-165",
    "position": {
      "x": 2.470457551638806,
      "y": 0.7541348151214061
    },
    "zone": "neutral",
    "connections": [
      "synth_281",
      "synth_229",
      "synth_217"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_165_p",
        "systemId": "synth_165",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_166": {
    "id": "synth_166",
    "name": "미발견-166",
    "position": {
      "x": 0.9455656673022235,
      "y": 2.239880482353323
    },
    "zone": "neutral",
    "connections": [
      "synth_134",
      "synth_250",
      "synth_238"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_166_p",
        "systemId": "synth_166",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_167": {
    "id": "synth_167",
    "name": "미발견-167",
    "position": {
      "x": -0.7327750304377594,
      "y": 0.560338163609071
    },
    "zone": "neutral",
    "connections": [
      "synth_219",
      "synth_135",
      "synth_115"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_167_p",
        "systemId": "synth_167",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_168": {
    "id": "synth_168",
    "name": "미발견-168",
    "position": {
      "x": 0.34395590923948,
      "y": -0.9753831862392438
    },
    "zone": "neutral",
    "connections": [
      "synth_136",
      "synth_272",
      "synth_116"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_168_p",
        "systemId": "synth_168",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_169": {
    "id": "synth_169",
    "name": "미발견-169",
    "position": {
      "x": 1.9751604949258084,
      "y": 0.4965184278784327
    },
    "zone": "neutral",
    "connections": [
      "synth_117",
      "synth_157",
      "synth_285"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_169_p",
        "systemId": "synth_169",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_170": {
    "id": "synth_170",
    "name": "미발견-170",
    "position": {
      "x": 0.289701950271479,
      "y": 2.104236625356957
    },
    "zone": "neutral",
    "connections": [
      "synth_118",
      "synth_222",
      "synth_086"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_170_p",
        "systemId": "synth_170",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_171": {
    "id": "synth_171",
    "name": "미발견-171",
    "position": {
      "x": -1.4531814529780451,
      "y": 0.5624022856601173
    },
    "zone": "neutral",
    "connections": [
      "synth_119",
      "synth_243",
      "synth_139"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_171_p",
        "systemId": "synth_171",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_172": {
    "id": "synth_172",
    "name": "미발견-172",
    "position": {
      "x": 0.823605102880204,
      "y": -1.4580466310401086
    },
    "zone": "neutral",
    "connections": [
      "synth_224",
      "synth_256",
      "synth_120"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_172_p",
        "systemId": "synth_172",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_173": {
    "id": "synth_173",
    "name": "미발견-173",
    "position": {
      "x": 2.5293145457009745,
      "y": 0.18209596584992566
    },
    "zone": "neutral",
    "connections": [
      "synth_221",
      "synth_141",
      "synth_233"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_173_p",
        "systemId": "synth_173",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_174": {
    "id": "synth_174",
    "name": "미발견-174",
    "position": {
      "x": 0.9909848707690566,
      "y": 2.0015531715706274
    },
    "zone": "neutral",
    "connections": [
      "synth_258",
      "synth_186",
      "synth_154"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_174_p",
        "systemId": "synth_174",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_175": {
    "id": "synth_175",
    "name": "미발견-175",
    "position": {
      "x": -0.8197391512401048,
      "y": 0.22973990301947503
    },
    "zone": "neutral",
    "connections": [
      "synth_227",
      "synth_155",
      "synth_123"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_175_p",
        "systemId": "synth_175",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_176": {
    "id": "synth_176",
    "name": "미발견-176",
    "position": {
      "x": 0.44620776197099105,
      "y": -0.8589947550973869
    },
    "zone": "neutral",
    "connections": [
      "synth_136",
      "synth_240",
      "synth_156"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_176_p",
        "systemId": "synth_176",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_177": {
    "id": "synth_177",
    "name": "미발견-177",
    "position": {
      "x": 2.1851808718946515,
      "y": 0.7323021617395813
    },
    "zone": "neutral",
    "connections": [
      "synth_261",
      "synth_105",
      "synth_209"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_177_p",
        "systemId": "synth_177",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_178": {
    "id": "synth_178",
    "name": "미발견-178",
    "position": {
      "x": 0.603106615978075,
      "y": 2.4227091981433198
    },
    "zone": "neutral",
    "connections": [
      "synth_126",
      "synth_282",
      "synth_270"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_178_p",
        "systemId": "synth_178",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_179": {
    "id": "synth_179",
    "name": "미발견-179",
    "position": {
      "x": -0.9339798477281435,
      "y": 0.745825738093865
    },
    "zone": "neutral",
    "connections": [
      "synth_147",
      "synth_263",
      "synth_095"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_179_p",
        "systemId": "synth_179",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_180": {
    "id": "synth_180",
    "name": "미발견-180",
    "position": {
      "x": 0.3232494492078816,
      "y": -1.3298301362359568
    },
    "zone": "neutral",
    "connections": [
      "synth_232",
      "synth_128",
      "synth_096"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_180_p",
        "systemId": "synth_180",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_181": {
    "id": "synth_181",
    "name": "미발견-181",
    "position": {
      "x": 2.0584389238774845,
      "y": 0.25118182260203115
    },
    "zone": "neutral",
    "connections": [
      "synth_265",
      "synth_129",
      "synth_253"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_181_p",
        "systemId": "synth_181",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_182": {
    "id": "synth_182",
    "name": "미발견-182",
    "position": {
      "x": 0.35921985482707025,
      "y": 1.848910839632112
    },
    "zone": "neutral",
    "connections": [
      "synth_202",
      "synth_098"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_182_p",
        "systemId": "synth_182",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_183": {
    "id": "synth_183",
    "name": "미발견-183",
    "position": {
      "x": -1.4268640731852742,
      "y": 0.31040622845724036
    },
    "zone": "neutral",
    "connections": [
      "synth_267",
      "synth_131",
      "synth_255"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_183_p",
        "systemId": "synth_183",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_184": {
    "id": "synth_184",
    "name": "미발견-184",
    "position": {
      "x": 0.893735394957544,
      "y": -0.9076222638638433
    },
    "zone": "neutral",
    "connections": [
      "synth_144",
      "synth_112"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_184_p",
        "systemId": "synth_184",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_185": {
    "id": "synth_185",
    "name": "미발견-185",
    "position": {
      "x": 2.74476323225521,
      "y": 0.5722323108167549
    },
    "zone": "neutral",
    "connections": [
      "synth_269",
      "synth_237",
      "synth_133"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_185_p",
        "systemId": "synth_185",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_186": {
    "id": "synth_186",
    "name": "미발견-186",
    "position": {
      "x": 1.021685333209123,
      "y": 2.0861509141228987
    },
    "zone": "neutral",
    "connections": [
      "synth_174",
      "synth_134",
      "synth_278"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_186_p",
        "systemId": "synth_186",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_187": {
    "id": "synth_187",
    "name": "미발견-187",
    "position": {
      "x": -0.6705095305272184,
      "y": 0.42009138420108866
    },
    "zone": "neutral",
    "connections": [
      "synth_259",
      "synth_135",
      "synth_207"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_187_p",
        "systemId": "synth_187",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_188": {
    "id": "synth_188",
    "name": "미발견-188",
    "position": {
      "x": 0.27143461289249204,
      "y": -1.0612609224656255
    },
    "zone": "neutral",
    "connections": [
      "synth_116",
      "synth_200",
      "synth_304"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_188_p",
        "systemId": "synth_188",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_189": {
    "id": "synth_189",
    "name": "미발견-189",
    "position": {
      "x": 1.9453909017542645,
      "y": 0.34369960710779024
    },
    "zone": "neutral",
    "connections": [
      "synth_149",
      "synth_305",
      "synth_253"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_189_p",
        "systemId": "synth_189",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_190": {
    "id": "synth_190",
    "name": "미발견-190",
    "position": {
      "x": 0.3536245623617376,
      "y": 2.3126361792178116
    },
    "zone": "neutral",
    "connections": [
      "synth_242",
      "synth_294",
      "synth_138"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_190_p",
        "systemId": "synth_190",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_191": {
    "id": "synth_191",
    "name": "미발견-191",
    "position": {
      "x": -1.3665991955718346,
      "y": 0.6983751254457963
    },
    "zone": "neutral",
    "connections": [
      "synth_159",
      "synth_275",
      "synth_223"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_191_p",
        "systemId": "synth_191",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_192": {
    "id": "synth_192",
    "name": "미발견-192",
    "position": {
      "x": 0.6206314487911105,
      "y": -1.5072821696818224
    },
    "zone": "neutral",
    "connections": [
      "synth_244",
      "synth_140",
      "synth_252"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_192_p",
        "systemId": "synth_192",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_193": {
    "id": "synth_193",
    "name": "미발견-193",
    "position": {
      "x": 2.236578935689856,
      "y": 0.14356035519332377
    },
    "zone": "neutral",
    "connections": [
      "synth_297",
      "synth_201",
      "synth_109"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_193_p",
        "systemId": "synth_193",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_194": {
    "id": "synth_194",
    "name": "미발견-194",
    "position": {
      "x": 0.6097204299962408,
      "y": 1.7209925816099205
    },
    "zone": "neutral",
    "connections": [
      "synth_246",
      "synth_110"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_194_p",
        "systemId": "synth_194",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_195": {
    "id": "synth_195",
    "name": "미발견-195",
    "position": {
      "x": -1.1841830432314695,
      "y": 0.15007969671007165
    },
    "zone": "neutral",
    "connections": [
      "synth_279",
      "synth_111",
      "synth_143"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_195_p",
        "systemId": "synth_195",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_196": {
    "id": "synth_196",
    "name": "미발견-196",
    "position": {
      "x": 0.7294621433777458,
      "y": -0.8080575018272703
    },
    "zone": "neutral",
    "connections": [
      "synth_228",
      "synth_208",
      "synth_124"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_196_p",
        "systemId": "synth_196",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_197": {
    "id": "synth_197",
    "name": "미발견-197",
    "position": {
      "x": 2.661064582145693,
      "y": 0.6820270125596146
    },
    "zone": "neutral",
    "connections": [
      "synth_237",
      "synth_257",
      "synth_113"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_197_p",
        "systemId": "synth_197",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_198": {
    "id": "synth_198",
    "name": "미발견-198",
    "position": {
      "x": 0.8867264131799939,
      "y": 2.3497097064801014
    },
    "zone": "neutral",
    "connections": [
      "synth_218",
      "synth_290",
      "synth_114"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_198_p",
        "systemId": "synth_198",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_199": {
    "id": "synth_199",
    "name": "미발견-199",
    "position": {
      "x": -0.7681703071614887,
      "y": 0.6731022560159728
    },
    "zone": "neutral",
    "connections": [
      "synth_239",
      "synth_271",
      "synth_147"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_199_p",
        "systemId": "synth_199",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_200": {
    "id": "synth_200",
    "name": "미발견-200",
    "position": {
      "x": 0.24252684019092707,
      "y": -1.166491202719453
    },
    "zone": "neutral",
    "connections": [
      "synth_148",
      "synth_220",
      "synth_188"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_200_p",
        "systemId": "synth_200",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_201": {
    "id": "synth_201",
    "name": "미발견-201",
    "position": {
      "x": 2.146938771773346,
      "y": 0.15149854496185655
    },
    "zone": "neutral",
    "connections": [
      "synth_193",
      "synth_349",
      "synth_313"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_201_p",
        "systemId": "synth_201",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_202": {
    "id": "synth_202",
    "name": "미발견-202",
    "position": {
      "x": 0.40583688669424445,
      "y": 1.770973446605591
    },
    "zone": "neutral",
    "connections": [
      "synth_182",
      "synth_306",
      "synth_130"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_202_p",
        "systemId": "synth_202",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_203": {
    "id": "synth_203",
    "name": "미발견-203",
    "position": {
      "x": -1.030625729176845,
      "y": 0.10682685089161738
    },
    "zone": "neutral",
    "connections": [
      "synth_215",
      "synth_143",
      "synth_279"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_203_p",
        "systemId": "synth_203",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_204": {
    "id": "synth_204",
    "name": "미발견-204",
    "position": {
      "x": 0.9436341428788082,
      "y": -1.402657212408284
    },
    "zone": "neutral",
    "connections": [
      "synth_296",
      "synth_236",
      "synth_120"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_204_p",
        "systemId": "synth_204",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_205": {
    "id": "synth_205",
    "name": "미발견-205",
    "position": {
      "x": 2.6657113851969814,
      "y": 0.23008901953652222
    },
    "zone": "neutral",
    "connections": [
      "synth_233",
      "synth_121",
      "synth_213"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_205_p",
        "systemId": "synth_205",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_206": {
    "id": "synth_206",
    "name": "미발견-206",
    "position": {
      "x": 0.9102792946039088,
      "y": 1.8124153518749992
    },
    "zone": "neutral",
    "connections": [
      "synth_226",
      "synth_298",
      "synth_122"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_206_p",
        "systemId": "synth_206",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_207": {
    "id": "synth_207",
    "name": "미발견-207",
    "position": {
      "x": -0.6689343718856702,
      "y": 0.33010772382243364
    },
    "zone": "neutral",
    "connections": [
      "synth_187",
      "synth_155"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_207_p",
        "systemId": "synth_207",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_208": {
    "id": "synth_208",
    "name": "미발견-208",
    "position": {
      "x": 0.6401096990749429,
      "y": -0.7985249121172446
    },
    "zone": "neutral",
    "connections": [
      "synth_196",
      "synth_260",
      "synth_156"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_208_p",
        "systemId": "synth_208",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_209": {
    "id": "synth_209",
    "name": "미발견-209",
    "position": {
      "x": 2.2683089994787444,
      "y": 0.7797603951293038
    },
    "zone": "neutral",
    "connections": [
      "synth_177",
      "synth_289",
      "synth_125"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_209_p",
        "systemId": "synth_209",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_210": {
    "id": "synth_210",
    "name": "미발견-210",
    "position": {
      "x": 0.5105586766039487,
      "y": 2.4209732599090192
    },
    "zone": "neutral",
    "connections": [
      "synth_126",
      "synth_270",
      "synth_158"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_210_p",
        "systemId": "synth_210",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_211": {
    "id": "synth_211",
    "name": "미발견-211",
    "position": {
      "x": -1.154566514249787,
      "y": 0.7868523992750215
    },
    "zone": "neutral",
    "connections": [
      "synth_315",
      "synth_127",
      "synth_251"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_211_p",
        "systemId": "synth_211",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_212": {
    "id": "synth_212",
    "name": "미발견-212",
    "position": {
      "x": 0.4042466334365687,
      "y": -1.4688181260955901
    },
    "zone": "neutral",
    "connections": [
      "synth_264",
      "synth_232",
      "synth_160"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_212_p",
        "systemId": "synth_212",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_213": {
    "id": "synth_213",
    "name": "미발견-213",
    "position": {
      "x": 2.7547487979304215,
      "y": 0.2806764904287148
    },
    "zone": "neutral",
    "connections": [
      "synth_309",
      "synth_205",
      "synth_325"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_213_p",
        "systemId": "synth_213",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_214": {
    "id": "synth_214",
    "name": "미발견-214",
    "position": {
      "x": 0.8088478749424388,
      "y": 1.7287867877190728
    },
    "zone": "neutral",
    "connections": [
      "synth_142",
      "synth_318"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_214_p",
        "systemId": "synth_214",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_215": {
    "id": "synth_215",
    "name": "미발견-215",
    "position": {
      "x": -0.9414711198530614,
      "y": 0.11913358155514124
    },
    "zone": "neutral",
    "connections": [
      "synth_203",
      "synth_307",
      "synth_227"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_215_p",
        "systemId": "synth_215",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_216": {
    "id": "synth_216",
    "name": "미발견-216",
    "position": {
      "x": 1.0448677016132222,
      "y": -1.1203518769919436
    },
    "zone": "neutral",
    "connections": [
      "synth_284",
      "synth_132",
      "synth_248"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_216_p",
        "systemId": "synth_216",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_217": {
    "id": "synth_217",
    "name": "미발견-217",
    "position": {
      "x": 2.5648514818364463,
      "y": 0.7836015159313047
    },
    "zone": "neutral",
    "connections": [
      "synth_257",
      "synth_145",
      "synth_165"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_217_p",
        "systemId": "synth_217",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_218": {
    "id": "synth_218",
    "name": "미발견-218",
    "position": {
      "x": 0.8271103578862787,
      "y": 2.4171243548135335
    },
    "zone": "neutral",
    "connections": [
      "synth_302",
      "synth_198",
      "synth_146"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_218_p",
        "systemId": "synth_218",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_219": {
    "id": "synth_219",
    "name": "미발견-219",
    "position": {
      "x": -0.6495763015405492,
      "y": 0.5185631174188721
    },
    "zone": "neutral",
    "connections": [
      "synth_303",
      "synth_167",
      "synth_135"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_219_p",
        "systemId": "synth_219",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_220": {
    "id": "synth_220",
    "name": "미발견-220",
    "position": {
      "x": 0.22512643348155137,
      "y": -1.2629245259093604
    },
    "zone": "neutral",
    "connections": [
      "synth_200",
      "synth_324",
      "synth_148"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_220_p",
        "systemId": "synth_220",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_221": {
    "id": "synth_221",
    "name": "미발견-221",
    "position": {
      "x": 2.494256005866936,
      "y": 0.09920233276574537
    },
    "zone": "neutral",
    "connections": [
      "synth_329",
      "synth_173",
      "synth_337"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_221_p",
        "systemId": "synth_221",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_222": {
    "id": "synth_222",
    "name": "미발견-222",
    "position": {
      "x": 0.2685427260564449,
      "y": 2.221568526616463
    },
    "zone": "neutral",
    "connections": [
      "synth_138",
      "synth_262",
      "synth_170"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_222_p",
        "systemId": "synth_222",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_223": {
    "id": "synth_223",
    "name": "미발견-223",
    "position": {
      "x": -1.4525003784838848,
      "y": 0.6540493143677996
    },
    "zone": "neutral",
    "connections": [
      "synth_295",
      "synth_191",
      "synth_139"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_223_p",
        "systemId": "synth_223",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_224": {
    "id": "synth_224",
    "name": "미발견-224",
    "position": {
      "x": 0.7711651089501015,
      "y": -1.5311899517831362
    },
    "zone": "neutral",
    "connections": [
      "synth_328",
      "synth_172",
      "synth_140"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_224_p",
        "systemId": "synth_224",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_225": {
    "id": "synth_225",
    "name": "미발견-225",
    "position": {
      "x": 2.81189416847632,
      "y": 0.38319538050174823
    },
    "zone": "neutral",
    "connections": [
      "synth_309",
      "synth_153",
      "synth_245"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_225_p",
        "systemId": "synth_225",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_226": {
    "id": "synth_226",
    "name": "미발견-226",
    "position": {
      "x": 0.9892562461831763,
      "y": 1.8566306540367612
    },
    "zone": "neutral",
    "connections": [
      "synth_310",
      "synth_154",
      "synth_206"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_226_p",
        "systemId": "synth_226",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_227": {
    "id": "synth_227",
    "name": "미발견-227",
    "position": {
      "x": -0.8551841813104379,
      "y": 0.1463823003177049
    },
    "zone": "neutral",
    "connections": [
      "synth_215",
      "synth_175",
      "synth_331"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_227_p",
        "systemId": "synth_227",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_228": {
    "id": "synth_228",
    "name": "미발견-228",
    "position": {
      "x": 0.8190493849940786,
      "y": -0.8146512366975556
    },
    "zone": "neutral",
    "connections": [
      "synth_196",
      "synth_280",
      "synth_144"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_228_p",
        "systemId": "synth_228",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_229": {
    "id": "synth_229",
    "name": "미발견-229",
    "position": {
      "x": 2.397143644513806,
      "y": 0.8065639113717703
    },
    "zone": "neutral",
    "connections": [
      "synth_333",
      "synth_165",
      "synth_289"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_229_p",
        "systemId": "synth_229",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_230": {
    "id": "synth_230",
    "name": "미발견-230",
    "position": {
      "x": 0.729023564632493,
      "y": 2.4536691684832848
    },
    "zone": "neutral",
    "connections": [
      "synth_334",
      "synth_146"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_230_p",
        "systemId": "synth_230",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_231": {
    "id": "synth_231",
    "name": "미발견-231",
    "position": {
      "x": -1.2587322950094573,
      "y": 0.8002142270523651
    },
    "zone": "neutral",
    "connections": [
      "synth_315",
      "synth_159",
      "synth_275"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_231_p",
        "systemId": "synth_231",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_232": {
    "id": "synth_232",
    "name": "미발견-232",
    "position": {
      "x": 0.32288416413395676,
      "y": -1.4291420948739038
    },
    "zone": "neutral",
    "connections": [
      "synth_212",
      "synth_180",
      "synth_316"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_232_p",
        "systemId": "synth_232",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_233": {
    "id": "synth_233",
    "name": "미발견-233",
    "position": {
      "x": 2.627452573405434,
      "y": 0.1486257559123951
    },
    "zone": "neutral",
    "connections": [
      "synth_205",
      "synth_317",
      "synth_173"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_233_p",
        "systemId": "synth_233",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_234": {
    "id": "synth_234",
    "name": "미발견-234",
    "position": {
      "x": 0.23090314076869906,
      "y": 1.991828264960514
    },
    "zone": "neutral",
    "connections": [
      "synth_338",
      "synth_274",
      "synth_150"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_234_p",
        "systemId": "synth_234",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_235": {
    "id": "synth_235",
    "name": "미발견-235",
    "position": {
      "x": -1.5372171546592068,
      "y": 0.3989976322733377
    },
    "zone": "neutral",
    "connections": [
      "synth_255",
      "synth_151",
      "synth_347"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_235_p",
        "systemId": "synth_235",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_236": {
    "id": "synth_236",
    "name": "미발견-236",
    "position": {
      "x": 1.0173523392337667,
      "y": -1.3509409092664015
    },
    "zone": "neutral",
    "connections": [
      "synth_340",
      "synth_204",
      "synth_152"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_236_p",
        "systemId": "synth_236",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_237": {
    "id": "synth_237",
    "name": "미발견-237",
    "position": {
      "x": 2.7492822559111523,
      "y": 0.6642096137720319
    },
    "zone": "neutral",
    "connections": [
      "synth_341",
      "synth_197",
      "synth_185"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_237_p",
        "systemId": "synth_237",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_238": {
    "id": "synth_238",
    "name": "미발견-238",
    "position": {
      "x": 1.0449733059274644,
      "y": 2.2194315489656855
    },
    "zone": "neutral",
    "connections": [
      "synth_354",
      "synth_166",
      "synth_250"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_238_p",
        "systemId": "synth_238",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_239": {
    "id": "synth_239",
    "name": "미발견-239",
    "position": {
      "x": -0.6798079707706686,
      "y": 0.6560113956726519
    },
    "zone": "neutral",
    "connections": [
      "synth_199"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_239_p",
        "systemId": "synth_239",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_240": {
    "id": "synth_240",
    "name": "미발견-240",
    "position": {
      "x": 0.3509495620665823,
      "y": -0.8616428714637514
    },
    "zone": "neutral",
    "connections": [
      "synth_300",
      "synth_176",
      "synth_320"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_240_p",
        "systemId": "synth_240",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_241": {
    "id": "synth_241",
    "name": "미발견-241",
    "position": {
      "x": 2.032903112117011,
      "y": 0.7186640170632715
    },
    "zone": "neutral",
    "connections": [
      "synth_261",
      "synth_293",
      "synth_365"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_241_p",
        "systemId": "synth_241",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_242": {
    "id": "synth_242",
    "name": "미발견-242",
    "position": {
      "x": 0.38457297103912513,
      "y": 2.397147693029027
    },
    "zone": "neutral",
    "connections": [
      "synth_190",
      "synth_322",
      "synth_294"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_242_p",
        "systemId": "synth_242",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_243": {
    "id": "synth_243",
    "name": "미발견-243",
    "position": {
      "x": -1.542241250390477,
      "y": 0.5494283643678181
    },
    "zone": "neutral",
    "connections": [
      "synth_171",
      "synth_335",
      "synth_327"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_243_p",
        "systemId": "synth_243",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_244": {
    "id": "synth_244",
    "name": "미발견-244",
    "position": {
      "x": 0.5396458737989226,
      "y": -1.546185645112699
    },
    "zone": "neutral",
    "connections": [
      "synth_264",
      "synth_192",
      "synth_348"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_244_p",
        "systemId": "synth_244",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_245": {
    "id": "synth_245",
    "name": "미발견-245",
    "position": {
      "x": 2.855034637081918,
      "y": 0.472577092327576
    },
    "zone": "neutral",
    "connections": [
      "synth_269",
      "synth_361",
      "synth_225"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_245_p",
        "systemId": "synth_245",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_246": {
    "id": "synth_246",
    "name": "미발견-246",
    "position": {
      "x": 0.7044048883162521,
      "y": 1.6785965741714537
    },
    "zone": "neutral",
    "connections": [
      "synth_330",
      "synth_318",
      "synth_194"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_246_p",
        "systemId": "synth_246",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_247": {
    "id": "synth_247",
    "name": "미발견-247",
    "position": {
      "x": -0.7101750928650161,
      "y": 0.20610053157171057
    },
    "zone": "neutral",
    "connections": [
      "synth_323"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_247_p",
        "systemId": "synth_247",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_248": {
    "id": "synth_248",
    "name": "미발견-248",
    "position": {
      "x": 1.0504356702828286,
      "y": -1.0247779877534906
    },
    "zone": "neutral",
    "connections": [
      "synth_216",
      "synth_164"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_248_p",
        "systemId": "synth_248",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_249": {
    "id": "synth_249",
    "name": "미발견-249",
    "position": {
      "x": 1.8786551067494535,
      "y": 0.5234492312948884
    },
    "zone": "neutral",
    "connections": [
      "synth_389",
      "synth_357",
      "synth_273"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_249_p",
        "systemId": "synth_249",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_250": {
    "id": "synth_250",
    "name": "미발견-250",
    "position": {
      "x": 0.9904921673314775,
      "y": 2.3240297535482073
    },
    "zone": "neutral",
    "connections": [
      "synth_166",
      "synth_386",
      "synth_238"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_250_p",
        "systemId": "synth_250",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_251": {
    "id": "synth_251",
    "name": "미발견-251",
    "position": {
      "x": -1.0730308730583125,
      "y": 0.8302449309597083
    },
    "zone": "neutral",
    "connections": [
      "synth_367",
      "synth_211",
      "synth_263"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_251_p",
        "systemId": "synth_251",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_252": {
    "id": "synth_252",
    "name": "미발견-252",
    "position": {
      "x": 0.665631623189146,
      "y": -1.585213023319594
    },
    "zone": "neutral",
    "connections": [
      "synth_192",
      "synth_368",
      "synth_376"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_252_p",
        "systemId": "synth_252",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_253": {
    "id": "synth_253",
    "name": "미발견-253",
    "position": {
      "x": 1.9541141742920258,
      "y": 0.24788575230071289
    },
    "zone": "neutral",
    "connections": [
      "synth_305",
      "synth_189",
      "synth_181"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_253_p",
        "systemId": "synth_253",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_254": {
    "id": "synth_254",
    "name": "미발견-254",
    "position": {
      "x": 0.23916513030959616,
      "y": 1.878036751524631
    },
    "zone": "neutral",
    "connections": [
      "synth_346",
      "synth_390"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_254_p",
        "systemId": "synth_254",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_255": {
    "id": "synth_255",
    "name": "미발견-255",
    "position": {
      "x": -1.5263269063499763,
      "y": 0.30965893689771234
    },
    "zone": "neutral",
    "connections": [
      "synth_235",
      "synth_267",
      "synth_183"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_255_p",
        "systemId": "synth_255",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_256": {
    "id": "synth_256",
    "name": "미발견-256",
    "position": {
      "x": 0.9054517553883242,
      "y": -1.5022753908852675
    },
    "zone": "neutral",
    "connections": [
      "synth_296",
      "synth_172",
      "synth_380"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_256_p",
        "systemId": "synth_256",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_257": {
    "id": "synth_257",
    "name": "미발견-257",
    "position": {
      "x": 2.6548470330467073,
      "y": 0.7827172389099427
    },
    "zone": "neutral",
    "connections": [
      "synth_217",
      "synth_321",
      "synth_197"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_257_p",
        "systemId": "synth_257",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_258": {
    "id": "synth_258",
    "name": "미발견-258",
    "position": {
      "x": 1.0694862874461202,
      "y": 1.957617047633423
    },
    "zone": "neutral",
    "connections": [
      "synth_362",
      "synth_174",
      "synth_278"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_258_p",
        "systemId": "synth_258",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_259": {
    "id": "synth_259",
    "name": "미발견-259",
    "position": {
      "x": -0.5831513091320558,
      "y": 0.3985974116593183
    },
    "zone": "neutral",
    "connections": [
      "synth_311",
      "synth_187",
      "synth_319"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_259_p",
        "systemId": "synth_259",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_260": {
    "id": "synth_260",
    "name": "미발견-260",
    "position": {
      "x": 0.5674541229022669,
      "y": -0.7455575900438708
    },
    "zone": "neutral",
    "connections": [
      "synth_208",
      "synth_292"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_260_p",
        "systemId": "synth_260",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_261": {
    "id": "synth_261",
    "name": "미발견-261",
    "position": {
      "x": 2.1047956827585845,
      "y": 0.7727537312322847
    },
    "zone": "neutral",
    "connections": [
      "synth_345",
      "synth_241",
      "synth_177"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_261_p",
        "systemId": "synth_261",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_262": {
    "id": "synth_262",
    "name": "미발견-262",
    "position": {
      "x": 0.18610826559859206,
      "y": 2.1707906404007566
    },
    "zone": "neutral",
    "connections": [
      "synth_366",
      "synth_222",
      "synth_442"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_262_p",
        "systemId": "synth_262",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_263": {
    "id": "synth_263",
    "name": "미발견-263",
    "position": {
      "x": -0.9749342177111237,
      "y": 0.8259676628610069
    },
    "zone": "neutral",
    "connections": [
      "synth_179",
      "synth_387",
      "synth_251"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_263_p",
        "systemId": "synth_263",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_264": {
    "id": "synth_264",
    "name": "미발견-264",
    "position": {
      "x": 0.44981472636188874,
      "y": -1.5463170783717652
    },
    "zone": "neutral",
    "connections": [
      "synth_388",
      "synth_244",
      "synth_212"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_264_p",
        "systemId": "synth_264",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_265": {
    "id": "synth_265",
    "name": "미발견-265",
    "position": {
      "x": 2.0177574188295364,
      "y": 0.1709019747728237
    },
    "zone": "neutral",
    "connections": [
      "synth_349",
      "synth_181",
      "synth_401"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_265_p",
        "systemId": "synth_265",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_266": {
    "id": "synth_266",
    "name": "미발견-266",
    "position": {
      "x": 0.4753407149598291,
      "y": 1.69177961178996
    },
    "zone": "neutral",
    "connections": [
      "synth_350",
      "synth_162",
      "synth_286"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_266_p",
        "systemId": "synth_266",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_267": {
    "id": "synth_267",
    "name": "미발견-267",
    "position": {
      "x": -1.472387248207061,
      "y": 0.23278979794665489
    },
    "zone": "neutral",
    "connections": [
      "synth_359",
      "synth_183",
      "synth_255"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_267_p",
        "systemId": "synth_267",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_268": {
    "id": "synth_268",
    "name": "미발견-268",
    "position": {
      "x": 1.0086358766680483,
      "y": -0.926321673550324
    },
    "zone": "neutral",
    "connections": [
      "synth_352",
      "synth_332",
      "synth_164"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_268_p",
        "systemId": "synth_268",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_269": {
    "id": "synth_269",
    "name": "미발견-269",
    "position": {
      "x": 2.834644358562952,
      "y": 0.5676521762096611
    },
    "zone": "neutral",
    "connections": [
      "synth_373",
      "synth_185",
      "synth_245"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_269_p",
        "systemId": "synth_269",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_270": {
    "id": "synth_270",
    "name": "미발견-270",
    "position": {
      "x": 0.5487820436165189,
      "y": 2.5024531602033586
    },
    "zone": "neutral",
    "connections": [
      "synth_210",
      "synth_282",
      "synth_178"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_270_p",
        "systemId": "synth_270",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_271": {
    "id": "synth_271",
    "name": "미발견-271",
    "position": {
      "x": -0.794104437089877,
      "y": 0.7708951010498563
    },
    "zone": "neutral",
    "connections": [
      "synth_355",
      "synth_283",
      "synth_199"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_271_p",
        "systemId": "synth_271",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_272": {
    "id": "synth_272",
    "name": "미발견-272",
    "position": {
      "x": 0.26807894492548107,
      "y": -0.9250172278060322
    },
    "zone": "neutral",
    "connections": [
      "synth_320",
      "synth_168",
      "synth_304"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_272_p",
        "systemId": "synth_272",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_273": {
    "id": "synth_273",
    "name": "미발견-273",
    "position": {
      "x": 1.9006575670441166,
      "y": 0.61667131972477
    },
    "zone": "neutral",
    "connections": [
      "synth_357",
      "synth_377",
      "synth_249"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_273_p",
        "systemId": "synth_273",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_274": {
    "id": "synth_274",
    "name": "미발견-274",
    "position": {
      "x": 0.17157850106353578,
      "y": 2.061515028345237
    },
    "zone": "neutral",
    "connections": [
      "synth_378",
      "synth_338",
      "synth_234"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_274_p",
        "systemId": "synth_274",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_275": {
    "id": "synth_275",
    "name": "미발견-275",
    "position": {
      "x": -1.3482735886451596,
      "y": 0.7914699657846698
    },
    "zone": "neutral",
    "connections": [
      "synth_231",
      "synth_379",
      "synth_191"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_275_p",
        "systemId": "synth_275",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_276": {
    "id": "synth_276",
    "name": "미발견-276",
    "position": {
      "x": 1.1056831870682695,
      "y": -1.266989273599134
    },
    "zone": "neutral",
    "connections": [
      "synth_392"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_276_p",
        "systemId": "synth_276",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_277": {
    "id": "synth_277",
    "name": "미발견-277",
    "position": {
      "x": 2.3635419215782156,
      "y": 0.07178153730524145
    },
    "zone": "neutral",
    "connections": [
      "synth_297",
      "synth_337",
      "synth_161"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_277_p",
        "systemId": "synth_277",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_278": {
    "id": "synth_278",
    "name": "미발견-278",
    "position": {
      "x": 1.1098731899058127,
      "y": 2.0502156464614165
    },
    "zone": "neutral",
    "connections": [
      "synth_342",
      "synth_186",
      "synth_258"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_278_p",
        "systemId": "synth_278",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_279": {
    "id": "synth_279",
    "name": "미발견-279",
    "position": {
      "x": -1.1301711196692947,
      "y": 0.07808867100846077
    },
    "zone": "neutral",
    "connections": [
      "synth_371",
      "synth_195",
      "synth_203"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_279_p",
        "systemId": "synth_279",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_280": {
    "id": "synth_280",
    "name": "미발견-280",
    "position": {
      "x": 0.9088865782690946,
      "y": -0.8154877347948459
    },
    "zone": "neutral",
    "connections": [
      "synth_228",
      "synth_332",
      "synth_416"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_280_p",
        "systemId": "synth_280",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_281": {
    "id": "synth_281",
    "name": "미발견-281",
    "position": {
      "x": 2.4804021617063747,
      "y": 0.8435536850331357
    },
    "zone": "neutral",
    "connections": [
      "synth_353",
      "synth_333",
      "synth_165"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_281_p",
        "systemId": "synth_281",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_282": {
    "id": "synth_282",
    "name": "미발견-282",
    "position": {
      "x": 0.6443170305836466,
      "y": 2.509913074585958
    },
    "zone": "neutral",
    "connections": [
      "synth_398",
      "synth_270",
      "synth_178"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_282_p",
        "systemId": "synth_282",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_283": {
    "id": "synth_283",
    "name": "미발견-283",
    "position": {
      "x": -0.8718212811744517,
      "y": 0.8176350131307564
    },
    "zone": "neutral",
    "connections": [
      "synth_271",
      "synth_395",
      "synth_399"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_283_p",
        "systemId": "synth_283",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_284": {
    "id": "synth_284",
    "name": "미발견-284",
    "position": {
      "x": 1.1327440802382485,
      "y": -1.1012540458274598
    },
    "zone": "neutral",
    "connections": [
      "synth_404",
      "synth_384",
      "synth_216"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_284_p",
        "systemId": "synth_284",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_285": {
    "id": "synth_285",
    "name": "미발견-285",
    "position": {
      "x": 1.8618701888806428,
      "y": 0.4230469021337588
    },
    "zone": "neutral",
    "connections": [
      "synth_369",
      "synth_169"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_285_p",
        "systemId": "synth_285",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_286": {
    "id": "synth_286",
    "name": "미발견-286",
    "position": {
      "x": 0.5509186104322352,
      "y": 1.6334393454785945
    },
    "zone": "neutral",
    "connections": [
      "synth_358",
      "synth_330",
      "synth_266"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_286_p",
        "systemId": "synth_286",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_287": {
    "id": "synth_287",
    "name": "미발견-287",
    "position": {
      "x": -1.3494052161412542,
      "y": 0.11004696297845658
    },
    "zone": "neutral",
    "connections": [
      "synth_299",
      "synth_431",
      "synth_351"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_287_p",
        "systemId": "synth_287",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_288": {
    "id": "synth_288",
    "name": "미발견-288",
    "position": {
      "x": 0.6964189706746746,
      "y": -0.7097225647523266
    },
    "zone": "neutral",
    "connections": [
      "synth_360",
      "synth_372"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_288_p",
        "systemId": "synth_288",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_289": {
    "id": "synth_289",
    "name": "미발견-289",
    "position": {
      "x": 2.3164439049247707,
      "y": 0.8662691977203801
    },
    "zone": "neutral",
    "connections": [
      "synth_301",
      "synth_209",
      "synth_229"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_289_p",
        "systemId": "synth_289",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_290": {
    "id": "synth_290",
    "name": "미발견-290",
    "position": {
      "x": 0.926857641798344,
      "y": 2.433920622244389
    },
    "zone": "neutral",
    "connections": [
      "synth_198",
      "synth_402"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_290_p",
        "systemId": "synth_290",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_291": {
    "id": "synth_291",
    "name": "미발견-291",
    "position": {
      "x": -1.4436604005811484,
      "y": 0.770705931019736
    },
    "zone": "neutral",
    "connections": [
      "synth_451",
      "synth_407"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_291_p",
        "systemId": "synth_291",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_292": {
    "id": "synth_292",
    "name": "미발견-292",
    "position": {
      "x": 0.4776260725053731,
      "y": -0.7504534527278665
    },
    "zone": "neutral",
    "connections": [
      "synth_260",
      "synth_396"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_292_p",
        "systemId": "synth_292",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_293": {
    "id": "synth_293",
    "name": "미발견-293",
    "position": {
      "x": 1.944825376481242,
      "y": 0.7002523398956029
    },
    "zone": "neutral",
    "connections": [
      "synth_241",
      "synth_377",
      "synth_385"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_293_p",
        "systemId": "synth_293",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_294": {
    "id": "synth_294",
    "name": "미발견-294",
    "position": {
      "x": 0.29552135270991436,
      "y": 2.3840965762388744
    },
    "zone": "neutral",
    "connections": [
      "synth_430",
      "synth_242",
      "synth_190"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_294_p",
        "systemId": "synth_294",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_295": {
    "id": "synth_295",
    "name": "미발견-295",
    "position": {
      "x": -1.5423173328027953,
      "y": 0.6597864486235386
    },
    "zone": "neutral",
    "connections": [
      "synth_411",
      "synth_223",
      "synth_335"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_295_p",
        "systemId": "synth_295",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_296": {
    "id": "synth_296",
    "name": "미발견-296",
    "position": {
      "x": 0.9922312663143481,
      "y": -1.4784150372992952
    },
    "zone": "neutral",
    "connections": [
      "synth_256",
      "synth_380",
      "synth_204"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_296_p",
        "systemId": "synth_296",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_297": {
    "id": "synth_297",
    "name": "미발견-297",
    "position": {
      "x": 2.2741459277055065,
      "y": 0.061808488431069744
    },
    "zone": "neutral",
    "connections": [
      "synth_409",
      "synth_277",
      "synth_193"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_297_p",
        "systemId": "synth_297",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_298": {
    "id": "synth_298",
    "name": "미발견-298",
    "position": {
      "x": 0.9188747614948142,
      "y": 1.717088998595324
    },
    "zone": "neutral",
    "connections": [
      "synth_310",
      "synth_370",
      "synth_206"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_298_p",
        "systemId": "synth_298",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_299": {
    "id": "synth_299",
    "name": "미발견-299",
    "position": {
      "x": -1.260539951342425,
      "y": 0.08290653758837446
    },
    "zone": "neutral",
    "connections": [
      "synth_423",
      "synth_287"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_299_p",
        "systemId": "synth_299",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_300": {
    "id": "synth_300",
    "name": "미발견-300",
    "position": {
      "x": 0.36726983124181783,
      "y": -0.772638932815621
    },
    "zone": "neutral",
    "connections": [
      "synth_396",
      "synth_428",
      "synth_240"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_300_p",
        "systemId": "synth_300",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_301": {
    "id": "synth_301",
    "name": "미발견-301",
    "position": {
      "x": 2.226723088490946,
      "y": 0.859564930783426
    },
    "zone": "neutral",
    "connections": [
      "synth_345",
      "synth_289",
      "synth_393"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_301_p",
        "systemId": "synth_301",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_302": {
    "id": "synth_302",
    "name": "미발견-302",
    "position": {
      "x": 0.8091522653400134,
      "y": 2.5053025498343273
    },
    "zone": "neutral",
    "connections": [
      "synth_334",
      "synth_218",
      "synth_438"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_302_p",
        "systemId": "synth_302",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_303": {
    "id": "synth_303",
    "name": "미발견-303",
    "position": {
      "x": -0.6079899217645621,
      "y": 0.5983773523210404
    },
    "zone": "neutral",
    "connections": [
      "synth_363",
      "synth_219",
      "synth_343"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_303_p",
        "systemId": "synth_303",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_304": {
    "id": "synth_304",
    "name": "미발견-304",
    "position": {
      "x": 0.19136679983618546,
      "y": -0.9760567125966841
    },
    "zone": "neutral",
    "connections": [
      "synth_272",
      "synth_436",
      "synth_188"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_304_p",
        "systemId": "synth_304",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_305": {
    "id": "synth_305",
    "name": "미발견-305",
    "position": {
      "x": 1.8736437802404167,
      "y": 0.28936658124450937
    },
    "zone": "neutral",
    "connections": [
      "synth_189",
      "synth_253",
      "synth_397"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_305_p",
        "systemId": "synth_305",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_306": {
    "id": "synth_306",
    "name": "미발견-306",
    "position": {
      "x": 0.3118002513572762,
      "y": 1.7414232322998697
    },
    "zone": "neutral",
    "connections": [
      "synth_390",
      "synth_422",
      "synth_202"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_306_p",
        "systemId": "synth_306",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_307": {
    "id": "synth_307",
    "name": "미발견-307",
    "position": {
      "x": -0.8991999810674179,
      "y": 0.03967824309970955
    },
    "zone": "neutral",
    "connections": [
      "synth_215",
      "synth_339"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_307_p",
        "systemId": "synth_307",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_308": {
    "id": "synth_308",
    "name": "미발견-308",
    "position": {
      "x": 0.8607726002448772,
      "y": -0.7349068168956613
    },
    "zone": "neutral",
    "connections": [
      "synth_372",
      "synth_444"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_308_p",
        "systemId": "synth_308",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_309": {
    "id": "synth_309",
    "name": "미발견-309",
    "position": {
      "x": 2.8502774850581445,
      "y": 0.30179145933954216
    },
    "zone": "neutral",
    "connections": [
      "synth_433",
      "synth_225",
      "synth_213"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_309_p",
        "systemId": "synth_309",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_310": {
    "id": "synth_310",
    "name": "미발견-310",
    "position": {
      "x": 0.993930632180815,
      "y": 1.7667526762601082
    },
    "zone": "neutral",
    "connections": [
      "synth_298",
      "synth_226",
      "synth_446"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_310_p",
        "systemId": "synth_310",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_311": {
    "id": "synth_311",
    "name": "미발견-311",
    "position": {
      "x": -0.581535307979336,
      "y": 0.3086608689264889
    },
    "zone": "neutral",
    "connections": [
      "synth_259",
      "synth_427",
      "synth_323"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_311_p",
        "systemId": "synth_311",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_312": {
    "id": "synth_312",
    "name": "미발견-312",
    "position": {
      "x": 0.1352218858657013,
      "y": -1.1171154723155583
    },
    "zone": "neutral",
    "connections": [
      "synth_364",
      "synth_324"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_312_p",
        "systemId": "synth_312",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_313": {
    "id": "synth_313",
    "name": "미발견-313",
    "position": {
      "x": 2.1556146151066273,
      "y": 0.04965012572254896
    },
    "zone": "neutral",
    "connections": [
      "synth_517",
      "synth_201"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_313_p",
        "systemId": "synth_313",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_314": {
    "id": "synth_314",
    "name": "미발견-314",
    "position": {
      "x": 0.4252378218067445,
      "y": 2.4824667550862967
    },
    "zone": "neutral",
    "connections": [
      "synth_322",
      "synth_426"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_314_p",
        "systemId": "synth_314",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_315": {
    "id": "synth_315",
    "name": "미발견-315",
    "position": {
      "x": -1.197388162646137,
      "y": 0.8659501827824774
    },
    "zone": "neutral",
    "connections": [
      "synth_439",
      "synth_231",
      "synth_211"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_315_p",
        "systemId": "synth_315",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_316": {
    "id": "synth_316",
    "name": "미발견-316",
    "position": {
      "x": 0.2182000512982483,
      "y": -1.3923298920121547
    },
    "zone": "neutral",
    "connections": [
      "synth_344",
      "synth_356",
      "synth_232"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_316_p",
        "systemId": "synth_316",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_317": {
    "id": "synth_317",
    "name": "미발견-317",
    "position": {
      "x": 2.7149023107114907,
      "y": 0.12725431436504275
    },
    "zone": "neutral",
    "connections": [
      "synth_233",
      "synth_453",
      "synth_413"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_317_p",
        "systemId": "synth_317",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_318": {
    "id": "synth_318",
    "name": "미발견-318",
    "position": {
      "x": 0.7893081256152938,
      "y": 1.636074867467042
    },
    "zone": "neutral",
    "connections": [
      "synth_214",
      "synth_246",
      "synth_370"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_318_p",
        "systemId": "synth_318",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_319": {
    "id": "synth_319",
    "name": "미발견-319",
    "position": {
      "x": -0.5108054796252776,
      "y": 0.45207703974681357
    },
    "zone": "neutral",
    "connections": [
      "synth_259",
      "synth_467",
      "synth_343"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_319_p",
        "systemId": "synth_319",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_320": {
    "id": "synth_320",
    "name": "미발견-320",
    "position": {
      "x": 0.22719189754598307,
      "y": -0.8448408637301874
    },
    "zone": "neutral",
    "connections": [
      "synth_272",
      "synth_488",
      "synth_240"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_320_p",
        "systemId": "synth_320",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_321": {
    "id": "synth_321",
    "name": "미발견-321",
    "position": {
      "x": 2.744007752314619,
      "y": 0.770455618987675
    },
    "zone": "neutral",
    "connections": [
      "synth_257",
      "synth_445"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_321_p",
        "systemId": "synth_321",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_322": {
    "id": "synth_322",
    "name": "미발견-322",
    "position": {
      "x": 0.3357599445367747,
      "y": 2.4727604459878174
    },
    "zone": "neutral",
    "connections": [
      "synth_242",
      "synth_314",
      "synth_490"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_322_p",
        "systemId": "synth_322",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_323": {
    "id": "synth_323",
    "name": "미발견-323",
    "position": {
      "x": -0.6231077670574281,
      "y": 0.22885757245728938
    },
    "zone": "neutral",
    "connections": [
      "synth_311",
      "synth_247",
      "synth_447"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_323_p",
        "systemId": "synth_323",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_324": {
    "id": "synth_324",
    "name": "미발견-324",
    "position": {
      "x": 0.13325962990809617,
      "y": -1.2216159857458044
    },
    "zone": "neutral",
    "connections": [
      "synth_220",
      "synth_312",
      "synth_356"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_324_p",
        "systemId": "synth_324",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_325": {
    "id": "synth_325",
    "name": "미발견-325",
    "position": {
      "x": 2.8159703555775235,
      "y": 0.18828526124512876
    },
    "zone": "neutral",
    "connections": [
      "synth_453",
      "synth_473",
      "synth_213"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_325_p",
        "systemId": "synth_325",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_326": {
    "id": "synth_326",
    "name": "미발견-326",
    "position": {
      "x": 0.21666114759460675,
      "y": 2.320664918445623
    },
    "zone": "neutral",
    "connections": [
      "synth_450",
      "synth_366",
      "synth_430"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_326_p",
        "systemId": "synth_326",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_327": {
    "id": "synth_327",
    "name": "미발견-327",
    "position": {
      "x": -1.6303138775307677,
      "y": 0.48462589792019456
    },
    "zone": "neutral",
    "connections": [
      "synth_243"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_327_p",
        "systemId": "synth_327",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_328": {
    "id": "synth_328",
    "name": "미발견-328",
    "position": {
      "x": 0.8212133305141107,
      "y": -1.6059882626105597
    },
    "zone": "neutral",
    "connections": [
      "synth_484",
      "synth_224",
      "synth_408"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_328_p",
        "systemId": "synth_328",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_329": {
    "id": "synth_329",
    "name": "미발견-329",
    "position": {
      "x": 2.578278574890422,
      "y": 0.06695142662931036
    },
    "zone": "neutral",
    "connections": [
      "synth_441",
      "synth_413",
      "synth_221"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_329_p",
        "systemId": "synth_329",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_330": {
    "id": "synth_330",
    "name": "미발견-330",
    "position": {
      "x": 0.6415323430890805,
      "y": 1.6105108933897005
    },
    "zone": "neutral",
    "connections": [
      "synth_414",
      "synth_246",
      "synth_286"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_330_p",
        "systemId": "synth_330",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_331": {
    "id": "synth_331",
    "name": "미발견-331",
    "position": {
      "x": -0.7637691812407482,
      "y": 0.1064227142319779
    },
    "zone": "neutral",
    "connections": [
      "synth_403",
      "synth_443",
      "synth_227"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_331_p",
        "systemId": "synth_331",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_332": {
    "id": "synth_332",
    "name": "미발견-332",
    "position": {
      "x": 0.996139056493725,
      "y": -0.8372181312074434
    },
    "zone": "neutral",
    "connections": [
      "synth_280",
      "synth_268",
      "synth_416"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_332_p",
        "systemId": "synth_332",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_333": {
    "id": "synth_333",
    "name": "미발견-333",
    "position": {
      "x": 2.4072887847465654,
      "y": 0.8959813919767229
    },
    "zone": "neutral",
    "connections": [
      "synth_281",
      "synth_465",
      "synth_229"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_333_p",
        "systemId": "synth_333",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_334": {
    "id": "synth_334",
    "name": "미발견-334",
    "position": {
      "x": 0.7277514455872051,
      "y": 2.5436457320283767
    },
    "zone": "neutral",
    "connections": [
      "synth_482",
      "synth_302",
      "synth_230"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_334_p",
        "systemId": "synth_334",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_335": {
    "id": "synth_335",
    "name": "미발견-335",
    "position": {
      "x": -1.6241829845210656,
      "y": 0.5913181508070314
    },
    "zone": "neutral",
    "connections": [
      "synth_463",
      "synth_243",
      "synth_295"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_335_p",
        "systemId": "synth_335",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_336": {
    "id": "synth_336",
    "name": "미발견-336",
    "position": {
      "x": 0.33303200053248366,
      "y": -1.545709237441577
    },
    "zone": "neutral",
    "connections": [
      "synth_440"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_336_p",
        "systemId": "synth_336",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_337": {
    "id": "synth_337",
    "name": "미발견-337",
    "position": {
      "x": 2.439128147688756,
      "y": 0.023006093632533874
    },
    "zone": "neutral",
    "connections": [
      "synth_277",
      "synth_449",
      "synth_221"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_337_p",
        "systemId": "synth_337",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_338": {
    "id": "synth_338",
    "name": "미발견-338",
    "position": {
      "x": 0.1422367569430106,
      "y": 1.9764329011549688
    },
    "zone": "neutral",
    "connections": [
      "synth_462",
      "synth_234",
      "synth_274"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_338_p",
        "systemId": "synth_338",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_339": {
    "id": "synth_339",
    "name": "미발견-339",
    "position": {
      "x": -0.990530882466132,
      "y": 0.009299816788059129
    },
    "zone": "neutral",
    "connections": [
      "synth_507",
      "synth_307",
      "synth_495"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_339_p",
        "systemId": "synth_339",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_340": {
    "id": "synth_340",
    "name": "미발견-340",
    "position": {
      "x": 1.0659271333646025,
      "y": -1.4267055489499065
    },
    "zone": "neutral",
    "connections": [
      "synth_420",
      "synth_236"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_340_p",
        "systemId": "synth_340",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_341": {
    "id": "synth_341",
    "name": "미발견-341",
    "position": {
      "x": 2.8332282846401164,
      "y": 0.6966562695684425
    },
    "zone": "neutral",
    "connections": [
      "synth_237",
      "synth_425",
      "synth_445"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_341_p",
        "systemId": "synth_341",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_342": {
    "id": "synth_342",
    "name": "미발견-342",
    "position": {
      "x": 1.1600749393560983,
      "y": 2.1249785147164375
    },
    "zone": "neutral",
    "connections": [
      "synth_354",
      "synth_278",
      "synth_478"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_342_p",
        "systemId": "synth_342",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_343": {
    "id": "synth_343",
    "name": "미발견-343",
    "position": {
      "x": -0.5328141706739788,
      "y": 0.5488939219749516
    },
    "zone": "neutral",
    "connections": [
      "synth_435",
      "synth_303",
      "synth_319"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_343_p",
        "systemId": "synth_343",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_344": {
    "id": "synth_344",
    "name": "미발견-344",
    "position": {
      "x": 0.23184057353523171,
      "y": -1.4812857239333626
    },
    "zone": "neutral",
    "connections": [
      "synth_440",
      "synth_316",
      "synth_480"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_344_p",
        "systemId": "synth_344",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_345": {
    "id": "synth_345",
    "name": "미발견-345",
    "position": {
      "x": 2.1368231871665824,
      "y": 0.8568161517820413
    },
    "zone": "neutral",
    "connections": [
      "synth_301",
      "synth_469",
      "synth_261"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_345_p",
        "systemId": "synth_345",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_346": {
    "id": "synth_346",
    "name": "미발견-346",
    "position": {
      "x": 0.16567217519926897,
      "y": 1.8260894475212854
    },
    "zone": "neutral",
    "connections": [
      "synth_514",
      "synth_254",
      "synth_410"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_346_p",
        "systemId": "synth_346",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_347": {
    "id": "synth_347",
    "name": "미발견-347",
    "position": {
      "x": -1.6312792686130677,
      "y": 0.3569265047771499
    },
    "zone": "neutral",
    "connections": [
      "synth_419",
      "synth_471",
      "synth_235"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_347_p",
        "systemId": "synth_347",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_348": {
    "id": "synth_348",
    "name": "미발견-348",
    "position": {
      "x": 0.5332033379354165,
      "y": -1.6359038406763555
    },
    "zone": "neutral",
    "connections": [
      "synth_244",
      "synth_460",
      "synth_368"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_348_p",
        "systemId": "synth_348",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_349": {
    "id": "synth_349",
    "name": "미발견-349",
    "position": {
      "x": 2.0633600843088433,
      "y": 0.09331291449898524
    },
    "zone": "neutral",
    "connections": [
      "synth_429",
      "synth_265",
      "synth_201"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_349_p",
        "systemId": "synth_349",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_350": {
    "id": "synth_350",
    "name": "미발견-350",
    "position": {
      "x": 0.39997250550159696,
      "y": 1.6425369979908524
    },
    "zone": "neutral",
    "connections": [
      "synth_358",
      "synth_266",
      "synth_494"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_350_p",
        "systemId": "synth_350",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_351": {
    "id": "synth_351",
    "name": "미발견-351",
    "position": {
      "x": -1.4478167111654412,
      "y": 0.13661907465923873
    },
    "zone": "neutral",
    "connections": [
      "synth_455",
      "synth_287"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_351_p",
        "systemId": "synth_351",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_352": {
    "id": "synth_352",
    "name": "미발견-352",
    "position": {
      "x": 1.0961415372411993,
      "y": -0.9472270301075388
    },
    "zone": "neutral",
    "connections": [
      "synth_384",
      "synth_268",
      "synth_412"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_352_p",
        "systemId": "synth_352",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_353": {
    "id": "synth_353",
    "name": "미발견-353",
    "position": {
      "x": 2.561146289243884,
      "y": 0.8831698775309964
    },
    "zone": "neutral",
    "connections": [
      "synth_381",
      "synth_281",
      "synth_489"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_353_p",
        "systemId": "synth_353",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_354": {
    "id": "synth_354",
    "name": "미발견-354",
    "position": {
      "x": 1.134605150916831,
      "y": 2.2112993688931133
    },
    "zone": "neutral",
    "connections": [
      "synth_238",
      "synth_342",
      "synth_458"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_354_p",
        "systemId": "synth_354",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_355": {
    "id": "synth_355",
    "name": "미발견-355",
    "position": {
      "x": -0.7041752510249,
      "y": 0.7742669820489245
    },
    "zone": "neutral",
    "connections": [
      "synth_375",
      "synth_271",
      "synth_491"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_355_p",
        "systemId": "synth_355",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_356": {
    "id": "synth_356",
    "name": "미발견-356",
    "position": {
      "x": 0.14402679176306654,
      "y": -1.3413587317067914
    },
    "zone": "neutral",
    "connections": [
      "synth_316",
      "synth_492",
      "synth_324"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_356_p",
        "systemId": "synth_356",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_357": {
    "id": "synth_357",
    "name": "미발견-357",
    "position": {
      "x": 1.8145214488838541,
      "y": 0.5905835995709282
    },
    "zone": "neutral",
    "connections": [
      "synth_273",
      "synth_389",
      "synth_249"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_357_p",
        "systemId": "synth_357",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_358": {
    "id": "synth_358",
    "name": "미발견-358",
    "position": {
      "x": 0.4725039322070997,
      "y": 1.5892529739580696
    },
    "zone": "neutral",
    "connections": [
      "synth_454",
      "synth_350",
      "synth_286"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_358_p",
        "systemId": "synth_358",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_359": {
    "id": "synth_359",
    "name": "미발견-359",
    "position": {
      "x": -1.5579330683908907,
      "y": 0.20494314115429918
    },
    "zone": "neutral",
    "connections": [
      "synth_475",
      "synth_267",
      "synth_455"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_359_p",
        "systemId": "synth_359",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_360": {
    "id": "synth_360",
    "name": "미발견-360",
    "position": {
      "x": 0.6285498882487478,
      "y": -0.6408163705928954
    },
    "zone": "neutral",
    "connections": [
      "synth_528",
      "synth_288",
      "synth_476"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_360_p",
        "systemId": "synth_360",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_361": {
    "id": "synth_361",
    "name": "미발견-361",
    "position": {
      "x": 2.9387214658777236,
      "y": 0.4197321026371595
    },
    "zone": "neutral",
    "connections": [
      "synth_485",
      "synth_245"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_361_p",
        "systemId": "synth_361",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_362": {
    "id": "synth_362",
    "name": "미발견-362",
    "position": {
      "x": 1.1372262360832748,
      "y": 1.8984612634219333
    },
    "zone": "neutral",
    "connections": [
      "synth_518",
      "synth_258",
      "synth_394"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_362_p",
        "systemId": "synth_362",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_363": {
    "id": "synth_363",
    "name": "미발견-363",
    "position": {
      "x": -0.55932960543097,
      "y": 0.6740860590581244
    },
    "zone": "neutral",
    "connections": [
      "synth_375",
      "synth_303",
      "synth_519"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_363_p",
        "systemId": "synth_363",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_364": {
    "id": "synth_364",
    "name": "미발견-364",
    "position": {
      "x": 0.10607756774598444,
      "y": -1.0319626726479436
    },
    "zone": "neutral",
    "connections": [
      "synth_448",
      "synth_456",
      "synth_312"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_364_p",
        "systemId": "synth_364",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_365": {
    "id": "synth_365",
    "name": "미발견-365",
    "position": {
      "x": 2.025792099716547,
      "y": 0.819292539170791
    },
    "zone": "neutral",
    "connections": [
      "synth_385",
      "synth_241",
      "synth_469"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_365_p",
        "systemId": "synth_365",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_366": {
    "id": "synth_366",
    "name": "미발견-366",
    "position": {
      "x": 0.14760862329893876,
      "y": 2.2591966246010076
    },
    "zone": "neutral",
    "connections": [
      "synth_450",
      "synth_326",
      "synth_262"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_366_p",
        "systemId": "synth_366",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_367": {
    "id": "synth_367",
    "name": "미발견-367",
    "position": {
      "x": -1.1179312990612882,
      "y": 0.9082255846357941
    },
    "zone": "neutral",
    "connections": [
      "synth_251"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_367_p",
        "systemId": "synth_367",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_368": {
    "id": "synth_368",
    "name": "미발견-368",
    "position": {
      "x": 0.6192248972143719,
      "y": -1.6623206367572116
    },
    "zone": "neutral",
    "connections": [
      "synth_348",
      "synth_252",
      "synth_376"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_368_p",
        "systemId": "synth_368",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_369": {
    "id": "synth_369",
    "name": "미발견-369",
    "position": {
      "x": 1.7975482181942095,
      "y": 0.3572363860023621
    },
    "zone": "neutral",
    "connections": [
      "synth_437",
      "synth_285",
      "synth_417"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_369_p",
        "systemId": "synth_369",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_370": {
    "id": "synth_370",
    "name": "미발견-370",
    "position": {
      "x": 0.8855348293838945,
      "y": 1.6334926006927073
    },
    "zone": "neutral",
    "connections": [
      "synth_298",
      "synth_434",
      "synth_318"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_370_p",
        "systemId": "synth_370",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_371": {
    "id": "synth_371",
    "name": "미발견-371",
    "position": {
      "x": -1.189741333856071,
      "y": 0.010624865720821263
    },
    "zone": "neutral",
    "connections": [
      "synth_483",
      "synth_279",
      "synth_423"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_371_p",
        "systemId": "synth_371",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_372": {
    "id": "synth_372",
    "name": "미발견-372",
    "position": {
      "x": 0.789998238269856,
      "y": -0.6793101679150886
    },
    "zone": "neutral",
    "connections": [
      "synth_308",
      "synth_520",
      "synth_288"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_372_p",
        "systemId": "synth_372",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_373": {
    "id": "synth_373",
    "name": "미발견-373",
    "position": {
      "x": 2.923990108399934,
      "y": 0.5784592705198909
    },
    "zone": "neutral",
    "connections": [
      "synth_269",
      "synth_457",
      "synth_425"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_373_p",
        "systemId": "synth_373",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_374": {
    "id": "synth_374",
    "name": "미발견-374",
    "position": {
      "x": 1.114857781466147,
      "y": 2.326609996617329
    },
    "zone": "neutral",
    "connections": [
      "synth_458",
      "synth_486",
      "synth_386"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_374_p",
        "systemId": "synth_374",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_375": {
    "id": "synth_375",
    "name": "미발견-375",
    "position": {
      "x": -0.6211964399197638,
      "y": 0.739442375219354
    },
    "zone": "neutral",
    "connections": [
      "synth_355",
      "synth_363",
      "synth_511"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_375_p",
        "systemId": "synth_375",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_376": {
    "id": "synth_376",
    "name": "미발견-376",
    "position": {
      "x": 0.7126912137648416,
      "y": -1.6785132699384413
    },
    "zone": "neutral",
    "connections": [
      "synth_544",
      "synth_368",
      "synth_252"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_376_p",
        "systemId": "synth_376",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_377": {
    "id": "synth_377",
    "name": "미발견-377",
    "position": {
      "x": 1.854973987548105,
      "y": 0.6952268986734897
    },
    "zone": "neutral",
    "connections": [
      "synth_293",
      "synth_273",
      "synth_501"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_377_p",
        "systemId": "synth_377",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_378": {
    "id": "synth_378",
    "name": "미발견-378",
    "position": {
      "x": 0.09032846780206902,
      "y": 2.1002165428194886
    },
    "zone": "neutral",
    "connections": [
      "synth_502",
      "synth_274",
      "synth_442"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_378_p",
        "systemId": "synth_378",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_379": {
    "id": "synth_379",
    "name": "미발견-379",
    "position": {
      "x": -1.3177617960437231,
      "y": 0.8771431037634343
    },
    "zone": "neutral",
    "connections": [
      "synth_275",
      "synth_503",
      "synth_407"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_379_p",
        "systemId": "synth_379",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_380": {
    "id": "synth_380",
    "name": "미발견-380",
    "position": {
      "x": 0.9741039746605147,
      "y": -1.5665715188066376
    },
    "zone": "neutral",
    "connections": [
      "synth_296",
      "synth_504",
      "synth_256"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_380_p",
        "systemId": "synth_380",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_381": {
    "id": "synth_381",
    "name": "미발견-381",
    "position": {
      "x": 2.6510724535693875,
      "y": 0.8832354711852333
    },
    "zone": "neutral",
    "connections": [
      "synth_353",
      "synth_477",
      "synth_497"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_381_p",
        "systemId": "synth_381",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_382": {
    "id": "synth_382",
    "name": "미발견-382",
    "position": {
      "x": 1.0998084138253477,
      "y": 1.8095909423763101
    },
    "zone": "neutral",
    "connections": [
      "synth_446",
      "synth_518"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_382_p",
        "systemId": "synth_382",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_383": {
    "id": "synth_383",
    "name": "미발견-383",
    "position": {
      "x": -0.49461761269208565,
      "y": 0.3527825874669096
    },
    "zone": "neutral",
    "connections": [
      "synth_499",
      "synth_467"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_383_p",
        "systemId": "synth_383",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_384": {
    "id": "synth_384",
    "name": "미발견-384",
    "position": {
      "x": 1.1559358499357815,
      "y": -1.0144205781093019
    },
    "zone": "neutral",
    "connections": [
      "synth_284",
      "synth_452",
      "synth_352"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_384_p",
        "systemId": "synth_384",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_385": {
    "id": "synth_385",
    "name": "미발견-385",
    "position": {
      "x": 1.9406380920078574,
      "y": 0.7901584531181737
    },
    "zone": "neutral",
    "connections": [
      "synth_365",
      "synth_293",
      "synth_521"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_385_p",
        "systemId": "synth_385",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_386": {
    "id": "synth_386",
    "name": "미발견-386",
    "position": {
      "x": 1.045316117319814,
      "y": 2.414475524701051
    },
    "zone": "neutral",
    "connections": [
      "synth_510",
      "synth_250",
      "synth_374"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_386_p",
        "systemId": "synth_386",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_387": {
    "id": "synth_387",
    "name": "미발견-387",
    "position": {
      "x": -1.00161008210709,
      "y": 0.913361685132915
    },
    "zone": "neutral",
    "connections": [
      "synth_479",
      "synth_263"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_387_p",
        "systemId": "synth_387",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_388": {
    "id": "synth_388",
    "name": "미발견-388",
    "position": {
      "x": 0.3997413216847726,
      "y": -1.6208751671180703
    },
    "zone": "neutral",
    "connections": [
      "synth_264",
      "synth_512",
      "synth_472"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_388_p",
        "systemId": "synth_388",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_389": {
    "id": "synth_389",
    "name": "미발견-389",
    "position": {
      "x": 1.7881285580650763,
      "y": 0.5045401987964121
    },
    "zone": "neutral",
    "connections": [
      "synth_481",
      "synth_357",
      "synth_249"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_389_p",
        "systemId": "synth_389",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_390": {
    "id": "synth_390",
    "name": "미발견-390",
    "position": {
      "x": 0.22200313406395514,
      "y": 1.7558887678696253
    },
    "zone": "neutral",
    "connections": [
      "synth_470",
      "synth_306",
      "synth_254"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_390_p",
        "systemId": "synth_390",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_391": {
    "id": "synth_391",
    "name": "미발견-391",
    "position": {
      "x": -1.0950758489049708,
      "y": -0.02241334245824375
    },
    "zone": "neutral",
    "connections": [
      "synth_495",
      "synth_483",
      "synth_671"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_391_p",
        "systemId": "synth_391",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_392": {
    "id": "synth_392",
    "name": "미발견-392",
    "position": {
      "x": 1.1388835487266409,
      "y": -1.3573460554520016
    },
    "zone": "neutral",
    "connections": [
      "synth_496",
      "synth_508",
      "synth_276"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_392_p",
        "systemId": "synth_392",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_393": {
    "id": "synth_393",
    "name": "미발견-393",
    "position": {
      "x": 2.2653913089204205,
      "y": 0.9408149595536535
    },
    "zone": "neutral",
    "connections": [
      "synth_301",
      "synth_549",
      "synth_509"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_393_p",
        "systemId": "synth_393",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_394": {
    "id": "synth_394",
    "name": "미발견-394",
    "position": {
      "x": 1.1775075557435248,
      "y": 1.9789543981272364
    },
    "zone": "neutral",
    "connections": [
      "synth_466",
      "synth_362",
      "synth_562"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_394_p",
        "systemId": "synth_394",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_395": {
    "id": "synth_395",
    "name": "미발견-395",
    "position": {
      "x": -0.817750617444388,
      "y": 0.8921258804806143
    },
    "zone": "neutral",
    "connections": [
      "synth_531",
      "synth_399",
      "synth_283"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_395_p",
        "systemId": "synth_395",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_396": {
    "id": "synth_396",
    "name": "미발견-396",
    "position": {
      "x": 0.4002100320608804,
      "y": -0.6888836624426774
    },
    "zone": "neutral",
    "connections": [
      "synth_532",
      "synth_300",
      "synth_292"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_396_p",
        "systemId": "synth_396",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_397": {
    "id": "synth_397",
    "name": "미발견-397",
    "position": {
      "x": 1.8093283176721833,
      "y": 0.22319564213471974
    },
    "zone": "neutral",
    "connections": [
      "synth_305",
      "synth_541"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_397_p",
        "systemId": "synth_397",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_398": {
    "id": "synth_398",
    "name": "미발견-398",
    "position": {
      "x": 0.5985384667938283,
      "y": 2.587399427129491
    },
    "zone": "neutral",
    "connections": [
      "synth_282",
      "synth_498",
      "synth_418"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_398_p",
        "systemId": "synth_398",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_399": {
    "id": "synth_399",
    "name": "미발견-399",
    "position": {
      "x": -0.9074191974280781,
      "y": 0.9025221574925905
    },
    "zone": "neutral",
    "connections": [
      "synth_395",
      "synth_283",
      "synth_531"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_399_p",
        "systemId": "synth_399",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_400": {
    "id": "synth_400",
    "name": "미발견-400",
    "position": {
      "x": 1.2106517707684668,
      "y": -1.2585485837645989
    },
    "zone": "neutral",
    "connections": [
      "synth_404",
      "synth_496",
      "synth_568"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_400_p",
        "systemId": "synth_400",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_401": {
    "id": "synth_401",
    "name": "미발견-401",
    "position": {
      "x": 1.923377244650512,
      "y": 0.14400256881051715
    },
    "zone": "neutral",
    "connections": [
      "synth_513",
      "synth_405",
      "synth_265"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_401_p",
        "systemId": "synth_401",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_402": {
    "id": "synth_402",
    "name": "미발견-402",
    "position": {
      "x": 0.9828150060353301,
      "y": 2.5315365785485677
    },
    "zone": "neutral",
    "connections": [
      "synth_406",
      "synth_614",
      "synth_290"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_402_p",
        "systemId": "synth_402",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_403": {
    "id": "synth_403",
    "name": "미발견-403",
    "position": {
      "x": -0.6742090652204329,
      "y": 0.09539260257858044
    },
    "zone": "neutral",
    "connections": [
      "synth_539",
      "synth_331",
      "synth_591"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_403_p",
        "systemId": "synth_403",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_404": {
    "id": "synth_404",
    "name": "미발견-404",
    "position": {
      "x": 1.1889119946294564,
      "y": -1.1713836338120753
    },
    "zone": "neutral",
    "connections": [
      "synth_400",
      "synth_284",
      "synth_516"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_404_p",
        "systemId": "synth_404",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_405": {
    "id": "synth_405",
    "name": "미발견-405",
    "position": {
      "x": 1.961774839092432,
      "y": 0.05556399154673855
    },
    "zone": "neutral",
    "connections": [
      "synth_585",
      "synth_401",
      "synth_613"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_405_p",
        "systemId": "synth_405",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_406": {
    "id": "synth_406",
    "name": "미발견-406",
    "position": {
      "x": 0.8941097089931264,
      "y": 2.5467474390242053
    },
    "zone": "neutral",
    "connections": [
      "synth_402",
      "synth_550",
      "synth_438"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_406_p",
        "systemId": "synth_406",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_407": {
    "id": "synth_407",
    "name": "미발견-407",
    "position": {
      "x": -1.414827512882796,
      "y": 0.8696260147421554
    },
    "zone": "neutral",
    "connections": [
      "synth_379",
      "synth_587",
      "synth_291"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_407_p",
        "systemId": "synth_407",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_408": {
    "id": "synth_408",
    "name": "미발견-408",
    "position": {
      "x": 0.9090958765233748,
      "y": -1.6517701251861838
    },
    "zone": "neutral",
    "connections": [
      "synth_576",
      "synth_484",
      "synth_328"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_408_p",
        "systemId": "synth_408",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_409": {
    "id": "synth_409",
    "name": "미발견-409",
    "position": {
      "x": 2.221792942251738,
      "y": -0.01132709541185007
    },
    "zone": "neutral",
    "connections": [
      "synth_297",
      "synth_533",
      "synth_517"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_409_p",
        "systemId": "synth_409",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_410": {
    "id": "synth_410",
    "name": "미발견-410",
    "position": {
      "x": 0.10348865857257247,
      "y": 1.8911516861283806
    },
    "zone": "neutral",
    "connections": [
      "synth_346",
      "synth_522",
      "synth_462"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_410_p",
        "systemId": "synth_410",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_411": {
    "id": "synth_411",
    "name": "미발견-411",
    "position": {
      "x": -1.5605043710409832,
      "y": 0.7479296935871492
    },
    "zone": "neutral",
    "connections": [
      "synth_295",
      "synth_451",
      "synth_459"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_411_p",
        "systemId": "synth_411",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_412": {
    "id": "synth_412",
    "name": "미발견-412",
    "position": {
      "x": 1.1222276570161822,
      "y": -0.8611135066739626
    },
    "zone": "neutral",
    "connections": [
      "synth_352",
      "synth_464",
      "synth_580"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_412_p",
        "systemId": "synth_412",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_413": {
    "id": "synth_413",
    "name": "미발견-413",
    "position": {
      "x": 2.6663119626695067,
      "y": 0.04824402085574744
    },
    "zone": "neutral",
    "connections": [
      "synth_329",
      "synth_537",
      "synth_317"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_413_p",
        "systemId": "synth_413",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_414": {
    "id": "synth_414",
    "name": "미발견-414",
    "position": {
      "x": 0.7203392564831983,
      "y": 1.567043351877831
    },
    "zone": "neutral",
    "connections": [
      "synth_526",
      "synth_330",
      "synth_506"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_414_p",
        "systemId": "synth_414",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_415": {
    "id": "synth_415",
    "name": "미발견-415",
    "position": {
      "x": -0.725442836412807,
      "y": 0.8648480798932905
    },
    "zone": "neutral",
    "connections": [
      "synth_491",
      "synth_571",
      "synth_635"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_415_p",
        "systemId": "synth_415",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_416": {
    "id": "synth_416",
    "name": "미발견-416",
    "position": {
      "x": 0.9705210759315182,
      "y": -0.7499593136778124
    },
    "zone": "neutral",
    "connections": [
      "synth_280",
      "synth_444",
      "synth_332"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_416_p",
        "systemId": "synth_416",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_417": {
    "id": "synth_417",
    "name": "미발견-417",
    "position": {
      "x": 1.726092765809158,
      "y": 0.42028535169221237
    },
    "zone": "neutral",
    "connections": [
      "synth_529",
      "synth_369",
      "synth_437"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_417_p",
        "systemId": "synth_417",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_418": {
    "id": "synth_418",
    "name": "미발견-418",
    "position": {
      "x": 0.5088550177416367,
      "y": 2.5949391207778656
    },
    "zone": "neutral",
    "connections": [
      "synth_398",
      "synth_498",
      "synth_426"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_418_p",
        "systemId": "synth_418",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_419": {
    "id": "synth_419",
    "name": "미발견-419",
    "position": {
      "x": -1.7020113679163025,
      "y": 0.41678632781572444
    },
    "zone": "neutral",
    "connections": [
      "synth_471",
      "synth_515",
      "synth_347"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_419_p",
        "systemId": "synth_419",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_420": {
    "id": "synth_420",
    "name": "미발견-420",
    "position": {
      "x": 1.0983818976652726,
      "y": -1.5106485353486687
    },
    "zone": "neutral",
    "connections": [
      "synth_340",
      "synth_588",
      "synth_712"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_420_p",
        "systemId": "synth_420",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_421": {
    "id": "synth_421",
    "name": "미발견-421",
    "position": {
      "x": 2.354488175370559,
      "y": -0.025092877029914695
    },
    "zone": "neutral",
    "connections": [
      "synth_577",
      "synth_629"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_421_p",
        "systemId": "synth_421",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_422": {
    "id": "synth_422",
    "name": "미발견-422",
    "position": {
      "x": 0.2978187793338018,
      "y": 1.6453073216970662
    },
    "zone": "neutral",
    "connections": [
      "synth_306",
      "synth_542"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_422_p",
        "systemId": "synth_422",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_423": {
    "id": "synth_423",
    "name": "미발견-423",
    "position": {
      "x": -1.2797224522808452,
      "y": -0.005025420894036924
    },
    "zone": "neutral",
    "connections": [
      "synth_579",
      "synth_299",
      "synth_371"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_423_p",
        "systemId": "synth_423",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_424": {
    "id": "synth_424",
    "name": "미발견-424",
    "position": {
      "x": 0.4985031079948456,
      "y": -0.6288343582000356
    },
    "zone": "neutral",
    "connections": [
      "synth_528",
      "synth_540"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_424_p",
        "systemId": "synth_424",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_425": {
    "id": "synth_425",
    "name": "미발견-425",
    "position": {
      "x": 2.9186423140273994,
      "y": 0.6682982691069159
    },
    "zone": "neutral",
    "connections": [
      "synth_373",
      "synth_341",
      "synth_505"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_425_p",
        "systemId": "synth_425",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_426": {
    "id": "synth_426",
    "name": "미발견-426",
    "position": {
      "x": 0.40514389043415494,
      "y": 2.5783457781517094
    },
    "zone": "neutral",
    "connections": [
      "synth_594",
      "synth_314",
      "synth_418"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_426_p",
        "systemId": "synth_426",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_427": {
    "id": "synth_427",
    "name": "미발견-427",
    "position": {
      "x": -0.5326179345561581,
      "y": 0.233162800294861
    },
    "zone": "neutral",
    "connections": [
      "synth_311",
      "synth_527"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_427_p",
        "systemId": "synth_427",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_428": {
    "id": "synth_428",
    "name": "미발견-428",
    "position": {
      "x": 0.28344347398058206,
      "y": -0.7398800521114509
    },
    "zone": "neutral",
    "connections": [
      "synth_532",
      "synth_300",
      "synth_548"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_428_p",
        "systemId": "synth_428",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_429": {
    "id": "synth_429",
    "name": "미발견-429",
    "position": {
      "x": 2.0553825912766492,
      "y": 0.0036696643788339464
    },
    "zone": "neutral",
    "connections": [
      "synth_349",
      "synth_605",
      "synth_585"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_429_p",
        "systemId": "synth_429",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_430": {
    "id": "synth_430",
    "name": "미발견-430",
    "position": {
      "x": 0.21930708186047154,
      "y": 2.4319649887746047
    },
    "zone": "neutral",
    "connections": [
      "synth_294",
      "synth_530",
      "synth_326"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_430_p",
        "systemId": "synth_430",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_431": {
    "id": "synth_431",
    "name": "미발견-431",
    "position": {
      "x": -1.38131257912898,
      "y": 0.021974110651818896
    },
    "zone": "neutral",
    "connections": [
      "synth_487",
      "synth_579",
      "synth_287"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_431_p",
        "systemId": "synth_431",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_432": {
    "id": "synth_432",
    "name": "미발견-432",
    "position": {
      "x": 1.2265784837260914,
      "y": -1.0768690763581668
    },
    "zone": "neutral",
    "connections": [
      "synth_556",
      "synth_516",
      "synth_680"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_432_p",
        "systemId": "synth_432",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_433": {
    "id": "synth_433",
    "name": "미발견-433",
    "position": {
      "x": 2.9176432276789375,
      "y": 0.2421116816047267
    },
    "zone": "neutral",
    "connections": [
      "synth_309",
      "synth_557",
      "synth_461"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_433_p",
        "systemId": "synth_433",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_434": {
    "id": "synth_434",
    "name": "미발견-434",
    "position": {
      "x": 0.9757546188981582,
      "y": 1.6415919692647274
    },
    "zone": "neutral",
    "connections": [
      "synth_538",
      "synth_546",
      "synth_370"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_434_p",
        "systemId": "synth_434",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_435": {
    "id": "synth_435",
    "name": "미발견-435",
    "position": {
      "x": -0.4444940526374883,
      "y": 0.5315865169244252
    },
    "zone": "neutral",
    "connections": [
      "synth_575",
      "synth_343",
      "synth_559"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_435_p",
        "systemId": "synth_435",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_436": {
    "id": "synth_436",
    "name": "미발견-436",
    "position": {
      "x": 0.11206160963491857,
      "y": -0.9016042894085776
    },
    "zone": "neutral",
    "connections": [
      "synth_456",
      "synth_572",
      "synth_304"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_436_p",
        "systemId": "synth_436",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_437": {
    "id": "synth_437",
    "name": "미발견-437",
    "position": {
      "x": 1.7146132040325712,
      "y": 0.32228236772198343
    },
    "zone": "neutral",
    "connections": [
      "synth_369",
      "synth_573",
      "synth_417"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_437_p",
        "systemId": "synth_437",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_438": {
    "id": "synth_438",
    "name": "미발견-438",
    "position": {
      "x": 0.8016468261132158,
      "y": 2.5955137302167457
    },
    "zone": "neutral",
    "connections": [
      "synth_302",
      "synth_574",
      "synth_406"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_438_p",
        "systemId": "synth_438",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_439": {
    "id": "synth_439",
    "name": "미발견-439",
    "position": {
      "x": -1.1943172299275953,
      "y": 0.955758552324131
    },
    "zone": "neutral",
    "connections": [
      "synth_543",
      "synth_315",
      "synth_503"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_439_p",
        "systemId": "synth_439",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_440": {
    "id": "synth_440",
    "name": "미발견-440",
    "position": {
      "x": 0.2461130004488968,
      "y": -1.5701383060300385
    },
    "zone": "neutral",
    "connections": [
      "synth_472",
      "synth_344",
      "synth_336"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_440_p",
        "systemId": "synth_440",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_441": {
    "id": "synth_441",
    "name": "미발견-441",
    "position": {
      "x": 2.542644222161847,
      "y": -0.015689174095618943
    },
    "zone": "neutral",
    "connections": [
      "synth_449",
      "synth_329",
      "synth_597"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_441_p",
        "systemId": "synth_441",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_442": {
    "id": "synth_442",
    "name": "미발견-442",
    "position": {
      "x": 0.06936381674769976,
      "y": 2.187740678065912
    },
    "zone": "neutral",
    "connections": [
      "synth_378",
      "synth_534",
      "synth_262"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_442_p",
        "systemId": "synth_442",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_443": {
    "id": "synth_443",
    "name": "미발견-443",
    "position": {
      "x": -0.7682677002417573,
      "y": 0.012760438134237656
    },
    "zone": "neutral",
    "connections": [
      "synth_547",
      "synth_331",
      "synth_591"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_443_p",
        "systemId": "synth_443",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_444": {
    "id": "synth_444",
    "name": "미발견-444",
    "position": {
      "x": 0.9283723953142559,
      "y": -0.670447971422858
    },
    "zone": "neutral",
    "connections": [
      "synth_416",
      "synth_600",
      "synth_308"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_444_p",
        "systemId": "synth_444",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_445": {
    "id": "synth_445",
    "name": "미발견-445",
    "position": {
      "x": 2.837512064515539,
      "y": 0.7983795624180071
    },
    "zone": "neutral",
    "connections": [
      "synth_569",
      "synth_321",
      "synth_341"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_445_p",
        "systemId": "synth_445",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_446": {
    "id": "synth_446",
    "name": "미발견-446",
    "position": {
      "x": 1.070937877197335,
      "y": 1.7201716602216488
    },
    "zone": "neutral",
    "connections": [
      "synth_310",
      "synth_382",
      "synth_566"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_446_p",
        "systemId": "synth_446",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_447": {
    "id": "synth_447",
    "name": "미발견-447",
    "position": {
      "x": -0.5897580439749884,
      "y": 0.14464595223018664
    },
    "zone": "neutral",
    "connections": [
      "synth_323",
      "synth_539",
      "synth_615"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_447_p",
        "systemId": "synth_447",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_448": {
    "id": "synth_448",
    "name": "미발견-448",
    "position": {
      "x": 0.04283436280179578,
      "y": -1.0959961058434513
    },
    "zone": "neutral",
    "connections": [
      "synth_560",
      "synth_364",
      "synth_564"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_448_p",
        "systemId": "synth_448",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_449": {
    "id": "synth_449",
    "name": "미발견-449",
    "position": {
      "x": 2.466003687311072,
      "y": -0.06286053003831735
    },
    "zone": "neutral",
    "connections": [
      "synth_337",
      "synth_629",
      "synth_441"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_449_p",
        "systemId": "synth_449",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_450": {
    "id": "synth_450",
    "name": "미발견-450",
    "position": {
      "x": 0.1301476984577283,
      "y": 2.347486579316301
    },
    "zone": "neutral",
    "connections": [
      "synth_366",
      "synth_326",
      "synth_638"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_450_p",
        "systemId": "synth_450",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_451": {
    "id": "synth_451",
    "name": "미발견-451",
    "position": {
      "x": -1.5133660844981538,
      "y": 0.8275888686844839
    },
    "zone": "neutral",
    "connections": [
      "synth_555",
      "synth_291",
      "synth_411"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_451_p",
        "systemId": "synth_451",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_452": {
    "id": "synth_452",
    "name": "미발견-452",
    "position": {
      "x": 1.2075850860902229,
      "y": -0.9407900571369269
    },
    "zone": "neutral",
    "connections": [
      "synth_384",
      "synth_580",
      "synth_640"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_452_p",
        "systemId": "synth_452",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_453": {
    "id": "synth_453",
    "name": "미발견-453",
    "position": {
      "x": 2.800477353369419,
      "y": 0.09905911727256998
    },
    "zone": "neutral",
    "connections": [
      "synth_473",
      "synth_317",
      "synth_325"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_453_p",
        "systemId": "synth_453",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_454": {
    "id": "synth_454",
    "name": "미발견-454",
    "position": {
      "x": 0.5462328349971208,
      "y": 1.537638596402572
    },
    "zone": "neutral",
    "connections": [
      "synth_358",
      "synth_558",
      "synth_506"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_454_p",
        "systemId": "synth_454",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_455": {
    "id": "synth_455",
    "name": "미발견-455",
    "position": {
      "x": -1.5349825453756494,
      "y": 0.11421109960246148
    },
    "zone": "neutral",
    "connections": [
      "synth_351",
      "synth_359",
      "synth_523"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_455_p",
        "systemId": "synth_455",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_456": {
    "id": "synth_456",
    "name": "미발견-456",
    "position": {
      "x": 0.04714512078407255,
      "y": -0.9639408710716587
    },
    "zone": "neutral",
    "connections": [
      "synth_364",
      "synth_436",
      "synth_624"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_456_p",
        "systemId": "synth_456",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_457": {
    "id": "synth_457",
    "name": "미발견-457",
    "position": {
      "x": 2.9897296775778184,
      "y": 0.5169950700324039
    },
    "zone": "neutral",
    "connections": [
      "synth_373",
      "synth_485",
      "synth_565"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_457_p",
        "systemId": "synth_457",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_458": {
    "id": "synth_458",
    "name": "미발견-458",
    "position": {
      "x": 1.1923409840911643,
      "y": 2.2808261383346267
    },
    "zone": "neutral",
    "connections": [
      "synth_626",
      "synth_374",
      "synth_354"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_458_p",
        "systemId": "synth_458",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_459": {
    "id": "synth_459",
    "name": "미발견-459",
    "position": {
      "x": -1.6654744134188142,
      "y": 0.7089567671235069
    },
    "zone": "neutral",
    "connections": [
      "synth_535",
      "synth_647",
      "synth_411"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_459_p",
        "systemId": "synth_459",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_460": {
    "id": "synth_460",
    "name": "미발견-460",
    "position": {
      "x": 0.472596680205,
      "y": -1.7024028385617347
    },
    "zone": "neutral",
    "connections": [
      "synth_348",
      "synth_524"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_460_p",
        "systemId": "synth_460",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_461": {
    "id": "synth_461",
    "name": "미발견-461",
    "position": {
      "x": 3.0012841316816856,
      "y": 0.2975317258343699
    },
    "zone": "neutral",
    "connections": [
      "synth_641",
      "synth_433",
      "synth_553"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_461_p",
        "systemId": "synth_461",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_462": {
    "id": "synth_462",
    "name": "미발견-462",
    "position": {
      "x": 0.05225475150685142,
      "y": 1.9753257169428133
    },
    "zone": "neutral",
    "connections": [
      "synth_554",
      "synth_338",
      "synth_410"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_462_p",
        "systemId": "synth_462",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_463": {
    "id": "synth_463",
    "name": "미발견-463",
    "position": {
      "x": -1.7115167372137061,
      "y": 0.5695977520834509
    },
    "zone": "neutral",
    "connections": [
      "synth_515",
      "synth_335",
      "synth_535"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_463_p",
        "systemId": "synth_463",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_464": {
    "id": "synth_464",
    "name": "미발견-464",
    "position": {
      "x": 1.0858140327016759,
      "y": -0.7788197273109609
    },
    "zone": "neutral",
    "connections": [
      "synth_412",
      "synth_536",
      "synth_652"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_464_p",
        "systemId": "synth_464",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_465": {
    "id": "synth_465",
    "name": "미발견-465",
    "position": {
      "x": 2.42182694125747,
      "y": 0.9847702776139329
    },
    "zone": "neutral",
    "connections": [
      "synth_333",
      "synth_609",
      "synth_665"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_465_p",
        "systemId": "synth_465",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_466": {
    "id": "synth_466",
    "name": "미발견-466",
    "position": {
      "x": 1.2467308465410742,
      "y": 2.0364707506669064
    },
    "zone": "neutral",
    "connections": [
      "synth_394",
      "synth_582",
      "synth_622"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_466_p",
        "systemId": "synth_466",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_467": {
    "id": "synth_467",
    "name": "미발견-467",
    "position": {
      "x": -0.42752469315932595,
      "y": 0.4151572149422794
    },
    "zone": "neutral",
    "connections": [
      "synth_583",
      "synth_319",
      "synth_383"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_467_p",
        "systemId": "synth_467",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_468": {
    "id": "synth_468",
    "name": "미발견-468",
    "position": {
      "x": 0.019491402640312225,
      "y": -1.244442661769914
    },
    "zone": "neutral",
    "connections": [
      "synth_500",
      "synth_564",
      "synth_692"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_468_p",
        "systemId": "synth_468",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_469": {
    "id": "synth_469",
    "name": "미발견-469",
    "position": {
      "x": 2.0726648138936894,
      "y": 0.919852798823905
    },
    "zone": "neutral",
    "connections": [
      "synth_345",
      "synth_589",
      "synth_365"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_469_p",
        "systemId": "synth_469",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_470": {
    "id": "synth_470",
    "name": "미발견-470",
    "position": {
      "x": 0.17249682236699004,
      "y": 1.6807281059395198
    },
    "zone": "neutral",
    "connections": [
      "synth_390",
      "synth_662",
      "synth_690"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_470_p",
        "systemId": "synth_470",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_471": {
    "id": "synth_471",
    "name": "미발견-471",
    "position": {
      "x": -1.7261467695216053,
      "y": 0.3300953867918941
    },
    "zone": "neutral",
    "connections": [
      "synth_567",
      "synth_419",
      "synth_347"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_471_p",
        "systemId": "synth_471",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_472": {
    "id": "synth_472",
    "name": "미발견-472",
    "position": {
      "x": 0.3106050649366012,
      "y": -1.6328894164694354
    },
    "zone": "neutral",
    "connections": [
      "synth_388",
      "synth_596",
      "synth_440"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_472_p",
        "systemId": "synth_472",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_473": {
    "id": "synth_473",
    "name": "미발견-473",
    "position": {
      "x": 2.886283542843483,
      "y": 0.12621234631771247
    },
    "zone": "neutral",
    "connections": [
      "synth_453",
      "synth_325",
      "synth_669"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_473_p",
        "systemId": "synth_473",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_474": {
    "id": "synth_474",
    "name": "미발견-474",
    "position": {
      "x": 0.8538838263628343,
      "y": 1.5419796508599115
    },
    "zone": "neutral",
    "connections": [
      "synth_538",
      "synth_650",
      "synth_710"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_474_p",
        "systemId": "synth_474",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_475": {
    "id": "synth_475",
    "name": "미발견-475",
    "position": {
      "x": -1.6476807656269272,
      "y": 0.21100380069072688
    },
    "zone": "neutral",
    "connections": [
      "synth_359",
      "synth_567",
      "synth_631"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_475_p",
        "systemId": "synth_475",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_476": {
    "id": "synth_476",
    "name": "미발견-476",
    "position": {
      "x": 0.7144839321870023,
      "y": -0.5926945966587597
    },
    "zone": "neutral",
    "connections": [
      "synth_644",
      "synth_632",
      "synth_360"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_476_p",
        "systemId": "synth_476",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_477": {
    "id": "synth_477",
    "name": "미발견-477",
    "position": {
      "x": 2.740962847222224,
      "y": 0.8862995552440671
    },
    "zone": "neutral",
    "connections": [
      "synth_381",
      "synth_645",
      "synth_581"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_477_p",
        "systemId": "synth_477",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_478": {
    "id": "synth_478",
    "name": "미발견-478",
    "position": {
      "x": 1.2427771078056635,
      "y": 2.1656831269186343
    },
    "zone": "neutral",
    "connections": [
      "synth_582",
      "synth_342",
      "synth_586"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_478_p",
        "systemId": "synth_478",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_479": {
    "id": "synth_479",
    "name": "미발견-479",
    "position": {
      "x": -1.0607932284063946,
      "y": 0.981167465227107
    },
    "zone": "neutral",
    "connections": [
      "synth_551",
      "synth_387",
      "synth_543"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_479_p",
        "systemId": "synth_479",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_480": {
    "id": "synth_480",
    "name": "미발견-480",
    "position": {
      "x": 0.14353799735676281,
      "y": -1.49866514739685
    },
    "zone": "neutral",
    "connections": [
      "synth_592",
      "synth_344",
      "synth_584"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_480_p",
        "systemId": "synth_480",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_481": {
    "id": "synth_481",
    "name": "미발견-481",
    "position": {
      "x": 1.7195072112145953,
      "y": 0.5627733886582045
    },
    "zone": "neutral",
    "connections": [
      "synth_561",
      "synth_389",
      "synth_593"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_481_p",
        "systemId": "synth_481",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_482": {
    "id": "synth_482",
    "name": "미발견-482",
    "position": {
      "x": 0.689336104333649,
      "y": 2.624995172319166
    },
    "zone": "neutral",
    "connections": [
      "synth_334",
      "synth_570",
      "synth_574"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_482_p",
        "systemId": "synth_482",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_483": {
    "id": "synth_483",
    "name": "미발견-483",
    "position": {
      "x": -1.16714822282169,
      "y": -0.07649288507516432
    },
    "zone": "neutral",
    "connections": [
      "synth_371",
      "synth_671",
      "synth_391"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_483_p",
        "systemId": "synth_483",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_484": {
    "id": "synth_484",
    "name": "미발견-484",
    "position": {
      "x": 0.8298548416230355,
      "y": -1.695569361049704
    },
    "zone": "neutral",
    "connections": [
      "synth_328",
      "synth_608",
      "synth_408"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_484_p",
        "systemId": "synth_484",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_485": {
    "id": "synth_485",
    "name": "미발견-485",
    "position": {
      "x": 3.0276529157662173,
      "y": 0.4335595109393684
    },
    "zone": "neutral",
    "connections": [
      "synth_361",
      "synth_457",
      "synth_553"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_485_p",
        "systemId": "synth_485",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_486": {
    "id": "synth_486",
    "name": "미발견-486",
    "position": {
      "x": 1.1529085033384776,
      "y": 2.4195481548090183
    },
    "zone": "neutral",
    "connections": [
      "synth_610",
      "synth_590",
      "synth_374"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_486_p",
        "systemId": "synth_486",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_487": {
    "id": "synth_487",
    "name": "미발견-487",
    "position": {
      "x": -1.4686610542229195,
      "y": 0.04365921840933311
    },
    "zone": "neutral",
    "connections": [
      "synth_431",
      "synth_651",
      "synth_599"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_487_p",
        "systemId": "synth_487",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_488": {
    "id": "synth_488",
    "name": "미발견-488",
    "position": {
      "x": 0.16171718886853345,
      "y": -0.7816716369421544
    },
    "zone": "neutral",
    "connections": [
      "synth_572",
      "synth_320",
      "synth_656"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_488_p",
        "systemId": "synth_488",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_489": {
    "id": "synth_489",
    "name": "미발견-489",
    "position": {
      "x": 2.526056286122996,
      "y": 0.9660259569029939
    },
    "zone": "neutral",
    "connections": [
      "synth_353",
      "synth_497",
      "synth_609"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_489_p",
        "systemId": "synth_489",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_490": {
    "id": "synth_490",
    "name": "미발견-490",
    "position": {
      "x": 0.2672355112505367,
      "y": 2.5427231199863316
    },
    "zone": "neutral",
    "connections": [
      "synth_646",
      "synth_322",
      "synth_594"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_490_p",
        "systemId": "synth_490",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_491": {
    "id": "synth_491",
    "name": "미발견-491",
    "position": {
      "x": -0.6398063648774672,
      "y": 0.8371654548121772
    },
    "zone": "neutral",
    "connections": [
      "synth_355",
      "synth_627",
      "synth_415"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_491_p",
        "systemId": "synth_491",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_492": {
    "id": "synth_492",
    "name": "미발견-492",
    "position": {
      "x": 0.08980337517148126,
      "y": -1.415619557077647
    },
    "zone": "neutral",
    "connections": [
      "synth_356",
      "synth_648",
      "synth_592"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_492_p",
        "systemId": "synth_492",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_493": {
    "id": "synth_493",
    "name": "미발견-493",
    "position": {
      "x": 3.0116088446929847,
      "y": 0.6499170709799653
    },
    "zone": "neutral",
    "connections": [
      "synth_621",
      "synth_661"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_493_p",
        "systemId": "synth_493",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_494": {
    "id": "synth_494",
    "name": "미발견-494",
    "position": {
      "x": 0.3781773971641239,
      "y": 1.553304416314056
    },
    "zone": "neutral",
    "connections": [
      "synth_350",
      "synth_670",
      "synth_606"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_494_p",
        "systemId": "synth_494",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_495": {
    "id": "synth_495",
    "name": "미발견-495",
    "position": {
      "x": -1.027007938863343,
      "y": -0.0812925365941734
    },
    "zone": "neutral",
    "connections": [
      "synth_507",
      "synth_391",
      "synth_339"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_495_p",
        "systemId": "synth_495",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_496": {
    "id": "synth_496",
    "name": "미발견-496",
    "position": {
      "x": 1.2282362776736786,
      "y": -1.3466751623415008
    },
    "zone": "neutral",
    "connections": [
      "synth_400",
      "synth_620",
      "synth_392"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_496_p",
        "systemId": "synth_496",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_497": {
    "id": "synth_497",
    "name": "미발견-497",
    "position": {
      "x": 2.616224747245231,
      "y": 0.9666757272341385
    },
    "zone": "neutral",
    "connections": [
      "synth_581",
      "synth_489",
      "synth_381"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_497_p",
        "systemId": "synth_497",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_498": {
    "id": "synth_498",
    "name": "미발견-498",
    "position": {
      "x": 0.566712398150984,
      "y": 2.6715834976456687
    },
    "zone": "neutral",
    "connections": [
      "synth_570",
      "synth_398",
      "synth_418"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_498_p",
        "systemId": "synth_498",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_499": {
    "id": "synth_499",
    "name": "미발견-499",
    "position": {
      "x": -0.45197202040711737,
      "y": 0.27352063598519155
    },
    "zone": "neutral",
    "connections": [
      "synth_583",
      "synth_643",
      "synth_383"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_499_p",
        "systemId": "synth_499",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_500": {
    "id": "synth_500",
    "name": "미발견-500",
    "position": {
      "x": 0.040513798385546224,
      "y": -1.331952995781311
    },
    "zone": "neutral",
    "connections": [
      "synth_648",
      "synth_468",
      "synth_692"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_500_p",
        "systemId": "synth_500",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_501": {
    "id": "synth_501",
    "name": "미발견-501",
    "position": {
      "x": 1.762231009367947,
      "y": 0.7041167897257558
    },
    "zone": "neutral",
    "connections": [
      "synth_657",
      "synth_377",
      "synth_525"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_501_p",
        "systemId": "synth_501",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_502": {
    "id": "synth_502",
    "name": "미발견-502",
    "position": {
      "x": 0.0015780229921406798,
      "y": 2.115129102990662
    },
    "zone": "neutral",
    "connections": [
      "synth_598",
      "synth_554",
      "synth_378"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_502_p",
        "systemId": "synth_502",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_503": {
    "id": "synth_503",
    "name": "미발견-503",
    "position": {
      "x": -1.2839396963860215,
      "y": 0.9624877495160568
    },
    "zone": "neutral",
    "connections": [
      "synth_439",
      "synth_563",
      "synth_379"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_503_p",
        "systemId": "synth_503",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_504": {
    "id": "synth_504",
    "name": "미발견-504",
    "position": {
      "x": 1.0528708027563904,
      "y": -1.6122704431612764
    },
    "zone": "neutral",
    "connections": [
      "synth_660",
      "synth_380",
      "synth_552"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_504_p",
        "systemId": "synth_504",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_505": {
    "id": "synth_505",
    "name": "미발견-505",
    "position": {
      "x": 2.9480028537955905,
      "y": 0.7562476645500862
    },
    "zone": "neutral",
    "connections": [
      "synth_633",
      "synth_425",
      "synth_621"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_505_p",
        "systemId": "synth_505",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_506": {
    "id": "synth_506",
    "name": "미발견-506",
    "position": {
      "x": 0.6419147106699762,
      "y": 1.5137723547570285
    },
    "zone": "neutral",
    "connections": [
      "synth_630",
      "synth_414",
      "synth_454"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_506_p",
        "systemId": "synth_506",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_507": {
    "id": "synth_507",
    "name": "미발견-507",
    "position": {
      "x": -0.9380169476808964,
      "y": -0.06785366134744063
    },
    "zone": "neutral",
    "connections": [
      "synth_495",
      "synth_715",
      "synth_339"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_507_p",
        "systemId": "synth_507",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_508": {
    "id": "synth_508",
    "name": "미발견-508",
    "position": {
      "x": 1.1781395494895028,
      "y": -1.4385921166448894
    },
    "zone": "neutral",
    "connections": [
      "synth_392",
      "synth_620",
      "synth_588"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_508_p",
        "systemId": "synth_508",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_509": {
    "id": "synth_509",
    "name": "미발견-509",
    "position": {
      "x": 2.178848407117092,
      "y": 0.965731884824406
    },
    "zone": "neutral",
    "connections": [
      "synth_677",
      "synth_393",
      "synth_693"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_509_p",
        "systemId": "synth_509",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_510": {
    "id": "synth_510",
    "name": "미발견-510",
    "position": {
      "x": 1.0865828157032278,
      "y": 2.49445713404386
    },
    "zone": "neutral",
    "connections": [
      "synth_614",
      "synth_386",
      "synth_610"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_510_p",
        "systemId": "synth_510",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_511": {
    "id": "synth_511",
    "name": "미발견-511",
    "position": {
      "x": -0.5375227071593552,
      "y": 0.7725797657884312
    },
    "zone": "neutral",
    "connections": [
      "synth_375",
      "synth_627",
      "synth_655"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_511_p",
        "systemId": "synth_511",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_512": {
    "id": "synth_512",
    "name": "미발견-512",
    "position": {
      "x": 0.37586809803131244,
      "y": -1.7074904973747356
    },
    "zone": "neutral",
    "connections": [
      "synth_388",
      "synth_700",
      "synth_616"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_512_p",
        "systemId": "synth_512",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_513": {
    "id": "synth_513",
    "name": "미발견-513",
    "position": {
      "x": 1.8682310174080892,
      "y": 0.0728767139852119
    },
    "zone": "neutral",
    "connections": [
      "synth_613",
      "synth_401",
      "synth_617"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_513_p",
        "systemId": "synth_513",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_514": {
    "id": "synth_514",
    "name": "미발견-514",
    "position": {
      "x": 0.1159169994740345,
      "y": 1.7510958098392475
    },
    "zone": "neutral",
    "connections": [
      "synth_346",
      "synth_662",
      "synth_642"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_514_p",
        "systemId": "synth_514",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_515": {
    "id": "synth_515",
    "name": "미발견-515",
    "position": {
      "x": -1.7561600455502484,
      "y": 0.49146347543807345
    },
    "zone": "neutral",
    "connections": [
      "synth_463",
      "synth_607",
      "synth_419"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_515_p",
        "systemId": "synth_515",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_516": {
    "id": "synth_516",
    "name": "미발견-516",
    "position": {
      "x": 1.2829059615790095,
      "y": -1.1619604310001659
    },
    "zone": "neutral",
    "connections": [
      "synth_628",
      "synth_404",
      "synth_432"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_516_p",
        "systemId": "synth_516",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_517": {
    "id": "synth_517",
    "name": "미발견-517",
    "position": {
      "x": 2.1370531358260196,
      "y": -0.041575012024089204
    },
    "zone": "neutral",
    "connections": [
      "synth_409",
      "synth_649",
      "synth_313"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_517_p",
        "systemId": "synth_517",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_518": {
    "id": "synth_518",
    "name": "미발견-518",
    "position": {
      "x": 1.2028863826357883,
      "y": 1.8370108056982324
    },
    "zone": "neutral",
    "connections": [
      "synth_362",
      "synth_578",
      "synth_382"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_518_p",
        "systemId": "synth_518",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_519": {
    "id": "synth_519",
    "name": "미발견-519",
    "position": {
      "x": -0.4672222098955134,
      "y": 0.6914281194409555
    },
    "zone": "neutral",
    "connections": [
      "synth_623",
      "synth_575",
      "synth_363"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_519_p",
        "systemId": "synth_519",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_520": {
    "id": "synth_520",
    "name": "미발견-520",
    "position": {
      "x": 0.8491929472156455,
      "y": -0.6115163230624361
    },
    "zone": "neutral",
    "connections": [
      "synth_372",
      "synth_672"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_520_p",
        "systemId": "synth_520",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_521": {
    "id": "synth_521",
    "name": "미발견-521",
    "position": {
      "x": 1.9399047319088856,
      "y": 0.8879929700866861
    },
    "zone": "neutral",
    "connections": [
      "synth_685",
      "synth_625",
      "synth_385"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_521_p",
        "systemId": "synth_521",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_522": {
    "id": "synth_522",
    "name": "미발견-522",
    "position": {
      "x": 0.016161627193412346,
      "y": 1.8693821213677733
    },
    "zone": "neutral",
    "connections": [
      "synth_410",
      "synth_658",
      "synth_642"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_522_p",
        "systemId": "synth_522",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_523": {
    "id": "synth_523",
    "name": "미발견-523",
    "position": {
      "x": -1.632608215579733,
      "y": 0.11889918484877625
    },
    "zone": "neutral",
    "connections": [
      "synth_631",
      "synth_723",
      "synth_455"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_523_p",
        "systemId": "synth_523",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_524": {
    "id": "synth_524",
    "name": "미발견-524",
    "position": {
      "x": 0.5580058621832528,
      "y": -1.7424272672518974
    },
    "zone": "neutral",
    "connections": [
      "synth_636",
      "synth_460",
      "synth_604"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_524_p",
        "systemId": "synth_524",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_525": {
    "id": "synth_525",
    "name": "미발견-525",
    "position": {
      "x": 1.7793055312993904,
      "y": 0.813079321381909
    },
    "zone": "neutral",
    "connections": [
      "synth_625",
      "synth_657",
      "synth_501"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_525_p",
        "systemId": "synth_525",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_526": {
    "id": "synth_526",
    "name": "미발견-526",
    "position": {
      "x": 0.760142427609229,
      "y": 1.4863238081281562
    },
    "zone": "neutral",
    "connections": [
      "synth_414",
      "synth_702",
      "synth_650"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_526_p",
        "systemId": "synth_526",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_527": {
    "id": "synth_527",
    "name": "미발견-527",
    "position": {
      "x": -0.4648354882853493,
      "y": 0.17399215696478856
    },
    "zone": "neutral",
    "connections": [
      "synth_427",
      "synth_695",
      "synth_643"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_527_p",
        "systemId": "synth_527",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_528": {
    "id": "synth_528",
    "name": "미발견-528",
    "position": {
      "x": 0.5692089640884443,
      "y": -0.5731506677462217
    },
    "zone": "neutral",
    "connections": [
      "synth_696",
      "synth_424",
      "synth_360"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_528_p",
        "systemId": "synth_528",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_529": {
    "id": "synth_529",
    "name": "미발견-529",
    "position": {
      "x": 1.6422754700706954,
      "y": 0.4530673110112192
    },
    "zone": "neutral",
    "connections": [
      "synth_697",
      "synth_417",
      "synth_573"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_529_p",
        "systemId": "synth_529",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_530": {
    "id": "synth_530",
    "name": "미발견-530",
    "position": {
      "x": 0.13923602353980719,
      "y": 2.473717766492909
    },
    "zone": "neutral",
    "connections": [
      "synth_666",
      "synth_430",
      "synth_646"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_530_p",
        "systemId": "synth_530",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_531": {
    "id": "synth_531",
    "name": "미발견-531",
    "position": {
      "x": -0.8491566864996463,
      "y": 0.9764683894922849
    },
    "zone": "neutral",
    "connections": [
      "synth_395",
      "synth_399",
      "synth_719"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_531_p",
        "systemId": "synth_531",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_532": {
    "id": "synth_532",
    "name": "미발견-532",
    "position": {
      "x": 0.31638370720977677,
      "y": -0.6561248555417047
    },
    "zone": "neutral",
    "connections": [
      "synth_664",
      "synth_428",
      "synth_396"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_532_p",
        "systemId": "synth_532",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_533": {
    "id": "synth_533",
    "name": "미발견-533",
    "position": {
      "x": 2.245261086595416,
      "y": -0.0981672575980824
    },
    "zone": "neutral",
    "connections": [
      "synth_409",
      "synth_721",
      "synth_577"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_533_p",
        "systemId": "synth_533",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_534": {
    "id": "synth_534",
    "name": "미발견-534",
    "position": {
      "x": 0.03573624186099868,
      "y": 2.2732228018023486
    },
    "zone": "neutral",
    "connections": [
      "synth_598",
      "synth_654",
      "synth_442"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_534_p",
        "systemId": "synth_534",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_535": {
    "id": "synth_535",
    "name": "미발견-535",
    "position": {
      "x": -1.7394690850470829,
      "y": 0.6551410352625435
    },
    "zone": "neutral",
    "connections": [
      "synth_463",
      "synth_595",
      "synth_459"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_535_p",
        "systemId": "synth_535",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_536": {
    "id": "synth_536",
    "name": "미발견-536",
    "position": {
      "x": 1.0416433566942218,
      "y": -0.6854777863070528
    },
    "zone": "neutral",
    "connections": [
      "synth_684",
      "synth_704",
      "synth_464"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_536_p",
        "systemId": "synth_536",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_537": {
    "id": "synth_537",
    "name": "미발견-537",
    "position": {
      "x": 2.641376634381478,
      "y": -0.038250869212910175
    },
    "zone": "neutral",
    "connections": [
      "synth_413",
      "synth_597",
      "synth_637"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_537_p",
        "systemId": "synth_537",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_538": {
    "id": "synth_538",
    "name": "미발견-538",
    "position": {
      "x": 0.9424498090133634,
      "y": 1.5579810941482926
    },
    "zone": "neutral",
    "connections": [
      "synth_474",
      "synth_674",
      "synth_434"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_538_p",
        "systemId": "synth_538",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_539": {
    "id": "synth_539",
    "name": "미발견-539",
    "position": {
      "x": -0.5951293317769404,
      "y": 0.05242325535882681
    },
    "zone": "neutral",
    "connections": [
      "synth_615",
      "synth_403",
      "synth_447"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_539_p",
        "systemId": "synth_539",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_540": {
    "id": "synth_540",
    "name": "미발견-540",
    "position": {
      "x": 0.4173001076031604,
      "y": -0.5900262790291683
    },
    "zone": "neutral",
    "connections": [
      "synth_424",
      "synth_728",
      "synth_612"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_540_p",
        "systemId": "synth_540",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_541": {
    "id": "synth_541",
    "name": "미발견-541",
    "position": {
      "x": 1.7345875260655117,
      "y": 0.16710938711876042
    },
    "zone": "neutral",
    "connections": [
      "synth_397",
      "synth_617",
      "synth_709"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_541_p",
        "systemId": "synth_541",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_542": {
    "id": "synth_542",
    "name": "미발견-542",
    "position": {
      "x": 0.21649127882824057,
      "y": 1.5789011199318785
    },
    "zone": "neutral",
    "connections": [
      "synth_690",
      "synth_606",
      "synth_422"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_542_p",
        "systemId": "synth_542",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_543": {
    "id": "synth_543",
    "name": "미발견-543",
    "position": {
      "x": -1.1387637151609873,
      "y": 1.0263853715807694
    },
    "zone": "neutral",
    "connections": [
      "synth_439",
      "synth_691",
      "synth_479"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_543_p",
        "systemId": "synth_543",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_544": {
    "id": "synth_544",
    "name": "미발견-544",
    "position": {
      "x": 0.715725104450504,
      "y": -1.7684621193315502
    },
    "zone": "neutral",
    "connections": [
      "synth_376",
      "synth_604",
      "synth_732"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_544_p",
        "systemId": "synth_544",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_545": {
    "id": "synth_545",
    "name": "미발견-545",
    "position": {
      "x": 2.7665718614783437,
      "y": 0.00024991699165056915
    },
    "zone": "neutral",
    "connections": [
      "synth_637",
      "synth_653"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_545_p",
        "systemId": "synth_545",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_546": {
    "id": "synth_546",
    "name": "미발견-546",
    "position": {
      "x": 1.0587134548918409,
      "y": 1.6066927895451613
    },
    "zone": "neutral",
    "connections": [
      "synth_434",
      "synth_674",
      "synth_722"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_546_p",
        "systemId": "synth_546",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_547": {
    "id": "synth_547",
    "name": "미발견-547",
    "position": {
      "x": -0.8158450419744443,
      "y": -0.06363583616662344
    },
    "zone": "neutral",
    "connections": [
      "synth_683",
      "synth_443",
      "synth_703"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_547_p",
        "systemId": "synth_547",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_548": {
    "id": "synth_548",
    "name": "미발견-548",
    "position": {
      "x": 0.22433117614364018,
      "y": -0.6610123612960795
    },
    "zone": "neutral",
    "connections": [
      "synth_656",
      "synth_428",
      "synth_664"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_548_p",
        "systemId": "synth_548",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_549": {
    "id": "synth_549",
    "name": "미발견-549",
    "position": {
      "x": 2.288522755828909,
      "y": 1.0277761829922123
    },
    "zone": "neutral",
    "connections": [
      "synth_393",
      "synth_665",
      "synth_693"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_549_p",
        "systemId": "synth_549",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_550": {
    "id": "synth_550",
    "name": "미발견-550",
    "position": {
      "x": 0.9283419786200446,
      "y": 2.6376984305982525
    },
    "zone": "neutral",
    "connections": [
      "synth_738",
      "synth_634",
      "synth_406"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_550_p",
        "systemId": "synth_550",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_551": {
    "id": "synth_551",
    "name": "미발견-551",
    "position": {
      "x": -0.9788369645212526,
      "y": 1.0183581538417625
    },
    "zone": "neutral",
    "connections": [
      "synth_727",
      "synth_479",
      "synth_691"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_551_p",
        "systemId": "synth_551",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_552": {
    "id": "synth_552",
    "name": "미발견-552",
    "position": {
      "x": 1.007752242041525,
      "y": -1.700146194684764
    },
    "zone": "neutral",
    "connections": [
      "synth_720",
      "synth_576",
      "synth_504"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_552_p",
        "systemId": "synth_552",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_553": {
    "id": "synth_553",
    "name": "미발견-553",
    "position": {
      "x": 3.0984521388281014,
      "y": 0.3589555547051549
    },
    "zone": "neutral",
    "connections": [
      "synth_485",
      "synth_461",
      "synth_681"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_553_p",
        "systemId": "synth_553",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_554": {
    "id": "synth_554",
    "name": "미발견-554",
    "position": {
      "x": -0.020740640242752014,
      "y": 2.0279506301533616
    },
    "zone": "neutral",
    "connections": [
      "synth_462",
      "synth_502",
      "synth_686"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_554_p",
        "systemId": "synth_554",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_555": {
    "id": "synth_555",
    "name": "미발견-555",
    "position": {
      "x": -1.602974652471305,
      "y": 0.83532793340281
    },
    "zone": "neutral",
    "connections": [
      "synth_639",
      "synth_451",
      "synth_667"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_555_p",
        "systemId": "synth_555",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_556": {
    "id": "synth_556",
    "name": "미발견-556",
    "position": {
      "x": 1.3066688680094396,
      "y": -1.0358138654201137
    },
    "zone": "neutral",
    "connections": [
      "synth_432",
      "synth_640",
      "synth_680"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_556_p",
        "systemId": "synth_556",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_557": {
    "id": "synth_557",
    "name": "미발견-557",
    "position": {
      "x": 2.9795592693009496,
      "y": 0.17679498494129553
    },
    "zone": "neutral",
    "connections": [
      "synth_433",
      "synth_641",
      "synth_669"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_557_p",
        "systemId": "synth_557",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_558": {
    "id": "synth_558",
    "name": "미발견-558",
    "position": {
      "x": 0.47099224606966084,
      "y": 1.4874718355717524
    },
    "zone": "neutral",
    "connections": [
      "synth_454",
      "synth_618",
      "synth_670"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_558_p",
        "systemId": "synth_558",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_559": {
    "id": "synth_559",
    "name": "미발견-559",
    "position": {
      "x": -0.3575315080569683,
      "y": 0.49086190452298967
    },
    "zone": "neutral",
    "connections": [
      "synth_435",
      "synth_619",
      "synth_663"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_559_p",
        "systemId": "synth_559",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_560": {
    "id": "synth_560",
    "name": "미발견-560",
    "position": {
      "x": -0.04100870152998427,
      "y": -1.063280724960447
    },
    "zone": "neutral",
    "connections": [
      "synth_448",
      "synth_716",
      "synth_688"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_560_p",
        "systemId": "synth_560",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_561": {
    "id": "synth_561",
    "name": "미발견-561",
    "position": {
      "x": 1.669437093735254,
      "y": 0.6375595831383719
    },
    "zone": "neutral",
    "connections": [
      "synth_481",
      "synth_705",
      "synth_593"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_561_p",
        "systemId": "synth_561",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_562": {
    "id": "synth_562",
    "name": "미발견-562",
    "position": {
      "x": 1.2586867875808916,
      "y": 1.9399004310682642
    },
    "zone": "neutral",
    "connections": [
      "synth_394",
      "synth_622",
      "synth_726"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_562_p",
        "systemId": "synth_562",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_563": {
    "id": "synth_563",
    "name": "미발견-563",
    "position": {
      "x": -1.372202735880725,
      "y": 0.9795139462845545
    },
    "zone": "neutral",
    "connections": [
      "synth_503",
      "synth_679",
      "synth_699"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_563_p",
        "systemId": "synth_563",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_564": {
    "id": "synth_564",
    "name": "미발견-564",
    "position": {
      "x": -0.02066545086538724,
      "y": -1.1611954749978561
    },
    "zone": "neutral",
    "connections": [
      "synth_676",
      "synth_448",
      "synth_468"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_564_p",
        "systemId": "synth_564",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_565": {
    "id": "synth_565",
    "name": "미발견-565",
    "position": {
      "x": 3.095685237400185,
      "y": 0.5180532979445248
    },
    "zone": "neutral",
    "connections": [
      "synth_689",
      "synth_681",
      "synth_457"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_565_p",
        "systemId": "synth_565",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_566": {
    "id": "synth_566",
    "name": "미발견-566",
    "position": {
      "x": 1.1437374844017003,
      "y": 1.660163786102052
    },
    "zone": "neutral",
    "connections": [
      "synth_734",
      "synth_446",
      "synth_722"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_566_p",
        "systemId": "synth_566",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_567": {
    "id": "synth_567",
    "name": "미발견-567",
    "position": {
      "x": -1.7327116785377397,
      "y": 0.24035508424419663
    },
    "zone": "neutral",
    "connections": [
      "synth_475",
      "synth_711",
      "synth_471"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_567_p",
        "systemId": "synth_567",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_568": {
    "id": "synth_568",
    "name": "미발견-568",
    "position": {
      "x": 1.2977361909124474,
      "y": -1.281209838986809
    },
    "zone": "neutral",
    "connections": [
      "synth_400",
      "synth_668",
      "synth_628"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_568_p",
        "systemId": "synth_568",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_569": {
    "id": "synth_569",
    "name": "미발견-569",
    "position": {
      "x": 2.8668772838716126,
      "y": 0.8834531702701264
    },
    "zone": "neutral",
    "connections": [
      "synth_633",
      "synth_645",
      "synth_445"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_569_p",
        "systemId": "synth_569",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_570": {
    "id": "synth_570",
    "name": "미발견-570",
    "position": {
      "x": 0.6499159084349142,
      "y": 2.705873008446819
    },
    "zone": "neutral",
    "connections": [
      "synth_482",
      "synth_706",
      "synth_498"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_570_p",
        "systemId": "synth_570",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_571": {
    "id": "synth_571",
    "name": "미발견-571",
    "position": {
      "x": -0.7282398819434531,
      "y": 0.9548043749392822
    },
    "zone": "neutral",
    "connections": [
      "synth_415",
      "synth_719",
      "synth_635"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_571_p",
        "systemId": "synth_571",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_572": {
    "id": "synth_572",
    "name": "미발견-572",
    "position": {
      "x": 0.07809481634054098,
      "y": -0.814961434313106
    },
    "zone": "neutral",
    "connections": [
      "synth_708",
      "synth_488",
      "synth_436"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_572_p",
        "systemId": "synth_572",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_573": {
    "id": "synth_573",
    "name": "미발견-573",
    "position": {
      "x": 1.6323575545218474,
      "y": 0.3588064432271267
    },
    "zone": "neutral",
    "connections": [
      "synth_437",
      "synth_601",
      "synth_529"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_573_p",
        "systemId": "synth_573",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_574": {
    "id": "synth_574",
    "name": "미발견-574",
    "position": {
      "x": 0.7580264070304368,
      "y": 2.6831442856203105
    },
    "zone": "neutral",
    "connections": [
      "synth_482",
      "synth_438",
      "synth_634"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_574_p",
        "systemId": "synth_574",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_575": {
    "id": "synth_575",
    "name": "미발견-575",
    "position": {
      "x": -0.4142280709927756,
      "y": 0.6163445724877362
    },
    "zone": "neutral",
    "connections": [
      "synth_435",
      "synth_623",
      "synth_519"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_575_p",
        "systemId": "synth_575",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_576": {
    "id": "synth_576",
    "name": "미발견-576",
    "position": {
      "x": 0.9184788644573787,
      "y": -1.7412796751638195
    },
    "zone": "neutral",
    "connections": [
      "synth_408",
      "synth_720",
      "synth_552"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_576_p",
        "systemId": "synth_576",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_577": {
    "id": "synth_577",
    "name": "미발견-577",
    "position": {
      "x": 2.334069042322205,
      "y": -0.11274579556775169
    },
    "zone": "neutral",
    "connections": [
      "synth_533",
      "synth_421",
      "synth_721"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_577_p",
        "systemId": "synth_577",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_578": {
    "id": "synth_578",
    "name": "미발견-578",
    "position": {
      "x": 1.2288436280940127,
      "y": 1.7508945618939586
    },
    "zone": "neutral",
    "connections": [
      "synth_518",
      "synth_734",
      "synth_682"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_578_p",
        "systemId": "synth_578",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_579": {
    "id": "synth_579",
    "name": "미발견-579",
    "position": {
      "x": -1.3482223181553699,
      "y": -0.06340149510237265
    },
    "zone": "neutral",
    "connections": [
      "synth_423",
      "synth_431",
      "synth_611"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_579_p",
        "systemId": "synth_579",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_580": {
    "id": "synth_580",
    "name": "미발견-580",
    "position": {
      "x": 1.2133150863126139,
      "y": -0.8508763837987608
    },
    "zone": "neutral",
    "connections": [
      "synth_452",
      "synth_412",
      "synth_724"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_580_p",
        "systemId": "synth_580",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_581": {
    "id": "synth_581",
    "name": "미발견-581",
    "position": {
      "x": 2.705824679407064,
      "y": 0.9751522917228918
    },
    "zone": "neutral",
    "connections": [
      "synth_497",
      "synth_477",
      "synth_737"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_581_p",
        "systemId": "synth_581",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_582": {
    "id": "synth_582",
    "name": "미발견-582",
    "position": {
      "x": 1.3073515908393898,
      "y": 2.102992330234934
    },
    "zone": "neutral",
    "connections": [
      "synth_466",
      "synth_478",
      "synth_622"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_582_p",
        "systemId": "synth_582",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_583": {
    "id": "synth_583",
    "name": "미발견-583",
    "position": {
      "x": -0.386358942868225,
      "y": 0.3351235908148589
    },
    "zone": "neutral",
    "connections": [
      "synth_499",
      "synth_467",
      "synth_619"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_583_p",
        "systemId": "synth_583",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_584": {
    "id": "synth_584",
    "name": "미발견-584",
    "position": {
      "x": 0.14569271186144242,
      "y": -1.5930583755973104
    },
    "zone": "neutral",
    "connections": [
      "synth_480",
      "synth_596"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_584_p",
        "systemId": "synth_584",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_585": {
    "id": "synth_585",
    "name": "미발견-585",
    "position": {
      "x": 1.9650976051762352,
      "y": -0.03561399843315526
    },
    "zone": "neutral",
    "connections": [
      "synth_717",
      "synth_405",
      "synth_429"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_585_p",
        "systemId": "synth_585",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_586": {
    "id": "synth_586",
    "name": "미발견-586",
    "position": {
      "x": 1.3375688715635063,
      "y": 2.2210761583450687
    },
    "zone": "neutral",
    "connections": [
      "synth_626",
      "synth_714",
      "synth_478"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_586_p",
        "systemId": "synth_586",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_587": {
    "id": "synth_587",
    "name": "미발견-587",
    "position": {
      "x": -1.4974298450791494,
      "y": 0.92475379383545
    },
    "zone": "neutral",
    "connections": [
      "synth_679",
      "synth_667",
      "synth_407"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_587_p",
        "systemId": "synth_587",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_588": {
    "id": "synth_588",
    "name": "미발견-588",
    "position": {
      "x": 1.1828725114530658,
      "y": -1.5416510030527106
    },
    "zone": "neutral",
    "connections": [
      "synth_420",
      "synth_712",
      "synth_508"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_588_p",
        "systemId": "synth_588",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_589": {
    "id": "synth_589",
    "name": "미발견-589",
    "position": {
      "x": 2.0102931831199777,
      "y": 0.9846878048223254
    },
    "zone": "neutral",
    "connections": [
      "synth_469",
      "synth_725",
      "synth_685"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_589_p",
        "systemId": "synth_589",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_590": {
    "id": "synth_590",
    "name": "미발견-590",
    "position": {
      "x": 1.2417074681579947,
      "y": 2.3951928512405196
    },
    "zone": "neutral",
    "connections": [
      "synth_486",
      "synth_610",
      "synth_714"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_590_p",
        "systemId": "synth_590",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_591": {
    "id": "synth_591",
    "name": "미발견-591",
    "position": {
      "x": -0.6768976914792653,
      "y": -0.019055332527911084
    },
    "zone": "neutral",
    "connections": [
      "synth_443",
      "synth_403",
      "synth_703"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_591_p",
        "systemId": "synth_591",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_592": {
    "id": "synth_592",
    "name": "미발견-592",
    "position": {
      "x": 0.05446605258286898,
      "y": -1.5115227873495427
    },
    "zone": "neutral",
    "connections": [
      "synth_480",
      "synth_736",
      "synth_492"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_592_p",
        "systemId": "synth_592",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_593": {
    "id": "synth_593",
    "name": "미발견-593",
    "position": {
      "x": 1.626458471408269,
      "y": 0.5554636385232083
    },
    "zone": "neutral",
    "connections": [
      "synth_561",
      "synth_481",
      "synth_705"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_593_p",
        "systemId": "synth_593",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_594": {
    "id": "synth_594",
    "name": "미발견-594",
    "position": {
      "x": 0.33842641930594136,
      "y": 2.638750902486736
    },
    "zone": "neutral",
    "connections": [
      "synth_426",
      "synth_602",
      "synth_490"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_594_p",
        "systemId": "synth_594",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_595": {
    "id": "synth_595",
    "name": "미발견-595",
    "position": {
      "x": -1.8055894396754577,
      "y": 0.5929947357408324
    },
    "zone": "neutral",
    "connections": [
      "synth_535",
      "synth_707",
      "synth_687"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_595_p",
        "systemId": "synth_595",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_596": {
    "id": "synth_596",
    "name": "미발견-596",
    "position": {
      "x": 0.23023510239719405,
      "y": -1.6733313224714836
    },
    "zone": "neutral",
    "connections": [
      "synth_472",
      "synth_584",
      "synth_700"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_596_p",
        "systemId": "synth_596",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_597": {
    "id": "synth_597",
    "name": "미발견-597",
    "position": {
      "x": 2.5739743608388297,
      "y": -0.10005844860639417
    },
    "zone": "neutral",
    "connections": [
      "synth_441",
      "synth_733",
      "synth_537"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_597_p",
        "systemId": "synth_597",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_598": {
    "id": "synth_598",
    "name": "미발견-598",
    "position": {
      "x": -0.019930360805225922,
      "y": 2.20251054544601
    },
    "zone": "neutral",
    "connections": [
      "synth_502",
      "synth_534",
      "synth_730"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_598_p",
        "systemId": "synth_598",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_599": {
    "id": "synth_599",
    "name": "미발견-599",
    "position": {
      "x": -1.5598863539354482,
      "y": 0.019978631042853388
    },
    "zone": "neutral",
    "connections": [
      "synth_487",
      "synth_731",
      "synth_651"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_599_p",
        "systemId": "synth_599",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_600": {
    "id": "synth_600",
    "name": "미발견-600",
    "position": {
      "x": 0.9787531665011036,
      "y": -0.5958732333346658
    },
    "zone": "neutral",
    "connections": [
      "synth_444",
      "synth_704",
      "synth_672"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_600_p",
        "systemId": "synth_600",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_601": {
    "id": "synth_601",
    "name": "미발견-601",
    "position": {
      "x": 1.6255342778983588,
      "y": 0.26571361901561624
    },
    "zone": "neutral",
    "connections": [
      "synth_573",
      "synth_709"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_601_p",
        "systemId": "synth_601",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_602": {
    "id": "synth_602",
    "name": "미발견-602",
    "position": {
      "x": 0.4163667797854131,
      "y": 2.6909922466555476
    },
    "zone": "neutral",
    "connections": [
      "synth_594",
      "synth_718"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_602_p",
        "systemId": "synth_602",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_603": {
    "id": "synth_603",
    "name": "미발견-603",
    "position": {
      "x": -1.228576191413721,
      "y": 1.03896278642023
    },
    "zone": "neutral",
    "connections": [
      "synth_699"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_603_p",
        "systemId": "synth_603",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_604": {
    "id": "synth_604",
    "name": "미발견-604",
    "position": {
      "x": 0.6251928018610213,
      "y": -1.8141473181018166
    },
    "zone": "neutral",
    "connections": [
      "synth_524",
      "synth_544",
      "synth_636"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_604_p",
        "systemId": "synth_604",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_605": {
    "id": "synth_605",
    "name": "미발견-605",
    "position": {
      "x": 2.051761537842031,
      "y": -0.08625561964241012
    },
    "zone": "neutral",
    "connections": [
      "synth_429",
      "synth_649",
      "synth_717"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_605_p",
        "systemId": "synth_605",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_606": {
    "id": "synth_606",
    "name": "미발견-606",
    "position": {
      "x": 0.292688011030671,
      "y": 1.5076494444927802
    },
    "zone": "neutral",
    "connections": [
      "synth_670",
      "synth_494",
      "synth_542"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_606_p",
        "systemId": "synth_606",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_607": {
    "id": "synth_607",
    "name": "미발견-607",
    "position": {
      "x": -1.8308483151526715,
      "y": 0.4412631715153603
    },
    "zone": "neutral",
    "connections": [
      "synth_515",
      "synth_659",
      "synth_687"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_607_p",
        "systemId": "synth_607",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_608": {
    "id": "synth_608",
    "name": "미발견-608",
    "position": {
      "x": 0.8225694687760094,
      "y": -1.7852717534744824
    },
    "zone": "neutral",
    "connections": [
      "synth_484",
      "synth_732",
      "synth_720"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_608_p",
        "systemId": "synth_608",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_609": {
    "id": "synth_609",
    "name": "미발견-609",
    "position": {
      "x": 2.480173282824718,
      "y": 1.0532622035474428
    },
    "zone": "neutral",
    "connections": [
      "synth_465",
      "synth_673",
      "synth_489"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_609_p",
        "systemId": "synth_609",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_610": {
    "id": "synth_610",
    "name": "미발견-610",
    "position": {
      "x": 1.1830047048399,
      "y": 2.504989710170881
    },
    "zone": "neutral",
    "connections": [
      "synth_486",
      "synth_510",
      "synth_590"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_610_p",
        "systemId": "synth_610",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_611": {
    "id": "synth_611",
    "name": "미발견-611",
    "position": {
      "x": -1.261082210315745,
      "y": -0.09496545010489015
    },
    "zone": "neutral",
    "connections": [
      "synth_579",
      "synth_671"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_611_p",
        "systemId": "synth_611",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_612": {
    "id": "synth_612",
    "name": "미발견-612",
    "position": {
      "x": 0.48906486570930474,
      "y": -0.5263941773421229
    },
    "zone": "neutral",
    "connections": [
      "synth_696",
      "synth_540",
      "synth_728"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_612_p",
        "systemId": "synth_612",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_613": {
    "id": "synth_613",
    "name": "미발견-613",
    "position": {
      "x": 1.8505646563770195,
      "y": -0.015372327321893399
    },
    "zone": "neutral",
    "connections": [
      "synth_513",
      "synth_405",
      "synth_717"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_613_p",
        "systemId": "synth_613",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_614": {
    "id": "synth_614",
    "name": "미발견-614",
    "position": {
      "x": 1.0700798688842852,
      "y": 2.5829311470353846
    },
    "zone": "neutral",
    "connections": [
      "synth_510",
      "synth_694",
      "synth_402"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_614_p",
        "systemId": "synth_614",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_615": {
    "id": "synth_615",
    "name": "미발견-615",
    "position": {
      "x": -0.5140656778100077,
      "y": 0.09152092324759141
    },
    "zone": "neutral",
    "connections": [
      "synth_539",
      "synth_695",
      "synth_447"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_615_p",
        "systemId": "synth_615",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_616": {
    "id": "synth_616",
    "name": "미발견-616",
    "position": {
      "x": 0.4215749873677837,
      "y": -1.7849541786160954
    },
    "zone": "neutral",
    "connections": [
      "synth_512",
      "synth_636",
      "synth_700"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_616_p",
        "systemId": "synth_616",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_617": {
    "id": "synth_617",
    "name": "미발견-617",
    "position": {
      "x": 1.7772520966336616,
      "y": 0.07854509353233177
    },
    "zone": "neutral",
    "connections": [
      "synth_513",
      "synth_541",
      "synth_729"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_617_p",
        "systemId": "synth_617",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_618": {
    "id": "synth_618",
    "name": "미발견-618",
    "position": {
      "x": 0.546155848908822,
      "y": 1.4360752872119495
    },
    "zone": "neutral",
    "connections": [
      "synth_558",
      "synth_630"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_618_p",
        "systemId": "synth_618",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_619": {
    "id": "synth_619",
    "name": "미발견-619",
    "position": {
      "x": -0.3102228998293971,
      "y": 0.4015211928815984
    },
    "zone": "neutral",
    "connections": [
      "synth_583",
      "synth_559",
      "synth_663"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_619_p",
        "systemId": "synth_619",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_620": {
    "id": "synth_620",
    "name": "미발견-620",
    "position": {
      "x": 1.2738897644933909,
      "y": -1.4241452588225763
    },
    "zone": "neutral",
    "connections": [
      "synth_496",
      "synth_508",
      "synth_668"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_620_p",
        "systemId": "synth_620",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_621": {
    "id": "synth_621",
    "name": "미발견-621",
    "position": {
      "x": 3.042474000172236,
      "y": 0.7402933088877478
    },
    "zone": "neutral",
    "connections": [
      "synth_493",
      "synth_505",
      "synth_701"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_621_p",
        "systemId": "synth_621",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_622": {
    "id": "synth_622",
    "name": "미발견-622",
    "position": {
      "x": 1.3328570940872568,
      "y": 2.010350477141045
    },
    "zone": "neutral",
    "connections": [
      "synth_466",
      "synth_582",
      "synth_562"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_622_p",
        "systemId": "synth_622",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_623": {
    "id": "synth_623",
    "name": "미발견-623",
    "position": {
      "x": -0.37628830855721324,
      "y": 0.6979566611274104
    },
    "zone": "neutral",
    "connections": [
      "synth_575",
      "synth_519",
      "synth_655"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_623_p",
        "systemId": "synth_623",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_624": {
    "id": "synth_624",
    "name": "미발견-624",
    "position": {
      "x": 0.002388861647135315,
      "y": -0.8731048304735622
    },
    "zone": "neutral",
    "connections": [
      "synth_688",
      "synth_456",
      "synth_708"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_624_p",
        "systemId": "synth_624",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_625": {
    "id": "synth_625",
    "name": "미발견-625",
    "position": {
      "x": 1.8471292160069854,
      "y": 0.8722396114463972
    },
    "zone": "neutral",
    "connections": [
      "synth_525",
      "synth_713",
      "synth_521"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_625_p",
        "systemId": "synth_625",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_626": {
    "id": "synth_626",
    "name": "미발견-626",
    "position": {
      "x": 1.2816607888796874,
      "y": 2.291856464579766
    },
    "zone": "neutral",
    "connections": [
      "synth_458",
      "synth_714",
      "synth_586"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_626_p",
        "systemId": "synth_626",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_627": {
    "id": "synth_627",
    "name": "미발견-627",
    "position": {
      "x": -0.553253250699603,
      "y": 0.8618278740057558
    },
    "zone": "neutral",
    "connections": [
      "synth_491",
      "synth_511",
      "synth_635"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_627_p",
        "systemId": "synth_627",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_628": {
    "id": "synth_628",
    "name": "미발견-628",
    "position": {
      "x": 1.3632713498565217,
      "y": -1.2077373071381539
    },
    "zone": "neutral",
    "connections": [
      "synth_516",
      "synth_568",
      "synth_680"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_628_p",
        "systemId": "synth_628",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_629": {
    "id": "synth_629",
    "name": "미발견-629",
    "position": {
      "x": 2.422737779505184,
      "y": -0.14176200396205618
    },
    "zone": "neutral",
    "connections": [
      "synth_449",
      "synth_733",
      "synth_421"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_629_p",
        "systemId": "synth_629",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_630": {
    "id": "synth_630",
    "name": "미발견-630",
    "position": {
      "x": 0.6401815689486327,
      "y": 1.423789043973882
    },
    "zone": "neutral",
    "connections": [
      "synth_506",
      "synth_618",
      "synth_702"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_630_p",
        "systemId": "synth_630",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_631": {
    "id": "synth_631",
    "name": "미발견-631",
    "position": {
      "x": -1.7163987340616869,
      "y": 0.15174958827009205
    },
    "zone": "neutral",
    "connections": [
      "synth_523",
      "synth_475",
      "synth_723"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_631_p",
        "systemId": "synth_631",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_632": {
    "id": "synth_632",
    "name": "미발견-632",
    "position": {
      "x": 0.7708389045235544,
      "y": -0.5201038071706067
    },
    "zone": "neutral",
    "connections": [
      "synth_476",
      "synth_644",
      "synth_672"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_632_p",
        "systemId": "synth_632",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_633": {
    "id": "synth_633",
    "name": "미발견-633",
    "position": {
      "x": 2.9488186008358874,
      "y": 0.8462425433457201
    },
    "zone": "neutral",
    "connections": [
      "synth_569",
      "synth_701",
      "synth_505"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_633_p",
        "systemId": "synth_633",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_634": {
    "id": "synth_634",
    "name": "미발견-634",
    "position": {
      "x": 0.8557881763381215,
      "y": 2.6989428634140187
    },
    "zone": "neutral",
    "connections": [
      "synth_550",
      "synth_574",
      "synth_738"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_634_p",
        "systemId": "synth_634",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_635": {
    "id": "synth_635",
    "name": "미발견-635",
    "position": {
      "x": -0.6213824080290853,
      "y": 0.9262674364866784
    },
    "zone": "neutral",
    "connections": [
      "synth_627",
      "synth_571",
      "synth_415"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_635_p",
        "systemId": "synth_635",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_636": {
    "id": "synth_636",
    "name": "미발견-636",
    "position": {
      "x": 0.5050561731139345,
      "y": -1.8185114832133438
    },
    "zone": "neutral",
    "connections": [
      "synth_616",
      "synth_524",
      "synth_604"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_636_p",
        "systemId": "synth_636",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_637": {
    "id": "synth_637",
    "name": "미발견-637",
    "position": {
      "x": 2.723314893100316,
      "y": -0.08559886125045713
    },
    "zone": "neutral",
    "connections": [
      "synth_537",
      "synth_545"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_637_p",
        "systemId": "synth_637",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_638": {
    "id": "synth_638",
    "name": "미발견-638",
    "position": {
      "x": 0.04288061844949627,
      "y": 2.3889592562757653
    },
    "zone": "neutral",
    "connections": [
      "synth_666",
      "synth_450",
      "synth_654"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_638_p",
        "systemId": "synth_638",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_639": {
    "id": "synth_639",
    "name": "미발견-639",
    "position": {
      "x": -1.6912872770315743,
      "y": 0.8183434054645399
    },
    "zone": "neutral",
    "connections": [
      "synth_555",
      "synth_647",
      "synth_739"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_639_p",
        "systemId": "synth_639",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_640": {
    "id": "synth_640",
    "name": "미발견-640",
    "position": {
      "x": 1.3161284682100824,
      "y": -0.9425421327562356
    },
    "zone": "neutral",
    "connections": [
      "synth_724",
      "synth_556",
      "synth_452"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_640_p",
        "systemId": "synth_640",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_641": {
    "id": "synth_641",
    "name": "미발견-641",
    "position": {
      "x": 3.068643479495237,
      "y": 0.22616700304441636
    },
    "zone": "neutral",
    "connections": [
      "synth_461",
      "synth_557"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_641_p",
        "systemId": "synth_641",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_642": {
    "id": "synth_642",
    "name": "미발견-642",
    "position": {
      "x": 0.03082391896338341,
      "y": 1.7805846936412821
    },
    "zone": "neutral",
    "connections": [
      "synth_522",
      "synth_514",
      "synth_698"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_642_p",
        "systemId": "synth_642",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_643": {
    "id": "synth_643",
    "name": "미발견-643",
    "position": {
      "x": -0.37509522735505724,
      "y": 0.2267209323180871
    },
    "zone": "neutral",
    "connections": [
      "synth_499",
      "synth_527"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_643_p",
        "systemId": "synth_643",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_644": {
    "id": "synth_644",
    "name": "미발견-644",
    "position": {
      "x": 0.6678272940640791,
      "y": -0.5157325402997016
    },
    "zone": "neutral",
    "connections": [
      "synth_476",
      "synth_632",
      "synth_696"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_644_p",
        "systemId": "synth_644",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_645": {
    "id": "synth_645",
    "name": "미발견-645",
    "position": {
      "x": 2.8053567560112396,
      "y": 0.9491384280999544
    },
    "zone": "neutral",
    "connections": [
      "synth_477",
      "synth_569"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_645_p",
        "systemId": "synth_645",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_646": {
    "id": "synth_646",
    "name": "미발견-646",
    "position": {
      "x": 0.18722308843470298,
      "y": 2.5839300635164135
    },
    "zone": "neutral",
    "connections": [
      "synth_490",
      "synth_530",
      "synth_666"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_646_p",
        "systemId": "synth_646",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_647": {
    "id": "synth_647",
    "name": "미발견-647",
    "position": {
      "x": -1.758446191907849,
      "y": 0.7585224942531665
    },
    "zone": "neutral",
    "connections": [
      "synth_639",
      "synth_675",
      "synth_459"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_647_p",
        "systemId": "synth_647",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_648": {
    "id": "synth_648",
    "name": "미발견-648",
    "position": {
      "x": -0.010828710421267831,
      "y": -1.4058715081518778
    },
    "zone": "neutral",
    "connections": [
      "synth_500",
      "synth_692",
      "synth_492"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_648_p",
        "systemId": "synth_648",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_649": {
    "id": "synth_649",
    "name": "미발견-649",
    "position": {
      "x": 2.15129188162405,
      "y": -0.13043888232854847
    },
    "zone": "neutral",
    "connections": [
      "synth_517",
      "synth_605",
      "synth_721"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_649_p",
        "systemId": "synth_649",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_650": {
    "id": "synth_650",
    "name": "미발견-650",
    "position": {
      "x": 0.8530227908530007,
      "y": 1.4460964811986987
    },
    "zone": "neutral",
    "connections": [
      "synth_474",
      "synth_526",
      "synth_702"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_650_p",
        "systemId": "synth_650",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_651": {
    "id": "synth_651",
    "name": "미발견-651",
    "position": {
      "x": -1.492558597770087,
      "y": -0.04668353657744689
    },
    "zone": "neutral",
    "connections": [
      "synth_487",
      "synth_599",
      "synth_731"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_651_p",
        "systemId": "synth_651",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_652": {
    "id": "synth_652",
    "name": "미발견-652",
    "position": {
      "x": 1.1924534347604874,
      "y": -0.7506400125580444
    },
    "zone": "neutral",
    "connections": [
      "synth_684",
      "synth_464",
      "synth_724"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_652_p",
        "systemId": "synth_652",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_653": {
    "id": "synth_653",
    "name": "미발견-653",
    "position": {
      "x": 2.8611789244442076,
      "y": 0.029819907045073257
    },
    "zone": "neutral",
    "connections": [
      "synth_669",
      "synth_545"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_653_p",
        "systemId": "synth_653",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_654": {
    "id": "synth_654",
    "name": "미발견-654",
    "position": {
      "x": -0.04985947948360925,
      "y": 2.3046654992871853
    },
    "zone": "neutral",
    "connections": [
      "synth_534",
      "synth_730",
      "synth_638"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_654_p",
        "systemId": "synth_654",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_655": {
    "id": "synth_655",
    "name": "미발견-655",
    "position": {
      "x": -0.44896683325034303,
      "y": 0.7973934486781763
    },
    "zone": "neutral",
    "connections": [
      "synth_511",
      "synth_623"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_655_p",
        "systemId": "synth_655",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_656": {
    "id": "synth_656",
    "name": "미발견-656",
    "position": {
      "x": 0.13866204525354608,
      "y": -0.6885946869615791
    },
    "zone": "neutral",
    "connections": [
      "synth_708",
      "synth_548",
      "synth_488"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_656_p",
        "systemId": "synth_656",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_657": {
    "id": "synth_657",
    "name": "미발견-657",
    "position": {
      "x": 1.6997362558027478,
      "y": 0.7710231384266164
    },
    "zone": "neutral",
    "connections": [
      "synth_525",
      "synth_501",
      "synth_705"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_657_p",
        "systemId": "synth_657",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_658": {
    "id": "synth_658",
    "name": "미발견-658",
    "position": {
      "x": -0.060851310611125364,
      "y": 1.915954102579266
    },
    "zone": "neutral",
    "connections": [
      "synth_522",
      "synth_698",
      "synth_686"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_658_p",
        "systemId": "synth_658",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_659": {
    "id": "synth_659",
    "name": "미발견-659",
    "position": {
      "x": -1.8378098515924657,
      "y": 0.35153673126602913
    },
    "zone": "neutral",
    "connections": [
      "synth_607",
      "synth_711"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_659_p",
        "systemId": "synth_659",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_660": {
    "id": "synth_660",
    "name": "미발견-660",
    "position": {
      "x": 1.1257192787675565,
      "y": -1.6651201788746168
    },
    "zone": "neutral",
    "connections": [
      "synth_712",
      "synth_504"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_660_p",
        "systemId": "synth_660",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_661": {
    "id": "synth_661",
    "name": "미발견-661",
    "position": {
      "x": 3.117904111070696,
      "y": 0.6273324460197277
    },
    "zone": "neutral",
    "connections": [
      "synth_689",
      "synth_493"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_661_p",
        "systemId": "synth_661",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_662": {
    "id": "synth_662",
    "name": "미발견-662",
    "position": {
      "x": 0.08339396527678178,
      "y": 1.6671792471494602
    },
    "zone": "neutral",
    "connections": [
      "synth_514",
      "synth_470",
      "synth_690"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_662_p",
        "systemId": "synth_662",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_663": {
    "id": "synth_663",
    "name": "미발견-663",
    "position": {
      "x": -0.32067436280127937,
      "y": 0.5866703821980971
    },
    "zone": "neutral",
    "connections": [
      "synth_559",
      "synth_619"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_663_p",
        "systemId": "synth_663",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_664": {
    "id": "synth_664",
    "name": "미발견-664",
    "position": {
      "x": 0.2816636586922599,
      "y": -0.5730916875405339
    },
    "zone": "neutral",
    "connections": [
      "synth_532",
      "synth_548",
      "synth_728"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_664_p",
        "systemId": "synth_664",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_665": {
    "id": "synth_665",
    "name": "미발견-665",
    "position": {
      "x": 2.3678973186187244,
      "y": 1.0701831038254948
    },
    "zone": "neutral",
    "connections": [
      "synth_549",
      "synth_465"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_665_p",
        "systemId": "synth_665",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_666": {
    "id": "synth_666",
    "name": "미발견-666",
    "position": {
      "x": 0.049117030781529625,
      "y": 2.4787429249516917
    },
    "zone": "neutral",
    "connections": [
      "synth_638",
      "synth_530",
      "synth_646"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_666_p",
        "systemId": "synth_666",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_667": {
    "id": "synth_667",
    "name": "미발견-667",
    "position": {
      "x": -1.5927416570443798,
      "y": 0.9292799278176028
    },
    "zone": "neutral",
    "connections": [
      "synth_739",
      "synth_555",
      "synth_587"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_667_p",
        "systemId": "synth_667",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_668": {
    "id": "synth_668",
    "name": "미발견-668",
    "position": {
      "x": 1.3580189292841918,
      "y": -1.3480275880389616
    },
    "zone": "neutral",
    "connections": [
      "synth_568",
      "synth_620"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_668_p",
        "systemId": "synth_668",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_669": {
    "id": "synth_669",
    "name": "미발견-669",
    "position": {
      "x": 2.9552197348614375,
      "y": 0.0592323293344871
    },
    "zone": "neutral",
    "connections": [
      "synth_473",
      "synth_653",
      "synth_557"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_669_p",
        "systemId": "synth_669",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_670": {
    "id": "synth_670",
    "name": "미발견-670",
    "position": {
      "x": 0.36738409157974156,
      "y": 1.457444907343695
    },
    "zone": "neutral",
    "connections": [
      "synth_606",
      "synth_494",
      "synth_558"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_670_p",
        "systemId": "synth_670",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_671": {
    "id": "synth_671",
    "name": "미발견-671",
    "position": {
      "x": -1.1386531199599679,
      "y": -0.16186259097793845
    },
    "zone": "neutral",
    "connections": [
      "synth_483",
      "synth_611",
      "synth_391"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_671_p",
        "systemId": "synth_671",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_672": {
    "id": "synth_672",
    "name": "미발견-672",
    "position": {
      "x": 0.8745709175824022,
      "y": -0.521034606011427
    },
    "zone": "neutral",
    "connections": [
      "synth_520",
      "synth_632",
      "synth_600"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_672_p",
        "systemId": "synth_672",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_673": {
    "id": "synth_673",
    "name": "미발견-673",
    "position": {
      "x": 2.5696311845854236,
      "y": 1.0629393641730374
    },
    "zone": "neutral",
    "connections": [
      "synth_609",
      "synth_737"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_673_p",
        "systemId": "synth_673",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_674": {
    "id": "synth_674",
    "name": "미발견-674",
    "position": {
      "x": 1.0254072822461087,
      "y": 1.5230806612885033
    },
    "zone": "neutral",
    "connections": [
      "synth_538",
      "synth_546",
      "synth_722"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_674_p",
        "systemId": "synth_674",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_675": {
    "id": "synth_675",
    "name": "미발견-675",
    "position": {
      "x": -1.8333176719561275,
      "y": 0.7086499496729152
    },
    "zone": "neutral",
    "connections": [
      "synth_647",
      "synth_707"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_675_p",
        "systemId": "synth_675",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_676": {
    "id": "synth_676",
    "name": "미발견-676",
    "position": {
      "x": -0.09594117319193193,
      "y": -1.210526658119586
    },
    "zone": "neutral",
    "connections": [
      "synth_564"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_676_p",
        "systemId": "synth_676",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_677": {
    "id": "synth_677",
    "name": "미발견-677",
    "position": {
      "x": 2.1393961519849225,
      "y": 1.0466239088402574
    },
    "zone": "neutral",
    "connections": [
      "synth_509",
      "synth_693",
      "synth_725"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_677_p",
        "systemId": "synth_677",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_678": {
    "id": "synth_678",
    "name": "미발견-678",
    "position": {
      "x": -0.09169935386906267,
      "y": 2.126915257700224
    },
    "zone": "neutral",
    "connections": [
      "synth_686",
      "synth_730"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_678_p",
        "systemId": "synth_678",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_679": {
    "id": "synth_679",
    "name": "미발견-679",
    "position": {
      "x": -1.4581036712739077,
      "y": 1.0061514037198538
    },
    "zone": "neutral",
    "connections": [
      "synth_563",
      "synth_587",
      "synth_699"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_679_p",
        "systemId": "synth_679",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_680": {
    "id": "synth_680",
    "name": "미발견-680",
    "position": {
      "x": 1.3827426167303623,
      "y": -1.1024161285854277
    },
    "zone": "neutral",
    "connections": [
      "synth_556",
      "synth_628",
      "synth_432"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_680_p",
        "systemId": "synth_680",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_681": {
    "id": "synth_681",
    "name": "미발견-681",
    "position": {
      "x": 3.164731146727826,
      "y": 0.46027822414701636
    },
    "zone": "neutral",
    "connections": [
      "synth_565",
      "synth_689",
      "synth_553"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_681_p",
        "systemId": "synth_681",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_682": {
    "id": "synth_682",
    "name": "미발견-682",
    "position": {
      "x": 1.3060547047932611,
      "y": 1.797354809124477
    },
    "zone": "neutral",
    "connections": [
      "synth_726",
      "synth_578",
      "synth_734"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_682_p",
        "systemId": "synth_682",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_683": {
    "id": "synth_683",
    "name": "미발견-683",
    "position": {
      "x": -0.8690756304900585,
      "y": -0.1362064818829366
    },
    "zone": "neutral",
    "connections": [
      "synth_547",
      "synth_715",
      "synth_703"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_683_p",
        "systemId": "synth_683",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_684": {
    "id": "synth_684",
    "name": "미발견-684",
    "position": {
      "x": 1.1306034376070955,
      "y": -0.6718357921732432
    },
    "zone": "neutral",
    "connections": [
      "synth_536",
      "synth_704",
      "synth_652"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_684_p",
        "systemId": "synth_684",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_685": {
    "id": "synth_685",
    "name": "미발견-685",
    "position": {
      "x": 1.9098025971525883,
      "y": 0.9728096045583965
    },
    "zone": "neutral",
    "connections": [
      "synth_521",
      "synth_589",
      "synth_713"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_685_p",
        "systemId": "synth_685",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_686": {
    "id": "synth_686",
    "name": "미발견-686",
    "position": {
      "x": -0.11007646808614062,
      "y": 2.0387978176379353
    },
    "zone": "neutral",
    "connections": [
      "synth_554",
      "synth_678",
      "synth_658"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_686_p",
        "systemId": "synth_686",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_687": {
    "id": "synth_687",
    "name": "미발견-687",
    "position": {
      "x": -1.895744464410449,
      "y": 0.52069764236977
    },
    "zone": "neutral",
    "connections": [
      "synth_607",
      "synth_707",
      "synth_595"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_687_p",
        "systemId": "synth_687",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_688": {
    "id": "synth_688",
    "name": "미발견-688",
    "position": {
      "x": -0.057810637537494595,
      "y": -0.9474401525291384
    },
    "zone": "neutral",
    "connections": [
      "synth_624",
      "synth_716",
      "synth_560"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_688_p",
        "systemId": "synth_688",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_689": {
    "id": "synth_689",
    "name": "미발견-689",
    "position": {
      "x": 3.1765130757249205,
      "y": 0.5576368873666888
    },
    "zone": "neutral",
    "connections": [
      "synth_565",
      "synth_661",
      "synth_681"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_689_p",
        "systemId": "synth_689",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_690": {
    "id": "synth_690",
    "name": "미발견-690",
    "position": {
      "x": 0.12403058135999474,
      "y": 1.5694252306263377
    },
    "zone": "neutral",
    "connections": [
      "synth_542",
      "synth_662",
      "synth_470"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_690_p",
        "systemId": "synth_690",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_691": {
    "id": "synth_691",
    "name": "미발견-691",
    "position": {
      "x": -1.061521808153136,
      "y": 1.0724244496372481
    },
    "zone": "neutral",
    "connections": [
      "synth_543",
      "synth_551",
      "synth_727"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_691_p",
        "systemId": "synth_691",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_692": {
    "id": "synth_692",
    "name": "미발견-692",
    "position": {
      "x": -0.04913273240897345,
      "y": -1.315674622178542
    },
    "zone": "neutral",
    "connections": [
      "synth_500",
      "synth_648",
      "synth_468"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_692_p",
        "systemId": "synth_692",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_693": {
    "id": "synth_693",
    "name": "미발견-693",
    "position": {
      "x": 2.2228021703628693,
      "y": 1.0892559352981142
    },
    "zone": "neutral",
    "connections": [
      "synth_549",
      "synth_677",
      "synth_509"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_693_p",
        "systemId": "synth_693",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_694": {
    "id": "synth_694",
    "name": "미발견-694",
    "position": {
      "x": 1.0505772580580988,
      "y": 2.671012911190287
    },
    "zone": "neutral",
    "connections": [
      "synth_614",
      "synth_738"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_694_p",
        "systemId": "synth_694",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_695": {
    "id": "synth_695",
    "name": "미발견-695",
    "position": {
      "x": -0.42409833098345573,
      "y": 0.08910650916070544
    },
    "zone": "neutral",
    "connections": [
      "synth_615",
      "synth_527",
      "synth_735"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_695_p",
        "systemId": "synth_695",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_696": {
    "id": "synth_696",
    "name": "미발견-696",
    "position": {
      "x": 0.5693669441985071,
      "y": -0.4831508621503867
    },
    "zone": "neutral",
    "connections": [
      "synth_528",
      "synth_612",
      "synth_644"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_696_p",
        "systemId": "synth_696",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_697": {
    "id": "synth_697",
    "name": "미발견-697",
    "position": {
      "x": 1.5525841604568398,
      "y": 0.4456198348311026
    },
    "zone": "neutral",
    "connections": [
      "synth_529"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_697_p",
        "systemId": "synth_697",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_698": {
    "id": "synth_698",
    "name": "미발견-698",
    "position": {
      "x": -0.0636745837732745,
      "y": 1.8211873644197012
    },
    "zone": "neutral",
    "connections": [
      "synth_658",
      "synth_642"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_698_p",
        "systemId": "synth_698",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_699": {
    "id": "synth_699",
    "name": "미발견-699",
    "position": {
      "x": -1.316566445213545,
      "y": 1.0578447822774153
    },
    "zone": "neutral",
    "connections": [
      "synth_603",
      "synth_563",
      "synth_679"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_699_p",
        "systemId": "synth_699",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_700": {
    "id": "synth_700",
    "name": "미발견-700",
    "position": {
      "x": 0.326910889709905,
      "y": -1.7829242941627343
    },
    "zone": "neutral",
    "connections": [
      "synth_512",
      "synth_616",
      "synth_596"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_700_p",
        "systemId": "synth_700",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_701": {
    "id": "synth_701",
    "name": "미발견-701",
    "position": {
      "x": 3.0384739658183055,
      "y": 0.8384166543395044
    },
    "zone": "neutral",
    "connections": [
      "synth_633",
      "synth_621"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_701_p",
        "systemId": "synth_701",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_702": {
    "id": "synth_702",
    "name": "미발견-702",
    "position": {
      "x": 0.75405732097282,
      "y": 1.3965300115933093
    },
    "zone": "neutral",
    "connections": [
      "synth_526",
      "synth_650",
      "synth_630"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_702_p",
        "systemId": "synth_702",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_703": {
    "id": "synth_703",
    "name": "미발견-703",
    "position": {
      "x": -0.7354556830967672,
      "y": -0.12090549411791318
    },
    "zone": "neutral",
    "connections": [
      "synth_547",
      "synth_591",
      "synth_683"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_703_p",
        "systemId": "synth_703",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_704": {
    "id": "synth_704",
    "name": "미발견-704",
    "position": {
      "x": 1.0708012848992856,
      "y": -0.6001942193888432
    },
    "zone": "neutral",
    "connections": [
      "synth_536",
      "synth_600",
      "synth_684"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_704_p",
        "systemId": "synth_704",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_705": {
    "id": "synth_705",
    "name": "미발견-705",
    "position": {
      "x": 1.5869752019307697,
      "y": 0.673615523419256
    },
    "zone": "neutral",
    "connections": [
      "synth_561",
      "synth_593",
      "synth_657"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_705_p",
        "systemId": "synth_705",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_706": {
    "id": "synth_706",
    "name": "미발견-706",
    "position": {
      "x": 0.7061014094821702,
      "y": 2.7761656557115573
    },
    "zone": "neutral",
    "connections": [
      "synth_570",
      "synth_718"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_706_p",
        "systemId": "synth_706",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_707": {
    "id": "synth_707",
    "name": "미발견-707",
    "position": {
      "x": -1.8917402768820042,
      "y": 0.6235961387551396
    },
    "zone": "neutral",
    "connections": [
      "synth_595",
      "synth_687",
      "synth_675"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_707_p",
        "systemId": "synth_707",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_708": {
    "id": "synth_708",
    "name": "미발견-708",
    "position": {
      "x": 0.05744037220576689,
      "y": -0.7273635424604632
    },
    "zone": "neutral",
    "connections": [
      "synth_656",
      "synth_572",
      "synth_624"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_708_p",
        "systemId": "synth_708",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_709": {
    "id": "synth_709",
    "name": "미발견-709",
    "position": {
      "x": 1.6315804260381526,
      "y": 0.17057226566146336
    },
    "zone": "neutral",
    "connections": [
      "synth_601",
      "synth_541",
      "synth_729"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_709_p",
        "systemId": "synth_709",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_710": {
    "id": "synth_710",
    "name": "미발견-710",
    "position": {
      "x": 0.9662718451278212,
      "y": 1.4394103585297238
    },
    "zone": "neutral",
    "connections": [
      "synth_474"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_710_p",
        "systemId": "synth_710",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_711": {
    "id": "synth_711",
    "name": "미발견-711",
    "position": {
      "x": -1.8198801110347627,
      "y": 0.2180679445587878
    },
    "zone": "neutral",
    "connections": [
      "synth_567",
      "synth_659"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_711_p",
        "systemId": "synth_711",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_712": {
    "id": "synth_712",
    "name": "미발견-712",
    "position": {
      "x": 1.2077699791726524,
      "y": -1.6281381528292211
    },
    "zone": "neutral",
    "connections": [
      "synth_588",
      "synth_660",
      "synth_420"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_712_p",
        "systemId": "synth_712",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_713": {
    "id": "synth_713",
    "name": "미발견-713",
    "position": {
      "x": 1.7792900765766095,
      "y": 0.9314092911658126
    },
    "zone": "neutral",
    "connections": [
      "synth_625",
      "synth_685"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_713_p",
        "systemId": "synth_713",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_714": {
    "id": "synth_714",
    "name": "미발견-714",
    "position": {
      "x": 1.3666429280275316,
      "y": 2.32148414668843
    },
    "zone": "neutral",
    "connections": [
      "synth_626",
      "synth_586",
      "synth_590"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_714_p",
        "systemId": "synth_714",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_715": {
    "id": "synth_715",
    "name": "미발견-715",
    "position": {
      "x": -0.9585752957783066,
      "y": -0.1559509067897416
    },
    "zone": "neutral",
    "connections": [
      "synth_507",
      "synth_683"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_715_p",
        "systemId": "synth_715",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_716": {
    "id": "synth_716",
    "name": "미발견-716",
    "position": {
      "x": -0.1226558900978268,
      "y": -1.02541655552109
    },
    "zone": "neutral",
    "connections": [
      "synth_560",
      "synth_688"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_716_p",
        "systemId": "synth_716",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_717": {
    "id": "synth_717",
    "name": "미발견-717",
    "position": {
      "x": 1.932371520258125,
      "y": -0.11945315018104202
    },
    "zone": "neutral",
    "connections": [
      "synth_585",
      "synth_605",
      "synth_613"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_717_p",
        "systemId": "synth_717",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_718": {
    "id": "synth_718",
    "name": "미발견-718",
    "position": {
      "x": 0.572545797702462,
      "y": 2.7683906721418494
    },
    "zone": "neutral",
    "connections": [
      "synth_706",
      "synth_602"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_718_p",
        "systemId": "synth_718",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_719": {
    "id": "synth_719",
    "name": "미발견-719",
    "position": {
      "x": -0.7725812896178316,
      "y": 1.0331230107044762
    },
    "zone": "neutral",
    "connections": [
      "synth_571",
      "synth_531",
      "synth_727"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_719_p",
        "systemId": "synth_719",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_720": {
    "id": "synth_720",
    "name": "미발견-720",
    "position": {
      "x": 0.9972574415604011,
      "y": -1.7895322068054216
    },
    "zone": "neutral",
    "connections": [
      "synth_552",
      "synth_576",
      "synth_608"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_720_p",
        "systemId": "synth_720",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_721": {
    "id": "synth_721",
    "name": "미발견-721",
    "position": {
      "x": 2.27620210314669,
      "y": -0.18265344474746983
    },
    "zone": "neutral",
    "connections": [
      "synth_533",
      "synth_577",
      "synth_649"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_721_p",
        "systemId": "synth_721",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_722": {
    "id": "synth_722",
    "name": "미발견-722",
    "position": {
      "x": 1.1228744009687979,
      "y": 1.543370239662056
    },
    "zone": "neutral",
    "connections": [
      "synth_546",
      "synth_674",
      "synth_566"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_722_p",
        "systemId": "synth_722",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_723": {
    "id": "synth_723",
    "name": "미발견-723",
    "position": {
      "x": -1.7016578415295416,
      "y": 0.05804364481660982
    },
    "zone": "neutral",
    "connections": [
      "synth_523",
      "synth_731",
      "synth_631"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_723_p",
        "systemId": "synth_723",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_724": {
    "id": "synth_724",
    "name": "미발견-724",
    "position": {
      "x": 1.3102421970911682,
      "y": -0.8527348289759291
    },
    "zone": "neutral",
    "connections": [
      "synth_640",
      "synth_580",
      "synth_652"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_724_p",
        "systemId": "synth_724",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_725": {
    "id": "synth_725",
    "name": "미발견-725",
    "position": {
      "x": 2.046436419404124,
      "y": 1.0683682993344679
    },
    "zone": "neutral",
    "connections": [
      "synth_589",
      "synth_677"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_725_p",
        "systemId": "synth_725",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_726": {
    "id": "synth_726",
    "name": "미발견-726",
    "position": {
      "x": 1.3457030435887298,
      "y": 1.8781509057536878
    },
    "zone": "neutral",
    "connections": [
      "synth_682",
      "synth_562"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_726_p",
        "systemId": "synth_726",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_727": {
    "id": "synth_727",
    "name": "미발견-727",
    "position": {
      "x": -0.9255749363339543,
      "y": 1.0909056063312008
    },
    "zone": "neutral",
    "connections": [
      "synth_551",
      "synth_691",
      "synth_719"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_727_p",
        "systemId": "synth_727",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_728": {
    "id": "synth_728",
    "name": "미발견-728",
    "position": {
      "x": 0.3951188314543066,
      "y": -0.5028025008832214
    },
    "zone": "neutral",
    "connections": [
      "synth_540",
      "synth_612",
      "synth_664"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_728_p",
        "systemId": "synth_728",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_729": {
    "id": "synth_729",
    "name": "미발견-729",
    "position": {
      "x": 1.6748553210983708,
      "y": 0.0747380679107125
    },
    "zone": "neutral",
    "connections": [
      "synth_617",
      "synth_709"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_729_p",
        "systemId": "synth_729",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_730": {
    "id": "synth_730",
    "name": "미발견-730",
    "position": {
      "x": -0.10901701485883909,
      "y": 2.215269205474151
    },
    "zone": "neutral",
    "connections": [
      "synth_598",
      "synth_678",
      "synth_654"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_730_p",
        "systemId": "synth_730",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_731": {
    "id": "synth_731",
    "name": "미발견-731",
    "position": {
      "x": -1.6460094601665196,
      "y": -0.0184528315524115
    },
    "zone": "neutral",
    "connections": [
      "synth_599",
      "synth_723",
      "synth_651"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_731_p",
        "systemId": "synth_731",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_732": {
    "id": "synth_732",
    "name": "미발견-732",
    "position": {
      "x": 0.7677725608068775,
      "y": -1.857644498258646
    },
    "zone": "neutral",
    "connections": [
      "synth_608",
      "synth_544"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_732_p",
        "systemId": "synth_732",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_733": {
    "id": "synth_733",
    "name": "미발견-733",
    "position": {
      "x": 2.5236551954091224,
      "y": -0.17467669853939113
    },
    "zone": "neutral",
    "connections": [
      "synth_597",
      "synth_629"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_733_p",
        "systemId": "synth_733",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_734": {
    "id": "synth_734",
    "name": "미발견-734",
    "position": {
      "x": 1.2365510495022547,
      "y": 1.6612590258154847
    },
    "zone": "neutral",
    "connections": [
      "synth_578",
      "synth_566",
      "synth_682"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_734_p",
        "systemId": "synth_734",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_735": {
    "id": "synth_735",
    "name": "미발견-735",
    "position": {
      "x": -0.502589739157595,
      "y": -0.010039452656388373
    },
    "zone": "neutral",
    "connections": [
      "synth_695"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_735_p",
        "systemId": "synth_735",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_736": {
    "id": "synth_736",
    "name": "미발견-736",
    "position": {
      "x": -0.03549723498087645,
      "y": -1.5139707803370814
    },
    "zone": "neutral",
    "connections": [
      "synth_592"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_736_p",
        "systemId": "synth_736",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_737": {
    "id": "synth_737",
    "name": "미발견-737",
    "position": {
      "x": 2.6596066804031753,
      "y": 1.0614980683349904
    },
    "zone": "neutral",
    "connections": [
      "synth_673",
      "synth_581"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_737_p",
        "systemId": "synth_737",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_738": {
    "id": "synth_738",
    "name": "미발견-738",
    "position": {
      "x": 0.9666114438337671,
      "y": 2.719156690045901
    },
    "zone": "neutral",
    "connections": [
      "synth_550",
      "synth_694",
      "synth_634"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_738_p",
        "systemId": "synth_738",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  },
  "synth_739": {
    "id": "synth_739",
    "name": "미발견-739",
    "position": {
      "x": -1.6820682500734478,
      "y": 0.9182908524430884
    },
    "zone": "neutral",
    "connections": [
      "synth_667",
      "synth_639"
    ],
    "enemyLevel": 1,
    "description": "아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.",
    "planets": [
      {
        "id": "synth_739_p",
        "systemId": "synth_739",
        "name": "미상 행성",
        "description": "탐사 불가 구역.",
        "hasTradePort": false,
        "hasShipyard": false,
        "hasTavern": false,
        "tradeGoods": [],
        "factionId": "unknown",
        "coreResource": 50,
        "corePopulation": 50,
        "coreDefense": 50,
        "coreTechnology": 50,
        "coreEnvironment": 50
      }
    ]
  }
};
