#!/usr/bin/env bash
# Deploy warez.skin Apache + Certbot setup to the VPS from this agent.
# Requires env:
#   VPS_SSH_PRIVATE_KEY  (required)  OR  VPS_SSH_PASSWORD (with sshpass)
#   VPS_HOST             (default 146.71.100.41)
#   VPS_SSH_USER         (default root)
#   CERTBOT_EMAIL        (optional)
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

echo "Uploading repo to ${USER}@${HOST}:${REMOTE_DIR}"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" "mkdir -p '${REMOTE_DIR}'"
scp "${SSH_OPTS[@]}" -r \
  "${REPO_ROOT}/apache" \
  "${REPO_ROOT}/public" \
  "${REPO_ROOT}/scripts" \
  "${USER}@${HOST}:${REMOTE_DIR}/"

echo "Running setup on ${HOST}"
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" \
  "CERTBOT_EMAIL='${CERTBOT_EMAIL:-admin@warez.skin}' bash '${REMOTE_DIR}/scripts/setup-warez-skin.sh'"

echo "Verifying HTTPS"
curl -fsSI --max-time 20 "https://warez.skin/" | head -20
