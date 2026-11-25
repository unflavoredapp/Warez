# warez.skin

Node site for **warez.skin** — no static HTML files. Markup is rendered from `index.js`; styles live in `css.js` and are served as `/panel.css`. Apache terminates SSL (Certbot) and reverse-proxies to PM2 on `127.0.0.1:3000`.

## Layout

| File | Role |
|------|------|
| `index.js` | Express app + HTML string renderers |
| `css.js` | Stylesheet module (`module.exports = \`...\``) |
| `ecosystem.config.cjs` | PM2 process config |
| `configure-apache.js` | Wire Apache `ProxyPass` → Node |
| `scripts/setup-warez-skin.sh` | On-VPS install (Node, PM2, Certbot, proxy) |

## Local

```bash
npm install
npm start
# http://127.0.0.1:3000
```

## VPS

```bash
sudo bash scripts/setup-warez-skin.sh
```

Or from this agent / CI:

```bash
export VPS_SSH_PASSWORD='…'   # or VPS_SSH_PRIVATE_KEY
bash scripts/deploy-remote.sh
```
