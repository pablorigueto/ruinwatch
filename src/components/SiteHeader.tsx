import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DISCORD_URL, PRE_LAUNCH } from "@/lib/site";
import LogoMark from "./LogoMark";
import SocialLinks from "./SocialLinks";

/**
 * Site nav with grouped dropdowns so we don't sprawl into a 10-link strip.
 * Three groups + a Join anchor:
 *
 *   - "The Vigil"  → landing-page anchor sections (story, pillars, …)
 *   - "Codex"      → game-data routes (Items, Classes)
 *   - "Merchants"  → NPC pages (Kadala, Myriam, Shen, Cosmetics)
 *   - "Join"       → landing anchor + the prominent "Join the Watch" CTA
 */
type NavLink = { href: string; label: string; route?: boolean };

const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const VIGIL_LINKS: NavLink[] = [
    { href: "/#story", label: t("nav.vigil") },
    { href: "/#features", label: t("nav.features") },
  ];

  const CODEX_LINKS: NavLink[] = [
    { href: "/items", label: t("nav.items"), route: true },
    { href: "/classes", label: t("nav.classes"), route: true },
    { href: "/builds", label: t("nav.builds"), route: true },
    { href: "/planner", label: t("nav.planner"), route: true },
  ];

  const MERCHANT_LINKS: NavLink[] = [
    { href: "/kadala", label: t("nav.kadala"), route: true },
    { href: "/myriam", label: t("nav.myriam"), route: true },
    { href: "/shen", label: t("nav.shen"), route: true },
    { href: "/cosmetics", label: t("nav.cosmetics"), route: true },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-stone/60 shadow-stone"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <LogoMark size={36} withGlow={false} className="group-hover:scale-105 transition-transform" />
          <span className="font-display text-bone text-lg md:text-xl tracking-[0.25em] text-stone-carved group-hover:text-ember transition-colors">
            RUINWATCH
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <NavGroup label={t("nav.groupVigil")} links={VIGIL_LINKS} />
          <NavGroup label={t("nav.groupCodex")} links={CODEX_LINKS} />
          <NavGroup label={t("nav.groupMerchants")} links={MERCHANT_LINKS} />
          <NavRoute to="/builds" label={t("nav.builds")} />
          <NavAnchor href="/#join" label={t("nav.join")} />
        </nav>

        <div className="flex items-center gap-4">
          <SocialLinks className="hidden md:flex" iconClassName="w-9 h-9" />
          <LanguageSwitcher />
          <a
            href={PRE_LAUNCH ? DISCORD_URL : "/#join"}
            {...(PRE_LAUNCH ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 border border-ember/60 text-ember font-display text-xs tracking-[0.3em] uppercase hover:bg-ember hover:text-primary-foreground transition-all duration-300 hover:shadow-ember-soft"
          >
            {PRE_LAUNCH ? t("nav.joinDiscord") : t("nav.joinBtn")}
          </a>

          {/* Mobile menu (hamburger → slide-in drawer) */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 text-bone hover:text-ember transition-colors focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" strokeWidth={1.75} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[82vw] max-w-sm bg-background/97 backdrop-blur-md border-l border-stone/60 p-0 overflow-y-auto"
            >
              <SheetTitle className="sr-only">RuinWatch menu</SheetTitle>
              <div className="px-6 pt-6 pb-4 border-b border-stone/50">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <LogoMark size={32} withGlow={false} />
                  <span className="font-display text-bone text-lg tracking-[0.25em] text-stone-carved">
                    RUINWATCH
                  </span>
                </Link>
              </div>

              <nav className="px-3 py-4 space-y-6">
                <MobileSection title={t("nav.groupVigil")} links={VIGIL_LINKS} onNavigate={() => setMobileOpen(false)} />
                <MobileSection title={t("nav.groupCodex")} links={CODEX_LINKS} onNavigate={() => setMobileOpen(false)} />
                <MobileSection title={t("nav.groupMerchants")} links={MERCHANT_LINKS} onNavigate={() => setMobileOpen(false)} />
              </nav>

              <div className="px-6 pb-8 pt-2">
                <a
                  href={PRE_LAUNCH ? DISCORD_URL : "/#join"}
                  {...(PRE_LAUNCH ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-ember/60 text-ember font-display text-xs tracking-[0.3em] uppercase hover:bg-ember hover:text-primary-foreground transition-all duration-300"
                >
                  {PRE_LAUNCH ? t("nav.joinDiscord") : t("nav.joinBtn")}
                </a>
                <SocialLinks className="flex justify-center mt-6" iconClassName="w-9 h-9" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

/** A labelled group of links in the mobile drawer. */
const MobileSection = ({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: NavLink[];
  onNavigate: () => void;
}) => (
  <div>
    <p className="px-3 mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ember/70">
      {title}
    </p>
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          {link.route ? (
            <Link
              to={link.href}
              onClick={onNavigate}
              className="block px-3 py-3 font-display text-sm tracking-[0.2em] uppercase text-bone/80 hover:text-ember hover:bg-ember/5 transition-colors"
            >
              {link.label}
            </Link>
          ) : (
            <a
              href={link.href}
              onClick={onNavigate}
              className="block px-3 py-3 font-display text-sm tracking-[0.2em] uppercase text-bone/80 hover:text-ember hover:bg-ember/5 transition-colors"
            >
              {link.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const TRIGGER_CLS =
  "font-display text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-ember transition-colors relative after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-px after:bg-ember after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-center";

const NavAnchor = ({ href, label }: { href: string; label: string }) => (
  <a href={href} className={TRIGGER_CLS}>
    {label}
  </a>
);

const NavRoute = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className={TRIGGER_CLS}>
    {label}
  </Link>
);

const NavGroup = ({ label, links }: { label: string; links: NavLink[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      className={`${TRIGGER_CLS} flex items-center gap-1.5 data-[state=open]:text-ember focus:outline-none focus-visible:text-ember`}
    >
      {label}
      <ChevronDown
        className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180"
        strokeWidth={1.5}
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      sideOffset={12}
      className="bg-background/95 backdrop-blur-md border-stone/70 shadow-stone rounded-none p-1 min-w-[14rem]"
    >
      {links.map((link) => (
        <DropdownMenuItem
          key={link.href}
          asChild
          className="cursor-pointer rounded-none font-display text-xs tracking-[0.25em] uppercase text-muted-foreground focus:bg-ember/10 focus:text-ember data-[highlighted]:bg-ember/10 data-[highlighted]:text-ember px-4 py-2.5"
        >
          {link.route ? (
            <Link to={link.href}>{link.label}</Link>
          ) : (
            <a href={link.href}>{link.label}</a>
          )}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default SiteHeader;
