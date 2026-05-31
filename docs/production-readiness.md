# Production Readiness

AgentWorld is a static browser application after `npm run build`. A public VM
or container deployment should serve only the generated `dist/` files. Do not
expose `npm run dev` or Vite preview to the public internet.

## Required Gates

Run these before publishing a new build:

```bash
npm ci
npm run test
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npm run build
```

The combined local gate is:

```bash
npm run check
```

Current verified gate for this update:

- `npm test`: 47 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm audit --audit-level=moderate`: zero vulnerabilities after upgrading
  Vite/Vitest.
- `npm run build`: passed on Vite 8.0.14. The bundle-size warning is expected
  because Three.js and PixiJS are large rendering dependencies.
- Browser smoke: `http://127.0.0.1:5173/` mounted, Advanced Mode rendered,
  zoom gesture kept the scene active, no browser console errors appeared, and
  event-log growth stayed inside its fixed scrolling panel.

## Container Build

Build the production image:

```bash
docker build -t agentworld:prod .
```

If deploying below the main site path, for example
`https://www.sarathchandra.com/agentworld/`, set the Vite base path at build
time:

```bash
docker build --build-arg AGENTWORLD_BASE=/agentworld/ -t agentworld:prod .
```

Run locally:

```bash
docker run --rm -p 8080:8080 agentworld:prod
```

Then open `http://127.0.0.1:8080/`.

The included `Dockerfile` uses a Node build stage and an unprivileged Nginx
runtime stage. The build stage runs `npm run check`, including dependency
audit, before copying only static assets and `nginx.conf` into the final image.
The Nginx config supports both root deployment and `/agentworld/` path
deployment for the planned `sarathchandra.com` integration.

## SEO and AI Retrieval Checks

- Confirm `https://www.sarathchandra.com/agentworld/` returns the AgentWorld
  canonical page with the expected title, description, Open Graph tags, and
  Schema.org JSON-LD.
- Confirm `https://www.sarathchandra.com/agentworld/sitemap.xml`,
  `https://www.sarathchandra.com/agentworld/llms.txt`,
  `https://www.sarathchandra.com/agentworld/agentworld.md`, and
  `https://www.sarathchandra.com/agentworld/ai-index.json` return `200`.
- If the app is mounted under the existing Ghost site rather than owning the
  domain root, add the AgentWorld sitemap URL to the root `sarathchandra.com`
  robots file or to the main site sitemap index.
- Submit or inspect the canonical URL in Google Search Console after deployment.

## Public VM Checklist

- Publish port `80` or `443` through a reverse proxy/load balancer to container
  port `8080`; do not publish Node, npm, Vite, SSH, Docker API, or package
  manager ports.
- Terminate TLS at the VM reverse proxy or cloud load balancer.
- Run the container as non-root. The provided runtime image is
  `nginxinc/nginx-unprivileged`.
- Keep the VM firewall narrow: allow `22` only from trusted admin IPs, and
  allow public web traffic only on `80/443`.
- Enable provider firewall/security-group egress restrictions where possible.
  This app does not need outbound runtime network access.
- Rotate the image by rebuilding from a clean checkout with `npm ci`; do not
  copy a local `node_modules/` folder into the VM.
- Monitor HTTP logs, container restarts, CPU, memory, and unexpected outbound
  connections.
- Keep deploy secrets out of the repository and image. This app currently needs
  no runtime secrets.
- Scan the final image with Docker Scout, Trivy, or Grype before public
  deployment, and consider pinning base images by digest for stricter
  supply-chain reproducibility.

## Known Production Notes

- The app is client-side only. Simulation snapshots are local user input, not
  server data.
- Large 3D/Pixi bundles are expected; consider route-level or renderer-level
  chunking later if first-load performance becomes a deployment concern.
- Vite dev server advisories are mitigated by upgrading the dev toolchain and
  by not exposing development servers publicly.
