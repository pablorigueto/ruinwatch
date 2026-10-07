import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window scroll to the top on every route change. React Router's
 * default behaviour preserves scroll position, which feels wrong for navigating
 * between unrelated pages (e.g. clicking an item card from the codex grid).
 * Anchored navigation within the same path (URLs with a hash) is left alone so
 * in-page jumps still work.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
