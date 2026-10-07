/**
 * CurrentBadge — a tiny "Current" pill marking the live/season copy of a
 * legendary when the game data ships several patch-pack variants of the same
 * item (the highest "Pxx_" prefix wins).
 */
import { useTranslation } from "react-i18next";

const CurrentBadge = () => {
  const { t } = useTranslation();
  return (
    <span
      title={t("planner.currentHint", "Live season version of this item")}
      className="flex-none inline-flex items-center font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-sm bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
    >
      {t("planner.current", "Current")}
    </span>
  );
};

export default CurrentBadge;
