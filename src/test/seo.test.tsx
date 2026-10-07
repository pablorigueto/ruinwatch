/**
 * Smoke test for the SEO pipeline: <Seo> must drive the document head
 * (title, description, canonical, OG) through react-helmet-async, and the
 * helpers must produce absolute URLs + branded titles.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import Seo from "@/components/Seo";
import { absUrl, pageTitle, SITE_URL } from "@/lib/seo";

const head = () => document.head;

describe("seo helpers", () => {
  it("absUrl makes paths absolute and passes through absolute urls", () => {
    expect(absUrl("/builds")).toBe(`${SITE_URL}/builds`);
    expect(absUrl("builds")).toBe(`${SITE_URL}/builds`);
    expect(absUrl("https://x.com/y")).toBe("https://x.com/y");
  });

  it("pageTitle brands non-home titles and leaves home unbranded-suffix", () => {
    expect(pageTitle("Builds")).toBe("Builds | RuinWatch");
    expect(pageTitle()).toContain("RuinWatch");
  });
});

describe("<Seo>", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  it("sets title, description, canonical and og:url", async () => {
    render(
      <HelmetProvider>
        <Seo path="/builds" title="Build Tier List" description="All the builds." />
      </HelmetProvider>,
    );
    await waitFor(() => expect(document.title).toBe("Build Tier List | RuinWatch"));

    const desc = head().querySelector('meta[name="description"]');
    expect(desc?.getAttribute("content")).toBe("All the builds.");

    const canonical = head().querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe(`${SITE_URL}/builds`);

    const ogUrl = head().querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute("content")).toBe(`${SITE_URL}/builds`);
  });

  it("emits a noindex robots tag when requested", async () => {
    render(
      <HelmetProvider>
        <Seo path="/planner" description="empty planner" noindex />
      </HelmetProvider>,
    );
    await waitFor(() => {
      const robots = head().querySelector('meta[name="robots"]');
      expect(robots?.getAttribute("content")).toContain("noindex");
    });
  });

  it("injects JSON-LD blocks", async () => {
    render(
      <HelmetProvider>
        <Seo
          path="/"
          description="home"
          jsonLd={{ "@type": "Organization", name: "RuinWatch" }}
        />
      </HelmetProvider>,
    );
    await waitFor(() => {
      const ld = head().querySelector('script[type="application/ld+json"]');
      expect(ld?.textContent).toContain("Organization");
    });
  });
});
