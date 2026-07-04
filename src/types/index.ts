// ============================================================
// 아크파이어 온라인 - 전체 타입 정의
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

/** 무역소 등으로 인도된 전함 — 격납고 보관(액티브 함선 `ship`과 별도) */
export interface PlayerHangarShip {
  id: string;
  npcCapitalShipId: string;
  acquiredAt: number;
  /** 선체 내구도 0~100. 미설정 시 100% */
  durabilityPct?: number;
}

/** 파일럿 레벨 연동 전투 숙련도 — `arcfire_player_v1` 영속 */
export interface PlayerCombatProficiency {
  combatLevel: number;
  proficiencyMultiplier: number;
  operatingEfficiencyPct: number;
  updatedAt: number;
}

/** 레벨업 모달 전용 스냅샷 — 비영속 */
export interface LevelUpSummary {
  previousLevel: number;
  newLevel: number;
  skillPointsGained: number;
  expRemainingForNextLevel: number;
  nextLevelThresholdExp: number;
  proficiencyBefore: PlayerCombatProficiency;
  proficiencyAfter: PlayerCombatProficiency;
}

export interface Player {
  uid: string;
  nickname: string;
  level: number;
  exp: number;
  expToNext: number;
  skillPoints: number;
  credits: number;
  /** v2.0 BM — 프리미엄 통화(보석). IAP·교환 연동 전 optional, 미설정 시 0 */
  gems?: number;
  /** 누적 획득 크레딧(무기 가격 progressive·경제 분석) */
  lifetimeCreditsEarned?: number;
  currentSystemId: string;
  currentPlanetId: string | null;
  shipId: string;
  ship: PlayerShip;
  /** 인도받은 전함 목록(조선소 격납고) */
  shipHangar: PlayerHangarShip[];
  skills: string[];
  stats: PlayerStats;
  /** 선택 함장(프로페션) 프로필 — CSV `player_professions` 정본 */
  pilotProfile?: PlayerPilotProfile;
  flags: PlayerFlags;
  /** 거대 팩션·클랜·NPC와의 관계(월드 규칙 기본값) */
  political: PlayerPoliticalProfile;
  /**
   * 클랜전 거점 행성 id — `null`이면 미설정(추후 클랜 가입·거점 선언으로 설정).
   * 서버 동기화 시 동일 필드로 글로벌 클랜전 매칭의 로컬 캐시 키로 사용 가능.
   */
  homePlanetId: string | null;
  /** 은하계 지도 출발 직전 메인 허브 행성 — 비정상 종료·재시작 시 복귀 앵커 */
  lastHubPlanetId?: string | null;
  /**
   * @deprecated — `orbitalMiningDeliveredByPlanet` 사용. 하위 호환용 ore_mineral_1/ore_ferrite 합산.
   */
  orbitalMiningOre1DeliveredByPlanet: Record<string, number>;
  /** 행성 id → 광물 id → 궤도 채굴 무역소 입고 누적 */
  orbitalMiningDeliveredByPlanet?: Record<string, Record<string, number>>;
  /**
   * 개인 인벤토리(100칸). 무역 구매·획득 시 우선 적재, 무역소 판매 탭과 연동.
   * 정본은 `arcfire_player_v1`의 `player` 레코드.
   */
  inventorySlots: (CargoItem | null)[];
  /** 계정 레벨 연동 전투 숙련도 */
  combatProficiency: PlayerCombatProficiency;
  /** 조선소 광물 업그레이드 — statId(mineralUpgradeModel) → 강화 레벨. 계정 귀속 진행 데이터. */
  mineralUpgrades?: Record<string, number>;
  createdAt: number;
}

export interface PlayerStats {
  /** 전함 CSV와 분리 — 사회·협상·운영 스탯 */
  wisdom: number;
  charisma: number;
}

/** 온보딩 캐릭터(함장) 성별 — CSV `player_professions` 정본 */
export type PlayerPilotGender = 'male' | 'female';

export interface PlayerPilotProfile {
  professionId: string;
  gender: PlayerPilotGender;
  /** CSV personalityKo — UI·대화 연출 */
  personalityTag: string;
  /** CSV traitIdsPipe — 성격·수동 특성 태그 */
  traitIds: string[];
  /** UI·대사용 — npc_ai_ships 전투 스탯과 분리(combat 미적용) */
  combatArchetype: CapitalShipArchetype;
}

export interface PlayerFlags {
  tutorialComplete: boolean;
  introSeen: boolean;
  firstMissionStarted: boolean;
  pendingArcadiaDialog01: boolean;
  seenStorySceneIds: string[];
  /** 행성 허브 대화·co-presence·퀘스트 제안 배지 — 확인(대화 종료) 후 키 누적 */
  acknowledgedHubDialogKeys: string[];
}

/**
 * 플레이어 소속 **거대 세력**(연합·제국·동맹 등 상위 팩션).
 * NPC 함장의 `factionId`(군·상회·해적단 등 세부 소속)와 구분되며, 동일한 id 문자열 체계로 매핑할 수 있다.
 */
export type MegaFactionId = string;

/** **클랜**(중소 국가 규모). 행성 소유 등 월드 규칙의 주체가 될 수 있다. 미가입이면 null. */
export type ClanId = string | null;

// ============================================================
// 클랜전(거점 행성 · 전함 배치 · 공방) — 글로벌 동기화 전 로컬 기반 스키마
// ============================================================

/** 클랜 레코드(로컬·추후 서버 동기화 시 동일 id) */
export interface ClanBasicsRecord {
  id: string;
  displayName: string;
  leaderUid: string;
  megaFactionId: MegaFactionId;
  createdAt: number;
  /** JSON 확장 — 연합 표기, 엠블럼 id 등 */
  ext: Record<string, unknown>;
}

/** 행성 점유 — 한 행성에 하나의 점유 클랜(기반 v1) */
export type PlanetHoldKind = 'neutral' | 'clan_hold' | 'player_home';

export interface PlanetClanHold {
  planetId: string;
  systemId: string;
  /** 영토·국경·팩션 금고 — 국가 시드·AI 클랜·중립 */
  occupierClanId: string;
  /**
   * 소유권 증서 보유 클랜.
   * null/미설정 = 영토 국가(occupier) 디폴트 소유 — 플레이어 구매 시 solo/클랜 id.
   */
  deedOwnerClanId?: string | null;
  /** 거점으로 선언한 플레이어 uid(클랜장 또는 본인 거점) */
  homePlayerUid: string | null;
  kind: PlanetHoldKind;
  capturedAt: number;
}

/** 행성 주둔/공격 편대로 배치된 전함(테이블 asset id 또는 추후 플레이어 거대함 id) */
export type ClanCapitalDeploymentRole = 'garrison' | 'reinforcement' | 'siege';

export interface PlanetCapitalDeployment {
  id: string;
  planetId: string;
  clanId: string;
  deployedByUid: string;
  assetId: string;
  role: ClanCapitalDeploymentRole;
  placedAt: number;
}

export type ClanWarOperationPhase = 'staging' | 'siege' | 'defense' | 'resolved';

/** 공격/방어 교전 기록(기반 v1 — 전투 시뮬 연동은 추후) */
export interface ClanWarOperation {
  id: string;
  attackerClanId: string;
  defenderClanId: string | null;
  targetPlanetId: string;
  phase: ClanWarOperationPhase;
  startedAt: number;
  updatedAt: number;
  ext: Record<string, unknown>;
}

/**
 * 플레이어와 NPC 함장(또는 그들이 대표하는 세력) 간 관계.
 * 지정하지 않으면 팩션·월드 규칙으로 계산할 수 있으며, 개별 동맹·경쟁 서사는 여기서 덮어쓴다.
 */
export type DiplomaticStanding =
  | 'hostile'
  | 'rival'
  | 'neutral'
  | 'friendly'
  | 'allied';

/**
 * 플레이어 정치·소속(기본 설계).
 * AI NPC 함장과 **대등한 월드 액터**로 두고, `captainStandings`로 동맹·적대·경쟁을 명시적으로 확장한다.
 */
export interface PlayerPoliticalProfile {
  megaFactionId: MegaFactionId;
  clanId: ClanId;
  /** NPC 함장 `id` → 개별 관계(비어 있으면 시스템 기본 외교에 따름) */
  captainStandings: Partial<Record<string, DiplomaticStanding>>;
}

export interface ShipTemplate {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  maxShield: number;
  armor: number;
  speed: number;
  cargoCapacity: number;
  weaponSlots: number;
  equipSlots: number;
  baseWeapon: WeaponData;
  pixelSprite: number[][];
  /**
   * 조선소 등 실사 이미지용 — `npc_ai_ships.csv` 의 전함 id (해당 행 `portraitImageAssetKey` 사용).
   */
  portraitNpcCapitalShipId?: string;
}

/** 조선소 전함 탭 10슬롯 id (순서·이름 고정) */
export type ShipyardEquipSlotId =
  | 'WEAPON_1'
  | 'WEAPON_2'
  | 'WEAPON_3'
  | 'WEAPON_4'
  | 'ARMOR'
  | 'SYSTEM'
  | 'ENGINE'
  | 'FIGHTER'
  | 'EX_01'
  | 'EX_02'
  | 'EX_03'
  | 'EX_04';

/** 슬롯에 장착된 아이템(인벤·카탈로그 연동 시 itemDefId로 조회) */
export interface ShipEquipSlotAssignment {
  itemDefId: string;
  name: string;
  /** 장착 시 인벤 슬롯 인덱스 — 내구도 셀 추적 */
  sourceInventoryIndex?: number;
}

/** 계정 DB에 저장되는 전함 무기 아이템(테이블 기반 스냅샷) */
export interface ShipWeaponItemAssignment {
  itemId: string;
  weaponId: string;
  name: string;
  type: 'laser' | 'missile' | 'cannon' | 'emp';
}

/** 계정 DB에 저장되는 전함 장비 아이템(테이블 스냅샷) */
export interface ShipEquipmentItemAssignment {
  itemId: string;
  name: string;
  type: string;
}

export interface PlayerShip {
  templateId: string;
  /**
   * 조선소 실사 포트레이트 — 설정 시 `ShipTemplate.portraitNpcCapitalShipId`보다 우선.
   * 무역소에서 인도받은 전함(`capital_ship_*` 구매)으로 갱신된다.
   */
  portraitNpcCapitalShipId?: string;
  name: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  armor: number;
  speed: number;
  /**
   * 장비 장착 허용량(capacity).
   * 선창/화물 기능은 인벤토리 단일 체계로 통합되어, 이 필드는 장착 가능 슬롯 수 제한에 사용한다.
   */
  equipCapacity: number;
  weapons: WeaponData[];
  /** 무기 테이블에서 로드해 계정 DB에 저장되는 장착 후보 아이템 목록 */
  weaponItems?: ShipWeaponItemAssignment[];
  /** 아이템 테이블에서 로드해 계정 DB에 저장되는 장착 후보 장비 목록 */
  equipmentItems?: ShipEquipmentItemAssignment[];
  equipment: EquipmentData[];
  /**
   * 조선소 전함 탭 10슬롯. 없으면 전부 빈 슬롯으로 간주.
   * 저장: `player.uid`와 같은 레코드의 `arcfire_player_v1` JSON 안 `ship`에 포함 · `persist()` 시 계정 프로필 요약 동기.
   */
  equipSlots?: Partial<Record<ShipyardEquipSlotId, ShipEquipSlotAssignment | null>>;
  /** 선체 내구도 0~100. 0%면 출항·전투 불가(조선소 수리). 미설정 시 100% */
  durabilityPct?: number;
}

export interface WeaponData {
  id: string;
  /** `src/items` 카탈로그 무기 체계 id (없으면 레거시 인라인 정의) */
  catalogId?: string;
  name: string;
  damageDice: DiceDef;
  attackBonus: number;
  /** `weapon_list.csv` `사거리px` — px 단위 정본 */
  range: number;
  type: 'laser' | 'missile' | 'cannon' | 'emp';
}

export interface EquipmentData {
  id: string;
  name: string;
  type: 'shield_booster' | 'engine' | 'scanner' | 'cargo_ext';
  effect: Record<string, number>;
}

export interface CargoItem {
  goodId: string;
  quantity: number;
  buyPrice: number;
  /** 무기·장비 셀 내구도 0~100. 미설정 시 100% */
  durabilityPct?: number;
}

export interface DiceDef {
  count: number;
  sides: number;
  bonus: number;
}

export interface D20Roll {
  natural: number;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
  modifier: number;
}

export interface AttackResult {
  roll: D20Roll;
  hit: boolean;
  damage: number;
  isCrit: boolean;
  weaponName: string;
}

export interface CombatState {
  active: boolean;
  turn: 'player' | 'enemy';
  round: number;
  player: Combatant;
  enemy: Combatant;
  log: CombatLogEntry[];
  result: 'ongoing' | 'victory' | 'defeat' | 'fled';
}

export interface Combatant {
  name: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  armor: number;
  attackBonus: number;
  damageDice: DiceDef;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  actor: 'player' | 'enemy' | 'system';
  text: string;
  type: 'attack' | 'miss' | 'crit' | 'skill' | 'system';
}

// ============================================================
// NPC 전함·함장 DB (기함급 / AI 운용 기반)
// ============================================================

/** 전투·패트롤 시 AI가 참고하는 성향 */
export type NpcAiAggression =
  | 'passive'
  | 'cautious'
  | 'standard'
  | 'aggressive'
  | 'berserk';

/** 함장 역할 — 스폰·미션·교전 스크립트에서 분기용 */
export type NpcAiRole =
  | 'patrol'
  | 'garrison'
  | 'fleet_leader'
  | 'hunter'
  | 'escort'
  | 'merchant_guard';

/** 함장 현재 운용 상태(월드 배치/전투 진입 판단 기준) */
export type NpcCaptainOperationalState = 'combat' | 'general' | 'neutral' | 'hostile';
/** 전투 진입 시 함장 소속 팀 (`orange` = 자유교전/FFA) */
export type NpcCaptainCombatTeam = 'red' | 'blue' | 'orange' | 'none';

/** AI 클랜 레지스트리 (`tables/content/ai_clan_registry.csv`) */
export interface AiClanRegistryRow {
  id: string;
  displayNameKo: string;
  displayNameEn: string;
  zoneAffinity: 'safe' | 'neutral' | 'pvp' | null;
  megaFactionId: string;
  leaderCaptainId: string;
  /** territory hub가 있는 구역 클랜만 safe/neutral/pvp */
  territoryHubZone: 'safe' | 'neutral' | 'pvp' | null;
  notesKo: string;
}

/** NPC 함장 DB 레코드 (탑승·임관은 전함 레코드의 captainId로 연결) */
export interface NpcCaptain {
  id: string;
  displayName: string;
  rank: string;
  /** 세부 세력 키(군·길드 등). 플레이어의 `political.megaFactionId`(연합·제국·동맹급) 아래 층에 해당할 수 있음 */
  factionId: string | null;
  aiAggression: NpcAiAggression;
  aiRole: NpcAiRole;
  /** 한 줄 소개 (로그/UI) */
  bioShort: string;
  /** 월드 운용 상태 */
  operationalState: NpcCaptainOperationalState;
  /** 전투 상태일 때 팀 소속 */
  combatTeam: NpcCaptainCombatTeam;
  /** 주게임시스템 팩션 관계(함장 기준) - 우호 팩션 목록 */
  friendlyFactionIds: readonly string[];
  /** 주게임시스템 팩션 관계(함장 기준) - 적대 팩션 목록 */
  hostileFactionIds: readonly string[];
  /** 함장 기준 거점 행성(planet id). 있으면 월드 궤도 배치에서 최우선 */
  basePlanetId: string | null;
  /** 함장 활동 행성 목록(planet id). 거점 외 활동 범위 */
  activityPlanetIds: readonly string[];
  /** 함장 기준 거점 성계(system id). 우선 배치 기준 */
  baseSystemId: string | null;
  /** 함장 활동 성계 목록(순찰/출몰 권역). 비어 있으면 거점만 활동 */
  activitySystemIds: readonly string[];
  /** 행성/월드 배치에서 사용할 전함 id (전함 테이블 id 참조, 중복 참조 허용) */
  assignedShipId?: string;
  /** 실유저 클랜 연동 전: AI 클랜장 여부(구역 거점 클랜) */
  isAiClanLeader: boolean;
  /** 클랜 표시명 — 비리더는 빈 문자열 */
  aiClanName: string;
  /** 거점을 둘 구역(safe/neutral/pvp). 비리더는 null */
  aiClanZone: 'safe' | 'neutral' | 'pvp' | null;
  /** AI 클랜 레지스트리 id (`ai_clan_registry.csv`). 비소속은 빈 문자열 */
  aiClanId: string;
  /** none | leader | member | officer */
  aiClanRole: 'none' | 'leader' | 'member' | 'officer';
  /**
   * 아크 궤도 **수송선** 풀(등록 전함·함장) — `npc_arc_presence_ship_*` 등.
   * `listArcNpcTrafficRowsFromTables`·`nearbyOrbitPresenceSystem` 보충 슬롯이 동일 CSV 행을 참조한다.
   */
  arcOrbitPresenceFill: boolean;
  /** 메인스테이지에서 해당 함장과 만났을 때 대화 버튼/인터랙션 UI 활성화 여부 */
  mainStageTalkEnabled: boolean;
  /** 대화 버튼 우선순위(숫자 낮을수록 우선). CSV `mainStageTalkPriority` */
  mainStageTalkPriority: number;
  /** 인게임 대화 씬 id(`story_scenes.csv`). 비어 있으면 `npc_dialog_{id}` 규칙 폴백 */
  mainStageTalkSceneId: string | null;
  /** 대화 진입 시 함께 발동할 미션 트리거 id(없으면 null) */
  mainStageMissionTriggerId: string | null;
  /** 대화 진입 시 함께 발동할 이벤트 트리거 id(없으면 null) */
  mainStageEventTriggerId: string | null;
  /** 선술집 운영(퇴역 함장) 담당 행성 목록. 비어 있으면 선술집 운영자 아님 */
  tavernPlanetIds: readonly string[];
  /** 인게임 대화창에 사용할 NPC 초상화 이미지 키(`assets/images/npc/*.png`) */
  portraitImageAssetKey: string | null;
  /** 초기 성장값(고정 테이블 값) */
  progression: {
    initialLevel: number;
    initialExp: number;
    expCurveBase: number;
    expCurveLinear: number;
    expCurveQuadratic: number;
  };
}

/** 함장 런타임 성장 상태(원본 CSV와 분리 저장) */
export interface NpcCaptainProgress {
  captainId: string;
  level: number;
  exp: number;
  expToNext: number;
  totalExp: number;
  battleCount: number;
  winCount: number;
  killCount: number;
  updatedAt: number;
}

/** 전함 전투 스냅샷 — 추후 ShipTemplate/전용 템플릿으로 이관 가능 */
export interface NpcCapitalCombatStats {
  maxHp: number;
  maxShield: number;
  armor: number;
  attackBonus: number;
  damageDice: DiceDef;
  /** 격파 보상 경험치 */
  expReward: number;
  /** STR 대용 전투 스탯(미기입 시 CSV 빌드 폴백 계산) */
  strStat: number;
  /** DEX 대용 전투 스탯(미기입 시 CSV 빌드 폴백 계산) */
  dexStat: number;
  /** D&D size 보정치(-2..+2 권장, 미기입 시 0) */
  sizeClass: number;
  /**
   * 전함 구분 스탯 축 — 파이터(STR·중장갑·강타) vs 레인저(DEX·경장갑·연사·탐지).
   * `ShipPerformanceCalculator` 숙련도 편향 입력.
   */
  capitalShipArchetype?: CapitalShipArchetype;
}

/** D&D3 스타일 전함 클래스 구분 — npc_ai_ships.csv `capitalShipArchetype` */
export type CapitalShipArchetype = 'fighter' | 'ranger' | 'survival' | 'special' | 'neutral';

/** NPC AI 전함(기함급) DB 레코드 */
export interface NpcCapitalShip {
  id: string;
  name: string;
  nameEn?: string;
  /** 함체/밸런스 타입 키 (예: hull_cap_siege_01) */
  hullTypeId: string;
  captainId: string;
  /** 주둔 성계; null이면 순찰·이벤트 전용 등 */
  homeSystemId: string | null;
  combat: NpcCapitalCombatStats;
  /**
   * 궤도 INFO 우측(구분선 뒤) 한 덩어리 — CSV `infoLineSuffix`(예: MK.I).
   * 비어 있으면 엔진이 결정론 MK 마크를 쓴다. 향후 다른 요약 문자열로 교체 가능.
   */
  infoLineSuffix?: string;
  /** 아크코어 행성 궤도 수송선 — 체류 단계 각속도(rad/s). `npc_ai_ships.csv` */
  arcTrafficDwellRadPerSec: number;
  /** 접근·체류·이탈 위상 지속시간 랜덤에 곱함(>1이면 느림). 같은 CSV */
  arcTrafficPhaseDurationMul: number;
  /** 아크코어 수송선 — 행성 체류(dwell) 최소 초(테이블) */
  arcTrafficPlanetDwellSecMin: number;
  /** 아크코어 수송선 — 행성 체류(dwell) 최대 초(테이블, 엔진 상한 600) */
  arcTrafficPlanetDwellSecMax: number;
  /**
   * 무역소 아이템(`item_defs` 병합)으로 진열할지 — `false`이면 무역 목록·인도 상품에서 제외.
   */
  tradePortListed: boolean;
  /**
   * 전함 실사 포트레이트 — `assets/images/...` 경로 문자열.
   * Metro 번들은 `resolveNpcCapitalShipPortraitSource` 정적 맵에 키를 등록해야 한다.
   */
  portraitImageAssetKey?: string;
}

// ── NPC 기함 함급(hull class) — 마스터 정의·스테이지·AI·전투 공통 ─────────

/** 궤도 HUD / 연출용 순간 운동 상태 (Reanimated transform과 동일 필드) */
export interface NpcCapitalOrbitKinematic {
  phase: number;
  speed: number;
  radius: number;
  moving: boolean;
  /** 함선별 수직 타원 비율 (행성 주변 고유 동선) */
  ellipseY: number;
  /** 궤도 평면 기울기(rad) */
  pathTilt: number;
  /** 표준 궤도 주기 대비 각속도 배율 */
  periodScale: number;
}

/**
 * 함급별 궤도 “템플릿” — planet+system+slot 해시로 NpcCapitalOrbitKinematic 인스턴스 생성
 * (숫자만 바꿔도 스테이지·전투가 동일 규칙을 공유)
 */
export interface NpcCapitalOrbitMotionParams {
  radiusBase: number;
  /** 0..radiusSpread (포함) 가산 */
  radiusSpread: number;
  speedMin: number;
  speedMax: number;
  /** 0~1, 이보다 작으면 정지 궤도 */
  stillProbability: number;
}

/** DB 없이도 쓰이는 주민 함선 연출용 기본 함급 id */
export const NPC_CAPITAL_HULL_FALLBACK_ID = 'hull_ambient_generic';

/**
 * NPC 기함 함체 클래스 — 움직임·표시·향후 전투/월드 AI 확장의 단일 기준
 * 개별 인스턴스(DB 함선)는 hullTypeId 로 여기를 참조한다.
 */
export interface NpcCapitalHullClassDef {
  id: string;
  /** info/로그용 짧은 등급 라벨 */
  tierLabel: string;
  orbit: NpcCapitalOrbitMotionParams;
  /** ambient 함명 풀 인덱스 혼합 (함급마다 다른 패턴) */
  nameSalt: number;
  /** 향후 월드전투·스폰 필터 (문자열 태그) */
  combatTags: readonly string[];
  /** 월드 AI 위협·우선순위 스텁 (큰 값이 중요 목표에 가깝게) */
  threatTier: number;
}

/** 레지스트리 조회 시 함장·함급까지 풀어 쓰기 위한 뷰 */
export interface NpcCapitalShipResolved extends NpcCapitalShip {
  captain: NpcCaptain;
  hullClass: NpcCapitalHullClassDef;
}

/** 월드·전투 AI가 한 번에 받는 스냅샷 */
export interface NpcCapitalAiContext {
  ship: NpcCapitalShip;
  captain: NpcCaptain;
  /** 함체 클래스(궤도·태그·향후 전투 보정) — DB hullTypeId 로 조회 */
  hullClass: NpcCapitalHullClassDef;
}

/** 행성 주변 기함 주둔 슬롯 수(임시 상한) — `resolvePlanetNpcCapitalSlotCount`와 동기 */
export const NPC_PLANET_CAPITAL_SLOT_MIN = 1;
export const NPC_PLANET_CAPITAL_SLOT_MAX = 4;

/**
 * NPC AI [운용설계] — 행성별 이동·목적·임무 배정 (현재는 결정론 스텁, 추후 AI가 갱신)
 * 스테이지·월드 루프가 동일 타입을 읽도록 고정해 둔다.
 */
export type NpcCapitalPlanetObjectiveTag =
  | 'patrol'
  | 'garrison'
  | 'transit'
  | 'training'
  | 'unknown';

export type NpcCapitalPlanetMovementIntent =
  | 'hold_orbit'
  | 'patrol_near_planet'
  | 'await_orders';

export interface NpcCapitalPlanetOperationPlan {
  planetId: string;
  systemId: string;
  /** `resolvePlanetNearbyPresence` 행 수와 일치해야 함 (1..NPC_PLANET_CAPITAL_SLOT_MAX) */
  stationedCapitalCount: number;
  objectiveTag: NpcCapitalPlanetObjectiveTag;
  movementIntent: NpcCapitalPlanetMovementIntent;
  /** 향후 임무 템플릿·스크립트 키 (미배정 시 null) */
  missionTemplateId: string | null;
  /** 향후 항로·ETA·제약 — AI 운용기가 문자열/구조화 로그로 채움 */
  routingNotes: string;
}

export type ZoneType = 'safe' | 'neutral' | 'pvp' | 'endgame';

export interface StarSystem {
  id: string;
  name: string;
  /** CSV `systemNameEn` — locale en 표시용 */
  nameEn?: string;
  position: Vec2;
  zone: ZoneType;
  planets: Planet[];
  connections: string[];
  enemyLevel: number;
  description: string;
  /** CSV `systemDescriptionEn` — locale en 표시용 */
  descriptionEn?: string;
}

export interface Planet {
  id: string;
  systemId: string;
  name: string;
  /** CSV `nameEn` — locale en 표시용 */
  nameEn?: string;
  description: string;
  /** CSV `descriptionEn` — locale en 표시용 */
  descriptionEn?: string;
  /** 행성 배경 이미지 에셋 키(미할당 시 null — `planetBackdropAssets`에 매핑 필요) */
  backdropImageAssetKey?: string | null;
  /** 행성 정보창 상단 포트rait — `planetInfoPortraitAssets`에 매핑 필요 */
  infoPanelPortraitAssetKey?: string | null;
  /** 메인 스테이지 Skia 성운 셰이더 레이어 (CSV `mainStageSkiaNebulaLayer`, 기본 true) */
  mainStageSkiaNebulaEnabled?: boolean;
  /** 메인 스테이지 배경 이미지 레이어 (CSV `mainStageBackdropImageLayer`; 에셋 키가 있을 때 기본 true) */
  mainStageBackdropImageEnabled?: boolean;
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasTavern: boolean;
  tradeGoods: string[];
  factionId: string;
  /** 핵심 대표 지표(0..100) — Resource */
  coreResource: number;
  /** 핵심 대표 지표(0..100) — Population */
  corePopulation: number;
  /** 핵심 대표 지표(0..100) — Defense */
  coreDefense: number;
  /** 핵심 대표 지표(0..100) — Technology(Research) */
  coreTechnology: number;
  /** 핵심 대표 지표(0..100) — Environment */
  coreEnvironment: number;
}

// ============================================================
// 광물·채광 경제 (기반 설계)
// — 메인 스테이지 궤도 채광 → 기본 자원 → 제작·거래의 근간
// — 행성 100+ 수작업 방지: 지역(행성 군집) 단위 비율을 테이블로 두고 행성별 분배는 코드가 수행
// ============================================================

/** 은하 전체 광물 혼합(상대 가중). 정규화 후 지역·행성에 곱해 쓴다. */
export interface GalacticMineralPoolEntry {
  mineralId: string;
  displayName: string;
  poolWeight: number;
}

/**
 * 채광 지역 — 단일 행성보다 큰 묶음.
 * `clusterShareOfGalaxy`: 은하 전체 매장(개념적 풀) 중 이 지역에 할당되는 비율 0~1.
 */
export interface MineralRegionDef {
  id: string;
  displayName: string;
  clusterShareOfGalaxy: number;
}

/** 행성이 속한 광물 지역(한 행성은 한 지역만 — 추후 다중 소속이면 스키마 확장) */
export interface MineralRegionMember {
  regionId: string;
  planetId: string;
}

/**
 * 행성별 매장 비율(은하 기준).
 * 메인 스테이지 궤도 광물 스폰·거래 기준가 가중 등에 사용; 행성 타입 가중은 `mineralDepositModel`에서 후속.
 */
export interface PlanetMineralDepositProfile {
  planetId: string;
  regionId: string;
  /** 광물 id → 은하 전체 해당 광물 매장 개념량 대비 이 행성 점유율 */
  shareOfGalaxyByMineral: Record<string, number>;
}

export type MissionStatus = 'locked' | 'available' | 'active' | 'complete' | 'failed';
export type MissionType = 'travel' | 'combat' | 'trade' | 'delivery' | 'explore';

export interface Mission {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  type: MissionType;
  objectives: MissionObjective[];
  rewards: MissionReward;
  prerequisiteIds: string[];
  nextMissionId: string | null;
  dc: number;
  /** 선술집 인스턴스 미션 의뢰 함장 (sandbox_*). */
  offerCaptainId?: string;
  /** 선술집 게시 행성 id (sandbox_*). */
  offerPlanetId?: string;
  /** 수락 가능 최소 플레이어 레벨 (sandbox_*). */
  levelRequired?: number;
  /** 미션 클리어 인게임 대화 scene id. */
  clearDialogSceneId?: string;
}

/**
 * 단일 미션 목표. 런타임 진행은 `MissionProgress.objectives[objective.id]`(boolean)가 근거.
 * 타입별 완료 조건·UI·저장 규약: `src/missions/missionObjectiveDsl.ts` (v1 동결 후 신규 타입은 DSL 개정과 동시에 추가).
 */
export interface MissionObjective {
  id: string;
  description: string;
  descriptionEn?: string;
  type: 'reach_system' | 'reach_planet' | 'defeat_enemy' | 'deliver_cargo' | 'buy_goods';
  targetId: string;
  quantity?: number;
  complete: boolean;
}

export interface MissionReward {
  credits: number;
  exp: number;
  items?: string[];
  skillPointBonus?: number;
}

export interface MissionProgress {
  missionId: string;
  status: MissionStatus;
  objectives: Record<string, boolean>;
  startedAt?: number;
  completedAt?: number;
}

export type SkillCategory = 'combat' | 'navigation' | 'trade' | 'fleet';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  tier: number;
  prerequisiteIds: string[];
  levelRequired: number;
  effect: SkillEffect;
  icon: string;
}

export interface SkillEffect {
  type: 'passive' | 'active';
  stat?: string;
  value?: number;
  damageDice?: DiceDef;
  description: string;
}

/** 무역 UI·시장·화물 아이콘 분류 */
export type TradeGoodCategory =
  | 'food'
  | 'mineral'
  | 'tech'
  | 'weapon'
  | 'luxury'
  | 'contraband';

export interface TradeGood {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceVariance: number;
  volume: number;
  category: TradeGoodCategory;
}

/**
 * 아이템 마스터(단일 소스: `tables/content/item_defs.csv` → `csvItemDefs.ts`).
 * 무역 외 장비·소재·전함 장착 등은 `kind` / `type` / 플래그 / `attrs`로 확장.
 */
export type ItemMasterKind =
  | 'trade_good'
  | 'raw_material'
  | 'equipment'
  | 'consumable'
  | 'misc';

export interface ItemDef {
  id: string;
  name: string;
  /** locale !== ko 시 표시 — tables/content `name_en` */
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  /** 무역소 구매 팝업 — tables/content `특징설명` */
  featureDescription: string;
  featureDescriptionEn?: string;
  basePrice: number;
  priceVariance: number;
  volume: number;
  category: TradeGoodCategory;
  kind: ItemMasterKind;
  /** 세부 분류(디자이너 자유 문자열, 예: orbital_mining, galactic_pool) */
  type: string;
  /** 무역소 시장 구매·판매 후보 */
  tradeable: boolean;
  /** 무역소 판매 가능 여부(보이되 판매만 막고 싶을 때 false) */
  sellable: boolean;
  /** 플레이어 인벤토리 적재 가능 */
  cargoHoldable: boolean;
  /** 거대 함선(캐피탈) 하드포인트·내부 슬롯 장착 가능 — 추후 전함 인벤 연동 */
  capitalShipMountable: boolean;
  /** true면 계정당 1회만 구매 가능(재구매 불가) */
  nonRepurchase: boolean;
  tags: readonly string[];
  /** JSON 확장 필드 — 수백 개 아이템 시 스키마 없이 속성 추가 */
  attrs: Readonly<Record<string, unknown>>;
}

export interface MarketListing {
  goodId: string;
  price: number;
  stock: number;
  demand: 'low' | 'normal' | 'high';
}

// ============================================================
// 스토리 연출(컷신) — 테이블 기반
// ============================================================

export type StorySceneTriggerKey =
  | 'nickname_created'
  | 'planet_landed'
  | 'system_arrived'
  | 'manual';

export type StorySceneCompletionPolicy =
  | 'none'
  | 'mark_intro_seen_and_start_first_mission';
export type StorySceneTriggerRepeatPolicy = 'once' | 'repeat';

export interface StoryScenePageDef {
  sceneId: string;
  pageIndex: number;
  label: string;
  text: string;
  /** 영어 번역(없으면 한국어 label 폴백) */
  labelEn?: string | null;
  /** 영어 번역(없으면 한국어 text 폴백) */
  textEn?: string | null;
  imageAssetKey: string | null;
  speakerNpcCaptainId: string | null;
  viewMode: 'cinematic' | 'popup_overlay' | 'ingame_dialog';
  textBoxPreset: 'default' | 'compact';
  imageScalePct: number;
}

export interface StorySceneDef {
  id: string;
  displayName: string;
  triggerKey: StorySceneTriggerKey;
  triggerTargetId: string | null;
  triggerRepeat: StorySceneTriggerRepeatPolicy;
  maxLinesPerPage: number;
  completionPolicy: StorySceneCompletionPolicy;
  nextRoute: string | null;
  skippable: boolean;
  typewriterSpeedMs: number;
  fadeInEnabled: boolean;
  fadeInDurationMs: number;
  fadeOutEnabled: boolean;
  fadeOutDurationMs: number;
  pages: StoryScenePageDef[];
}

export type GameScreen =
  | 'title'
  | 'nickname'
  | 'intro'
  | 'planet'
  | 'worldmap'
  | 'flight'
  | 'combat'
  | 'mission_complete'
  | 'skilltree'
  | 'trade'
  | 'shipyard';

export interface GameState {
  screen: GameScreen;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}
