/**
 * 인게임 대사 페이지 분할 — 빈 줄 제거 · 2~3줄 문장 경계
 * npx tsx --test src/ui/overlay/splitNarrativeDialogSegments.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countNarrativeDialogVisualLines,
  isNarrativeDialogContextBreak,
  narrativeDialogPagesFitLineBudget,
  splitNarrativeDialogSegmentsCore,
} from './splitNarrativeDialogSegmentsCore';

function assertPagesFit(chunks: string[], maxLines: number, charsPerLine: number): void {
  assert.equal(narrativeDialogPagesFitLineBudget(chunks, maxLines, charsPerLine), true);
  for (const chunk of chunks) {
    assert.ok(countNarrativeDialogVisualLines(chunk, charsPerLine) <= maxLines);
  }
}

const WIDE = 80;

test('blank lines from \\n\\n are not shown', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    '환영합니다. [닉네임]님.\n\n아르카디아에 도착하셨습니다.\n먼저 하단의 스캔을 누르십시오.',
    3,
    WIDE,
  );
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]?.includes('\n\n'), false);
  assert.deepEqual(chunks[0]?.split('\n'), [
    '환영합니다. [닉네임]님.',
    '아르카디아에 도착하셨습니다.',
    '먼저 하단의 스캔을 누르십시오.',
  ]);
});

test('trailing blank paragraphs are dropped', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    '그들은 압도적인 아크코어의 힘을 앞세워,\n오랜 전통과 역사를 간직한\n스텔리움 연합을 침공했다.\n\n',
    3,
    WIDE,
  );
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]?.split('\n').length, 3);
  assert.ok(chunks[0]?.endsWith('침공했다.'));
});

test('a 4-line sentence without a mid break packs 2+2 instead of 3+1', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    '은하계 동부를 손에 넣은 크림슨 레기온은\n끈질기고 은밀한 움직임 끝에\n마침내 깊숙한 어둠의 구역안에\n잠들어 있던 아크코어를 찾아낸다.',
    3,
    WIDE,
  );
  assert.deepEqual(chunks, [
    '은하계 동부를 손에 넣은 크림슨 레기온은\n끈질기고 은밀한 움직임 끝에',
    '마침내 깊숙한 어둠의 구역안에\n잠들어 있던 아크코어를 찾아낸다.',
  ]);
});

test('sentence end at line 2 turns the page before an unfinished clause', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    '스캔이 완료되었습니다.\n하단의 [대화]가 열렸습니다.\n은하계 동부를 손에 넣은 크림슨 레기온은\n잠들어 있던 아크코어를 찾아낸다.',
    3,
    WIDE,
  );
  assert.equal(chunks[0], '스캔이 완료되었습니다.\n하단의 [대화]가 열렸습니다.');
  assert.equal(
    chunks[1],
    '은하계 동부를 손에 넣은 크림슨 레기온은\n잠들어 있던 아크코어를 찾아낸다.',
  );
});

test('three finished sentences stay on one page', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    '관문 순찰대다, [닉네임].\n아르카디아 거주구에서 살인 사건이 났다.\n연방 수사 라인이 아직 비어 있다.',
    3,
    WIDE,
  );
  assert.equal(chunks.length, 1);
  assertPagesFit(chunks, 3, WIDE);
});

test('phone-width wrap still avoids a 3+1 orphan on intro page 0', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    '은하계 동부를 손에 넣은 크림슨 레기온은\n끈질기고 은밀한 움직임 끝에\n마침내 깊숙한 어둠의 구역안에\n잠들어 있던 아크코어를 찾아낸다.',
    3,
    27,
  );
  assert.equal(chunks.length, 2);
  assert.ok((chunks[0]?.split('\n').length ?? 0) <= 3);
  assert.ok((chunks[1]?.split('\n').length ?? 0) <= 3);
  assert.notEqual(chunks[1]?.split('\n').length, 1);
  assertPagesFit(chunks, 3, 27);
});

test('phone-width long sentences paginate instead of clipping the 3-line box', () => {
  const text =
    '제독님, 급합니다.\n행성 체류·궤도 인원 중 수상한 움직임이 감지됐습니다.\n정체 불명 함장이 기술 지표 주변에 이상 접근 패턴을 보입니다.';
  const chunks = splitNarrativeDialogSegmentsCore(text, 3, 22);
  assertPagesFit(chunks, 3, 22);
  assert.ok(chunks.join('\n').includes('패턴을 보입니다.'));
  assert.ok(chunks.join('\n').includes('감지됐습니다.'));
});

test('two long finished sentences auto-paginate without authored 4-line breaks', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    "이제, 저와 대화할 수 있는 메신저 통신창이 연결되었습니다.\n'대화'버튼을 누르면 저와 언제든지 대화할 수 있어요",
    3,
    22,
  );
  assert.ok(chunks.length >= 2);
  assertPagesFit(chunks, 3, 22);
  const flat = chunks.join(' ').replace(/\n/g, ' ').replace(/\s+/g, ' ');
  assert.ok(flat.includes('연결되었습니다'));
  assert.ok(flat.includes('대화할 수 있어요'));
});

test('a long unbreakable paragraph paginates without leftover 1-char rows', () => {
  const line = '은하계동부를손에넣은크림슨레기온은마침내깊숙한어둠의구역안에서아크코어를찾아낸다.';
  const chunks = splitNarrativeDialogSegmentsCore(line, 2, 16);
  assert.ok(chunks.length >= 2);
  assertPagesFit(chunks, 2, 16);
  for (const chunk of chunks) {
    for (const row of chunk.split('\n')) {
      if (!row) continue;
      assert.ok(row.length >= 2);
    }
  }
});

test('same width budget always yields the same wrap', () => {
  const text = '아르카디아에 도착하셨습니다. 먼저 하단의 스캔을 누르십시오.';
  const a = splitNarrativeDialogSegmentsCore(text, 3, 22);
  const b = splitNarrativeDialogSegmentsCore(text, 3, 22);
  assert.deepEqual(a, b);
});

test('scan messenger copy paginates 2+2 so the 3-line box shows every line', () => {
  const chunks = splitNarrativeDialogSegmentsCore(
    "이제, 저와 대화할 수 있는\n메신저 통신창이 연결되었습니다.\n'대화'버튼을 누르면\n저와 언제든지 대화할 수 있어요",
    3,
    22,
  );
  assert.deepEqual(chunks, [
    '이제, 저와 대화할 수 있는\n메신저 통신창이 연결되었습니다.',
    "'대화'버튼을 누르면\n저와 언제든지 대화할 수 있어요",
  ]);
  assertPagesFit(chunks, 3, 22);
});

test('isNarrativeDialogContextBreak recognizes Korean endings', () => {
  assert.equal(isNarrativeDialogContextBreak('도착하셨습니다.'), true);
  assert.equal(isNarrativeDialogContextBreak('누르십시오.'), true);
  assert.equal(isNarrativeDialogContextBreak('찾아낸다.'), true);
  assert.equal(isNarrativeDialogContextBreak('크림슨 레기온은'), false);
  assert.equal(isNarrativeDialogContextBreak('어둠의 구역안에'), false);
});
