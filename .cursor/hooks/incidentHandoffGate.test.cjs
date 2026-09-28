'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { shouldInjectIncidentP0 } = require('./incidentHandoffGate.cjs');

function seed(root, { handoff, trigger, ackIso }) {
  const outbox = path.join(root, 'tools/long-run-monitor/outbox');
  fs.mkdirSync(outbox, { recursive: true });
  fs.mkdirSync(path.join(root, '.cursor'), { recursive: true });
  if (handoff) {
    fs.writeFileSync(path.join(outbox, 'cursor-incident-handoff.md'), '# h\n', 'utf8');
  }
  if (trigger) {
    fs.writeFileSync(path.join(root, '.cursor/trigger-incident-auto-fix.json'), '{}', 'utf8');
  }
  if (ackIso) {
    fs.writeFileSync(path.join(outbox, 'incident-handoff-acked-at.txt'), ackIso, 'utf8');
  }
}

test('no files → no inject', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inc-gate-'));
  assert.equal(shouldInjectIncidentP0(root), false);
});

test('handoff without ack → inject', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inc-gate-'));
  seed(root, { handoff: true });
  assert.equal(shouldInjectIncidentP0(root), true);
});

test('stale ack before handoff → still inject', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inc-gate-'));
  seed(root, { handoff: true, ackIso: '2026-08-13T10:19:32.468Z' });
  assert.equal(shouldInjectIncidentP0(root), true);
});

test('ack after handoff → silent', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inc-gate-'));
  seed(root, { handoff: true, trigger: true });
  seed(root, { ackIso: new Date(Date.now() + 1000).toISOString() });
  assert.equal(shouldInjectIncidentP0(root), false);
});

test('trigger-only without ack → inject', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inc-gate-'));
  seed(root, { trigger: true });
  assert.equal(shouldInjectIncidentP0(root), true);
});
