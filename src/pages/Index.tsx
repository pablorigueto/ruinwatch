import Seo from "@/components/Seo";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import Features from "@/components/Features";
import Stats from "@/components/Stats";
import Join from "@/components/Join";
import Support from "@/components/Support";
import SiteFooter from "@/components/SiteFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/"
        description="RuinWatch is a free Diablo 3 private server built on the 'Rites of Sanctuary' patch with the full Altar of Rites and Ethereal Weapons enabled. 100% canonical D3, permanent Non-Season, with every cosmetic free — plus a full build planner and build tier list. Join the Greater Rift push today."
        keywords={[
          "Diablo 3 private server",
          "free Diablo III server",
          "Rites of Sanctuary",
          "Altar of Rites",
          "Ethereal Weapons",
          "Diablo 3 build planner",
          "Diablo 3 builds",
          "Diablo 3 tier list",
          "Diablo 3 all cosmetics free",
          "D3 wings pets pennants",
          "Diablo 3 non-season server",
          "Diablo 3 emulator",
        ]}
        jsonLd={[organizationSchema(), websiteSchema()]}
      />
      <SiteHeader />
      <main>
        <Hero />
        <Story />
        <Features />
        <Stats />
        <Join />
        <Support />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
