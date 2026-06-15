import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  Player,
  PlayerHangarShip,
  PlayerPoliticalProfile,
  ShipEquipmentItemAssignment,
  PlayerShip,
  ShipyardEquipSlotId,
  ShipWeaponItemAssignment,
  LevelUpSummary,
} from '../types';
import { SHIP_TEMPLATES } from '../data/ships';
import { EXP_TABLE } from '../data/d20tables';
import {
  createPlayerCombatProficiency,
  normalizePlayerCombatProficiency,
} from '../combat/playerCombatProficiency';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated';
import { resolvePlayerDefaultNpcCapitalShipId } from '../arcCore/balance/capitalHullPurchaseFromBalance';
import {
  grantNpcCapitalShipBundleToInventory,
  reconcileEquippedWeaponsInInventory,
} from '../game/grantNpcCapitalShipBundle';
import {
  applyDefaultCombatLoadout,
  seedCombatEquipSlotsFromNpcDefaults,
} from '../game/seedShipCombatEquipSlots';
import {
  applyCapitalShipDestructionToPlayer,
  ensureStarterCapitalShipInHangar,
  ensureSurvivalPodInHangar,
  grantSurvivalPodShipToInventory,
  isSurvivalPodNpcShipId,
  resolveStarterNpcCapitalShipId,
  SURVIVAL_POD_NPC_SHIP_ID,
} from '../game/playerSurvivalPod';
import { gainExp, processLevelUp, learnSkill as engineLearnSkill } from '../engine/SkillEngine';
import { applyAabsCreditMultiplier, applyAabsExpMultiplier } from '../arcCore/aabs/aabsPolicyStore';
import { SKILLS } from '../data/skills';
import { Skill } from '../types';
import {
  addToInventorySlotsMax,
  countGoodInInventory,
  createEmptyInventorySlots,
  normalizeInventorySlots,
  removeGoodFromInventorySlots,
} from '../game/playerInventory';
import { SHIPYARD_EQUIP_SLOT_DEFS } from '../game/shipyardEquipSlots';
import { useAccountProfileStore } from './accountProfileStore';
import { useUserSessionStore } from './userSessionStore';
import { useSkillDbStore } from './skillDbStore';
import { getItemDef } from '../data/itemRegistry';
import { ITEM_DEFS_FROM_CSV } from '../data/generated/csvItemDefs';

const STORAGE_KEY = 'arcfire_player_v1';
const DEFAULT_GRANTED_SKILL_IDS = ['double_shot'] as const;
const TEMP_MAX_HANGAR_SHIPS = 30;
/** 신규·구세이브 보정용. `mega_*` id는 추후 거대 세력 콘텐츠 테이블과 맞출 것 */
const DEFAULT_PLAYER_POLITICAL: PlayerPoliticalProfile = {
  megaFactionId: 'mega_stellium_alliance',
  clanId: null,
  captainStandings: {},
};

/** 로컬 저장 v1: 과거 데이터에 `political` / `homePlanetId` / `shipHangar` 없을 수 있음 */
type PlayerPersistenceShape = Omit<Player, 'political' | 'homePlanetId' | 'orbitalMiningOre1DeliveredByPlanet' | 'orbitalMiningDeliveredByPlanet' | 'shipHangar'> & {
  political?: PlayerPoliticalProfile;
  homePlanetId?: string | null;
  orbitalMiningOre1DeliveredByPlanet?: Record<string, number>;
  orbitalMiningDeliveredByPlanet?: Record<string, Record<string, number>>;
  shipHangar?: PlayerHangarShip[];
};

const VALID_SHIPYARD_EQUIP_SLOT_IDS = new Set<ShipyardEquipSlotId>(
  SHIPYARD_EQUIP_SLOT_DEFS.map((d) => d.id),
);

/** 디스크/동기화된 `equipSlots` — 계정 단위 정본은 `player` JSON 안의 함선 필드. */
function sanitizeShipEquipSlots(raw: PlayerShip['equipSlots'] | unknown): PlayerShip['equipSlots'] {
  if (!raw || typeof raw !== 'object') return {};
  const out: NonNullable<PlayerShip['equipSlots']> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_SHIPYARD_EQUIP_SLOT_IDS.has(k as ShipyardEquipSlotId)) continue;
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    if (typeof o.itemDefId !== 'string' || typeof o.name !== 'string') continue;
    const itemDefId = o.itemDefId.trim();
    const name = o.name.trim();
    if (!itemDefId || !name) continue;
    out[k as ShipyardEquipSlotId] = { itemDefId, name };
  }
  return out;
}

function sanitizeShipWeaponItems(raw: PlayerShip['weaponItems'] | unknown): ShipWeaponItemAssignment[] {
  if (!Array.isArray(raw)) return [];
  const out: ShipWeaponItemAssignment[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    const type = o.type;
    if (
      typeof o.itemId !== 'string'
      || typeof o.weaponId !== 'string'
      || typeof o.name !== 'string'
      || (type !== 'laser' && type !== 'missile' && type !== 'cannon' && type !== 'emp')
    ) {
      continue;
    }
    const itemId = o.itemId.trim();
    const weaponId = o.weaponId.trim();
    const name = o.name.trim();
    if (!itemId || !weaponId || !name) continue;
    out.push({
      itemId,
      weaponId,
      name,
      type,
    });
  }
  return out;
}

function sanitizeShipEquipmentItems(raw: PlayerShip['equipmentItems'] | unknown): ShipEquipmentItemAssignment[] {
  if (!Array.isArray(raw)) return [];
  const out: ShipEquipmentItemAssignment[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    if (
      typeof o.itemId !== 'string'
      || typeof o.name !== 'string'
      || typeof o.type !== 'string'
    ) {
      continue;
    }
    const itemId = o.itemId.trim();
    const name = o.name.trim();
    const type = o.type.trim();
    if (!itemId || !name || !type) continue;
    out.push({ itemId, name, type });
  }
  return out;
}

function buildShipWeaponItems(ship: PlayerShip): ShipWeaponItemAssignment[] {
  const preserved = sanitizeShipWeaponItems(ship.weaponItems);
  const byItemId = new Map<string, ShipWeaponItemAssignment>();
  preserved.forEach((item) => {
    byItemId.set(item.itemId, item);
  });
  ship.weapons.forEach((weapon) => {
    const itemId = `weapon_item_${weapon.id}`;
    if (byItemId.has(itemId)) return;
    byItemId.set(itemId, {
      itemId,
      weaponId: weapon.id,
      name: weapon.name,
      type: weapon.type,
    });
  });
  return Array.from(byItemId.values());
}

function buildShipEquipmentItems(ship: PlayerShip): ShipEquipmentItemAssignment[] {
  const preserved = sanitizeShipEquipmentItems(ship.equipmentItems);
  const byItemId = new Map<string, ShipEquipmentItemAssignment>();
  preserved.forEach((item) => {
    byItemId.set(item.itemId, item);
  });
  Object.values(ITEM_DEFS_FROM_CSV).forEach((def) => {
    if (def.kind !== 'equipment') return;
    if (def.type === 'weapon_module') return;
    if (byItemId.has(def.id)) return;
    byItemId.set(def.id, {
      itemId: def.id,
      name: def.name,
      type: def.type,
    });
  });
  return Array.from(byItemId.values());
}

function normalizeLoadedPlayerShip(ship: PlayerShip | undefined, templateIdFallback: string): PlayerShip {
  const template = SHIP_TEMPLATES[templateIdFallback];
  const fallbackEquipCapacity = Math.max(0, Math.floor(template?.equipSlots ?? 0));
  if (!ship || typeof ship !== 'object') {
    const created = shipFromTemplate(templateIdFallback);
    return {
      ...created,
      equipCapacity: fallbackEquipCapacity,
    };
  }
  const legacyCargoCapacity = (ship as PlayerShip & { cargoCapacity?: unknown }).cargoCapacity;
  const normalized: PlayerShip = {
    ...ship,
    equipCapacity:
      typeof ship.equipCapacity === 'number' && Number.isFinite(ship.equipCapacity)
        ? Math.max(0, Math.floor(ship.equipCapacity))
        : typeof legacyCargoCapacity === 'number' && Number.isFinite(legacyCargoCapacity)
        ? Math.max(0, Math.floor(legacyCargoCapacity))
        : fallbackEquipCapacity,
    equipSlots: seedCombatEquipSlotsFromNpcDefaults({
      ...ship,
      equipSlots: sanitizeShipEquipSlots(ship.equipSlots),
    }),
    weaponItems: buildShipWeaponItems(ship),
    equipmentItems: buildShipEquipmentItems(ship),
  };
  return applyDefaultCombatLoadout(normalized);
}

function normalizeShipHangar(raw: unknown): PlayerHangarShip[] {
  if (!Array.isArray(raw)) return [];
  const out: PlayerHangarShip[] = [];
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue;
    const o = e as Record<string, unknown>;
    if (
      typeof o.id === 'string'
      && typeof o.npcCapitalShipId === 'string'
      && typeof o.acquiredAt === 'number'
    ) {
      out.push({
        id: o.id,
        npcCapitalShipId: o.npcCapitalShipId,
        acquiredAt: o.acquiredAt,
      });
    }
  }
  return out;
}

function normalizePlayerPolitical(raw: PlayerPersistenceShape): Player {
  const p = raw.political;
  const mergedSkills = Array.from(new Set([...(raw.skills ?? []), ...DEFAULT_GRANTED_SKILL_IDS]));
  const political: PlayerPoliticalProfile = {
    megaFactionId: p?.megaFactionId ?? DEFAULT_PLAYER_POLITICAL.megaFactionId,
    clanId: p?.clanId !== undefined ? p.clanId : DEFAULT_PLAYER_POLITICAL.clanId,
    captainStandings: p?.captainStandings ?? {},
  };
  const f = raw.flags ?? {
    tutorialComplete: false,
    introSeen: false,
    firstMissionStarted: false,
  };
  const flags = {
    tutorialComplete: Boolean(f.tutorialComplete),
    introSeen: Boolean(f.introSeen),
    firstMissionStarted: Boolean(f.firstMissionStarted),
    ingameDialog01Seen: Boolean((f as { ingameDialog01Seen?: boolean }).ingameDialog01Seen),
    pendingArcadiaDialog01: Boolean((f as { pendingArcadiaDialog01?: boolean }).pendingArcadiaDialog01),
    seenStorySceneIds: Array.isArray((f as { seenStorySceneIds?: string[] }).seenStorySceneIds)
      ? (f as { seenStorySceneIds?: string[] }).seenStorySceneIds!.filter((v) => typeof v === 'string')
      : [],
  };
  const tid = typeof raw.shipId === 'string' && raw.shipId ? raw.shipId : 'starter_fighter';
  const base: Player = {
    ...raw,
    skills: mergedSkills,
    flags,
    political,
    homePlanetId: raw.homePlanetId !== undefined ? raw.homePlanetId : null,
    orbitalMiningOre1DeliveredByPlanet: raw.orbitalMiningOre1DeliveredByPlanet ?? {},
    orbitalMiningDeliveredByPlanet: raw.orbitalMiningDeliveredByPlanet ?? {},
    shipHangar: normalizeShipHangar(raw.shipHangar),
    inventorySlots: normalizeInventorySlots((raw as { inventorySlots?: unknown }).inventorySlots),
    ship: raw.ship as PlayerShip,
  };
  const normalizedHangar = normalizeShipHangar(base.shipHangar);
  const normalizedShip = normalizeLoadedPlayerShip(base.ship, tid);
  return {
    ...base,
    shipHangar: normalizedHangar,
    ship: normalizedShip,
    inventorySlots: reconcileEquippedWeaponsInInventory(
      reconcileCapitalShipInventoryFromHangar(
        normalizeInventorySlots(base.inventorySlots),
        normalizedHangar,
      ),
      normalizedShip,
    ),
  };
}

function reconcileCapitalShipInventoryFromHangar(
  slots: ReturnType<typeof normalizeInventorySlots>,
  hangar: PlayerHangarShip[],
) {
  let next = slots;
  const hangarCountByNpcId = new Map<string, number>();
  hangar.forEach((h) => {
    hangarCountByNpcId.set(h.npcCapitalShipId, (hangarCountByNpcId.get(h.npcCapitalShipId) ?? 0) + 1);
  });
  hangarCountByNpcId.forEach((hangarCount, npcCapitalShipId) => {
    const itemId = `capital_ship_${npcCapitalShipId}`;
    const def = getItemDef(itemId);
    if (!def || def.type !== 'capital_ship') return;
    const invCount = countGoodInInventory(next, itemId);
    const delta = hangarCount - invCount;
    if (delta > 0) {
      next = addToInventorySlotsMax(next, itemId, delta, 0).slots;
      return;
    }
    if (delta < 0) {
      const trimmed = removeGoodFromInventorySlots(next, itemId, Math.abs(delta));
      if (trimmed) next = trimmed;
    }
  });
  // 격납고에 없는 전함 아이템은 인벤에서 완전히 제거한다(유령 수량 재동기화 방지).
  const allowedCapitalItemIds = new Set(
    Array.from(hangarCountByNpcId.keys()).map((npcId) => `capital_ship_${npcId}`),
  );
  const capitalItemIdsInInventory = new Set<string>();
  next.forEach((cell) => {
    if (!cell?.goodId?.startsWith('capital_ship_')) return;
    capitalItemIdsInInventory.add(cell.goodId);
  });
  capitalItemIdsInInventory.forEach((itemId) => {
    if (allowedCapitalItemIds.has(itemId)) return;
    const qty = countGoodInInventory(next, itemId);
    if (qty <= 0) return;
    const trimmed = removeGoodFromInventorySlots(next, itemId, qty);
    if (trimmed) next = trimmed;
  });
  return next;
}

function shipFromTemplate(templateId: string): PlayerShip {
  const t = SHIP_TEMPLATES[templateId];
  const seed: PlayerShip = {
    templateId,
    portraitNpcCapitalShipId: t.portraitNpcCapitalShipId,
    name: t.name,
    hp: t.maxHp,
    maxHp: t.maxHp,
    shield: t.maxShield,
    maxShield: t.maxShield,
    armor: t.armor,
    speed: t.speed,
    // 선창 용량이 아니라 장착 허용량(capacity)으로 사용한다.
    equipCapacity: Math.max(0, Math.floor(t.equipSlots ?? 0)),
    weapons: [],
    weaponItems: [],
    equipmentItems: [],
    equipment: [],
    equipSlots: {},
  };
  return applyDefaultCombatLoadout({
    ...seed,
    equipmentItems: buildShipEquipmentItems(seed),
  });
}

function buildInitialInventoryWithDefaultCapitalShip() {
  const npcCapitalShipId = resolvePlayerDefaultNpcCapitalShipId();
  let slots = grantNpcCapitalShipBundleToInventory(createEmptyInventorySlots(), npcCapitalShipId, {
    shipBuyPrice: 1,
  });
  slots = grantSurvivalPodShipToInventory(slots);
  return slots;
}

function ensurePlayerHasDefaultShip(player: Player): Player {
  const starterTemplateId = 'starter_fighter';
  const safeShipId =
    typeof player.shipId === 'string' && player.shipId.trim().length > 0
      ? player.shipId
      : starterTemplateId;
  const normalizedShip = normalizeLoadedPlayerShip(player.ship, safeShipId);
  const starterHangar = ensureStarterCapitalShipInHangar(normalizeShipHangar(player.shipHangar));
  const normalizedHangar = ensureSurvivalPodInHangar(starterHangar.hangar);
  let normalizedInventory = reconcileCapitalShipInventoryFromHangar(
    normalizeInventorySlots(player.inventorySlots),
    normalizedHangar,
  );
  if (starterHangar.addedStarter) {
    normalizedInventory = grantNpcCapitalShipBundleToInventory(
      normalizedInventory,
      resolveStarterNpcCapitalShipId(),
      { shipBuyPrice: 0 },
    );
  }
  normalizedInventory = reconcileEquippedWeaponsInInventory(
    grantSurvivalPodShipToInventory(normalizedInventory),
    normalizedShip,
  );
  return {
    ...player,
    shipId: safeShipId,
    ship: normalizedShip,
    shipHangar: normalizedHangar,
    inventorySlots: normalizedInventory,
    combatProficiency: normalizePlayerCombatProficiency(player.combatProficiency, player.level),
  };
}

interface PlayerState {
  player: Player | null;
  levelUpPending: boolean;
  levelUpSummary: LevelUpSummary | null;
  hydrated: boolean;
  setPlayer: (p: Player | null) => void;
  createPlayer: (uid: string, nickname: string) => void;
  loadLocalPlayer: () => Promise<void>;
  resetLocalPlayer: () => Promise<void>;
  persist: () => Promise<void>;
  moveToSystem: (systemId: string) => void;
  landOnPlanet: (planetId: string) => void;
  spendCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  updateShip: (ship: PlayerShip) => void;
  /** 전함 격침 — 생존포드 탑승·거점 귀환·격납고에서 파괴함 제거 */
  applyCapitalShipDestruction: () => Promise<void>;
  /** 무역소 전함 인도분을 격납고에 추가 */
  addHangarShipFromNpcPurchase: (npcCapitalShipId: string) => boolean;
  /** 무역소 전함 아이템 판매 시 격납고 1척 회수 */
  removeHangarShipByNpcId: (npcCapitalShipId: string) => boolean;
  /** 아이템 획득은 인벤토리 슬롯 단일 체계로 누적 */
  addInventoryItem: (goodId: string, quantity: number) => void;
  /** @deprecated — `recordOrbitalMiningDelivery` 사용 */
  recordOrbitalMiningOre1Delivery: (planetId: string, quantity: number) => void;
  /** 궤도 채굴 무역소 입고 실적(행성·광물 id별 누적) */
  recordOrbitalMiningDelivery: (planetId: string, goodId: string, quantity: number) => void;
  addExp: (amount: number) => void;
  learnSkill: (skillId: string) => void;
  clearLevelUp: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  levelUpPending: false,
  levelUpSummary: null,
  hydrated: false,

  setPlayer: (p) => set({ player: p ? ensurePlayerHasDefaultShip(p) : null }),

  createPlayer: (uid, nickname) => {
    const templateId = 'starter_fighter';
    const defaultNpcCapitalShipId = resolvePlayerDefaultNpcCapitalShipId();
    const now = Date.now();
    const player: Player = {
      uid,
      nickname,
      level: 1,
      exp: 0,
      expToNext: EXP_TABLE[2] ?? 300,
      skillPoints: 0,
      credits: 500,
      lifetimeCreditsEarned: 500,
      currentSystemId: 'arcadia',
      currentPlanetId: 'arcadia_prime',
      shipId: templateId,
      ship: shipFromTemplate(templateId),
      // 신규 유저 디폴트 자동구매: 기본 전함 1척을 격납고/인벤에 지급
      shipHangar: [
        {
          id: `hg_boot_${now.toString(36)}`,
          npcCapitalShipId: defaultNpcCapitalShipId,
          acquiredAt: now,
        },
        {
          id: `hg_survival_${now.toString(36)}`,
          npcCapitalShipId: SURVIVAL_POD_NPC_SHIP_ID,
          acquiredAt: now,
        },
      ],
      // 기본 액티브 스킬(테스트): 신규 파일럿은 이중 사격을 기본 보유
      skills: [...DEFAULT_GRANTED_SKILL_IDS],
      stats: {
        strength: 12,
        dexterity: 12,
        constitution: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      flags: {
        tutorialComplete: false,
        introSeen: false,
        firstMissionStarted: false,
        ingameDialog01Seen: false,
        pendingArcadiaDialog01: false,
        seenStorySceneIds: [],
      },
      political: { ...DEFAULT_PLAYER_POLITICAL },
      homePlanetId: null,
      orbitalMiningOre1DeliveredByPlanet: {},
      orbitalMiningDeliveredByPlanet: {},
      inventorySlots: buildInitialInventoryWithDefaultCapitalShip(),
      combatProficiency: createPlayerCombatProficiency(1, now),
      createdAt: now,
    };
    set({ player });
  },

  loadLocalPlayer: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlayerPersistenceShape;
        set({ player: ensurePlayerHasDefaultShip(normalizePlayerPolitical(parsed)) });
      }
    } finally {
      set({ hydrated: true });
    }
  },

  resetLocalPlayer: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ player: null, levelUpPending: false, levelUpSummary: null, hydrated: true });
  },

  persist: async () => {
    const { player } = get();
    if (player) {
      const toSave: Player = {
        ...player,
        ship: normalizeLoadedPlayerShip(player.ship, player.shipId),
        inventorySlots: normalizeInventorySlots(player.inventorySlots),
      };
      set({ player: toSave });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      const session = useUserSessionStore.getState().record;
      const accountDb = useAccountProfileStore.getState();
      const skillDb = useSkillDbStore.getState();
      accountDb.ensureAccountProfile(toSave.uid, toSave.nickname);
      accountDb.syncFromPlayerAndSession(toSave, session);
      skillDb.ensureSkillDb(toSave.uid);
      skillDb.syncOwnedSkills({
        uid: toSave.uid,
        ownedSkillIds: toSave.skills,
        playerLevel: toSave.level,
        source: 'unknown',
      });
      await accountDb.persistAccountProfiles();
      await skillDb.persistSkillDb();
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  },

  moveToSystem: (systemId) => {
    const { player } = get();
    if (!player) return;
    set({ player: { ...player, currentSystemId: systemId, currentPlanetId: null } });
  },

  landOnPlanet: (planetId) => {
    const { player } = get();
    if (!player) return;
    set({ player: { ...player, currentPlanetId: planetId } });
  },

  spendCredits: (amount) => {
    const { player } = get();
    if (!player || player.credits < amount) return false;
    set({ player: { ...player, credits: player.credits - amount } });
    return true;
  },

  addCredits: (amount) => {
    const { player } = get();
    if (!player) return;
    const applied = applyAabsCreditMultiplier(amount);
    const prevLifetime = player.lifetimeCreditsEarned ?? player.credits;
    set({
      player: {
        ...player,
        credits: player.credits + applied,
        lifetimeCreditsEarned: prevLifetime + Math.max(0, applied),
      },
    });
  },

  updateShip: (ship) => {
    const { player } = get();
    if (!player) return;
    set({ player: { ...player, ship } });
  },

  applyCapitalShipDestruction: async () => {
    const { player } = get();
    if (!player) return;
    const next = applyCapitalShipDestructionToPlayer(player);
    set({ player: ensurePlayerHasDefaultShip(next) });
    await get().persist();
  },

  addHangarShipFromNpcPurchase: (npcCapitalShipId) => {
    const { player } = get();
    if (!player || !npcCapitalShipId) return false;
    if (isSurvivalPodNpcShipId(npcCapitalShipId)) return false;
    if (!NPC_CAPITAL_SHIPS_FROM_CSV.some(s => s.id === npcCapitalShipId)) return false;
    if (player.shipHangar.length >= TEMP_MAX_HANGAR_SHIPS) return false;
    const id = `hg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const entry: PlayerHangarShip = {
      id,
      npcCapitalShipId,
      acquiredAt: Date.now(),
    };
    set({
      player: {
        ...player,
        shipHangar: [...player.shipHangar, entry],
      },
    });
    return true;
  },

  removeHangarShipByNpcId: (npcCapitalShipId) => {
    const { player } = get();
    if (!player || !npcCapitalShipId) return false;
    if (isSurvivalPodNpcShipId(npcCapitalShipId)) return false;
    const idx = player.shipHangar.findIndex((h) => h.npcCapitalShipId === npcCapitalShipId);
    if (idx < 0) return false;
    const nextHangar = [...player.shipHangar];
    nextHangar.splice(idx, 1);
    set({
      player: {
        ...player,
        shipHangar: nextHangar,
      },
    });
    return true;
  },

  addInventoryItem: (goodId, quantity) => {
    const { player } = get();
    if (!player || quantity <= 0) return;
    const slots = normalizeInventorySlots(player.inventorySlots);
    const inv = addToInventorySlotsMax(slots, goodId, quantity, 0);
    if (inv.added <= 0) return;
    set({ player: { ...player, inventorySlots: inv.slots } });
  },

  recordOrbitalMiningOre1Delivery: (planetId, quantity) => {
    get().recordOrbitalMiningDelivery(planetId, 'ore_mineral_1', quantity);
  },

  recordOrbitalMiningDelivery: (planetId, goodId, quantity) => {
    const { player } = get();
    if (!player || quantity <= 0 || !planetId || !goodId) return;
    const prevDelivered = player.orbitalMiningDeliveredByPlanet ?? {};
    const prevPlanet = prevDelivered[planetId] ?? {};
    const nextPlanet = { ...prevPlanet, [goodId]: (prevPlanet[goodId] ?? 0) + quantity };
    const nextDelivered = { ...prevDelivered, [planetId]: nextPlanet };
    const legacyOre1 = { ...(player.orbitalMiningOre1DeliveredByPlanet ?? {}) };
    if (goodId === 'ore_mineral_1' || goodId === 'ore_ferrite') {
      legacyOre1[planetId] = (legacyOre1[planetId] ?? 0) + quantity;
    }
    set({
      player: {
        ...player,
        orbitalMiningDeliveredByPlanet: nextDelivered,
        orbitalMiningOre1DeliveredByPlanet: legacyOre1,
      },
    });
  },

  addExp: (amount) => {
    const { player, levelUpPending } = get();
    if (!player) return;
    const startLevel = player.level;
    const proficiencyBefore = normalizePlayerCombatProficiency(
      player.combatProficiency,
      startLevel,
    );
    let p = gainExp(player, applyAabsExpMultiplier(amount));
    let pending = levelUpPending;
    let levelsGained = 0;
    const skillPointsBefore = p.skillPoints;
    for (;;) {
      const { player: np, leveledUp } = processLevelUp(p);
      p = np;
      if (!leveledUp) break;
      pending = true;
      levelsGained += 1;
    }
    const skillPointsGained = p.skillPoints - skillPointsBefore;
    const proficiencyAfter = createPlayerCombatProficiency(p.level);
    p = { ...p, combatProficiency: proficiencyAfter };
    const nextThreshold = EXP_TABLE[p.level + 1] ?? 999999;
    const expToNext = nextThreshold;
    const levelUpSummary: LevelUpSummary | null = levelsGained > 0
      ? {
          previousLevel: startLevel,
          newLevel: p.level,
          skillPointsGained,
          expRemainingForNextLevel: Math.max(0, nextThreshold - p.exp),
          nextLevelThresholdExp: nextThreshold,
          proficiencyBefore,
          proficiencyAfter,
        }
      : get().levelUpSummary;
    set({
      player: { ...p, expToNext },
      levelUpPending: pending,
      levelUpSummary,
    });
    if (levelsGained > 0) {
      void get().persist();
    }
  },

  learnSkill: (skillId) => {
    const { player } = get();
    if (!player) return;
    const skill = SKILLS[skillId] as Skill | undefined;
    if (!skill) return;
    const next = engineLearnSkill(skill, player);
    if (next === player) return;
    set({ player: next });
    const skillDb = useSkillDbStore.getState();
    skillDb.ensureSkillDb(next.uid);
    skillDb.syncOwnedSkills({
      uid: next.uid,
      ownedSkillIds: next.skills,
      playerLevel: next.level,
      source: 'manual_learn',
    });
    void skillDb.persistSkillDb();
  },

  clearLevelUp: () => set({ levelUpPending: false, levelUpSummary: null }),
}));

export { createPlayerCombatProficiency, normalizePlayerCombatProficiency };
