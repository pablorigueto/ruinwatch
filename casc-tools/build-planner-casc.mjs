#!/usr/bin/env node
/**
 * Corrige public/planner/planner.json a partir do CASC Rites of Sanctuary (a versão que o servidor
 * RuinWatch roda): catálogo de itens + poder lendário.
 *
 * Para cada item do planner:
 *   - id: mantém se existe no CASC; ids de patches posteriores (P76_/P77_...) viram o id do CASC com o
 *     mesmo nome de exibição (preferência _x1, a versão RoS). Se esse item já está no planner, a entrada
 *     duplicada (retrabalho de patch posterior) é removida.
 *   - name: Items.stl.
 *   - required.custom (poder lendário): texto ItemPassivePowerDescriptions.stl do power que o item aponta
 *     (atributo 1293 Item_Power_Passive) + faixa min/max da fórmula do atributo (bytecode no .gam).
 *     O `custom.id` é preservado (o planner usa para achar o item de um poder no Kanai).
 *   - builds (public/planner/builds/*.json): ids remapeados são atualizados.
 *
 * Uso: node casc-tools/build-planner-casc.mjs [--check]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DATA, RESOURCES, evalFormula, gbid, i32, norm, readItems, readPowerNames, readProcPowers, readSetBonuses, readStl, round, toPlannerFormat, fixTpl,
} from "./lib/casc.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLANNER = join(HERE, "..", "public", "planner", "planner.json");
const BUILDS_DIR = join(HERE, "..", "public", "planner", "builds");

/** Reconstrói planner.sets[*].name/bonuses a partir do CASC. Stat sem chave equivalente no planner -> mantém o grupo. */
function updateSets(planner, casc, powerNames, powerDesc) {
  const report = { renamed: [], changed: [], unmapped: [], noCasc: [] };
  const sets = readSetBonuses(), setNames = readStl("ItemSets.stl");
  const statByAttr = new Map(Object.entries(planner.stats).filter(([, v]) => v.id).map(([k, v]) => [v.id, k]));
  const statKey = (attr, param) => [param >= 0 && RESOURCES[param] ? `${attr}#${RESOURCES[param]}` : null, attr, `${attr}_Item`, attr.replace(/_Item$/, "")]
    .filter(Boolean).map((c) => statByAttr.get(c)).find(Boolean);
  const setHashOf = new Map();
  for (const it of planner.items) if (it.set) {
    const h = casc.get(it.realid ?? it.id)?.setHash;
    if (h !== undefined && h !== -1) setHashOf.set(it.set, h);
  }
  // compara sem considerar a ordem das entradas (o CASC e o dataset antigo listam stats em ordens diferentes)
  const sameish = (a, b) => JSON.stringify(a.map((e) => JSON.stringify(e)).sort()) === JSON.stringify(b.map((e) => JSON.stringify(e)).sort());
  for (const [key, set] of Object.entries(planner.sets)) {
    const casSet = sets.get(setHashOf.get(key));
    if (!casSet) { report.noCasc.push(`${key} (${set.name})`); continue; }
    const name = casSet.def && setNames.get(casSet.def)?.trim();
    if (name && name !== set.name) { report.renamed.push(`${key}: "${set.name}" -> "${name}"`); set.name = name; }
    // um set pode ter mais de um registro para a mesma quantidade de peças (ex.: Bastions of Will 2 peças)
    const byCount = new Map();
    for (const { count, attrs } of casSet.bonuses) byCount.set(count, [...(byCount.get(count) ?? []), ...attrs]);
    const groups = {};
    for (const [count, attrs] of byCount) {
      const out = [];
      let unmapped = null;
      for (const { attr, param, formula } of attrs) {
        const value = formula ? evalFormula(formula, "max") : 0;
        if (attr === "Item_Power_Passive") {
          const tpl = powerDesc.get(powerNames.get(param));
          if (tpl) out.push({ format: toPlannerFormat(tpl, [value, value]).format });
          continue;
        }
        const stat = statKey(attr, param);
        if (!stat) { unmapped = attr; break; }
        const shown = planner.stats[stat].percent ? round(value * 100, 2) : round(value, 2);
        out.push({ stat, value: [shown] });
      }
      const old = set.bonuses[count] ?? [];
      if (unmapped) { report.unmapped.push(`${key} (${count}): ${unmapped}`); groups[count] = old; continue; }
      // preserva flags extras do planner (ex.: follower) na entrada equivalente
      out.forEach((e, i) => { if (old[i]?.follower !== undefined) e.follower = old[i].follower; });
      if (!sameish(old, out)) report.changed.push(`${key} (${count} peças)\n      antes: ${JSON.stringify(old)}\n      CASC : ${JSON.stringify(out)}`);
      groups[count] = out;
    }
    for (const [count, old] of Object.entries(set.bonuses)) if (!(count in groups)) { groups[count] = old; report.changed.push(`${key} (${count} peças): sem bônus no CASC — mantido`); }
    set.bonuses = groups;
  }
  return report;
}

// ------------------------------------------------------------------ fase 5: gemas comuns

const SOCKET_STRIDE = 1416; // SocketedEffectTable: nome, I0, I1, Item(hash), ItemType(hash), AttributeSpecifier[...]

/** hash do item da gema -> { weapon|head|other: valor } (valor bruto do atributo, sem escala de %). */
function readGemEffects() {
  const d = readFileSync(join(DATA, "gamebalance", "SocketedEffects.gam"));
  const off = i32(d, 264), size = i32(d, 268), byItemHash = new Map();
  const slot = (typeHash) => (typeHash === gbid("Weapon") ? "weapon" : typeHash === gbid("Helm") ? "head" : "other");
  for (let i = 0; i < size / SOCKET_STRIDE; i++) {
    const o = 16 + off + i * SOCKET_STRIDE, item = i32(d, o + 264), type = i32(d, o + 268), fSize = i32(d, o + 272 + 20);
    if (fSize <= 0) continue;
    const formula = d.subarray(16 + i32(d, o + 272 + 16), 16 + i32(d, o + 272 + 16) + fSize);
    (byItemHash.get(item) ?? byItemHash.set(item, {}).get(item))[slot(type)] = evalFormula(formula, "max");
  }
  return byItemHash;
}

/** planner.gems.normal[*][weapon|head|other].amount = valores dos ranks 01..10 da tabela x1_ do CASC. */
function updateGems(planner) {
  const report = [], effects = readGemEffects();
  for (const [key, gem] of Object.entries(planner.gems.normal)) {
    for (const slot of ["weapon", "head", "other"]) {
      const cur = gem[slot];
      if (!cur) continue;
      const pct = planner.stats[cur.stat]?.percent;
      const next = cur.amount.map((old, i) => {
        const v = effects.get(gbid(`${gem.id}${String(i + 1).padStart(2, "0")}`))?.[slot];
        return v === undefined ? old : round(pct ? v * 100 : v, 2);
      });
      if (JSON.stringify(next) !== JSON.stringify(cur.amount)) {
        report.push(`${key} ${slot} (${cur.stat}): ${JSON.stringify(cur.amount)} -> ${JSON.stringify(next)}`);
        cur.amount = next;
      }
    }
  }
  return report;
}

// ------------------------------------------------------------------ fase 5: Altar of Rites

/** Nós do Altar = powers P75_ItemPassive_DarkAlchemy*: nome `_name`, efeito `_var_stats`, ambientação `_desc`.
 *  A simulação do planner lê o % de dano do `desc`, então o texto do CASC também corrige o DPS. */
function updateAltar(planner) {
  const report = [], powers = readStl("Powers.stl");
  // remove tags de cor e espaços extras, mas mantém as quebras de linha (ex.: tabela de recursos do Vigor)
  const clean = (t) => (t ?? "").replace(/\{\/?c(?:_\w*|:[^}]*)?\/?\}/g, "").split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n").trim();
  const byName = new Map();
  for (const [k, v] of powers) if (/^P75_ItemPassive_DarkAlchemy\w+_name$/.test(k)) byName.set(v.trim(), k.slice(0, -"_name".length));
  for (const [key, node] of Object.entries(planner.altar ?? {})) {
    const power = byName.get(node.name);
    if (!power) { report.push(`${key} (${node.name}): sem power no CASC — mantido`); continue; }
    const desc = clean(powers.get(`${power}_var_stats`)), flavor = clean(powers.get(`${power}_desc`));
    if (desc && !desc.includes("{") && desc !== node.desc) { report.push(`${key} (${node.name}): "${node.desc}" -> "${desc}"`); node.desc = desc; }
    if (flavor && !flavor.includes("{") && flavor !== node.flavor) node.flavor = flavor;
  }
  return report;
}

// ------------------------------------------------------------------ fase 5: nomes de skills/runas/passivas

/** Sincroniza planner.skills/passives com public/skills/skills.json (gerado do CASC por build-skills-casc.mjs). */
function updateSkillNames(planner) {
  const report = [], skills = JSON.parse(readFileSync(join(HERE, "..", "public", "skills", "skills.json"), "utf8"));
  for (const [cls, list] of Object.entries(planner.skills)) {
    const casc = skills.classes[cls];
    if (!casc) continue; // "attack" (ataques básicos) não é classe
    const bySlug = new Map(casc.active.map((s) => [s.slug, s]));
    for (const s of Object.values(list)) {
      const c = bySlug.get(s.id);
      if (!c) continue;
      if (c.name !== s.name) { report.push(`${cls} skill: "${s.name}" -> "${c.name}"`); s.name = c.name; }
      for (const r of c.runes) if (s.runes?.[r.letter] !== undefined && s.runes[r.letter] !== r.name) { report.push(`${cls} ${c.name} runa ${r.letter}: "${s.runes[r.letter]}" -> "${r.name}"`); s.runes[r.letter] = r.name; }
    }
    const passives = new Map(casc.passive.map((p) => [p.slug, p]));
    for (const p of Object.values(planner.passives[cls] ?? {})) {
      const c = passives.get(p.id);
      if (c && c.name !== p.name) { report.push(`${cls} passiva: "${p.name}" -> "${c.name}"`); p.name = c.name; }
    }
  }
  return report;
}

// ------------------------------------------------------------------ main

function main() {
  const check = process.argv.includes("--check");
  const planner = JSON.parse(readFileSync(PLANNER, "utf8"));
  const casc = readItems(), procPowers = readProcPowers();
  const names = readStl("Items.stl"), powerDesc = readStl("ItemPassivePowerDescriptions.stl"), attrDesc = readStl("AttributeDescriptions.stl");
  const powerNames = readPowerNames();
  const display = (id) => (names.get(id) ?? "").trim();
  const byName = new Map();
  for (const id of casc.keys()) { const n = display(id); if (n) byName.set(n, [...(byName.get(n) ?? []), id]); }
  const prefer = (ids) => [...ids].sort((a, b) => score(b) - score(a))[0];
  const score = (id) => (/_x1$/.test(id) ? 1000 : 0) + (Number(/^[Pp](\d+)_/.exec(id)?.[1] ?? 0)) - (/_(104|1xx)$/.test(id) ? 500 : 0);

  const report = { renamed: [], remapped: [], dropped: [], powerText: [], powerRange: [], powerViaAffix: [], powerViaAttr: [], powerUnverified: [], noCasc: [] };
  const plannerIds = new Set(planner.items.map((x) => x.id));
  const idMap = new Map(); // id antigo -> id CASC (para builds)
  // mesmo tratamento para os itens e para as poções lendárias (HealthPotionLegendary_*)
  const processList = (list) => {
  const kept = [];
  for (const item of list) {
    let id = item.id;
    const realId = item.realid && casc.has(item.realid) ? item.realid : null;
    if (!casc.has(id) && !realId) {
      const candidates = (byName.get(item.name.trim()) ?? []).filter((c) => casc.has(c));
      if (!candidates.length) { report.noCasc.push(`${id} (${item.name})`); kept.push(item); continue; }
      const already = candidates.find((c) => plannerIds.has(c));
      if (already) { report.dropped.push(`${id} -> já existe ${already} (${item.name})`); idMap.set(id, already); continue; }
      const target = prefer(candidates);
      report.remapped.push(`${id} -> ${target} (${item.name})`);
      idMap.set(id, target);
      item.id = id = target;
      delete item.current;
    }
    const cascId = realId ?? id, rec = casc.get(cascId);
    const name = display(cascId);
    if (name && name !== item.name) { report.renamed.push(`${id}: "${item.name}" -> "${name}"`); item.name = name; }

    // poder lendário
    const custom = item.required?.custom;
    if (custom && !custom.options) {
      // 1) poder no próprio item (atributo 1293); 2) afixo "*_ProcPower_<NomeDoItem>" do AffixList
      const proc = rec.powerSno > 0 ? null : procPowers.get(norm(item.name));
      const source = proc ?? rec;
      const powerName = powerNames.get(source.powerSno);
      let tpl = powerName && powerDesc.get(powerName);
      let formula = source.formula;
      // 3) sem poder: efeito num atributo do próprio item (ex.: Leoric's Crown = Gem_Attributes_Multiplier).
      //    Só quando há UM atributo com texto de 1 valor (a cura base das poções não conta).
      if (!tpl) {
        const own = rec.attrs.filter((a) => a.formula && a.attr !== "Hitpoints_Granted" && /\{VALUE1?\}/.test(attrDesc.get(a.attr) ?? "") && !/\{VALUE2\}/.test(attrDesc.get(a.attr)));
        if (own.length === 1) { tpl = fixTpl(attrDesc.get(own[0].attr)); formula = own[0].formula; report.powerViaAttr.push(`${id} (${item.name}) <- ${own[0].attr}`); }
      }
      if (!tpl) {
        report.powerUnverified.push(`${id} (${item.name}): "${custom.format.slice(0, 70)}…"`); // mantém o texto atual
      } else {
        if (proc) report.powerViaAffix.push(`${id} (${item.name}) <- ${proc.affix}`);
        const range = formula ? [evalFormula(formula, "min"), evalFormula(formula, "max")] : null;
        const next = toPlannerFormat(tpl, range);
        if (next.format !== custom.format) report.powerText.push(`${id} (${item.name})\n      antes: ${custom.format}\n      CASC : ${next.format}`);
        if ((custom.min ?? null) !== (next.min ?? null) || (custom.max ?? null) !== (next.max ?? null))
          report.powerRange.push(`${id} (${item.name}): ${custom.min ?? "-"}–${custom.max ?? "-"} -> ${next.min ?? "-"}–${next.max ?? "-"}`);
        for (const k of ["format", "min", "max", "args", "step", "altformat"]) delete custom[k];
        Object.assign(custom, next);
      }
    }
    kept.push(item);
  }
  return kept;
  };
  planner.items = processList(planner.items);
  planner.potions = processList(planner.potions);

  // builds: ids remapeados
  const buildChanges = [];
  for (const f of readdirSync(BUILDS_DIR).filter((x) => x.endsWith(".json") && x !== "index.json")) {
    const path = join(BUILDS_DIR, f);
    let text = readFileSync(path, "utf8"), changed = false;
    for (const [from, to] of idMap) if (text.includes(`"${from}"`)) { text = text.split(`"${from}"`).join(`"${to}"`); changed = true; buildChanges.push(`${f}: ${from} -> ${to}`); }
    if (changed && !check) writeFileSync(path, text);
  }

  const section = (title, rows) => console.log(`\n## ${title} (${rows.length})\n` + rows.map((r) => `  - ${r}`).join("\n"));
  section("Nomes corrigidos", report.renamed);
  section("Ids remapeados (patch posterior -> CASC)", report.remapped);
  section("Entradas duplicadas removidas (retrabalho de patch posterior)", report.dropped);
  section("Poder lido do afixo ProcPower (vínculo por nome)", report.powerViaAffix);
  section("Poder NÃO verificado no CASC (texto atual mantido)", report.powerUnverified);
  section("Faixa do poder mudou", report.powerRange);
  section("Texto do poder mudou", report.powerText);
  section("Builds atualizadas", buildChanges);
  section("Itens sem correspondência no CASC (mantidos)", report.noCasc);

  // fase 3: sets
  const setReport = updateSets(planner, casc, powerNames, powerDesc);
  section("Sets: nome corrigido", setReport.renamed);
  section("Sets: bônus mudou", setReport.changed);
  section("Sets: bônus com stat sem mapeamento (grupo atual mantido)", setReport.unmapped);
  section("Sets sem correspondência no CASC (mantidos)", setReport.noCasc);

  // fase 5: gemas comuns
  section("Gemas comuns: valores por rank mudaram", updateGems(planner));
  section("Altar of Rites: texto/valor mudou", updateAltar(planner));
  section("Skills/runas/passivas: nome mudou", updateSkillNames(planner));

  if (!check) {
    planner.generatedFrom = "CASC Rites of Sanctuary (casc-tools/build-planner-casc.mjs): itens, poderes, sets, gemas comuns, Altar e nomes de skills; faixas de afixo/stats validadas por amostragem";
    writeFileSync(PLANNER, JSON.stringify(planner));
  }
}

main();
