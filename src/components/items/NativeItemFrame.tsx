import type { ReactElement, ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import "./native-item-frame.css";

export type ItemFrameTier = "normal" | "ancient" | "primal";

/** Original client frame slices share one outer width at every breakpoint. */
export function NativeItemFrame({ name, rarity = "legendary", tier = "normal", children, className = "" }: {
  name: string;
  rarity?: string;
  tier?: ItemFrameTier;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`native-item-frame rarity-${rarity} frame-${tier} ${className}`} data-item-frame={tier}>
    <span className="native-item-title"><span>{name}</span></span>
    <span className="native-item-content">{children}</span>
    <span className="native-item-bottom" aria-hidden="true" />
  </span>;
}

/** A portal keeps the native frame outside clipped paperdoll/picker containers. */
export function NativeItemHover({ children, content }: { children: ReactElement; content: ReactNode }) {
  return <Tooltip.Root delayDuration={150}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content side="right" sideOffset={10} collisionPadding={12} className="native-item-hover">
        {content}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>;
}
