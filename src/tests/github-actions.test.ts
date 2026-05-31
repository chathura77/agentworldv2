import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("GitHub Actions CI", () => {
  it("runs the local production gate on pushes and pull requests", () => {
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

    expect(workflow).toContain("push:");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("actions/setup-node@v4");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run check");
  });

  it("smoke-tests the Hostinger-style Docker artifact", () => {
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

    expect(workflow).toContain("deploy/hostinger/compose.yaml config");
    expect(workflow).toContain("AGENTWORLD_BASE: /");
    expect(workflow).toContain("docker build --build-arg AGENTWORLD_BASE=");
    expect(workflow).toContain("http://127.0.0.1:8080/");
    expect(workflow).toContain("http://127.0.0.1:8080/llms.txt");
    expect(workflow).toContain("http://127.0.0.1:8080/ai-index.json");
  });

  it("documents CI and the manual VPS deployment boundary", () => {
    const readme = readFileSync("README", "utf8");
    const deploymentDocs = readFileSync("docs/hostinger-vps-deployment.md", "utf8");
    const productionDocs = readFileSync("docs/production-readiness.md", "utf8");

    expect(readme).toContain("GitHub Actions CI");
    expect(deploymentDocs).toContain("GitHub Actions");
    expect(deploymentDocs).toContain("does not SSH into the VPS");
    expect(productionDocs).toContain("GitHub Actions CI");
  });
});
