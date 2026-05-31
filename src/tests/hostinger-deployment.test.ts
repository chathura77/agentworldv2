import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Hostinger VPS deployment artifacts", () => {
  it("keeps the Compose service local-only and hardened", () => {
    const compose = readFileSync("deploy/hostinger/compose.yaml", "utf8");

    expect(compose).toContain("AGENTWORLD_BASE: ${AGENTWORLD_BASE:-/}");
    expect(compose).toContain('"127.0.0.1:${AGENTWORLD_HOST_PORT:-8080}:8080"');
    expect(compose).toContain("read_only: true");
    expect(compose).toContain("no-new-privileges:true");
    expect(compose).toContain("cap_drop:");
    expect(compose).toContain("http://127.0.0.1:8080${AGENTWORLD_HEALTH_PATH:-/}");
  });

  it("documents the path reverse proxy and repeatable update command", () => {
    const location = readFileSync(
      "deploy/hostinger/nginx-agentworld-location.conf",
      "utf8",
    );
    const script = readFileSync("deploy/hostinger/update.sh", "utf8");
    const readme = readFileSync("README", "utf8");
    const docs = readFileSync("docs/hostinger-vps-deployment.md", "utf8");

    expect(location).toContain("location ^~ /agentworld/");
    expect(location).toContain("proxy_pass http://127.0.0.1:8080;");
    expect(script).toContain("git pull --ff-only origin");
    expect(script).toContain("up -d --build --remove-orphans");
    expect(script).toContain("AGENTWORLD_HEALTH_PATH");
    expect(readme).toContain("Hostinger VPS Recommended Path");
    expect(readme).toContain("agentworld.sarathchandra.com");
    expect(readme).toContain("Updating Production");
    expect(readme).toContain("Maintenance");
    expect(readme).toContain("Rollback");
    expect(docs).toContain("DNS cannot route only");
    expect(docs).toContain("Name: agentworld");
    expect(docs).toContain("APP_DIR=/opt/agentworld");
  });
});
