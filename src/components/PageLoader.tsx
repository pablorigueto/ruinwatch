import LogoMark from "./LogoMark";

/**
 * PageLoader — the on-brand loading screen shown while a lazy route's chunk or
 * its data is still loading. Reusable: pass `fullscreen` for route transitions
 * (centers in the viewport) or drop it inline inside a page section.
 *
 * Visual: the RuinWatch tower mark glowing/pulsing inside a slowly rotating
 * ember ring, over the dark background — matching the site chrome instead of a
 * bare spinner.
 */
const PageLoader = ({
  fullscreen = true,
  label,
}: {
  fullscreen?: boolean;
  label?: string;
}) => {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background"
          : "flex flex-col items-center justify-center py-24"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* ambient ember glow */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-2xl animate-pulse-ember"
          style={{ background: "radial-gradient(circle, hsl(var(--ember) / 0.45), transparent 70%)" }}
        />
        {/* rotating ember ring */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-stone/40 border-t-ember border-r-ember/40 animate-spin"
          style={{ animationDuration: "1.4s" }}
        />
        {/* brand mark, gently breathing */}
        <LogoMark size={52} withGlow={false} className="animate-pulse-ember" />
      </div>

      <p className="mt-6 font-display text-[10px] md:text-xs tracking-[0.45em] uppercase text-ember/80 animate-pulse">
        {label ?? "RuinWatch"}
      </p>

      {/* subtle scanning ember bar */}
      <div className="mt-4 h-px w-32 overflow-hidden bg-stone/40">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-ember to-transparent animate-loader-sweep" />
      </div>
    </div>
  );
};

export default PageLoader;
