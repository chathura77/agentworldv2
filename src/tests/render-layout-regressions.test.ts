import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("rendering and layout regressions", () => {
  it("keeps Advanced 3D zoom clear by not enabling scene fog", () => {
    const advancedWorld3DSource = readFileSync(
      "src/render/three/AdvancedWorld3D.tsx",
      "utf8",
    );

    expect(advancedWorld3DSource).not.toContain(".fog =");
    expect(advancedWorld3DSource).toContain(
      "controls.maxDistance = Math.max(28, maxGrid * 3.2)",
    );
  });

  it("keeps event log growth inside a fixed scrolling panel", () => {
    const appCss = readFileSync("src/app/App.css", "utf8");

    expect(appCss).toMatch(/\.appShell\s*\{[\s\S]*height:\s*100vh;/);
    expect(appCss).toMatch(/\.appShell\s*\{[\s\S]*overflow:\s*hidden;/);
    expect(appCss).toMatch(/\.eventLogPanel\s*\{[\s\S]*max-height:\s*16rem;/);
    expect(appCss).toMatch(/\.eventLogPanel\s*\{[\s\S]*overflow:\s*hidden;/);
    expect(appCss).toMatch(/\.eventLogList\s*\{[\s\S]*overflow:\s*auto;/);
  });
});
