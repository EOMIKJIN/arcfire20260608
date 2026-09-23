'use strict';
/**
 * 김클로드 handoff PENDING 감지 공유 코어
 * handoff 표: `| **status** | **`PENDING`** |` — 상단(첫) status만 유효.
 * ARCHIVE 안의 옛 PENDING 을 오탐하지 않도록 첫 매치만 사용.
 */
const fs = require('fs');
const path = require('path');

function resolveHandoffPath(root) {
  return path.join(
    root,
    'tools',
    'kim-team-lead',
    'reports',
    'kim-claude-handoff-pending.md',
  );
}

/** @returns {{ taskId: string, status: string, head: string, mtimeMs: number } | null} */
function readTopHandoffStatus(root) {
  const handoff = resolveHandoffPath(root);
  try {
    if (!fs.existsSync(handoff)) return null;
    const text = fs.readFileSync(handoff, 'utf8');
    // 표 셀: | **status** | **`VALUE`** |  (VALUE만 캡처)
    const statusMatch = text.match(/\|\s*\*\*status\*\*\s*\|\s*\*\*`([^`]+)`/);
    const status = statusMatch ? statusMatch[1].trim() : '';
    if (!status) return null;
    const taskMatch = text.match(/\|\s*\*\*task_id\*\*\s*\|\s*`([^`]+)`/);
    const taskId = taskMatch ? taskMatch[1].trim() : '(unknown)';
    const head = text.split('\n').slice(0, 55).join('\n');
    return {
      status,
      taskId,
      head,
      mtimeMs: fs.statSync(handoff).mtimeMs,
    };
  } catch {
    return null;
  }
}

/** PENDING일 때만 반환 */
function readPendingHandoff(root) {
  const top = readTopHandoffStatus(root);
  if (!top || top.status !== 'PENDING') return null;
  return top;
}

/** 대표님 2026-08-14 — 아크코어 대화채널 검수 직후 전수 조사 */
const ARC_CORE_BACKCHANNEL_REVIEW_TASK_ID = 'arc-core-backchannel-joint-review-20260814';

function extraDutyForPending(pending) {
  if (!pending || pending.taskId !== ARC_CORE_BACKCHANNEL_REVIEW_TASK_ID) return '';
  return [
    '',
    '## P0 — 대표님 추가 지시 (2026-08-14) 검수 직후 전수 조사',
    '김클로드 DESIGN_REVIEW 판정 흡수 후, **구현 전에** 아크코어 대화채널 전체를 다시 전수 조사하라.',
    '특히: **메모리**(PSS/Views/STAGE 이탈) · **누적**(overlay 스택·메시지·lastFired) · **채팅기록 데이터**(persist/purge/game-save/hydrate).',
    '정본: `docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md` §11',
    '체크리스트: `tools/kim-team-lead/reports/kim-team-lead-ready-arc-core-backchannel-post-review-full-audit.md`',
    '구현 착수 금지 — 전수 조사 보고 후 대표님 구현 지시 대기.',
  ].join('\n');
}

module.exports = {
  resolveHandoffPath,
  readTopHandoffStatus,
  readPendingHandoff,
  extraDutyForPending,
  ARC_CORE_BACKCHANNEL_REVIEW_TASK_ID,
};
