/**
 * 무역소 tradeable item_defs — name_en / description_en / featureDescription_en 전수 보정.
 * - EMPTY·한글 혼입 name_en 강제 교체
 * - ownership_* → planets.csv nameEn + " Ownership Deed"
 * - tg_* / eq_* / clan_disband_order 영문 번역 테이블
 * build:content-tables 내 patch-item-defs-en.mjs 이후 실행 권장(멱등·덮어쓰기).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ITEM_CSV = path.join(__dirname, '../../tables/content/item_defs.csv');
const PLANET_CSV = path.join(__dirname, '../../tables/content/planets.csv');
const hangul = /[\uAC00-\uD7A3]/;

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function escapeCsv(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function needsEnFix(en) {
  const e = String(en ?? '').trim();
  return !e || hangul.test(e);
}

function loadPlanetNameEn() {
  const raw = fs.readFileSync(PLANET_CSV, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const ix = Object.fromEntries(header.map((h, i) => [h, i]));
  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const id = String(cols[ix.id] ?? '').trim();
    if (!id) continue;
    const nameEn = String(cols[ix.nameEn] ?? cols[ix.name_en] ?? '').trim();
    if (nameEn && !hangul.test(nameEn)) map.set(id, nameEn);
  }
  return map;
}

const OWNERSHIP_DESC_EN =
  'Planet ownership deed (non-resale). Purchasing assigns your clan to hold this planet.';
const OWNERSHIP_FEAT_EN =
  'Planet ownership deed (non-resale). Buying it lets your clan occupy this planet.';

/** id → [nameEn, descriptionEn, featureDescriptionEn] */
const EN_BY_ID = {
  clan_disband_order: [
    'Clan Disband Order',
    'Immediately disbands your current clan and returns occupied planets to neutral.',
    'Immediately disbands your current clan and returns occupied planets to neutral.',
  ],

  // —— Trade goods tg_001..tg_100 ——
  tg_001: ['Synthetic Protein Blocks', 'Standard rations — the basic energy source for all lifeforms.', 'Standard rations — the basic energy source for all lifeforms.'],
  tg_002: ['Hydroponic Vitamins', 'Prevents nutrient deficiency on long voyages.', 'Prevents nutrient deficiency on long voyages.'],
  tg_003: ['Cultured Liquid Meat', 'Premium food stock with highly concentrated protein.', 'Premium food stock with highly concentrated protein.'],
  tg_004: ['Concentrated Nutrient Capsules', 'Ultra-compact combat rations for special units.', 'Ultra-compact combat rations for special units.'],
  tg_005: ['Organic Grain', 'Natural grain grown in uncontaminated soil.', 'Natural grain grown in uncontaminated soil.'],
  tg_006: ['Atmosphere Scrub Moss', 'Special engineered moss that converts CO2 to oxygen.', 'Special engineered moss that converts CO2 to oxygen.'],
  tg_007: ['Freshwater Concentrate', 'Pure water supply after precision filtration.', 'Pure water supply after precision filtration.'],
  tg_008: ['Hybrid Seeds', 'Improved seeds that can germinate in extreme environments.', 'Improved seeds that can germinate in extreme environments.'],
  tg_009: ['Synthetic Fermentation Enzyme', 'Catalyst used in chemical processes and food refining.', 'Catalyst used in chemical processes and food refining.'],
  tg_010: ['Medical Bandages', 'Basic hemostatic and protective gear made of nanofibers.', 'Basic hemostatic and protective gear made of nanofibers.'],
  tg_011: ['Detox Nano Syrup', 'Liquid medicine for toxic gas and contaminant poisoning.', 'Liquid medicine for toxic gas and contaminant poisoning.'],
  tg_012: ['Photosynthesis Booster', 'Chemical that aids early plant growth during terraforming.', 'Chemical that aids early plant growth during terraforming.'],
  tg_013: ['Bio Fertilizer', 'High-concentration soil nutrient rich in microbes.', 'High-concentration soil nutrient rich in microbes.'],
  tg_014: ['Artificial Blood Packs', 'Synthetic blood compatible with all species.', 'Synthetic blood compatible with all species.'],
  tg_015: ['Cell Regeneration Ointment', 'High-performance medicine that aids cellular repair.', 'High-performance medicine that aids cellular repair.'],
  tg_016: ['Synthetic Vintage Wine', 'Premium synthetic liquor recreating classic Earth wines.', 'Premium synthetic liquor recreating classic Earth wines.'],
  tg_017: ['Neural Stimulant Perfume', 'Fragrance that calms the nervous system on contact.', 'Fragrance that calms the nervous system on contact.'],
  tg_018: ['Nano Silk Fabric', 'High-strength clothing material with carbon nanotubes.', 'High-strength clothing material with carbon nanotubes.'],
  tg_019: ['Hologram Sculpture', '4D art ornament using light interference.', '4D art ornament using light interference.'],
  tg_020: ['Alien Plant Specimen', 'Rare academic plant samples from outer worlds.', 'Rare academic plant samples from outer worlds.'],
  tg_021: ['Gravity-Stable Tea', 'Premium tea whose flavor stays stable under gravity shifts.', 'Premium tea whose flavor stays stable under gravity shifts.'],
  tg_022: ['Virtual Experience Memory', 'Entertainment that projects another’s experience into synapses.', 'Entertainment that projects another’s experience into synapses.'],
  tg_023: ['High-Purity Crystal', 'Raw crystal for industrial lasers and ornamentation.', 'Raw crystal for industrial lasers and ornamentation.'],
  tg_024: ['Liquid Metal Craft', 'Tech-dense artwork that reshapes in real time.', 'Tech-dense artwork that reshapes in real time.'],
  tg_025: ['Deep-Sea Pearl Powder', 'Cosmetic powder harvested from deep aquatic worlds.', 'Cosmetic powder harvested from deep aquatic worlds.'],
  tg_026: ['Endangered Species Clone Egg', 'Embryo sample capable of restoring extinct species.', 'Embryo sample capable of restoring extinct species.'],
  tg_027: ['Ancient Fossil Replica', 'Replica of ancient life with archaeological value.', 'Replica of ancient life with archaeological value.'],
  tg_028: ['Superconducting String Instrument', 'Clear-toned instrument using zero-resistance conductors.', 'Clear-toned instrument using zero-resistance conductors.'],
  tg_029: ['AI Pet', 'Robot companion whose personality forms through learning.', 'Robot companion whose personality forms through learning.'],
  tg_030: ['Concentrated Spice', 'Seasoning that transforms food flavor with tiny doses.', 'Seasoning that transforms food flavor with tiny doses.'],
  tg_031: ['Refined Carbon Panels', 'Light, durable hull plating and structural material.', 'Light, durable hull plating and structural material.'],
  tg_032: ['Reinforced Polymer Alloy', 'Multi-purpose industrial material resistant to acid and corrosion.', 'Multi-purpose industrial material resistant to acid and corrosion.'],
  tg_033: ['Superconducting Wire', 'Cable that transmits power with near-zero energy loss.', 'Cable that transmits power with near-zero energy loss.'],
  tg_034: ['High-Strength Ceramics', 'Tiles that withstand re-entry heat.', 'Tiles that withstand re-entry heat.'],
  tg_035: ['Liquid Nitrogen Coolant', 'General-purpose coolant that prevents machinery overheating.', 'General-purpose coolant that prevents machinery overheating.'],
  tg_036: ['Nano Welding Rods', 'Repair tool enabling molecular-scale bonding.', 'Repair tool enabling molecular-scale bonding.'],
  tg_037: ['Precision Hydraulic Cylinder', 'Core drive shaft for large robots and mechanical arms.', 'Core drive shaft for large robots and mechanical arms.'],
  tg_038: ['Heat-Resistant Glass Fiber', 'Transparent insulation for extreme temperature swings.', 'Transparent insulation for extreme temperature swings.'],
  tg_039: ['Titanium Reinforcement', 'Auxiliary frame that stiffens hull structure.', 'Auxiliary frame that stiffens hull structure.'],
  tg_040: ['Diamond Coating', 'Surface treatment that reduces cutting-tool wear.', 'Surface treatment that reduces cutting-tool wear.'],
  tg_041: ['Aerospace Aluminum Plate', 'Essential lightweight plate for atmosphere craft.', 'Essential lightweight plate for atmosphere craft.'],
  tg_042: ['Radiation Shield Brick', 'Shielding material for reactors and hazard zones.', 'Shielding material for reactors and hazard zones.'],
  tg_043: ['Industrial Carbon Tubes', 'Micro pipes for fine-process machine skeletons.', 'Micro pipes for fine-process machine skeletons.'],
  tg_044: ['High-Pressure Steam Valve', 'Pressure-control part for large power facilities.', 'Pressure-control part for large power facilities.'],
  tg_045: ['Anti-Corrosion Paint', 'Hull protection against saline or acidic atmospheres.', 'Hull protection against saline or acidic atmospheres.'],
  tg_046: ['Quantum Processor', 'Main computer chip for FTL-class computation.', 'Main computer chip for FTL-class computation.'],
  tg_047: ['Photonic Circuit Board', 'High-efficiency board that moves data with light.', 'High-efficiency board that moves data with light.'],
  tg_048: ['Neural Control Module', 'Module syncing pilot brainwaves with the ship.', 'Module syncing pilot brainwaves with the ship.'],
  tg_049: ['High-Density Memory', 'Hi-tech storage for vast datasets.', 'Hi-tech storage for vast datasets.'],
  tg_050: ['Servo Motor Controller', 'Controls robot-arm motion to 0.1 mm precision.', 'Controls robot-arm motion to 0.1 mm precision.'],
  tg_051: ['Electromagnetic Field Generator', 'Energy shield core that softens physical impacts.', 'Energy shield core that softens physical impacts.'],
  tg_052: ['Satellite Comm Router', 'Ultra-wide relay covering an entire star system.', 'Ultra-wide relay covering an entire star system.'],
  tg_053: ['Laser Lens', 'Focusing optic for precision machining and weapons.', 'Focusing optic for precision machining and weapons.'],
  tg_054: ['Biometric Scanner', 'Security gear that reads DNA and iris data.', 'Security gear that reads DNA and iris data.'],
  tg_055: ['Weather Sensor', 'Detector that forecasts atmospheric flow and ion storms.', 'Detector that forecasts atmospheric flow and ion storms.'],
  tg_056: ['Autonav Chipset', 'Autonomous unit that computes optimal jump routes.', 'Autonomous unit that computes optimal jump routes.'],
  tg_057: ['Optical Sensor Array', 'Survey optics with maximized light intake.', 'Survey optics with maximized light intake.'],
  tg_058: ['Wireless Power Transmitter', 'Beam transmitter that supplies power without cables.', 'Beam transmitter that supplies power without cables.'],
  tg_059: ['Nano Assembler', 'Tool that rearranges molecules to build small parts.', 'Tool that rearranges molecules to build small parts.'],
  tg_060: ['Crypto Compute Unit', 'Security part that generates or breaks quantum ciphers.', 'Security part that generates or breaks quantum ciphers.'],
  tg_061: ['Fusion Cell', 'Battery powering ships and small bases.', 'Battery powering ships and small bases.'],
  tg_062: ['Antimatter Container', 'Isolation vessel for high-risk antimatter fuel.', 'Isolation vessel for high-risk antimatter fuel.'],
  tg_063: ['Concentrated Hydrogen', 'Hydrogen pack used as chemical and fusion assist fuel.', 'Hydrogen pack used as chemical and fusion assist fuel.'],
  tg_064: ['Ion Propellant', 'High-efficiency fuel for long-range ion engines.', 'High-efficiency fuel for long-range ion engines.'],
  tg_065: ['Refined Deuterium', 'Enriched fuel feedstock for large fusion reactors.', 'Enriched fuel feedstock for large fusion reactors.'],
  tg_066: ['Graphene Battery', 'Portable charge pack with extreme energy density.', 'Portable charge pack with extreme energy density.'],
  tg_067: ['Plasma Core', 'Industrial power source holding high-pressure energy.', 'Industrial power source holding high-pressure energy.'],
  tg_068: ['Cryogenic Oxygen', 'Liquid oxygen for breathing and engine combustion.', 'Liquid oxygen for breathing and engine combustion.'],
  tg_069: ['Solar Panels', 'Collectors that supply auxiliary power to outer bases.', 'Collectors that supply auxiliary power to outer bases.'],
  tg_070: ['Radioisotope Fuel', 'Nuclear feedstock for long-stable power output.', 'Nuclear feedstock for long-stable power output.'],
  tg_071: ['Wireless Charging Station', 'Large platform that auto-charges vehicles and robots.', 'Large platform that auto-charges vehicles and robots.'],
  tg_072: ['Solid Oxide Cell', 'Auxiliary power that can start instantly in emergencies.', 'Auxiliary power that can start instantly in emergencies.'],
  tg_073: ['Power Adapter', 'Converter matching power standards between planets.', 'Converter matching power standards between planets.'],
  tg_074: ['Ultra-High Capacitor', 'Device that dumps large energy in a short burst.', 'Device that dumps large energy in a short burst.'],
  tg_075: ['Semiconductor Rectifier', 'Power component that forces one-way energy flow.', 'Power component that forces one-way energy flow.'],
  tg_076: ['Atmosphere Scrubber', 'Large module purifying air on uninhabitable worlds.', 'Large module purifying air on uninhabitable worlds.'],
  tg_077: ['Soil Neutralizer Canister', 'Mass-dispersal charge that alters surface chemistry.', 'Mass-dispersal charge that alters surface chemistry.'],
  tg_078: ['Gravity Generator', 'Device that creates Earth-like artificial gravity.', 'Device that creates Earth-like artificial gravity.'],
  tg_079: ['Acceleration Rail', 'Electromagnetic induction rail that accelerates railgun rounds.', 'Electromagnetic induction rail that accelerates railgun rounds.'],
  tg_080: ['Ship Armor Plate', 'High-strength composite titanium armor against enemy fire.', 'High-strength composite titanium armor against enemy fire.'],
  tg_081: ['Guided Missile', 'Precision surface-to-air/surface-to-surface strike weapon.', 'Precision surface-to-air/surface-to-surface strike weapon.'],
  tg_082: ['Shield Belt', 'Personal barrier protecting the wearer from projectiles.', 'Personal barrier protecting the wearer from projectiles.'],
  tg_083: ['Comm Encryptor', 'Encryptor that protects military secrets from interception.', 'Encryptor that protects military secrets from interception.'],
  tg_084: ['Tactical Drone Frame', 'Flight drone with auto-track and attack functions.', 'Flight drone with auto-track and attack functions.'],
  tg_085: ['Plasma Rounds', 'High-density charge rounds consumed by energy weapons.', 'High-density charge rounds consumed by energy weapons.'],
  tg_086: ['Powered Exoskeleton', 'Suit that boosts body strength for heavy loads.', 'Suit that boosts body strength for heavy loads.'],
  tg_087: ['Laser Oscillator', 'Beam oscillator module powering large ship guns.', 'Beam oscillator module powering large ship guns.'],
  tg_088: ['ECM Device', 'Electronic warfare unit that jams radar and missile guidance.', 'Electronic warfare unit that jams radar and missile guidance.'],
  tg_089: ['Space Mine', 'Weapon planted on routes to deny approach.', 'Weapon planted on routes to deny approach.'],
  tg_090: ['Portable Nuke', 'Compact bomb with enough yield to destroy a planetary base.', 'Compact bomb with enough yield to destroy a planetary base.'],
  tg_091: ['Alien Relic Fragment', 'Unidentified material shard left by an unknown civilization.', 'Unidentified material shard left by an unknown civilization.'],
  tg_092: ['Planetary Map Data', 'Detailed terrain and resource data for unexplored zones.', 'Detailed terrain and resource data for unexplored zones.'],
  tg_093: ['Black Market Key', 'Key granting access to illegal hubs or secured zones.', 'Key granting access to illegal hubs or secured zones.'],
  tg_094: ['Gene Blueprint', 'Blueprint for gene editing and culturing a species.', 'Blueprint for gene editing and culturing a species.'],
  tg_095: ['Corporate Secret Data', 'Leaked data useful in corporate disputes.', 'Leaked data useful in corporate disputes.'],
  tg_096: ['Compressed Waste Block', 'Industrial waste block with recycling value.', 'Industrial waste block with recycling value.'],
  tg_097: ['Warp Core Prototype', 'Next-gen drive engine not yet proven stable.', 'Next-gen drive engine not yet proven stable.'],
  tg_098: ['Solid Processed Oxygen', 'Solid breathing medium easier to store than gas.', 'Solid breathing medium easier to store than gas.'],
  tg_099: ['Repair Nano Solution', 'Liquid that seeks and seals micro hull cracks.', 'Liquid that seeks and seals micro hull cracks.'],
  tg_100: ['Prototype Chip', 'Rare experimental circuit of unknown performance.', 'Rare experimental circuit of unknown performance.'],
};

/** equipment family base → [nameEn without tier, descriptionEn] */
const EQ_FAMILY = {
  prop_ion_booster: ['Ion Acceleration Booster', 'Boosts maneuver response via thruster nozzle acceleration.'],
  prop_fusion_core: ['Fusion Core', 'Improves power efficiency to free equipment power budget.'],
  prop_vector_thruster: ['Vector Thruster', 'Supports fine attitude control and rapid acceleration.'],
  def_molecular_armor: ['Molecular Armor Plate', 'Disperses kinetic impact to reduce hull damage.'],
  def_shield_amp: ['Shield Amplifier', 'Assists shield capacity and recharge efficiency.'],
  def_ablative_plate: ['Ablative Armor', 'Sacrificial impact layer that softens sudden damage.'],
  sens_long_scan: ['Long-Range Scanner', 'Expands enemy detection range before engagement.'],
  sens_secure_comms: ['Secure Comms Module', 'Assists data-link stability and tactical sharing.'],
  sens_passive_array: ['Passive Sensor', 'Supports low-emission stealth detection.'],
  ew_ecm_jammer: ['ECM Jammer', 'Jams enemy guidance and lock-on.'],
  ew_tac_datalink: ['Tactical Data Link', 'Strengthens information sharing in allied combat.'],
  ew_decoy_launcher: ['Decoy Launcher', 'Lures and disperses missile tracking.'],
  sup_nano_repair: ['Nano Repair Drones', 'Gradually repairs hull and system damage in combat.'],
  sup_fire_control: ['Fire Suppression System', 'Quickly suppresses internal fires and overheating.'],
  sup_hull_patch: ['Hull Patch Bay', 'Quickly restores durability after heavy fighting.'],
  nav_ai_assist: ['Nav Assist Unit', 'Supports auto-evasion and course correction.'],
  nav_tac_processor: ['Tactical Compute Processor', 'Accelerates engagement decisions and fire schedules.'],
  nav_jump_calc: ['Warp Nav Calculator', 'Assists long-range route calc and jump entry stability.'],
  mining_drone: ['Mining Drone', 'Improves orbital mining efficiency.'],
};

function resolveEqTriple(id) {
  const m = /^eq_(.+)_([1-9]\d*)$/.exec(id);
  if (!m) return null;
  const family = m[1];
  const tier = m[2];
  const base = EQ_FAMILY[family];
  if (!base) return null;
  return [`${base[0]} ${tier}`, base[1], base[1]];
}

function main() {
  const planetEn = loadPlanetNameEn();
  const raw = fs.readFileSync(ITEM_CSV, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
  if (lines.length < 2) throw new Error('item_defs.csv empty');

  const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const idIdx = header.indexOf('id');
  const nameEnIdx = header.indexOf('name_en');
  const descEnIdx = header.indexOf('description_en');
  const featEnIdx = header.indexOf('featureDescription_en');
  if (idIdx < 0 || nameEnIdx < 0 || descEnIdx < 0 || featEnIdx < 0) {
    throw new Error('item_defs.csv missing name_en/description_en/featureDescription_en columns');
  }

  let patched = 0;
  const missing = [];
  const outLines = [header.map(escapeCsv).join(',')];

  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    if (!cols[idIdx]?.trim()) continue;
    while (cols.length < header.length) cols.push('');

    const id = cols[idIdx].trim();
    let triple = EN_BY_ID[id] ?? null;

    if (!triple && id.startsWith('ownership_')) {
      const planetId = id.slice('ownership_'.length);
      const pEn = planetEn.get(planetId);
      if (pEn) {
        triple = [`${pEn} Ownership Deed`, OWNERSHIP_DESC_EN, OWNERSHIP_FEAT_EN];
      }
    }
    if (!triple && id.startsWith('eq_')) {
      triple = resolveEqTriple(id);
    }

    const curName = cols[nameEnIdx] ?? '';
    const curDesc = cols[descEnIdx] ?? '';
    const curFeat = cols[featEnIdx] ?? '';
    const needsName = needsEnFix(curName);
    const needsDesc = needsEnFix(curDesc);
    const needsFeat = needsEnFix(curFeat);

    if (triple && (needsName || needsDesc || needsFeat)) {
      if (needsName) cols[nameEnIdx] = triple[0];
      if (needsDesc) cols[descEnIdx] = triple[1];
      if (needsFeat) cols[featEnIdx] = triple[2];
      patched += 1;
    } else if ((needsName || needsDesc || needsFeat) && !triple) {
      // 이미 영문이 있으면 스킵. 보정 필요한데 맵 없음만 보고.
      if (needsName) missing.push(id);
    }

    outLines.push(cols.map(escapeCsv).join(','));
  }

  fs.writeFileSync(ITEM_CSV, `${outLines.join('\n')}\n`, 'utf8');
  console.log(`patched rows=${patched} path=${ITEM_CSV}`);
  if (missing.length) {
    console.error('MISSING EN MAP', missing);
    process.exitCode = 1;
  }
}

main();
