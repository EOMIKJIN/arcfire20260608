import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SKILLS_FROM_CSV } from '../../data/generated';
import { resolveSkillRuntimeStatus } from './skillRuntimeStatus';

test('wired trade and combat skills are marked complete', () => {
  assert.equal(resolveSkillRuntimeStatus('negotiation_pro'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('tax_exemption'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('armor_piercing'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('reactive_armor'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('warp_stabilizer'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('double_shot'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('monopoly_master'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('wingman'), 'complete');
  assert.equal(resolveSkillRuntimeStatus('star_pathfinder'), 'complete');
});

test('wormhole_generator stays partial (no permanent portal)', () => {
  assert.equal(resolveSkillRuntimeStatus('wormhole_generator'), 'partial');
});

test('every csv skill has a status', () => {
  for (const id of Object.keys(SKILLS_FROM_CSV)) {
    const status = resolveSkillRuntimeStatus(id);
    assert.ok(status === 'complete' || status === 'partial' || status === 'undeveloped');
  }
});
