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

module.exports = {
  resolveHandoffPath,
  readTopHandoffStatus,
  readPendingHandoff,
};
