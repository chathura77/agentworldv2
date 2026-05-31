import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SEO and AI metadata", () => {
  it("publishes canonical search metadata and structured data", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain(
      '<link rel="canonical" href="https://agentworld.sarathchandra.com/"',
    );
    expect(html).toContain("AgentWorld: AI Agents in a Grid World");
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type": "WebApplication"');
    expect(html).toContain('"@type": "BreadcrumbList"');
    expect(html).toContain("AI Agents in a Grid World Simulation");
    expect(html).toContain("%BASE_URL%llms.txt");
    expect(html).toContain("%BASE_URL%agentworld.md");
  });

  it("publishes AI-readable resources and crawl maps", () => {
    const robots = readFileSync("public/robots.txt", "utf8");
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    const llms = readFileSync("public/llms.txt", "utf8");
    const markdownBrief = readFileSync("public/agentworld.md", "utf8");
    const manifest = JSON.parse(readFileSync("public/site.webmanifest", "utf8"));
    const aiIndex = JSON.parse(readFileSync("public/ai-index.json", "utf8"));

    expect(robots).toContain(
      "Sitemap: https://agentworld.sarathchandra.com/sitemap.xml",
    );
    expect(robots).toContain("User-agent: OAI-SearchBot");
    expect(robots).toContain("User-agent: GPTBot");
    expect(sitemap).toContain("<loc>https://agentworld.sarathchandra.com/</loc>");
    expect(sitemap).toContain(
      "<loc>https://agentworld.sarathchandra.com/llms.txt</loc>",
    );
    expect(llms).toContain("# AgentWorld");
    expect(llms).toContain("Preferred Citation");
    expect(markdownBrief).toContain("AgentWorld: AI Agents in a Grid World Simulation");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(aiIndex.canonicalUrl).toBe("https://agentworld.sarathchandra.com/");
    expect(aiIndex.runtimeNotes.requiresBackend).toBe(false);
  });

  it("serves path-deployed AI resources through the Nginx rewrite", () => {
    const nginx = readFileSync("nginx.conf", "utf8");

    expect(nginx).toContain("location ^~ /agentworld/");
    expect(nginx).toContain("location = /agentworld/agentworld.md");
    expect(nginx).toContain("default_type text/markdown;");
    expect(nginx).toContain("default_type application/manifest+json;");
    expect(nginx).toContain("rewrite ^/agentworld/(.*)$ /$1 break;");
    expect(nginx).toContain("location ~* \\.(?:txt|xml|json|md|webmanifest)$");
  });
});
