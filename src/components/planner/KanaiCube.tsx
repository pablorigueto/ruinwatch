/**
 * KanaiCube — Phase 3. Three Kanai's Cube slots (weapon / armor / jewelry),
 * each equipping one extractable legendary power, filtered by the chosen class.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CurrentBadge from "./CurrentBadge";
import {
  KanaiCat,
  KanaiState,
  PlannerData,
  itemForPower,
  kanaiPowers,
  powerDisplay,
} from "@/lib/planner";

const CATS: KanaiCat[] = ["weapon", "armor", "jewelry"];

/** Rich hover tooltip for an equipped Kanai power: the item
 *  name as title, the extracted power's name, then its full effect description
 *  (matches SkillCard / PassiveCard). */
const KanaiCard = ({
  cat,
  itemName,
  powerName,
  desc,
}: {
  cat: KanaiCat;
  itemName: string;
  powerName: string;
  desc: string | null;
}) => (
  <span
    className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-[108%] z-30 w-72 text-left pointer-events-none"
    style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.85))" }}
  >
    <span className="block border-2 border-[#8a6d2f] rounded-md overflow-hidden" style={{ backgroundColor: "#0c0a08" }}>
      <span className="block text-center px-3 py-2 border-b border-[#8a6d2f]/60" style={{ background: "linear-gradient(#1a140c,#0c0a08)" }}>
        <span className="font-display text-base text-[#e8c97a] tracking-wide">{itemName}</span>
      </span>
      <span className="block px-3 py-2.5 font-body text-[12px]">
        <span className="block text-[#c9a86a]/70 text-[10px] uppercase tracking-wider mb-1.5">Kanai&apos;s Cube · {cat}</span>
        <span className="block font-display text-sm text-ember tracking-wide mb-1">{powerName}</span>
        {desc && <span className="block leading-snug text-bone/80">{desc}</span>}
      </span>
    </span>
  </span>
);

const PowerPicker = ({
  data,
  cat,
  klass,
  onPick,
  onClose,
}: {
  data: PlannerData;
  cat: KanaiCat;
  klass: string;
  onPick: (powerId: string) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const all = useMemo(() => kanaiPowers(data, cat, klass), [data, cat, klass]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? all.filter((p) => p.name.toLowerCase().includes(n) || p.item.name.toLowerCase().includes(n)) : all;
  }, [all, q]);

  return (
    <DialogContent className="max-w-2xl bg-background border-stone/70 rounded-none p-0 gap-0 max-h-[85vh] flex flex-col">
      <DialogHeader className="p-5 border-b border-stone/60">
        <DialogTitle className="font-display text-lg text-bone uppercase tracking-wider">
          {t(`planner.kanai.${cat}`, cat)} — {t("planner.kanai.choose")}
        </DialogTitle>
      </DialogHeader>
      <div className="p-4 border-b border-stone/50">
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
      </div>
      <div className="overflow-y-auto p-2">
        <ul>
          {list.map((p) => (
            <li key={p.powerId}>
              <button
                type="button"
                onClick={() => onPick(p.powerId)}
                className="w-full flex items-start gap-3 p-2.5 text-left hover:bg-card/70 transition-colors"
              >
                <span className="flex-none w-10 h-10 border border-stone/60 bg-night rounded-sm overflow-hidden flex items-center justify-center">
                  {p.item.icon ? <img src={p.item.icon} alt="" className="max-w-full max-h-full object-contain" loading="lazy" /> : <Box className="w-4 h-4 text-bone/25" />}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-sm tracking-wide text-ember">{p.name}</span>
                    {p.item.current && <CurrentBadge />}
                  </span>
                  <span className="block font-body text-xs text-bone/55 leading-snug">{powerDisplay(p.item)}</span>
                  <span className="block font-mono text-[10px] text-bone/35">{p.item.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DialogContent>
  );
};

const KanaiSlot = ({
  data,
  cat,
  powerId,
  onOpen,
  onClear,
}: {
  data: PlannerData;
  cat: KanaiCat;
  powerId?: string;
  onOpen: () => void;
  onClear: () => void;
}) => {
  const { t } = useTranslation();
  const item = powerId ? itemForPower(data, powerId) : null;
  const power = item?.required?.custom;
  return (
    <div className="relative bg-card/60 border border-stone/60 p-3 group">
      {power && item && <KanaiCard cat={cat} itemName={item.name} powerName={power.name} desc={powerDisplay(item)} />}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/45">
          {t(`planner.kanai.${cat}`, cat)}
        </span>
        {powerId && (
          <button type="button" onClick={onClear} className="text-bone/40 hover:text-ember">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button type="button" onClick={onOpen} className="w-full flex items-start gap-3 text-left">
        <span className="flex-none w-11 h-11 border border-stone/60 bg-night rounded-sm overflow-hidden flex items-center justify-center">
          {item?.icon ? <img src={item.icon} alt="" className="max-w-full max-h-full object-contain" /> : <Box className="w-5 h-5 text-bone/30" />}
        </span>
        <span className="min-w-0">
          {power ? (
            <>
              <span className="block font-display text-sm text-ember tracking-wide">{power.name}</span>
              <span className="block font-body text-xs text-bone/55 leading-snug line-clamp-2">{powerDisplay(item!)}</span>
            </>
          ) : (
            <span className="font-body text-xs text-bone/35 italic">{t("planner.kanai.empty")}</span>
          )}
        </span>
      </button>
    </div>
  );
};

const KanaiCube = ({
  data,
  klass,
  kanai,
  onChange,
}: {
  data: PlannerData;
  klass: string;
  kanai: KanaiState;
  onChange: (next: KanaiState) => void;
}) => {
  const { t } = useTranslation();
  const [openCat, setOpenCat] = useState<KanaiCat | null>(null);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Box className="w-4 h-4 text-ember" />
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-bone/70">{t("planner.kanai.title")}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {CATS.map((cat) => (
          <KanaiSlot
            key={cat}
            data={data}
            cat={cat}
            powerId={kanai[cat]}
            onOpen={() => setOpenCat(cat)}
            onClear={() => onChange({ ...kanai, [cat]: undefined })}
          />
        ))}
      </div>

      <Dialog open={openCat !== null} onOpenChange={(o) => !o && setOpenCat(null)}>
        {openCat && (
          <PowerPicker
            data={data}
            cat={openCat}
            klass={klass}
            onPick={(powerId) => {
              onChange({ ...kanai, [openCat]: powerId });
              setOpenCat(null);
            }}
            onClose={() => setOpenCat(null)}
          />
        )}
      </Dialog>
    </section>
  );
};

export default KanaiCube;
