'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { readTopHandoffStatus, readPendingHandoff } = require('./kimClaudeHandoffCore.cjs');

function writeHandoff(root, body) {
  const dir = path.join(root, 'tools', 'kim-team-lead', 'reports');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'kim-claude-handoff-pending.md'), body, 'utf8');
}

test('codeblock at top wins over later table REVIEWED', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-core-'));
  writeHandoff(
    root,
    [
      '## PENDING brief',
      '',
      '```text',
      'status=PENDING',
      'task_id=open-issues-brief-20260928',
      '```',
      '',
      '| **status** | **`REVIEWED`** |',
      '| **task_id** | `transit-combat-skia-backdrop-fix-20260916` |',
      '',
    ].join('\n'),
  );
  const top = readTopHandoffStatus(root);
  assert.equal(top.status, 'PENDING');
  assert.equal(top.taskId, 'open-issues-brief-20260928');
  assert.ok(readPendingHandoff(root));
});

test('table at top is used when no earlier codeblock', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-core-'));
  writeHandoff(
    root,
    [
      '| **status** | **`IDLE`** |',
      '| **task_id** | `older-table` |',
      '',
      '```text',
      'status=PENDING',
      'task_id=later-block',
      '```',
      '',
    ].join('\n'),
  );
  const top = readTopHandoffStatus(root);
  assert.equal(top.status, 'IDLE');
  assert.equal(top.taskId, 'older-table');
  assert.equal(readPendingHandoff(root), null);
});

test('REVIEWED top is not pending', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-core-'));
  writeHandoff(
    root,
    ['```text', 'status=REVIEWED', 'task_id=open-issues-brief-20260928', '```', ''].join('\n'),
  );
  assert.equal(readTopHandoffStatus(root).status, 'REVIEWED');
  assert.equal(readPendingHandoff(root), null);
});
