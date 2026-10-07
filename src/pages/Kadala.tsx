/**
 * /kadala — Blood Shard gamble odds for every drop in every class.
 *
 * Numbers are loaded once from /public/kadala/kadala.json (built from the
 * server's canonical CSVs). Every row is matched to its codex entry by item id so the
 * page reuses the codex icon + tooltip — no item asset is duplicated.
 *
 * UI knobs:
 *   - class picker (7)
 *   - bucket tabs (helm, amulet, …, 1H, 2H)
 *   - Pattern seal toggle — halves displayed shards / doubles per-gamble odds
 *   - sortable columns (cost, weight, chance, avg shards)
 *   - shards-on-hand input → expected drops & probability for the focused row
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import Seo from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import ItemTooltip from "@/components/items/ItemTooltip";
import {
  ClassKey,
  KADALA_BUCKETS,
  KADALA_CLASSES,
  KadalaJoined,
  fmt,
  useKadalaJoined,
} from "@/lib/kadala";
import { iconSrc, rarityColorClass } from "@/lib/items";
import "@/components/items/items.css";

type SortKey =
  | "name"
  | "weight"
  | "perGamble"
  | "avgShards"
  | "shardsFor80"
  | "deathsBreath";

const Kadala = () => {
  const { t } = useTranslation();
  const [cls, setCls] = useState<ClassKey>("wizard");
  const [bucket, setBucket] = useState<string>("amulet");
  const [pattern, setPattern] = useState(false);
  const [shards, setShards] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("avgShards");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { rows, isLoading, error } = useKadalaJoined(cls);

  // Buckets that actually contain rows for this class — keeps the tab strip
  // honest (no empty "Mojo" tab on a Wizard, etc.).
  const presentBuckets = useMemo(() => {
    if (!rows) return new Set<string>();
    return new Set(rows.map((r) => r.bucket));
  }, [rows]);

  const bucketRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => r.bucket === bucket);
  }, [rows, bucket]);

  const adjusted = useMemo(() => {
    const factor = pattern ? 2 : 1;
    return bucketRows.map((r) => ({
      ...r,
      perGamble: r.perGamble * factor,
      avgShards: Math.round(r.avgShards / factor),
      shardsFor80: Math.round(r.shardsFor80 / factor),
    }));
  }, [bucketRows, pattern]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...adjusted].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
  }, [adjusted, sortKey, sortDir]);

  const shardsNum = Number(shards.replace(/[^0-9]/g, "")) || 0;

  function flip(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "asc");
    }
  }

  function SortHeader({ k, children }: { k: SortKey; children: React.ReactNode }) {
    const active = sortKey === k;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => flip(k)}
        className={`inline-flex items-center gap-1 hover:text-ember transition-colors ${active ? "text-ember" : ""}`}
      >
        {children}
        <Icon className="w-3 h-3" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/kadala"
        title="Kadala Blood Shard Gamble Odds"
        description="Kadala Blood Shard gambling odds for every slot and class on RuinWatch (Diablo 3, Rites of Sanctuary patch). See exact drop chances, costs and expected shards per legendary — including the Altar of Rites Pattern seal that doubles your gamble odds. Plan your gambles efficiently."
        keywords={["Kadala odds", "Diablo 3 blood shard gamble", "Kadala drop chances", "D3 gambling calculator", "Altar of Rites", "Rites of Sanctuary"]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Kadala", url: "/kadala" },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container">
          {/* Hero — title block on the left, Kadala portrait floats on the
              right with a soft ember glow behind her. On mobile the portrait
              hides so the text can breathe. */}
          <div className="relative mb-12 lg:min-h-[420px] grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-8 lg:gap-12">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
                {t("kadala.tag")}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
                {t("kadala.title")}
              </h1>
              <div className="divider-rune my-8 lg:mx-0" />
              <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
                {t("kadala.subtitle")}
              </p>
            </div>

            <div className="hidden lg:block relative flex-none">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl opacity-50"
                style={{
                  background:
                    "radial-gradient(ellipse at center, hsl(var(--ember) / 0.55), transparent 65%)",
                }}
              />
              <img
                src="/kadala/kadalahd.png"
                alt="Kadala"
                className="h-[420px] w-auto select-none"
                style={{
                  filter: "drop-shadow(0 12px 28px hsl(var(--ember) / 0.25))",
                }}
                draggable={false}
              />
            </div>
          </div>

          {/* class picker */}
          <div className="panel-stone bg-card/50 p-4 md:p-5 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
              {t("kadala.class")}
            </p>
            <div className="flex flex-wrap gap-2">
              {KADALA_CLASSES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCls(c.key)}
                  className={`px-4 py-2 border font-display text-xs tracking-[0.25em] uppercase transition-colors ${
                    cls === c.key
                      ? "border-ember text-ember bg-ember/5"
                      : "border-stone text-muted-foreground hover:text-bone hover:border-bone/60"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* bucket tabs + controls */}
          <div className="panel-stone bg-card/50 p-4 md:p-5 mb-6">
            <div className="flex flex-wrap gap-x-3 gap-y-2 mb-4">
              {KADALA_BUCKETS.filter((b) => presentBuckets.has(b.key)).map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBucket(b.key)}
                  className={`px-3 py-1.5 border font-mono text-[11px] tracking-[0.25em] uppercase transition-colors flex items-baseline gap-2 ${
                    bucket === b.key
                      ? "border-ember text-ember"
                      : "border-stone text-muted-foreground hover:text-bone hover:border-bone/60"
                  }`}
                >
                  {b.label}
                  <span className="text-[10px] opacity-70">{b.cost}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center pt-3 border-t border-stone/60">
              <label className="flex items-center gap-3 cursor-pointer">
                <Switch checked={pattern} onCheckedChange={setPattern} />
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-bone">
                  {t("kadala.pattern")}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                  {t("kadala.patternHint")}
                </span>
              </label>

              <div className="flex items-center gap-3 md:ml-auto">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {t("kadala.shardsOnHand")}
                </span>
                <Input
                  value={shards}
                  onChange={(e) => setShards(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-32 bg-background/70 border-stone font-mono text-sm text-right"
                />
              </div>
            </div>
          </div>

          {isLoading && <PageLoader fullscreen={false} label={t("items.loading")} />}

          {error && (
            <div className="text-center py-20 text-crimson font-mono text-sm uppercase tracking-widest">
              {t("items.error")}
            </div>
          )}

          {rows && (
            <>
              {sorted.length === 0 ? (
                <p className="text-center py-20 font-mono text-sm uppercase tracking-widest text-muted-foreground">
                  {t("kadala.empty")}
                </p>
              ) : (
                <div className="panel-stone bg-card/40 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left">
                      <tr className="border-b border-stone/60 bg-background/40">
                        <th className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground p-3">
                          <SortHeader k="name">{t("kadala.colItem")}</SortHeader>
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground p-3 text-right">
                          <SortHeader k="weight">{t("kadala.colWeight")}</SortHeader>
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground p-3 text-right">
                          <SortHeader k="perGamble">{t("kadala.colChance")}</SortHeader>
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground p-3 text-right">
                          <SortHeader k="avgShards">{t("kadala.colAvg")}</SortHeader>
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground p-3 text-right">
                          <SortHeader k="shardsFor80">{t("kadala.col80")}</SortHeader>
                        </th>
                        {shardsNum > 0 && (
                          <th className="font-mono text-[10px] uppercase tracking-[0.25em] text-ember p-3 text-right">
                            {t("kadala.colYourOdds")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((row) => (
                        <KadalaRowView
                          key={row.id}
                          row={row}
                          shards={shardsNum}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {sorted.length} {t("kadala.itemsInBucket")} ·{" "}
                {t("kadala.bucketShardCost", { cost: KADALA_BUCKETS.find((b) => b.key === bucket)?.cost ?? 0 })}
              </p>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

const KadalaRowView = ({
  row,
  shards,
}: {
  row: KadalaJoined;
  shards: number;
}) => {
  const codex = row.codex;
  const rarityClass = codex ? rarityColorClass(codex.rarity) : "text-bone";
  const icon = codex ? iconSrc(codex) : "";
  // Chance to get at least one drop with `shards` shards on this row's odds.
  // p_per_gamble * n_gambles where n = shards/cost — but the right closed-form
  // is 1 - (1 - per_gamble) ^ n. Cap at 99.99% for display sanity.
  const gambles = shards > 0 ? Math.floor(shards / row.shardCost) : 0;
  const yourOdds = gambles > 0 ? 1 - Math.pow(1 - row.perGamble, gambles) : 0;
  const expectedDrops = row.perGamble * gambles;

  const linkInner = (
    <span className="inline-flex items-center gap-3">
      <span className="w-9 h-12 flex items-center justify-center border border-stone bg-night flex-none">
        {icon ? (
          <img
            src={icon}
            alt=""
            loading="lazy"
            className="max-w-full max-h-full w-auto h-auto"
            style={{ imageRendering: "pixelated" }}
          />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className={`font-display tracking-wide ${rarityClass}`}>
          {row.name}
        </span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {row.slot} · {t_quality(row.quality)} · weight {row.weight}
        </span>
      </span>
    </span>
  );

  return (
    <tr className="border-b border-stone/30 hover:bg-background/40 transition-colors">
      <td className="p-3">
        {codex ? (
          <HoverCard openDelay={120} closeDelay={50}>
            <HoverCardTrigger asChild>
              <Link
                to={`/items/${encodeURIComponent(codex.slug)}`}
                className="block"
              >
                {linkInner}
              </Link>
            </HoverCardTrigger>
            <HoverCardContent
              side="right"
              align="start"
              className="p-0 border-none bg-transparent shadow-none w-auto max-w-md"
            >
              <ItemTooltip item={codex} />
            </HoverCardContent>
          </HoverCard>
        ) : (
          <span className="block">{linkInner}</span>
        )}
      </td>
      <td className="p-3 text-right font-mono text-sm text-bone/90">
        {row.weight}
      </td>
      <td className="p-3 text-right font-mono text-sm text-bone/90">
        {(row.perGamble * 100).toFixed(4)}%
      </td>
      <td className="p-3 text-right font-mono text-sm text-bone">
        {fmt(row.avgShards)}
      </td>
      <td className="p-3 text-right font-mono text-sm text-muted-foreground">
        {fmt(row.shardsFor80)}
      </td>
      {shards > 0 && (
        <td className="p-3 text-right font-mono text-sm">
          <span className="text-ember">{(yourOdds * 100).toFixed(2)}%</span>
          <span className="block text-[10px] text-muted-foreground">
            E[drops] {expectedDrops.toFixed(2)} · {fmt(gambles)} rolls
          </span>
        </td>
      )}
    </tr>
  );
};

// Tiny helper so quality text renders nicely without leaking the raw values.
function t_quality(q: string): string {
  if (q === "legendary") return "Legendary";
  if (q === "set") return "Set";
  if (q === "rare") return "Rare";
  if (q === "magic") return "Magic";
  return q;
}

export default Kadala;
