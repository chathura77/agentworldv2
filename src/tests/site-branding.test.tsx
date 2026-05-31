import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter, SiteMasthead, WorldWatermark } from "../components/SiteBranding";

describe("site branding", () => {
  it("links AgentWorld back to the Sarathchandra site", () => {
    const markup = renderToStaticMarkup(<SiteMasthead />);

    expect(markup).toContain("Chathura Sarathchandra");
    expect(markup).toContain("The Sandbox / AgentWorld");
    expect(markup).toContain("https://www.sarathchandra.com/");
    expect(markup).toContain("https://www.sarathchandra.com/the-sandbox/");
    expect(markup).toContain("Back to home");
  });

  it("renders the personal-project disclaimer and watermark", () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    const watermark = renderToStaticMarkup(<WorldWatermark />);

    expect(footer).toContain("personal research sandbox");
    expect(footer).toContain("not statements from");
    expect(watermark).toContain("sarathchandra.com / AgentWorld");
  });
});
