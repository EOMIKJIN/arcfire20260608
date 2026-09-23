const PAY_RE = /크레딧|결제|구매|환불|원화|\d+\s*원|credit|purchase|₩|\$/i;
const ITEM_ID_RE = /\b[a-z]{2,12}_[a-z0-9_]{4,}\b/;
/** 출력 검역 `SHADOW_LEAK_RE`와 동일 — 짝 실닉 대조는 L8 금지하므로 HOLD */
const SHADOW_RE = /아크코어\s*근원체|shadow\s*nick|리빌|짝 유저|섀도우 닉|shadow nickname|your pair is/i;
const PII_RE = /@|http|\d{3}-\d{3,4}-\d{4}/i;

export const STELLA_LIFE_ANCHOR_MAX = 40;

export function sanitizeStellaLifeAnchor(text: string): string | null {
  const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return null;
  if (PAY_RE.test(raw) || ITEM_ID_RE.test(raw) || SHADOW_RE.test(raw) || PII_RE.test(raw)) {
    return null;
  }
  const sliced = raw.slice(0, STELLA_LIFE_ANCHOR_MAX).trim();
  return sliced || null;
}
