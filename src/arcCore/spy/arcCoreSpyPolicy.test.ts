/**
 * npx tsx --test src/arcCore/spy/arcCoreSpyPolicy.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invalidateArcCoreSpyPolicyCache, resolveArcCoreSpyPolicy } from './arcCoreSpyPolicy';

test('resolveArcCoreSpyPolicy returns the same object until invalidate', () => {
  invalidateArcCoreSpyPolicyCache();
  const a = resolveArcCoreSpyPolicy();
  const b = resolveArcCoreSpyPolicy();
  assert.equal(a, b);
  invalidateArcCoreSpyPolicyCache();
  const c = resolveArcCoreSpyPolicy();
  assert.notEqual(a, c);
  assert.equal(a.enabled, c.enabled);
});
