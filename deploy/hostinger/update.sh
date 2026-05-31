#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/agentworld}"
BRANCH="${BRANCH:-master}"
DEPLOY_REF="${DEPLOY_REF:-}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/hostinger/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/deploy/hostinger/compose.yaml}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is required" >&2
  exit 1
fi

cd "$APP_DIR"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && . "$ENV_FILE" && set +a
else
  echo "Missing $ENV_FILE; copy deploy/hostinger/.env.example first." >&2
  exit 1
fi

HEALTH_PATH="${AGENTWORLD_HEALTH_PATH:-/}"
case "$HEALTH_PATH" in
  /*) ;;
  *) HEALTH_PATH="/$HEALTH_PATH" ;;
esac
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${AGENTWORLD_HOST_PORT:-18080}${HEALTH_PATH}}"

git fetch --tags origin "$BRANCH"
if [ -n "$DEPLOY_REF" ] && [ "$DEPLOY_REF" != "$BRANCH" ]; then
  git checkout --detach "$DEPLOY_REF"
else
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

"${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build --remove-orphans

echo "Waiting for AgentWorld at $HEALTH_URL"
for attempt in $(seq 1 30); do
  if wget -q -O /dev/null "$HEALTH_URL"; then
    echo "AgentWorld is healthy."
    "${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    exit 0
  fi
  sleep 2
  echo "Health check attempt $attempt failed; retrying..."
done

echo "AgentWorld did not become healthy at $HEALTH_URL" >&2
"${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=120 web >&2
exit 1
