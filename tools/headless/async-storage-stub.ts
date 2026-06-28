/**
 * Headless AsyncStorage — planet-economy audit · CI 전용 (RN 네이티브 미사용)
 */
function createMemoryAsyncStorage() {
  const map = new Map<string, string>();
  return {
    getItem: async (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: async (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: async (key: string) => {
      map.delete(key);
    },
    multiGet: async (keys: string[]) =>
      keys.map((k) => [k, map.get(k) ?? null] as [string, string | null]),
    multiSet: async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) map.set(k, v);
    },
    multiRemove: async (keys: string[]) => {
      for (const k of keys) map.delete(k);
    },
    getAllKeys: async () => [...map.keys()],
    clear: async () => map.clear(),
  };
}

const storage = createMemoryAsyncStorage();
export default storage;
