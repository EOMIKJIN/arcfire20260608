/**
 * 함장 profileKo 전수 — 포트레이트·스토리 배경 정본이 비면 안 된다.
 * npx tsx --test src/npc/npcCaptainProfileIntegrity.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';

test('npc_ai_captains profileKo 전수 비어 있지 않음', () => {
  const missing: string[] = [];
  for (let i = 0; i < NPC_CAPTAINS_FROM_CSV.length; i += 1) {
    const row = NPC_CAPTAINS_FROM_CSV[i]!;
    if (!String(row.profileKo ?? '').trim()) missing.push(row.id);
  }
  assert.equal(NPC_CAPTAINS_FROM_CSV.length >= 262, true, `함장 수 ${NPC_CAPTAINS_FROM_CSV.length}`);
  assert.equal(missing.length, 0, `profileKo 누락: ${missing.join(', ')}`);
});
