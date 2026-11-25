/** Shared stylesheet for warez.skin (served as /panel.css). */
module.exports = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@600;700;800&display=swap');

:root {
  --bg: #0b0d12;
  --ink: #e8ecf4;
  --muted: #9aa3b5;
  --line: rgba(255, 255, 255, 0.1);
  --card: #151922;
  --card-2: #1b2130;
  --accent: #7c5cff;
  --accent-2: #38bdf8;
  --good: #34d399;
  --bad: #f87171;
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(1200px 600px at 12% -12%, rgba(124, 92, 255, 0.28), transparent 55%),
    radial-gradient(900px 500px at 100% 0%, rgba(56, 189, 248, 0.16), transparent 50%),
    radial-gradient(700px 400px at 50% 110%, rgba(124, 92, 255, 0.12), transparent 55%),
    var(--bg);
  color: var(--ink);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}

body {
  padding: 28px 20px 60px;
}

.shell {
  max-width: 1100px;
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.logo-mark {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 18px rgba(124, 92, 255, 0.55);
}

.logo-text {
  font-family: Syne, sans-serif;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
}

.nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.78rem;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
}

.nav a:hover {
  color: var(--ink);
  border-color: var(--line);
  background: rgba(255, 255, 255, 0.03);
}

.brand {
  font-family: Syne, sans-serif;
  font-weight: 800;
  font-size: clamp(2.4rem, 7vw, 4.2rem);
  letter-spacing: -0.05em;
  line-height: 0.92;
  margin: 0 0 14px;
}

.brand .dot {
  color: var(--accent);
}

.tagline {
  color: var(--muted);
  margin: 0 0 28px;
  max-width: 38rem;
  line-height: 1.55;
  font-size: 0.95rem;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.btn {
  appearance: none;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 0.8rem;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:hover { border-color: rgba(255,255,255,0.22); }

.btn-primary {
  background: linear-gradient(135deg, #6d4dff, #4f7cff);
  border-color: transparent;
  box-shadow: 0 10px 30px rgba(124, 92, 255, 0.35);
}

.btn-primary:hover { filter: brightness(1.06); }

.meta-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
  margin-bottom: 16px;
}

.meta-square {
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 14px 12px;
  min-width: 0;
  border-radius: 14px;
}

.meta-square .stat {
  font-family: Syne, sans-serif;
  font-weight: 700;
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}

.meta-square small {
  display: block;
  font-size: 0.65rem;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.3;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(12, 1fr);
}

.panel {
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 18px;
  border-radius: 16px;
}

.panel h2 {
  font-family: Syne, sans-serif;
  font-size: 1.05rem;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.panel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
  font-size: 0.82rem;
}

.span-4 { grid-column: span 4; }
.span-6 { grid-column: span 6; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }

@media (max-width: 800px) {
  .span-4, .span-6, .span-8, .span-12 { grid-column: span 12; }
  .meta-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 480px) {
  .meta-row { grid-template-columns: 1fr; }
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 0.7rem;
  color: var(--muted);
  background: rgba(255,255,255,0.03);
}

.pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--muted);
}

.pill.online { color: #b7f7d8; border-color: rgba(52, 211, 153, 0.35); }
.pill.online .dot { background: var(--good); box-shadow: 0 0 10px rgba(52, 211, 153, 0.7); }
.pill.offline { color: #fecaca; border-color: rgba(248, 113, 113, 0.35); }
.pill.offline .dot { background: var(--bad); }

.feature-kicker {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--accent-2);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}

.list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.list li:first-child { border-top: 0; padding-top: 0; }

.list strong {
  color: var(--ink);
  font-weight: 600;
}

.mono { font-family: "IBM Plex Mono", ui-monospace, monospace; }

footer {
  margin-top: 28px;
  color: var(--muted);
  font-size: 0.72rem;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

footer a { color: var(--muted); }
footer a:hover { color: var(--ink); }

.muted { color: var(--muted); }
.ok { color: var(--good); }
.err { color: var(--bad); }
`;
