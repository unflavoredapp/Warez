/** sentry.mba — terminal green / black theme (style only; IPA repo content) */
module.exports = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

:root {
  --bg: #000000;
  --ink: #33ff33;
  --ink-dim: #1a991a;
  --ink-bright: #66ff66;
  --muted: #2a6b2a;
  --line: #00cc00;
  --row: #001a00;
  --row2: #000000;
  --warn: #ff8800;
  --bad: #cc2222;
  --gold: #ffcc00;
  --font: "Share Tech Mono", "Courier New", Courier, monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background: #000;
  color: var(--ink);
  font-family: var(--font);
  font-size: 13px;
  line-height: 1.4;
}

body {
  background:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0, 40, 0, 0.18) 2px,
      rgba(0, 40, 0, 0.18) 3px
    ),
    #000;
}

a { color: var(--ink-bright); text-decoration: none; }
a:hover { color: #fff; text-decoration: underline; }

.shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 12px 14px 40px;
}

/* top nav — [ bracket ] style */
.topnav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
  justify-content: center;
  padding: 8px 0 4px;
  border-bottom: 1px solid var(--muted);
  margin-bottom: 8px;
}
.topnav a {
  color: var(--ink);
  font-size: 12px;
  white-space: nowrap;
}
.topnav a:hover { color: #fff; }
.topnav .right {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.topnav .right a { color: var(--bad); font-size: 11px; }

.hero {
  text-align: center;
  padding: 10px 0 10px;
}
.hero .banner {
  display: block;
  width: min(900px, 100%);
  height: auto;
  margin: 0 auto;
  background: transparent;
  /* soft lift so glow reads on the striped black page bg */
  filter: drop-shadow(0 0 10px rgba(51, 255, 51, 0.25));
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
  background: #001100;
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
.search-row button:hover, .btn:hover { background: #66ff66; }
.btn-ghost {
  background: #000;
  color: var(--ink);
}
.btn-ghost:hover { background: #001a00; color: #fff; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.section-title {
  text-align: center;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
  margin: 22px 0 10px;
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
  background: #001400;
  text-transform: uppercase;
}
table.repo tr:nth-child(even) td { background: var(--row); }
table.repo tr:nth-child(odd) td { background: var(--row2); }
table.repo td a { color: var(--ink-bright); }
.ok { color: var(--ink); }
.bad { color: var(--bad); }
.gold { color: var(--gold); }
.muted { color: var(--muted); }
.mono { font-variant-numeric: tabular-nums; }

.panel {
  border: 1px solid var(--line);
  padding: 10px;
  margin: 12px 0;
  background: rgba(0, 20, 0, 0.35);
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
  background: #001100;
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
.footer-stats strong { color: var(--ink); }

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
  background: #001000;
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
  background: #001000;
}

@media (max-width: 720px) {
  .topnav .right { margin-left: 0; width: 100%; justify-content: center; }
  .chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  table.repo { font-size: 11px; }
  .hide-sm { display: none; }
}
`;
