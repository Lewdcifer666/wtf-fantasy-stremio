// GENERATED ONCE AT SCAFFOLD TIME - this repo's frozen DNA vocabulary.
//
// This is the one file the generator writes from the profile rather than
// copying verbatim, and it is what lets validate-profile.mjs stay genre-neutral
// and vendored. The guard it feeds is deliberately strict: data/taste-profile.json
// must declare EXACTLY these dimensions and EXACTLY these tags, no more and no
// fewer, so a typo becomes a loud failure instead of quiet new metadata.
//
// Changing this list is a schema decision. It means a registry version bump, a
// migration for every already-enriched record, and a review of every consumer -
// never a casual edit.

export const CANONICAL_DIMENSIONS = [
  "magic_presence",
  "magic_system_depth",
  "fantasy_creatures",
  "nonhuman_races",
  "dark_fantasy",
  "mythology",
  "epic_scale",
  "kingdom_politics",
  "faction_conflict",
  "other_realms",
  "adventure",
  "family_tone",
  "worldbuilding",
  "ability_variety",
  "mystery",
  "suspense",
  "action_density",
  "action_intensity",
  "creature_threat",
  "horror",
  "visual_quality",
  "retro_visual_style",
  "visual_spectacle",
  "comedy",
  "romance_focus",
  "drama_focus",
  "superhero",
  "pace_speed"
];

export const CANONICAL_DNA_TAGS = [
  "medieval",
  "royal_court",
  "war_campaign",
  "quest",
  "prophecy",
  "dragon",
  "undead",
  "witchcraft",
  "necromancy",
  "fae",
  "elves_dwarves",
  "beast",
  "monster_hunter",
  "portal_world",
  "ancient_ruins",
  "curse",
  "sword_sorcery",
  "folk_myth",
  "wilderness",
  "urban_fantasy"
];

// The single deliberate exception to the shared absent..dominant scale:
// pace_speed measures slow..fast. Exactly one dimension may be slow_to_fast.
export const SLOW_TO_FAST_DIMENSION = "pace_speed";
