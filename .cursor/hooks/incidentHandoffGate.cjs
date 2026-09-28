'use strict';
/**
 * incident handoff / trigger 가 아직 미확인일 때만 P0 주입.
 * ack 시각 ≥ handoff·trigger mtime 이면 침묵.
 */
const fs = require('fs');
const path = require('path');

function resolveIncidentPaths(root) {
  return {
    handoff: path.join(root, 'tools/long-run-monitor/outbox/cursor-incident-handoff.md'),
    trigger: path.join(root, '.cursor/trigger-incident-auto-fix.json'),
    ack: path.join(root, 'tools/long-run-monitor/outbox/incident-handoff-acked-at.txt'),
  };
}

function isAckedAfter(ackPath, fileMtimeMs) {
  try {
    const ack = fs.readFileSync(ackPath, 'utf8').trim();
    const ackMs = Date.parse(ack);
    return Number.isFinite(ackMs) && ackMs >= fileMtimeMs;
  } catch {
    return false;
  }
}

function readTriggerMeta(triggerPath) {
  try {
    if (!fs.existsSync(triggerPath)) return null;
    return JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
  } catch {
    return null;
  }
}

/** true = 아직 P0 주입 */
function shouldInjectIncidentP0(root) {
  const p = resolveIncidentPaths(root);
  const handoffExists = fs.existsSync(p.handoff);
  const triggerExists = fs.existsSync(p.trigger);
  if (!handoffExists && !triggerExists) return false;

  let gateMtime = 0;
  if (handoffExists) gateMtime = Math.max(gateMtime, fs.statSync(p.handoff).mtimeMs);
  if (triggerExists) gateMtime = Math.max(gateMtime, fs.statSync(p.trigger).mtimeMs);
  if (isAckedAfter(p.ack, gateMtime)) return false;
  return true;
}

function readHandoffExcerpt(root, maxLen) {
  const p = resolveIncidentPaths(root);
  try {
    if (!fs.existsSync(p.handoff)) return '';
    return fs.readFileSync(p.handoff, 'utf8').slice(0, maxLen);
  } catch {
    return '';
  }
}

module.exports = {
  resolveIncidentPaths,
  isAckedAfter,
  readTriggerMeta,
  shouldInjectIncidentP0,
  readHandoffExcerpt,
};
