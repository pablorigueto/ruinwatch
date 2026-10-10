# RuinWatch — website

The official website of **RuinWatch**, a free Diablo III server built on the *Rites of Sanctuary*
patch (2.7.5) with the full Altar of Rites and Ethereal Weapons. Live at
**[ruinwatch.com](https://ruinwatch.com)**.

What makes this site different from other Diablo III tools: every piece of game data — items,
legendary powers, set bonuses, skills, runes, passives, gems, the Altar of Rites — is **generated
from the game files of the exact client version the server runs**. Retail Diablo III received
balance changes after 2.7.5, so numbers taken from public databases do not match what RuinWatch
players see in game. Here they do.

## Game version

| | |
|---|---|
| Patch | **2.7.5** — *Rites of Sanctuary* |
| Season | **Season 28** |
| Season feature | **Altar of Rites** (30 seals) + **Ethereal Weapons** |

The whole site is pinned to this version: item ids, legendary powers and their ranges, set bonuses,
skill and rune values, gem tables, the Altar of Rites seals and costs, and the preset builds.
Items reworked in later patches (for example the `P76_` versions of Vigilante Belt, Cluckeye and
Akkhan's Leniency) are shown as they exist in 2.7.5.

---

## Table of contents

- [Game version](#game-version)

- [Features](#features)
  - [Build planner](#build-planner)
  - [Builds](#builds)
  - [Item Codex](#item-codex)
  - [Classes](#classes)
  - [Kadala gamble odds](#kadala-gamble-odds)
  - [Merchants and cosmetics](#merchants-and-cosmetics)
  - [Home page](#home-page)
  - [Languages, SEO and analytics](#languages-seo-and-analytics)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Game data pipeline](#game-data-pipeline)
- [Preset builds](#preset-builds)
- [Project structure](#project-structure)
- [Testing and quality](#testing-and-quality)
- [Credits and disclaimer](#credits-and-disclaimer)
- [License](#license)

---

## Features

### Build planner

`/planner` — a full Diablo III character planner.

- **Paperdoll** — the in-game equipment doll with all 13 slots, per class and gender.
- **Item editor** — pick any item allowed for the class and slot, choose its tier
  (rare / legendary / ancient / primal), roll every affix inside its real range, socket normal gems
  (by color and rank) or legendary gems (by level), set the legendary power value and Caldesann's
  augment. Items that exist in several patch versions are marked with a **Current** badge.
- **Ethereal weapons** — choose the extra class weapon legendary power and the extra class passive the
  Ethereal rolls (both random in game).
- **Item tooltips** — rolled affixes, legendary power, set bonuses (active pieces highlighted) and
  augment, laid out like the in-game card.
- **Kanai's Cube** — weapon, armor and jewelry powers, filtered by class and by cube slot.
- **Skills** — 6 active skills with runes and 4 passives, with full tooltips (cost, cooldown,
  damage) generated from the game files.
- **Paragon** — Core, Offense, Defense and Utility, with the real per-point values and caps.
- **Altar of Rites** — the interactive 30-seal tree (26 minor seals, 3 potions and the Final Seal)
  with prerequisites, every seal's effect, and the **sacrifice cost** of each seal: the items and
  materials it asks for, based on how many seals are already open, plus the total shopping list.
- **Character sheet** — DPS, toughness and recovery calculated like the in-game inventory screen,
  plus a stat summary and toggleable damage buffs (legendary gems, sets, class buffs).
- **Load a preset** — pick a category, tier and build from the [Builds](#builds) list.
- **Share and save** — every build is encoded in the URL (`#b=…`; presets use a clean
  `?build=<id>`), and can be **exported and imported as a JSON file** — no account or server
  needed. Import also accepts the preset build files from `public/planner/builds/`.

### Builds

`/builds` — a curated build list per class, each opening directly in the planner:

- **Solo Pushing** and **Support**, ranked S to F. Builds named *Ethereal …* are original builds designed
  from the 2.7.5 data around the Ethereal weapon's extra class weapon legendary power and extra class
  passive (in the planner you pick which roll the build is looking for).
- **Speed Farm** — fast farming templates grouped by goal: **T16 Farm** and **GR Speeds**.

Builds target the 2.7.5 game version: any item whose power was reworked in a later patch was
replaced or the build was swapped for a Season 28 equivalent. Each build links to the guide it is
based on.

### Item Codex

`/items` and `/items/<slug>` — every item in the game: armor, weapons, jewelry, gems, potions,
crafting materials and more. Grouped by category and rarity, with search and filters. Each item
page shows its icon, base stats, fixed and random affixes, legendary power, set bonuses, flavor
text and related items. The Codex is audited against the game files so powers, set bonuses and
ranges match the server's version.

### Classes

`/classes` and `/classes/<class>` — the seven classes (Barbarian, Crusader, Demon Hunter, Monk,
Necromancer, Witch Doctor, Wizard): role, resource, playstyle and the full list of skills, runes and
passives with tooltips.

### Kadala gamble odds

`/kadala` — Blood Shard gamble odds for every item of every class: cost, drop weight, chance per
gamble, average shards to get the item and shards needed for an 80% chance. Includes a toggle for the
Altar's *Pattern* seal (double legendary chance from Kadala) and an input for the shards you have,
showing the expected drops.

### Merchants and cosmetics

- `/myriam` — Myriam the Mystic: enchanting, transmogrification and dyes.
- `/shen` — Covetous Shen the Jeweler: combining gems, forging jewelry and removing gems.
- `/cosmetics` — how players unlock wings, pets, pennants and portraits on the server.

### Home page

`/` — the server presentation: hero, story, features, live stats and how to join (Discord).

### Languages, SEO and analytics

- **7 languages** for the site interface: English, Português, Español, Français, 한국어, Русский,
  中文. Game terms (item, skill and rune names) stay in English, as in the game client.
- **SEO** — per-route title, description, Open Graph, Twitter card and JSON-LD; a post-build
  prerender step writes static HTML for the main routes so link previews (Discord, WhatsApp, X…) show
  the right card; `sitemap.xml` lists every page, build and item.
- **Analytics** — Google Analytics page views tracked on every client-side route change.

---

## Tech stack

| Area | Tools |
|---|---|
| App | Vite 5, React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui (Radix), lucide-react icons |
| Data and routing | TanStack Query, React Router |
| i18n and SEO | i18next / react-i18next, react-helmet-async |
| Tests and lint | Vitest, Testing Library, ESLint |
| Game data tools | Node.js scripts reading the game's binary files (`casc-tools/`) |

It is a **static site**: there is no backend. All game data is shipped as JSON under `public/` and
loaded on demand.

---

## Getting started

Requires **Node.js 20 or newer**.

```bash
npm install
npm run dev          # http://localhost:8081
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Generates the sitemap, builds for production and prerenders the main routes (`dist/`) |
| `npm run preview` | Serves the production build locally |
| `npm test` | Runs the test suite once (`npm run test:watch` to keep watching) |
| `npm run lint` | ESLint |

The output in `dist/` can be served by any static host; `public/_redirects` routes every path to the
single-page app.

---

## Game data pipeline

The JSON files in `public/` are **already generated and committed**. You only need this section to
regenerate them.

| Command | Generates | From |
|---|---|---|
| `npm run build:skills` | `public/skills/skills.json` — skill, rune and passive tooltips | skill kits, string lists, `.pow` power formulas |
| `npm run build:planner` | `public/planner/planner.json` — planner items, legendary powers, sets, gems, Altar | item, affix, set and gem tables, string lists |
| `npm run build:codex` | `public/items/items.json` — Item Codex audit and fixes (`-- --check` only reports) | the same tables |

How it works, in short: the game stores its data in binary GameBalance tables (items, affixes, set
bonuses, socketed gems), string lists (all in-game text) and `.pow` power files. Values are often
stored as small bytecode formulas rather than plain numbers, so `casc-tools/` includes a reader for
each format and a tiny evaluator for the formulas. Tooltip text is rebuilt from the game's own text
templates. Details, binary layouts and the formula opcodes are in
[`casc-tools/README.md`](casc-tools/README.md).

> **The game files are not part of this repository.** The generators expect them in
> `casc-tools/data/` and `casc-tools/pow/` (both git-ignored), extracted from your own copy of the
> game client.

Other data:

- `public/kadala/kadala.json` — Kadala tables, built by `scripts/build-kadala.py` from the server's
  drop-table CSVs.
- `public/planner/class-buffs.json`, `defense-buffs.json`, `passive-buffs.json`, `skill-damage.json`
  — buff and skill values for the character sheet, extracted by the `casc-tools/extract-*.mjs`
  scripts.

---

## Preset builds

Each preset is a readable JSON file in `public/planner/builds/<id>.json` (items by id, gems, Kanai
powers, skills with rune letters, passives, Paragon), listed in `public/planner/builds/index.json`.
They are produced by the generators in `scripts/gen-*-builds.mjs`, which resolve names to ids and
always pick the current (non-legacy) version of each item and power.

- `gen-theorycraft-builds.mjs` — the *Ethereal* Solo Pushing builds: each existing build reworked
  around the Ethereal weapon's extra class weapon legendary power and extra class passive, with the
  estimated gain documented per build. The original versions are kept in `scripts/data/build-bases/`.
- `gen-speed-support-builds.mjs` — Speed Farm (one T16 and one GR build per class) and Support
  (a push and a speed support per class).
- `reclassify-builds.mjs` — re-ranks every Solo Pushing build on one ladder: estimated level in
  Greater Rift levels (base tier + log(damage multiplier) / log(1.17)), tier by distance to the
  strongest build.
- `gen-atier/btier/stier/cdf-support-builds.mjs` — the remaining original builds.

```bash
node scripts/gen-theorycraft-builds.mjs && node scripts/gen-speed-support-builds.mjs   && node scripts/reclassify-builds.mjs && node scripts/validate-build.mjs --all
```

The validator fails on any invalid slot, unknown item, item another class cannot use, invalid affix,
empty socket, missing rune, Kanai power in the wrong cube slot, unknown passive, wrong Paragon total,
or an Ethereal whose extra power is not one of its options, repeats a power already in the cube or on
another item, or whose extra passive is already on the passive bar.

> Build rankings are estimates from the 2.7.5 game data (multiplier ratios), not combat simulations
> — they are meant to be confirmed in game.

---

## Project structure

```
src/
  pages/            one component per route (Planner, Builds, Items, ItemDetail, Classes,
                    ClassDetail, Kadala, Myriam, Shen, Cosmetics, Index)
  components/
    planner/        paperdoll, slot editor, Kanai's Cube, skills, Paragon, Altar, stat summary
    items/          item card and tooltip
    classes/        class skill list
    ui/             shadcn/ui primitives
  lib/              planner model, build sharing and JSON files, character-sheet math,
                    items, skills, Kadala, Altar sacrifice costs, SEO helpers
  i18n/locales/     interface translations (en, pt, es, fr, ko, ru, zh)
  test/             Vitest tests
public/
  planner/          planner data, preset builds, paperdoll and Altar art, Paragon icons
  items/            Item Codex data and icons
  skills/           skill data and icons
  kadala/           Kadala gamble tables
  cosmetics/        screenshots from the server
casc-tools/         game-data generators; lib/casc.mjs holds the shared binary readers
scripts/            preset-build generators and validator, sitemap, prerender, Kadala builder
```

---

## Testing and quality

```bash
npm test                                   # unit tests (build files, Altar costs, SEO)
npm run lint                               # ESLint
node scripts/validate-build.mjs --all      # every preset build
npm run build:codex -- --check             # Item Codex vs. game files
```

---

## Credits and disclaimer

- The character-sheet math in `src/lib/planner-sim.ts` is adapted from
  [d3planner](https://github.com/d07RiV/d3planner) (Apache License 2.0). See
  [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- Preset builds credit the guide they are based on in their `source` field.

RuinWatch is a fan project. It is not affiliated with, endorsed by or sponsored by Blizzard
Entertainment. Diablo and Diablo III are trademarks of Blizzard Entertainment, Inc.; game names,
item names, icons and artwork belong to their respective owners.

---

## License

Licensed under the [Apache License 2.0](LICENSE). You are free to use, modify and redistribute this
project, including commercially, as long as you **keep the copyright and the [`NOTICE`](NOTICE) file**
and credit **RuinWatch by Pablo Rigueto** (https://github.com/pablorigueto/ruinwatch) in anything built
on it. Modified files must state that they were changed.

The license covers this project's own code, scripts and texts. Diablo III game data, names, icons and
artwork belong to Blizzard Entertainment and are not licensed here.
