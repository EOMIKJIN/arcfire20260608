/**
 * npx tsx --test src/game/planetHub/nearbyPresenceDisplayContract.test.ts
 * (planetHubConstants는 CSV/함선 그래프를 끌어와 제외 — strip 계약만 검증)
 */
import assert from 'node:assert/strict';
import { stripHubOrbitClanBracketPrefix } from './nearbyPresenceContract';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function orbitCaptainCaptionFromLineLite(line: string): string {
  const left = line.split(' \u2502 ')[0] ?? '';
  const idx = left.indexOf(' · ');
  const raw = idx >= 0 ? left.slice(0, idx).trim() : left.trim();
  return [...stripHubOrbitClanBracketPrefix(raw)].slice(0, 3).join('');
}

test('strip: ‹클랜› prefix 제거', () => {
  assert.equal(stripHubOrbitClanBracketPrefix('‹홍월 약탈 함대› 카일 드레이'), '카일 드레이');
  assert.equal(stripHubOrbitClanBracketPrefix('엘렌 드 코르'), '엘렌 드 코르');
});

test('caption lite: 함장 head3 (클랜 문자 미포함)', () => {
  const cap = orbitCaptainCaptionFromLineLite('‹홍월 약탈 함대› 카일 드레이 · 레이더 호크 \u2502 x');
  assert.equal(cap, [...'카일 드레이'].slice(0, 3).join(''));
  assert.ok(!cap.includes('홍') && !cap.includes('‹'));
});

test('caption lite: 클랜 없는 정상 함장', () => {
  const cap = orbitCaptainCaptionFromLineLite('엘렌 드 코르 · 아르카디아 순찰함 \u2502 x');
  assert.equal(cap, [...'엘렌 드 코르'].slice(0, 3).join(''));
});

console.log('[nearbyPresenceDisplayContract] all tests passed');
