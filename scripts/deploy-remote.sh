#!/usr/bin/env bash
# Deploy Node sentry.mba-styled IPA discovery to the VPS and cut Apache off MyBB.
# Requires VPS_SSH_PRIVATE_KEY or VPS_SSH_PASSWORD (or SSHPASS).
set -Eeuo pipefail

HOST="${VPS_HOST:-146.71.100.41}"
USER="${VPS_SSH_USER:-root}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_DIR="/opt/warez.skin"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

if [[ -n "${VPS_SSH_PRIVATE_KEY:-}" ]]; then
  KEY_FILE="$(mktemp)"
  trap 'rm -f "${KEY_FILE}"' EXIT
  printf '%s\n' "${VPS_SSH_PRIVATE_KEY}" >"${KEY_FILE}"
  chmod 600 "${KEY_FILE}"
  SSH_OPTS+=(-i "${KEY_FILE}" -o IdentitiesOnly=yes)
elif [[ -n "${VPS_SSH_PASSWORD:-}${SSHPASS:-}" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y sshpass
  fi
  export SSHPASS="${VPS_SSH_PASSWORD:-${SSHPASS}}"
  ssh() { command sshpass -e ssh "$@"; }
  scp() { command sshpass -e scp "$@"; }
else
  echo "Set VPS_SSH_PRIVATE_KEY or VPS_SSH_PASSWORD." >&2
  exit 1
fi

echo "Uploading to ${USER}@${HOST}:${REMOTE_DIR}"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" "mkdir -p '${REMOTE_DIR}/data'"

# Preserve remote catalog.
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" \
  "test -f '${REMOTE_DIR}/data/repos.json' && cp -a '${REMOTE_DIR}/data/repos.json' /tmp/repos.json.bak || true"

if command -v rsync >/dev/null 2>&1; then
  if [[ -n "${VPS_SSH_PASSWORD:-}${SSHPASS:-}" ]]; then
    RSYNC_RSH="sshpass -e ssh ${SSH_OPTS[*]}"
  else
    RSYNC_RSH="ssh ${SSH_OPTS[*]}"
  fi
  rsync -az \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'public' \
    --exclude 'data/repos.json' \
    --exclude 'mybb-theme' \
    -e "${RSYNC_RSH}" \
    "${REPO_ROOT}/" "${USER}@${HOST}:${REMOTE_DIR}/"
else
  scp "${SSH_OPTS[@]}" \
    "${REPO_ROOT}/index.js" \
    "${REPO_ROOT}/css.js" \
    "${REPO_ROOT}/store.js" \
    "${REPO_ROOT}/package.json" \
    "${REPO_ROOT}/package-lock.json" \
    "${REPO_ROOT}/ecosystem.config.cjs" \
    "${REPO_ROOT}/configure-apache.js" \
    "${USER}@${HOST}:${REMOTE_DIR}/"
  scp "${SSH_OPTS[@]}" -r \
    "${REPO_ROOT}/apache" \
    "${REPO_ROOT}/scripts" \
    "${USER}@${HOST}:${REMOTE_DIR}/"
fi

ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" \
  "test -f /tmp/repos.json.bak && mkdir -p '${REMOTE_DIR}/data' && mv /tmp/repos.json.bak '${REMOTE_DIR}/data/repos.json' || true"

echo "Cutting over Apache → Node on ${HOST}"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" "bash '${REMOTE_DIR}/scripts/cutover-node.sh'"

echo "Verifying"
curl -fsSI --max-time 20 "https://warez.skin/" | head -20
curl -fsS --max-time 20 "https://warez.skin/health"
echo
curl -fsS --max-time 20 "https://warez.skin/panel.css" | head -5
echo
echo "Done. Point sentry.mba A → ${HOST}, then: certbot --apache -d sentry.mba -d www.sentry.mba"
