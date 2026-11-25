#!/usr/bin/env bash
# Deploy Node warez.skin app to the VPS and run setup.
# Requires VPS_SSH_PRIVATE_KEY or VPS_SSH_PASSWORD.
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
elif [[ -n "${VPS_SSH_PASSWORD:-}" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y sshpass
  fi
  export SSHPASS="${VPS_SSH_PASSWORD}"
  ssh() { command sshpass -e ssh "$@"; }
  scp() { command sshpass -e scp "$@"; }
else
  echo "Set VPS_SSH_PRIVATE_KEY or VPS_SSH_PASSWORD." >&2
  exit 1
fi

echo "Uploading to ${USER}@${HOST}:${REMOTE_DIR}"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" "mkdir -p '${REMOTE_DIR}'"
# Prefer rsync if available locally; else scp tree.
if command -v rsync >/dev/null 2>&1; then
  RSYNC_RSH="ssh ${SSH_OPTS[*]}"
  if [[ -n "${VPS_SSH_PASSWORD:-}" ]]; then
    RSYNC_RSH="sshpass -e ssh ${SSH_OPTS[*]}"
  fi
  rsync -az --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'public' \
    -e "${RSYNC_RSH}" \
    "${REPO_ROOT}/" "${USER}@${HOST}:${REMOTE_DIR}/"
else
  scp "${SSH_OPTS[@]}" -r \
    "${REPO_ROOT}/index.js" \
    "${REPO_ROOT}/css.js" \
    "${REPO_ROOT}/package.json" \
    "${REPO_ROOT}/ecosystem.config.cjs" \
    "${REPO_ROOT}/configure-apache.js" \
    "${REPO_ROOT}/apache" \
    "${REPO_ROOT}/scripts" \
    "${USER}@${HOST}:${REMOTE_DIR}/"
fi

echo "Running setup on ${HOST}"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" \
  "CERTBOT_EMAIL='${CERTBOT_EMAIL:-admin@warez.skin}' bash '${REMOTE_DIR}/scripts/setup-warez-skin.sh'"

echo "Verifying"
curl -fsSI --max-time 20 "https://warez.skin/" | head -20
curl -fsS --max-time 20 "https://warez.skin/health"
echo
curl -fsS --max-time 20 "https://warez.skin/panel.css" | head -5
