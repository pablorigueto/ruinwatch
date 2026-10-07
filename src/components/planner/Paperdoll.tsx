/**
 * Paperdoll — the in-game-style equipment doll: the class character art with the
 * 13 equip slots laid over it at the classic Diablo III inventory positions
 * (left column, right column, weapons at the bottom). Clicking a slot opens the
 * item picker for that slot; an equipped slot shows its icon framed by rarity.
 *
 * Background art per class+gender lives in /public/planner/paperdoll/.
 */
import { useTranslation } from "react-i18next";
import { ItemTooltip, PlannerItem, Quality, SLOT_LABELS, SlotId } from "@/lib/planner";

const QUALITY_COLOR: Record<Quality, string> = {
  set: "120 60% 55%",
  legendary: "30 90% 55%",
  rare: "55 90% 60%",
  ethereal: "200 90% 60%", // cyan-blue — ethereals read distinctly
};

/** Render the bracketed numeric values in green like the in-game tooltip. */
const hl = (text: string) =>
  text.split(/(\d[\d,.]*%?(?:\s*(?:seconds?|yards?|stacks?))?)/g).map((p, i) =>
    /^\d/.test(p) ? <span key={i} className="text-[#6fb3ff]">{p}</span> : <span key={i}>{p}</span>,
  );

/** Read-only hover card for an equipped item — the in-game style tooltip. */
const ItemCard = ({ tip, color }: { tip: ItemTooltip; color: string }) => (
  <span
    className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-full top-0 ml-2 z-40 w-72 text-left pointer-events-none"
    style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.85))" }}
  >
    <span className="block border-2 rounded-md overflow-hidden" style={{ backgroundColor: "#0c0a08", borderColor: `hsl(${color})` }}>
      <span className="block text-center px-3 py-2 border-b" style={{ background: "linear-gradient(#1a140c,#0c0a08)", borderColor: `hsl(${color} / 0.5)` }}>
        <span className="font-display text-base tracking-wide" style={{ color: `hsl(${color})` }}>{tip.name}</span>
        <span className="block font-mono text-[9px] uppercase tracking-widest text-bone/40 mt-0.5">{tip.typeLabel}</span>
      </span>
      <span className="block px-3 py-2.5 font-body text-[12px] space-y-0.5">
        {tip.primary.map((line, i) => (
          <span key={i} className="block leading-snug text-bone/85">{hl(line)}</span>
        ))}
        {tip.augment && <span className="block leading-snug text-[#c08bff] mt-1">{tip.augment}</span>}
        {tip.power && (
          <span className="block leading-snug text-[#e8a23a] mt-1.5 pt-1.5 border-t border-[#8a6d2f]/30">{hl(tip.power)}</span>
        )}
        {tip.setName && (
          <span className="block mt-1.5 pt-1.5 border-t border-[#8a6d2f]/30">
            <span className="block font-display text-[11px] uppercase tracking-wider text-[#5fd35f]">{tip.setName}</span>
            {tip.setBonuses?.map((b, i) => (
              <span key={i} className="block leading-snug text-[#5fd35f]/80 text-[11px] mt-0.5">{hl(b)}</span>
            ))}
          </span>
        )}
      </span>
    </span>
  </span>
);

/** Exact slot rectangles over the doll art, taken from the official planner
 *  layout (pixels on the 300×426 frame) so the slots sit on the drawn frames.
 *  [left, top, width, height] in px. */
const FRAME_W = 300;
const FRAME_H = 426;
const SLOT_RECT: Record<SlotId, [number, number, number, number]> = {
  head: [118, 9, 62, 62],
  shoulders: [36, 31, 62, 84],
  neck: [196, 46, 62, 62], // enlarged from 50×50 so the amulet reads clearly
  torso: [110, 77, 78, 111],
  waist: [110, 196, 78, 29],
  hands: [10, 130, 62, 83], // gloves (left)
  wrists: [226, 130, 62, 83], // bracers (right)
  legs: [118, 234, 62, 84],
  feet: [118, 326, 62, 84],
  leftfinger: [11, 222, 54, 54], // enlarged from 38×38
  rightfinger: [235, 222, 54, 54],
  mainhand: [11, 285, 60, 124],
  offhand: [227, 285, 60, 124],
};

const SlotIcon = ({
  slot,
  item,
  gems,
  tooltip,
  onClick,
}: {
  slot: SlotId;
  item?: PlannerItem;
  gems?: Array<{ icon?: string }>;
  tooltip?: ItemTooltip;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  const color = item ? QUALITY_COLOR[item.quality] : null;
  const ethereal = item?.quality === "ethereal";
  const [left, top, w, h] = SLOT_RECT[slot];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute bg-night/55 hover:bg-night/80 transition-colors rounded-sm flex items-center justify-center hover:z-30"
      style={{
        left: `${(left / FRAME_W) * 100}%`,
        top: `${(top / FRAME_H) * 100}%`,
        width: `${(w / FRAME_W) * 100}%`,
        height: `${(h / FRAME_H) * 100}%`,
        // ethereals get a brighter, thicker cyan ring/glow so they stand out
        border: color ? `${ethereal ? 2 : 1}px solid hsl(${color} / ${ethereal ? 1 : 0.8})` : "1px solid hsl(var(--stone) / 0.55)",
        boxShadow: color ? `0 0 ${ethereal ? 16 : 10}px hsl(${color} / ${ethereal ? 0.7 : 0.45})${ethereal ? `, inset 0 0 8px hsl(${color} / 0.35)` : ""}` : undefined,
      }}
    >
      {/* clipped icon layer (tooltip escapes the slot, so clip only the art) */}
      <span className="absolute inset-0 rounded-sm overflow-hidden flex items-center justify-center">
      {item?.icon ? (
        // fill the slot — D3 icons are 64×128, the slots roughly match, so cover
        // reads like the in-game inventory (full art, minimal crop).
        <img src={item.icon} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="font-mono text-[7px] leading-tight uppercase tracking-wider text-bone/25 text-center">
          {t(`planner.slots.${slot}`, SLOT_LABELS[slot])}
        </span>
      )}

      {/* socketed-gem indicator: gem icons in the bottom-left corner */}
      {gems && gems.length > 0 && (
        <span className="absolute bottom-0.5 left-0.5 right-0.5 flex gap-0.5 justify-start">
          {gems.map((g, i) =>
            g.icon ? (
              <img
                key={i}
                src={g.icon}
                alt=""
                // one gem (jewelry/single socket) renders large; multiple shrink to fit.
                style={{ width: `${gems.length <= 1 ? 46 : gems.length === 2 ? 34 : 28}%` }}
                className="aspect-square object-contain drop-shadow"
              />
            ) : (
              <span key={i} className="w-2.5 h-2.5 rounded-full bg-ember" />
            ),
          )}
        </span>
      )}
      </span>{/* end clipped icon layer */}

      {/* read-only hover tooltip (overflows the slot, not clipped) */}
      {item && tooltip && color && <ItemCard tip={tooltip} color={color} />}
    </button>
  );
};

const Paperdoll = ({
  klass,
  gender,
  equippedItem,
  slotGems,
  slotTooltip,
  onSlotClick,
  onGender,
}: {
  klass: string;
  gender: "male" | "female";
  equippedItem: (slot: SlotId) => PlannerItem | undefined;
  slotGems?: (slot: SlotId) => Array<{ icon?: string }>;
  slotTooltip?: (slot: SlotId) => ItemTooltip | undefined;
  onSlotClick: (slot: SlotId) => void;
  onGender: (g: "male" | "female") => void;
}) => {
  const { t } = useTranslation();
  const bg = `/planner/paperdoll/${klass}_${gender}.png`;

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* gender toggle */}
      <div className="flex justify-center gap-2 mb-3">
        {(["male", "female"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGender(g)}
            className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] border rounded-sm transition-colors ${
              gender === g
                ? "border-ember/60 text-ember bg-ember/10"
                : "border-stone/60 text-bone/50 hover:text-bone/80 hover:border-stone/80"
            }`}
          >
            <span className="text-base leading-none">{g === "male" ? "♂" : "♀"}</span>
            {t(`planner.gender.${g}`, g)}
          </button>
        ))}
      </div>

      {/* character art frame (kept at the D3 inventory aspect ratio) */}
      <div className="relative w-full" style={{ aspectRatio: "300 / 426" }}>
        <img
          src={bg}
          alt={`${klass} ${gender}`}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
        {(Object.keys(SLOT_RECT) as SlotId[]).map((slot) => (
          <SlotIcon
            key={slot}
            slot={slot}
            item={equippedItem(slot)}
            gems={slotGems?.(slot)}
            tooltip={slotTooltip?.(slot)}
            onClick={() => onSlotClick(slot)}
          />
        ))}
      </div>
    </div>
  );
};

export default Paperdoll;
