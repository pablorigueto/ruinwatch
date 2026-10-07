#!/usr/bin/env node
/**
 * Audita/corrige o Codex de itens (public/items/items.json) contra o CASC Rites of Sanctuary.
 * O Codex foi raspado do site da Blizzard, que mostra a versão MAIS RECENTE do jogo (patches
 * posteriores ao cliente RuinWatch). Para cada item:
 *   1. existe no CASC? (ids de retrabalho posterior, ex.: P76_*, não existem)
 *   2. nome (Items.stl)
 *   3. poder lendário: texto + faixa (ItemPassivePowerDescriptions.stl + fórmula do atributo 1293)
 *   4. afixos fixos: o atributo de cada linha azul confere com as famílias LegendaryAffixFamily do item
 *   5. bônus de set: texto + valores (SetItemBonuses.gam)
 *
 * Uso: node casc-tools/build-codex-casc.mjs [--check] [--report <arquivo.md>]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESOURCES, evalFormula, gbid, norm, readAffixes, readItems, readPowerNames, readProcPowers,
  readSetBonuses, readStl, toPlannerFormat, fixTpl,
} from "./lib/casc.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CODEX = join(HERE, "..", "public", "items", "items.json");
const PLANNER = join(HERE, "..", "public", "planner", "planner.json");
const DAMAGE_TYPES = ["Physical", "Fire", "Lightning", "Cold", "Poison", "Arcane", "Holy"];

// ------------------------------------------------------------------ texto

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const strip = (html) => decode((html ?? "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
// número: vírgula só como separador de milhar ("16,000"), não a vírgula da frase ("at least 2, and")
const N = String.raw`-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?`;
const NUM = new RegExp(String.raw`\[\s*${N}\s*[-–]\s*${N}\s*\]|${N}`, "g");
/** Forma do texto sem números: compara "o que o item faz" independente dos valores. */
const shape = (t) => t.toLowerCase().replace(/•/g, " ").replace(NUM, "#").replace(/[+]/g, "").replace(/[’']/g, "'").replace(/\s+/g, " ").replace(/[\s.]+$/, "").trim();
/** Números do texto (faixa [a - b] vira a, b), sem separador de milhar. */
const nums = (t) => [...t.matchAll(NUM)].flatMap((m) => m[0].replace(/[[\]\s]/g, "").replace(/,/g, "").split(/[-–](?=\d)/).filter(Boolean).map(Number));
/** Números em ordem; uma faixa [a - b] vira o par [a, b]. */
const tokens = (t) => [...t.matchAll(NUM)].map((m) => m[0].replace(/[[\]\s,]/g, "").split(/[-–](?=\d)/).filter(Boolean).map(Number));
const near = (a, b) => Math.abs(a - b) <= Math.max(0.051, Math.abs(a) * 0.005);
const RANGE_AT_END = /\[\s*(-?[\d.,]+)\s*[-–]\s*(-?[\d.,]+)\s*\]\s*%?\s*$/;
/** Linha de poder do Codex: "texto com valor rolado (X Only) [a - b]%" -> { text, range }. */
function codexPower(line) {
  const t = strip(line).replace(/\s?\((?:Barbarian|Crusader|Demon Hunter|Monk|Necromancer|Witch Doctor|Wizard) Only\)/g, "");
  const m = RANGE_AT_END.exec(t);
  const num = (s) => Number(s.replace(/,/g, ""));
  // valor fixo: o Codex repete o número sozinho no fim ("... every 120 seconds. 120")
  const unrepeat = (s) => s.replace(/([.!:])\s+-?\d[\d,]*(?:\.\d+)?%?$/, "$1").trim();
  return m ? { text: unrepeat(t.slice(0, m.index).trim()), range: [num(m[1]), num(m[2])] } : { text: unrepeat(t), range: null };
}
/** Mesmos valores? Onde o CASC tem faixa, o Codex mostra um valor rolado + a faixa no fim da linha. */
function sameValues(cdx, casc) {
  const a = tokens(cdx.text), b = tokens(casc);
  if (a.length !== b.length) return false;
  return b.every((tb, i) => {
    if (tb.length === 2) return cdx.range ? near(cdx.range[0], tb[0]) && near(cdx.range[1], tb[1]) : a[i][0] >= tb[0] - 0.051 && a[i][0] <= tb[1] + 0.051;
    return a[i].length === 1 && near(a[i][0], tb[0]);
  });
}
const sameNums = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= Math.max(0.051, Math.abs(v) * 0.005));

/** Template do CASC + faixa -> texto como o Codex mostra ("... [5 - 8]% ..."). */
function render(tpl, range) {
  const f = toPlannerFormat(fixTpl(tpl), range);
  const spec = /%(\.\d+f|d)/;
  const fmt = (v, d) => (d ? v.toFixed(d) : String(Math.round(v)));
  const dec = f.step ? Math.round(-Math.log10(f.step)) : 0;
  let text = f.format;
  if (f.min !== undefined) while (spec.test(text)) text = text.replace(spec, `[${fmt(f.min, dec)} - ${fmt(f.max, dec)}]`);
  return text.replace(/%%/g, "%").replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim();
}

// ------------------------------------------------------------------ CASC

const items = readItems(), names = readStl("Items.stl"), powerDesc = readStl("ItemPassivePowerDescriptions.stl");
const powerNames = readPowerNames(), procPowers = readProcPowers(), attrDesc = readStl("AttributeDescriptions.stl");
const sets = readSetBonuses(), setNames = readStl("ItemSets.stl");
const lowerId = new Map([...items.keys()].map((id) => [id.toLowerCase(), id]));
const display = (id) => (names.get(id) ?? "").trim();
const byName = new Map();
for (const id of items.keys()) { const n = display(id); if (n) byName.set(n, [...(byName.get(n) ?? []), id]); }
const idScore = (id) => (/_x1$/i.test(id) ? 1000 : 0) + Number(/^[Pp](\d+)_/.exec(id)?.[1] ?? 0) - (/_(104|1xx)$/.test(id) ? 500 : 0);

const famIndex = new Map();
for (const a of readAffixes()) for (const h of a.families) if (h !== -1 && h !== 0) (famIndex.get(h) ?? famIndex.set(h, []).get(h)).push(a);

/** Chaves de AttributeDescriptions para um atributo + param (elemento, recurso ou power). */
const attrKeys = (attr, param) => [DAMAGE_TYPES[param] && `${attr}#${DAMAGE_TYPES[param]}`, RESOURCES[param] && `${attr}#${RESOURCES[param]}`, attr, attr.replace(/_Item$/, "")].filter(Boolean);
const attrTemplate = (attr, param) => attrKeys(attr, param).map((k) => attrDesc.get(k)).find(Boolean);
/** Atributos com nomes diferentes para o mesmo efeito (template do texto x afixo do item). Levantado dos
 *  pares que mais divergiam na 1ª auditoria. */
const ALIAS = {
  Crit_Percent_Bonus_Capped: "Critical_Chance", Movement_Scalar: "Movement_Speed",
  Damage_Type_Percent_Bonus: "Damage_Dealt_Percent_Bonus", Amplify_Damage_Type_Percent: "Damage_Dealt_Percent_Bonus",
  Attacks_Per_Second_Item_Percent: "Attacks_Per_Second_Percent",
};
const baseAttr = (attr) => {
  const b = attr.replace(/#.*$/, "").replace(/_Item$/, "").replace(/^Weapon_(On_Hit_)/, "$1");
  return ALIAS[b] ?? b;
};
/** Dano base da arma: o Codex mostra no bloco de dano, não como linha azul. */
const WEAPON_DAMAGE = /^Damage_(?:Weapon_)?(?:Bonus_)?(?:Min|Delta)(?:_X1)?$/;

/** forma do texto -> atributos-base que o geram (para identificar as linhas azuis do Codex). */
const shapeToAttrs = new Map();
for (const [key, tpl] of attrDesc) {
  if (!tpl || /_Explanation|_desc$/i.test(key)) continue;
  const s = shape(fixTpl(tpl).replace(/\[[^\]]*\]/g, "1").replace(/\{VALUE\d?\}/g, "1").replace(/\{[^}]*\}/g, ""));
  (shapeToAttrs.get(s) ?? shapeToAttrs.set(s, new Set()).get(s)).add(baseAttr(key));
}

function cascId(entry) {
  const seg = entry.url.split("/").pop();
  for (let k = 0; k < seg.length; k++) if (seg[k] === "-") { const id = lowerId.get(seg.slice(k + 1).toLowerCase()); if (id) return { id, exact: true }; }
  const cands = byName.get(entry.name.trim()) ?? [];
  return cands.length ? { id: [...cands].sort((a, b) => idScore(b) - idScore(a))[0], exact: false } : null;
}

function cascPower(id, name) {
  const rec = items.get(id);
  const src = rec.powerSno > 0 ? rec : procPowers.get(norm(name));
  const tpl = src && powerDesc.get(powerNames.get(src.powerSno));
  if (!tpl) return null;
  const range = src.formula ? [evalFormula(src.formula, "min"), evalFormula(src.formula, "max")] : null;
  return render(tpl, range);
}

function cascSetBonuses(setHash) {
  const set = sets.get(setHash);
  if (!set) return null;
  const byCount = new Map();
  for (const { count, attrs } of set.bonuses) for (const { attr, param, formula } of attrs) {
    const v = formula ? evalFormula(formula, "max") : 0;
    const tpl = attr === "Item_Power_Passive" ? powerDesc.get(powerNames.get(param)) : attrTemplate(attr, param);
    const text = tpl ? render(tpl, [v, v]) : `?${attr}`;
    byCount.set(count, [...(byCount.get(count) ?? []), text]);
  }
  return { name: set.def && setNames.get(set.def)?.trim(), byCount };
}

// ------------------------------------------------------------------ auditoria

const ORANGE = /d3-color-ffff8000/;
const BLUE = /d3-color-ff6969ff/;

function audit(codex) {
  const r = {
    missing: [], remapped: [], renamed: [], powerText: [], powerRange: [], powerNoCasc: [], affixExtra: [], affixMissing: [], setText: [], setValues: [],
    fixes: { remaps: [], powers: [], sets: [] },
  };
  for (const x of codex) {
    if (!["legendary", "set", "ethereal"].includes(x.rarity)) { if (!cascId(x)) r.missing.push(`${x.rarity} ${x.name}`); continue; }
    const hit = cascId(x);
    if (!hit) { r.missing.push(`${x.rarity} ${x.name} [${x.url.split("/").pop()}]`); continue; }
    if (!hit.exact) { r.remapped.push(`${x.name}: ${x.url.split("/").pop()} -> ${hit.id}`); r.fixes.remaps.push({ entry: x, id: hit.id }); }
    const id = hit.id, rec = items.get(id), label = `${x.name} (${id})`;
    const nm = display(id);
    if (nm && nm !== x.name) r.renamed.push(`${label}: "${x.name}" -> "${nm}"`);

    // 3. poder lendário
    // linha inteira do poder (o valor vem num <span> aninhado)
    const shown = [...x.primary, ...x.secondary].filter((l) => ORANGE.test(l)).map(codexPower).filter((c) => c.text);
    const power = cascPower(id, x.name);
    if (shown.length && !power) {
      r.powerNoCasc.push(`${label}: "${shown[0].text.slice(0, 90)}"`);
      r.fixes.powers.push({ entry: x, text: null }); // nesta versão o item não tem poder lendário
    }
    if (shown.length && power) {
      const cdx = { text: shown.map((c) => c.text).join(" "), range: shown.find((c) => c.range)?.range ?? null };
      const s = cdx.text + (cdx.range ? ` [${cdx.range.join(" - ")}]` : "");
      const textDiff = shape(cdx.text) !== shape(power), valueDiff = !textDiff && !sameValues(cdx, power);
      if (textDiff) r.powerText.push(`${label}\n      Codex: ${s}\n      CASC : ${power}`);
      if (valueDiff) r.powerRange.push(`${label}\n      Codex: ${s}\n      CASC : ${power}`);
      if (textDiff || valueDiff) r.fixes.powers.push({ entry: x, text: power });
    }

    // 4. afixos fixos (atributo de cada linha azul x famílias do CASC). Ethereals ficam de fora: no CASC
    // suas famílias são genéricas e as linhas reais vêm de tabela própria (ver memória do servidor).
    if (x.rarity === "ethereal") continue;
    const blue = [...x.primary, ...x.secondary].filter((l) => BLUE.test(l)).map(strip).filter((t) => !/random magic propert/i.test(t));
    const choices = (x.choice ?? []).map((c) => c.slice(1).map(strip));
    const famAttrs = rec.families.map((h) => new Set((famIndex.get(h) ?? []).flatMap((a) => a.attrs.map((t) => baseAttr(t.attr)))));
    const innate = new Set(rec.attrs.map((t) => baseAttr(t.attr))); // fixos no próprio item (não são família)
    const matched = new Set();
    const lineAttrs = (t) => new Set([...(shapeToAttrs.get(shape(t)) ?? [])].map(baseAttr));
    for (const group of [...blue.map((t) => [t]), ...choices]) {
      const cands = new Set(group.flatMap((t) => [...lineAttrs(t)]));
      if (!cands.size) continue; // linha sem template conhecido (não dá para afirmar nada)
      const fi = famAttrs.findIndex((fa, i) => !matched.has(i) && [...cands].some((c) => fa.has(c)));
      if (fi >= 0) matched.add(fi);
      else if (![...cands].some((c) => innate.has(c))) r.affixExtra.push(`${label}: "${group.join(" / ").slice(0, 90)}" não é afixo fixo deste item no CASC`);
    }
    famAttrs.forEach((fa, i) => {
      if (matched.has(i) || !fa.size || [...fa].every((a) => WEAPON_DAMAGE.test(a))) return;
      // mostradas de outro jeito no Codex: o poder (linha laranja), "+X% dano de <skill>" ({POWER} no texto)
      // e famílias de sorteio genérico (vários atributos diferentes = uma das N propriedades)
      if (fa.has("Item_Power_Passive") || fa.has("Power_Damage_Percent_Bonus")) return;
      if ([...fa].filter((a) => !WEAPON_DAMAGE.test(a)).length >= 3) return;
      const shownAny = [...blue, ...choices.flat()].some((t) => [...lineAttrs(t)].some((c) => fa.has(c)));
      if (!shownAny) r.affixMissing.push(`${label}: afixo fixo do CASC ausente no Codex (${[...fa].slice(0, 4).join(", ")})`);
    });

    // 5. bônus de set: junta as frases de todas as peças (o Codex divide alguns bônus entre peças)
    if (x.rarity === "set" && x.item_set?.bonuses?.length && rec.setHash !== -1) {
      const cs = cascSetBonuses(rec.setHash);
      if (!cs) continue;
      for (const b of x.item_set.bonuses) {
        const count = Number(/\((\d+)\)/.exec(strip(b))?.[1]);
        const key = `${x.item_set.name}|${count}`;
        const g = setGroups.get(key) ?? setGroups.set(key, { name: x.item_set.name, count, codex: new Set(), casc: cs.byCount.get(count) ?? [] }).get(key);
        for (const part of b.split(/<br\s*\/?>/)) for (const s of sentences(strip(part).replace(/^\(\d+\)\s*Set:\s*/i, ""))) g.codex.add(s);
      }
    }
  }
  for (const g of setGroups.values()) {
    const cascS = g.casc.flatMap(sentences);
    const label = `${g.name} (${g.count} peças)`;
    if (!cascS.length) { r.setText.push(`${label}: sem bônus no CASC`); continue; }
    const onlyCodex = [...g.codex].filter((s) => !cascS.some((c) => shape(c) === shape(s)));
    const onlyCasc = cascS.filter((c) => ![...g.codex].some((s) => shape(c) === shape(s)));
    const wrongNums = [...g.codex].filter((s) => cascS.some((c) => shape(c) === shape(s) && !sameNums(nums(s), nums(c))));
    if (onlyCodex.length || onlyCasc.length) {
      r.setText.push(`${label}\n      só no Codex: ${onlyCodex.join(" ") || "-"}\n      só no CASC : ${onlyCasc.join(" ") || "-"}`);
      r.fixes.sets.push({ name: g.name, count: g.count, texts: g.casc });
    } else if (wrongNums.length) {
      r.setValues.push(`${label}: ${wrongNums.join(" ")}`);
      r.fixes.sets.push({ name: g.name, count: g.count, texts: g.casc });
    }
  }
  return r;
}

const CLASS_ONLY = /\s?\((?:Barbarian|Crusader|Demon Hunter|Monk|Necromancer|Witch Doctor|Wizard) Only\)/g;
/** Frases de um bônus (sem o "(Classe Only)"), para comparar sem depender da ordem. */
const sentences = (t) => t.replace(CLASS_ONLY, "").split(/(?<=[.!])\s+/).map((s) => s.replace(/^•\s*/, "").trim()).filter(Boolean);
const setGroups = new Map();

// ------------------------------------------------------------------ correção

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// a faixa "[a - b]%" ganha o mesmo destaque (d3-color-magic) que o valor tem nas linhas originais do Codex
const highlight = (html) => html.replace(/\[[^\]]+\]%?/g, (m) => `<span class="d3-color-magic">${m}</span>`);
const powerLine = (text, classSpan) => `<span class="d3-color-ffff8000"> ${highlight(esc(text))}</span>${classSpan ? ` ${classSpan}` : ""}`;
const setLine = (count, texts) => `(${count}) Set: <br/> ` + texts.map((t) => `<span class="tooltip-icon-bullet"></span> ${esc(t)}`).join("<br/> ");

/** Aplica as correções no JSON do Codex. Retorna o texto final (slugs remapeados trocados em todo o arquivo). */
function apply(codex, fixes) {
  for (const { entry, text } of fixes.powers) {
    for (const key of ["primary", "secondary"]) {
      const i = entry[key].findIndex((l) => ORANGE.test(l));
      if (i < 0) continue;
      const classSpan = /<span class="d3-color-ffff0000">\([^)]*Only\)<\/span>/.exec(entry[key][i])?.[0];
      if (text === null) entry[key].splice(i, 1);
      else entry[key][i] = powerLine(text, classSpan);
      break;
    }
  }
  for (const { name, count, texts } of fixes.sets) {
    for (const x of codex) {
      if (x.item_set?.name !== name) continue;
      const i = x.item_set.bonuses.findIndex((b) => Number(/\((\d+)\)/.exec(strip(b))?.[1]) === count);
      if (i >= 0) x.item_set.bonuses[i] = setLine(count, texts);
    }
  }
  // item trocado pela versão do CASC: a etiqueta "(Classe Only)" do retrabalho pode não valer mais
  // (ex.: Cluckeye P76 era só WD; o Cluckeye do CASC é um arco comum). Fonte: tipo do item no planner.
  const planner = JSON.parse(readFileSync(PLANNER, "utf8"));
  const typeOf = new Map(planner.items.map((it) => [it.id, it.type]));
  const classBound = (id) => { const t = planner.itemTypes[typeOf.get(id)]; return !!t?.class || t?.classes?.length === 1; };
  const slugMap = [];
  for (const { entry, id } of fixes.remaps) {
    if (!classBound(id)) for (const key of ["primary", "secondary"]) entry[key] = entry[key].map((l) => l.replace(/\s?<span class="d3-color-ffff0000">\([^)]*Only\)<\/span>/, ""));
    const oldId = entry.url.split("/").pop().slice(entry.slug.length - (entry.slug.length - entry.slug.lastIndexOf("-") - 1));
    const slug = `${entry.slug.slice(0, entry.slug.lastIndexOf("-"))}-${id}`;
    slugMap.push([entry.slug, slug]);
    entry.slug = slug;
    entry.url = entry.url.replace(oldId, id);
    entry.icon_file = `${id.toLowerCase()}_demonhunter_male.png`;
    entry.icon_url = `https://assets.diablo3.blizzard.com/d3/icons/items/small/${entry.icon_file}`;
  }
  let text = JSON.stringify(codex);
  for (const [from, to] of slugMap) text = text.split(from).join(to); // links "relacionados" de outros itens
  return { text, slugMap };
}

function main() {
  const check = process.argv.includes("--check");
  const codex = JSON.parse(readFileSync(CODEX, "utf8"));
  const r = audit(codex);
  const out = [];
  const section = (title, rows) => out.push(`\n## ${title} (${rows.length})\n` + rows.map((x) => `  - ${x}`).join("\n"));
  section("Itens que não existem no CASC", r.missing);
  section("Id de patch posterior -> versão do CASC", r.remapped);
  section("Nome diferente", r.renamed);
  section("Poder lendário: TEXTO diferente", r.powerText);
  section("Poder lendário: só os VALORES diferentes", r.powerRange);
  section("Poder lendário sem correspondência no CASC", r.powerNoCasc);
  section("Afixo fixo no Codex que o item não tem no CASC", r.affixExtra);
  section("Afixo fixo do CASC que o Codex não mostra", r.affixMissing);
  section("Bônus de set: TEXTO diferente", r.setText);
  section("Bônus de set: só os VALORES diferentes", r.setValues);
  const text = out.join("\n");
  const ri = process.argv.indexOf("--report");
  if (ri > 0) writeFileSync(process.argv[ri + 1], text);
  console.log(text.split("\n").filter((l) => l.startsWith("## ")).join("\n"));
  const f = r.fixes;
  console.log(`\ncorreções: ${f.powers.length} poderes, ${f.sets.length} bônus de set, ${f.remaps.length} itens trocados pela versão do CASC`);
  if (check) return;
  const { text: out2, slugMap } = apply(codex, f);
  writeFileSync(CODEX, out2);
  for (const [a, b] of slugMap) console.log(`  slug: ${a} -> ${b}`);
  console.log(`gravado ${CODEX}`);
}

main();
