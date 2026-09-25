/**
 * 인게임 대사 세션 팩 — 인덱스 재생 + 배선 고정
 * (팩 빌더는 RN Image/Dimensions를 끌어 tsx 노드에서 로드하지 않음)
 * npx tsx --test src/game/ingameDialog/ingameDialogSessionPack.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { advanceIngameDialogSessionByPack } from './ingameDialogSessionAdvancePack';
import type { IngameDialogSession } from './ingameDialogTypes';

type SessionPack = NonNullable<IngameDialogSession['pack']>;
type PackStep = SessionPack['steps'][number];

function packStep(partial: Partial<PackStep> & Pick<PackStep, 'stepIndex' | 'text'>): PackStep {
  return {
    pageIndex: 0,
    segmentIndex: partial.stepIndex,
    label: '[ 안내 ]',
    typewriterKey: `k-${partial.stepIndex}`,
    typewriterSpeedMs: 28,
    buttonText: '[ 다음 ]',
    isFinalStep: false,
    hasMoreDialogue: true,
    showAcceptCancelChoice: false,
    ...partial,
  };
}

function adhocPack(steps: PackStep[]): SessionPack {
  return {
    sceneId: null,
    adhocId: 'adhoc_pack',
    locale: 'ko',
    nicknameHash: '',
    splitWidthKey: '360|0|0|16|',
    steps,
    uniquePortraitSources: [],
  };
}

test('pack advance moves stepIndex only and completes at the last step', () => {
  const pack = adhocPack([
    packStep({ stepIndex: 0, text: '하나', segmentIndex: 0, isFinalStep: false, hasMoreDialogue: true }),
    packStep({ stepIndex: 1, text: '둘', segmentIndex: 1, isFinalStep: true, hasMoreDialogue: false }),
  ]);
  const session: IngameDialogSession = {
    kind: 'adhoc',
    adhocId: 'adhoc_pack',
    segmentIndex: 0,
    stepIndex: 0,
    pageComplete: true,
    ready: true,
    pack,
    payload: { label: '[ 안내 ]', text: '원문 — 진행 중 재분할 금지' },
  };

  const blocked = advanceIngameDialogSessionByPack({ ...session, pageComplete: false });
  assert.equal(blocked.type, 'blocked');

  const advanced = advanceIngameDialogSessionByPack(session);
  assert.equal(advanced.type, 'advanced');
  if (advanced.type !== 'advanced') return;
  assert.equal(advanced.session.stepIndex, 1);
  assert.equal(advanced.session.pageComplete, false);
  if (advanced.session.kind !== 'adhoc') return;
  assert.equal(advanced.session.segmentIndex, 1);

  const completed = advanceIngameDialogSessionByPack({ ...advanced.session, pageComplete: true });
  assert.equal(completed.type, 'completed');
});

test('csv pack advance copies pageIndex from the next step', () => {
  const pack: SessionPack = {
    sceneId: 'test_zero_load',
    adhocId: null,
    locale: 'ko',
    nicknameHash: '',
    splitWidthKey: '360|0|0|16|',
    uniquePortraitSources: [],
    steps: [
      packStep({ stepIndex: 0, pageIndex: 0, segmentIndex: 0, text: 'p0s0', isFinalStep: false, hasMoreDialogue: true }),
      packStep({ stepIndex: 1, pageIndex: 1, segmentIndex: 0, text: 'p1s0', isFinalStep: true, hasMoreDialogue: false }),
    ],
  };
  const session: IngameDialogSession = {
    kind: 'csv_scene',
    sceneId: 'test_zero_load',
    pageIndex: 0,
    segmentIndex: 0,
    stepIndex: 0,
    pageComplete: true,
    ready: true,
    pack,
    completionActions: [],
    context: {},
  };
  const advanced = advanceIngameDialogSessionByPack(session);
  assert.equal(advanced.type, 'advanced');
  if (advanced.type !== 'advanced' || advanced.session.kind !== 'csv_scene') return;
  assert.equal(advanced.session.stepIndex, 1);
  assert.equal(advanced.session.pageIndex, 1);
  assert.equal(advanced.session.segmentIndex, 0);
});

test('Host waits for ready, attaches a session pack, and mounts the portrait warmer', () => {
  const host = readFileSync(resolve(__dirname, './IngameDialogHost.tsx'), 'utf8');
  assert.match(host, /session\?\.ready === true/);
  assert.match(host, /buildCsvIngameDialogSessionPack/);
  assert.match(host, /buildAdhocIngameDialogSessionPack/);
  assert.match(host, /IngameDialogPortraitWarmer/);
  assert.match(host, /typewriterActive:\s*true/);
  assert.match(host, /prefetchImageSources/);
  assert.doesNotMatch(host, /listCriticalSessionImageSources/);
});

test('store gates present on ready and skips live split when a pack exists', () => {
  const store = readFileSync(resolve(__dirname, '../../store/ingameDialogStore.ts'), 'utf8');
  assert.match(store, /ready:\s*false/);
  assert.match(store, /beginReadyWatch/);
  assert.match(store, /INGAME_DIALOG_READY_TIMEOUT_MS/);
  assert.match(store, /session\.pack/);
  assert.match(store, /attachSessionPack/);
  assert.match(store, /markPackReady/);
});

test('quest accept wiring shows 다음에 decline in pack and cancel path', () => {
  const pack = readFileSync(resolve(__dirname, './ingameDialogSessionPack.ts'), 'utf8');
  const viewModel = readFileSync(resolve(__dirname, './ingameDialogViewModel.ts'), 'utf8');
  const store = readFileSync(resolve(__dirname, '../../store/ingameDialogStore.ts'), 'utf8');
  assert.match(pack, /dialog\.later/);
  assert.match(viewModel, /dialog\.later/);
  assert.match(store, /isOfferDeclineActionType/);
});

test('overlay and intro wire typewriterActive / intro pack (R-1·R-4)', () => {
  const overlay = readFileSync(
    resolve(__dirname, '../../ui/overlay/content/NarrativeOverlayContent.tsx'),
    'utf8',
  );
  const intro = readFileSync(resolve(__dirname, '../../../app/(game)/intro.tsx'), 'utf8');
  const pack = readFileSync(resolve(__dirname, './ingameDialogSessionPack.ts'), 'utf8');
  const warmer = readFileSync(resolve(__dirname, './IngameDialogPortraitWarmer.tsx'), 'utf8');
  assert.match(overlay, /typewriterActive=\{entry\.typewriterActive !== false\}/);
  assert.match(intro, /buildIntroIngameDialogSessionPack/);
  assert.match(intro, /IngameDialogPortraitWarmer/);
  assert.match(intro, /typewriterActive=\{introDialogReady\}/);
  assert.match(pack, /INGAME_DIALOG_PACK_STEP_CAP = 64/);
  assert.match(pack, /INGAME_DIALOG_READY_TIMEOUT_MS = 400/);
  assert.match(warmer, /width: 240/);
});
