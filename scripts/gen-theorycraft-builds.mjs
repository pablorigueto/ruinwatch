/**
 * gen-theorycraft-builds.mjs — original builds designed from the 2.7.5 game data
 * (not taken from a guide), listed with the Solo Pushing builds: each one is built around its
 * Ethereal weapon's extra class weapon legendary power and extra class passive (random
 * rolls in game — the build names the roll to farm).
 *
 * They replace the original versions of the same builds (same id / URL; the originals are
 * kept as bases in scripts/data/build-bases/). The originals already wore an Ethereal but
 * never used its two extras. The
 * gains below come from three moves, with the 2.7.5 values:
 *   1. the cube's weapon power moves onto the Ethereal, freeing the cube slot;
 *   2. a 5th passive;
 *   3. one-handed builds switch to The Grandfather (+200% Barbarian skills instead of the
 *      +100% of Gimmershred / Doombringer) when the off-hand's power can go in the cube.
 * Estimates are multiplier ratios vs the base build (shared multipliers cancel out); they
 * still need to be confirmed in game.
 *
 *   node scripts/gen-theorycraft-builds.mjs && node scripts/validate-build.mjs --all
 */
import { createEngine, emitBuilds } from "./lib/build-engine.mjs";

const { build, derive } = await createEngine();
const SEASON = "Season 28 (2.7.5)";
const CATEGORY = "solo-push";
// Tiers: estimated GR level vs the current S tier = base build's tier + log(damage x) / log(1.17)
// (each Greater Rift level has ~17% more monster life). A = up to 5 GRs behind S, B = 5-10.

const builds = [
  /*
   * Ethereal LoD HotA — from "LoD HotA" (A). The Gavel of Judgment moves onto The
   * Grandfather, so the cube weapon slot takes Remorseless: HotA +800% while Wrath of the
   * Berserker and Call of the Ancients are both up. Both are on the bar, and Obsidian Ring
   * of the Zodiac takes 1 s off a cooldown per HotA hit, so the uptime is close to full.
   * Extra passive: Ruthless (+40% below 30% health).
   * Estimate vs LoD HotA: x9 (Remorseless at full uptime) x~1.13 (Ruthless, averaged) = ~x10.
   */
  await derive("barbarian-lod-hota", {
    id: "barbarian-lod-hota", name: "Ethereal LoD HotA", category: CATEGORY, tier: "S",
    tagline: "Hammer of the Ancients · LoD · Ethereal: Gavel + Ruthless, Remorseless in the cube",
    ethereal: { power: "The Gavel of Judgment", passive: "Ruthless" },
    kanai: ["Remorseless", "Mortick's Brace", "Obsidian Ring of the Zodiac"],
  }),

  /*
   * Full Horde Frenzy — reworks "Savage Frenzy" (A).
   *  - Wear all 6 Horde pieces (Markings of Savages) instead of 5 + RoRG in the cube.
   *  - Endless Walk (Traveler's Pledge + Compass Rose): +100% damage standing still — Frenzy
   *    swings in place, so a steady x2; Squirt's moves to the freed cube jewelry slot.
   *  - Strongarm Bracers (+30% for 6 s after a knockback; Furious Charge knocks back).
   *  - The Grandfather (+200%) carries Bastion's Revered; Oathkeeper goes in the cube.
   *  - Battle Rage - Marauder's Rage and Threatening Shout - Falter, both doubled by the
   *    Horde 2p (+30% damage; enemies take +50%, bosses included).
   *  - Bane of the Stricken replaces Molten Wildebeest's Gizzard; extra passive Brawler.
   * Estimate vs Savage Frenzy: x2 (Endless Walk) x1.3 (Strongarm) x1.3 (Marauder's) x1.2
   * (Brawler) x1.5 (Grandfather 3/2) x0.87 (no dual-wield attack speed) = ~x5.3 on trash,
   * ~x4.6 vs elites (Aughild's 15% lost). Trade-off: less defense.
   */
  build({
    id: "barbarian-savage-frenzy", name: "Full Horde Frenzy", klass: "barbarian", category: CATEGORY, tier: "S",
    season: SEASON, noEthereal: false,
    tagline: "Frenzy · 6p Horde + Endless Walk · Ethereal: Bastion's Revered + Brawler",
    gear: {
      head: "Skull of Savages", shoulders: "Spines of Savages", neck: "The Traveler's Pledge", torso: "Markings of Savages",
      hands: "Claws of Savages", wrists: "Strongarm Bracers", waist: "The Undisputed Champion", legs: "Leggings of Savages",
      feet: "Heel of Savages", leftfinger: "The Compass Rose", rightfinger: "Convention of Elements",
      mainhand: "The Grandfather",
    },
    ethereal: { power: "Bastion's Revered", passive: "Brawler" },
    kanai: ["Oathkeeper", "Depth Diggers", "Squirt's Necklace"],
    skills: [["Frenzy", "Maniac"], ["Threatening Shout", "Falter"], ["Battle Rage", "Marauder's Rage"],
      ["War Cry", "Veteran's Warning"], ["Wrath of the Berserker", "Insanity"], ["Furious Charge", "Cold Rush"]],
    passives: ["Rampage", "Berserker Rage", "Boon of Bul-Kathos", "Nerves of Steel"],
    legendaryGems: ["simplicity", "trapped", "stricken"],
  }),

  /*
   * Ethereal WW Rend — from "Waste Whirlwind Rend" (A). Ambo's Pride moves onto The
   * Grandfather (+200% instead of Gimmershred's +100%), so the off-hand slot goes away.
   * Extra passive: Ruthless.
   * Estimate vs Waste WW Rend: x1.5 (Grandfather 3/2) x0.87 (no dual-wield attack speed)
   * x~1.13 (Ruthless) = ~x1.5.
   */
  await derive("barbarian-waste-ww-rend", {
    id: "barbarian-waste-ww-rend", name: "Ethereal WW Rend", category: CATEGORY, tier: "S",
    tagline: "Whirlwind · Rend · Wastes · Ethereal: Ambo's Pride + Ruthless",
    gear: { mainhand: "The Grandfather", offhand: null },
    ethereal: { power: "Ambo's Pride", passive: "Ruthless" },
  }),

  /*
   * Ethereal Leapquake — from "MotE Leapquake" (B). Blade of the Tribes moves onto The
   * Grandfather, so the cube weapon slot takes The Furnace (+50% vs elites).
   * Extra passive: Ruthless.
   * Estimate vs MotE Leapquake: x~1.13 on trash, x1.5 x~1.13 = ~x1.7 vs elites.
   */
  await derive("barbarian-mote-leapquake", {
    id: "barbarian-mote-leapquake", name: "Ethereal Leapquake", category: CATEGORY, tier: "B",
    tagline: "Earthquake · Might of the Earth · Ethereal: Blade of the Tribes + Ruthless, Furnace in the cube",
    ethereal: { power: "Blade of the Tribes", passive: "Ruthless" },
    kanai: ["The Furnace", "Girdle of Giants", "Ring of Royal Grandeur"],
  }),
  /* ──────────────────────────────── Crusader ────────────────────────────────
   * Every Crusader Ethereal is one-handed (+100% Crusader skills); The Redeemer also has
   * +50% vs Undead and Demons, so it is the pick for all of them. */

  /*
   * Ethereal Akkhan Condemn — from "Akkhan Condemn" (S). Frydehr's Wrath (Condemn has no
   * cooldown, +800%) moves onto The Redeemer, so the cube weapon slot takes Blade of Prophecy
   * (two Condemned enemies also trigger the explosion, Condemn +800%) and the armor slot
   * Warhelm of Kassar (Phalanx +60% damage and -60% cooldown: more Phalanx = more Akkhan 4p
   * Condemns and Akarat's Champion uptime). Extra passive: Holy Cause (+10% weapon damage).
   * Estimate vs Akkhan Condemn: x9 (Blade of Prophecy) x1.1 (Holy Cause) = ~x10.
   */
  await derive("crusader-akkhan-condemn", {
    id: "crusader-akkhan-condemn", name: "Ethereal Akkhan Condemn", category: CATEGORY, tier: "S",
    tagline: "Condemn · Akkhan · Ethereal: Frydehr's Wrath + Holy Cause, Blade of Prophecy in the cube",
    ethereal: { power: "Frydehr's Wrath", passive: "Holy Cause" },
    kanai: ["Blade of Prophecy", "Warhelm of Kassar", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal LoD Blessed Shield — from "LoD Blessed Shield" (A). The Redeemer replaces
   * Astreon's Iron Ward and carries Akkhan's Leniency, so the cube weapon slot takes
   * Gyrfalcon's Foote (Blessed Shield +350% and no Wrath cost). Extra passive: Holy Cause.
   * Estimate vs LoD Blessed Shield: x4.5 (Gyrfalcon's) x1.1 (Holy Cause) x~1.13 (Redeemer
   * vs Undead/Demons, averaged) = ~x5.6.
   */
  await derive("crusader-lod-blessed-shield", {
    id: "crusader-lod-blessed-shield", name: "Ethereal LoD Blessed Shield", category: CATEGORY, tier: "S",
    tagline: "Blessed Shield · LoD · Ethereal: Akkhan's Leniency + Holy Cause, Gyrfalcon's in the cube",
    gear: { mainhand: "The Redeemer" },
    ethereal: { power: "Akkhan's Leniency", passive: "Holy Cause" },
    kanai: ["Gyrfalcon's Foote", "Strongarm Bracers", "Unity"],
  }),

  /*
   * Ethereal AoV Heaven's Fury — from "AoV Heaven's Fury" (A). Fate of the Fell moves onto
   * The Redeemer, so the cube weapon slot takes Darklight: Fist of the Heavens casts twice
   * and deals +1000% — more Fist damage and faster Aegis of Valor 2p stacks (Heaven's Fury
   * +125% per stack). Extra passive: Indestructible (cheat death, +35% damage after).
   * Estimate vs AoV Heaven's Fury: Fist of the Heavens x22 (2 casts x11); with Fist at a
   * fraction of the total damage, ~x2-3 overall.
   */
  await derive("crusader-aov-heavens-fury", {
    id: "crusader-aov-heavens-fury", name: "Ethereal AoV Heaven's Fury", category: CATEGORY, tier: "S",
    tagline: "Heaven's Fury · Aegis of Valor · Ethereal: Fate of the Fell + Indestructible, Darklight in the cube",
    ethereal: { power: "Fate of the Fell", passive: "Indestructible" },
    kanai: ["Darklight", "Aquila Cuirass", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal SotL Blessed Hammer — from "SotL Blessed Hammer" (B). Faithful Memory moves
   * onto The Redeemer, so the cube weapon slot takes Johanna's Argument (Blessed Hammer
   * +100% damage and +100% attack speed). Extra passive: Blunt (+20% Blessed Hammer).
   * Estimate vs SotL Blessed Hammer: x2 (damage) x2 (attack speed) x1.2 (Blunt) = ~x4.8.
   */
  await derive("crusader-sotl-blessed-hammer", {
    id: "crusader-sotl-blessed-hammer", name: "Ethereal SotL Blessed Hammer", category: CATEGORY, tier: "S",
    tagline: "Blessed Hammer · Seeker of the Light · Ethereal: Faithful Memory + Blunt, Johanna's Argument in the cube",
    ethereal: { power: "Faithful Memory", passive: "Blunt" },
    kanai: ["Johanna's Argument", "Hammer Jammers", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal LoN Bombardment — from "LoN Bombardment" (A). The Mortal Drama moves onto The
   * Redeemer, so the cube weapon slot takes The Furnace (+50% vs elites). Extra passive:
   * Lord Commander (Bombardment cooldown -35%: ~1.5x as many Bombardments).
   * Estimate vs LoN Bombardment: x~1.5 (Lord Commander) on trash, x~2.3 vs elites.
   */
  await derive("crusader-lon-bombardment", {
    id: "crusader-lon-bombardment", name: "Ethereal LoN Bombardment", category: CATEGORY, tier: "S",
    tagline: "Bombardment · Legacy of Nightmares · Ethereal: The Mortal Drama + Lord Commander, Furnace in the cube",
    ethereal: { power: "The Mortal Drama", passive: "Lord Commander" },
    kanai: ["The Furnace", "Stone Gauntlets", "Convention of Elements"],
  }),

  /* ────────────────────────────── Demon Hunter ──────────────────────────────
   * Ethereals: Windforce (bow, +200% to Archery skills: Strafe, Multishot, Cluster Arrow,
   * Rain of Vengeance), Buriza-Do Kyanon (crossbow, +150% Demon Hunter skills) and
   * Doomslinger (hand crossbow, +100%). Extra passive for all four: Steady Aim (+20% damage
   * with no enemy within 10 yards). */

  /*
   * Ethereal UE Multishot — from "UE Multishot" (A). Dawn (Vengeance -65% cooldown) moves
   * onto Windforce, so the cube weapon slot takes Yang's Recurve: Multishot +200% damage and
   * 50% faster.
   * Estimate vs UE Multishot: x3 x1.5 (Yang's) x1.2 (Steady Aim) = ~x5.4.
   */
  await derive("demonhunter-ue-multishot", {
    id: "demonhunter-ue-multishot", name: "Ethereal UE Multishot", category: CATEGORY, tier: "S",
    tagline: "Multishot · Unhallowed Essence · Ethereal: Dawn + Steady Aim, Yang's Recurve in the cube",
    ethereal: { power: "Dawn", passive: "Steady Aim" },
    kanai: ["Yang's Recurve", "Stone Gauntlets", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal GoD Strafe — from "GoD Strafe (Valla's)" (A), which wore no Ethereal at all:
   * Doomslinger (+100% Demon Hunter skills) now carries Valla's Bequest (Strafe pierces),
   * Dawn stays in the off-hand.
   * Estimate vs GoD Strafe: x2 (Doomslinger) x1.2 (Steady Aim) = ~x2.4.
   */
  await derive("demonhunter-god-strafe", {
    id: "demonhunter-god-strafe", name: "Ethereal GoD Strafe", category: CATEGORY, tier: "S",
    tagline: "Strafe · Gears of Dreadlands · Ethereal: Valla's Bequest + Steady Aim",
    gear: { mainhand: "Doomslinger" },
    ethereal: { power: "Valla's Bequest", passive: "Steady Aim" },
  }),

  /*
   * Ethereal Natalya Spike Trap — from "Natalya Spike Trap" (S). Doomslinger carries Dawn:
   * Vengeance (+40% damage, side guns and rockets) goes from ~45% uptime to nearly always on.
   * Estimate vs Natalya Spike Trap: x~1.2 (Vengeance uptime) x~1.15 (Steady Aim, part of the
   * time) = ~x1.4.
   */
  await derive("demonhunter-natalya-spike-trap", {
    id: "demonhunter-natalya-spike-trap", name: "Ethereal Natalya Spike Trap", category: CATEGORY, tier: "S",
    tagline: "Spike Trap · Natalya · Ethereal: Dawn + Steady Aim",
    ethereal: { power: "Dawn", passive: "Steady Aim" },
  }),

  /*
   * Ethereal Marauder Sentry — from "Marauder Sentry" (A). Manticore (Cluster Arrow +300%,
   * half cost) moves onto Windforce, so the cube weapon slot takes The Furnace (+50% vs
   * elites).
   * Estimate vs Marauder Sentry: x1.2 (Steady Aim) on trash, x1.8 vs elites.
   */
  await derive("demonhunter-marauder-sentry", {
    id: "demonhunter-marauder-sentry", name: "Ethereal Marauder Sentry", category: CATEGORY, tier: "A",
    tagline: "Sentry · Cluster Arrow · Marauder · Ethereal: Manticore + Steady Aim, Furnace in the cube",
    ethereal: { power: "Manticore", passive: "Steady Aim" },
    kanai: ["The Furnace", "Zoey's Secret", "Ring of Royal Grandeur"],
  }),

  /* ───────────────────────────────── Monk ─────────────────────────────────
   * Ethereals: Jade Talon, Shadow Killer, Bartuc's Cut-Throat — all one-handed (+100% Monk
   * skills). The Monk dual-wields, so the Ethereal takes the OTHER weapon's power and that
   * hand gets a third weapon power. */

  /*
   * Ethereal SWK Tempest Rush — from "SWK Tempest Rush" (B). Won Khim Lau moves onto Jade
   * Talon, so the main hand takes Vengeful Wind: Sweeping Wind +10 max stacks (13 instead of
   * 3) and +800% damage. Monkey King's Garb 6p gives Tempest Rush +1500% per stack and the 4p
   * decoys 1000% per stack: x(1+15x13)/(1+15x3) = x4.26. Extra passive: Relentless Assault
   * (+20% vs Blinded — Blinding Flash is on the bar).
   * Estimate vs SWK Tempest Rush: x4.26 x1.2 = ~x5.1.
   */
  await derive("monk-swk-tempest-rush", {
    id: "monk-swk-tempest-rush", name: "Ethereal SWK Tempest Rush", category: CATEGORY, tier: "S",
    tagline: "Tempest Rush · Monkey King · Ethereal: Won Khim Lau + Relentless Assault, Vengeful Wind (13 stacks)",
    gear: { mainhand: "Vengeful Wind" },
    ethereal: { power: "Won Khim Lau", passive: "Relentless Assault" },
  }),

  /*
   * Ethereal SWK Wave of Light — from "SWK Wave of Light" (B). Vengeful Wind moves onto
   * Shadow Killer, so the off-hand takes Kyoshiro's Blade: Wave of Light +150%, and +250% more
   * when its impact hits 3 or fewer enemies. Extra passive: Determination (+4% per enemy within
   * 12 yards, up to +20%).
   * Estimate vs SWK Wave of Light: x2.5 x1.2 = ~x3 on trash, x2.5 x3.5 = ~x8.75 on a boss.
   */
  await derive("monk-swk-wave-of-light", {
    id: "monk-swk-wave-of-light", name: "Ethereal SWK Wave of Light", category: CATEGORY, tier: "S",
    tagline: "Wave of Light · Monkey King · Ethereal: Vengeful Wind + Determination, Kyoshiro's Blade",
    gear: { offhand: "Kyoshiro's Blade" },
    ethereal: { power: "Vengeful Wind", passive: "Determination" },
  }),

  /*
   * Ethereal PoJ Tempest Rush — from "PoJ Tempest Rush" (A). Balance (Tempest Rush +600%,
   * 100% crit on 3 or fewer enemies) moves onto Jade Talon, so the cube weapon slot takes The
   * Furnace (+50% vs elites). Extra passive: Momentum (+20% after moving 25 yards — Tempest
   * Rush keeps you moving).
   * Estimate vs PoJ Tempest Rush: x1.2 on trash, x1.8 vs elites.
   */
  await derive("monk-poj-tempest-rush", {
    id: "monk-poj-tempest-rush", name: "Ethereal PoJ Tempest Rush", category: CATEGORY, tier: "A",
    tagline: "Tempest Rush · Patterns of Justice · Ethereal: Balance + Momentum, Furnace in the cube",
    ethereal: { power: "Balance", passive: "Momentum" },
    kanai: ["The Furnace", "Mantle of Channeling", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal Uliana EP — from "Uliana EP" (C). The Fist of Az'Turrasq moves onto Bartuc's
   * Cut-Throat, so the main hand takes Lion's Claw: Seven-Sided Strike performs 7 more strikes
   * (Uliana's 4p makes each strike deal 777% of its total). Extra passive: Determination.
   * Estimate vs Uliana EP: Seven-Sided Strike x2, Exploding Palm unchanged -> ~x1.6 overall,
   * x1.2 (Determination) = ~x1.9.
   */
  await derive("monk-uliana-ep", {
    id: "monk-uliana-ep", name: "Ethereal Uliana EP", category: CATEGORY, tier: "B",
    tagline: "Exploding Palm · Seven-Sided Strike · Uliana · Ethereal: Fist of Az'Turrasq + Determination, Lion's Claw",
    gear: { mainhand: "Lion's Claw" },
    ethereal: { power: "The Fist of Az'Turrasq", passive: "Determination" },
  }),

  /* ────────────────────────────── Necromancer ──────────────────────────────
   * Ethereals: Blackbog's Sharp, Soul Harvest, Blackhand Key — all one-handed (+100%
   * Necromancer skills; Blackhand Key also +50% vs Undead). Extra passive: Blood is Power
   * (-20% cooldowns after losing 100% Life in total — more Simulacrum time); the Necromancer has
   * no big damage passive these builds were missing. */

  /*
   * Ethereal Inarius Death Nova — from "Inarius Death Nova" (S). Blackbog's Sharp carries
   * Bloodtide Blade: Death Nova +400% for every enemy within 25 yards (up to 25). Funerary Pick
   * (cube) and Iron Rose (off-hand) stay.
   * Estimate vs Inarius Death Nova: x5 on a lone boss (1 enemy), x30+ on a pack.
   */
  await derive("necromancer-inarius-death-nova", {
    id: "necromancer-inarius-death-nova", name: "Ethereal Inarius Death Nova", category: CATEGORY, tier: "S",
    tagline: "Death Nova · Grace of Inarius · Ethereal: Bloodtide Blade + Blood is Power",
    ethereal: { power: "Bloodtide Blade", passive: "Blood is Power" },
  }),

  /*
   * Ethereal Trag'Oul Death Nova — from "Trag'Oul Death Nova" (S). Same move: Blackbog's Sharp
   * carries Bloodtide Blade (Death Nova +400% per enemy within 25 yards).
   * Estimate vs Trag'Oul Death Nova: x5 on a lone boss, x30+ on a pack.
   */
  await derive("necromancer-tragoul-death-nova", {
    id: "necromancer-tragoul-death-nova", name: "Ethereal Trag'Oul Death Nova", category: CATEGORY, tier: "S",
    tagline: "Death Nova · Trag'Oul's Avatar · Ethereal: Bloodtide Blade + Blood is Power",
    ethereal: { power: "Bloodtide Blade", passive: "Blood is Power" },
  }),

  /*
   * Ethereal Masquerade Bone Spear — from "Masquerade Bone Spear" (S). Maltorius' Petrified
   * Spike (Bone Spear +700%) moves onto Blackbog's Sharp, so the cube weapon slot takes Scythe
   * of the Cycle: Secondary skills (Bone Spear is one) +400% while Bone Armor is active (it
   * shortens Bone Armor by 4 s per cast — keep recasting it).
   * Estimate vs Masquerade Bone Spear: x5 (Scythe of the Cycle).
   */
  await derive("necromancer-masquerade-bone-spear", {
    id: "necromancer-masquerade-bone-spear", name: "Ethereal Masquerade Bone Spear", category: CATEGORY, tier: "S",
    tagline: "Bone Spear · Masquerade · Ethereal: Maltorius' + Blood is Power, Scythe of the Cycle in the cube",
    ethereal: { power: "Maltorius' Petrified Spike", passive: "Blood is Power" },
    kanai: ["Scythe of the Cycle", "Gelmindor's Marrow Guards", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal LoD Poison Scythe — from "LoD Poison Scythe" (A). Nayr's Black Death moves onto
   * Blackbog's Sharp, so the cube weapon slot takes Trag'Oul's Corroded Fang: the Cursed Scythe
   * rune (on the bar) always curses, and +200% damage to cursed enemies.
   * Estimate vs LoD Poison Scythe: x3 (Corroded Fang).
   */
  await derive("necromancer-lod-poison-scythe", {
    id: "necromancer-lod-poison-scythe", name: "Ethereal LoD Poison Scythe", category: CATEGORY, tier: "S",
    tagline: "Grim Scythe · Poison · LoD · Ethereal: Nayr's + Blood is Power, Trag'Oul's Corroded Fang in the cube",
    ethereal: { power: "Nayr's Black Death", passive: "Blood is Power" },
    kanai: ["Trag'Oul's Corroded Fang", "Depth Diggers", "Krysbin's Sentence"],
  }),

  /* ───────────────────────────── Witch Doctor ─────────────────────────────
   * Each Witch Doctor Ethereal gives +200% to ONE skill category: Arioc's Needle -> Decay
   * (Zombie Charger, Spirit Barrage, Piranhas…), Ghostflame -> Secondary (Firebats, Haunt,
   * Locust Swarm…), The Gidbinn -> Voodoo (Gargantuan, Big Bad Voodoo, Fetish Army). */

  /*
   * Ethereal Helltooth Zombie Bears — from "Helltooth Zombie Bears" (A). Shukrani's Triumph
   * moves onto Arioc's Needle, so the cube weapon slot takes Scrimshaw: Zombie Charger deals
   * 7 times its damage (and costs 75% less Mana). Extra passive: Pierce the Veil (+20%).
   * Estimate vs Helltooth Zombie Bears: x7 (Scrimshaw) x1.2 = ~x8.4.
   */
  await derive("witchdoctor-helltooth-zombie-bears", {
    id: "witchdoctor-helltooth-zombie-bears", name: "Ethereal Helltooth Zombie Bears", category: CATEGORY, tier: "S",
    tagline: "Zombie Charger · Helltooth · Ethereal: Shukrani's + Pierce the Veil, Scrimshaw in the cube",
    ethereal: { power: "Shukrani's Triumph", passive: "Pierce the Veil" },
    kanai: ["Scrimshaw", "Stone Gauntlets", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal Mundunugu Spirit Barrage — from "Mundunugu Spirit Barrage" (A). The Barber moves
   * onto Arioc's Needle, so the cube weapon slot takes The Furnace (+50% vs elites). Extra
   * passive: Pierce the Veil (+20%).
   * Estimate vs Mundunugu Spirit Barrage: x1.2 on trash, x1.8 vs elites.
   */
  await derive("witchdoctor-mundunugu-spirit-barrage", {
    id: "witchdoctor-mundunugu-spirit-barrage", name: "Ethereal Mundunugu Spirit Barrage", category: CATEGORY, tier: "A",
    tagline: "Spirit Barrage · Mundunugu · Ethereal: The Barber + Pierce the Veil, Furnace in the cube",
    ethereal: { power: "The Barber", passive: "Pierce the Veil" },
    kanai: ["The Furnace", "Frostburn", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal Zunimassa Poison Dart — from "Zunimassa Poison Dart" (A). The Dagger of Darts
   * moves onto The Gidbinn, so the cube weapon slot takes The Furnace (+50% vs elites). Extra
   * passive: Confidence Ritual (+25% to enemies within 20 yards).
   * Estimate vs Zunimassa Poison Dart: x1.25 on trash, x1.9 vs elites.
   */
  await derive("witchdoctor-zunimassa-poison-dart", {
    id: "witchdoctor-zunimassa-poison-dart", name: "Ethereal Zunimassa Poison Dart", category: CATEGORY, tier: "A",
    tagline: "Poison Dart · Fetishes · Zunimassa · Ethereal: Dagger of Darts + Confidence Ritual, Furnace in the cube",
    ethereal: { power: "The Dagger of Darts", passive: "Confidence Ritual" },
    kanai: ["The Furnace", "Mask of Jeram", "Ring of Royal Grandeur"],
  }),

  /*
   * Ethereal Arachyr Firebats — from "Arachyr Firebats" (B). Staff of Chiroptera (Firebats
   * twice as fast, +150%) moves onto Ghostflame, so the cube weapon slot takes The Furnace
   * (+50% vs elites). Extra passive: Pierce the Veil (+20%).
   * Estimate vs Arachyr Firebats: x1.2 on trash, x1.8 vs elites.
   */
  await derive("witchdoctor-arachyr-firebats", {
    id: "witchdoctor-arachyr-firebats", name: "Ethereal Arachyr Firebats", category: CATEGORY, tier: "B",
    tagline: "Firebats · Ethereal: Staff of Chiroptera + Pierce the Veil, Furnace in the cube",
    ethereal: { power: "Staff of Chiroptera", passive: "Pierce the Veil" },
    kanai: ["The Furnace", "Bakuli Jungle Wraps", "Ring of Royal Grandeur"],
  }),

  /* ──────────────────────────────── Wizard ────────────────────────────────
   * Ethereals: Mang Song's Lesson (two-handed staff, +300% Wizard skills, +50% vs Undead),
   * Wizardspike and The Oculus (one-handed, +100%). Mang Song is twice the bonus, so builds
   * that wore a one-handed Ethereal + a source move the source's power onto Mang Song.
   * Extra passive for all four: Glass Cannon (+15% damage). */

  /*
   * Ethereal Firebird Meteor — from "Firebird Meteor" (S). Mang Song's Lesson carries The
   * Grand Vizier: Meteor +400% damage and half the Arcane Power cost.
   * Estimate vs Firebird Meteor: x5 (Grand Vizier) x1.15 (Glass Cannon) = ~x5.75.
   */
  await derive("wizard-firebird-meteor", {
    id: "wizard-firebird-meteor", name: "Ethereal Firebird Meteor", category: CATEGORY, tier: "S",
    tagline: "Meteor · Firebird · Ethereal: The Grand Vizier + Glass Cannon",
    ethereal: { power: "The Grand Vizier", passive: "Glass Cannon" },
  }),

  /*
   * Ethereal LoD Meteor — from "LoD \"Bazooka\" Meteor" (S). The Oculus (+100%) and Orb of
   * Infinite Depth (it powers up Explosive Blast, which is not on the bar) are replaced by Mang
   * Song's Lesson (+300%) carrying The Grand Vizier.
   * Estimate vs LoD Meteor: x2 (Mang Song 4/2) x5 (Grand Vizier) x1.15 (Glass Cannon) = ~x11.5.
   */
  await derive("wizard-lod-meteor", {
    id: "wizard-lod-meteor", name: "Ethereal LoD \"Bazooka\" Meteor", category: CATEGORY, tier: "S",
    tagline: "Meteor · LoD · Ethereal: Mang Song's Lesson with The Grand Vizier + Glass Cannon",
    gear: { mainhand: "Mang Song's Lesson", offhand: null },
    ethereal: { power: "The Grand Vizier", passive: "Glass Cannon" },
  }),

  /*
   * Ethereal Typhon Hydra — from "Typhon Hydra" (A). Wizardspike (+100%) and Winter Flurry
   * (source) are replaced by Mang Song's Lesson (+300%) carrying Winter Flurry (Hydras +150%
   * to enemies in a Blizzard). Fragment of Destiny stays in the cube.
   * Estimate vs Typhon Hydra: x2 (Mang Song 4/2) x1.15 (Glass Cannon) = ~x2.3.
   */
  await derive("wizard-typhon-hydra", {
    id: "wizard-typhon-hydra", name: "Ethereal Typhon Hydra", category: CATEGORY, tier: "S",
    tagline: "Hydra · Typhon · Ethereal: Mang Song's Lesson with Winter Flurry + Glass Cannon",
    gear: { mainhand: "Mang Song's Lesson", offhand: null },
    ethereal: { power: "Winter Flurry", passive: "Glass Cannon" },
  }),

  /*
   * Ethereal Vyr Reverse Archon FO — from "Vyr Reverse Archon FO" (A). Wizardspike (+100%) and
   * Triumvirate (source) are replaced by Mang Song's Lesson (+300%) carrying Triumvirate
   * (Arcane Orb +400% per stack, 3 stacks). Wizardspike's own power stays in the cube.
   * Estimate vs Vyr Reverse Archon FO: x2 (Mang Song 4/2) x1.15 (Glass Cannon) = ~x2.3.
   */
  await derive("wizard-vyr-reverse-archon-fo", {
    id: "wizard-vyr-reverse-archon-fo", name: "Ethereal Vyr Reverse Archon FO", category: CATEGORY, tier: "S",
    tagline: "Arcane Orb · Archon · Vyr · Ethereal: Mang Song's Lesson with Triumvirate + Glass Cannon",
    gear: { mainhand: "Mang Song's Lesson", offhand: null },
    ethereal: { power: "Triumvirate", passive: "Glass Cannon" },
  }),

  /* ── Same upgrades for the remaining S builds of those classes ── */

  /*
   * Ethereal LoD Death Nova — from "LoD Death Nova" (S). Same as the other Death Nova builds:
   * Blackbog's Sharp carries Bloodtide Blade (Death Nova +400% per enemy within 25 yards).
   * Estimate vs LoD Death Nova: x5 on a lone boss, x30+ on a pack.
   */
  await derive("necromancer-lod-death-nova", {
    id: "necromancer-lod-death-nova", name: "Ethereal LoD Death Nova", category: CATEGORY, tier: "S",
    tagline: "Death Nova · LoD · Ethereal: Bloodtide Blade + Blood is Power",
    ethereal: { power: "Bloodtide Blade", passive: "Blood is Power" },
  }),

  /*
   * Ethereal Rathma Army of the Dead — from "Rathma Army of the Dead" (S). Blackbog's Sharp
   * carries Trag'Oul's Corroded Fang: +200% damage to cursed enemies, and Decrepify (a curse)
   * is already on the bar, so it applies to all the build's damage, Army of the Dead included.
   * Estimate vs Rathma Army of the Dead: x3 (Corroded Fang).
   */
  await derive("necromancer-rathma-aotd", {
    id: "necromancer-rathma-aotd", name: "Ethereal Rathma Army of the Dead", category: CATEGORY, tier: "S",
    tagline: "Army of the Dead · Bones of Rathma · Ethereal: Trag'Oul's Corroded Fang + Blood is Power",
    ethereal: { power: "Trag'Oul's Corroded Fang", passive: "Blood is Power" },
  }),

  /*
   * Ethereal Tal Rasha Meteor — from "Tal Rasha Meteor" (S). Same as Firebird Meteor: Mang
   * Song's Lesson carries The Grand Vizier (Meteor +400%, half the cost).
   * Estimate vs Tal Rasha Meteor: x5 x1.15 (Glass Cannon) = ~x5.75.
   */
  await derive("wizard-tal-rasha-meteor", {
    id: "wizard-tal-rasha-meteor", name: "Ethereal Tal Rasha Meteor", category: CATEGORY, tier: "S",
    tagline: "Meteor · Tal Rasha · Ethereal: The Grand Vizier + Glass Cannon",
    ethereal: { power: "The Grand Vizier", passive: "Glass Cannon" },
  }),
];

await emitBuilds(builds.map((b) => ({ season: SEASON, ...b })));
