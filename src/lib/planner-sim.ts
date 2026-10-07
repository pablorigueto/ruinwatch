/**
 * planner-sim.ts — character-sheet DPS / Toughness / Recovery.
 *
 * Port of the *sheet* math of an Apache-2.0 project (see THIRD_PARTY_NOTICES.md) — the
 * big numbers on the D3 inventory screen): HP, mitigation, weapon DPS, crit,
 * attack speed, recovery. It is NOT the full combat simulator (no skill
 * rotations, set multipliers or breakpoints). Values here match the in-game character
 * sheet given the same gear, which is what the summary panel reports.
 *
 * Inputs are read from the shared BuildState + planner data; weapon base damage
 * and attack speed come from data.itemTypes[<weapon type>].
 */
import {
  BuildState,
  PARAGON,
  PARAGON_CATS,
  PAPERDOLL_SLOTS,
  PlannerData,
  SlotId,
  normalGemEffect,
} from "./planner";

export interface SheetResult {
  dps: number;
  hp: number;
  toughness: number;
  recovery: number;
  /** breakdown for display */
  primary: number;
  vit: number;
  chc: number;
  chd: number;
  ias: number;
  armor: number;
  resAll: number;
  aps: number;
  /** which weapon base was used (null if no weapon equipped). */
  weaponType: string | null;
  primaryStat: "str" | "dex" | "int";
  /** sheet DPS before the elemental multiplier — base for combat-DPS. */
  baseDps: number;
}

/** Combat DPS for a skill = sheet DPS × the skill's canonical weapon-damage
 *  coefficient (from the CASC .pow extraction). The sheet DPS (`sheet.dps`)
 *  already folds in weapon damage, crit, attack speed, main stat and elemental,
 *  so multiplying by the skill coefficient gives that skill's damage rate. */
export function combatDps(sheet: SheetResult, coeff: number): number {
  return sheet.dps * coeff;
}

const PRIMARY_BY_CLASS: Record<string, "str" | "dex" | "int"> = {
  barbarian: "str", crusader: "str",
  demonhunter: "dex", monk: "dex",
  wizard: "int", witchdoctor: "int", necromancer: "int",
};

/** hpPerVit by level — matches the OSS table (level 70 = 100). */
function hpPerVit(level: number): number {
  if (level >= 70) return 100;
  if (level > 65) return 5 * level - 270;
  if (level > 60) return 4 * level - 205;
  if (level > 35) return level - 25;
  return 10;
}

/** Accumulate a flat stat map from gear affixes, normal gems and paragon. */
function gather(data: PlannerData, build: BuildState): Record<string, number> {
  const s: Record<string, number> = {};
  const add = (k: string, v: number) => {
    if (k && Number.isFinite(v)) s[k] = (s[k] ?? 0) + v;
  };
  for (const slot of PAPERDOLL_SLOTS) {
    const ss = build.equipped[slot];
    if (!ss) continue;
    for (const [stat, v] of Object.entries(ss.affixes)) add(stat, v);
    const ctx: "weapon" | "head" | "other" =
      slot === "mainhand" || slot === "offhand" ? "weapon" : slot === "head" ? "head" : "other";
    for (const g of ss.gems) {
      if (g.legendary) continue;
      const color = data.gems.normal[g.gem];
      const eff = color ? normalGemEffect(color, ctx, g.rank) : null;
      if (eff) add(eff.stat, eff.value);
    }
  }
  for (const cat of PARAGON_CATS) {
    for (const b of PARAGON[cat]) {
      const pts = build.paragon[cat][b.key] ?? 0;
      if (pts && b.per) add(b.key, pts * b.per);
    }
  }
  return s;
}

export function computeSheet(data: PlannerData, build: BuildState): SheetResult {
  const level = build.paragon.level > 0 ? 70 : 70; // sheet assumes max level 70
  const primaryStat = PRIMARY_BY_CLASS[build.klass] ?? "str";
  const s = gather(data, build);

  // base attributes at level 70 + class primary bonus
  const baseStat = 7 + level;
  const primary = baseStat + 2 * level + (s[primaryStat] ?? 0) + (s.mainstat ?? 0);
  const vit = 7 + 2 * level + (s.vit ?? 0);
  const chc = 5 + (s.chc ?? 0);
  const chd = 50 + (s.chd ?? 0);
  const ias = s.ias ?? 0;
  const lifePct = s.life ?? 0;
  const armorFlat = s.armor ?? 0;
  const resAll = s.resall ?? 0;

  // HP
  const hp = (36 + 4 * level + vit * hpPerVit(level)) * (1 + 0.01 * lifePct);

  // weapon base from the equipped main-hand item's type, plus the weapon's own
  // +damage affix roll (wpn* / "damage" %) — matches the engine's calcWeapon().
  const mh = build.equipped.mainhand;
  const oh = build.equipped.offhand;
  const mhItem = mh ? data.items.find((i) => i.id === mh.itemId) : null;
  const ohItem = oh ? data.items.find((i) => i.id === oh.itemId) : null;

  const critfactor = 1 + 0.01 * chc * 0.01 * chd;

  // Per-weapon DPS: engine adds the slot's flat weapon-damage roll, then scales
  // by (1 + damage%) and (1 + primary%). `ss` is the configured slot for the
  // weapon-specific affixes (wpnphy/wpnfir add flat min/max damage).
  const weaponDph = (
    w: { speed: number; min: number; max: number } | null | undefined,
    ss: BuildState["equipped"][SlotId] | undefined,
  ): { dph: number; speed: number } | null => {
    if (!w) return null;
    let min = w.min;
    let max = w.max;
    // flat weapon-damage affix (e.g. wpnphy/wpnfir) adds to the base range
    if (ss) {
      for (const [stat, v] of Object.entries(ss.affixes)) {
        if (stat.startsWith("wpn")) { min += v; max += v; }
      }
    }
    const dmgPct = s.damage ?? 0; // +% damage affixes already gathered
    const avg = ((min + max) * 0.5) * (1 + 0.01 * dmgPct) * (1 + 0.01 * primary);
    return { dph: avg * critfactor, speed: w.speed };
  };

  const wType = mhItem ? data.itemTypes?.[mhItem.type]?.weapon : null;
  const ohType = ohItem ? data.itemTypes?.[ohItem.type]?.weapon : null;

  let dps = 0;
  let aps = 0;
  if (wType && ohType) {
    const A = weaponDph(wType, mh)!;
    const B = weaponDph(ohType, oh)!;
    const a = Math.min(5, A.speed * (1 + 0.01 * (ias + 15)));
    const b = Math.min(5, B.speed * (1 + 0.01 * (ias + 15)));
    aps = 2 / (1 / a + 1 / b);
    dps = ((A.dph + B.dph) * aps) / 2;
  } else if (wType) {
    const A = weaponDph(wType, mh)!;
    aps = Math.min(5, A.speed * (1 + 0.01 * ias));
    dps = A.dph * aps;
  }
  // elemental skill damage (best element) multiplies the sheet DPS. The flat
  // damage% is already folded into weaponDph above, so it's not re-applied here.
  const elemental = Math.max(
    s.dmgphy ?? 0, s.dmgfir ?? 0, s.dmgcol ?? 0, s.dmglit ?? 0,
    s.dmgarc ?? 0, s.dmgpsn ?? 0, s.dmghol ?? 0,
  );
  const finalDps = dps * (1 + 0.01 * elemental);

  // canonical defensive passive bonuses (CASC) for equipped passives.
  let armorPct = 0;
  let resallPct = 0;
  let passiveDr = 0; // multiplicative DR layers
  for (const slug of build.skills.passives) {
    const def = slug ? data.defenseBuffs?.[slug] : undefined;
    if (!def) continue;
    if (def.kind === "armor") armorPct += def.pct;
    else if (def.kind === "resall") resallPct += def.pct;
    else if (def.kind === "dr") passiveDr = 1 - (1 - passiveDr) * (1 - 0.01 * def.pct);
  }
  const armorEff = armorFlat * (1 + 0.01 * armorPct);
  const resallEff = resAll * (1 + 0.01 * resallPct);

  // mitigation -> toughness. Faithful to the engine's sheet:
  //   armor_factor = 1/(1 + armor/(50·lvl)); res_factor = 1/(1 + resAll/(5·lvl))
  //   plus generic damage reduction, dodge, and block contribute to EHP.
  const armorFactor = 1 / (1 + armorEff / (level * 50));
  const resFactor = 1 / (1 + resallEff / (level * 5));
  // generic DR = item dmgred combined multiplicatively with passive DR.
  const dmgRedRaw = 1 - (1 - Math.min(0.95, (s.dmgred ?? 0) / 100)) * (1 - passiveDr);
  const dmgRed = Math.max(0, Math.min(95, dmgRedRaw * 100)); // % generic reduction
  const dodge = Math.max(0, Math.min(95, s.dodge ?? 0)); // % dodge (monk/dex)
  // block: shields reduce a fraction of hits; approximate EHP gain from block%.
  const block = Math.max(0, Math.min(100, s.block ?? 0));
  const defenseFactor = armorFactor * resFactor * (1 - 0.01 * dmgRed);
  let toughness = hp / defenseFactor / (1 - 0.01 * dodge);
  // block contributes a modest EHP bump (blocked hits take reduced damage).
  toughness *= 1 + 0.01 * block * 0.3;

  // recovery: life regen + life-per-second + life-on-hit·aps + life-per-kill,
  // scaled by how tanky you are (toughness/hp), matching the engine's recovery.
  const healing =
    (s.regen ?? 0) +
    (s.regen_percent ?? 0) * 0.01 * hp +
    (s.lph ?? 0) * (aps || 1) +
    (s.laek ?? 0) * 0.16 +
    (s.lpk ?? 0) * 0.1;
  const recovery = (healing * toughness) / hp;

  return {
    dps: finalDps,
    hp,
    toughness,
    recovery,
    primary,
    vit,
    chc,
    chd,
    ias,
    armor: Math.round(armorEff),
    resAll: Math.round(resallEff),
    aps,
    weaponType: mhItem?.type ?? null,
    primaryStat,
    /** the bare sheet DPS without the elemental multiplier, used as the
     *  per-hit base for combat-DPS = sheetDps × skill coefficient. */
    baseDps: dps,
  };
}
