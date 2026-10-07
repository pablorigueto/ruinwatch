/**
 * AltarPanel — the Altar of Rites seal tree (Season of the Forbidden Archives),
 * rendered as a lattice: the etched stone background with the
 * 30 seal coins laid over it at their grid positions, connected by the bg's
 * carved lines. Each seal is clickable (toggles active) and shows a tooltip with
 * its name, effect and flavor text. A node only lights up once its prerequisites
 * (`requires`) are met, mirroring the in-game altar.
 *
 * Each seal's tooltip also shows what it asks you to sacrifice (see lib/altar),
 * and the panel lists the total sacrifice of the active seals.
 *
 * Assets:
 *   /planner/altar/altar-bg.webp  — background lattice (340×442)
 *   /planner/altar/altar1.webp    — 26 minor seal coins (sprite, 64px cells)
 *   /planner/altar/altar2.webp    — 4 major seals (sprite)
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gem, ChevronDown } from "lucide-react";
import { AltarNode, PlannerData } from "@/lib/planner";
import { ALTAR_ITEMS, AltarCost, BOUNTY_MATS, SealCost, altarTotals, sealCosts } from "@/lib/altar";

/** The seal lattice spans cols 0–8 and rows 0–10 on the 340×442 background.
 *  These map a grid cell to a percentage position tuned to the etched art. */
const COLS = 9;
const ROW_MIN = 0;
const ROW_MAX = 10;
const PAD_X = 9; // % inset so edge coins sit on the carved lines
const PAD_Y = 7;
const colPct = (col: number) => PAD_X + (col / (COLS - 1)) * (100 - 2 * PAD_X);
const rowPct = (row: number) => PAD_Y + ((row - ROW_MIN) / (ROW_MAX - ROW_MIN)) * (100 - 2 * PAD_Y);

// Sprite geometry (cells are 64px). altar1 = 26 minor cols × 4 state rows;
// altar2 scaled to the same 4-row height is 5 cols × 4 rows. Row 2 is the lit
// state. Background-position uses the "percent = cell/(count-1)" convention.
const MINOR_COLS = 26;
const MAJOR_COLS = 5;
const STATE_ROWS = 4;
const LIT_ROW = 2;

const ItemIcon = ({ src, size = "w-6 h-6" }: { src: string; size?: string }) => (
  <img src={src} alt="" loading="lazy" className={`${size} flex-none object-contain`} draggable={false} />
);

/** The items a seal costs, as icon + "qty× name" rows. */
const CostList = ({ cost }: { cost: AltarCost }) => {
  const { t } = useTranslation();
  return (
    <span className="block space-y-1">
      {cost.items.map(({ item, qty }) => (
        <span key={item} className="flex items-center gap-2 text-[12px] text-bone/85">
          <ItemIcon src={ALTAR_ITEMS[item].icon} />
          <span>{qty > 1 ? `${qty.toLocaleString()}× ` : ""}{ALTAR_ITEMS[item].name}</span>
        </span>
      ))}
      {cost.bountyEach && (
        <span className="flex items-center gap-2 text-[12px] text-bone/85">
          <span className="flex -space-x-2">{BOUNTY_MATS.map((k) => <ItemIcon key={k} src={ALTAR_ITEMS[k].icon} size="w-5 h-5" />)}</span>
          <span>{t("planner.altar.bountyEach", "{{count}}× each act bounty material", { count: cost.bountyEach })}</span>
        </span>
      )}
      {cost.requiresGR && (
        <span className="block text-[11px] text-[#c9a86a]/80">
          {t("planner.altar.requiresGR", "Requires Greater Rift {{gr}} cleared", { gr: cost.requiresGR })}
        </span>
      )}
    </span>
  );
};

/** Tooltip section: what this seal costs (or cost) to open. */
const SealSacrifice = ({ sc, active }: { sc: SealCost; active: boolean }) => {
  const { t } = useTranslation();
  const label = sc.kind === "final"
    ? t("planner.altar.finalSeal", "The Final Seal — no sacrifice")
    : sc.kind === "potion"
      ? (active
        ? t("planner.altar.potionOpened", "Opened as potion #{{n}}", { n: sc.step })
        : t("planner.altar.potionNext", "Sacrifice as potion #{{n}}", { n: sc.step }))
      : (active
        ? t("planner.altar.sealOpened", "Opened as seal #{{n}}", { n: sc.step })
        : t("planner.altar.sealNext", "Sacrifice as seal #{{n}}", { n: sc.step }));
  return (
    <span className="block px-3 pb-2.5 pt-2 border-t border-[#8a6d2f]/30">
      <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8c97a]/70 mb-1.5">{label}</span>
      {sc.cost && <CostList cost={sc.cost} />}
    </span>
  );
};

/** One seal coin: a sprite slice from altar1 (minors) / altar2 (majors).
 *  Inactive seals are dimmed; the apex (`final`) sits half a cell over. */
const Seal = ({
  id,
  node,
  active,
  reachable,
  sacrifice,
  onToggle,
}: {
  id: string;
  node: AltarNode;
  active: boolean;
  reachable: boolean;
  sacrifice?: SealCost;
  onToggle: () => void;
}) => {
  const major = node.major || node.final;
  const sheet = major ? "/planner/altar/altar2.webp" : "/planner/altar/altar1.webp";
  const cols = major ? MAJOR_COLS : MINOR_COLS;
  const iconX = (node.icon ?? 0) + (node.final ? 0.5 : 0);
  const posX = (iconX / (cols - 1)) * 100;
  const posY = (LIT_ROW / (STATE_ROWS - 1)) * 100;
  const size = major ? 13 : 10.5; // % of board width

  // anchor the tooltip so it never runs off the board's edges
  const col = node.col ?? 4;
  const anchorX = col <= 1 ? "left-0" : col >= 7 ? "right-0" : "left-1/2 -translate-x-1/2";
  // top rows have no room above → drop the card below the seal instead
  const above = (node.row ?? 0) > 2;
  const anchorY = above ? "bottom-[125%]" : "top-[125%]";
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none hover:z-40"
      style={{ left: `${colPct(node.col ?? 4)}%`, top: `${rowPct(node.row ?? 0)}%`, width: `${size}%` }}
    >
      <span
        className="block w-full aspect-square bg-no-repeat transition-all duration-150"
        style={{
          backgroundImage: `url('${sheet}')`,
          backgroundSize: `${cols * 100}% ${STATE_ROWS * 100}%`,
          backgroundPositionX: `${posX}%`,
          backgroundPositionY: `${posY}%`,
          filter: active ? "none" : "grayscale(0.85) brightness(0.55)",
          opacity: active ? 1 : reachable ? 0.9 : 0.5,
        }}
      />

      {/* hover tooltip — D3 ornate seal card (gold frame, dark fill) */}
      <span
        className={`invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute ${anchorX} ${anchorY} z-30 w-72 text-left pointer-events-none`}
        style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.8))" }}
      >
        <span className="block border-2 border-[#8a6d2f] rounded-md overflow-hidden" style={{ backgroundColor: "#0c0a08" }}>
          {/* title bar */}
          <span className="block text-center px-3 py-2 border-b border-[#8a6d2f]/60" style={{ background: "linear-gradient(#1a140c,#0c0a08)" }}>
            <span className="font-display text-base text-[#e8c97a] tracking-wide">{node.name}</span>
          </span>
          {/* body: seal icon + effect text */}
          <span className="flex gap-3 px-3 py-2.5">
            <span
              className="flex-none w-12 h-12 border border-[#8a6d2f]/70 bg-black/40 bg-no-repeat self-start"
              style={{
                backgroundImage: `url('${sheet}')`,
                backgroundSize: `${cols * 100}% ${STATE_ROWS * 100}%`,
                backgroundPositionX: `${posX}%`,
                backgroundPositionY: `${posY}%`,
              }}
            />
            <span className="block font-body text-[13px] text-[#c9a86a] leading-snug">{node.desc}</span>
          </span>
          {/* flavor */}
          {node.flavor && (
            <span className="block px-3 pb-2.5 pt-1 border-t border-[#8a6d2f]/30">
              <span className="block font-serif-elegant italic text-[12px] text-[#9a8a6a] leading-snug">
                {node.flavor}
              </span>
            </span>
          )}
          {sacrifice && <SealSacrifice sc={sacrifice} active={active} />}
        </span>
      </span>
    </button>
  );
};

const AltarPanel = ({
  data,
  active,
  onChange,
}: {
  data: PlannerData;
  active: string[];
  onChange: (next: string[]) => void;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const nodes = useMemo(() => Object.entries(data.altar ?? {}), [data.altar]);
  const activeSet = useMemo(() => new Set(active), [active]);
  const costs = useMemo(() => sealCosts(nodes, active), [nodes, active]);
  const totals = useMemo(() => altarTotals(costs, active), [costs, active]);
  if (nodes.length === 0) return null;

  const allOn = active.length === nodes.length;
  // a node is reachable once all its prerequisites are active
  const reachable = (node: AltarNode) =>
    !node.requires || node.requires.length === 0 || node.requires.some((r) => activeSet.has(r));

  const toggle = (id: string, node: AltarNode) => {
    if (activeSet.has(id)) {
      // turning a node off also turns off anything that depended only on it
      const next = new Set(active);
      const drop = (nid: string) => {
        if (!next.has(nid)) return;
        next.delete(nid);
        for (const [cid, cnode] of nodes) {
          if (cnode.requires?.includes(nid) && !cnode.requires.some((r) => r !== nid && next.has(r))) drop(cid);
        }
      };
      drop(id);
      onChange([...next]);
    } else if (reachable(node)) {
      onChange([...active, id]);
    }
  };
  const fill = () => onChange(nodes.map(([id]) => id));
  const reset = () => onChange([]);

  return (
    <section className="mt-8">
      <div className="w-full flex items-center gap-2 mb-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 group">
          <Gem className="w-4 h-4 text-ember" />
          <h2 className="font-display text-sm uppercase tracking-[0.3em] text-bone/70">
            {t("planner.altar.title")}
          </h2>
          <span className="font-mono text-[10px] text-bone/40">
            {active.length}/{nodes.length}
          </span>
        </button>
        <button
          type="button"
          onClick={allOn ? reset : fill}
          className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/50 hover:text-ember border border-stone/50 hover:border-ember/50 px-2 py-1 transition-colors"
        >
          {allOn ? t("planner.altar.reset", "Reset") : t("planner.altar.fill", "Fill")}
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="ml-auto" aria-label="toggle altar">
          <ChevronDown className={`w-4 h-4 text-bone/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="flex justify-center">
          {/* board is NOT clipped so seal tooltips can overflow it */}
          <div className="relative w-full max-w-[420px]" style={{ aspectRatio: "340 / 442" }}>
            {/* clipped background layer */}
            <div className="absolute inset-0 rounded-sm overflow-hidden border border-stone/50">
              <img
                src="/planner/altar/altar-bg.webp"
                alt=""
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
            </div>
            {nodes.map(([id, node]) => (
              <Seal
                key={id}
                id={id}
                node={node}
                active={activeSet.has(id)}
                reachable={reachable(node)}
                sacrifice={costs.get(id)}
                onToggle={() => toggle(id, node)}
              />
            ))}
          </div>
        </div>
      )}

      {open && totals.length > 0 && (
        <div className="mt-5 mx-auto max-w-[420px] border border-stone/50 bg-card/40 p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/55 mb-2">
            {t("planner.altar.totals", "Sacrifice list ({{count}} seals)", { count: active.length })}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {totals.map(({ item, qty }) => (
              <li key={item} className="flex items-center gap-2 text-[12px] text-bone/80">
                <ItemIcon src={ALTAR_ITEMS[item].icon} />
                <span className="font-mono text-ember/90 tabular-nums">{qty.toLocaleString()}×</span>
                <span className="leading-tight">{ALTAR_ITEMS[item].name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default AltarPanel;
