// ZERO_BILL (2026-09-08): 1인 테스트에서도 종량 $1이라도 부가되면 안 됨.
// 제공자 무료 티어 한도까지는 OK. Bedrock/Vertex 종량은 금지.
// 정본: tools/kim-team-lead/reports/ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md
// Free-tier: Groq Free + Lambda 중계 (2026-09-09 LIVE)
// 요금 감사: npm run audit:arc-core-chat-billing

/** 종량 청구 0 강제. metered 는 대표님 「종량 허용」 명시 전 사용 금지. */
export type ArcCoreChatBillingMode = 'zero_bill' | 'metered';

export const ARC_CORE_CHAT_BILLING_MODE: ArcCoreChatBillingMode = 'zero_bill';

/** free_tier TURN_URL + Groq Free Lambda — 인게임 NL. */
export const ARC_CORE_CHAT_CLOUD_LIVE = true;

/**
 * aws = Bedrock 턴(종량) — zero_bill 에서는 LIVE 금지.
 * firebase = Vertex 옵션(종량 위험) — zero_bill 에서는 LIVE 금지.
 * free_tier = Groq Free 한도 — $0 NL 본선.
 */
export type ArcCoreChatCloudVendor = 'aws' | 'firebase' | 'free_tier';

export const ARC_CORE_CHAT_CLOUD_VENDOR: ArcCoreChatCloudVendor = 'free_tier';

/** Bedrock Function URL. zero_bill 에서 비움 유지. */
export const ARC_CORE_CHAT_AWS_TURN_URL = '';

/** Groq Free Lambda Function URL (stack arcfire-arc-core-chat · 2026-09-09). */
export const ARC_CORE_CHAT_FREE_TIER_TURN_URL =
  'https://2m3bcczmjq4u3bp334alda6j6a0drdpq.lambda-url.ap-northeast-2.on.aws/';

/** 벤더가 firebase일 때만. free_tier/aws 본선이면 이 URL로 호출하지 않는다. */
export const ARC_CORE_CHAT_FIREBASE_TURN_URL =
  'https://asia-southeast1-arcfire-49d69.cloudfunctions.net/arcCoreChatTurn';

export function isArcCoreChatCloudLive(): boolean {
  return ARC_CORE_CHAT_CLOUD_LIVE;
}

export function isArcCoreChatZeroBill(): boolean {
  return ARC_CORE_CHAT_BILLING_MODE === 'zero_bill';
}

/** zero_bill 에서 종량 벤더 LIVE는 허용하지 않는다. */
export function isArcCoreChatMeteredVendorLiveBlocked(): boolean {
  if (!isArcCoreChatZeroBill()) return false;
  if (!ARC_CORE_CHAT_CLOUD_LIVE) return false;
  return ARC_CORE_CHAT_CLOUD_VENDOR === 'aws' || ARC_CORE_CHAT_CLOUD_VENDOR === 'firebase';
}

export function resolveArcCoreChatCloudTurnUrl(): string {
  if (isArcCoreChatMeteredVendorLiveBlocked()) {
    return '';
  }
  if (ARC_CORE_CHAT_CLOUD_VENDOR === 'firebase') {
    return ARC_CORE_CHAT_FIREBASE_TURN_URL;
  }
  if (ARC_CORE_CHAT_CLOUD_VENDOR === 'free_tier') {
    return ARC_CORE_CHAT_FREE_TIER_TURN_URL.trim();
  }
  return ARC_CORE_CHAT_AWS_TURN_URL.trim();
}
