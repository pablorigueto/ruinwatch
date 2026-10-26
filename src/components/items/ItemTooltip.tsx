/**
 * Blizzard-faithful tooltip for a single item.
 *
 * The crawler preserves Blizzard's inline `<span class="d3-color-*">` markup
 * in every stat string, so we re-emit those via dangerouslySetInnerHTML and
 * let the CSS in items.css color them.
 */
import { Link } from "react-router-dom";
import { Item, iconSrc } from "@/lib/items";
import { NativeItemFrame } from "./NativeItemFrame";

interface Props {
  item: Item;
}

const ItemTooltip = ({ item }: Props) => {
  const icon = iconSrc(item);

  return (
    <NativeItemFrame name={item.name} rarity={item.rarity} className="d3-tooltip max-w-md">
      <div className="native-item-summary">
        {icon && (
          <div className="native-item-art">
            <img
              src={icon}
              alt=""
              loading="lazy"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="native-item-kind">
            {item.item_type}
          </p>
          {item.slot && <p className="native-item-slot">{item.slot}</p>}
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
            <div className="native-stat-number">
              {block.value}
              {block.label && (
                <div className="native-stat-label">
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

      {item.flavor && (
        <div
          className="d3-rich native-item-flavor"
          dangerouslySetInnerHTML={{ __html: item.flavor }}
        />
      )}
      <span className="native-item-end">
        {item.unique_equipped && <span className="unique">Unique Equipped</span>}
        {item.required_level != null && <span className="block">Required Level: {item.required_level}</span>}
        {item.extras.map((line, i) => <span className="block" key={i}>{line}</span>)}
      </span>
    </NativeItemFrame>
  );
};

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="native-item-section">
    <h4>
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
