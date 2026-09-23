// Callable fetch — 네이티브 Functions 모듈 없이 Auth 토큰만. 8초·실패 스킵.

import { getIdToken } from '@react-native-firebase/auth';
import {
  ensureFirebaseAnonymousAuth,
  getFirebaseAuth,
} from '../../firebase/firebaseAnonymousAuth';
import {
  ARC_CORE_CHAT_CLOUD_TIMEOUT_MS,
  type ArcCoreAgentPack,
} from './arcCoreAgentPack';
import { isArcCoreChatCloudLive, resolveArcCoreChatCloudTurnUrl } from './arcCoreChatCloudGate';
import {
  isArcCoreChatCloudHardFailReason,
  isArcCoreChatFreeTierExhaustedReason,
  parseCloudArcCoreChatReply,
  readArcCoreChatCloudTurnResult,
  type CloudArcCoreChatReply,
} from './arcCoreChatCloudResult';
import { trySerializeArcCoreChatCloudBody } from './arcCoreChatPackBudget';
import {
  isArcCoreChatCloudSkipped,
  markArcCoreChatCloudHardSkip,
  markArcCoreChatCloudTransientSkip,
  resetArcCoreChatCloudSkip,
} from './arcCoreChatCloudSkip';

const AUTH_WAIT_MS = 2000;

function isNodeTestRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.env?.NODE_TEST_CONTEXT);
}

export { isArcCoreChatCloudSkipped, resetArcCoreChatCloudSkip };

export type { CloudArcCoreChatReply };

export type CloudArcCoreChatAttempt =
  | { status: 'ok'; reply: CloudArcCoreChatReply }
  | { status: 'free_tier_exhausted' }
  | { status: 'unavailable' };

async function getChatIdToken(): Promise<string | null> {
  try {
    const existing = getFirebaseAuth().currentUser;
    if (existing) return await getIdToken(existing);
    const uid = await Promise.race([
      ensureFirebaseAnonymousAuth(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), AUTH_WAIT_MS);
      }),
    ]);
    if (!uid) return null;
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return await getIdToken(user);
  } catch {
    return null;
  }
}

export async function tryCompleteCloudArcCoreChatReply(
  pack: ArcCoreAgentPack,
): Promise<CloudArcCoreChatAttempt> {
  if (!isArcCoreChatCloudLive()) return { status: 'unavailable' };
  if (isNodeTestRuntime()) return { status: 'unavailable' };
  if (isArcCoreChatCloudSkipped()) return { status: 'unavailable' };

  const cloudUrl = resolveArcCoreChatCloudTurnUrl();
  if (!cloudUrl) return { status: 'unavailable' };

  const body = trySerializeArcCoreChatCloudBody(pack);
  if (!body) return { status: 'unavailable' };

  const token = await getChatIdToken();
  if (!token) return { status: 'unavailable' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ARC_CORE_CHAT_CLOUD_TIMEOUT_MS);
  try {
    const res = await fetch(cloudUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      signal: controller.signal,
    });
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      markArcCoreChatCloudHardSkip();
      return { status: 'unavailable' };
    }
    if (res.status === 429) {
      markArcCoreChatCloudTransientSkip();
      return { status: 'free_tier_exhausted' };
    }
    if (!res.ok) return { status: 'unavailable' };
    const json: unknown = await res.json();
    const parsed = parseCloudArcCoreChatReply(json);
    if (parsed) return { status: 'ok', reply: parsed };

    const result = readArcCoreChatCloudTurnResult(json);
    if (result?.fallback && isArcCoreChatFreeTierExhaustedReason(result.reason)) {
      markArcCoreChatCloudTransientSkip();
      return { status: 'free_tier_exhausted' };
    }
    if (result?.fallback && isArcCoreChatCloudHardFailReason(result.reason)) {
      markArcCoreChatCloudHardSkip();
    }
    return { status: 'unavailable' };
  } catch {
    markArcCoreChatCloudTransientSkip();
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
