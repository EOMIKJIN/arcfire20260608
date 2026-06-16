/**
 * 원격(Firestore · Firebase HTTP) 접속 전용 5초 상한.
 *
 * 적용 대상: 클라우드 복구, 닉네임 중복 조회, Firestore 쓰기 등 **네트워크 I/O**
 * 적용 금지: CSV·로컬 스토어·에셋 프리로드 등 **인게임 데이터 준비/처리**
 *
 * 실측으로 안정 응답 시간이 검증되면 `REMOTE_NETWORK_TIMEOUT_MS`만 조정한다.
 */
export const REMOTE_NETWORK_TIMEOUT_MS = 5000;

/** @deprecated 원격 전용 — `REMOTE_NETWORK_TIMEOUT_MS` */
export const SESSION_CONNECT_MAX_MS = REMOTE_NETWORK_TIMEOUT_MS;

export class RemoteNetworkTimeoutError extends Error {
  readonly label: string;

  constructor(label: string) {
    super(`remote_network_timeout:${label}`);
    this.name = 'RemoteNetworkTimeoutError';
    this.label = label;
  }
}

/** @deprecated `RemoteNetworkTimeoutError` */
export class SessionLoadingTimeoutError extends RemoteNetworkTimeoutError {}

export function isRemoteNetworkTimeoutError(e: unknown): e is RemoteNetworkTimeoutError {
  return e instanceof RemoteNetworkTimeoutError;
}

/** @deprecated `isRemoteNetworkTimeoutError` */
export function isSessionLoadingTimeoutError(e: unknown): e is RemoteNetworkTimeoutError {
  return isRemoteNetworkTimeoutError(e);
}

/** Firestore/원격 Promise에만 5초 상한 — 초과 시 reject */
export async function withRemoteNetworkTimeout<T>(
  label: string,
  run: () => Promise<T>,
  ms: number = REMOTE_NETWORK_TIMEOUT_MS,
): Promise<T> {
  let tid: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(),
      new Promise<T>((_, rej) => {
        tid = setTimeout(() => rej(new RemoteNetworkTimeoutError(label)), ms);
      }),
    ]);
  } finally {
    if (tid) clearTimeout(tid);
  }
}

/** @deprecated 인게임 프리로드에 쓰지 말 것 — `withRemoteNetworkTimeout` */
export const withSessionLoadingTimeout = withRemoteNetworkTimeout;

export const REMOTE_NETWORK_TIMEOUT_ALERT = {
  title: '접속 시간 초과',
  message:
    '서버 연결이 5초를 넘겼습니다.\n네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
} as const;

/** @deprecated `REMOTE_NETWORK_TIMEOUT_ALERT` */
export const SESSION_LOADING_TIMEOUT_ALERT = REMOTE_NETWORK_TIMEOUT_ALERT;

export const SESSION_CLOUD_RESTORE_FAIL_ALERT = {
  title: '클라우드 복구 실패',
  message: '저장 데이터를 불러오지 못했습니다.\n네트워크를 확인한 뒤 다시 시도해 주세요.',
} as const;
