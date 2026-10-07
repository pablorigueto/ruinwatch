import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLanguage, type Lang } from "@/i18n";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "ru", label: "Русский" },
  { code: "ko", label: "한국어" },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-ember transition-colors focus:outline-none">
        <Globe className="w-4 h-4" />
        <span className="font-display text-xs tracking-widest uppercase hidden lg:inline-block">
          {i18n.language.toUpperCase()}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="bg-background/95 backdrop-blur-md border-stone/60 panel-stone min-w-[140px] z-[100]"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as Lang)}
            className={`cursor-pointer font-display text-xs tracking-widest uppercase focus:bg-ember/10 focus:text-ember ${
              i18n.language === lang.code ? "text-ember" : "text-bone/80"
            }`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
