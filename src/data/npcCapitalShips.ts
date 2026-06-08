// ============================================================
// NPC AI 전함 DB — CSV 생성본을 단일 소스로 사용
// source: tables/content/npc_ai_ships.csv (궤도 수송 속도: arcTrafficDwellRadPerSec, arcTrafficPhaseDurationMul)
// ============================================================

import type { NpcCapitalShip } from '../types';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from './generated';

export const NPC_CAPITAL_SHIPS: readonly NpcCapitalShip[] = NPC_CAPITAL_SHIPS_FROM_CSV;

export { resolveNpcCapitalShipPortraitSource } from '../game/npcCapitalShipPortraitAssets';
