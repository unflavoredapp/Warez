# warez.skin

Apache virtual host + Let's Encrypt (Certbot) for **warez.skin** on `146.71.100.41`.

## Quick setup (on the VPS)

```bash
sudo bash scripts/setup-warez-skin.sh
```

This will:

1. Install `apache2` + `certbot` + `python3-certbot-apache`
2. Create `/var/www/warez.skin` and enable the site
3. Issue a Let's Encrypt cert for `warez.skin` + `www.warez.skin`
4. Force HTTPS redirect

Optional: `CERTBOT_EMAIL=you@example.com sudo -E bash scripts/setup-warez-skin.sh`

## Remote deploy (from CI / Cursor agent)

```bash
export VPS_SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519)"
# or: export VPS_SSH_PASSWORD='...'
export VPS_SSH_USER=root
bash scripts/deploy-remote.sh
```

## Files

- `apache/warez.skin.conf` — HTTP vhost (Certbot adds the SSL vhost)
- `public/index.html` — placeholder homepage
- `scripts/setup-warez-skin.sh` — on-server installer
- `scripts/deploy-remote.sh` — SCP + remote run helper
