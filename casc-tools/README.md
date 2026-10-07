# casc-tools — game data generators

Node.js scripts that read the Diablo III game files (CASC) of the **2.7.5 / Season 28 / Rites of
Sanctuary** client and generate the JSON data the website uses. Everything is self-contained: the
binary readers are re-implemented here, with no dependency on any other project.

> **The game files are not included in this repository.** Put them in `data/` and `pow/` (both
> git-ignored), extracted from your own copy of the game client — see [Input files](#input-files).

## Commands

| Command (from the repo root) | Script | Output |
|---|---|---|
| `npm run build:skills` | `build-skills-casc.mjs` | `public/skills/skills.json` |
| `npm run build:planner` | `build-planner-casc.mjs` | `public/planner/planner.json` (+ remapped ids in preset builds) |
| `npm run build:codex` | `build-codex-casc.mjs` | `public/items/items.json` |
| `node casc-tools/extract-class-buffs.mjs` | | `public/planner/class-buffs.json` |
| `node casc-tools/extract-defense-buffs.mjs` | | `public/planner/defense-buffs.json` |
| `node casc-tools/extract-passive-buffs.mjs` | | `public/planner/passive-buffs.json` |

`build-planner-casc.mjs` and `build-codex-casc.mjs` accept `--check` (report only, write nothing);
`build-codex-casc.mjs` also accepts `--report <file.md>` to save the full report. All generators are
idempotent: running them twice produces no changes.

## Input files

```
data/
  gamebalance/   Items_*.gam, ItemTypes.gam, AffixList.gam, 1xx_AffixList.gam, x1_AffixList.gam,
                 SetItemBonuses.gam, SocketedEffects.gam
  stringlists/   Items.stl, Powers.stl, AttributeDescriptions.stl, ItemPassivePowerDescriptions.stl,
                 ItemSets.stl, SkillsUI.stl, UIToolTips.stl, ItemTypeNames.stl
  skillkit/      one .skl per class (skill and passive lists)
  PowerFormulaTables.gam  damage/healing tables used by Table()
  Power.csv           power name -> SNO id
  power-keys.json     power names used by the skill generator
  attribute-ids.json  attribute id -> attribute name
pow/             one .pow file per power (skills, runes, passives, item powers)
```

## What each generator does

### Skills, runes and passives — `build-skills-casc.mjs`

Rewrites `public/skills/skills.json` (the text shown on the class pages and in the planner).

- Skill and passive lists, category and level: `data/skillkit/*.skl`.
- Names and tooltip templates: `Powers.stl` (`<Power>_name`, `<Power>_desc` for actives,
  `<Power>_var_stats` for passives), `AttributeDescriptions.stl` (`NameRune_X#<Power>`,
  `Rune_X#<Power>`), `SkillsUI.stl` (categories), `UIToolTips.stl` + `ItemTypeNames.stl`
  ("Requires Bow/Shield/Weapon").
- Values: the `.pow` bytecode run by the formula VM (float32), at level 70, without passives or items.
- Keeps each skill's slug, icon and order; updates name, level, category, cost, description and runes.

Client text rules reproduced (checked against 1,272 tooltips): round-half-to-even (2.5 → 2), thousands
separator only for 5+ digits (12,000 · 5364), plurals `|4second:seconds;`, and highlights for text in
`{c_green}` / `{c_gold}` / `{c_red}` (a color stack — `{c_yellow}` is not highlighted).

### Planner — `build-planner-casc.mjs`

Updates `public/planner/planner.json` from the game files:

- **Items** — ids that only exist in later patches (`P76_`, `P77_`…) are mapped to the 2.7.5 item with
  the same name; names come from `Items.stl`.
- **Legendary powers** — the power the item points to (attribute 1293 `Item_Power_Passive`, or a
  `*_ProcPower_<Name>` affix, or an attribute of the item itself), its text from
  `ItemPassivePowerDescriptions.stl` and its min–max range from the attribute's formula.
- **Set bonuses** (`SetItemBonuses.gam`), **normal gem ranks** (`SocketedEffects.gam`),
  **Altar of Rites** seals (`P75_ItemPassive_DarkAlchemy*` powers) and skill/rune/passive names.
- Preset builds that reference a remapped item id are updated.

### Item Codex — `build-codex-casc.mjs`

Audits and fixes `public/items/items.json` item by item:

1. the item exists in this version (later-patch ids are replaced by the 2.7.5 version: slug, icon and
   related-item links);
2. name;
3. legendary power — text and range;
4. fixed affixes — which attribute each affix line is, against the item's `LegendaryAffixFamily`
   (offset 1000 of the item record) and its own attributes;
5. set bonuses — compared sentence by sentence across all pieces of the set.

### Character-sheet buffs — `extract-*.mjs`

Read passive, class-buff and defensive values from the `.pow` files for the planner's character sheet.

## Binary formats

All readers live in `lib/casc.mjs` (shared by every generator) and `pow-parser.mjs`.

**GameBalance tables** (`.gam`): a 16-byte header, then serialized pointers (`int offset, int size`) to
each table; the real position is `offset + 16`.

| Table | Record size | Pointer at | Fields used |
|---|---|---|---|
| Items | 1408 | 56 | name @0, item type @268, set @372, `Attribute[16]` @504 (24 bytes each), `LegendaryAffixFamily[6]` @1000 |
| Affixes | 784 | 136 | name @0, level min/max @316/@320, affix families @364/@368, `Attribute[4]` @608 |
| Set bonuses | 464 | 376 | set @264, piece count @268, `Attribute[8]` @272 (definition records have set = -1) |
| Socketed gems | 1416 | 264 | gem item @264, item type @268, attribute @272 |

An attribute specifier is `int id, int param, …, int formulaOffset @16, int formulaSize @20`. Item,
set and type references use the game's name hash (`h = h * 33 + c`, lowercase).

**String lists** (`.stl`): pointer at `0x28`, 40-byte entries `key → text`.

**Power files** (`.pow`):
- `ScriptFormulaDetails` — pointer at offset 1088; 776-byte entries: slot name `[256]`,
  `[512]`, 2 × int32. Gives the slot → name map.
- `Powerdef.TagMap` — `int size`, then entries `int type, int tagId` + value by type: 0 Int32,
  1 Float32, 2 SNO, 3 Int32, 4 **ScriptFormula**, 5 Int32…
- ScriptFormula (type 4): `I0..I4`, `NameSize`, `I5`, `OpcodeSize`, the name (NUL-terminated, 4-byte
  aligned), then `OpcodeSize` bytes of bytecode.

## Formula VM

Stack based, float32. Opcodes: `0` return · `1` function call · `5` identifier · `6` push float ·
`8` `>` · `11` `+` · `12` `-` · `13` `*` · `14` `/` · `16` negate · `17` `?:`.

Functions: 0 Min, 1 Max, 2 Pin, 3 RandIntMinRange, 4 RandIntMinMax, 5 Floor, 9 RandFloatMinRange,
10 RandFloatMinMax, 11 Table. Random functions are evaluated at their minimum and maximum to get the
range shown in tooltips.

Identifier ids in this version: `SF_N` = 23 + N (N = 0..63); `PowerTag` = 22; GameBalance tables
87 DmgTier1, 88 DmgTier2, 90 DmgTier4, 94 Healing, 95 WDCost, 102 LegendaryProcDmg (looked up at the
character level via `Table(id, index)`); rune attributes 695–699.

Text templates: `[{VALUE1}*100|1|]` style expressions are evaluated per expression (a template can
show two different numbers derived from the same value, e.g. "1750%, up to 31500%").

## Known limitations

- `extract-skill-damage.mjs` picks each skill's damage slot by name heuristics; its output is not used
  directly — `public/planner/skill-damage.json` is curated by hand.
- Fixed-affix **ranges** of legendary items are not recomputed (the level window rules are not
  reproduced); the Codex audit checks which attribute each line is.
- A few old item powers have no text in the game files (Halcyon's Ascent, Wall of Man, Spite,
  Blood-Magic Edge, Cinder Switch, Sunder) and keep their existing text.
