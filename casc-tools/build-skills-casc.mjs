#!/usr/bin/env node
/**
 * Reescreve public/skills/skills.json (texto das skills, runas e passivas) a partir do CASC
 * Rites of Sanctuary — a versão que o servidor RuinWatch roda (outros patches têm valores diferentes,
 * ex.: Slash B stun 2s em versões posteriores, 1.5s aqui).
 *
 * Fontes (todas copiadas em casc-tools/, sem código compartilhado com o servidor):
 *   data/skillkit/*.skl            lista de skills/passivas, categoria (SkillGroup) e nível
 *   data/stringlists/*.stl         nomes e templates de tooltip do cliente (Powers, AttributeDescriptions, SkillsUI)
 *   pow/*.pow                      bytecode das ScriptFormulas -> valores, executado por uma VM igual à do jogo
 *   data/PowerFormulaTables.gam    Table(Healing, nível) etc.
 *   data/Power.csv                 SNO -> nome do power (para PowerTag)
 *   data/power-keys.json           nome -> tagId das PowerKeys ({Resource Cost}, {Cooldown Time}...)
 *   data/attribute-ids.json        id -> nome dos atributos (Rune_A..E, Level...)
 *
 * Atualiza as entradas existentes NO LUGAR (casando pelo nome): mantém slug, ícone e ordem; troca
 * name/level/category/cost/descRuns/runes. Valores para personagem nível 70, sem passivas/itens.
 *
 * Uso: node casc-tools/build-skills-casc.mjs [--check]   (--check: só relata, não grava)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "data");
const POW_DIR = join(HERE, "pow");
const SKILLS_JSON = join(HERE, "..", "public", "skills", "skills.json");
const LEVEL = 70;

// slug do skills.json -> [arquivo .skl, prefixo Cat_* do SkillsUI.stl]
const CLASSES = {
  barbarian: ["Barbarian.skl", "Barb"],
  crusader: ["X1_Crusader.skl", "Crusader"],
  demonhunter: ["Demonhunter.skl", "DHunter"],
  monk: ["Monk.skl", "Monk"],
  witchdoctor: ["WitchDoctor.skl", "WitchDoc"],
  wizard: ["Wizard.skl", "Wiz"],
  necromancer: ["Necromancer.skl", "Necromancer"],
};
const RUNES = ["a", "b", "c", "d", "e"];
// Cor fixa por letra, provada no CASC por EffectGroups descritivos (ex.: wizard_frostNova_crimson_addDamage =
// A Bone Chill; DH_Preparation_indigo_willpower = B Invigoration; Barbarian_WotB_alabaster_addDeathExplode =
// E Slaughter). O scrape do Battle.net trazia A/B invertidos (a=indigo, b=crimson).
const RUNE_COLOR = { a: "crimson", b: "indigo", c: "obsidian", d: "golden", e: "alabaster" };

// Ids de tabela do GameBalance no bytecode DESTA versão (derivados cruzando "Table(Nome" com o id
// compilado em todos os .pow; ex.: 59/59 fórmulas Table(Healing) -> 94). SF_N relativo = 23+N, N=0..63.
const BALANCE_TABLE_IDS = { 87: "DmgTier1", 88: "DmgTier2", 90: "DmgTier4", 94: "Healing", 95: "WDCost", 102: "LegendaryProcDmg" };

class Runtime extends Error {} // depende de estado de jogo (APS, buffs, random)

const f32 = (v) => Math.fround(v);
const i32 = (buf, off) => buf.readInt32LE(off);

// ------------------------------------------------------------------ leitores do CASC

/** StringList: header SNO (16B) + tabela de entradas de 40B (label, texto). */
function readStl(name) {
  const d = readFileSync(join(DATA, "stringlists", name));
  const off = i32(d, 0x28), size = i32(d, 0x2c);
  const str = (o, n) => {
    const s = d.subarray(16 + o, 16 + o + n);
    const z = s.indexOf(0);
    return s.subarray(0, z < 0 ? s.length : z).toString("utf8");
  };
  const out = new Map();
  for (let i = 0; i < size / 40; i++) {
    const e = 16 + off + i * 40;
    out.set(str(i32(d, e + 8), i32(d, e + 12)), str(i32(d, e + 24), i32(d, e + 28)));
  }
  return out;
}

/** SkillKit: TraitEntry (16B: SNO, cat, ReqLevel, ?) e ActiveSkillEntry (64B: SNO, cat, SkillGroup, ReqLevel, ...). */
function readSkillKit(file) {
  const d = readFileSync(join(DATA, "skillkit", file));
  const traits = [], actives = [];
  for (let i = 0, off = i32(d, 0x28), size = i32(d, 0x2c); i < size / 16; i++) {
    const e = 16 + off + i * 16;
    traits.push({ sno: i32(d, e), level: i32(d, e + 8) });
  }
  for (let i = 0, off = i32(d, 0x38), size = i32(d, 0x3c); i < size / 64; i++) {
    const e = 16 + off + i * 64;
    actives.push({ sno: i32(d, e), group: i32(d, e + 8), level: i32(d, e + 12) });
  }
  return { traits, actives };
}

/** PowerFormulaTables.gam: entradas de 1328B = nome (1024B) + 76 floats. */
function readBalanceTables() {
  const d = readFileSync(join(DATA, "PowerFormulaTables.gam"));
  const tables = {};
  for (let o = d.indexOf("DmgTier1\0"); o + 1328 <= d.length + 24; o += 1328) {
    const name = d.subarray(o, o + 1024).toString("latin1").split("\0")[0];
    if (!/^\w+$/.test(name)) break;
    tables[name] = Array.from({ length: 76 }, (_, i) => d.readFloatLE(o + 1024 + i * 4));
  }
  return tables;
}

function readPowerNames() {
  const bySno = new Map(), byName = new Map();
  for (const line of readFileSync(join(DATA, "Power.csv"), "utf8").split(/\r?\n/).slice(1)) {
    const [name, sno] = line.split(",");
    if (!name || !sno) continue;
    bySno.set(Number(sno), name);
    byName.set(name.toLowerCase(), name);
  }
  return { bySno, byName };
}

/** {tagId: {text, code}} de toda TagMapEntry type=4 (ScriptFormula), na ordem de busca do jogo
 *  (GeneralTagMap antes de TagMap e ContactTagMaps). Layout: 8 int32 (NameSize=[5], OpcodeSize=[7]),
 *  texto + NUL + pad 4, opcodes. */
function scanPow(name) {
  const d = readFileSync(join(POW_DIR, `${name}.pow`));
  const out = new Map();
  for (let o = 0; o + 40 < d.length; o += 4) {
    if (i32(d, o) !== 4) continue;
    const tag = i32(d, o + 4), nameSize = i32(d, o + 28), opSize = i32(d, o + 36);
    if (!(nameSize > 0 && nameSize < 2048 && opSize > 0 && opSize < 8192 && opSize % 4 === 0)) continue;
    const p = o + 40, end = d.indexOf(0, p);
    if (end < 0 || end - p + 1 !== nameSize) continue;
    const q = p + nameSize + ((4 - (nameSize % 4)) % 4);
    if (q + opSize > d.length || i32(d, q + opSize - 4) !== 0) continue;
    if (!out.has(tag)) out.set(tag, { text: d.subarray(p, end).toString("latin1").trim(), code: d.subarray(q, q + opSize) });
  }
  return out;
}

/** Valor Int de uma TagMapEntry type 3 (GBID) — ex.: PowerKeys.ItemTypeRequirement. */
function readTagGbid(name, tag) {
  const d = readFileSync(join(POW_DIR, `${name}.pow`));
  for (let o = 0; o + 12 <= d.length; o += 4) if (i32(d, o) === 3 && i32(d, o + 4) === tag) return i32(d, o + 8);
  return -1;
}

/** Hash de nome do D3 (GBID): h = h*33 + c, minúsculas, int32. */
const gbid = (s) => [...s.toLowerCase()].reduce((h, c) => (Math.imul(h, 33) + c.charCodeAt(0)) | 0, 0);

const slotTag = (n) => 266496 + 256 * Math.floor(n / 10) + 16 * (n % 10);

// ------------------------------------------------------------------ VM (espelho do ScriptFormulaEvaluator do jogo)

class Evaluator {
  constructor() {
    this.tables = readBalanceTables();
    this.names = readPowerNames();
    this.keys = JSON.parse(readFileSync(join(DATA, "power-keys.json"), "utf8"));
    this.attrs = JSON.parse(readFileSync(join(DATA, "attribute-ids.json"), "utf8"));
    this.pows = new Map();
    this.root = null; // power renderizado: dono das runas e único com sLevel = 1
  }

  pow(name) {
    if (!this.pows.has(name)) this.pows.set(name, scanPow(name));
    return this.pows.get(name);
  }

  isEquippable(name) {
    return /_Passive_|ItemPassive/.test(name) && name !== this.root;
  }

  tag(power, tag, rune) {
    const f = this.pow(power).get(tag);
    return f ? this.run(f.code, power, rune) : 0; // slot inexistente = 0 (igual ao jogo)
  }

  slot(power, n, rune) {
    return this.tag(power, slotTag(n), rune);
  }

  /** {Resource Cost}, {Cooldown Time}, "Spirit Gained"... -> PowerKey pelo nome. */
  named(power, label, rune) {
    const m = /^script formula (\d+)$/i.exec(label.trim());
    if (m) return this.slot(power, Number(m[1]), rune);
    const key = label.trim().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, "");
    const tag = this.keys[key];
    if (tag === undefined || !this.pow(power).has(tag)) throw new Runtime(label);
    return this.tag(power, tag, rune);
  }

  ref(other, tag, rune) {
    if (!this.isEquippable(other)) return this.tag(other, tag, rune); // companheiro: mesma runa
    try {
      return this.tag(other, tag, null); // passiva/lendário não equipado: sLevel 0, sem runa
    } catch (e) {
      if (e instanceof Runtime) return 0;
      throw e;
    }
  }

  run(code, power, rune) {
    const st = [];
    for (let pos = 0; pos < code.length; pos += 4) {
      const op = i32(code, pos);
      if (op === 0) return f32(st[st.length - 1]); // jogo devolve o topo da pilha
      if (op === 1) {
        const fn = i32(code, (pos += 4));
        if (fn === 0 || fn === 1) { const b = st.pop(), a = st.pop(); st.push(fn === 0 ? Math.min(a, b) : Math.max(a, b)); }
        else if (fn === 2) { const hi = st.pop(), lo = st.pop(), x = st.pop(); st.push(lo > x ? lo : x > hi ? hi : x); }
        else if (fn === 5) st.push(Math.floor(st.pop()));
        else if (fn === 11) {
          const index = st.pop(), id = new Int32Array(new Float32Array([st.pop()]).buffer)[0];
          if (!BALANCE_TABLE_IDS[id]) throw new Error(`tabela id ${id}`);
          st.push(this.tables[BALANCE_TABLE_IDS[id]][Math.trunc(index)]);
        } else if ([3, 4, 9, 10].includes(fn)) throw new Runtime("random");
        else throw new Error(`função ${fn}`);
      } else if (op === 5) {
        st.push(this.identifier(power, rune, i32(code, pos + 4), i32(code, pos + 8), i32(code, pos + 12)));
        pos += 16;
      } else if (op === 6) {
        st.push(code.readFloatLE((pos += 4)));
      } else if ([8, 11, 12, 13, 14].includes(op)) {
        const b = st.pop(), a = st.pop();
        st.push(op === 8 ? Number(a > b) : op === 11 ? a + b : op === 12 ? a - b : op === 13 ? a * b : b ? a / b : 0);
      } else if (op === 16) st.push(-st.pop());
      else if (op === 17) { const c = st.pop(), b = st.pop(), a = st.pop(); st.push(a !== 0 ? b : c); }
      else throw new Error(`opcode ${op}`);
      st[st.length - 1] = f32(st[st.length - 1]); // o jogo opera em float32
    }
    throw new Error("bytecode sem return");
  }

  identifier(power, rune, kind, a, b) {
    if (kind === 0) {
      const name = this.attrs[a] ?? String(a);
      const m = /^Rune_([A-E])$/.exec(name);
      // b < 0 = power atual (vale nos companheiros, ex.: Companion_Passive "Rune_A ? 1.4"); b = SNO = dono explícito
      if (m) return Number(rune === m[1].toLowerCase() && (b < 0 || this.names.bySno.get(b) === this.root));
      if (name === "Level" || name === "Effective_Level") return LEVEL;
      throw new Runtime(name);
    }
    if (kind === 1) return Number(power === this.root); // sLevel
    if (kind === 22) return this.ref(this.names.bySno.get(a), b, rune); // PowerTag.<SNO>.<tag>
    if (kind >= 23 && kind <= 86) return this.slot(power, kind - 23, rune); // SF_N
    if (BALANCE_TABLE_IDS[kind]) return new Float32Array(new Int32Array([kind]).buffer)[0];
    throw new Runtime(`identificador ${kind}`); // bTraitActive, mHealthMin...
  }
}

// ------------------------------------------------------------------ template de tooltip -> runs

/** Arredondamento do cliente: meio vai para o PAR (2.5 -> 2, 12.5 -> 12; Golem A / Haunt D). */
const roundHalfEven = (v, decimals = 0) => {
  const m = 10 ** decimals, x = v * m, r = Math.round(x);
  const fixed = Math.abs(x % 1) === 0.5 ? (r % 2 === 0 ? r : r - 1) : r;
  return (fixed / m).toFixed(decimals);
};
const fmt = (v, decimals) => {
  if (decimals !== undefined) return roundHalfEven(v, decimals);
  if (Math.abs(v - Math.round(v)) < 1e-6 || Math.abs(v) >= 10) return roundHalfEven(v); // cliente arredonda valores grandes
  return String(Number(roundHalfEven(v, 2)));
};
// separador de milhar do cliente: só a partir de 5 dígitos (12,000 · 26,821; mas 5364 · 7000)
const group = (n) => n.replace(/^(-?\d{5,})(\.\d+)?$/, (_, i, d = "") => i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + d);

/** Resolve placeholders e devolve parágrafos de runs; texto entre {c_*}...{/c*} é destaque (hl). */
function render(template, ev, power, rune) {
  if (!template) return [];
  const value = (label) => ev.named(power, label, rune);
  let s = template.replace(/\[([^\]]+)\]/g, (_, body) => {
    const opt = /\|([^|]*)\|/.exec(body)?.[1];
    let expr = body.replace(/\|[^|]*\|/g, "");
    try {
      expr = expr.replace(/\{([^}]+)\}/g, (_m, label) => String(value(label)));
      expr = expr.replace(/PowerTag\.(\w+)\."([^"]+)"/g, (_m, other, label) => String(ev.named(other, label, rune)));
      expr = expr.replace(/[%{}]/g, ""); // lixo dos templates: "[{SF 10}*100%]", "[{SF 14} * 100}]"
      if (!/^[\d\s.+\-*/()eE]+$/.test(expr)) throw new Runtime(expr);
      const v = Function(`"use strict"; return (${expr});`)();
      return (opt === "+" && v >= 0 ? "+" : "") + group(fmt(v, /^\d+$/.test(opt ?? "") ? Number(opt) : 0));
    } catch (e) {
      if (e instanceof Runtime) return "?";
      throw e;
    }
  });
  s = s.replace(/\{(?!\/?c(?:_|:|\/?\})|icon)([^}]+)\}/g, (_, label) => {
    try {
      return group(fmt(value(label)));
    } catch (e) {
      if (e instanceof Runtime) return "?";
      throw e;
    }
  });
  // plural do cliente: "|4singular:plural;" concorda com o último número antes dele
  s = s.replace(/\|4([^:;]*):([^;]*);/g, (_m, one, many, at, whole) => {
    const nums = whole.slice(0, at).match(/-?\d+(?:\.\d+)?/g);
    return nums && Number(nums[nums.length - 1].replace(/,/g, "")) === 1 ? one : many;
  });
  s = s.replace(/\{icon:\w+\}\s*/g, "");

  return s.split(/\n\s*\n|\n/).map((para) => {
    // pilha de cores: o cliente aninha ({c_yellow}… {c_green}1{/c_green} …{/c_yellow}); o site só tem um
    // destaque, usado para valores e rótulos -> hl = cor do topo é verde (valor) ou dourada (Cost:/Active:)
    const runs = [], colors = [];
    for (const part of para.split(/(\{\/?c(?:_\w*|:[^}]*)?\/?\})/)) {
      if (/^\{\/?c/.test(part)) {
        if (part.startsWith("{/")) colors.pop();
        else colors.push(part);
        continue;
      }
      if (!part) continue;
      const hl = /^\{c_(green|gold|red)\b/.test(colors[colors.length - 1] ?? ""); // red = custo de vida (Necro)
      const last = runs[runs.length - 1];
      if (last && last.hl === hl) last.text += part;
      else runs.push({ text: part, hl });
    }
    return runs;
  }).filter((p) => p.some((r) => r.text.trim()));
}

/** Cabeçalho da tooltip (Cost/Generate/Cooldown/Requires) vs. efeito: primeiro parágrafo se for de custo. */
function splitHeader(desc) {
  const i = desc.indexOf("\n\n");
  if (i > 0 && /cost|generate|cooldown|charge/i.test(desc.slice(0, i))) return [desc.slice(0, i), desc.slice(i + 2)];
  return ["", desc];
}

// ------------------------------------------------------------------ build

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function main() {
  const check = process.argv.includes("--check");
  const ev = new Evaluator();
  const powers = readStl("Powers.stl"), attr = readStl("AttributeDescriptions.stl"), ui = readStl("SkillsUI.stl");
  const json = JSON.parse(readFileSync(SKILLS_JSON, "utf8"));
  const requiresTpl = readStl("UIToolTips.stl").get("RequiresItemType") ?? "Requires {s1}";
  const itemTypeByGbid = new Map([...readStl("ItemTypeNames.stl")].map(([key, label]) => [gbid(key), label]));
  const report = [];

  for (const [slug, [skl, catPrefix]] of Object.entries(CLASSES)) {
    const cls = json.classes[slug];
    if (!cls) continue;
    const kit = readSkillKit(skl);
    const groups = [...new Set(kit.actives.map((e) => e.group))].sort((x, y) => x - y);
    const catName = (g) => (ui.get(`Cat_${catPrefix}${groups.indexOf(g) + 1}`) ?? String(g)).trim();
    const byName = new Map(cls.active.map((s) => [norm(s.name), s]));
    const passByName = new Map(cls.passive.map((s) => [norm(s.name), s]));
    let actives = 0, passives = 0;

    for (const e of kit.actives) {
      const pname = ev.names.bySno.get(e.sno);
      const name = powers.get(`${pname}_name`)?.trim();
      const entry = name && byName.get(norm(name));
      if (!entry) { report.push(`${slug}: skill sem par no skills.json: ${name} (${pname})`); continue; }
      ev.root = pname;
      const [header, body] = splitHeader(powers.get(`${pname}_desc`) ?? "");
      entry.name = name;
      entry.level = e.level;
      entry.category = catName(e.group);
      entry.cost = render(header, ev, pname, null);
      entry.descRuns = render(body, ev, pname, null);
      const req = itemTypeByGbid.get(readTagGbid(pname, ev.keys.ItemTypeRequirement));
      if (req) entry.descRuns.push([{ text: requiresTpl.replace("{s1}", req), hl: false }]); // UIToolTips RequiresItemType
      entry.runes = RUNES.map((r) => ({
        letter: r,
        color: RUNE_COLOR[r],
        name: (attr.get(`NameRune_${r.toUpperCase()}#${pname}`) ?? "").trim(),
        descRuns: render(attr.get(`Rune_${r.toUpperCase()}#${pname}`) ?? "", ev, pname, r),
      }));
      actives++;
    }

    for (const t of kit.traits) {
      const pname = ev.names.bySno.get(t.sno);
      const name = pname && powers.get(`${pname}_name`)?.trim();
      const entry = name && passByName.get(norm(name));
      if (!entry) continue; // traits sem passiva jogável correspondente (ex.: Trait_*_Fury)
      ev.root = pname;
      entry.name = name;
      entry.level = t.level;
      // passivas: o efeito fica em _var_stats; _desc é o texto de lore
      entry.descRuns = render(powers.get(`${pname}_var_stats`) ?? powers.get(`${pname}_desc`) ?? "", ev, pname, null);
      passives++;
    }
    report.push(`${slug}: ${actives}/${cls.active.length} ativas, ${passives}/${cls.passive.length} passivas`);
  }

  json.scrapedFrom = "CASC Rites of Sanctuary (casc-tools/build-skills-casc.mjs)";
  const unresolved = JSON.stringify(json).match(/"text":"[^"]*\?[^"]*"/g)?.length ?? 0;
  report.push(`trechos com valor de runtime ("?"): ${unresolved}`);
  console.log(report.join("\n"));
  if (!check) writeFileSync(SKILLS_JSON, JSON.stringify(json, null, 2) + "\n");
}

main();
