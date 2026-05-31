import react from "@vitejs/plugin-react";
import process from "node:process";
import { defineConfig } from "vite";

function normalizeBasePath(value) {
  if (!value) {
    return "/";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/" || trimmed === "./") {
    return trimmed || "/";
  }

  if (/^https?:\/\//.test(trimmed)) {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }

  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, "");
  return withoutSlashes ? `/${withoutSlashes}/` : "/";
}

export default defineConfig({
  base: normalizeBasePath(process.env.AGENTWORLD_BASE),
  plugins: [react()],
});
