/**
 * One service row on an artisan/NPC page: alternating screenshot + copy.
 *
 * The screenshot is rendered with ZoomableImage so users can click for a
 * full-size lightbox; the copy block pulls 4 i18n keys under
 * `<ns>.functions.<key>` — { label, name, body, cost }.
 *
 * `reverse=true` puts the screenshot on the right (default left), so a page
 * with three rows can alternate L/R/L for a more dynamic read.
 */
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import ZoomableImage from "@/components/ZoomableImage";

interface Props {
  /** i18n namespace, e.g. "myriam" or "shen" — used to look up
   *  `<ns>.functions.<funcKey>.{label,name,body,cost,caption}`. */
  ns: string;
  funcKey: string;
  icon: LucideIcon;
  img: string;
  reverse?: boolean;
}

const ArtisanFunctionRow = ({ ns, funcKey, icon: Icon, img, reverse = false }: Props) => {
  const { t } = useTranslation();
  // Swap the column template (not just the positions) so the image always
  // sits in the narrow 260px column whether it's rendered on the left or the
  // right. Reordering alone leaves the image in the wide 1fr column and lets
  // it blow up to a low-res slab — the bug we just hit on Forge Jewelry and
  // Transmogrify.
  const cols = reverse
    ? "lg:grid-cols-[1fr_minmax(0,260px)]"
    : "lg:grid-cols-[minmax(0,260px)_1fr]";
  return (
    <article className={`grid grid-cols-1 ${cols} gap-8 items-center`}>
      <div className={reverse ? "lg:order-2" : ""}>
        <ZoomableImage
          src={img}
          alt={t(`${ns}.functions.${funcKey}.name`)}
          caption={t(`${ns}.functions.${funcKey}.caption`)}
        />
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-5 h-5 text-ember flex-none" strokeWidth={1.5} />
          <p className="font-display text-xs tracking-[0.4em] text-ember uppercase">
            {t(`${ns}.functions.${funcKey}.label`)}
          </p>
        </div>
        <h3 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider mb-4">
          {t(`${ns}.functions.${funcKey}.name`)}
        </h3>
        <p className="font-serif-elegant text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
          {t(`${ns}.functions.${funcKey}.body`)}
        </p>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-bone/70">
          {t(`${ns}.functions.${funcKey}.cost`)}
        </p>
      </div>
    </article>
  );
};

export default ArtisanFunctionRow;
