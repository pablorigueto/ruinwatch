/**
 * gen-speed-support-builds.mjs — Speed Farm and Support builds, two per class, each built
 * around its Ethereal weapon's extra class weapon legendary power and extra class passive.
 *
 * Speed Farm (category "speed"): one T16 farm and one GR speed build per class.
 *   - GR speeds start from the Ethereal solo builds (they already hit hard) and trade a slot
 *     for mobility; T16 builds favor mobility over damage.
 *   - The Ethereal's extra power/passive go to mobility where the class has one: Aether Walker
 *     (Wizard: Teleport without cooldown), Lut Socks + Pound of Flesh (Barbarian), Steed
 *     Charge + Lord Commander (Crusader), Fleet Footed (Monk), Fueled by Death (Necromancer)…
 * Support (category "support"): one "push" support (crowd control, enemies take more damage,
 * group defense) and one "speed" support (group movement, pylons) per class. The Ethereal
 * carries a cooldown power (In-geom) so buffs and debuffs are up more often, and its extra
 * passive helps the group (Unity, Creeping Death, Temporal Flux…).
 *
 * The originals these replace are kept in scripts/data/build-bases/. Builds marked
 * `fromSite` start from the Ethereal solo builds, so run gen-theorycraft-builds.mjs first:
 *
 *   node scripts/gen-theorycraft-builds.mjs && node scripts/gen-speed-support-builds.mjs  *     && node scripts/validate-build.mjs --all
 */
import { createEngine, emitBuilds } from "./lib/build-engine.mjs";

const { build, derive } = await createEngine();
const SEASON = "Season 28 (2.7.5)";

/* ── supports built from scratch (no Crusader / Witch Doctor support existed) ── */

const SUPPORT_GEAR = {
  head: "Leoric's Crown", shoulders: "Pauldrons of the Skeleton King", neck: "The Flavor of Time",
  torso: "Aquila Cuirass", hands: "Stone Gauntlets", wrists: "Nemesis Bracers",
  waist: "Captain Crimson's Silk Girdle", legs: "Captain Crimson's Thrust", feet: "Captain Crimson's Waders",
  leftfinger: "Oculus Ring", rightfinger: "Obsidian Ring of the Zodiac",
};
const SUPPORT_GEMS = ["toxin", "gogok", "iceblink"];

const zCrusader = {
  klass: "crusader", category: "support", season: SEASON, noEthereal: false,
  gear: { ...SUPPORT_GEAR, mainhand: "The Redeemer", offhand: "Stormshield" },
  kanai: ["In-geom", "Strongarm Bracers", "Dovu Energy Trap"],
  skills: [["Laws of Valor", "Critical"], ["Laws of Justice", "Faith's Armor"], ["Judgment", "Resolved"],
    ["Iron Skin", "Flash"], ["Akarat's Champion", "Rally"], ["Provoke", "Too Scared to Run"]],
  passives: ["Long Arm of the Law", "Indestructible", "Vigilant", "Hold Your Ground"],
  legendaryGems: SUPPORT_GEMS,
};
const zWitchDoctor = {
  klass: "witchdoctor", category: "support", season: SEASON, noEthereal: false,
  gear: { ...SUPPORT_GEAR, mainhand: "The Gidbinn", offhand: "Henri's Perquisition" },
  kanai: ["Messerschmidt's Reaver", "Lakumba's Ornament", "Dovu Energy Trap"],
  skills: [["Big Bad Voodoo", "Slam Dance"], ["Mass Confusion", "Paranoia"], ["Hex", "Jinx"],
    ["Piranhas", "Bogadile"], ["Horrify", "Frightening Aspect"], ["Spirit Walk", "Jaunt"]],
  passives: ["Tribal Rites", "Grave Injustice", "Spirit Vessel", "Jungle Fortitude"],
  legendaryGems: SUPPORT_GEMS,
};

const builds = [
  /* ═══════════════════════════════ SPEED FARM ═══════════════════════════════ */

  // Barbarian
  await derive("barbarian-mote-leapquake", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-barbarian-leapquake-t16", name: "Ethereal Leapquake T16", category: "speed", tier: "T16",
    tagline: "Leap · Earthquake · Lut Socks triple Leap · Ethereal: Blade of the Tribes + Pound of Flesh",
    // Weight of the Earth replaces Captain Crimson's pants so the boots slot can take Lut Socks
    // (Leap 3 times in a row) and the set stays at 6 with RoRG
    gear: { legs: "Weight of the Earth", feet: "Lut Socks" },
    ethereal: { power: "Blade of the Tribes", passive: "Pound of Flesh" },
    legendaryGems: ["trapped", "gogok", "hoarder"],
  }),
  await derive("barbarian-lod-hota", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-barbarian-lod-hota-gr", name: "Ethereal LoD HotA GR Speed", category: "speed", tier: "GR",
    tagline: "Hammer of the Ancients · LoD · Remorseless · Furious Charge for mobility",
    swapSkills: { "ground-stomp": ["Furious Charge", "Dreadnought"] },
  }),

  // Crusader
  await derive("crusader-lon-bombardment", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-crusader-bombardment-t16", name: "Ethereal Bombardment T16", category: "speed", tier: "T16",
    tagline: "Bombardment · LoN · Steed Charge (Lord Commander -25% cooldown)",
    swapSkills: { "laws-of-justice": ["Steed Charge", "Endurance"] },
  }),
  await derive("crusader-akkhan-condemn", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-crusader-akkhan-condemn-gr", name: "Ethereal Akkhan Condemn GR Speed", category: "speed", tier: "GR",
    tagline: "Condemn · Akkhan · Blade of Prophecy · Steed Charge for mobility",
    swapSkills: { justice: ["Steed Charge", "Endurance"] },
  }),

  // Demon Hunter
  await derive("demonhunter-ue-multishot", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-demonhunter-ue-multishot-t16", name: "Ethereal UE Multishot T16", category: "speed", tier: "T16",
    tagline: "Multishot · Unhallowed Essence · Yang's Recurve · Ethereal: Dawn + Hot Pursuit",
    ethereal: { power: "Dawn", passive: "Hot Pursuit" },
  }),
  await derive("speed-demonhunter-god-bounties", {
    id: "speed-demonhunter-god-bounties", name: "Ethereal GoD Speed Farm", category: "speed", tier: "GR",
    tagline: "Strafe · Gears of Dreadlands · Bounties + GR · Ethereal: Dawn + Tactical Advantage",
    gear: { mainhand: "Doomslinger" },
    ethereal: { power: "Dawn", passive: "Tactical Advantage" },
  }),

  // Monk
  await derive("monk-swk-tempest-rush", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-monk-swk-tempest-rush-t16", name: "Ethereal SWK Tempest Rush T16", category: "speed", tier: "T16",
    tagline: "Tempest Rush · Monkey King · Vengeful Wind · Ethereal: Won Khim Lau + Fleet Footed",
    ethereal: { power: "Won Khim Lau", passive: "Fleet Footed" },
  }),
  await derive("monk-poj-tempest-rush", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-monk-poj-tempest-rush-gr", name: "Ethereal PoJ Tempest Rush GR Speed", category: "speed", tier: "GR",
    tagline: "Tempest Rush · Patterns of Justice · Dashing Strike for mobility",
    swapSkills: { "mantra-of-salvation": ["Dashing Strike", "Quicksilver"] },
  }),

  // Necromancer
  await derive("speed-necromancer-vortex-mages-t16", {
    id: "speed-necromancer-vortex-mages-t16", name: "Ethereal Vortex Mages T16", category: "speed", tier: "T16",
    tagline: "Skeletal Mage · Krysbin's · Ethereal Soul Harvest (a scythe, for Dark Reaping): Scythe of the Cycle + Blood is Power",
    gear: { mainhand: "Soul Harvest" },
    ethereal: { power: "Scythe of the Cycle", passive: "Blood is Power" },
  }),
  await derive("speed-necromancer-blood-nova-gr", {
    id: "speed-necromancer-blood-nova-gr", name: "Ethereal Trag'Oul Blood Nova GR Speed", category: "speed", tier: "GR",
    tagline: "Death Nova · Trag'Oul · Ethereal: Bloodtide Blade + Fueled by Death, Funerary Pick in the cube",
    gear: { mainhand: "Blackbog's Sharp" },
    ethereal: { power: "Bloodtide Blade", passive: "Fueled by Death" },
    kanai: ["Funerary Pick", "Steuart's Greaves", "Ring of Royal Grandeur"],
  }),

  // Witch Doctor
  await derive("speed-witchdoctor-mundunugu-t16", {
    id: "speed-witchdoctor-mundunugu-t16", name: "Ethereal Mundunugu Warp Speed T16", category: "speed", tier: "T16",
    tagline: "Spirit Barrage · Mundunugu · Ethereal Arioc's Needle (Decay +200%): The Barber + Confidence Ritual",
    gear: { mainhand: "Arioc's Needle" },
    ethereal: { power: "The Barber", passive: "Confidence Ritual" },
  }),
  await derive("speed-witchdoctor-mundunugu-gr", {
    id: "speed-witchdoctor-mundunugu-gr", name: "Ethereal Mundunugu GR Speed", category: "speed", tier: "GR",
    tagline: "Spirit Barrage · Mundunugu · Ethereal Arioc's Needle: The Barber + Pierce the Veil",
    gear: { mainhand: "Arioc's Needle" },
    ethereal: { power: "The Barber", passive: "Pierce the Veil" },
  }),

  // Wizard
  await derive("wizard-firebird-meteor", {
    fromSite: true, // start from the Ethereal solo build
    id: "speed-wizard-teleport-meteor-t16", name: "Ethereal Teleport Meteor T16", category: "speed", tier: "T16",
    tagline: "Meteor · Firebird · Ethereal: Aether Walker (Teleport has no cooldown) + Glass Cannon",
    ethereal: { power: "Aether Walker", passive: "Glass Cannon" },
  }),
  await derive("wizard-firebird-explosive-blast", {
    id: "speed-wizard-firebird-explosive-blast-gr", name: "Ethereal Firebird Explosive Blast GR Speed", category: "speed", tier: "GR",
    tagline: "Explosive Blast · Firebird · Ethereal: Wand of Woh (+400%, 3 more blasts) + Glass Cannon",
    ethereal: { power: "Wand of Woh", passive: "Glass Cannon" },
  }),

  /* ════════════════════════════════ SUPPORT ═════════════════════════════════ */

  // Barbarian — The Grandfather (+200%) replaces In-geom + Gimmershred and carries In-geom
  await derive("support-zbarb", {
    id: "support-zbarb", name: "Ethereal zBarb", category: "support", tier: "S",
    tagline: "Group Support · Barbarian · Ethereal: In-geom + Unforgiving (shouts and Ignore Pain up more often)",
    gear: { mainhand: "The Grandfather", offhand: null },
    ethereal: { power: "In-geom", passive: "Unforgiving" },
  }),
  await derive("support-zbarb", {
    id: "support-zbarb-speed", name: "Ethereal zBarb Speed", category: "support", tier: "A",
    tagline: "Speed Support · Barbarian · Chilanik's War Cry + Lut Socks Leap · Ethereal: In-geom + Juggernaut",
    gear: { mainhand: "The Grandfather", offhand: null, feet: "Lut Socks" },
    ethereal: { power: "In-geom", passive: "Juggernaut" },
    swapSkills: { "ground-stomp": ["Leap", "Iron Impact"] },
  }),

  // Crusader
  build({
    ...zCrusader, id: "support-zcrusader", name: "Ethereal zCrusader", tier: "A",
    tagline: "Group Support · Crusader · Laws of Valor +50% Crit Damage · Ethereal: Akarat's Awakening + Renewal",
    ethereal: { power: "Akarat's Awakening", passive: "Renewal" },
  }),
  build({
    ...zCrusader, id: "support-zcrusader-speed", name: "Ethereal zCrusader Speed", tier: "B",
    tagline: "Speed Support · Crusader · Steed Charge twice as long · Ethereal: Swiftmount + Lord Commander",
    skills: [...zCrusader.skills.slice(0, 5), ["Steed Charge", "Endurance"]],
    ethereal: { power: "Swiftmount", passive: "Lord Commander" },
  }),

  // Demon Hunter — Windforce carries Odyssey's End (Entangling Shot: enemies take +150%)
  await derive("support-demon-hunter", {
    id: "support-demon-hunter", name: "Ethereal Support Demon Hunter", category: "support", tier: "S",
    tagline: "Group Support · Demon Hunter · Ethereal Windforce: Odyssey's End + Thrill of the Hunt",
    gear: { mainhand: "Windforce" },
    ethereal: { power: "Odyssey's End", passive: "Thrill of the Hunt" },
    kanai: ["Yang's Recurve", "Wraps of Clarity", "Ring of Royal Grandeur"],
  }),
  await derive("support-demon-hunter", {
    id: "support-demon-hunter-speed", name: "Ethereal Support Demon Hunter Speed", category: "support", tier: "A",
    tagline: "Speed Support · Demon Hunter · Vault · Ethereal Windforce: Odyssey's End + Perfectionist",
    gear: { mainhand: "Windforce" },
    ethereal: { power: "Odyssey's End", passive: "Perfectionist" },
    kanai: ["Yang's Recurve", "Wraps of Clarity", "Ring of Royal Grandeur"],
    swapSkills: { companion: ["Vault", "Tumble"] },
  }),

  // Monk
  await derive("support-zmonk", {
    id: "support-zmonk", name: "Ethereal zMonk", category: "support", tier: "A",
    tagline: "Group Support · Monk · Inna · Ethereal: In-geom + Unity (+5% damage per ally under your Mantra)",
    ethereal: { power: "In-geom", passive: "Unity" },
  }),
  await derive("support-zmonk", {
    id: "support-zmonk-speed", name: "Ethereal zMonk Speed", category: "support", tier: "B",
    tagline: "Speed Support · Monk · Dashing Strike · Ethereal: In-geom + Fleet Footed",
    ethereal: { power: "In-geom", passive: "Fleet Footed" },
    swapSkills: { "breath-of-heaven": ["Dashing Strike", "Quicksilver"] },
  }),

  // Necromancer
  await derive("support-znecromancer", {
    id: "support-znecromancer", name: "Ethereal zNecromancer", category: "support", tier: "A",
    tagline: "Group Support · Necromancer · Ethereal: In-geom + Rathma's Shield, Messerschmidt's in the cube",
    ethereal: { power: "In-geom", passive: "Rathma's Shield" },
    kanai: ["Messerschmidt's Reaver", "Strongarm Bracers", "Briggs' Wrath"],
  }),
  await derive("support-znecromancer", {
    id: "support-znecromancer-speed", name: "Ethereal zNecromancer Speed", category: "support", tier: "B",
    tagline: "Speed Support · Necromancer · Steuart's Blood Rush · Ethereal: In-geom + Fueled by Death",
    ethereal: { power: "In-geom", passive: "Fueled by Death" },
    kanai: ["Messerschmidt's Reaver", "Strongarm Bracers", "Briggs' Wrath"],
  }),

  // Witch Doctor
  build({
    ...zWitchDoctor, id: "support-zwitchdoctor", name: "Ethereal zWitch Doctor", tier: "A",
    tagline: "Group Support · Witch Doctor · Piranhas + Hex Jinx + Mass Confusion · Ethereal: In-geom + Creeping Death",
    // Creeping Death: Piranhas' damage amplification (+15% taken) lasts almost forever
    ethereal: { power: "In-geom", passive: "Creeping Death" },
  }),
  build({
    ...zWitchDoctor, id: "support-zwitchdoctor-speed", name: "Ethereal zWitch Doctor Speed", tier: "B",
    tagline: "Speed Support · Witch Doctor · Zombie Dogs for Fierce Loyalty · Ethereal: In-geom + Fierce Loyalty",
    skills: [...zWitchDoctor.skills.slice(0, 4), ["Summon Zombie Dogs", "Life Link"], ["Spirit Walk", "Jaunt"]],
    ethereal: { power: "In-geom", passive: "Fierce Loyalty" },
  }),

  // Wizard
  await derive("support-zwizard", {
    id: "support-zwizard", name: "Ethereal zWizard", category: "support", tier: "B",
    tagline: "Group Support · Wizard · Slow Time · Ethereal: In-geom + Temporal Flux",
    ethereal: { power: "In-geom", passive: "Temporal Flux" },
    kanai: ["Messerschmidt's Reaver", "Nemesis Bracers", "Ring of Royal Grandeur"],
  }),
  await derive("support-zwizard", {
    id: "support-zwizard-speed", name: "Ethereal zWizard Speed", category: "support", tier: "A",
    tagline: "Speed Support · Wizard · Teleport without cooldown · Ethereal: Aether Walker + Temporal Flux",
    ethereal: { power: "Aether Walker", passive: "Temporal Flux" },
    kanai: ["Messerschmidt's Reaver", "Nemesis Bracers", "Ring of Royal Grandeur"],
  }),
];

await emitBuilds(builds.map((b) => ({ season: SEASON, ...b })));
