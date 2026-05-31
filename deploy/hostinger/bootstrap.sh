#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/agentworld}"
REPO_URL="${REPO_URL:-https://github.com/chathura77/agentworldv2.git}"
BRANCH="${BRANCH:-master}"
DEPLOY_REF="${DEPLOY_REF:-}"
AGENTWORLD_DOMAIN="${AGENTWORLD_DOMAIN:-agentworld.sarathchandra.com}"
AGENTWORLD_BASE="${AGENTWORLD_BASE:-/}"
AGENTWORLD_HEALTH_PATH="${AGENTWORLD_HEALTH_PATH:-/}"
AGENTWORLD_HOST_PORT="${AGENTWORLD_HOST_PORT:-18080}"
AGENTWORLD_IMAGE_TAG="${AGENTWORLD_IMAGE_TAG:-hostinger}"
AGENTWORLD_ENABLE_CERTBOT="${AGENTWORLD_ENABLE_CERTBOT:-0}"
AGENTWORLD_LETSENCRYPT_EMAIL="${AGENTWORLD_LETSENCRYPT_EMAIL:-}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-agentworld.conf}"
NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE_NAME"

run_as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

ensure_packages() {
  local missing=()
  for command_name in git nginx certbot; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
      missing+=("$command_name")
    fi
  done

  if [ "${#missing[@]}" -gt 0 ]; then
    run_as_root apt-get update
    run_as_root apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
  fi

  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    echo "Docker with the Compose plugin is required. Use Hostinger's Docker VPS template or install Docker Engine before bootstrapping AgentWorld." >&2
    exit 1
  fi
}

ensure_repository() {
  if [ ! -d "$APP_DIR/.git" ]; then
    run_as_root mkdir -p "$(dirname "$APP_DIR")"
    run_as_root git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi

  if [ "$(id -u)" -ne 0 ]; then
    run_as_root chown -R "$(id -u):$(id -g)" "$APP_DIR"
  fi

  cd "$APP_DIR"
  git fetch --tags origin "$BRANCH"
  if [ -n "$DEPLOY_REF" ] && [ "$DEPLOY_REF" != "$BRANCH" ]; then
    git checkout --detach "$DEPLOY_REF"
  else
    git checkout "$BRANCH"
    git pull --ff-only origin "$BRANCH"
  fi
}

write_env_file() {
  cat > "$APP_DIR/deploy/hostinger/.env" <<ENV
AGENTWORLD_DOMAIN=$AGENTWORLD_DOMAIN
AGENTWORLD_BASE=$AGENTWORLD_BASE
AGENTWORLD_HEALTH_PATH=$AGENTWORLD_HEALTH_PATH
AGENTWORLD_HOST_PORT=$AGENTWORLD_HOST_PORT
AGENTWORLD_IMAGE_TAG=$AGENTWORLD_IMAGE_TAG
AGENTWORLD_ENABLE_CERTBOT=$AGENTWORLD_ENABLE_CERTBOT
AGENTWORLD_LETSENCRYPT_EMAIL=$AGENTWORLD_LETSENCRYPT_EMAIL
ENV
}

write_nginx_site() {
  local tmp_file
  tmp_file="$(mktemp)"

  cat > "$tmp_file" <<NGINX
server {
  listen 80;
  server_name $AGENTWORLD_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$AGENTWORLD_HOST_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 30s;
  }
}
NGINX

  run_as_root install -m 0644 "$tmp_file" "$NGINX_AVAILABLE"
  rm -f "$tmp_file"
  run_as_root ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  run_as_root nginx -t
  run_as_root systemctl reload nginx
}

issue_certificate_if_requested() {
  if [ "$AGENTWORLD_ENABLE_CERTBOT" != "1" ]; then
    return
  fi

  if [ -z "$AGENTWORLD_LETSENCRYPT_EMAIL" ]; then
    echo "AGENTWORLD_LETSENCRYPT_EMAIL is required when AGENTWORLD_ENABLE_CERTBOT=1" >&2
    exit 1
  fi

  run_as_root certbot --nginx \
    -d "$AGENTWORLD_DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$AGENTWORLD_LETSENCRYPT_EMAIL" \
    --redirect
}

ensure_packages
ensure_repository
write_env_file
APP_DIR="$APP_DIR" BRANCH="$BRANCH" DEPLOY_REF="$DEPLOY_REF" "$APP_DIR/deploy/hostinger/update.sh"
write_nginx_site
issue_certificate_if_requested

echo "AgentWorld bootstrap complete for https://$AGENTWORLD_DOMAIN/"
