# Unique NPC portrait generation (batch agent)

You generate **canonical game portraits**. Do not edit repo source/CSV.

## Input

Read ONLY your assigned JSON: `d:\arcfire20260607\tools\content-tables\_portrait-batch-N.json`

Each row: `id`, `name`, `en`, `rank`, `faction`, `profile` (Korean appearance bible).

## Tool

1. `GetDynamicTools` namespace `cursor` toolName `GenerateImage`
2. `CallDynamicTool` namespace `cursor` toolName `GenerateImage`

Call **6–8 GenerateImage in parallel**, then the next wave, until every row is done.

## Arguments

- `filename`: `{id}.png` exactly (e.g. `npc_cpt_vector.png`, `Player_pilot.png`)
- `aspect_ratio`: `1:1`
- `reference_image_paths`:
  - **ink/cel only** — do **not** use `bar_att_char016.png` as a captain reference (it copies the neon lounge + shot glasses)
  - style/interior: `d:\arcfire20260607\assets\images\npc\noname_char005.png` (grey corridor) or `noname_char010.png` (bridge)
  - if Stellium duty (federation / federation_military / border_watch and profile is 근무/감청/네이비): also `noname_char005.png`
  - if Stellium dress (흰 정복 / 제독 정복 / 백색): also `noname_char010.png`
  - background-swap pass: first ref = **existing** `assets/images/npc/{id}.png` (keep that exact person)

## Description (English)

Start with this block, then add face/outfit from `profile` (first 2 sentences: age, sex, hair, clothes, scars):

```
Square 1:1 waist-up 3/4 anime portrait. Sunrise / Hathaway's Flash cel. Match first reference ink outlines, flat cel shadows, even lighting, full-bleed painted finished interior. No letterbox, no vignette, no text, no letters, no nameplate, no photorealism, no 3D.
```

Rules:

- Unique face per id. Do not clone the reference faces **or other captains**.
- **Lookalike lock (2026-09-26 · 대표님)**: each id must read as a **different person**. Maximize hats, glasses, earrings, necklaces, jewelry, tattoos, hairstyle, and hair/eye/skin color. No two navy officers with the same sleek black bob or the same short black crew cut.
- Stellium uniform: **clone 005 or 010 cut + navy/white color**, change face + hair + accessories. Do not invent a new Stellium uniform color.
- Unique outfits (miner, pirate crimson, coat): follow profile, not 005/010 colors invented as new Stellium uniforms.
- **Bar-background lock (2026-09-26 · 대표님)**: magenta-cyan neon lounge / shot-glass row = **bar-girl KEEP only** (`bar_att_char006`–`016`). Regular captains, `Player_pilot`, enemies, seeds use ordinary interiors (quarters, ship, corridor, computer room).
- **Bar-owner exception (2026-09-26 · 대표님)**: `npc_cpt_bar_ret_*` wears a clean formal bartender / proprietor suit (waistcoat, dress shirt, bow/necktie — never Stellium military). Background is a **planet-unique bar lounge** (counter, bottle shelves, seating). Do not clone the KEEP neon lounge. Keep the existing face.
- **Humanoid lock (2026-09-26 · 대표님)**: every captain is a **natural human face** (eyes + nose + mouth + skin). No full robot, blank mask, faceless helmet, energy creature, extra eyes, green/grey alien skin, tendril hair, clock-mannequin, mesh hologram body.
- If the table setting is machine / robot / ancient / creator (`npc_cpt_vector`, `npc_cpt_ai_robot_default`, genesis / abyss / eternity / core ancients): **hybrid only** — human face and hair first; mechanical accent **minimized** (tiny collar embroidery, faint temple mark, cloth glyph). Never a robot bust or silhouette.
- `Player_pilot`: anonymous scarred survivor **human** pilot, **androgynous** face (setting has no gender), not matching Stella or the player-3 templates.
- **Gender lock (2026-09-26 · 대표님)**: `profileKo` says `여성`/`그녀`/`여자` → clearly a woman. `남성`/`남자` → clearly a man. No gender word, or `개체`/ancient watcher without 여/남 → **androgynous** (hard to tell). Do not treat `그녀` that refers to a *different* person in the same paragraph as this captain's sex (Jex ≠ Nila).
- No written words on clothes/patches.

## Skip

If `C:\Users\eomsp\.cursor\projects\d-arcfire20260607\assets\{id}.png` already exists, skip that id.

## Do not

- Edit `src/`, `tables/`, `docs/`
- Generate bar-girl or overwrite `stella_aris` / `noname_char` / `bar_att`

## Return

Plain list: `ok=<n> fail=<ids> skipped=<ids>`
