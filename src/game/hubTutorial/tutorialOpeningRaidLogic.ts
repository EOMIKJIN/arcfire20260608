/**
 * 아르카디아 오프닝 습격 — 순수 판정.
 * 조건 id `time_draw_retreat` 는 이후 범용 전투 종료 조건의 첫 호출이다.
 * 이 파일은 그 프레임워크를 만들지 않는다.
 */

export const TUTORIAL_OPENING_RAID_CONDITION_ID = 'time_draw_retreat';
export const TUTORIAL_OPENING_RAID_DRAW_MS = 20_000;
export const TUTORIAL_OPENING_RAID_PLANET_ID = 'arcadia_prime';

const PLAYER_FLAGSHIP_CAPTAIN_ID = 'Player_pilot';

const TUTORIAL_OPENING_RAID_RED_SLOTS = [
  {
    captainId: 'npc_cpt_enemy_arcadia_01',
    npcShipId: 'npc_enemy_arcadia_01',
    isLeader: true,
  },
  {
    captainId: 'npc_cpt_enemy_arcadia_03',
    npcShipId: 'npc_enemy_arcadia_03',
    isLeader: false,
  },
  {
    captainId: 'npc_cpt_enemy_solar_01',
    npcShipId: 'npc_enemy_solar_01',
    isLeader: false,
  },
] as const;

export type TutorialOpeningRaidSeedSlot = {
  team: 'red' | 'blue';
  npcShipId: string | null;
  captainId: string;
  isLeader?: boolean;
};

export function shouldTutorialOpeningRaidDraw(foughtMs: number, playerAlive: boolean): boolean {
  return playerAlive === true && foughtMs >= TUTORIAL_OPENING_RAID_DRAW_MS;
}

export function buildTutorialOpeningRaidSeedSlots(
  playerFlagshipNpcShipId: string | null,
): TutorialOpeningRaidSeedSlot[] {
  const slots: TutorialOpeningRaidSeedSlot[] = [];
  for (let i = 0; i < TUTORIAL_OPENING_RAID_RED_SLOTS.length; i += 1) {
    const red = TUTORIAL_OPENING_RAID_RED_SLOTS[i]!;
    slots.push({
      team: 'red',
      npcShipId: red.npcShipId,
      captainId: red.captainId,
      isLeader: red.isLeader,
    });
  }
  slots.push({
    team: 'blue',
    npcShipId: playerFlagshipNpcShipId,
    captainId: PLAYER_FLAGSHIP_CAPTAIN_ID,
    isLeader: true,
  });
  return slots;
}
