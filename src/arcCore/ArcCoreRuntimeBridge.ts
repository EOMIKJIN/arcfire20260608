/**
 * 디버그·원격 JS 콘솔에서 리빌드 없이 명령을 내릴 수 있도록 전역에 붙인다.
 * 예: `global.__arcCoreDispatch({ type: 'npc_gather_planet', planetId: 'arcadia_prime' })`
 *
 * 릴리스 번들에는 노출하지 않는다.
 */
import { dispatchArcCoreCommand, type ArcCoreCommand } from './ArcCoreCommandBus';

const GLOBAL_KEY = '__arcCoreDispatch' as const;

export function attachArcCoreRuntimeCommandBridge(): () => void {
  if (!__DEV__) {
    return () => {};
  }
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: typeof dispatchArcCoreCommand };
  g[GLOBAL_KEY] = (cmd: ArcCoreCommand) => {
    dispatchArcCoreCommand({
      ...cmd,
      meta: { origin: 'dev_runtime_bridge', ...cmd.meta },
    });
  };
  return () => {
    delete g[GLOBAL_KEY];
  };
}
