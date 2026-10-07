/**
 * /items — the Codex landing page.
 *
 * The full en-us item catalog. Items
 * load once at runtime from /items/items.json (TanStack Query, cached for the
 * session) so the React bundle stays small.
 *
 * Layout: items are grouped by super-category (Armor, Weapons, Jewelry, …),
 * then by category (Helms, Chest Armor, …), then by rarity within each
 * category. The search/filter bar narrows the visible set; sections with no
 * matches collapse out automatically.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import Seo from "@/components/Seo";
import PageLoader from "@/components/PageLoader";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ItemCard from "@/components/items/ItemCard";
import {
  Item,
  Rarity,
  RARITIES,
  categoryLabel,
  groupForCodex,
  rarityColorClass,
  useItems,
} from "@/lib/items";
import "@/components/items/items.css";

const Items = () => {
  const { t } = useTranslation();
  const { data: items, isLoading, error } = useItems();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [rar, setRar] = useState<string>("all");
  const [cls, setCls] = useState<string>("all");
  const location = useLocation();

  // Scroll to #sc-* / #cat-* targets that arrive via breadcrumb links.
  // The codex data fetches async, so the anchor target doesn't exist on
  // first paint — we re-attempt scroll once items have loaded.
  useEffect(() => {
    if (!items) return;
    const hash = location.hash.slice(1);
    if (!hash) return;
    // Defer to next frame so React has time to render the sections.
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [items, location.hash]);

  const categories = useMemo(() => {
    if (!items) return [] as string[];
    const set = new Set<string>();
    for (const it of items) if (it.category_slug) set.add(it.category_slug);
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo<Item[]>(() => {
    if (!items) return [];
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (cat !== "all" && it.category_slug !== cat) return false;
      if (rar !== "all" && it.rarity !== rar) return false;
      if (cls !== "all") {
        if (cls === "cross-class") {
          if (it.class_restriction.length > 0) return false;
        } else if (!it.class_restriction.includes(cls)) {
          return false;
        }
      }
      if (needle && !it.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, q, cat, rar, cls]);

  const groups = useMemo(() => groupForCodex(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/items"
        title="Diablo 3 Item Codex"
        description="Browse the full Diablo 3 item codex on RuinWatch — every legendary, set piece and Ethereal Weapon available on our Rites of Sanctuary private server, with affixes and legendary powers. Search by name, slot or rarity."
        keywords={["Diablo 3 items", "D3 legendary list", "Ethereal Weapons", "Diablo 3 set items", "Rites of Sanctuary"]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Codex", url: "/items" },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
              {t("items.tag")}
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
              {t("items.title")}
            </h1>
            <div className="divider-rune my-8" />
            <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
              {t("items.subtitle")}
            </p>
          </div>

          <div className="panel-stone bg-card/50 p-4 md:p-5 flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                strokeWidth={1.5}
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("items.search")}
                className="pl-9 bg-background/70 border-stone font-mono text-sm placeholder:text-muted-foreground/70"
              />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="md:w-56 bg-background/70 border-stone font-mono text-sm uppercase tracking-widest">
                <SelectValue placeholder={t("items.allCategories")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">{t("items.allCategories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rar} onValueChange={setRar}>
              <SelectTrigger className="md:w-44 bg-background/70 border-stone font-mono text-sm uppercase tracking-widest">
                <SelectValue placeholder={t("items.allRarities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("items.allRarities")}</SelectItem>
                {RARITIES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="md:w-52 bg-background/70 border-stone font-mono text-sm uppercase tracking-widest">
                <SelectValue placeholder={t("items.allClasses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("items.allClasses")}</SelectItem>
                {CLASS_ORDER.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="cross-class">{t("items.crossClass")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && <PageLoader fullscreen={false} label={t("items.loading")} />}

          {error && (
            <div className="text-center py-20 text-crimson font-mono text-sm uppercase tracking-widest">
              {t("items.error")}
            </div>
          )}

          {items && (
            <>
              {groups.length > 0 && (
                <nav className="sticky top-16 md:top-20 z-40 -mx-6 px-6 py-3 mb-8 bg-background/85 backdrop-blur-md border-y border-stone/60">
                  <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                    {groups.map((sg) => (
                      <li key={sg.key}>
                        <a
                          href={`#sc-${sg.key}`}
                          className="font-display text-[11px] tracking-[0.25em] uppercase text-muted-foreground hover:text-ember transition-colors"
                        >
                          {sg.label}
                          <span className="ml-1.5 text-muted-foreground/60 normal-case tracking-normal">
                            {sg.total}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-8 text-center">
                {filtered.length} / {items.length}
              </p>

              {groups.length === 0 ? (
                <p className="text-center py-20 font-mono text-sm uppercase tracking-widest text-muted-foreground">
                  {t("items.empty")}
                </p>
              ) : (
                <div className="space-y-16">
                  {groups.map((sg) => (
                    <section
                      key={sg.key}
                      id={`sc-${sg.key}`}
                      className="scroll-mt-32"
                    >
                      <header className="mb-6 flex items-baseline justify-between border-b border-stone/60 pb-3">
                        <h2 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-ember">
                          {sg.label}
                        </h2>
                        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                          {sg.total} items
                        </span>
                      </header>

                      <div className="space-y-10">
                        {sg.categories.map((cg) => {
                          // Collapse intermediate headers when the super-cat
                          // has a single category with a single rarity bucket
                          // (the Ethereal case: the section heading already
                          // says it all — class subdivisions come from
                          // splitForDisplay inside RarityBlock).
                          const collapse =
                            sg.categories.length === 1 &&
                            cg.byRarity.length === 1;
                          if (collapse) {
                            const only = cg.byRarity[0];
                            return (
                              <RarityBlock
                                key={cg.slug}
                                rarity={only.rarity}
                                items={only.items}
                                hideHeader
                              />
                            );
                          }
                          return (
                            <article
                              key={cg.slug}
                              id={`cat-${cg.slug}`}
                              className="scroll-mt-32"
                            >
                              <h3 className="font-display text-lg md:text-xl tracking-[0.2em] uppercase text-bone mb-4 flex items-baseline gap-3">
                                {cg.label}
                                <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                                  {cg.total}
                                </span>
                              </h3>

                              <div className="space-y-5">
                                {cg.byRarity.map(({ rarity, items: rItems }) => (
                                  <RarityBlock
                                    key={rarity}
                                    rarity={rarity}
                                    items={rItems}
                                  />
                                ))}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

const GEM_SLUG_RE = /-x1_([A-Za-z]+)_\d{2}$/;

const CLASS_ORDER = [
  "Barbarian",
  "Crusader",
  "Demon Hunter",
  "Monk",
  "Necromancer",
  "Witch Doctor",
  "Wizard",
];

const CROSS_CLASS = "Cross-class";

/** Returns [{ label, items }, …] split into visual rows.
 *
 *  - Gem bucket (magic-rarity gems): split by color (Amethyst / Diamond / …).
 *  - Any bucket with 2+ distinct class restrictions (sets, ethereals, mixed
 *    armor): split by class in canonical D3 order, with "Cross-class" pushed
 *    to the end so the class-specific stuff leads. Cross-class covers items
 *    like Blackthorne's, Bastions of Will, Endless Walk, Legacy of Nightmares
 *    — genuinely usable by any class, not transmog.
 */
function splitForDisplay(
  items: Item[],
): { label: string; items: Item[] }[] {
  if (items.length === 0) return [{ label: "", items }];

  const isGemBucket = items.every(
    (it) => it.category_slug === "gem" && GEM_SLUG_RE.test(it.slug),
  );
  if (isGemBucket) {
    const byColor = new Map<string, Item[]>();
    for (const it of items) {
      const m = it.slug.match(GEM_SLUG_RE);
      const color = m ? m[1] : "Other";
      const arr = byColor.get(color);
      if (arr) arr.push(it);
      else byColor.set(color, [it]);
    }
    return Array.from(byColor.entries()).map(([color, list]) => ({
      label: color,
      items: list,
    }));
  }

  const byClass = new Map<string, Item[]>();
  for (const it of items) {
    const cls = it.class_restriction[0] ?? CROSS_CLASS;
    const arr = byClass.get(cls);
    if (arr) arr.push(it);
    else byClass.set(cls, [it]);
  }
  if (byClass.size < 2) return [{ label: "", items }];

  const ordered: { label: string; items: Item[] }[] = [];
  for (const cls of CLASS_ORDER) {
    const list = byClass.get(cls);
    if (list && list.length > 0) {
      list.sort((a, b) => a.name.localeCompare(b.name));
      ordered.push({ label: cls, items: list });
      byClass.delete(cls);
    }
  }
  // Push "Any Class" (and any unexpected leftover labels) after the named
  // class groups, since the user is usually scanning for class-specific gear.
  const anyClass = byClass.get(CROSS_CLASS);
  if (anyClass && anyClass.length > 0) {
    anyClass.sort((a, b) => a.name.localeCompare(b.name));
    ordered.push({ label: CROSS_CLASS, items: anyClass });
    byClass.delete(CROSS_CLASS);
  }
  for (const [cls, list] of byClass) {
    list.sort((a, b) => a.name.localeCompare(b.name));
    ordered.push({ label: cls, items: list });
  }
  return ordered;
}

const RarityBlock = ({
  rarity,
  items,
  hideHeader = false,
}: {
  rarity: Rarity;
  items: Item[];
  hideHeader?: boolean;
}) => {
  const rows = splitForDisplay(items);
  return (
    <div>
      {!hideHeader && (
        <h4
          className={`font-mono text-[11px] tracking-[0.3em] uppercase mb-2 flex items-baseline gap-2 ${rarityColorClass(rarity)}`}
        >
          {rarity}
          <span className="text-muted-foreground tracking-[0.2em]">
            {items.length}
          </span>
        </h4>
      )}
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label || "_"}>
            {row.label && (
              <h5
                className={`font-mono text-[11px] tracking-[0.3em] uppercase mb-2 flex items-baseline gap-2 ${hideHeader ? rarityColorClass(rarity) : "text-muted-foreground"}`}
              >
                {row.label}
                <span className="text-muted-foreground/60 tracking-[0.2em]">
                  {row.items.length}
                </span>
              </h5>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {row.items.map((it) => (
                <ItemCard key={it.slug} item={it} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Items;
