/**
 * SlotEditor — Phase 2 per-slot item configuration dialog.
 *
 * Lets the player set: item tier (rare/legendary/ancient/primal), roll each of
 * the slot's affixes within its real statLimits range, add gems to sockets
 * (normal by color+tier, legendary by level), and set the legendary power value.
 * Writes a SlotState back through onChange.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, RefreshCw, Trash2, Plus, Lock, ChevronDown } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AffixOption,
  GEM_TIERS,
  PlannerData,
  PlannerItem,
  SlotId,
  SlotState,
  TIERS,
  Tier,
  affixLabel,
  affixRange,
  choosableAffixes,
  classMainStat,
  formatStat,
  intrinsicLines,
  itemAffixTemplates,
  legendaryGemText,
  normalGemEffect,
  powerDisplay,
  etherealPassiveName,
  etherealPowerItem,
  etherealPowerOptions,
  primaryAffixSlots,
  setBonusText,
  setName,
} from "@/lib/planner";

const TIER_COLOR: Record<Tier, string> = {
  primal: "0 75% 58%",
  ancient: "32 90% 55%",
  legendary: "30 90% 55%",
};

/** Render text with numeric values (numbers, %, "N seconds/yards") highlighted
 *  in a brighter shade so set bonuses read like the in-game tooltip instead of
 *  one flat block. `base` and `hl` are HSL strings. */
const Highlighted = ({ text, base, hl }: { text: string; base: string; hl: string }) => {
  // capture group keeps the matched values as separate array entries
  const parts = text.split(/(\d[\d,.]*%?(?:\s*(?:seconds?|yards?|stacks?|times?))?)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\d/.test(p) ? (
          <span key={i} className="font-semibold" style={{ color: `hsl(${hl})` }}>
            {p}
          </span>
        ) : (
          <span key={i} style={{ color: `hsl(${base})` }}>
            {p}
          </span>
        ),
      )}
    </>
  );
};

/** A resolved preset affix: `target` is the concrete stat to show; `choices`
 *  lists the stats it may switch between when it came from a group (e.g.
 *  "mainstat" → str/dex/int). A literal preset has no choices and is locked. */
interface PresetEntry { target: string; choices: string[] }

/** Resolve each preset entry to a concrete stat. A group preset (mainstat → the
 *  str/dex/int trio) defaults to the class stat and stays switchable. A weapon
 *  elemental preset (wpnhol, in the "weapon" group) lets the player pick the
 *  damage element. Anything else is a fixed literal. */
function presetTargets(data: PlannerData, item: PlannerItem, klass: string): PresetEntry[] {
  const out: PresetEntry[] = [];
  for (const key of item.preset ?? []) {
    if (key === "sockets") continue;
    const group = data.statGroups[key];
    if (group) {
      // a group preset KEY (e.g. "mainstat") — default to the class stat
      const def = group.includes(classMainStat(klass)) ? classMainStat(klass) : group[0];
      out.push({ target: def, choices: group });
      continue;
    }
    // the preset may itself be a group MEMBER (e.g. "wpnhol" in "weapon") — keep
    // it concrete but offer its siblings as choices (pick weapon-damage element).
    const owner = Object.entries(data.statGroups).find(([, m]) => m.includes(key));
    if (owner && owner[0] === "weapon") {
      out.push({ target: key, choices: owner[1] });
    } else {
      out.push({ target: key, choices: [] });
    }
  }
  return out;
}

/** Which affix template a target stat uses on this item (handles group members,
 *  e.g. "str"→"mainstat", "wpnhol"→"weapon"). Searches the item's merged
 *  slot+type templates so weapon damage resolves. */
function templateKeyForTarget(
  data: PlannerData,
  slot: SlotId,
  target: string,
  item?: PlannerItem,
): string | null {
  const map = itemAffixTemplates(data, slot, item);
  if (map[target]) return target;
  for (const [k, members] of Object.entries(data.statGroups)) {
    if (members.includes(target) && map[k]) return k;
  }
  return null;
}

const socketCount = (data: PlannerData, slot: SlotId, item: PlannerItem): number => {
  // sockets come from the slot definition or an item that grants extra ones.
  const base = data.itemSlots[slot]?.sockets ?? 0;
  const hasSocketPreset = (item.preset ?? []).includes("sockets");
  return Math.max(base, hasSocketPreset ? 1 : 0);
};

/** One affix line. A FIXED row (preset/required) shows a lock and no stat
 *  picker; a FREE row shows a "change stat" dropdown so the player can swap
 *  which property occupies the slot (matching the official planner). */
const AffixRow = ({
  data,
  slot,
  item,
  target,
  tier,
  value,
  fixed,
  options,
  onChange,
  onRetarget,
  onRemove,
}: {
  data: PlannerData;
  slot: SlotId;
  item: PlannerItem;
  target: string;
  tier: Tier;
  value: number;
  fixed: boolean;
  options: AffixOption[];
  onChange: (v: number) => void;
  onRetarget?: (key: string) => void;
  onRemove?: () => void;
}) => {
  const [pick, setPick] = useState(false);
  const tKey = templateKeyForTarget(data, slot, target, item);
  const range = tKey ? affixRange(data, slot, tKey, tier, item) : null;
  const step = range?.step ?? (Number.isInteger(range?.min ?? 0) ? 1 : 0.5);
  return (
    <div className="py-2 border-b border-stone/35 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <span className="font-body text-sm min-w-0">
          <Highlighted text={formatStat(data, target, value)} base="36 25% 78% / 0.85" hl="33 100% 62%" />
        </span>
        <span className="flex-none flex items-center gap-2">
          {range && (
            <button
              type="button"
              onClick={() => onChange(range.max)}
              className="font-mono text-[9px] uppercase tracking-widest text-bone/40 hover:text-ember"
              title="Set to max"
            >
              max
            </button>
          )}
          {fixed ? (
            <Lock className="w-3 h-3 text-bone/30" />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPick((p) => !p)}
                className="text-bone/40 hover:text-ember"
                title="Change stat"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${pick ? "rotate-180" : ""}`} />
              </button>
              {onRemove && (
                <button type="button" onClick={onRemove} className="text-bone/30 hover:text-red-400" title="Remove affix">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </span>
      </div>
      {range && range.min !== range.max && (
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full mt-1.5 accent-ember h-1"
        />
      )}
      {pick && !fixed && onRetarget && (
        <StatPicker options={options} onPick={(k) => { onRetarget(k); setPick(false); }} />
      )}
    </div>
  );
};

/** Grouped, searchable stat dropdown for a free affix slot. */
const StatPicker = ({ options, onPick }: { options: AffixOption[]; onPick: (key: string) => void }) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
    : options;
  const groups: Record<string, AffixOption[]> = {};
  for (const o of filtered) (groups[o.group] = groups[o.group] || []).push(o);
  return (
    <div className="mt-2 border border-stone/50 bg-night/80 rounded-sm">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("planner.selectStat", "Select a stat…")}
        className="w-full bg-transparent border-b border-stone/40 px-2.5 py-1.5 font-body text-xs text-bone placeholder:text-bone/35 focus:outline-none"
      />
      <div className="max-h-48 overflow-y-auto py-1">
        {Object.entries(groups).map(([g, opts]) => (
          <div key={g}>
            <p className="px-2.5 pt-1.5 pb-0.5 font-mono text-[9px] uppercase tracking-widest text-ember/70">{g}</p>
            {opts.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => onPick(o.key)}
                className="w-full text-left px-2.5 py-1 font-body text-xs text-bone/75 hover:bg-ember/10 hover:text-ember"
              >
                {o.label}
              </button>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-2.5 py-2 font-body text-xs text-bone/35">{t("planner.noItems")}</p>
        )}
      </div>
    </div>
  );
};

const GemSlot = ({
  data,
  context,
  jewelry,
  socketGem,
  onChange,
  onClear,
}: {
  data: PlannerData;
  context: "weapon" | "head" | "other";
  /** legendary gems only socket into rings & amulets. */
  jewelry: boolean;
  socketGem?: SlotState["gems"][number];
  onChange: (gem: SlotState["gems"][number]) => void;
  onClear: () => void;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // jewelry (ring/amulet) takes ONLY legendary gems; every other slot takes
  // ONLY normal gems.
  const normalColors = jewelry ? [] : Object.entries(data.gems.normal);
  const legGems = jewelry ? Object.entries(data.gems.legendary) : [];

  let label = t("planner.emptySocket");
  let effect = "";
  let gemIcon: string | undefined;
  if (socketGem) {
    if (socketGem.legendary) {
      const g = data.gems.legendary[socketGem.gem];
      label = `${g?.name ?? socketGem.gem} (${socketGem.rank})`;
      effect = g ? legendaryGemText(g.effects[0], socketGem.rank) : "";
      gemIcon = g?.icon;
    } else {
      const g = data.gems.normal[socketGem.gem];
      const eff = g ? normalGemEffect(g, context, socketGem.rank) : null;
      label = `${g?.name ?? socketGem.gem} — ${GEM_TIERS[socketGem.rank] ?? ""}`;
      effect = eff ? formatStat(data, eff.stat, eff.value) : "";
      gemIcon = g?.icon;
    }
  }

  return (
    <div className="border border-stone/50 bg-night/60 p-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="min-w-0 flex items-center gap-2">
          {gemIcon && <img src={gemIcon} alt="" className="flex-none w-7 h-7 object-contain" />}
          <span className="min-w-0">
            <span className="block font-display text-xs tracking-wide text-bone">{label}</span>
            {effect && (
              <span className="block font-body text-[11px] truncate">
                <Highlighted text={effect} base="36 25% 78% / 0.55" hl="33 100% 62%" />
              </span>
            )}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {socketGem && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-bone/40 hover:text-ember">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Plus className={`w-4 h-4 text-bone/40 transition-transform ${open ? "rotate-45" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {normalColors.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-bone/40 mb-1">{t("planner.normalGems")}</p>
              <div className="flex flex-wrap gap-1.5">
                {normalColors.map(([id, g]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { onChange({ gem: id, legendary: false, rank: GEM_TIERS.length - 1 }); setOpen(false); }}
                    className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider border border-stone/50 text-bone/70 hover:border-ember/60 hover:text-ember"
                  >
                    {g.icon && <img src={g.icon} alt="" className="w-4 h-4 object-contain" loading="lazy" />}
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {jewelry && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-bone/40 mb-1">{t("planner.legendaryGems")}</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {legGems.map(([id, g]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { onChange({ gem: id, legendary: true, rank: g.maxlevel }); setOpen(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] tracking-wide border border-stone/50 text-bone/70 hover:border-ember/60 hover:text-ember text-left"
                  >
                    {g.icon ? (
                      <img src={g.icon} alt="" className="flex-none w-6 h-6 object-contain" loading="lazy" />
                    ) : (
                      <span className="flex-none w-6 h-6" />
                    )}
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** The two extra properties an Ethereal rolls: a class weapon legendary power (from the
 *  item's options) and a class passive. In game they are random; here you pick the roll. */
const EtherealChoices = ({
  data,
  item,
  klass,
  state,
  onChange,
}: {
  data: PlannerData;
  item: PlannerItem;
  klass: string;
  state: SlotState;
  onChange: (s: SlotState) => void;
}) => {
  const { t } = useTranslation();
  const powers = useMemo(() => etherealPowerOptions(data, item), [data, item]);
  const passives = useMemo(
    () => Object.values(data.passives?.[klass] ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [data, klass],
  );
  const chosen = etherealPowerItem(data, item, state);
  const selectClass =
    "dark-select w-full bg-[hsl(240_6%_11%)] border border-stone/60 rounded-none px-2.5 py-1.5 font-body text-sm text-bone focus:outline-none focus:border-ember/60";
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember mb-2">
          {t("planner.etherealPower", "+1 Class Weapon Legendary Power")}
        </p>
        <select
          value={state.etherealPower ?? ""}
          onChange={(e) => onChange({ ...state, etherealPower: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">{t("planner.etherealChoose", "Choose…")}</option>
          {powers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {chosen && (
          <p className="font-body text-sm leading-relaxed mt-2">
            <Highlighted text={powerDisplay(chosen) ?? ""} base="36 25% 78% / 0.8" hl="33 100% 62%" />
          </p>
        )}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember mb-2">
          {t("planner.etherealPassive", "+1 Class Passive Power")}
        </p>
        <select
          value={state.etherealPassive ?? ""}
          onChange={(e) => onChange({ ...state, etherealPassive: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">{t("planner.etherealChoose", "Choose…")}</option>
          {passives.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <p className="font-mono text-[10px] text-bone/40">
        {t("planner.etherealNote", "In game both are rolled at random; pick the roll this build is looking for.")}
      </p>
    </div>
  );
};

const SlotEditor = ({
  data,
  slot,
  klass,
  item,
  state,
  onChange,
  onChangeItem,
  onRemove,
  onClose,
}: {
  data: PlannerData;
  slot: SlotId;
  klass: string;
  item: PlannerItem;
  state: SlotState;
  onChange: (s: SlotState) => void;
  onChangeItem: () => void;
  onRemove: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  // Preset affixes the item always carries. A group preset (mainstat) defaults
  // to the class stat and stays switchable; a literal preset is locked.
  const presets = useMemo(() => presetTargets(data, item, klass), [data, item, klass]);
  const presetTargetKeys = useMemo(() => presets.map((p) => p.target), [presets]);
  const sockets = socketCount(data, slot, item);
  const gemContext: "weapon" | "head" | "other" =
    slot === "mainhand" || slot === "offhand" ? "weapon" : slot === "head" ? "head" : "other";

  // FREE affix slots: total primary slots minus the preset ones. The chosen
  // stats are whatever keys live in state.affixes that aren't preset targets or
  // the special "augment" (Caldesann's) line, which renders on its own.
  const presetSet = useMemo(() => new Set(presetTargetKeys), [presetTargetKeys]);
  const freeChosen = useMemo(
    () => Object.keys(state.affixes).filter((k) => !presetSet.has(k) && k !== "augment"),
    [state.affixes, presetSet],
  );
  const augment = state.affixes.augment;
  const totalSlots = primaryAffixSlots(slot);
  const freeSlots = Math.max(0, totalSlots - presets.length);
  const canAddAffix = freeChosen.length < freeSlots;

  // primal / ancient / legendary (rare excluded — endgame builds don't use it).
  const tiers = TIERS;

  const maxFor = (target: string, tier: Tier) => {
    const tKey = templateKeyForTarget(data, slot, target, item);
    const range = tKey ? affixRange(data, slot, tKey, tier, item) : null;
    return range ? range.max : (state.affixes[target] ?? 0);
  };

  // Switching tier re-rolls every affix (preset + free) to that tier's max.
  const setTier = (tier: Tier) => {
    const affixes: Record<string, number> = {};
    for (const target of [...presetTargetKeys, ...freeChosen]) affixes[target] = maxFor(target, tier);
    const power = item.required?.custom;
    const powerValue = power?.max ?? state.powerValue;
    onChange({ ...state, tier, affixes, powerValue });
  };
  const setAffix = (target: string, v: number) =>
    onChange({ ...state, affixes: { ...state.affixes, [target]: v } });
  // Swap a free slot's stat: drop the old key, add the new one at its max roll.
  const retargetAffix = (oldKey: string, newKey: string) => {
    const affixes = { ...state.affixes };
    delete affixes[oldKey];
    affixes[newKey] = maxFor(newKey, state.tier);
    onChange({ ...state, affixes });
  };
  const removeAffix = (key: string) => {
    const affixes = { ...state.affixes };
    delete affixes[key];
    onChange({ ...state, affixes });
  };
  const addAffix = (key: string) =>
    onChange({ ...state, affixes: { ...state.affixes, [key]: maxFor(key, state.tier) } });
  const setGem = (i: number, gem: SlotState["gems"][number]) => {
    const gems = [...state.gems];
    gems[i] = gem;
    onChange({ ...state, gems });
  };
  const clearGem = (i: number) => {
    const gems = [...state.gems];
    gems.splice(i, 1);
    onChange({ ...state, gems });
  };

  const power = item.required?.custom;
  const color = TIER_COLOR[state.tier];

  // "add affix" picker open-state + the options not already used on the item.
  const [adding, setAdding] = useState(false);
  const affixOptions = useMemo(
    () => choosableAffixes(data, slot, [...presetTargetKeys, ...freeChosen], item),
    [data, slot, item, presetTargetKeys, freeChosen],
  );
  const passiveName = etherealPassiveName(data, klass, state);
  const intrinsics = useMemo(() => intrinsicLines(data, item, passiveName), [data, item, passiveName]);

  return (
    <DialogContent className="max-w-xl bg-background border-stone/70 rounded-none p-0 gap-0 max-h-[88vh] flex flex-col">
      <DialogHeader className="p-5 border-b border-stone/60">
        <div className="flex items-center gap-3">
          <span className="flex-none w-16 h-24 border bg-night rounded-sm overflow-hidden flex items-center justify-center p-1" style={{ borderColor: `hsl(${color} / 0.6)` }}>
            {item.icon ? <img src={item.icon} alt={item.name} className="max-w-full max-h-full object-contain" /> : null}
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-display text-lg uppercase tracking-wider truncate" style={{ color: `hsl(${color})` }}>
              {item.name}
            </DialogTitle>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/40">
              {t(`planner.slots.${slot}`, slot)}
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="overflow-y-auto p-5 space-y-6">
        {/* tier */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45 mb-2">{t("planner.tier")}</p>
          <div className="flex flex-wrap gap-2">
            {tiers.map((ti) => (
              <button
                key={ti}
                type="button"
                onClick={() => setTier(ti)}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors"
                style={
                  state.tier === ti
                    ? { borderColor: `hsl(${TIER_COLOR[ti]} / 0.7)`, color: `hsl(${TIER_COLOR[ti]})`, background: `hsl(${TIER_COLOR[ti]} / 0.1)` }
                    : { borderColor: "hsl(var(--stone) / 0.5)", color: "hsl(var(--bone) / 0.5)" }
                }
              >
                {t(`planner.tiers.${ti}`, { defaultValue: ti })}
              </button>
            ))}
          </div>
        </div>

        {/* legendary power (an Ethereal has none of its own — see below) */}
        {power?.format && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember mb-2">{power.name}</p>
            <p className="font-body text-sm leading-relaxed">
              <Highlighted text={powerDisplay(item, state.powerValue) ?? ""} base="36 25% 78% / 0.8" hl="33 100% 62%" />
            </p>
            {power.min != null && power.max != null && power.min !== power.max && (
              <input
                type="range"
                min={power.min}
                max={power.max}
                value={state.powerValue ?? power.max}
                onChange={(e) => onChange({ ...state, powerValue: Number(e.target.value) })}
                className="w-full mt-2 accent-ember h-1"
              />
            )}
          </div>
        )}

        {/* Ethereal: +1 class weapon legendary power and +1 class passive, chosen by the player */}
        {item.quality === "ethereal" && (
          <EtherealChoices data={data} item={item} klass={klass} state={state} onChange={onChange} />
        )}

        {/* intrinsic affixes — the item's always-present legendary/ethereal
            properties (locked, max roll). e.g. Blackbog: +Poison Dmg, +Int, … */}
        {intrinsics.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45 mb-2">
              {t("planner.itemProps", "Item Properties")}
            </p>
            <ul className="space-y-1">
              {intrinsics.map((line) => (
                <li key={line.key} className="flex items-start justify-between gap-2 font-body text-sm">
                  <span className="min-w-0">
                    <Highlighted text={line.text} base="36 25% 78% / 0.85" hl="33 100% 62%" />
                  </span>
                  <Lock className="flex-none w-3 h-3 text-bone/25 mt-1" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* set bonuses */}
        {item.set && data.sets[item.set] && (
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.3em] mb-2" style={{ color: "hsl(120 60% 55%)" }}>
              {setName(data, item)}
            </p>
            <ul className="space-y-2">
              {Object.entries(data.sets[item.set].bonuses)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([pieces, bonuses]) => (
                  <li key={pieces}>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-bone/45">
                      {t("planner.setPieces", { count: Number(pieces), defaultValue: `(${pieces}) Set` })}
                    </span>
                    {bonuses.map((bo, i) => (
                      <p key={i} className="font-body text-sm leading-snug">
                        <Highlighted text={setBonusText(data, bo)} base="120 35% 62%" hl="120 75% 72%" />
                      </p>
                    ))}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* affixes — preset rows first (a primary-attribute preset is switchable
            among str/dex/int and defaults to the class stat; a literal preset is
            locked), then the player's free picks, then an "add affix" control. */}
        {(presets.length > 0 || freeSlots > 0) && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45 mb-1">{t("planner.affixes")}</p>
            <div>
              {presets.map((p) => (
                <AffixRow
                  key={`preset-${p.target}`}
                  data={data}
                  slot={slot}
                  item={item}
                  target={p.target}
                  tier={state.tier}
                  value={state.affixes[p.target] ?? maxFor(p.target, state.tier)}
                  fixed={p.choices.length === 0}
                  options={p.choices.map((k) => ({ key: k, label: affixLabel(data, k), group: "Primary" }))}
                  onChange={(v) => setAffix(p.target, v)}
                  onRetarget={p.choices.length > 0 ? (k) => retargetAffix(p.target, k) : undefined}
                />
              ))}
              {freeChosen.map((target) => (
                <AffixRow
                  key={`free-${target}`}
                  data={data}
                  slot={slot}
                  item={item}
                  target={target}
                  tier={state.tier}
                  value={state.affixes[target] ?? maxFor(target, state.tier)}
                  fixed={false}
                  options={choosableAffixes(data, slot, [...presetTargetKeys, ...freeChosen.filter((k) => k !== target)], item)}
                  onChange={(v) => setAffix(target, v)}
                  onRetarget={(k) => retargetAffix(target, k)}
                  onRemove={() => removeAffix(target)}
                />
              ))}
              {augment != null && (
                <div className="py-2 border-b border-stone/35 last:border-0 flex items-center justify-between gap-3">
                  <span className="font-body text-sm">
                    <Highlighted
                      text={`+${augment} ${affixLabel(data, classMainStat(klass))} (Caldesann's Despair)`}
                      base="280 40% 70% / 0.9"
                      hl="280 70% 72%"
                    />
                  </span>
                  <Lock className="w-3 h-3 text-bone/30" />
                </div>
              )}
            </div>
            {canAddAffix && (
              <div className="mt-2">
                {adding ? (
                  <StatPicker options={affixOptions} onPick={(k) => { addAffix(k); setAdding(false); }} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-dashed border-stone/50 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/50 hover:text-ember hover:border-ember/50 w-full justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("planner.addAffix", "Add affix")} ({freeChosen.length}/{freeSlots})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* sockets */}
        {sockets > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45 mb-2">
              {t("planner.sockets")} ({sockets})
            </p>
            <div className="space-y-2">
              {Array.from({ length: sockets }).map((_, i) => (
                <GemSlot
                  key={i}
                  data={data}
                  context={gemContext}
                  jewelry={slot === "neck" || slot === "leftfinger" || slot === "rightfinger"}
                  socketGem={state.gems[i]}
                  onChange={(gem) => setGem(i, gem)}
                  onClear={() => clearGem(i)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-4 border-t border-stone/60">
        <button type="button" onClick={onChangeItem} className="flex items-center gap-2 px-3 py-2 border border-stone/60 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/70 hover:text-ember hover:border-ember/60">
          <RefreshCw className="w-3.5 h-3.5" /> {t("planner.changeItem")}
        </button>
        <button type="button" onClick={onRemove} className="flex items-center gap-2 px-3 py-2 border border-stone/60 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/60 hover:text-red-400 hover:border-red-400/50">
          <Trash2 className="w-3.5 h-3.5" /> {t("planner.remove")}
        </button>
        <button type="button" onClick={onClose} className="ml-auto px-4 py-2 border border-ember/60 text-ember font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-ember/10">
          {t("planner.done")}
        </button>
      </div>
      {/* DialogContent renders its own close X (top-right); no manual one here. */}
    </DialogContent>
  );
};

export default SlotEditor;
