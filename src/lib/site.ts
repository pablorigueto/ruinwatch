/**
 * Site-wide constants. Single source of truth for the Discord invite and the
 * pre-launch status, so swapping them later is a one-line change.
 */

/** Community Discord invite — every "join" CTA + the social icon point here. */
export const DISCORD_URL = "https://discord.gg/hufKAehxT2";

/** Payments are hosted separately; no Stripe credentials belong in this site. */
export const DONATE_URL = "https://donate.ruinwatch.com";

export const ACCOUNT_REGISTER_URL = "https://account.ruinwatch.com/#register";
export const ACCOUNT_RECOVER_URL = "https://account.ruinwatch.com/#recover";
export const ALPHA_RELEASE_DATE = "2026-11-01";

/** Pre-launch flag. While true, the site announces the alpha date. Account creation is
 *  available ahead of launch; community links remain on Discord. Flip to false on launch
 *  day to switch the copy/CTAs back to "play now". */
export const PRE_LAUNCH = true;
