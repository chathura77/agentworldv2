# Hostinger VPS Deployment

This is the recommended production path for hosting AgentWorld on a Hostinger
VPS while keeping updates and maintenance simple.

## Deployment Shape

- DNS points `sarathchandra.com` or a chosen subdomain to the Hostinger VPS.
- The existing public web server terminates TLS and proxies `/agentworld/`.
- AgentWorld runs as a local-only Docker Compose service on `127.0.0.1:8080`.
- The container serves static files from unprivileged Nginx.
- Updates are a repeatable Git pull plus Docker Compose rebuild.

This keeps Node, Vite, Docker, and the container port off the public internet.

## Domain Routing Decision

`sarathchandra.com/agentworld/` is a path on the main domain, not a subdomain.
That path works only if the web server currently serving `sarathchandra.com`
can add the reverse-proxy location from this repo.

If the main Ghost site is hosted somewhere else and cannot proxy a path to the
Hostinger VPS, use a true subdomain instead:

```text
agentworld.sarathchandra.com
```

That requires only a DNS A record for `agentworld` pointing to the VPS IP and
the subdomain Nginx config in `deploy/hostinger/nginx-agentworld-subdomain.conf`.

## Hostinger Setup

Hostinger's Docker VPS template is the easiest starting point because it uses
Ubuntu 24.04 with `docker-ce` and Docker Compose already installed. Hostinger's
SSH guide shows two connection options: the hPanel browser terminal or a normal
SSH client. Hostinger's DNS guide says a domain/subdomain must point to the VPS
IP with A records, and propagation can take up to 24 hours. Hostinger's managed
VPS firewall should allow only the traffic you actually need, usually `80`,
`443`, and locked-down `22`.

## First Deploy

SSH into the VPS:

```bash
ssh root@YOUR_VPS_IP
```

Install base tools if the VPS template does not already include them:

```bash
apt update
apt install -y git nginx certbot python3-certbot-nginx
```

Clone the repo into a stable app directory:

```bash
mkdir -p /opt
git clone https://github.com/chathura77/agentworldv2.git /opt/agentworld
cd /opt/agentworld
```

Create the deployment env file:

```bash
cp deploy/hostinger/.env.example deploy/hostinger/.env
```

For the planned path deployment, keep:

```bash
AGENTWORLD_BASE=/agentworld/
AGENTWORLD_HOST_PORT=8080
```

Start the service:

```bash
docker compose --env-file deploy/hostinger/.env -f deploy/hostinger/compose.yaml up -d --build
```

Verify locally on the VPS:

```bash
curl -I http://127.0.0.1:8080/agentworld/
curl -I http://127.0.0.1:8080/agentworld/llms.txt
docker compose --env-file deploy/hostinger/.env -f deploy/hostinger/compose.yaml ps
```

## Reverse Proxy for `/agentworld/`

Add the contents of `deploy/hostinger/nginx-agentworld-location.conf` inside the
existing HTTPS `server` block for `sarathchandra.com` or
`www.sarathchandra.com`.

Then reload Nginx:

```bash
nginx -t
systemctl reload nginx
```

If this is a new Nginx site, issue TLS after DNS points to the VPS:

```bash
certbot --nginx -d sarathchandra.com -d www.sarathchandra.com
```

## Optional True Subdomain

If you prefer `https://agentworld.sarathchandra.com/`, create an A record for
`agentworld` pointing to the VPS IP and set:

```bash
AGENTWORLD_BASE=/
```

Use `deploy/hostinger/nginx-agentworld-subdomain.conf` as the server block and
issue TLS for the subdomain:

```bash
certbot --nginx -d agentworld.sarathchandra.com
```

## Updates

The update script is the normal maintenance path:

```bash
APP_DIR=/opt/agentworld /opt/agentworld/deploy/hostinger/update.sh
```

It will:

1. Load `deploy/hostinger/.env`.
2. Fetch and fast-forward pull `origin/master`.
3. Rebuild the Docker image.
4. Restart the Compose service.
5. Health-check the local `/agentworld/` URL.

For convenience:

```bash
chmod +x /opt/agentworld/deploy/hostinger/update.sh
ln -sf /opt/agentworld/deploy/hostinger/update.sh /usr/local/bin/update-agentworld
update-agentworld
```

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
and SSH is restricted to trusted admin IPs. Do not publish `8080`, `5173`, the
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
