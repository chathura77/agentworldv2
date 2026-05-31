# Public VM Security Review

Scope: current AgentWorld repository, production static deployment, and the
included Docker/Nginx path.

## Summary

No reportable application-code security vulnerabilities were found in the
current static frontend scope. The largest practical risk is operational:
accidentally exposing a development server, package-manager process, Docker API,
SSH, or a writable container on the public internet. The provided deployment
path is designed to avoid that by serving static files from unprivileged Nginx.

## Attack Surface

- Browser-only React app built by Vite.
- No backend API, database, authentication, file upload, command execution, or
  server-side user input handling.
- No runtime use of `fetch`, WebSocket, `eval`, `Function`, `innerHTML`, or
  `dangerouslySetInnerHTML` in `src/`.
- User-provided snapshot JSON is parsed and applied only inside the browser
  process. It is not sent to a server by this app.
- Production runtime serves static assets only from `/usr/share/nginx/html`.

## Controls Added

- `Dockerfile`: multi-stage build runs `npm run check`, including tests, lint,
  typecheck, production build, and dependency audit before producing a runtime
  image.
- `nginx.conf`: serves static assets on unprivileged port `8080`.
- Security headers:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- `.dockerignore`: excludes `node_modules`, `dist`, Git metadata, logs, and
  local dev server files from build context.
- Dependencies upgraded to remove the Vite/Vitest esbuild audit finding.

## Findings

### No Reportable Code Finding: Static Frontend Has No Server-Side Sink

Evidence:

- `rg` found no `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `Function`,
  `innerHTML`, or `dangerouslySetInnerHTML` use in application source.
- `npm audit --audit-level=moderate` reports zero vulnerabilities.
- `npm audit --omit=dev --audit-level=moderate` reports zero vulnerabilities.

Impact: The app does not expose a server-side input-to-sink path in production.

### Operational Risk: Do Not Expose Vite Dev Server

Vite development servers are not production web servers and historically have
had dev-server-origin and filesystem exposure advisories. This is especially
important because the provider previously shut down VMs after suspicious
activity.

Mitigation:

- Public deployments must use `npm run build` output served by Nginx or another
  static server.
- Do not bind `npm run dev` to `0.0.0.0` on a public VM.
- Do not publish port `5173`.

### Operational Risk: Writable/Public Container Runtime

If a static server container runs as root, has broad Linux capabilities, mounts
the host Docker socket, or shares writable host paths, a web-server compromise
or misconfiguration has much higher blast radius.

Mitigation:

- Use the included unprivileged Nginx image.
- Do not mount `/var/run/docker.sock`.
- Prefer read-only runtime filesystems where practical.
- Drop capabilities and apply `no-new-privileges` in the orchestrator or Docker
  run command when compatible with the chosen Nginx image.
- Scan the final image and pin base images by digest for high-assurance
  deployments.

## Deployment Hardening Checklist

- Serve only `dist/`.
- Use TLS.
- Publish only `80/443` externally.
- Keep SSH restricted to trusted source IPs.
- Disable password SSH login and use keys.
- Keep OS packages patched.
- Run provider malware/rootkit scans if the previous VM was flagged.
- Rebuild from a clean checkout instead of reusing a previously flagged VM
  image.
- Enable access/error logging and review spikes in 404s, unusual user agents,
  and outbound connection attempts.

## Residual Risk

- Client-side denial of service is possible by loading very large snapshots or
  extreme simulation settings in the browser. This does not affect the server
  in a static deployment, but it can freeze the user's tab.
- Browser/WebGL driver bugs are outside the app's direct control. Keep browsers
  and GPU drivers patched for managed kiosk deployments.
- Bundle size is large due to Three.js and PixiJS. This is a performance and
  bandwidth concern rather than a direct security issue.
