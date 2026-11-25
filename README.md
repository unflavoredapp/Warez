# warez.skin

IPA **app repository discovery** for AltStore-style source JSON.

- Pages from `index.js` (no static HTML)
- Styles from `css.js` → `/panel.css`
- Catalog persisted under `data/repos.json`
- Apache + Certbot terminate TLS and reverse-proxy to PM2 on `:3000`

## Features

- Add a source JSON URL → fetch & index apps
- Search across repos by name / bundle ID / developer
- Refresh or remove sources
- SSRF protections (localhost/private IPs blocked)

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
npm start
```

## VPS

```bash
sudo bash scripts/setup-warez-skin.sh
# or after code sync:
pm2 restart warez-skin
```
