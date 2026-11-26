#!/usr/bin/env bash
# Cut Apache public traffic from MyBB DocumentRoot to Node :3000.
# Keeps /var/www/warez.skin on disk (MyBB not deleted).
# Run as root on the VPS after app files are synced to /opt/warez.skin.
set -Eeuo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/warez.skin}"
cd "${INSTALL_ROOT}"

export DEBIAN_FRONTEND=noninteractive
a2enmod proxy proxy_http rewrite headers ssl >/dev/null

# Preserve catalog across rsync/deploys.
mkdir -p "${INSTALL_ROOT}/data"
if [[ ! -f "${INSTALL_ROOT}/data/repos.json" ]]; then
  echo '{"repos":[]}' >"${INSTALL_ROOT}/data/repos.json"
fi

npm install --omit=dev

# Prefer fork mode (ecosystem) — restart cleanly.
pm2 delete warez-skin >/dev/null 2>&1 || true
pm2 start "${INSTALL_ROOT}/ecosystem.config.cjs" --update-env
pm2 save

# Install HTTP stubs + rewrite SSL vhosts to proxy.
install -m 0644 "${INSTALL_ROOT}/apache/warez.skin.conf" \
  /etc/apache2/sites-available/warez.skin.conf
install -m 0644 "${INSTALL_ROOT}/apache/sentry.mba.conf" \
  /etc/apache2/sites-available/sentry.mba.conf

node "${INSTALL_ROOT}/configure-apache.js"

# sites-enabled sometimes has real files (not symlinks) left from MyBB installs.
# Force proper symlinks so sites-available edits actually apply.
rm -f /etc/apache2/sites-enabled/warez.skin.conf \
  /etc/apache2/sites-enabled/warez.skin-le-ssl.conf \
  /etc/apache2/sites-enabled/sentry.mba.conf
ln -s ../sites-available/warez.skin.conf /etc/apache2/sites-enabled/warez.skin.conf
if [[ -f /etc/apache2/sites-available/warez.skin-le-ssl.conf ]]; then
  ln -s ../sites-available/warez.skin-le-ssl.conf /etc/apache2/sites-enabled/warez.skin-le-ssl.conf
fi
# Enable sentry.mba HTTP now; SSL after DNS A → this box + certbot.
ln -s ../sites-available/sentry.mba.conf /etc/apache2/sites-enabled/sentry.mba.conf

apache2ctl configtest
systemctl reload apache2

echo "--- health ---"
curl -fsS http://127.0.0.1:3000/health
echo
echo "--- public ---"
curl -fsSI --max-time 15 https://warez.skin/ | head -15 || true
curl -fsS --max-time 15 https://warez.skin/health || true
echo
pm2 status
