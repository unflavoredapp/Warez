# Warez

Ops notes, Apache configs, and MyBB theme for **warez.skin**.

- **https://warez.skin** — MyBB 1.8 forum (`/var/www/warez.skin`)
- **https://sentry.mba** — Node IPA discovery app (PM2 `warez-skin` on `:3000`)

## Theme

Source lives in [`mybb-theme/`](mybb-theme/) (Sentry MBA–inspired dark teal). Deploy on the VPS:

```bash
php /opt/warez-theme/deploy.php
```

## Apache

See [`apache/`](apache/) for the live vhost templates (MyBB DocumentRoot vs Node proxy).
