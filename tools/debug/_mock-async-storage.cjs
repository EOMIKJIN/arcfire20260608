// 실제 RKStorage.db 덤프를 백엔드로 쓰는 AsyncStorage 모크 — .default 이중래핑 없이
// module.exports 자체가 구현체라 esbuild(tsx) CJS interop이 정상적으로 default import를 매핑함.
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'long-run-monitor', 'logs', '_RKStorage.db');
const db = new Database(dbPath, { readonly: true });
const rows = db.prepare('SELECT * FROM catalystLocalStorage').all();
const store = new Map();
for (const row of rows) {
  const cols = Object.keys(row);
  const keyCol = cols.includes('key') ? 'key' : cols[0];
  const valCol = cols.includes('value') ? 'value' : cols[1];
  store.set(row[keyCol], row[valCol]);
}
db.close();

console.error(`[mock-async-storage] loaded ${store.size} keys from ${dbPath}`);

module.exports = {
  async getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setItem(key, value) {
    store.set(key, value);
  },
  async removeItem(key) {
    store.delete(key);
  },
  async clear() {
    store.clear();
  },
  async getAllKeys() {
    return [...store.keys()];
  },
  async multiGet(keys) {
    return keys.map((k) => [k, store.has(k) ? store.get(k) : null]);
  },
  async multiSet(pairs) {
    for (const [k, v] of pairs) store.set(k, v);
  },
  async multiRemove(keys) {
    for (const k of keys) store.delete(k);
  },
  async mergeItem(key, value) {
    store.set(key, value);
  },
};
