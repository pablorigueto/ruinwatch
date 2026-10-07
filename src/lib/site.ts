/**
 * Site-wide constants. Single source of truth for the Discord invite and the
 * pre-launch status, so swapping them later is a one-line change.
 */

/** Community Discord invite — every "join" CTA + the social icon point here. */
export const DISCORD_URL = "https://discord.gg/hufKAehxT2";

/** Pre-launch flag. While true, the site frames itself as "Coming Soon" and all
 *  CTAs funnel to Discord (the server isn't open yet). Flip to false on launch
 *  day to switch the copy/CTAs back to "play now". */
export const PRE_LAUNCH = true;
