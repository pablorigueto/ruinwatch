/**
 * pow-parser.mjs — parse a Diablo III .pow file enough to recover each skill's
 * ScriptFormula bytecode, and a stack-VM to evaluate it. Independent re-impl of
 * the server's Power.cs + ScriptFormulaEvaluator.cs (no shared code).
 *
 * Exports:
 *   parsePow(buf)  -> { slots: [{name}], scriptFormulas: Map<tagId, Uint8Array> }
 *   evalFormula(opcodes, ctx) -> number   (ctx: { slevel, level, runes, table(name,index)? })
 *   resolveSF(buf, n, ctx)    -> valor do ScriptFormula(N), seguindo SF_N e PowerTag
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* ---- low-level readers ------------------------------------------------- */

function readCString(buf, off, max) {
  let end = off;
  const limit = off + max;
  while (end < limit && buf[end] !== 0) end++;
  return buf.toString("latin1", off, end);
}

/* ---- .pow structure ---------------------------------------------------- */

const SFD_PTR_OFF = 1088; // serialized ScriptFormulaDetails pointer
const SFD_ENTRY = 256 + 512 + 4 + 4; // 776

/** Parse the ScriptFormulaDetails (slot names). */
export function parseSlotNames(buf) {
  const off = buf.readInt32LE(SFD_PTR_OFF) + 16; // +16 file header (see server)
  const size = buf.readInt32LE(SFD_PTR_OFF + 4);
  if (off <= 16 || size <= 0 || off + size > buf.length) return [];
  const count = Math.floor(size / SFD_ENTRY);
  const slots = [];
  for (let i = 0; i < count; i++) {
    const base = off + i * SFD_ENTRY;
    slots.push({ index: i, name: readCString(buf, base, 256) });
  }
  return slots;
}

/* ---- TagMap + ScriptFormula -------------------------------------------
 * The PowerDef TagMap holds ScriptFormula entries. Rather than fully model
 * PowerDef's many TagMaps, we scan the file for ScriptFormula blocks: each
 * begins with a TagMapEntry { Type=4, TagID } followed by the ScriptFormula
 * struct. We locate them by walking TagMaps from PowerDef at offset 108.
 * ----------------------------------------------------------------------- */

/** Read one ScriptFormula struct at `pos`; returns { opcodes, name, next }. */
function readScriptFormula(buf, pos) {
  // I0..I4, NameSize, I5, OpcodeSize  => 8 int32
  const nameSize = buf.readInt32LE(pos + 5 * 4);
  const opcodeSize = buf.readInt32LE(pos + 7 * 4);
  let p = pos + 8 * 4;
  const name = readCString(buf, p, nameSize);
  p += nameSize;
  // pad NameSize up to 4-byte alignment
  const pad = (4 - (nameSize % 4)) % 4;
  p += pad;
  const opcodes = buf.subarray(p, p + opcodeSize);
  return { name, opcodes, next: p + opcodeSize };
}

/** Parse a TagMap at `pos`: returns { entries: Map<tagId,{type,...}>, next }. */
function readTagMap(buf, pos) {
  const size = buf.readInt32LE(pos);
  let p = pos + 4;
  const entries = new Map();
  for (let i = 0; i < size; i++) {
    const type = buf.readInt32LE(p);
    const tagId = buf.readInt32LE(p + 4);
    p += 8;
    switch (type) {
      case 1: // float
        entries.set(tagId, { type, float: buf.readFloatLE(p) });
        p += 4;
        break;
      case 4: { // ScriptFormula
        const sf = readScriptFormula(buf, p);
        entries.set(tagId, { type, opcodes: sf.opcodes, name: sf.name });
        p = sf.next;
        break;
      }
      case 0: case 2: case 3: case 5: case 6: case 7:
        entries.set(tagId, { type, int: buf.readInt32LE(p) });
        p += 4;
        break;
      default:
        // unknown type — bail to avoid desync
        return { entries, next: p, bad: true };
    }
  }
  return { entries, next: p };
}

/** Scan the whole file for ScriptFormula structs by signature. Each struct:
 *  8×int32 header (I0..I4, NameSize, I5, OpcodeSize), then NameSize bytes of a
 *  NUL-terminated printable name, padded to 4-byte alignment, then OpcodeSize
 *  bytes of opcodes. This is far more robust than reversing PowerDef's exact
 *  multi-TagMap byte layout. Returns formulas in file order (dedup by name+ops).
 *  The primary block's formulas appear in slot order, which we use to align with
 *  the slot-name list. */
export function scanScriptFormulas(buf) {
  const out = [];
  const seen = new Set();
  for (let p = 108; p < buf.length - 40; p += 4) {
    const nameSize = buf.readInt32LE(p + 5 * 4);
    const opcodeSize = buf.readInt32LE(p + 7 * 4);
    if (nameSize < 2 || nameSize > 200 || opcodeSize < 4 || opcodeSize > 4000) continue;
    const nameOff = p + 8 * 4;
    if (nameOff + nameSize > buf.length) continue;
    const raw = buf.toString("latin1", nameOff, nameOff + nameSize);
    if (raw[raw.length - 1] !== "\0") continue; // must be NUL-terminated within NameSize
    const name = raw.replace(/\0+$/, "");
    if (!/^[\x20-\x7e]+$/.test(name) || !/[A-Za-z0-9]/.test(name)) continue;
    const pad = (4 - (nameSize % 4)) % 4;
    const opStart = nameOff + nameSize + pad;
    if (opStart + opcodeSize > buf.length) continue;
    const opcodes = buf.subarray(opStart, opStart + opcodeSize);
    // opcodes must end with a return (0) opcode to be a valid formula
    if (opcodes[opcodes.length - 4] !== 0) continue;
    const key = name + ":" + opcodeSize;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ pos: p, name, opcodes });
  }
  return out;
}

/** Align scanned formulas to slot indices. The primary block's formulas appear
 *  in slot order; we skip the leading item-passive PowerTag refs (which aren't
 *  real slots) and pair the rest with the slot-name list by order. Returns an
 *  array indexed by slot with { name, formulaName, opcodes }. */
export function parsePow(buf) {
  const slots = parseSlotNames(buf);
  const formulas = scanScriptFormulas(buf);
  // drop item-passive PowerTag refs — they aren't slot formulas
  const slotFormulas = formulas.filter((f) => !/^PowerTag\./.test(f.name));
  const bySlot = slots.map((s, i) => ({
    index: i,
    name: s.name,
    formula: slotFormulas[i]?.name ?? null,
    opcodes: slotFormulas[i]?.opcodes ?? null,
  }));
  return { slots, formulas, bySlot };
}

/** TagID for ScriptFormula(N) — matches the server's PowerTagHelper:
 *  266496 + 256*floor(N/10) + 16*(N%10). */
export function sfTagId(n) {
  return 266496 + 256 * Math.floor(n / 10) + 16 * (n % 10);
}

/** Find a ScriptFormula in a .pow by its exact TagID (scans for the
 *  TagMapEntry signature [int Type=4][int TagID] + ScriptFormula struct).
 *  Returns { name, opcodes } or null. */
export function findFormulaByTag(buf, tagId) {
  for (let p = 0; p < buf.length - 40; p += 4) {
    if (buf.readInt32LE(p) !== 4 || buf.readInt32LE(p + 4) !== tagId) continue;
    const sp = p + 8;
    const nameSize = buf.readInt32LE(sp + 5 * 4);
    const opcodeSize = buf.readInt32LE(sp + 7 * 4);
    if (nameSize < 1 || nameSize > 200 || opcodeSize < 4 || opcodeSize > 4000) continue;
    const nameOff = sp + 8 * 4;
    if (nameOff + nameSize > buf.length) continue;
    const raw = buf.toString("latin1", nameOff, nameOff + nameSize);
    const name = raw.replace(/\0.*$/, "");
    if (!/^[\x20-\x7e]+$/.test(name)) continue;
    const pad = (4 - (nameSize % 4)) % 4;
    const opStart = nameOff + nameSize + pad;
    if (opStart + opcodeSize > buf.length) continue;
    return { name, opcodes: buf.subarray(opStart, opStart + opcodeSize) };
  }
  return null;
}

/* ---- identificadores desta versão do CASC ------------------------------ */
// Derivados do bytecode dos 3213 .pow de casc-tools/pow (ver README): o servidor e a versão antiga
// deste parser usavam outra numeração (SF só 23..62, tabelas 63..113, runas 0x1f8..) e zeravam
// SF_40+, Table() e todas as runas.
const SF_FIRST = 23, SF_LAST = 86; // SF_N relativo = 23 + N, N = 0..63
const POWER_TAG = 22; // PowerTag.<SNO>."<tag>"
const BALANCE_TABLE_IDS = { 87: "DmgTier1", 88: "DmgTier2", 90: "DmgTier4", 94: "Healing", 95: "WDCost", 102: "LegendaryProcDmg" };
const RUNE_ATTRS = { 695: "a", 696: "b", 697: "c", 698: "d", 699: "e" }; // atributos Rune_A..Rune_E
const LEVEL_ATTRS = new Set([57, 1402]); // Level, Effective_Level
const DEFAULT_LEVEL = 70;

const HERE = dirname(fileURLToPath(import.meta.url));
let powerNames = null, balanceTables = null;
const powCache = new Map();

/** SNO -> nome do power (data/Power.csv), carregado sob demanda. */
function powerNameBySno(sno) {
  if (!powerNames) {
    powerNames = new Map();
    for (const line of readFileSync(join(HERE, "data", "Power.csv"), "utf8").split(/\r?\n/).slice(1)) {
      const [name, id] = line.split(",");
      if (name && id) powerNames.set(Number(id), name);
    }
  }
  return powerNames.get(sno);
}

function powBuffer(name) {
  if (!powCache.has(name)) {
    try {
      powCache.set(name, readFileSync(join(HERE, "pow", name + ".pow")));
    } catch {
      powCache.set(name, null);
    }
  }
  return powCache.get(name);
}

/** GameBalance PowerFormulaTables.gam: entradas de 1328B = nome (1024B) + 76 floats (por nível). */
function balanceTable(name, index) {
  if (!balanceTables) {
    balanceTables = {};
    const d = readFileSync(join(HERE, "data", "PowerFormulaTables.gam"));
    for (let o = d.indexOf("DmgTier1\0"); o >= 0 && o + 1024 + 304 <= d.length; o += 1328) {
      const n = d.toString("latin1", o, o + 1024).split("\0")[0];
      if (!/^\w+$/.test(n)) break;
      balanceTables[n] = Array.from({ length: 76 }, (_, i) => d.readFloatLE(o + 1024 + i * 4));
    }
  }
  return balanceTables[name]?.[Math.trunc(index)] ?? null;
}

/** Resolve ScriptFormula(N) of a .pow to a number, chaining SF_M refs, PowerTag refs to other powers
 *  and applying a rune/level context. ctx: { slevel, level, runes:{a..e}, table(name,index)? }. */
export function resolveSF(buf, n, ctx = {}, depth = 0) {
  if (depth > 12) return 0;
  const f = findFormulaByTag(buf, sfTagId(n));
  if (!f) return null;
  return evalFormula(f.opcodes, { ...ctx, identifier: referenceResolver(buf, ctx, depth) });
}

/** Resolve SF_N (mesmo .pow) e PowerTag (outro .pow). Passivas/lendários referenciados são avaliados
 *  como NÃO equipados (slevel 0, sem runa) — ex.: Grenadier SF1 = 1 + (sLevel ? 0.096 : 0) -> 1.
 *  Powers companheiros (Laws *_Passive2, Companion_Passive) herdam a runa da skill. */
function referenceResolver(buf, ctx, depth) {
  return (id1, id2, id3) => {
    if (id1 >= SF_FIRST && id1 <= SF_LAST) return resolveSF(buf, id1 - SF_FIRST, ctx, depth + 1) ?? 0;
    if (id1 === POWER_TAG && depth <= 12) {
      const name = powerNameBySno(id2);
      const other = name && powBuffer(name);
      const f = other && findFormulaByTag(other, id3);
      if (!f) return 0;
      const sub = /_Passive_|ItemPassive/.test(name) ? { ...ctx, slevel: 0, runes: {} } : ctx;
      return evalFormula(f.opcodes, { ...sub, identifier: referenceResolver(other, sub, depth + 1) }) ?? 0;
    }
    return 0;
  };
}

/** Resolve a slot's numeric value, chaining SF_N references and Rune_x flags.
 *  ctx: { slevel, runes:{a,b,c,d,e:boolean}, table(name,index) }. */
export function resolveSlot(bySlot, slotIndex, ctx = {}, depth = 0) {
  if (depth > 8 || slotIndex < 0 || slotIndex >= bySlot.length) return 0;
  const slot = bySlot[slotIndex];
  if (!slot?.opcodes) return 0;
  const identifier = (id1) => {
    if (id1 >= SF_FIRST && id1 <= SF_LAST) return resolveSlot(bySlot, id1 - SF_FIRST, ctx, depth + 1);
    return 0;
  };
  return evalFormula(slot.opcodes, { ...ctx, identifier }) ?? 0;
}

/* ---- ScriptFormula VM (port of ScriptFormulaEvaluator.Evaluate) -------- */

function i32ToF32(n) {
  const b = Buffer.alloc(4);
  b.writeInt32LE(n | 0, 0);
  return b.readFloatLE(0);
}

function f32ToI32(v) {
  const b = Buffer.alloc(4);
  b.writeFloatLE(v, 0);
  return b.readInt32LE(0);
}

/**
 * Evaluate an opcode array (float32, como o jogo). ctx supplies external values:
 *   ctx.slevel         -> sLevel do power (0 = não equipado)
 *   ctx.level          -> nível do personagem para Level/Effective_Level (default 70)
 *   ctx.runes          -> { a..e: truthy } runa ativa
 *   ctx.table(name,ix) -> override opcional da tabela do GameBalance (null = usa PowerFormulaTables.gam)
 *   ctx.identifier(id1,id2,id3,id4) -> SF_N / PowerTag (default 0)
 * Returns the float result, or null if it can't evaluate.
 */
export function evalFormula(opcodes, ctx = {}) {
  const stack = [];
  let pos = 0;
  const pop = () => stack.pop();
  while (pos < opcodes.length) {
    const op = opcodes[pos];
    switch (op) {
      case 0: // return: o jogo devolve o topo da pilha
        return stack.length ? stack.pop() : null;
      case 1: { // function
        pos += 4;
        const fn = opcodes[pos];
        switch (fn) {
          case 0: { const b = pop(), a = pop(); stack.push(Math.min(a, b)); break; }
          case 1: { const b = pop(), a = pop(); stack.push(Math.max(a, b)); break; }
          case 2: { const c = pop(), b = pop(), a = pop(); stack.push(b > a ? b : a > c ? c : a); break; }
          case 5: { stack.push(Math.floor(pop())); break; }
          case 11: { // Table(id, index)
            const ix = pop(), name = BALANCE_TABLE_IDS[f32ToI32(pop())];
            const custom = ctx.table ? ctx.table(name, ix) : null;
            const v = custom ?? (name ? balanceTable(name, ix) : null);
            if (v == null) return null;
            stack.push(v);
            break;
          }
          // random funcs: use the deterministic midpoint (no rand in a planner)
          case 3: { const b = pop(), a = pop(); stack.push(a + b / 2); break; }
          case 4: { const b = pop(), a = pop(); stack.push((a + b) / 2); break; }
          case 9: { const b = pop(), a = pop(); stack.push(a + b / 2); break; }
          case 10: { const b = pop(), a = pop(); stack.push((a + b) / 2); break; }
          default: return null;
        }
        break;
      }
      case 5: { // external identifier: 4 int args follow
        const id1 = readI32(opcodes, pos + 4);
        const id2 = readI32(opcodes, pos + 8);
        const id3 = readI32(opcodes, pos + 12);
        const id4 = readI32(opcodes, pos + 16);
        stack.push(loadIdentifier(id1, id2, id3, id4, ctx));
        pos += 4 * 4;
        break;
      }
      case 6: // push float
        pos += 4;
        stack.push(readF32(opcodes, pos));
        break;
      case 8: { const b = pop(), a = pop(); stack.push(a > b ? 1 : 0); break; }
      case 11: { const b = pop(), a = pop(); stack.push(a + b); break; }
      case 12: { const b = pop(), a = pop(); stack.push(a - b); break; }
      case 13: { const b = pop(), a = pop(); stack.push(a * b); break; }
      case 14: { const b = pop(), a = pop(); stack.push(b === 0 ? 0 : a / b); break; }
      case 16: { stack.push(-pop()); break; }
      case 17: { const c = pop(), b = pop(), a = pop(); stack.push(a !== 0 ? b : c); break; }
      default:
        return null;
    }
    stack[stack.length - 1] = Math.fround(stack[stack.length - 1]); // o jogo opera em float32
    pos += 4; // opcodes are 4-byte words; matches the server VM's trailing pos+=4
  }
  return null;
}

function readI32(arr, off) {
  return arr[off] | (arr[off + 1] << 8) | (arr[off + 2] << 16) | (arr[off + 3] << 24);
}
function readF32(arr, off) {
  return Buffer.from(arr.buffer, arr.byteOffset + off, 4).readFloatLE(0);
}

/** LoadIdentifier: atributo (runa/nível), sLevel, SF_N, PowerTag, id de tabela do GameBalance. */
function loadIdentifier(id1, id2, id3, id4, ctx) {
  if (id1 === 0) { // atributo: id2 = id do atributo
    if (RUNE_ATTRS[id2]) return ctx.runes?.[RUNE_ATTRS[id2]] ? 1 : 0;
    if (LEVEL_ATTRS.has(id2)) return ctx.level ?? DEFAULT_LEVEL;
    return 0; // atributos de runtime (APS, buffs) não modelados
  }
  if (id1 === 1) return ctx.slevel ?? 1; // sLevel
  if (id1 === POWER_TAG || (id1 >= SF_FIRST && id1 <= SF_LAST)) {
    return ctx.identifier ? ctx.identifier(id1, id2, id3, id4) : 0;
  }
  if (BALANCE_TABLE_IDS[id1]) return i32ToF32(id1); // id de tabela (consumido por Table())
  return 0; // variáveis de contexto (bTraitActive=113, mHealthMin=101...): não equipado / sem contexto
}
