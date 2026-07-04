import json
import sqlite3
import sys

DB = sys.argv[1] if len(sys.argv) > 1 else r"tools/long-run-monitor/logs/_rkstorage_pull.db"
RED = [
    "omega_hub",
    "sirius_border",
    "perseus_memorial",
    "crimson_base",
    "dark_haven",
    "blood_station",
    "abyss_gate",
    "nightfall_citadel",
    "core_prime",
]

c = sqlite3.connect(DB)
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print("tables:", tables)

if "catalystLocalStorage" not in tables:
    sys.exit(1)

rows = c.execute(
    "SELECT key, length(value) FROM catalystLocalStorage "
    "WHERE key LIKE '%arcfire%' OR key LIKE '%planet%' OR key LIKE '%vault%' OR key LIKE '%clan%'"
).fetchall()
print("keys:", rows)

for key in [
    "arcfire_planet_core_runtime_v1",
    "arcfire_arc_core_planet_dev_budget_v1",
    "arcfire_arc_core_vault_v1",
    "arcfire_faction_vault_arc_core_v1",
]:
    row = c.execute("SELECT value FROM catalystLocalStorage WHERE key = ?", (key,)).fetchone()
    if row:
        print(f"\n=== {key} (len={len(row[0])}) ===")
        print(row[0][:1500])

row = c.execute(
    "SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_planet_core_runtime_v1'"
).fetchone()
if not row:
    # fuzzy
    fuzzy = c.execute(
        "SELECT key FROM catalystLocalStorage WHERE key LIKE '%planet_core%'"
    ).fetchall()
    print("planet_core fuzzy:", fuzzy)
    sys.exit(0)

data = json.loads(row[0])
by = data.get("byPlanetId") or data.get("state", {}).get("byPlanetId") or data
print("\n=== RED planet slots ===")
for pid in RED:
    slot = by.get(pid) if isinstance(by, dict) else None
    if not slot:
        print(pid, "NO_SLOT")
        continue
    out = {"planetId": pid}
    for k, v in slot.items():
        if k in ("core", "updatedAt"):
            if k == "core" and isinstance(v, dict):
                out["core"] = {x: v.get(x) for x in ("resource", "population", "defense", "technology", "environment")}
            continue
        if isinstance(v, dict) and ("level" in v or "installed" in v or "isInstalling" in v or "isUpgrading" in v):
            out[k] = {
                kk: v[kk]
                for kk in ("level", "installed", "isInstalling", "isUpgrading", "jobEndsAtMs", "fundingSource")
                if kk in v
            }
    print(json.dumps(out, ensure_ascii=False))

c.close()
