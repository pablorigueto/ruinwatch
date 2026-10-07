/**
 * Blizzard-faithful tooltip for a single item.
 *
 * The crawler preserves Blizzard's inline `<span class="d3-color-*">` markup
 * in every stat string, so we re-emit those via dangerouslySetInnerHTML and
 * let the CSS in items.css color them.
 */
import { Link } from "react-router-dom";
import { Item, iconSrc, rarityColorClass } from "@/lib/items";

interface Props {
  item: Item;
}

const ItemTooltip = ({ item }: Props) => {
  const nameColor = rarityColorClass(item.rarity);
  const icon = iconSrc(item);

  return (
    <div className="d3-tooltip panel-stone bg-card/90 backdrop-blur-sm p-5 max-w-md">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-none w-[66px] flex items-start justify-center">
            <img
              src={icon}
              alt=""
              loading="lazy"
              className="max-w-[66px] max-h-[130px] w-auto h-auto border border-stone bg-night"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={`font-display text-lg leading-tight tracking-wider ${nameColor}`}
          >
            {item.name}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {item.item_type}
            {item.slot ? <> · {item.slot}</> : null}
          </p>
          {item.required_level != null && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Required level <span className="text-bone">{item.required_level}</span>
            </p>
          )}
          {item.class_restriction.length > 0 && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/80 mt-1">
              {item.class_restriction.join(" · ")}
            </p>
          )}
        </div>
      </div>

      {item.armor_or_weapon.map((block, i) => (
        <div key={i} className="mt-2">
          {block.value && (
            <div className="font-display text-2xl text-bone leading-none">
              {block.value}
              {block.label && (
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  {block.label}
                </div>
              )}
            </div>
          )}
          {!block.value && block.html && (
            <div
              className="d3-rich text-bone/90 text-sm"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          )}
        </div>
      ))}

      {item.primary.length > 0 && (
        <Section label="Primary">
          {item.primary.map((html, i) => (
            <Line key={i} html={html} />
          ))}
        </Section>
      )}

      {item.secondary.length > 0 && (
        <Section label="Secondary">
          {item.secondary.map((html, i) => (
            <Line key={i} html={html} />
          ))}
        </Section>
      )}

      {item.choice.length > 0 && (
        <Section label="Choice">
          {item.choice.map((grp, i) => {
            const [head, ...opts] = grp;
            return (
              <div
                key={i}
                className="mt-1 border border-dashed border-stone/60 bg-night/40 px-2 py-1"
              >
                {head && <Line html={head} />}
                {opts.map((opt, j) => (
                  <Line key={j} html={opt} />
                ))}
              </div>
            );
          })}
        </Section>
      )}

      {item.item_set && <SetBlock set={item.item_set} />}

      {(item.extras.length > 0 || item.unique_equipped) && (
        <div className="mt-3 pt-2 border-t border-dashed border-stone/60 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {[
            ...(item.unique_equipped ? ["Unique Equipped"] : []),
            ...item.extras,
          ].join(" · ")}
        </div>
      )}

      {item.flavor && (
        <div
          className="d3-rich mt-3 pt-2 border-t border-dashed border-stone/60 font-serif-elegant italic text-bone/70 text-sm leading-snug"
          dangerouslySetInnerHTML={{ __html: item.flavor }}
        />
      )}
    </div>
  );
};

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="mt-3 pt-2 border-t border-dashed border-stone/60">
    <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
      {label}
    </h4>
    {children}
  </div>
);

const Line = ({ html }: { html: string }) => (
  <div
    className="d3-rich text-sm text-bone/95 leading-snug"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

const SET_GREEN = "text-[hsl(120,55%,55%)]";

const SetBlock = ({ set }: { set: NonNullable<Item["item_set"]> }) => (
  <div className="mt-3 pt-2 border-t border-dashed border-stone/60">
    {set.name && (
      <h4 className={`font-display tracking-wider text-base ${SET_GREEN}`}>
        {set.name}
      </h4>
    )}
    {set.pieces.length > 0 && (
      <ul className="mt-1 ml-1 space-y-0.5">
        {set.pieces.map((p) => {
          const targetSlug =
            p.href.startsWith("/en-us/item/") && !p.href.endsWith("/")
              ? p.href.split("/").pop() ?? ""
              : "";
          const className = `font-display text-sm tracking-wide ${
            p.is_current ? "text-bone" : "text-muted-foreground hover:text-ember"
          }`;
          return (
            <li key={p.href + p.name}>
              {targetSlug && !p.is_current ? (
                <Link to={`/items/${encodeURIComponent(targetSlug)}`} className={className}>
                  {p.name}
                </Link>
              ) : (
                <span className={className}>{p.name}</span>
              )}
            </li>
          );
        })}
      </ul>
    )}
    {set.bonuses.length > 0 && (
      <div className="mt-3 space-y-1.5">
        {set.bonuses.map((html, i) => (
          <div
            key={i}
            className={`d3-rich text-sm leading-snug ${SET_GREEN}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>
    )}
  </div>
);

export default ItemTooltip;
