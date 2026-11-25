/** Shared stylesheet for warez.skin IPA repo discovery (served as /panel.css). */
module.exports = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@600;700;800&display=swap');

:root {
  --bg: #0b0d12;
  --ink: #e8ecf4;
  --muted: #9aa3b5;
  --line: rgba(255, 255, 255, 0.1);
  --card: #151922;
  --accent: #7c5cff;
  --accent-2: #38bdf8;
  --good: #34d399;
  --bad: #f87171;
  --warn: #fbbf24;
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(1200px 600px at 12% -12%, rgba(124, 92, 255, 0.28), transparent 55%),
    radial-gradient(900px 500px at 100% 0%, rgba(56, 189, 248, 0.16), transparent 50%),
    var(--bg);
  color: var(--ink);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}

body { padding: 28px 20px 60px; }

.shell { max-width: 1100px; margin: 0 auto; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
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

.nav { display: flex; gap: 8px; flex-wrap: wrap; }
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
  font-size: clamp(2.2rem, 6vw, 3.6rem);
  letter-spacing: -0.05em;
  line-height: 0.94;
  margin: 0 0 12px;
}
.brand .dot { color: var(--accent); }

.tagline {
  color: var(--muted);
  margin: 0 0 22px;
  max-width: 42rem;
  line-height: 1.55;
  font-size: 0.92rem;
}

.meta-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.meta-square {
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 14px 12px;
  border-radius: 14px;
  min-width: 0;
}

.meta-square .stat {
  font-family: Syne, sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: -0.03em;
}

.meta-square small {
  display: block;
  font-size: 0.65rem;
  color: var(--muted);
  margin-top: 4px;
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
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.span-4 { grid-column: span 4; }
.span-6 { grid-column: span 6; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }

@media (max-width: 800px) {
  .span-4, .span-6, .span-8, .span-12 { grid-column: span 12; }
  .meta-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

label {
  display: block;
  font-size: 0.72rem;
  color: var(--muted);
  margin: 0 0 6px;
}

input, textarea {
  width: 100%;
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.25);
  color: var(--ink);
  border-radius: 12px;
  padding: 12px 14px;
  font: inherit;
  font-size: 0.85rem;
  outline: none;
}

input:focus, textarea:focus {
  border-color: rgba(124, 92, 255, 0.55);
  box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.18);
}

.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 12px;
}

.btn {
  appearance: none;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--ink);
  font: inherit;
  font-size: 0.8rem;
  padding: 11px 14px;
  border-radius: 12px;
  cursor: pointer;
}
.btn:hover { border-color: rgba(255,255,255,0.22); }
.btn-primary {
  background: linear-gradient(135deg, #6d4dff, #4f7cff);
  border-color: transparent;
  box-shadow: 0 10px 30px rgba(124, 92, 255, 0.35);
}
.btn-ghost { background: transparent; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.msg { margin-top: 10px; font-size: 0.78rem; min-height: 1.2em; }
.ok { color: var(--good); }
.err { color: var(--bad); }
.muted { color: var(--muted); }
.mono { font-family: "IBM Plex Mono", ui-monospace, monospace; }

.repo-list, .app-list {
  display: grid;
  gap: 12px;
}

.repo-card, .app-card {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 14px;
}

.repo-card-top, .app-card-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.repo-title, .app-title {
  font-family: Syne, sans-serif;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}

.repo-url, .app-meta {
  color: var(--muted);
  font-size: 0.72rem;
  word-break: break-all;
  line-height: 1.4;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 0.68rem;
  color: var(--muted);
  background: rgba(255,255,255,0.03);
}

.pill.good { color: #b7f7d8; border-color: rgba(52, 211, 153, 0.35); }
.pill.bad { color: #fecaca; border-color: rgba(248, 113, 113, 0.35); }

.icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--line);
  flex: 0 0 auto;
}

.actions { display: flex; gap: 8px; flex-wrap: wrap; }

details.repo-apps {
  margin-top: 12px;
}
details.repo-apps summary {
  cursor: pointer;
  color: var(--accent-2);
  font-size: 0.75rem;
  list-style: none;
}
details.repo-apps summary::-webkit-details-marker { display: none; }

.mini-apps {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.mini-app {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.18);
}

.mini-app .name { font-size: 0.8rem; }
.mini-app .bid { font-size: 0.68rem; color: var(--muted); word-break: break-all; }

footer {
  margin-top: 28px;
  color: var(--muted);
  font-size: 0.72rem;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

a.app-link {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
a.app-link:hover {
  border-color: rgba(124, 92, 255, 0.45);
  background: rgba(124, 92, 255, 0.08);
}
a.mini-app.app-link:hover {
  border-color: rgba(124, 92, 255, 0.45);
}

.chev {
  color: var(--muted);
  font-size: 1.4rem;
  line-height: 1;
  padding-top: 8px;
}

.back-link {
  display: inline-block;
  margin-bottom: 14px;
  color: var(--accent-2);
  text-decoration: none;
  font-size: 0.8rem;
}
.back-link:hover { text-decoration: underline; }

.detail-top {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.detail-icon {
  width: 84px;
  height: 84px;
  border-radius: 18px;
  object-fit: cover;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--line);
  flex: 0 0 auto;
}
.detail-title {
  font-family: Syne, sans-serif;
  font-weight: 800;
  font-size: clamp(1.4rem, 4vw, 2rem);
  letter-spacing: -0.04em;
  margin: 0 0 6px;
  line-height: 1.05;
}
.detail-desc {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.shots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.shots .shot {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.2);
}
.shots img {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
}
`;
