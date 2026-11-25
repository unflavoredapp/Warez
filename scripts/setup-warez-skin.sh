#!/usr/bin/env bash
# Configure Apache + Certbot SSL for warez.skin on Ubuntu.
# Run as root on the VPS (146.71.100.41).
set -Eeuo pipefail

DOMAIN="warez.skin"
WWW_ALIAS="www.warez.skin"
WEBROOT="/var/www/${DOMAIN}"
SITE_CONF="/etc/apache2/sites-available/${DOMAIN}.conf"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y apache2 certbot python3-certbot-apache

a2enmod rewrite headers ssl >/dev/null

mkdir -p "${WEBROOT}"
if [[ -f "${REPO_ROOT}/public/index.html" ]]; then
  install -m 0644 "${REPO_ROOT}/public/index.html" "${WEBROOT}/index.html"
elif [[ ! -f "${WEBROOT}/index.html" ]]; then
  cat >"${WEBROOT}/index.html" <<'HTML'
<!DOCTYPE html><html><head><meta charset="utf-8"><title>warez.skin</title></head>
<body><h1>warez.skin</h1><p>It works.</p></body></html>
HTML
fi
chown -R www-data:www-data "${WEBROOT}"

if [[ -f "${REPO_ROOT}/apache/${DOMAIN}.conf" ]]; then
  install -m 0644 "${REPO_ROOT}/apache/${DOMAIN}.conf" "${SITE_CONF}"
else
  cat >"${SITE_CONF}" <<EOF
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias ${WWW_ALIAS}
    DocumentRoot ${WEBROOT}

    <Directory ${WEBROOT}>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}-error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}-access.log combined
</VirtualHost>
EOF
fi

# Prefer this site over the default Ubuntu page for this ServerName.
a2dissite 000-default.conf >/dev/null 2>&1 || true
a2ensite "${DOMAIN}.conf" >/dev/null

apache2ctl configtest
systemctl enable --now apache2
systemctl reload apache2

# Issue/renew Let's Encrypt cert and auto-configure Apache SSL + HTTP→HTTPS redirect.
certbot --apache \
  -d "${DOMAIN}" \
  -d "${WWW_ALIAS}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  --redirect \
  --keep-until-expiring

apache2ctl configtest
systemctl reload apache2

echo
echo "Done."
echo "  http://${DOMAIN}  → should redirect to HTTPS"
echo "  https://${DOMAIN}"
certbot certificates | sed -n "/Certificate Name: ${DOMAIN}/,/Certificate Path/p" || true
