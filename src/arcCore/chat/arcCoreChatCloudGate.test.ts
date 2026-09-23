import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_CORE_CHAT_BILLING_MODE,
  ARC_CORE_CHAT_CLOUD_LIVE,
  ARC_CORE_CHAT_CLOUD_VENDOR,
  ARC_CORE_CHAT_AWS_TURN_URL,
  ARC_CORE_CHAT_FREE_TIER_TURN_URL,
  isArcCoreChatCloudLive,
  isArcCoreChatMeteredVendorLiveBlocked,
  isArcCoreChatZeroBill,
  resolveArcCoreChatCloudTurnUrl,
} from './arcCoreChatCloudGate';

test('ZERO_BILL — free_tier LIVE with Groq Lambda URL', () => {
  assert.equal(ARC_CORE_CHAT_BILLING_MODE, 'zero_bill');
  assert.equal(isArcCoreChatZeroBill(), true);
  assert.equal(ARC_CORE_CHAT_CLOUD_VENDOR, 'free_tier');
  assert.equal(ARC_CORE_CHAT_CLOUD_LIVE, true);
  assert.equal(isArcCoreChatCloudLive(), true);
  assert.equal(ARC_CORE_CHAT_AWS_TURN_URL, '');
  assert.match(ARC_CORE_CHAT_FREE_TIER_TURN_URL, /^https:\/\/.+\.lambda-url\.ap-northeast-2\.on\.aws\/?$/);
  assert.equal(resolveArcCoreChatCloudTurnUrl(), ARC_CORE_CHAT_FREE_TIER_TURN_URL.trim());
  assert.equal(isArcCoreChatMeteredVendorLiveBlocked(), false);
});
