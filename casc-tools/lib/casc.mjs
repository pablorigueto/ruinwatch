/**
 * casc.mjs — shared readers for the CASC Rites of Sanctuary data in casc-tools/data
 * (StringLists, GameBalance item/affix/set tables, power formulas) used by the
 * build-*-casc.mjs generators.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

export const ITEM_FILES = ["Items_Legendary.gam", "Items_Legendary_Weapons.gam", "Items_Legendary_Other.gam", "Items_Armor.gam", "Items_Weapons.gam", "Items_Other.gam"];
export const ITEM_STRIDE = 1408; // ItemTable (layout de Core/MPQ/FileFormats/GameBalance.cs, validado nos arquivos)
export const OFF = { name: 0, actor: 264, type: 268, setHash: 372, attributes: 504, families: 1000 };
export const ATTR_STRIDE = 24, ATTR_COUNT = 16;
export const ITEM_POWER_PASSIVE = 1293; // atributo Item_Power_Passive: SNOParam = power ItemPassive_*
export const AFFIX_STRIDE = 784, AFFIX_ATTRIBUTES = 608; // AffixTable: AttributeSpecifier[4] a partir de 608

export const i32 = (b, o) => b.readInt32LE(o);
export const cstr = (b, o, n) => { const s = b.subarray(o, o + n); const z = s.indexOf(0); return s.subarray(0, z < 0 ? n : z).toString("latin1"); };

// ------------------------------------------------------------------ leitores

export function readStl(name) {
  const d = readFileSync(join(DATA, "stringlists", name));
  const off = i32(d, 0x28), size = i32(d, 0x2c), out = new Map();
  const str = (o, n) => { const s = d.subarray(16 + o, 16 + o + n); const z = s.indexOf(0); return s.subarray(0, z < 0 ? s.length : z).toString("utf8"); };
  for (let i = 0; i < size / 40; i++) { const e = 16 + off + i * 40; out.set(str(i32(d, e + 8), i32(d, e + 12)), str(i32(d, e + 24), i32(d, e + 28))); }
  return out;
}

export function readPowerNames() {
  const out = new Map();
  for (const line of readFileSync(join(DATA, "Power.csv"), "utf8").split(/\r?\n/).slice(1)) {
    const [name, sno] = line.split(",");
    if (name && sno) out.set(Number(sno), name);
  }
  return out;
}

/** id interno -> { setHash, powerSno, formula(bytecode do valor do poder) } de todos os Items_*.gam. */
export function readItems() {
  const items = new Map(), attrNames = JSON.parse(readFileSync(join(DATA, "attribute-ids.json"), "utf8"));
  for (const file of ITEM_FILES) {
    const d = readFileSync(join(DATA, "gamebalance", file));
    const off = i32(d, 56), size = i32(d, 60); // ponteiro da tabela Item no header do GameBalance
    for (let i = 0; i < size / ITEM_STRIDE; i++) {
      const o = 16 + off + i * ITEM_STRIDE, id = cstr(d, o + OFF.name, 256);
      if (!id) continue;
      let powerSno = -1, formula = null;
      const attrs = []; // atributos fixos do próprio item (ex.: chance de congelar da Buriza)
      for (let k = 0; k < ATTR_COUNT; k++) {
        const a = o + OFF.attributes + k * ATTR_STRIDE, attrId = i32(d, a);
        if (attrId > 0 && attrId !== ITEM_POWER_PASSIVE) {
          const fSize = i32(d, a + 20);
          attrs.push({ attr: attrNames[attrId] ?? String(attrId), param: i32(d, a + 4), formula: fSize > 0 ? d.subarray(16 + i32(d, a + 16), 16 + i32(d, a + 16) + fSize) : null });
        }
        if (attrId !== ITEM_POWER_PASSIVE) continue;
        powerSno = i32(d, a + 4);
        const fOff = i32(d, a + 16), fSize = i32(d, a + 20); // AttributeSpecifier.Formula (serialized ints)
        if (fSize > 0) formula = d.subarray(16 + fOff, 16 + fOff + fSize);
      }
      // afixos fixos do lendário: LegendaryAffixFamily[6] @1000 (hash da família, -1 = vazio)
      const families = [];
      for (let k = 0; k < 6; k++) { const h = i32(d, o + OFF.families + k * 4); if (h !== -1 && h !== 0) families.push(h); }
      items.set(id, { file, setHash: i32(d, o + OFF.setHash), type: i32(d, o + OFF.type), powerSno, formula, families, attrs });
    }
  }
  return items;
}

export const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Todos os afixos dos AffixList*.gam: nome, famílias (hash), faixa de nível e atributos (fórmula do valor).
 *  Layout da AffixTable (784B): nome[256], AffixLevelMin @316, AffixLevelMax @320, AffixFamily0/1 @364/368,
 *  AttributeSpecifier[4] @608. */
export function readAffixes() {
  const attrNames = JSON.parse(readFileSync(join(DATA, "attribute-ids.json"), "utf8"));
  const out = [];
  for (const file of ["AffixList.gam", "1xx_AffixList.gam", "x1_AffixList.gam"]) {
    const d = readFileSync(join(DATA, "gamebalance", file));
    const off = i32(d, 136), size = i32(d, 140);
    for (let i = 0; i < size / AFFIX_STRIDE; i++) {
      const o = 16 + off + i * AFFIX_STRIDE, attrs = [];
      for (let k = 0; k < 4; k++) {
        const a = o + AFFIX_ATTRIBUTES + k * ATTR_STRIDE, id = i32(d, a);
        if (id <= 0) continue;
        const fSize = i32(d, a + 20);
        attrs.push({ attr: attrNames[id] ?? String(id), param: i32(d, a + 4), formula: fSize > 0 ? d.subarray(16 + i32(d, a + 16), 16 + i32(d, a + 16) + fSize) : null });
      }
      out.push({ file, name: cstr(d, o, 256), levelMin: i32(d, o + 316), levelMax: i32(d, o + 320), families: [i32(d, o + 364), i32(d, o + 368)], attrs });
    }
  }
  return out;
}

/** Itens cujo poder não está no próprio registro: o AffixList tem um afixo "<x1_|1xx_>ProcPower_<Nome>[Only]"
 *  com o power no AttributeSpecifier (ex.: x1_ProcPower_GoldenScourge -> "Golden Scourge"). Chave = nome
 *  normalizado. Prefere x1_ > 1xx_ > base. */
export function readProcPowers() {
  const out = new Map(), rank = (n) => (/^x1_/i.test(n) ? 2 : /^1xx_/i.test(n) ? 1 : 0);
  for (const file of ["AffixList.gam", "1xx_AffixList.gam", "x1_AffixList.gam"]) {
    const d = readFileSync(join(DATA, "gamebalance", file));
    const off = i32(d, 136), size = i32(d, 140); // ponteiro da tabela Affix
    for (let i = 0; i < size / AFFIX_STRIDE; i++) {
      const o = 16 + off + i * AFFIX_STRIDE, affix = cstr(d, o, 256);
      const m = /^(?:x1_|1xx_|P\d+_)?ProcPower_(.+?)(?:Only)?$/i.exec(affix);
      if (!m) continue;
      for (let k = 0; k < 4; k++) {
        const a = o + AFFIX_ATTRIBUTES + k * ATTR_STRIDE;
        if (i32(d, a) !== ITEM_POWER_PASSIVE) continue;
        const key = norm(m[1]), fSize = i32(d, a + 20);
        const entry = { affix, powerSno: i32(d, a + 4), formula: fSize > 0 ? d.subarray(16 + i32(d, a + 16), 16 + i32(d, a + 16) + fSize) : null };
        if (!out.has(key) || rank(affix) > rank(out.get(key).affix)) out.set(key, entry);
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ faixa do valor (VM mínima, random -> min ou max)

export function evalFormula(code, mode) {
  const st = [], f32 = (w) => { const b = Buffer.alloc(4); b.writeInt32LE(w); return b.readFloatLE(0); };
  for (let p = 0; p < code.length; p += 4) {
    const op = i32(code, p);
    if (op === 0) return st.pop();
    if (op === 6) { st.push(f32(i32(code, (p += 4)))); continue; }
    if (op === 1) {
      const fn = i32(code, (p += 4));
      if (fn === 5) { st.push(Math.floor(st.pop())); continue; }
      const b = st.pop(), a = st.pop();
      if (fn === 0) st.push(Math.min(a, b));
      else if (fn === 1) st.push(Math.max(a, b));
      else if (fn === 3) st.push(mode === "min" ? a : a + b - 1); // RandomIntMinRange(a, n): a..a+n-1
      else if (fn === 4) st.push(mode === "min" ? a : b);         // RandomIntMinMax: faixa inclusiva (tooltip 4–6)
      else if (fn === 9) st.push(mode === "min" ? a : a + b);     // RandomFloatMinRange
      else if (fn === 10) st.push(mode === "min" ? a : b);        // RandomFloatMinMax
      else throw new Error(`função ${fn}`);
      continue;
    }
    const b = st.pop(), a = st.pop();
    if (op === 11) st.push(a + b);
    else if (op === 12) st.push(a - b);
    else if (op === 13) st.push(a * b);
    else if (op === 14) st.push(b ? a / b : 0);
    else throw new Error(`opcode ${op}`);
  }
  return st.pop();
}

// ------------------------------------------------------------------ template -> formato do planner

export const round = (v, n) => Number(v.toFixed(n));

/** Menor nº de casas (0..2) que representa todos os valores. */
export const neededDecimals = (vals) => [0, 1, 2].find((n) => vals.every((v) => Math.abs(v - round(v, n)) < 1e-6)) ?? 2;

/** Arruma chaves soltas dentro de [..] dos templates do CASC (ex.: "[{VALUE}*100}|1|]"). */
export const fixTpl = (tpl) => tpl.replace(/\[([^\]]*)\]/g, (_m, body) =>
  `[${body.replace(/\{VALUE(\d?)\}/g, "§$1§").replace(/[{}]/g, "").replace(/§(\d?)§/g, "{VALUE$1}")}]`);

/** "Gain {c_magic}[{VALUE1}*100]%{/c} ..." + faixa -> { format: "Gain %d%% ...", min, max }.
 *  Valor fixo (min = max) vai direto no texto (args: 0), como o planner já fazia. Todas as ocorrências do
 *  valor viram %d (o site preenche cada %d; não entende %{0}d). Plural |4a:b; resolvido pelo valor. */
export function toPlannerFormat(tpl, range) {
  const text = tpl.replace(/\{\/?c(?:_\w*|:[^}]*)?\/?\}/g, "").replace(/\{icon:bullet\}\s*/g, "• ");
  const VALUE_RE = /\[([^\]]*\{VALUE\d?\}[^\]]*)\]|\{VALUE\d?\}/g;
  const pieces = [];
  let last = 0, lo = null, hi = null, decimals = 0;
  for (const m of text.matchAll(VALUE_RE)) {
    const body = m[1] ?? "{VALUE}", fmtSpec = /\|(\d+)\|/.exec(body)?.[1];
    const expr = body.replace(/\|[^|]*\|/g, "");
    const calc = (v) => Function(`"use strict"; return (${expr.replace(/\{VALUE\d?\}/g, `(${v})`)});`)();
    // cada expressão tem o próprio valor: "[{VALUE1}*100]% ... up to [{VALUE1}*18*100]%" são números diferentes
    const own = range ? [calc(range[0]), calc(range[1])].sort((a, b) => a - b) : null;
    const ownDec = own ? (fmtSpec !== undefined ? Number(fmtSpec) : neededDecimals(own)) : 0;
    if (own && lo === null) { [lo, hi] = own; decimals = ownDec; }
    pieces.push({ literal: text.slice(last, m.index) }, { value: true, own, ownDec });
    last = m.index + m[0].length;
  }
  pieces.push({ literal: text.slice(last) });

  const fixed = lo === null || round(lo, decimals) === round(hi, decimals);
  const shown = lo === null ? null : round(hi, decimals);
  const spec = decimals ? `%.${decimals}f` : "%d";
  // a 1ª expressão é a que varia (vira %d); as outras viram %d só se tiverem o mesmo valor, senão o próprio número
  const valueText = (p) => {
    if (!p.own) return "?";
    const same = round(p.own[0], decimals) === round(lo, decimals) && round(p.own[1], decimals) === round(hi, decimals);
    return !fixed && same ? spec : String(round(p.own[1], p.ownDec));
  };
  let format = pieces.map((p) => (p.value ? valueText(p) : p.literal.replace(/%/g, "%%"))).join("");
  format = format.replace(/\|4([^:;]*):([^;]*);/g, (_x, one, many) => ((fixed ? shown : hi) === 1 ? one : many)).trim();
  if (fixed) return { format, args: 0 };
  const out = { format, min: round(lo, decimals), max: round(hi, decimals) };
  if (decimals) out.step = 1 / 10 ** decimals;
  return out;
}

// ------------------------------------------------------------------ fase 3: sets

export const SET_STRIDE = 464, SET_ATTRIBUTES = 272, SET_ATTR_COUNT = 8; // SetItemBonusTable
export const RESOURCES = ["Mana", "Arcanum", "Fury", "Spirit", "Power", "Hatred", "Discipline", "Faith", "Essence"]; // GameBalance.Resource
/** Hash de nome do D3 (o mesmo usado nos GBIDs e no campo de set do item). */
export const gbid = (s) => [...s.toLowerCase()].reduce((h, c) => (Math.imul(h, 33) + c.charCodeAt(0)) | 0, 0);

/** hash do set -> { def: nome da definição, bonuses: [{ count, attrs: [{ attr, param, formula }] }] }. */
export function readSetBonuses() {
  const d = readFileSync(join(DATA, "gamebalance", "SetItemBonuses.gam"));
  const attrNames = JSON.parse(readFileSync(join(DATA, "attribute-ids.json"), "utf8"));
  const off = i32(d, 376), size = i32(d, 380), sets = new Map(), get = (h) => sets.get(h) ?? sets.set(h, { def: null, bonuses: [] }).get(h);
  for (let i = 0; i < size / SET_STRIDE; i++) {
    const o = 16 + off + i * SET_STRIDE, name = cstr(d, o, 256), setHash = i32(d, o + 264), count = i32(d, o + 268);
    if (setHash === -1) { if (name) get(gbid(name)).def = name; continue; } // registro de definição do set
    const attrs = [];
    for (let k = 0; k < SET_ATTR_COUNT; k++) {
      const a = o + SET_ATTRIBUTES + k * ATTR_STRIDE, id = i32(d, a);
      if (id === -1 || id === 0) continue;
      const fSize = i32(d, a + 20);
      attrs.push({ attr: attrNames[id] ?? String(id), param: i32(d, a + 4), formula: fSize > 0 ? d.subarray(16 + i32(d, a + 16), 16 + i32(d, a + 16) + fSize) : null });
    }
    if (attrs.length) get(setHash).bonuses.push({ count, attrs });
  }
  return sets;
}

