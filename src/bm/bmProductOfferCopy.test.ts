import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listBmProductContentKeys,
  listBmProductIncludedIds,
  listBmProductIncludedInIds,
  resolveBmProductOverlapNotes,
} from './bmProductOfferCopy';

const t = (key: string, params?: Record<string, string | number>) => {
  if (key === 'bmShop.overlap.includesAll') return `INCLUDES:${params?.packs ?? ''}`;
  if (key === 'bmShop.overlap.includedIn') return `INSIDE:${params?.packs ?? ''}`;
  if (key.startsWith('bmShop.product.') && key.endsWith('.title')) {
    return key.replace('bmShop.product.', '').replace('.title', '');
  }
  return key;
};

test('VIP Max는 Basic·Plus 혜택을 모두 포함한다', () => {
  const included = listBmProductIncludedIds('vip_max');
  assert.deepEqual([...included], ['vip_basic', 'vip_plus']);
  const notes = resolveBmProductOverlapNotes('vip_max', t);
  assert.ok(notes.some((n) => n.includes('vip_basic') && n.includes('vip_plus')));
});

test('VIP Basic은 상위 팩에 포함된다고 안내한다', () => {
  const parents = listBmProductIncludedInIds('vip_basic');
  assert.ok(parents.includes('vip_plus'));
  assert.ok(parents.includes('vip_max'));
  const notes = resolveBmProductOverlapNotes('vip_basic', t);
  assert.ok(notes.some((n) => n.startsWith('INSIDE:')));
});

test('보석팩은 포함 관계가 없어 중첩 안내를 내지 않는다', () => {
  assert.equal(listBmProductIncludedIds('gem_pack_small').length, 0);
  assert.equal(listBmProductIncludedInIds('gem_pack_small').length, 0);
  assert.deepEqual(resolveBmProductOverlapNotes('gem_pack_small', t), []);
});

test('VIP Plus 구성에 일일 보석·성장 가속이 있다', () => {
  const keys = listBmProductContentKeys('vip_plus');
  assert.ok(keys.includes('daily_gems'));
  assert.ok(keys.includes('growth_boost'));
});
