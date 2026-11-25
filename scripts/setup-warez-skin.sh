#!/usr/bin/env bash
# Install Node (css.js + index.js) behind Apache + Certbot for warez.skin.
# Run as root on the VPS.
set -Eeuo pipefail

DOMAIN="warez.skin"
WWW_ALIAS="www.warez.skin"
INSTALL_ROOT="${INSTALL_ROOT:-/opt/warez.skin}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg git apache2 certbot python3-certbot-apache openssl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

a2enmod proxy proxy_http rewrite headers ssl >/dev/null

# Sync app into install root (supports running from a cloned copy).
mkdir -p "${INSTALL_ROOT}"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'public' \
  "${REPO_ROOT}/" "${INSTALL_ROOT}/"

cd "${INSTALL_ROOT}"
npm install --omit=dev

npm install -g pm2
pm2 delete warez-skin >/dev/null 2>&1 || true
pm2 start "${INSTALL_ROOT}/ecosystem.config.cjs" --update-env
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.txt 2>&1 || true
# shellcheck disable=SC1090
eval "$(grep -o 'sudo.*pm2 startup.*' /tmp/pm2-startup.txt | tail -1)" 2>/dev/null || true

# HTTP site first (Certbot needs :80 answering).
install -m 0644 "${INSTALL_ROOT}/apache/${DOMAIN}.conf" \
  "/etc/apache2/sites-available/${DOMAIN}.conf"
a2dissite 000-default.conf >/dev/null 2>&1 || true
a2ensite "${DOMAIN}.conf" >/dev/null

apache2ctl configtest
systemctl enable --now apache2
systemctl reload apache2

# Issue cert if missing; keep existing otherwise.
if [[ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
  certbot --apache \
    -d "${DOMAIN}" \
    -d "${WWW_ALIAS}" \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --redirect
else
  certbot --apache \
    -d "${DOMAIN}" \
    -d "${WWW_ALIAS}" \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --redirect \
    --keep-until-expiring || true
fi

# Point both HTTP + HTTPS vhosts at Node :3000.
node "${INSTALL_ROOT}/configure-apache.js"
a2enmod proxy proxy_http headers rewrite ssl >/dev/null
apache2ctl configtest
systemctl reload apache2

echo
echo "PM2:"
pm2 status
echo
curl -fsS http://127.0.0.1:3000/health || true
echo
echo "https://${DOMAIN}"
