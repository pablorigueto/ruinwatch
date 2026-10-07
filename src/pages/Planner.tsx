/**
 * /planner — Build planner.
 *
 * Phase 1: paperdoll + class/season + item picker.
 * Phase 2: per-slot item editor — tier (rare/legendary/ancient/primal),
 *          roll each slot affix (real ranges from statLimits), sockets + gems
 *          (normal by color/tier, legendary by level), legendary power value.
 *
 * State is the shared BuildState from lib/planner (also drives later phases:
 * Kanai, skills, paragon, save, simulation). Data: usePlanner().
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Gem, RotateCcw, Plus, Link2, Check, Download, Upload } from "lucide-react";
import Seo from "@/components/Seo";
import PageLoader from "@/components/PageLoader";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SlotEditor from "@/components/planner/SlotEditor";
import KanaiCube from "@/components/planner/KanaiCube";
import SkillsPanel from "@/components/planner/SkillsPanel";
import ParagonPanel from "@/components/planner/ParagonPanel";
import AltarPanel from "@/components/planner/AltarPanel";
import Paperdoll from "@/components/planner/Paperdoll";
import StatSummary from "@/components/planner/StatSummary";
import CurrentBadge from "@/components/planner/CurrentBadge";
import { BUILD_FILE_MAX_BYTES, buildFileName, decodeBuild, encodeBuild, parseBuildFile, toBuildFile } from "@/lib/planner";
import {
  BUILD_CATEGORIES,
  tiersForCategory,
  BuildState,
  PLAYABLE_CLASSES,
  PlannerData,
  PlannerItem,
  Quality,
  SLOT_LABELS,
  SlotId,
  buildFromPreset,
  defaultSlotState,
  emptyBuild,
  fetchPresetBuild,
  itemTooltip,
  itemsForSlot,
  powerDisplay,
  setName,
  setsForSlot,
  useBuildIndex,
  usePlanner,
} from "@/lib/planner";
import { CLASSES_BY_SLUG, ClassSlug } from "@/lib/classes";

/** The ?build=<slug> from the URL, read once at startup (a preset to hydrate). */
function initialPresetSlug(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("build");
}

/** Load a build for first paint. The build only comes from the URL — a
 *  ?build=<slug> preset (hydrated by the loader) or a shared #b=<hash>. A bare
 *  /planner always starts empty, so anyone can build from scratch (we do NOT
 *  silently restore the last session from localStorage). */
function loadInitialBuild(): BuildState {
  if (typeof window !== "undefined") {
    if (initialPresetSlug()) return emptyBuild("barbarian"); // preset will load
    const m = window.location.hash.match(/[#&]b=([^&]+)/);
    if (m) {
      const fromUrl = decodeBuild(m[1]);
      if (fromUrl) return fromUrl;
    }
  }
  return emptyBuild("barbarian");
}

/** True when a build has no gear/skills/kanai — i.e. the untouched default, for
 *  which we keep the URL clean (no #b= junk). */
function isUntouched(b: BuildState): boolean {
  return (
    Object.keys(b.equipped).length === 0 &&
    b.skills.active.length === 0 &&
    b.skills.passives.length === 0 &&
    !b.kanai.weapon && !b.kanai.armor && !b.kanai.jewelry &&
    b.altar.length === 0
  );
}

const QUALITY_COLOR: Record<Quality, string> = {
  set: "120 60% 55%",
  legendary: "30 90% 55%",
  rare: "55 90% 60%",
  ethereal: "200 90% 60%",
};

const RARITY_FILTERS: Array<{ key: Quality | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "set", label: "Set" },
  { key: "legendary", label: "Legendary" },
];


const ItemPicker = ({
  data,
  slot,
  klass,
  onPick,
  onClose,
}: {
  data: PlannerData;
  slot: SlotId;
  klass: ClassSlug;
  onPick: (it: PlannerItem) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<Quality | "all">("all");
  const [setFilter, setSetFilter] = useState<string>("all");

  const all = useMemo(() => itemsForSlot(data, slot, klass), [data, slot, klass]);
  const sets = useMemo(() => setsForSlot(data, slot, klass), [data, slot, klass]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (it) =>
        (rarity === "all" || it.quality === rarity) &&
        (setFilter === "all" || it.set === setFilter) &&
        (!needle || it.name.toLowerCase().includes(needle)),
    );
  }, [all, q, rarity, setFilter]);

  return (
    <DialogContent className="max-w-2xl bg-background border-stone/70 rounded-none p-0 gap-0 max-h-[85vh] flex flex-col">
      <DialogHeader className="p-5 border-b border-stone/60">
        <DialogTitle className="font-display text-lg text-bone uppercase tracking-wider">
          {t(`planner.slots.${slot}`, SLOT_LABELS[slot])} — {t("planner.chooseItem")}
        </DialogTitle>
      </DialogHeader>

      <div className="p-4 border-b border-stone/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone/40" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("planner.search")}
            className="w-full bg-card/70 border border-stone/60 rounded-none pl-9 pr-3 py-2 font-body text-sm text-bone placeholder:text-bone/35 focus:outline-none focus:border-ember/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RARITY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRarity(f.key)}
              className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                rarity === f.key
                  ? "border-ember/60 text-ember bg-ember/10"
                  : "border-stone/50 text-bone/50 hover:text-bone/80"
              }`}
            >
              {t(`planner.rarity.${f.key}`, f.label)}
            </button>
          ))}
          {sets.length > 0 && (
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="dark-select ml-auto bg-[hsl(240_6%_11%)] border border-stone/60 rounded-none px-2 py-1 font-mono text-[11px] text-bone/80 focus:outline-none focus:border-ember/60 max-w-[55%]"
            >
              <option value="all">{t("planner.allSets")}</option>
              {sets.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  {sg.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-2">
        {list.length === 0 && (
          <p className="text-center font-body text-sm text-bone/40 py-10">{t("planner.noItems")}</p>
        )}
        <ul>
          {list.map((it) => {
            const color = QUALITY_COLOR[it.quality];
            const power = powerDisplay(it);
            const sName = setName(data, it);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onPick(it)}
                  className="w-full flex items-start gap-3 p-2.5 text-left hover:bg-card/70 transition-colors"
                >
                  <span className="flex-none w-12 h-16 border border-stone/60 bg-night rounded-sm overflow-hidden flex items-center justify-center p-0.5">
                    {it.icon ? (
                      <img src={it.icon} alt={it.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                    ) : (
                      <Gem className="w-4 h-4 text-bone/25" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm tracking-wide" style={{ color: `hsl(${color})` }}>
                        {it.name}
                        {it.suffix && <span className="text-bone/30 ml-1.5 text-xs">({it.suffix})</span>}
                      </span>
                      {it.current && <CurrentBadge />}
                    </span>
                    {sName && (
                      <span className="block font-mono text-[10px] uppercase tracking-wider" style={{ color: `hsl(${QUALITY_COLOR.set})` }}>
                        {sName}
                      </span>
                    )}
                    {power && (
                      <span className="block font-body text-xs text-bone/55 leading-snug mt-0.5">{power}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </DialogContent>
  );
};

const Planner = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePlanner();
  const [build, setBuild] = useState<BuildState>(() => loadInitialBuild());
  const [pickerSlot, setPickerSlot] = useState<SlotId | null>(null);
  const [editorSlot, setEditorSlot] = useState<SlotId | null>(null);
  const [copied, setCopied] = useState(false);
  // feedback line after an import (ok / skipped items / error)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [buildCat, setBuildCat] = useState<string>("solo-push"); // category in the load-build picker
  const [buildTier, setBuildTier] = useState<string>("S"); // tier within the category
  const { data: buildIndex } = useBuildIndex();
  // when a named reference build is loaded (and not yet edited) the URL stays a
  // clean ?build=<slug>; any manual edit drops back to the shareable #b=<hash>.
  const [presetId, setPresetId] = useState<string | null>(initialPresetSlug);
  // while a ?build= slug is still loading, the autosave must NOT rewrite the URL
  // (it would wipe the slug before hydration). This flag clears once loaded.
  const pendingSlug = useRef<boolean>(!!initialPresetSlug());

  // load a reference build (from /public/planner/builds) into the planner.
  const loadPreset = async (id: string) => {
    if (!data || !id) return;
    try {
      const preset = await fetchPresetBuild(id);
      setPresetId(id);
      setBuild(buildFromPreset(data, preset));
      // sync the 3 load-build selects to the loaded build so they reflect what's
      // shown (esp. when arriving via a ?build=<slug> deep link).
      const entry = buildIndex?.find((b) => b.id === id);
      if (entry) {
        setBuildCat(entry.category ?? "solo-push");
        setBuildTier(entry.tier ?? "A");
      }
    } catch (e) {
      console.error("failed to load preset build", id, e);
    } finally {
      pendingSlug.current = false;
    }
  };

  // snap the tier to the first one that has a build for the current class +
  // category (so changing class/category never leaves an empty build list).
  useEffect(() => {
    if (!buildIndex) return;
    const tiers = tiersForCategory(buildCat).filter((tr) =>
      buildIndex.some((b) => (b.category ?? "solo-push") === buildCat && (b.tier ?? "A") === tr.key && b.klass === build.klass),
    );
    if (tiers.length && !tiers.some((tr) => tr.key === buildTier)) setBuildTier(tiers[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCat, buildIndex, build.klass]);

  // on first mount, hydrate from ?build=<slug> if present (clean preset URL).
  // Wait for buildIndex too so loadPreset can also sync the category/tier selects.
  const hydratedSlug = useRef(false);
  useEffect(() => {
    if (!data || hydratedSlug.current) return;
    const slug = initialPresetSlug();
    if (!slug) { pendingSlug.current = false; hydratedSlug.current = true; return; }
    if (!buildIndex) return; // wait for the index before hydrating + syncing selects
    hydratedSlug.current = true;
    loadPreset(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, buildIndex]);

  // keep the URL shareable so the build survives a refresh / can be linked.
  // Untouched default → clean /planner (no junk). Pristine preset → ?build=<slug>.
  // Custom → #b=<hash>. We intentionally don't persist to localStorage, so a
  // bare /planner is always a clean slate.
  useEffect(() => {
    if (pendingSlug.current) return; // wait for ?build= to hydrate first
    const code = encodeBuild(build);
    const path = window.location.pathname;
    const url = presetId
      ? `${path}?build=${presetId}`
      : isUntouched(build)
        ? path
        : `${path}#b=${code}`;
    window.history.replaceState(null, "", url);
  }, [build, presetId]);

  // any edit to a loaded preset makes it a custom build → drop the preset slug.
  const editBuild = (updater: (b: BuildState) => BuildState) => {
    setPresetId(null);
    setBuild(updater);
  };

  const copyLink = async () => {
    const base = `${window.location.origin}${window.location.pathname}`;
    const url = presetId ? `${base}?build=${presetId}` : `${base}#b=${encodeBuild(build)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  // download the current build as a JSON file (no backend: a Blob + <a download>).
  const exportBuild = () => {
    const meta = presetId ? buildIndex?.find((b) => b.id === presetId) : undefined;
    const name = meta?.name ?? `${CLASSES_BY_SLUG[build.klass as ClassSlug]?.name ?? build.klass} custom build`;
    const blob = new Blob([JSON.stringify(toBuildFile(build, name), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFileName(build, name);
    a.click();
    URL.revokeObjectURL(url);
  };

  // load a build from an uploaded JSON (our export, or a reference-build file).
  const importBuild = async (file: File | undefined) => {
    if (!file || !data) return;
    const fail = (key: string, fallback: string) => setImportMsg({ ok: false, text: t(key, fallback) });
    if (file.size > BUILD_FILE_MAX_BYTES) return fail("planner.importTooBig", "File too large — a build JSON is only a few KB.");
    const res = parseBuildFile(data, await file.text(), PLAYABLE_CLASSES);
    if ("error" in res) {
      if (res.error === "invalid-json") return fail("planner.importInvalidJson", "This file is not valid JSON.");
      if (res.error === "unknown-class") return fail("planner.importUnknownClass", "Unknown class in this build.");
      return fail("planner.importNotBuild", "This JSON is not a RuinWatch build.");
    }
    editBuild(() => res.build);
    const loaded = t("planner.importOk", "Build loaded: {{name}}", { name: res.name ?? file.name });
    const skipped = res.skipped
      ? " " + t("planner.importSkipped", "({{count}} unknown item(s) skipped)", { count: res.skipped })
      : "";
    setImportMsg({ ok: true, text: loaded + skipped });
  };

  const klass = build.klass as ClassSlug;
  const itemById = useMemo(() => {
    const m: Record<string, PlannerItem> = {};
    if (data) for (const it of data.items) m[it.id] = it;
    return m;
  }, [data]);

  const setClass = (k: ClassSlug) => editBuild(() => ({ ...emptyBuild(k) }));
  const equip = (slot: SlotId, item: PlannerItem) => {
    if (!data) return;
    editBuild((b) => ({
      ...b,
      equipped: { ...b.equipped, [slot]: defaultSlotState(data, slot, item, b.klass) },
    }));
    setPickerSlot(null);
    setEditorSlot(slot); // jump straight into editing
  };

  // Per-build SEO: a loaded preset (?build=<slug>) is a real, indexable page
  // (acts like a build guide); the empty/custom planner is noindex so we don't
  // index thin or duplicate states.
  const presetMeta = presetId ? buildIndex?.find((b) => b.id === presetId) : undefined;
  const seo = presetMeta
    ? (() => {
        const className = CLASSES_BY_SLUG[presetMeta.klass as ClassSlug]?.name ?? presetMeta.klass;
        const catKey = presetMeta.category ?? "solo-push";
        const tierKey = presetMeta.tier ?? "A";
        const tierLabel = tiersForCategory(catKey).find((tr) => tr.key === tierKey)?.label ?? `${tierKey} Tier`;
        const cat = BUILD_CATEGORIES.find((c) => c.key === catKey)?.label ?? "Solo Pushing";
        return {
          path: `/planner?build=${presetMeta.id}`,
          title: `${presetMeta.name} — ${className} Build (${tierLabel})`,
          description: `${presetMeta.name} is a ${className} ${cat} build (${tierLabel}) for Diablo 3 on RuinWatch (Rites of Sanctuary patch), featuring the Altar of Rites and Ethereal Weapons. View the full gear, Kanai's Cube, skills, runes, paragon and Altar of Rites — and open it in the planner.`,
          image: `/cosmetics/${presetMeta.klass}.png`,
          type: "article" as const,
          keywords: [
            `${presetMeta.name} build`,
            `Diablo 3 ${className} build`,
            `${className} ${tierLabel}`,
            "Rites of Sanctuary",
            "Ethereal Weapons",
          ],
          jsonLd: breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Builds", url: "/builds" },
            { name: presetMeta.name, url: `/planner?build=${presetMeta.id}` },
          ]),
        };
      })()
    : {
        path: "/planner",
        title: "Build Planner",
        description:
          "Free Diablo 3 build planner for RuinWatch (Rites of Sanctuary patch, Altar of Rites + Ethereal Weapons). Assemble a character slot by slot: gear, Kanai's Cube, skills, runes, paragon and the Altar of Rites, then share your build.",
        keywords: ["Diablo 3 build planner", "D3 planner", "Rites of Sanctuary", "Altar of Rites", "Ethereal Weapons"],
        noindex: true,
      };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo {...seo} />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">{t("planner.tag")}</p>
            <h1 className="font-display text-4xl md:text-5xl text-bone uppercase tracking-wider text-stone-carved mb-4">
              {t("planner.title")}
            </h1>
            <div className="divider-rune my-6" />
            <p className="font-body text-sm md:text-base text-bone/60">{t("planner.subtitle")}</p>
          </div>

          {isLoading && <PageLoader fullscreen={false} label={t("planner.loading")} />}
          {isError && <p className="text-center font-mono text-sm text-bone/60 py-20">{t("planner.error")}</p>}

          {data && (
            <>
              <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-card/50 border border-stone/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/45">{t("planner.class")}</span>
                  <select
                    value={build.klass}
                    onChange={(e) => setClass(e.target.value as ClassSlug)}
                    className="dark-select bg-[hsl(240_6%_11%)] border border-stone/60 rounded-none px-3 py-1.5 font-display text-sm text-bone uppercase tracking-wider focus:outline-none focus:border-ember/60"
                  >
                    {PLAYABLE_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {CLASSES_BY_SLUG[c as ClassSlug]?.name ?? c}
                      </option>
                    ))}
                  </select>
                </div>
                {buildIndex && buildIndex.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/45">{t("planner.loadBuild", "Load build")}</span>
                    {/* category picker */}
                    <select
                      value={buildCat}
                      onChange={(e) => setBuildCat(e.target.value)}
                      className="dark-select bg-[hsl(240_6%_11%)] border border-stone/60 rounded-none px-2.5 py-1.5 font-display text-sm text-bone tracking-wide focus:outline-none focus:border-ember/60"
                    >
                      {BUILD_CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key} disabled={!c.ready}>
                          {c.label}{c.ready ? "" : " (soon)"}
                        </option>
                      ))}
                    </select>
                    {/* tier picker (only tiers with a build of this class+category) */}
                    <select
                      value={buildTier}
                      onChange={(e) => setBuildTier(e.target.value)}
                      className="dark-select bg-[hsl(240_6%_11%)] border border-stone/60 rounded-none px-2.5 py-1.5 font-display text-sm text-ember tracking-wide focus:outline-none focus:border-ember/60"
                    >
                      {tiersForCategory(buildCat).filter((tr) =>
                        buildIndex.some((b) => (b.category ?? "solo-push") === buildCat && (b.tier ?? "A") === tr.key && b.klass === build.klass),
                      ).map((tr) => (
                        <option key={tr.key} value={tr.key}>{tr.label}</option>
                      ))}
                    </select>
                    {/* build picker for the chosen class + category + tier.
                        Reflects the loaded preset (if it belongs to the current
                        class+category+tier filter); blank once edited/custom. */}
                    <select
                      value={
                        presetId &&
                        buildIndex.some(
                          (b) =>
                            b.id === presetId &&
                            (b.category ?? "solo-push") === buildCat &&
                            (b.tier ?? "A") === buildTier &&
                            b.klass === build.klass,
                        )
                          ? presetId
                          : ""
                      }
                      onChange={(e) => loadPreset(e.target.value)}
                      className="dark-select bg-[hsl(240_6%_11%)] border border-stone/60 rounded-none px-3 py-1.5 font-display text-sm text-bone tracking-wide focus:outline-none focus:border-ember/60 max-w-[260px]"
                    >
                      <option value="">{t("planner.chooseBuild", "Choose a build…")}</option>
                      {buildIndex
                        .filter((b) => (b.category ?? "solo-push") === buildCat && (b.tier ?? "A") === buildTier && b.klass === build.klass)
                        .map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                  </div>
                )}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-2 px-3 py-1.5 border border-stone/60 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/60 hover:text-ember hover:border-ember/60 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-ember" /> : <Link2 className="w-3.5 h-3.5" />}
                    {copied ? t("planner.copied") : t("planner.copyLink")}
                  </button>
                  <button
                    type="button"
                    onClick={exportBuild}
                    title={t("planner.exportHint", "Download this build as a JSON file")}
                    className="flex items-center gap-2 px-3 py-1.5 border border-stone/60 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/60 hover:text-ember hover:border-ember/60 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> {t("planner.export", "Export JSON")}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    title={t("planner.importHint", "Load a build from a JSON file")}
                    className="flex items-center gap-2 px-3 py-1.5 border border-stone/60 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/60 hover:text-ember hover:border-ember/60 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> {t("planner.import", "Import JSON")}
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      importBuild(e.target.files?.[0]);
                      e.target.value = ""; // allow re-importing the same file
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setClass(klass)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-stone/60 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/60 hover:text-ember hover:border-ember/60 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t("planner.reset")}
                  </button>
                </div>
                {importMsg && (
                  <div
                    role="status"
                    className={`basis-full flex items-center justify-between gap-3 font-mono text-[11px] ${importMsg.ok ? "text-ember" : "text-red-400"}`}
                  >
                    <span>{importMsg.text}</span>
                    <button type="button" onClick={() => setImportMsg(null)} aria-label="close" className="text-bone/50 hover:text-bone">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div>
                  <Paperdoll
                    klass={klass}
                    gender={build.gender ?? "male"}
                    equippedItem={(slot) => {
                      const ss = build.equipped[slot];
                      return ss ? itemById[ss.itemId] : undefined;
                    }}
                    slotGems={(slot) =>
                      (build.equipped[slot]?.gems ?? []).map((g) => ({
                        icon: g.legendary
                          ? data.gems.legendary[g.gem]?.icon
                          : data.gems.normal[g.gem]?.icon,
                      }))
                    }
                    slotTooltip={(slot) => {
                      const ss = build.equipped[slot];
                      const it = ss ? itemById[ss.itemId] : undefined;
                      return it ? itemTooltip(data, it, ss, slot, build.klass) : undefined;
                    }}
                    onSlotClick={(slot) => (build.equipped[slot] ? setEditorSlot(slot) : setPickerSlot(slot))}
                    onGender={(gender) => editBuild((b) => ({ ...b, gender }))}
                  />

                  <KanaiCube
                    data={data}
                    klass={klass}
                    kanai={build.kanai}
                    onChange={(kanai) => editBuild((b) => ({ ...b, kanai }))}
                  />

                  <SkillsPanel
                    klass={build.klass}
                    skills={build.skills}
                    onChange={(skills) => editBuild((b) => ({ ...b, skills }))}
                  />

                  <ParagonPanel
                    klass={build.klass}
                    paragon={build.paragon}
                    onChange={(paragon) => editBuild((b) => ({ ...b, paragon }))}
                  />

                  <AltarPanel
                    data={data}
                    active={build.altar}
                    onChange={(altar) => editBuild((b) => ({ ...b, altar }))}
                  />
                </div>

                <StatSummary data={data} build={build} onBuildChange={setBuild} />
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />

      {/* item picker */}
      <Dialog open={pickerSlot !== null} onOpenChange={(o) => !o && setPickerSlot(null)}>
        {data && pickerSlot && (
          <ItemPicker
            data={data}
            slot={pickerSlot}
            klass={klass}
            onPick={(it) => equip(pickerSlot, it)}
            onClose={() => setPickerSlot(null)}
          />
        )}
      </Dialog>

      {/* slot editor (Phase 2) */}
      <Dialog open={editorSlot !== null} onOpenChange={(o) => !o && setEditorSlot(null)}>
        {data && editorSlot && build.equipped[editorSlot] && (
          <SlotEditor
            data={data}
            slot={editorSlot}
            klass={build.klass}
            item={itemById[build.equipped[editorSlot]!.itemId]}
            state={build.equipped[editorSlot]!}
            onChange={(next) =>
              editBuild((b) => ({ ...b, equipped: { ...b.equipped, [editorSlot]: next } }))
            }
            onChangeItem={() => {
              setEditorSlot(null);
              setPickerSlot(editorSlot);
            }}
            onRemove={() => {
              editBuild((b) => {
                const eq = { ...b.equipped };
                delete eq[editorSlot];
                return { ...b, equipped: eq };
              });
              setEditorSlot(null);
            }}
            onClose={() => setEditorSlot(null)}
          />
        )}
      </Dialog>
    </div>
  );
};

export default Planner;
