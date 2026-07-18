import firestore from '@react-native-firebase/firestore';
import { setDoc, userDocRef } from './firestoreRefs';
import {
  configureFirestorePersistence,
  resolveAppVersion,
  resolveRegionCode,
  resolveUserType,
} from './firestoreClientConfig';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { useAccountProfileStore } from '../store/accountProfileStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { useItemLedgerStore } from '../store/itemLedgerStore';
import { useMissionStore } from '../store/missionStore';
import { useNpcCaptainProgressStore } from '../store/npcCaptainProgressStore';
import { usePlayerStore } from '../store/playerStore';
import { useSkillDbStore } from '../store/skillDbStore';
import { useUserSessionStore } from '../store/userSessionStore';
import { useWorldStore } from '../store/worldStore';
import { countGoodInInventory, normalizeInventorySlots } from '../game/playerInventory';

export {
  configureFirestorePersistence,
  resolveAppVersion,
  resolveRegionCode,
  resolveUserType,
} from './firestoreClientConfig';

/** 클라우드 페이로드 상한 — 로컬 스토어는 무손실 유지, users 문서만 캡 (1MB 한계·인덱스 팬아웃 방지) */
const CLOUD_SYNC_OPERATIONS_CAP = 40;
const CLOUD_SYNC_DEPLOYMENTS_CAP = 60;

function stripUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    const out = value.map(stripUndefinedDeep).filter(v => v !== undefined);
    return out;
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const sv = stripUndefinedDeep(v);
    if (sv !== undefined) out[k] = sv;
  }
  return out;
}

function buildNpcCaptainRefBundle(): {
  slots: Array<{ slot: 1 | 2 | 3 | 4 | 5; refId: string }>;
  hiredNpcRefIds: string[];
  teamNpcRefIds: string[];
} {
  const fallbackIds = ['npc_temp_01', 'npc_temp_02', 'npc_temp_03', 'npc_temp_04', 'npc_temp_05'];
  const defaultRefIds = NPC_CAPTAINS_FROM_CSV
    .map((row) => row.id)
    .filter((id) => typeof id === 'string' && id.trim().length > 0)
    .slice(0, 5);
  while (defaultRefIds.length < 5) {
    defaultRefIds.push(fallbackIds[defaultRefIds.length]!);
  }
  return {
    slots: [
      { slot: 1, refId: defaultRefIds[0]! },
      { slot: 2, refId: defaultRefIds[1]! },
      { slot: 3, refId: defaultRefIds[2]! },
      { slot: 4, refId: defaultRefIds[3]! },
      { slot: 5, refId: defaultRefIds[4]! },
    ],
    // 향후 확장: 고용 NPC 참조 목록
    hiredNpcRefIds: [],
    // 향후 확장: 팀원 NPC 참조 목록
    teamNpcRefIds: [],
  };
}

function buildInventorySyncBundle(uid: string): Record<string, unknown> | null {
  const inventory = useItemLedgerStore.getState().ledgersByUid[uid];
  if (!inventory) return null;
  const player = usePlayerStore.getState().player;
  const balances = { ...inventory.balances };
  if (player?.uid === uid) {
    const slots = normalizeInventorySlots(player.inventorySlots);
    Object.keys(balances).forEach((itemId) => {
      if (!itemId.startsWith('capital_ship_')) return;
      // 전함 아이템 원장은 실제 인벤 수량을 정본으로 강제해 서버 복원(되살아남) 현상을 차단한다.
      balances[itemId] = countGoodInInventory(slots, itemId);
    });
  }
  return {
    ...inventory,
    balances,
    // 서버 데이터 청소: 로그 배열은 사용 중단
    txns: [],
  };
}

function buildPlanetCoreRuntimeSyncBundle(uid: string): {
  visitedPlanetIds: string[];
  lastVisitedPlanetId: string | null;
} {
  const player = usePlayerStore.getState().player;
  const cw = useClanWarFoundationStore.getState();
  const visitedSet = new Set<string>();
  const addId = (id: unknown) => {
    if (typeof id !== 'string') return;
    const trimmed = id.trim();
    if (!trimmed) return;
    visitedSet.add(trimmed);
  };

  // 현재 위치/홈 행성은 기본 방문 이력으로 취급
  addId(player?.currentPlanetId ?? null);
  addId(player?.homePlanetId ?? null);

  // 플레이어 행동(채굴 인도) 이력 기반 방문 행성
  const deliveredByPlanet = player?.orbitalMiningOre1DeliveredByPlanet ?? {};
  Object.keys(deliveredByPlanet).forEach(addId);

  // 플레이어 소유/점유 관련 행성도 범용 방문 후보에 포함
  const currentClanId = player?.political?.clanId ?? null;
  for (const hold of Object.values(cw.planetHolds)) {
    if (!hold) continue;
    if (hold.homePlayerUid === uid || (currentClanId && hold.deedOwnerClanId === currentClanId)) {
      addId(hold.planetId);
    }
  }

  return {
    visitedPlanetIds: Array.from(visitedSet).sort(),
    lastVisitedPlanetId: player?.currentPlanetId ?? null,
  };
}

export function buildUnifiedLocalUserObject(uid: string): Record<string, unknown> {
  const player = usePlayerStore.getState().player;
  const accountProfile = useAccountProfileStore.getState().profilesByUid[uid] ?? null;
  const userSession = useUserSessionStore.getState().record;
  const inventory = buildInventorySyncBundle(uid);
  const skillDb = useSkillDbStore.getState().skillDbsByUid[uid] ?? null;
  const npcCaptainProgress = buildNpcCaptainRefBundle();
  const missionState = {
    progresses: useMissionStore.getState().progresses,
    activeMissionId: useMissionStore.getState().activeMissionId,
  };
  const world = { visitedSystemIds: useWorldStore.getState().visitedSystemIds };
  const planetCoreRuntime = buildPlanetCoreRuntimeSyncBundle(uid);
  const cw = useClanWarFoundationStore.getState();
  // 문서 크기·인덱스 팬아웃 통제(1MB 한계 대비 · 10만 유저):
  //  - planetHolds는 top-level `planet_holds` 단일 사본만 전송(종전 clanWarFoundation 내 중복 제거)
  //  - operations(최신 우선 prepend)·deployments는 상한 캡 — 로컬 정본은 무손실, 클라우드는 요약본
  const clanWarFoundation = {
    clans: cw.clans,
    deployments: cw.deployments.slice(-CLOUD_SYNC_DEPLOYMENTS_CAP),
    operations: cw.operations.slice(0, CLOUD_SYNC_OPERATIONS_CAP),
  };
  const planet_holds = cw.planetHolds;

  const nickname = player?.nickname ?? accountProfile?.nicknameSnapshot ?? null;

  return stripUndefinedDeep({
    uid,
    nickname,
    player: player ?? null,
    userProfile: accountProfile,
    userSession,
    inventory,
    skillDb,
    npcCaptainProgress,
    stageProgress: missionState,
    world,
    planetCoreRuntime,
    clanWarFoundation,
    planet_holds,
    user_type: resolveUserType(uid, nickname),
    isAdmin: resolveUserType(uid, nickname) === 'admin',
  }) as Record<string, unknown>;
}

export async function syncUserDataWithServer(): Promise<void> {
  const player = usePlayerStore.getState().player;
  const uid = player?.uid;
  if (!uid) return;

  configureFirestorePersistence();

  const nickname = (player.nickname ?? '').trim() || 'Unknown';
  const localBundle = buildUnifiedLocalUserObject(uid);

  // 점(.) 경로 키(`planetCoreRuntime.byPlanetId`)와 동시에 `planetCoreRuntime` 객체를 보내면
  // 일부 네이티브 직렬화에서 맵/문자열 충돌(uncaught: value is a string, expected an object)이 날 수 있어,
  // FieldValue.delete()는 중첩 맵 안에서만 보낸다.
  const existingPc = localBundle.planetCoreRuntime;
  const planetCoreBase =
    existingPc && typeof existingPc === 'object' && !Array.isArray(existingPc)
      ? (existingPc as Record<string, unknown>)
      : {};

  const existingCw = localBundle.clanWarFoundation;
  const clanWarBase =
    existingCw && typeof existingCw === 'object' && !Array.isArray(existingCw)
      ? (existingCw as Record<string, unknown>)
      : {};

  const payload: Record<string, unknown> = {
    ...localBundle,
    planetCoreRuntime: {
      ...planetCoreBase,
      byPlanetId: firestore.FieldValue.delete(),
    },
    clanWarFoundation: {
      ...clanWarBase,
      // 구형 중복 사본 제거 — planet_holds top-level 단일 사본만 유지
      planetHolds: firestore.FieldValue.delete(),
    },
    // merge 저장에서는 누락 필드가 삭제되지 않으므로, 구형 대용량 행성 맵은 명시적으로 제거
    server_updatedAt: firestore.FieldValue.serverTimestamp(),
    app_version: resolveAppVersion(),
    region_code: resolveRegionCode(),
    user_type: resolveUserType(uid, player.nickname),
    isAdmin: resolveUserType(uid, player.nickname) === 'admin',
    nickname,
    uid,
  };

  try {
    // rules 통과용 Anonymous Auth 확보(세션 영속 — 최초 1회만 sign-in)
    const { ensureFirebaseAnonymousAuth } = await import('./firebaseAnonymousAuth');
    await ensureFirebaseAnonymousAuth();
    await setDoc(userDocRef(uid), payload as Record<string, unknown>, { merge: true });
    void import('./gameSaveBackup/scheduleGameSaveBackup').then((m) => {
      m.scheduleGameSaveBackupAfterCloudSync(uid);
    });
    // 기존 계정 닉네임 소급 예약 — uid당 1회(내부 플래그로 no-op 보장)
    void import('./nicknameRegistry').then((m) => {
      m.ensureNicknameReservedRetro(uid, nickname);
    });
  } catch (e) {
    console.warn('[userDataSync] syncUserDataWithServer failed (queued offline if persistence enabled):', e);
  }
}
