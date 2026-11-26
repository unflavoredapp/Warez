/** sentry.mba — terminal orange / black theme (style only; IPA repo content) */
module.exports = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

:root {
  --bg: #000000;
  --ink: #ff8800;
  --ink-dim: #cc6600;
  --ink-bright: #ffaa33;
  --muted: #6b3d00;
  --line: #ff8800;
  --row: #1a0c00;
  --row2: #000000;
  --warn: #ffcc00;
  --bad: #cc2222;
  --gold: #ffcc00;
  --font: "Share Tech Mono", "Courier New", Courier, monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  color: var(--ink);
  font-family: var(--font);
  font-size: 13px;
  line-height: 1.4;
}

/* classic dotted bg — orange dots on black */
body {
  background: #000 url("/bg.gif") repeat;
}

a { color: var(--ink-bright); text-decoration: none; }
a:hover { color: #fff; text-decoration: underline; }

.page {
  max-width: 980px;
  margin: 0 auto;
  padding: 12px 10px 28px;
}

/* tabs float above the black shell on the dotted bg */
.topnav.float-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: center;
  justify-content: center;
  padding: 8px 6px 12px;
  margin: 0 auto 10px;
  background: transparent;
  border: 0;
  position: relative;
  z-index: 2;
}
.topnav.float-tabs a {
  color: var(--ink);
  font-size: 12px;
  white-space: nowrap;
  padding: 5px 9px;
  border: 1px solid var(--muted);
  background: rgba(0, 0, 0, 0.72);
  border-radius: 4px;
  text-decoration: none;
  box-shadow: 0 0 8px rgba(80, 40, 0, 0.3);
}
.topnav.float-tabs a:hover {
  color: #fff;
  border-color: var(--ink);
  background: #1a0c00;
  text-decoration: none;
}
.topnav.float-tabs a.buy-gold {
  color: var(--gold);
  border-color: #8a6a00;
}
.topnav.float-tabs a.buy-gold:hover {
  color: #ffe566;
  border-color: var(--gold);
}

/* black floating container over the dotted page bg */
.shell {
  margin: 0 auto;
  padding: 12px 14px 40px;
  background: #000;
  border: 1px solid var(--line);
  box-shadow: 0 0 24px rgba(80, 40, 0, 0.4);
  position: relative;
  z-index: 1;
}

/* ripped sentry.mba style/img/gold.gif — black/transparent for black container */
img.coin, .coin {
  display: inline-block;
  width: 12px;
  height: 10px;
  vertical-align: -1px;
  margin-right: 4px;
  image-rendering: pixelated;
  background: #000;
  border: 0;
  flex-shrink: 0;
}

.hero {
  text-align: center;
  padding: 10px 0 10px;
}
.hero .banner {
  display: block;
  width: min(640px, 92%);
  height: auto;
  margin: 0 auto;
  background: transparent;
  filter: drop-shadow(0 0 12px rgba(255, 136, 0, 0.28));
}
.blurb {
  color: var(--warn);
  font-weight: 700;
  font-size: 12px;
  margin: 10px auto 0;
  max-width: 640px;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 0 18px;
  flex-wrap: wrap;
}
.search-row label { color: var(--ink); }
.search-row input {
  width: min(420px, 70vw);
  height: 26px;
  background: #140a00;
  border: 1px solid var(--line);
  color: var(--ink);
  padding: 0 8px;
  font-family: inherit;
  font-size: 13px;
}
.search-row button, .btn {
  height: 26px;
  padding: 0 12px;
  background: var(--ink);
  border: 1px solid var(--ink);
  color: #000;
  font-family: inherit;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}
.search-row button:hover, .btn:hover { background: #ffaa33; }
.btn-ghost {
  background: #000;
  color: var(--ink);
}
.btn-ghost:hover { background: #1a0c00; color: #fff; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.section-title {
  text-align: center;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
  margin: 22px 0 10px;
}

/* two-column app cards */
.app-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}
a.app-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  min-height: 88px;
  background: #0a0600;
  border: 1px solid var(--line);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 0 10px rgba(80, 40, 0, 0.22);
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
a.app-card:hover {
  border-color: var(--ink-bright);
  box-shadow: 0 0 14px rgba(255, 136, 0, 0.28);
  text-decoration: none;
  color: inherit;
}
.app-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  background: #140a00;
  border: 1px solid var(--muted);
  flex-shrink: 0;
}
.app-icon-fallback {
  background:
    linear-gradient(145deg, #4a2200, #140a00);
}
.app-card-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app-card-title {
  color: var(--ink-bright);
  font-weight: 700;
  font-size: 13px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-card-sub {
  color: #9a9080;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-card-meta {
  color: #cfc8bc;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}
.ver-tag {
  border: 1px solid var(--ink);
  color: var(--ink);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

table.repo {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--line);
  margin-bottom: 8px;
  table-layout: fixed;
}
table.repo th, table.repo td {
  border: 1px solid var(--muted);
  padding: 5px 7px;
  text-align: left;
  vertical-align: top;
  word-wrap: break-word;
}
table.repo th {
  color: var(--ink-dim);
  font-weight: 700;
  font-size: 11px;
  background: #140a00;
  text-transform: uppercase;
}
table.repo tr:nth-child(even) td { background: var(--row); }
table.repo tr:nth-child(odd) td { background: var(--row2); }
table.repo td a { color: var(--ink-bright); }
.ok { color: var(--ink); }
.bad { color: var(--bad); }
.gold { color: var(--gold); }
.cost {
  color: var(--gold);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.muted { color: var(--muted); }
.mono { font-variant-numeric: tabular-nums; }

.panel {
  border: 1px solid var(--line);
  padding: 10px;
  margin: 12px 0;
  background: rgba(40, 18, 0, 0.4);
}
.panel h2 {
  margin: 0 0 8px;
  font-size: 14px;
  text-align: center;
}
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }
.msg { margin-top: 8px; min-height: 1.2em; }
.msg.ok { color: var(--ink-bright); }
.msg.err { color: var(--bad); }

input.source {
  width: 100%;
  height: 28px;
  background: #140a00;
  border: 1px solid var(--line);
  color: var(--ink);
  padding: 0 8px;
  font-family: inherit;
}

.footer-stats {
  margin-top: 18px;
  border: 1px solid var(--line);
  padding: 8px 10px;
  text-align: center;
  color: var(--bad);
  font-size: 12px;
}
.footer-stats strong { color: var(--gold); }

.detail-back { display: inline-block; margin: 8px 0 12px; }
.detail-title { font-size: 22px; margin: 0 0 4px; color: #fff; }
.detail-meta { color: var(--muted); margin-bottom: 12px; }
.chips {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.chip {
  border: 1px solid var(--muted);
  padding: 8px;
  background: #140a00;
}
.chip span { display: block; color: var(--muted); font-size: 10px; text-transform: uppercase; }
.chip strong { color: var(--ink-bright); }
.shots {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 10px 0;
}
.shots img {
  height: 160px;
  border: 1px solid var(--muted);
  background: #140a00;
}

@media (max-width: 720px) {
  .page { padding: 8px 6px 20px; }
  .shell { padding: 10px 8px 28px; }
  .topnav.float-tabs { gap: 5px; padding-bottom: 10px; }
  .topnav.float-tabs a { font-size: 11px; padding: 4px 7px; }
  .app-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .app-icon { width: 44px; height: 44px; border-radius: 10px; }
  .app-card { padding: 8px; min-height: 78px; gap: 8px; }
  .app-card-title { font-size: 12px; }
  .chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  table.repo { font-size: 11px; }
  .hide-sm { display: none; }
}

@media (max-width: 420px) {
  .app-grid { grid-template-columns: 1fr; }
}

/* admin / setup */
.admin-panel { max-width: 860px; margin-left: auto; margin-right: auto; }
.admin-form label {
  display: block;
  margin: 10px 0 4px;
  color: var(--ink-dim);
  font-size: 11px;
  text-transform: uppercase;
}
.topnav.float-tabs a.nav-setup {
  color: var(--warn);
  border-color: #8a6a00;
}
.plugin-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
  cursor: pointer;
}
.plugin-toggle input { accent-color: var(--ink); }
pre.code-sample {
  margin: 0;
  padding: 10px;
  background: #140a00;
  border: 1px solid var(--muted);
  color: var(--ink-bright);
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
}
`;
