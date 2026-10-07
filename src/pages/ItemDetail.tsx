import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import Seo from "@/components/Seo";
import { SITE_NAME, breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ItemTooltip from "@/components/items/ItemTooltip";
import {
  CATEGORY_ALIASES,
  SUPER_CATS,
  indexBySlug,
  rarityColorClass,
  useItems,
} from "@/lib/items";
import "@/components/items/items.css";

/** Build a /items link for a breadcrumb href like /en-us/item/<slug>/.
 *  Maps known category slugs to #cat-<slug>, known super-category slugs to
 *  #sc-<key>, falls back to /items. Honors CATEGORY_ALIASES so a "voodoo-mask"
 *  breadcrumb scrolls to the unified Helms section. */
function codexLinkForBreadcrumb(href: string): string | null {
  const m = href.match(/^\/en-us\/item\/([a-z0-9-]+)\/$/);
  if (!m) return null;
  const slug = m[1];
  if (slug === "item" || slug === "" || slug === "items") return "/items";
  const sc = SUPER_CATS.find((s) => s.key === slug);
  if (sc) return `/items#sc-${sc.key}`;
  const aliased = CATEGORY_ALIASES[slug] ?? slug;
  return `/items#cat-${aliased}`;
}

const ItemDetail = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { data: items, isLoading, error } = useItems();

  const item = useMemo(() => {
    if (!items) return undefined;
    return indexBySlug(items).get(decodeURIComponent(slug));
  }, [items, slug]);

  // Per-item SEO: title = item name, description = type + cleaned flavor text.
  const itemSeo = useMemo(() => {
    if (!item) return null;
    const typeLabel = item.item_type ? `${item.rarity} ${item.item_type}`.trim() : item.rarity;
    const flavor = (item.flavor ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const desc =
      `${item.name} — ${typeLabel} in Diablo 3 on ${SITE_NAME} (Rites of Sanctuary). ` +
      (flavor ? `${flavor} ` : "") +
      `View stats, affixes and where it drops.`;
    return {
      title: item.name,
      description: desc.slice(0, 300),
      image: item.icon_url,
      keywords: [item.name, `Diablo 3 ${item.item_type ?? "item"}`, item.rarity, "Rites of Sanctuary"],
    };
  }, [item]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {itemSeo && (
        <Seo
          path={`/items/${encodeURIComponent(slug)}`}
          title={itemSeo.title}
          description={itemSeo.description}
          image={itemSeo.image}
          type="article"
          keywords={itemSeo.keywords}
          jsonLd={breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Codex", url: "/items" },
            { name: item!.name, url: `/items/${encodeURIComponent(slug)}` },
          ])}
        />
      )}
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container max-w-6xl">
          {isLoading && <PageLoader fullscreen={false} label={t("items.loading")} />}

          {error && (
            <div className="text-center py-20 text-crimson font-mono text-sm uppercase tracking-widest">
              {t("items.error")}
            </div>
          )}

          {items && !item && (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-bone uppercase tracking-wider mb-4">
                {t("items.notFoundTitle")}
              </p>
              <Link
                to="/items"
                className="font-mono text-sm uppercase tracking-widest text-ember hover:text-ember-glow"
              >
                {t("items.backToCodex")}
              </Link>
            </div>
          )}

          {item && (
            <>
              <nav className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-8 flex items-center flex-wrap gap-1">
                <Link to="/items" className="hover:text-ember">
                  {t("nav.items")}
                </Link>
                {item.breadcrumb
                  .filter(
                    (c) =>
                      c.href.startsWith("/en-us/item/") &&
                      c.href.endsWith("/") &&
                      c.href !== "/en-us/item/",
                  )
                  .map((c) => {
                    const to = codexLinkForBreadcrumb(c.href);
                    return (
                      <span key={c.href} className="flex items-center gap-1">
                        <ChevronRight
                          className="w-3 h-3 inline"
                          strokeWidth={1.5}
                        />
                        {to ? (
                          <Link to={to} className="hover:text-ember">
                            {c.name}
                          </Link>
                        ) : (
                          <span>{c.name}</span>
                        )}
                      </span>
                    );
                  })}
                <ChevronRight className="w-3 h-3 inline" strokeWidth={1.5} />
                <span className={rarityColorClass(item.rarity)}>{item.name}</span>
              </nav>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,28rem)_1fr] gap-10">
                <ItemTooltip item={item} />

                <aside>
                  <h3 className="font-display text-xs tracking-[0.4em] uppercase text-ember mb-4">
                    {t("items.seeAlso")}
                  </h3>
                  <ul className="divide-y divide-stone/60 panel-stone bg-card/50 overflow-hidden">
                    {item.related.length === 0 && (
                      <li className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {t("items.noRelated")}
                      </li>
                    )}
                    {item.related.map((r) => {
                      const isItem =
                        r.href.startsWith("/en-us/item/") && !r.href.endsWith("/");
                      const targetSlug = isItem ? r.href.split("/").pop() ?? "" : "";
                      const local =
                        isItem && targetSlug
                          ? `/items/${encodeURIComponent(targetSlug)}`
                          : null;
                      return (
                        <li key={r.href + r.name}>
                          {local ? (
                            <Link
                              to={local}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-background/40 transition-colors"
                            >
                              <span className="font-display text-sm text-bone">
                                {r.name}
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                {r.level}
                              </span>
                            </Link>
                          ) : (
                            // fora do Codex: texto simples (sem link externo para outra versão do jogo)
                            <div className="flex items-center justify-between px-4 py-2.5">
                              <span className="font-display text-sm text-muted-foreground">
                                {r.name}
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                {r.level}
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ItemDetail;
