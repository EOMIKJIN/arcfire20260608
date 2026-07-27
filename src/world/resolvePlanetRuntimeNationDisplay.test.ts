/**
 * 행성정보 「국가」표시 — 순수 계산 unit tests
 * npx tsx --test src/world/resolvePlanetRuntimeNationDisplay.test.ts
 */
import assert from 'node:assert/strict';
import {
  resolveNationDisplayForSide,
  stripNationDescriptionPrefix,
  withRuntimeNationPrefixForSide,
} from './resolvePlanetRuntimeNationDisplayCore';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

// ── stripNationDescriptionPrefix ──
test('strip — [국가: 크림슨 레기온] 접두 제거, 본문만 남음', () => {
  assert.equal(
    stripNationDescriptionPrefix('[국가: 크림슨 레기온] 시리우스 인근 국경 초소.'),
    '시리우스 인근 국경 초소.',
  );
});

test('strip — [Nation: Crimson Legion] 접두 제거', () => {
  assert.equal(
    stripNationDescriptionPrefix('[Nation: Crimson Legion] A border outpost near Sirius.'),
    'A border outpost near Sirius.',
  );
});

test('strip — 접두 없는 텍스트는 그대로(no-op)', () => {
  assert.equal(stripNationDescriptionPrefix('개발 진행 중인 행성.'), '개발 진행 중인 행성.');
});

// ── resolveNationDisplayForSide ──
test('independent — {닉네임} 독립국 (월드맵과 동일 문구)', () => {
  assert.equal(resolveNationDisplayForSide('independent', 'ko', '대표님'), '대표님 독립국');
  assert.equal(resolveNationDisplayForSide('independent', 'en', 'Captain'), 'Captain Independent Nation');
});

test('blue/red — 메가팩션 국가명(CSV와 동일)', () => {
  assert.equal(resolveNationDisplayForSide('blue', 'ko', ''), '스텔리움 연합');
  assert.equal(resolveNationDisplayForSide('red', 'ko', ''), '크림슨 레기온');
  assert.equal(resolveNationDisplayForSide('red', 'en', ''), 'Crimson Legion');
});

test('neutral — null(접두 없음)', () => {
  assert.equal(resolveNationDisplayForSide('neutral', 'ko', ''), null);
});

// ── withRuntimeNationPrefixForSide — M5 시나리오 그대로 ──
test('M5-1: player_independent(hold) — 시드 국가명 없음 + 독립/닉네임 접두 있음', () => {
  const out = withRuntimeNationPrefixForSide(
    '[국가: 크림슨 레기온] 시리우스 인근 국경 초소.',
    'independent',
    'ko',
    '대표님',
  );
  assert.equal(out, '[국가: 대표님 독립국] 시리우스 인근 국경 초소.');
  assert.equal(out.includes('크림슨'), false);
});

test('M5-2: blue/red 시드 hold — CSV와 동일 국가명 유지', () => {
  const out = withRuntimeNationPrefixForSide(
    '[국가: 크림슨 레기온] 시리우스 인근 국경 초소.',
    'red',
    'ko',
    '',
  );
  assert.equal(out, '[국가: 크림슨 레기온] 시리우스 인근 국경 초소.');
});

test('M5-3: neutral — 시드 국가 접두 없음(본문만)', () => {
  const out = withRuntimeNationPrefixForSide(
    '[국가: 크림슨 레기온] 시리우스 인근 국경 초소.',
    'neutral',
    'ko',
    '',
  );
  assert.equal(out, '시리우스 인근 국경 초소.');
  assert.equal(out.includes('['), false);
});

test('접두 없던 텍스트도 non-neutral hold면 새로 접두(단계 설명 등 일관 적용)', () => {
  const out = withRuntimeNationPrefixForSide('개발 진행 중 — 시설 확장.', 'blue', 'ko', '');
  assert.equal(out, '[국가: 스텔리움 연합] 개발 진행 중 — 시설 확장.');
});

console.log('[resolvePlanetRuntimeNationDisplay] all tests passed');
