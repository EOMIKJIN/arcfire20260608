import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveStoryPageActionLabel } from '../../i18n/storyText';
import { resolveIngameDialogFinalLabel } from './resolveIngameDialogFinalLabel';

test('final page uses actionLabel when set', () => {
  const page = {
    actionLabel: '[ 블랙마켓인도처리 ]',
    actionLabelEn: '[ Confirm black-market delivery ]',
  };
  assert.equal(resolveStoryPageActionLabel(page, 'ko'), '[ 블랙마켓인도처리 ]');
  assert.equal(resolveStoryPageActionLabel(page, 'en'), '[ Confirm black-market delivery ]');
  assert.equal(
    resolveIngameDialogFinalLabel({
      locale: 'ko',
      showAcceptCancelChoice: false,
      isQuestAccept: false,
      page,
      okLabel: '[ 확인 ]',
      acceptLabel: '[ 수락 ]',
      questAcceptLabel: '[ 의뢰 수락 ]',
    }),
    '[ 블랙마켓인도처리 ]',
  );
});

test('empty actionLabel keeps confirm fallback', () => {
  const page = { actionLabel: null, actionLabelEn: null };
  assert.equal(resolveStoryPageActionLabel(page, 'ko'), '');
  assert.equal(
    resolveIngameDialogFinalLabel({
      locale: 'ko',
      showAcceptCancelChoice: false,
      isQuestAccept: false,
      page,
      okLabel: '[ 확인 ]',
      acceptLabel: '[ 수락 ]',
      questAcceptLabel: '[ 의뢰 수락 ]',
    }),
    '[ 확인 ]',
  );
});

test('accept choice beats actionLabel', () => {
  assert.equal(
    resolveIngameDialogFinalLabel({
      locale: 'ko',
      showAcceptCancelChoice: true,
      isQuestAccept: false,
      page: { actionLabel: '[ 블랙마켓인도처리 ]', actionLabelEn: null },
      okLabel: '[ 확인 ]',
      acceptLabel: '[ 수락 ]',
      questAcceptLabel: '[ 의뢰 수락 ]',
    }),
    '[ 수락 ]',
  );
});
