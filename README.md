# wtf-fantasy-stremio

WTF Fantasy Discovery - Automated dark, mature, visually rich fantasy: deep worldbuilding, varied magic systems, creatures and non-human races, kingdoms and factions, mythic strangeness and fantasy action.

**Manifest ID:** `com.github.wtffantasy.discovery`

## Catalog rows

- Full Watchlist
- 🔥 Past 24h Findings
- ⭐ Best Matches
- 🧬 DNA Match
- 🐉 Dark Epic Fantasy
- ✨ Magic Systems
- 🧝 Creatures & Races
- 🗿 Mythic / Strange
- ⚔️ High Fantasy Action
- 🏔️ Visually Spectacular

Each row is emitted for both `movie` and `series`, so Stremio shows 20 catalogs.

## Independence

This repository is self-contained. It has no runtime or build-time dependency on
any other WTF Discovery addon, on their GitHub Pages deployments, or on the
scaffold generator that created it. It validates, builds and deploys alone.

## The vendored engine

Everything in `scripts/` except `registry.mjs` and `known-ids.mjs` is vendored
verbatim from the canonical template and **must not be edited here**.
`test/engine-checksum.test.mjs` fails if one of those files changes locally.
Engine changes go into the template first, then get regenerated into every repo.

`registry.mjs` (this addon's frozen DNA vocabulary) and `known-ids.mjs` are
generated once from this addon's own profile and are owned by this repository.

## Commands

```bash
npm test              # full suite, production-state census last
npm run validate      # fail-closed validation of data/ against the profile
npm run build         # build site/ (manifest + catalog JSON)
```

## Reliability remake preparation

The research-packet publication architecture is prepared but dormant until a
coordinated cutover after the Thriller pilot gate. See
[publication cutover](docs/publication-cutover.md). The scheduled ChatGPT task
will stage only research packets; trusted-main GitHub workflows will validate,
score, reconcile immutable attempts and publish through protected App-owned
PRs. Pages keeps its existing hourly schedule and emits a deployment receipt.

Existing history, genre policy, catalog identities and dormant personalization
are preserved. Automatic private feedback interpretation and deterministic
learning remain mandatory later work; publication is not migration completion.
