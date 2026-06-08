/**
 * 부팅 경로 전용: Promise가 네트워크/네이티브에서 오래 걸릴 때 무한 대기하지 않도록 상한을 둔다.
 */
export async function withBootTimeout<T>(
  label: string,
  ms: number,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  let tid: ReturnType<typeof setTimeout> | undefined;
  try {
    const work = run();
    const timeout = new Promise<T>((_, rej) => {
      tid = setTimeout(() => rej(new Error(`boot_timeout:${label}`)), ms);
    });
    return await Promise.race([work, timeout]);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('boot_timeout:')) {
      console.warn(`[boot] ${label}: ${ms}ms 초과 — 폴백으로 진행`);
    } else {
      console.warn(`[boot] ${label}:`, e);
    }
    return fallback;
  } finally {
    if (tid) clearTimeout(tid);
  }
}
