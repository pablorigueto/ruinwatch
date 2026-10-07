/**
 * SocialLinks — Discord / Facebook / Instagram icon buttons.
 *
 * lucide-react ships Facebook & Instagram but dropped brand logos like Discord,
 * so the Discord mark is an inline SVG of the official glyph. All three render
 * as square ghost buttons that glow ember on hover, matching the site chrome.
 */
import { Facebook, Instagram } from "lucide-react";
import { DISCORD_URL } from "@/lib/site";
import DiscordIcon from "./DiscordIcon";

const FACEBOOK_URL = "https://www.facebook.com/ruinwatch";
const INSTAGRAM_URL = "https://www.instagram.com/ruinwatch";

const ITEMS = [
  { href: DISCORD_URL, label: "Discord", Icon: DiscordIcon },
  { href: FACEBOOK_URL, label: "Facebook", Icon: Facebook },
  { href: INSTAGRAM_URL, label: "Instagram", Icon: Instagram },
];

const SocialLinks = ({
  className = "",
  iconClassName = "w-10 h-10",
}: {
  className?: string;
  /** Size classes for each button (defaults to a 40px footer-sized button). */
  iconClassName?: string;
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {ITEMS.map(({ href, label, Icon }) => (
      <a
        key={label}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label}
        title={label}
        className={`flex items-center justify-center ${iconClassName} border border-stone/70 text-bone/70 hover:text-ember hover:border-ember/60 hover:bg-ember/10 transition-colors rounded-sm`}
      >
        <Icon className="w-[18px] h-[18px]" />
      </a>
    ))}
  </div>
);

export default SocialLinks;
