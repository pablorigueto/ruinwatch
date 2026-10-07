import { Link } from "react-router-dom";
import { Item, iconSrc, rarityBorderClass, rarityColorClass } from "@/lib/items";

interface Props {
  item: Item;
}

const ItemCard = ({ item }: Props) => {
  const icon = iconSrc(item);
  return (
    <Link
      to={`/items/${encodeURIComponent(item.slug)}`}
      className={`group flex items-center gap-3 panel-stone bg-card/60 hover:bg-card transition-colors p-3 border ${rarityBorderClass(item.rarity)}`}
    >
      <div className="flex-none w-[42px] h-[66px] flex items-center justify-center border border-stone bg-night">
        {icon ? (
          <img
            src={icon}
            alt=""
            loading="lazy"
            className="max-w-full max-h-full w-auto h-auto"
            style={{ imageRendering: "pixelated" }}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`font-display text-sm leading-tight tracking-wide truncate ${rarityColorClass(item.rarity)} group-hover:text-ember-glow transition-colors`}
        >
          {item.name}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground truncate">
          {item.item_type || item.slot || item.category_slug}
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
