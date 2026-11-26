# sentry.mba

Simple **IPA app repository discovery** with the classic sentry.mba green-on-black terminal look (style only — not their old configs/combos content).

- Pages from `index.js` (no MyBB)
- Styles from `css.js` → `/panel.css`
- Catalog in `data/repos.json`
- Apache + Certbot → PM2 Node on `:3000`

## Live

- **https://warez.skin** — active (same app) until DNS for sentry.mba is fixed
- **https://sentry.mba** — point the domain **A record** to `146.71.100.41`, then run certbot for SSL

MyBB under `/var/www/warez.skin` is no longer the public front door; files/DB are left on disk.

## Features

- Index AltStore-style source JSON URLs
- Search apps by name / bundle ID / developer
- Latest + largest app tables, repo list, detail pages
- Refresh / remove sources
- SSRF protections (localhost / private IPs blocked)

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/status` | Counts + uptime |
| GET | `/api/repos?apps=1` | Indexed sources |
| POST | `/api/repos` | `{ "sourceURL": "https://…" }` |
| POST | `/api/repos/:id/refresh` | Re-fetch source |
| DELETE | `/api/repos/:id` | Remove source |
| GET | `/api/apps?q=` | Search apps |

## Local

```bash
npm install
SITE_NAME=sentry.mba npm start
```

## VPS cutover

```bash
# from this repo (needs VPS_SSH_PASSWORD or VPS_SSH_PRIVATE_KEY)
bash scripts/deploy-remote.sh
```

On the box: `bash /opt/warez.skin/scripts/cutover-node.sh`
