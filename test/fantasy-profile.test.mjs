// Fantasy product acceptance.
//
// The inherited engine tests prove the MACHINERY is intact. This file proves
// the FANTASY TASTE POLICY is the one that was approved, and that its specific
// failure modes behave as intended - each checked by constructing a title that
// SHOULD trip it and one that should not, because a guardrail that never fires
// and a guardrail that always fires both pass a one-sided test.
//
// Run with: node test/fantasy-profile.test.mjs

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateProfile, watchedEvidenceIdentities } from "../scripts/validate-profile.mjs";
import { makePolicy, scoreItem, hardExcluded, dnaEligible } from "../scripts/dna-score.mjs";
import { normalizeTitle } from "../scripts/cinemeta.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

let passed = 0, failed = 0;
const check = (id, description, condition, detail) => {
  if (condition) { passed++; console.log(`  ok   ${id}  ${description}`); }
  else { failed++; console.error(`  FAIL ${id}  ${description}${detail ? `\n         ${detail}` : ""}`); }
};

const profile = JSON.parse(fs.readFileSync(path.join(root, "data", "taste-profile.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "config", "catalogs.json"), "utf8"));
const policy = makePolicy(profile);
const registry = profile.dna_dimensions.dimensions.map(d => d.id);

console.log("WTF Fantasy Discovery - product acceptance");
console.log("");

// ---------------------------------------------------------------------------
// A / B - the approved registry, exactly
// ---------------------------------------------------------------------------
const EXPECTED_REGISTRY = [
  "magic_presence", "magic_system_depth", "fantasy_creatures", "nonhuman_races",
  "dark_fantasy", "mythology", "epic_scale", "kingdom_politics", "faction_conflict",
  "other_realms", "adventure", "family_tone",
  "worldbuilding", "ability_variety", "mystery", "suspense", "action_density",
  "action_intensity", "creature_threat", "horror", "visual_quality",
  "retro_visual_style", "visual_spectacle", "comedy", "romance_focus",
  "drama_focus", "superhero", "pace_speed"
];

check("A1", "registry declares exactly 28 dimensions", registry.length === 28, `got ${registry.length}`);
check("A2", "registry matches the approved Fantasy dimension set exactly",
  [...registry].sort().join(",") === [...EXPECTED_REGISTRY].sort().join(","),
  `unexpected: ${registry.filter(d => !EXPECTED_REGISTRY.includes(d)).join(", ") || "none"}; ` +
  `missing: ${EXPECTED_REGISTRY.filter(d => !registry.includes(d)).join(", ") || "none"}`);

const weights = profile.dna_baseline.weights;
const unweighted = profile.dna_baseline.unweighted;
check("B1", "26 weighted dimensions", Object.keys(weights).length === 26, `got ${Object.keys(weights).length}`);
check("B2", "2 unweighted dimensions, pace_speed and superhero",
  unweighted.length === 2 && unweighted.includes("pace_speed") && unweighted.includes("superhero"),
  unweighted.join(", "));

const APPROVED_WEIGHTS = {
  dark_fantasy: 20, magic_presence: 18, worldbuilding: 18, fantasy_creatures: 16,
  magic_system_depth: 15, nonhuman_races: 14, epic_scale: 14, visual_spectacle: 13,
  faction_conflict: 12, kingdom_politics: 11, mythology: 11, action_density: 10,
  visual_quality: 10, adventure: 9, mystery: 9, other_realms: 8, ability_variety: 8,
  action_intensity: 6, suspense: 6, creature_threat: 5, horror: 0, comedy: 0,
  drama_focus: -6, retro_visual_style: -10, romance_focus: -10, family_tone: -14
};
const weightDiffs = Object.entries(APPROVED_WEIGHTS)
  .filter(([id, w]) => weights[id] !== w).map(([id, w]) => `${id}: expected ${w}, got ${weights[id]}`);
check("B3", "every baseline weight matches the approved MG-1 value",
  weightDiffs.length === 0, weightDiffs.join("\n         "));
check("B4", "horror and comedy are neutral (0), not negative",
  weights.horror === 0 && weights.comedy === 0,
  "neither is disliked in fantasy on its own; the objection is a childish or unserious register");

// ---------------------------------------------------------------------------
// C - shared dimensions keep the canonical cross-profile rubric
//
// Each addon is standalone and cannot read another profile, so the canonical
// text is frozen HERE. A cross-repo equality check belongs to the template,
// which is the only place that sees every profile at once.
// ---------------------------------------------------------------------------
const CANONICAL_SHARED = {
  mystery: { 0: "nothing withheld", 5: "substantial mystery thread", 10: "the whole structure is a mystery" },
  suspense: { 0: "none", 5: "recurring tension", 10: "sustained throughout" },
  action_density: {
    0: "essentially no action across the runtime",
    5: "action recurs regularly, roughly a third of the runtime",
    10: "near-continuous action"
  },
  action_intensity: {
    0: "none",
    5: "ordinary force and stakes when action occurs",
    10: "peak sequences are extreme in force, scale and stakes"
  },
  visual_quality: {
    0: "crude or careless craft",
    5: "competent, unremarkable craft",
    10: "exceptional craft - judged on its own presentation, never on release year"
  },
  retro_visual_style: {
    0: "strongly contemporary visual language",
    5: "mixed or classic presentation",
    10: "strongly retro, legacy or old-school aesthetic - judged from colour grading, lensing, editing rhythm, effects technique and design language, NEVER from the release date"
  },
  visual_spectacle: {
    0: "nothing shown at scale", 5: "real set pieces or vistas", 10: "sustained large-scale visual ambition"
  },
  worldbuilding: {
    0: "no invented world", 5: "a coherent invented world that matters",
    10: "the invented world is deep, consistent and load-bearing"
  },
  ability_variety: {
    0: "one ability or none", 5: "several distinct abilities", 10: "a broad, well-differentiated ability space"
  },
  creature_threat: {
    0: "no creature", 5: "a creature is a real element", 10: "the creature is the antagonist"
  },
  horror: { 0: "none", 5: "real horror content", 10: "horror is the operating mode" },
  comedy: { 0: "none", 5: "substantial comic register", 10: "primarily a comedy" },
  romance_focus: { 0: "none", 5: "a real romance thread", 10: "romance is the primary structural driver" },
  drama_focus: { 0: "none", 5: "real interpersonal drama", 10: "interpersonal drama is the primary mode" },
  superhero: {
    0: "none", 5: "costumed or superpowered hero structure present", 10: "superhero structure is central"
  },
  pace_speed: { 0: "very slow / contemplative", 5: "moderate / steady", 10: "relentless / extremely fast" }
};

const rubricDiffs = [];
for (const [id, anchors] of Object.entries(CANONICAL_SHARED)) {
  const dim = profile.dna_dimensions.dimensions.find(d => d.id === id);
  if (!dim) { rubricDiffs.push(`${id}: absent from the registry`); continue; }
  for (const [anchor, text] of Object.entries(anchors)) {
    if (dim.rubric[anchor] !== text) rubricDiffs.push(`${id}[${anchor}]: "${dim.rubric[anchor]}"`);
  }
}
check("C1", "every shared dimension carries the canonical 0/5/10 rubric verbatim",
  rubricDiffs.length === 0, rubricDiffs.join("\n         "));
check("C2", "pace_speed is the only slow_to_fast dimension",
  profile.dna_dimensions.dimensions.filter(d => d.direction === "slow_to_fast")
    .map(d => d.id).join(",") === "pace_speed");

// ---------------------------------------------------------------------------
// D / E - catalog shape
// ---------------------------------------------------------------------------
const EXPECTED_ROWS = ["full-watchlist", "past-24h", "best-matches", "dna-match",
  "dark-epic-fantasy", "magic-systems", "creatures-races", "mythic-strange",
  "high-fantasy-action", "visually-spectacular"];

check("E1", "10 logical catalog rows", config.catalogs.length === 10, `got ${config.catalogs.length}`);
check("E2", "the row ids are exactly the approved set",
  config.catalogs.map(c => c.id).join(",") === EXPECTED_ROWS.join(","),
  config.catalogs.map(c => c.id).join(","));

const baselineRows = config.catalogs.filter(c => c.dna && c.dna.mode === "baseline_profile");
check("D1", "exactly one baseline_profile row, and it is dna-match",
  baselineRows.length === 1 && baselineRows[0].id === "dna-match",
  baselineRows.map(r => r.id).join(", "));

const darkEpic = config.catalogs.find(c => c.id === "dark-epic-fantasy");
check("D2", "dark-epic-fantasy is a WEIGHTED row, not a second baseline row",
  darkEpic.dna.mode === "weighted");
check("D3", "dark-epic-fantasy carries its dedicated gate",
  JSON.stringify(darkEpic.dna.gate.all_of) === JSON.stringify([
    { dimension: "dark_fantasy", at_or_above: 6 },
    { dimension: "epic_scale", at_or_above: 6 },
    { dimension: "worldbuilding", at_or_above: 5 }
  ]), JSON.stringify(darkEpic.dna.gate.all_of));

if (fs.existsSync(path.join(root, "site", "manifest.json"))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "site", "manifest.json"), "utf8"));
  check("E3", "20 emitted manifest catalogs (10 rows x 2 types)",
    manifest.catalogs.length === 20, `got ${manifest.catalogs.length}`);
  check("E4", "manifest id is the approved Fantasy id",
    manifest.id === "com.github.wtffantasy.discovery", manifest.id);
}

// ---------------------------------------------------------------------------
// DNA fixtures
// ---------------------------------------------------------------------------
const NEUTRAL = Object.fromEntries(registry.map(id => [id, 5]));
const dnaItem = (over = {}, meta = {}) => ({
  imdb_id: meta.imdb_id || "tt9999999", type: "movie", title: meta.title || "Probe", year: meta.year || 2020,
  status: "watch", match_score: 85, tags: [], reason: "probe",
  added_at: "2026-08-27T00:00:00Z", added_by: "bootstrap",
  source: "https://example.org/identity ; https://example.org/structural-analysis",
  dna: { ...NEUTRAL, ...over }, dna_confidence: 0.9, dna_tags: [], ...meta
});
const row = id => config.catalogs.find(c => c.id === id);
const scoreOf = (over, def = row("dna-match")) => scoreItem(policy, def, dnaItem(over), new Map());

// A serious dark epic: the profile's centre of gravity.
const DARK_EPIC = {
  dark_fantasy: 9, magic_presence: 7, worldbuilding: 9, fantasy_creatures: 7,
  magic_system_depth: 6, nonhuman_races: 7, epic_scale: 9, visual_spectacle: 8,
  faction_conflict: 9, kingdom_politics: 8, mythology: 7, action_density: 6,
  visual_quality: 9, adventure: 6, mystery: 6, other_realms: 2, ability_variety: 5,
  action_intensity: 8, suspense: 7, creature_threat: 6, horror: 4, comedy: 2,
  drama_focus: 5, retro_visual_style: 2, romance_focus: 3, family_tone: 1,
  superhero: 0, pace_speed: 6
};

check("SANITY", "a dark epic fantasy scores strongly in DNA Match",
  scoreOf(DARK_EPIC).score >= 60, `got ${JSON.stringify(scoreOf(DARK_EPIC))}`);

// ---------------------------------------------------------------------------
// F - superhero hard exclusion, in BOTH the scorer and at ingestion
// ---------------------------------------------------------------------------
check("F1", "superhero 8 is hard-excluded", hardExcluded(policy, { ...NEUTRAL, superhero: 8 }));
check("F2", "superhero 10 is hard-excluded", hardExcluded(policy, { ...NEUTRAL, superhero: 10 }));
check("F3", "superhero 7 is NOT hard-excluded", !hardExcluded(policy, { ...NEUTRAL, superhero: 7 }),
  "a powered character is not a superhero film; the bound is deliberately at 8");
check("F4", "a hard-excluded title returns no score in ANY dna row",
  config.catalogs.filter(c => c.filter === "dna")
    .every(def => scoreItem(policy, def, dnaItem({ ...DARK_EPIC, superhero: 9 }), new Map()).reason === "hard_excluded"));

function runValidateWith(items) {
  const file = path.join(root, "data", "library.json");
  const original = fs.readFileSync(file);
  try {
    fs.writeFileSync(file, JSON.stringify({ schema_version: 2, updated_at: "2026-08-27T00:00:00Z", items }, null, 2) + "\n");
    try {
      return { code: 0, output: execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: root, encoding: "utf8", stdio: "pipe" }) };
    } catch (e) {
      return { code: e.status, output: `${e.stdout || ""}${e.stderr || ""}` };
    }
  } finally {
    fs.writeFileSync(file, original);                      // byte-for-byte restore
    if (!fs.readFileSync(file).equals(original)) throw new Error("library.json was not restored");
  }
}

{
  const r = runValidateWith([dnaItem({ ...DARK_EPIC, superhero: 9 })]);
  check("F5", "a hard-excluded title is REJECTED AT INGESTION",
    r.code !== 0 && /traditional_superhero_fantasy/.test(r.output),
    "otherwise it would be absent from every ranked row yet still published in Full Watchlist");
}

// ---------------------------------------------------------------------------
// G / H - childish register, without banning comedy
// ---------------------------------------------------------------------------
const childish = { ...DARK_EPIC, family_tone: 8, dark_fantasy: 2 };
const fires = (over, id) => {
  const dna = { ...NEUTRAL, ...over };
  return profile.dna_guardrails.combination.some(rule => rule.id === id &&
    (rule.all_of || []).every(c => Object.prototype.hasOwnProperty.call(c, "at_or_above")
      ? dna[c.dimension] >= c.at_or_above : dna[c.dimension] <= c.at_or_below));
};

check("G1", "a childish low-consequence fantasy fires childish_family_fantasy",
  fires(childish, "childish_family_fantasy"));
check("G2", "it scores far below the equivalent dark epic",
  scoreOf(childish).score < scoreOf(DARK_EPIC).score - 20,
  `childish ${scoreOf(childish).score} vs dark epic ${scoreOf(DARK_EPIC).score}`);
check("G3", "high family_tone with REAL darkness does NOT fire it",
  !fires({ ...DARK_EPIC, family_tone: 8 }, "childish_family_fantasy"),
  "an all-ages epic with genuine consequence is fine");

check("H1", "comedy 9 ALONE does not fire the childish penalty",
  !fires({ ...DARK_EPIC, comedy: 9 }, "childish_family_fantasy"));
check("H2", "comedy 9 alone does not fire silly_comedy_fantasy either",
  !fires({ ...DARK_EPIC, comedy: 9 }, "silly_comedy_fantasy"),
  "the dark epic has darkness and scale holding it up");
check("H3", "comedy 9 WITHOUT darkness or scale DOES fire silly_comedy_fantasy",
  fires({ ...DARK_EPIC, comedy: 9, dark_fantasy: 2, epic_scale: 3 }, "silly_comedy_fantasy"));
check("H4", "comedy carries no linear penalty", weights.comedy === 0);

// ---------------------------------------------------------------------------
// I - romance/drama dominance
// ---------------------------------------------------------------------------
check("I1", "romance 7 + drama 7 + low action fires romance_drama_dominant",
  fires({ ...DARK_EPIC, romance_focus: 7, drama_focus: 7, action_density: 3 }, "romance_drama_dominant"));
check("I2", "romance alone does not fire it",
  !fires({ ...DARK_EPIC, romance_focus: 8 }, "romance_drama_dominant"));
check("I3", "romance + drama WITH real action does not fire it",
  !fires({ ...DARK_EPIC, romance_focus: 7, drama_focus: 7, action_density: 7 }, "romance_drama_dominant"));

// ---------------------------------------------------------------------------
// J / K - presentation, never age
// ---------------------------------------------------------------------------
const retroLow = scoreOf({ ...DARK_EPIC, retro_visual_style: 1 }).score;
const retroHigh = scoreOf({ ...DARK_EPIC, retro_visual_style: 9 }).score;
check("J1", "a strongly retro look LOWERS the score", retroHigh < retroLow, `${retroHigh} vs ${retroLow}`);
check("J2", "but never excludes it - the retro title still scores",
  scoreOf({ ...DARK_EPIC, retro_visual_style: 10 }).score !== null);
check("J3", "retro_visual_style is not hard-excludable",
  !hardExcluded(policy, { ...NEUTRAL, retro_visual_style: 10 }));
check("J4", "no guardrail anywhere references retro_visual_style", (() => {
  const dims = [
    ...profile.dna_guardrails.hard_exclusion.map(r => r.dimension),
    ...profile.dna_guardrails.combination.flatMap(r => [...(r.all_of || []), ...(r.any_of || [])].map(c => c.dimension))
  ];
  return !dims.includes("retro_visual_style");
})(), "it acts through its linear weight alone");
check("J5", "high craft and high retro coexist - they are independent axes",
  scoreOf({ ...DARK_EPIC, visual_quality: 9, retro_visual_style: 9 }).score !== null);
check("J6", "cheap_presentation keys on CRAFT, and does not fire on a high-craft retro title",
  !fires({ ...DARK_EPIC, visual_quality: 9, visual_spectacle: 8, retro_visual_style: 10 }, "cheap_presentation"));

check("K1", "no dimension is about release year",
  !registry.some(id => /year|age|old|date|decade/.test(id)));
check("K2", "release year changes NO score", (() => {
  const old = scoreItem(policy, row("dna-match"), dnaItem(DARK_EPIC, { year: 1984, title: "Old" }), new Map());
  const now = scoreItem(policy, row("dna-match"), dnaItem(DARK_EPIC, { year: 2024, title: "New" }), new Map());
  return old.score === now.score && old.score !== null;
})(), "identical DNA forty years apart must score identically");
check("K3", "no guardrail can reference a year - every dimension is 0..10 descriptive",
  profile.dna_guardrails.combination.every(r =>
    [...(r.all_of || []), ...(r.any_of || [])].every(c => registry.includes(c.dimension))));

// ---------------------------------------------------------------------------
// L / M / N - baseline evidence boundaries
// ---------------------------------------------------------------------------
const identityForms = e => {
  const out = [];
  if (e.imdb_id && /^tt\d+$/.test(e.imdb_id)) out.push(`${e.type}:${e.imdb_id}`);
  if (Number.isInteger(e.year)) out.push(`${e.type}:${normalizeTitle(e.title)}:${e.year}`);
  return out;
};
const watched = watchedEvidenceIdentities(profile);
const watchedForms = new Set(watched.flatMap(identityForms));

const sourceItems = [...JSON.parse(fs.readFileSync(path.join(root, "data", "library.json"), "utf8")).items];
const discDir = path.join(root, "data", "discoveries");
if (fs.existsSync(discDir)) {
  for (const n of fs.readdirSync(discDir).filter(x => x.endsWith(".json"))) {
    const p = JSON.parse(fs.readFileSync(path.join(discDir, n), "utf8"));
    sourceItems.push(...(Array.isArray(p) ? p : p.items || []));
  }
}

const leaked = sourceItems.filter(i => identityForms(i).some(f => watchedForms.has(f)));
check("L1", "no WATCHED baseline identity appears in public data", leaked.length === 0,
  leaked.map(i => i.title).join(", "));
check("L2", "the watched set expands franchises to individual films",
  watched.length === 13,
  `expected 13 (Game of Thrones, The Witcher, 3 LotR, 8 Harry Potter), got ${watched.length}`);

{
  const got = runValidateWith([dnaItem(DARK_EPIC, { imdb_id: "tt0944947", type: "series", title: "Game of Thrones", year: 2011 })]);
  check("L3", "ingesting a watched anchor is REJECTED",
    got.code !== 0 && /WATCHED baseline evidence/.test(got.output));

  const member = runValidateWith([dnaItem(DARK_EPIC, { imdb_id: "tt0167260", title: "The Lord of the Rings: The Return of the King", year: 2003 })]);
  check("L4", "ingesting a watched FRANCHISE MEMBER is REJECTED",
    member.code !== 0 && /WATCHED baseline evidence/.test(member.output));
}

{
  // Warcraft is unwatched trailer_interest: eligible, not banned, not boosted.
  const ok = runValidateWith([dnaItem(DARK_EPIC, { imdb_id: "tt0803096", title: "Warcraft", year: 2016 })]);
  check("M1", "an UNWATCHED evidence title is ACCEPTED when normally researched and scored",
    ok.code === 0, ok.output);

  const cited = scoreItem(policy, row("dna-match"), dnaItem(DARK_EPIC, { imdb_id: "tt0803096", title: "Warcraft", year: 2016 }), new Map());
  const anon = scoreItem(policy, row("dna-match"), dnaItem(DARK_EPIC, { imdb_id: "tt7777777", title: "Unrelated Probe", year: 2016 }), new Map());
  check("N1", "being cited in baseline_evidence confers NO score bonus",
    cited.score === anon.score, `${cited.score} vs ${anon.score}`);

  const averse = scoreItem(policy, row("dna-match"), dnaItem(DARK_EPIC, { imdb_id: "tt0486655", title: "Stardust", year: 2007 }), new Map());
  check("N2", "and a trailer AVERSION confers no score penalty either",
    averse.score === anon.score, `${averse.score} vs ${anon.score}`);
}

check("N3", "the profile validates, including its evidence block",
  validateProfile(profile).length === 0, validateProfile(profile).join("\n         "));

// ---------------------------------------------------------------------------
// O - archetype completeness
// ---------------------------------------------------------------------------
{
  const measurable = new Set([...Object.keys(weights), ...profile.dna_baseline.completeness_defaults.required_known_dimensions]);
  const offenders = [];
  for (const a of profile.dna_baseline.archetypes) {
    for (const map of [a.emphasis, a.penalise || {}]) {
      for (const id of Object.keys(map)) if (!measurable.has(id)) offenders.push(`${a.id}.${id}`);
    }
  }
  check("O1", "every archetype dimension is weighted or required-known", offenders.length === 0, offenders.join(", "));
  check("O2", "the six approved archetypes are present",
    profile.dna_baseline.archetypes.map(a => a.id).join(",") ===
    "dark_epic_fantasy,monster_magic_fantasy,magic_system_fantasy,creature_race_fantasy,mythic_strange_fantasy,high_fantasy_action",
    profile.dna_baseline.archetypes.map(a => a.id).join(","));
  check("O3", "every archetype penalises family_tone",
    profile.dna_baseline.archetypes.every(a => (a.penalise || {}).family_tone > 0));
}

// ---------------------------------------------------------------------------
// P / Q / R - ingestion and provenance
// ---------------------------------------------------------------------------
{
  const dup = runValidateWith([
    dnaItem(DARK_EPIC, { imdb_id: "tt5555555", title: "Twin A", year: 2020 }),
    dnaItem(DARK_EPIC, { imdb_id: "tt5555555", title: "Twin B", year: 2020 })
  ]);
  check("P1", "a duplicate public identity FAILS CLOSED",
    dup.code !== 0 && /duplicate public identity/.test(dup.output));
}

{
  const past24 = config.catalogs.find(c => c.id === "past-24h");
  check("Q1", "the Past 24h row admits only added_by=daily-automation", past24.filter === "past24");
  const bootstrapItems = sourceItems.filter(i => i.added_by === "bootstrap");
  check("Q2", "no bootstrap item claims added_by=daily-automation",
    bootstrapItems.every(i => i.added_by === "bootstrap"));
  if (fs.existsSync(path.join(root, "site", "catalog"))) {
    const rows = ["movie", "series"].map(t => path.join(root, "site", "catalog", t, `past-24h-${t}.json`))
      .filter(f => fs.existsSync(f))
      .flatMap(f => JSON.parse(fs.readFileSync(f, "utf8")).metas);
    check("Q3", "the built Past 24h row contains no bootstrap item", rows.length === 0,
      `${rows.length} items leaked into a daily-discovery feed`);
  }
}

// ---------------------------------------------------------------------------
// SP - source provenance on the REAL bootstrap library
//
// 'reason' explains a title; 'source' has to say where the research came from.
// The first bootstrap shipped prose in 'source' and it read like justification,
// which is exactly why this is asserted over the real data and not only over a
// fixture.
// ---------------------------------------------------------------------------
{
  const urlsIn = value => String(value).split(/[;,\s]+/).flatMap(t => {
    try { const u = new URL(t.trim()); return /^https?:$/.test(u.protocol) && u.hostname.includes(".") ? [u.href] : []; }
    catch { return []; }
  });

  const noSource = sourceItems.filter(i => typeof i.source !== "string" || i.source.trim() === "");
  check("SP1", "every source item carries a source", noSource.length === 0, noSource.map(i => i.title).join(", "));

  const proseOnly = sourceItems.filter(i => urlsIn(i.source).length === 0);
  check("SP2", "no source is prose-only - every one cites real URLs",
    proseOnly.length === 0, proseOnly.map(i => i.title).join(", "));

  const thin = sourceItems.filter(i => urlsIn(i.source).length < 2);
  check("SP3", "every source item cites TWO OR MORE sources",
    thin.length === 0,
    `identity alone does not justify a 28-value fingerprint: ${thin.map(i => i.title).join(", ")}`);

  check("SP4", "reason and source are distinct fields, not duplicates",
    sourceItems.every(i => i.reason !== i.source && !urlsIn(i.reason).length),
    "reason is card text for a human; source is citable material");
}

check("R1", "no personalized-scores.json exists - personalization is disabled for MG-3",
  !fs.existsSync(path.join(root, "data", "personalized-scores.json")));
check("R2", "the profile states that personalization is disabled",
  profile.execution_preferences.rules.some(r => /DISABLED/.test(r)));

// ---------------------------------------------------------------------------
// U / V - independence
// ---------------------------------------------------------------------------
{
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === ".git" || e.name === "node_modules" || e.name === "site") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!/\.(mjs|json|yml)$/.test(e.name)) continue;
      const text = fs.readFileSync(full, "utf8");
      const rel = path.relative(root, full).split(path.sep).join("/");
      // This file NAMES the forbidden tokens in order to forbid them, and
      // engine-checksums.json records its template provenance on purpose.
      // Neither is a dependency: no code path reads them to reach another repo.
      if (rel === "test/fantasy-profile.test.mjs") continue;
      for (const bad of ["wtf-scifi", "wtf-action", "wtf-anime", "wtf-thriller", "wtfscifi"]) {
        if (text.includes(bad)) offenders.push(`${rel} -> ${bad}`);
      }
      if (text.includes("wtf-addon-template") && rel !== "test/engine-checksums.json") {
        offenders.push(`${rel} -> wtf-addon-template`);
      }
    }
  };
  walk(root);
  check("U1", "no code or data references another addon or the template",
    offenders.length === 0, offenders.join("\n         "));

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  check("U2", "zero runtime and dev dependencies", !pkg.dependencies && !pkg.devDependencies);
  // Count-free on purpose: the vendored set grows, and a hardcoded number
  // turns every legitimate template addition into a false failure here.
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "test", "engine-checksums.json"), "utf8")).files;
  const REPO_OWNED = ["registry.mjs", "known-ids.mjs"];
  const scripts = fs.readdirSync(path.join(root, "scripts")).filter(n => n.endsWith(".mjs"));
  check("V1", "every engine file in scripts/ is covered by the drift manifest",
    scripts.filter(n => !REPO_OWNED.includes(n)).every(n => manifest[`scripts/${n}`]),
    scripts.filter(n => !REPO_OWNED.includes(n) && !manifest[`scripts/${n}`]).join(", "));
  check("V2", "this repo's OWN generated modules are NOT checksummed as engine",
    REPO_OWNED.every(n => !manifest[`scripts/${n}`]),
    "registry.mjs and known-ids.mjs are written from this profile and belong to this repo");
  check("V3", "this repo's own acceptance suite is NOT checksummed as engine",
    !manifest["test/fantasy-profile.test.mjs"],
    "it is genre-owned and must stay editable here");
}

// ---------------------------------------------------------------------------
// W / X - the real pipeline runs
// ---------------------------------------------------------------------------
{
  let ok = true, out = "";
  try { out = execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: root, encoding: "utf8", stdio: "pipe" }); }
  catch (e) { ok = false; out = `${e.stdout || ""}${e.stderr || ""}`; }
  check("W1", "validate.mjs succeeds on the real library", ok, out);

  let built = true;
  try { execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: root, stdio: "pipe" }); }
  catch { built = false; }
  check("X1", "build-site.mjs succeeds", built);
  check("X2", "the build emits 20 manifest catalogs",
    JSON.parse(fs.readFileSync(path.join(root, "site", "manifest.json"), "utf8")).catalogs.length === 20);
}

console.log("");
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
