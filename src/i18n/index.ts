/**
 * i18n bootstrap — English ships in the initial bundle (the paid-traffic
 * audience is US/English); the other six languages are code-split and fetched
 * on demand the first time a visitor selects them. This keeps the homepage JS
 * small instead of bundling all seven locales upfront.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";

/** Languages we support (English is always bundled; the rest lazy-load). */
export const SUPPORTED_LANGS = ["en", "pt", "es", "fr", "zh", "ru", "ko"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

/** Lazy importers for the non-default locales (each becomes its own chunk). */
const LOADERS: Record<Exclude<Lang, "en">, () => Promise<{ default: object }>> = {
  pt: () => import("./locales/pt"),
  es: () => import("./locales/es"),
  fr: () => import("./locales/fr"),
  zh: () => import("./locales/zh"),
  ru: () => import("./locales/ru"),
  ko: () => import("./locales/ko"),
};

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Switch language, fetching its bundle first if it isn't loaded yet. */
export async function setLanguage(lng: Lang) {
  if (lng !== "en" && !i18n.hasResourceBundle(lng, "translation")) {
    const mod = await LOADERS[lng]();
    i18n.addResourceBundle(lng, "translation", mod.default, true, true);
  }
  await i18n.changeLanguage(lng);
}

export default i18n;
