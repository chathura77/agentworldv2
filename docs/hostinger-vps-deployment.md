# Hostinger VPS Deployment

This is the recommended production path for hosting AgentWorld on a Hostinger
VPS while keeping updates and maintenance simple.

## Deployment Shape

- DNS points `agentworld.sarathchandra.com` to the Hostinger VPS.
- The existing Ghost records for `sarathchandra.com` and `www` stay unchanged.
- The public VPS web server terminates TLS and proxies the subdomain root.
- AgentWorld runs as a local-only Docker Compose service on `127.0.0.1:18080`.
- Existing services such as `quantum-workbench.sarathchandra.com` stay in their
  own Nginx server blocks and local ports.
- The container serves static files from unprivileged Nginx.
- Updates are a repeatable Git pull plus Docker Compose rebuild.

This keeps Node, Vite, Docker, and the container port off the public internet.

## Domain Routing Decision

The current DNS records show that the main site is Ghost-controlled:

- `@` points to `178.128.137.126`.
- `www` is a CNAME to `chathura-sarathchandra.ghost.io`.

DNS cannot route only `sarathchandra.com/agentworld/` to a VPS. URL paths are
handled by the web server that receives the request, and in this DNS shape that
server is Ghost, not the Hostinger AgentWorld container.

Use a true subdomain instead:

```text
agentworld.sarathchandra.com
```

Add only this new record:

```text
Type: A
Name: agentworld
Data: YOUR_HOSTINGER_VPS_IPV4
TTL: 600 seconds or 1/2 Hour
```

Leave the existing `@`, `www`, `txt`, `_dmarc`, `mc`, `evplanner`,
`api.evplanner`, GoDaddy-managed `in`/`x`, NS, SOA, and SRV records unchanged.

If you later move the main site behind a VPS-controlled Nginx server, the path
deployment at `sarathchandra.com/agentworld/` can be enabled with
`deploy/hostinger/nginx-agentworld-location.conf` and
`AGENTWORLD_BASE=/agentworld/`.

## Hostinger Setup

Hostinger's Docker VPS template is the easiest starting point because it uses
Ubuntu 24.04 with `docker-ce` and Docker Compose already installed. Hostinger's
SSH guide shows two connection options: the hPanel browser terminal or a normal
SSH client. Hostinger's DNS guide says a domain/subdomain must point to the VPS
IP with A records, and propagation can take up to 24 hours. Hostinger's managed
VPS firewall should allow only the traffic you actually need, usually `80`,
`443`, and locked-down `22`.

## GitHub Actions Secrets and Variables

Set these repository secrets:

```text
HOSTINGER_HOST=YOUR_HOSTINGER_VPS_IPV4
HOSTINGER_USER=root
HOSTINGER_SSH_PRIVATE_KEY=<private key allowed to SSH into the VPS>
HOSTINGER_KNOWN_HOSTS=<output of: ssh-keyscan -H YOUR_HOSTINGER_VPS_IPV4>
AGENTWORLD_LETSENCRYPT_EMAIL=you@example.com
```

Set these repository variables:

```text
HOSTINGER_SSH_PORT=22
AGENTWORLD_APP_DIR=/opt/agentworld
AGENTWORLD_DOMAIN=agentworld.sarathchandra.com
AGENTWORLD_BASE=/
AGENTWORLD_HEALTH_PATH=/
AGENTWORLD_HOST_PORT=18080
AGENTWORLD_IMAGE_TAG=hostinger
AGENTWORLD_ENABLE_CERTBOT=1
AGENTWORLD_AUTO_DEPLOY=0
```

`HOSTINGER_KNOWN_HOSTS` is optional but recommended. Keep
`AGENTWORLD_AUTO_DEPLOY=0` until the first deployment is verified; set it to `1`
later if you want successful `master` CI runs to deploy automatically.

## First Deploy Through GitHub Actions

1. Add the DNS A record for `agentworld`.
2. Confirm the VPS firewall allows `80`, `443`, and restricted SSH only.
3. Confirm Docker with the Compose plugin is available on the VPS. Hostinger's
   Docker VPS template already provides this.
4. Open GitHub `Actions` -> `Deploy Hostinger VPS` -> `Run workflow`.
5. Set `deploy_ref=master`, set `bootstrap=true`, and run the workflow.

The bootstrap workflow SSHes into the VPS, clones the repo into
`/opt/agentworld`, writes `deploy/hostinger/.env`, starts the Compose service,
installs the `agentworld.sarathchandra.com` Nginx server block, reloads Nginx,
and runs Certbot when `AGENTWORLD_ENABLE_CERTBOT=1`.

The generated deployment env uses:

```bash
AGENTWORLD_BASE=/
AGENTWORLD_HEALTH_PATH=/
AGENTWORLD_HOST_PORT=18080
```

## VPS Manual Fallback

The same bootstrap can be run directly over SSH if GitHub Actions is unavailable:

```bash
ssh root@YOUR_HOSTINGER_VPS_IPV4
curl -fsSL https://raw.githubusercontent.com/chathura77/agentworldv2/master/deploy/hostinger/bootstrap.sh -o /tmp/agentworld-bootstrap.sh
APP_DIR=/opt/agentworld \
AGENTWORLD_DOMAIN=agentworld.sarathchandra.com \
AGENTWORLD_HOST_PORT=18080 \
AGENTWORLD_ENABLE_CERTBOT=1 \
AGENTWORLD_LETSENCRYPT_EMAIL=you@example.com \
bash /tmp/agentworld-bootstrap.sh
```

Verify locally on the VPS:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/llms.txt
docker compose --env-file deploy/hostinger/.env -f deploy/hostinger/compose.yaml ps
```

## Reverse Proxy for the Subdomain

The GitHub bootstrap writes the Nginx server block automatically. The checked-in
reference file is `deploy/hostinger/nginx-agentworld-subdomain.conf`.

Then reload Nginx:

```bash
nginx -t
systemctl reload nginx
```

Issue TLS after DNS points to the VPS:

```bash
certbot --nginx -d agentworld.sarathchandra.com
```

## Optional Path Deployment

If you later control the web server for `sarathchandra.com` and want
`https://sarathchandra.com/agentworld/`, set:

```bash
AGENTWORLD_BASE=/agentworld/
AGENTWORLD_HEALTH_PATH=/agentworld/
```

Then include `deploy/hostinger/nginx-agentworld-location.conf` inside the
existing HTTPS server block for `sarathchandra.com`. This option will not work
while the apex and `www` traffic are handled by Ghost without a reverse proxy
you control.

## Updates

Push changes to `master` and wait for CI. Then either run `Deploy Hostinger VPS`
manually with `deploy_ref=master` and `bootstrap=false`, or set
`AGENTWORLD_AUTO_DEPLOY=1` so a green `master` CI run deploys automatically.

The workflow SSHes into the VPS and runs the update script:

```bash
APP_DIR=/opt/agentworld /opt/agentworld/deploy/hostinger/update.sh
```

It will:

1. Load `deploy/hostinger/.env`.
2. Fetch and fast-forward pull `origin/master`.
3. Rebuild the Docker image.
4. Restart the Compose service.
5. Health-check the configured local URL.

For convenience:

```bash
chmod +x /opt/agentworld/deploy/hostinger/update.sh
ln -sf /opt/agentworld/deploy/hostinger/update.sh /usr/local/bin/update-agentworld
update-agentworld
```

## GitHub Actions Flow

The `CI` workflow validates every push and pull request to `master`. The
`Deploy Hostinger VPS` workflow can run manually, and can also run automatically
after CI when `AGENTWORLD_AUTO_DEPLOY=1`. Deployment is isolated to the
`agentworld` Compose project and the `agentworld.sarathchandra.com` Nginx server
block, so it does not rewrite the existing `quantum-workbench` site.

For rollback through GitHub Actions, run `Deploy Hostinger VPS` manually with
`deploy_ref` set to a known-good commit SHA and `bootstrap=false`.

## Optional Scheduled Updates

Manual updates are safer, but if you want automated nightly fast-forward
updates:

```bash
cp /opt/agentworld/deploy/hostinger/systemd/agentworld-update.service /etc/systemd/system/
cp /opt/agentworld/deploy/hostinger/systemd/agentworld-update.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now agentworld-update.timer
systemctl list-timers agentworld-update.timer
```

Disable the timer with:

```bash
systemctl disable --now agentworld-update.timer
```

## Routine Maintenance

```bash
docker compose --env-file deploy/hostinger/.env -f deploy/hostinger/compose.yaml ps
docker compose --env-file deploy/hostinger/.env -f deploy/hostinger/compose.yaml logs --tail=120 web
docker image prune -f
```

Use Hostinger hPanel Firewall plus the OS firewall so only `80/443` are public
and SSH is restricted to trusted admin IPs. Do not publish `18080`, `5173`, the
Docker API, npm, Node, or Vite to the internet.

## Official References

- Hostinger Docker VPS template:
  https://www.hostinger.com/support/8306612-how-to-use-the-docker-vps-template-at-hostinger/
- Hostinger domain-to-VPS DNS guide:
  https://www.hostinger.com/support/1583227-how-to-point-a-domain-to-your-vps-at-hostinger/
- Hostinger managed VPS firewall:
  https://www.hostinger.com/support/8172641-how-to-use-a-managed-vps-firewall-at-hostinger/
- Hostinger SSH guide:
  https://www.hostinger.com/support/5723772-how-to-connect-to-your-vps-via-ssh-at-hostinger/
