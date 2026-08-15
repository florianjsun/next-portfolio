#!/usr/bin/env bash
# Production deploy, invoked by GitHub Actions over SSH.
#
# Install to /usr/local/bin/deploy-portfolio.sh, owned by root and mode 0755.
# It must live OUTSIDE the checkout: this script runs `git reset --hard`, so a
# copy inside the repository could be swapped out from under the running shell.
#
# The CI key is pinned to this script in ~/.ssh/authorized_keys:
#
#   command="/usr/local/bin/deploy-portfolio.sh",restrict ssh-ed25519 AAAA... ci
#
# so a leaked CI key can only trigger a deploy, never run arbitrary commands.
# The client asks for one exact commit ("deploy <sha>") so production runs the
# revision CI actually tested, not whatever master happens to be by then.
set -euo pipefail

APP_DIR=/home/ubuntu/next-portfolio
LOCK_FILE=/home/ubuntu/.deploy-portfolio.lock
LOG_FILE=/home/ubuntu/deploy-portfolio.log
CONTAINER=next-portfolio
HEALTH_TIMEOUT=180

log() {
  printf '%s %s\n' "$(date -Is)" "$*" | tee -a "$LOG_FILE"
}

fail() {
  log "FAILED: $*"
  exit 1
}

# ---------------------------------------------------------------- input -----
# With a forced command the client's request lands in SSH_ORIGINAL_COMMAND.
# Accept nothing but a full 40-hex commit id.
REQUEST="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$REQUEST" =~ ^deploy[[:space:]]+([0-9a-f]{40})$ ]]; then
  echo "refused: expected 'deploy <40-hex-commit>', got '${REQUEST}'" >&2
  exit 64
fi
TARGET_SHA="${BASH_REMATCH[1]}"

# ------------------------------------------------------------ serialise -----
# Two overlapping deploys would fight over the checkout and the image tag.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  fail "another deploy is already running"
fi

cd "$APP_DIR" || fail "missing $APP_DIR"

log "=== deploy requested: $TARGET_SHA ==="

# Remember how to get back before changing anything. The image is captured by
# ID because tags are about to be reassigned.
PREVIOUS_SHA="$(git rev-parse HEAD)"
PREVIOUS_IMAGE="$(docker inspect -f '{{.Image}}' "$CONTAINER" 2>/dev/null || true)"
log "current revision: $PREVIOUS_SHA"
log "current image:    ${PREVIOUS_IMAGE:-<none>}"

if [ "$PREVIOUS_SHA" = "$TARGET_SHA" ]; then
  log "already on $TARGET_SHA; rebuilding anyway to pick up .env changes"
fi

# ---------------------------------------------------------------- fetch -----
# The checkout is shallow, so ask for the one commit we need. Fall back to the
# branch tip in case the server refuses a by-sha fetch.
if ! git fetch --depth 1 origin "$TARGET_SHA" 2>/dev/null; then
  log "by-sha fetch refused, fetching master instead"
  git fetch --depth 20 origin master || fail "git fetch failed"
fi
git cat-file -e "${TARGET_SHA}^{commit}" 2>/dev/null \
  || fail "commit $TARGET_SHA not found after fetch"

git reset --hard "$TARGET_SHA" --quiet || fail "git reset failed"
log "checked out $(git log --oneline -1)"

# ---------------------------------------------------------------- build -----
# A build failure must not touch the running container, so this happens before
# anything is swapped. Restore the checkout so the tree keeps matching the
# image that is actually serving traffic.
log "building image"
if ! docker compose build >>"$LOG_FILE" 2>&1; then
  tail -40 "$LOG_FILE"
  git reset --hard "$PREVIOUS_SHA" --quiet || true
  fail "docker compose build failed; running container left untouched"
fi
docker tag "${CONTAINER}:latest" "${CONTAINER}:$(git rev-parse --short HEAD)"
log "built and tagged ${CONTAINER}:$(git rev-parse --short HEAD)"

# --------------------------------------------------------------- release -----
log "starting new container"
docker compose up -d >>"$LOG_FILE" 2>&1 || fail "docker compose up failed"

log "waiting for healthcheck (timeout ${HEALTH_TIMEOUT}s)"
STATE=unknown
DEADLINE=$(( $(date +%s) + HEALTH_TIMEOUT ))
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  STATE="$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo missing)"
  case "$STATE" in
    healthy) break ;;
    unhealthy) break ;;
  esac
  sleep 3
done
log "health: $STATE"

# -------------------------------------------------------------- rollback -----
if [ "$STATE" != healthy ]; then
  log "ROLLING BACK to $PREVIOUS_SHA"
  docker compose logs --tail=40 web 2>&1 | tee -a "$LOG_FILE" || true

  if [ -n "$PREVIOUS_IMAGE" ]; then
    git reset --hard "$PREVIOUS_SHA" --quiet || true
    docker tag "$PREVIOUS_IMAGE" "${CONTAINER}:latest"
    docker compose up -d --force-recreate >>"$LOG_FILE" 2>&1 || true

    for _ in $(seq 1 40); do
      [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" = healthy ] && break
      sleep 3
    done
    log "post-rollback health: $(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)"
  else
    log "no previous image recorded; cannot roll back automatically"
  fi

  fail "new revision never became healthy; rolled back"
fi

# ---------------------------------------------------------------- verify -----
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://127.0.0.1:3000/ || echo 000)"
log "origin smoke test: HTTP $CODE"
[ "$CODE" = 200 ] || fail "origin returned $CODE after deploy"

# Keep the three most recent revision tags; the rest only waste disk.
docker images "$CONTAINER" --format '{{.Tag}} {{.CreatedAt}}' \
  | grep -v '^latest ' | sort -k2 -r | tail -n +4 | awk '{print $1}' \
  | while read -r old; do
      docker rmi "${CONTAINER}:${old}" >/dev/null 2>&1 && log "pruned ${CONTAINER}:${old}"
    done

log "=== deployed $TARGET_SHA successfully ==="
