import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * SPA page-view tracking for Google Analytics (gtag.js loaded in index.html).
 *
 * On a single-page app the browser doesn't reload between routes, so GA only
 * records the first page_view. This sends an explicit page_view on every route
 * change (and on hash navigation) so internal navigation — and which pages paid
 * traffic actually lands on / converts from — is measured correctly.
 */
const GA_ID = "G-9XBRZF5599";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const Analytics = () => {
  const { pathname, search } = useLocation();
  // The initial page_view is already sent by gtag in index.html, so skip the
  // first run and only track subsequent in-app navigations.
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window.gtag !== "function") return;
    window.gtag("config", GA_ID, {
      page_path: pathname + search,
    });
  }, [pathname, search]);

  return null;
};

export default Analytics;
