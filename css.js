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

.topbar-source {
  display: none;
  margin-left: auto;
  max-width: 55%;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--ink);
  text-decoration: none;
  font-family: Syne, sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-source:hover {
  border-color: rgba(124, 92, 255, 0.45);
  color: var(--accent-2);
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  color: var(--accent-2);
  text-decoration: none;
  font-size: 0.8rem;
}
.back-link:hover { text-decoration: underline; }

.detail-page {
  --app-tint: rgb(124, 92, 255);
  padding-bottom: 88px;
}

.detail-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 14px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--app-tint) 18%, transparent), transparent 55%),
    var(--card);
}

.detail-glow {
  position: absolute;
  inset: -40% auto auto -20%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, color-mix(in srgb, var(--app-tint) 45%, transparent), transparent 70%);
  filter: blur(8px);
  pointer-events: none;
}

.detail-top {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px 16px;
  align-items: start;
}

.hero-source {
  justify-self: end;
  align-self: start;
  text-align: right;
  min-width: 0;
  max-width: 160px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--app-tint) 28%, var(--line));
  background: rgba(0,0,0,0.22);
}
.hero-source-label {
  color: var(--muted);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.hero-source-name {
  display: block;
  font-family: Syne, sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero-source-name:hover { color: var(--accent-2); }
.hero-source-url {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.62rem;
  line-height: 1.3;
  word-break: break-all;
}

.detail-icon {
  width: 96px;
  height: 96px;
  border-radius: 22px;
  object-fit: cover;
  background: rgba(255,255,255,0.06);
  border: 1px solid color-mix(in srgb, var(--app-tint) 35%, var(--line));
  box-shadow: 0 12px 40px color-mix(in srgb, var(--app-tint) 28%, transparent);
  flex: 0 0 auto;
}

.detail-copy { min-width: 0; flex: 1; }

.detail-kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.detail-title {
  font-family: Syne, sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 5vw, 2.3rem);
  letter-spacing: -0.045em;
  margin: 0 0 6px;
  line-height: 1.02;
}

.detail-stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0 0 14px;
}

.stat-chip {
  border: 1px solid var(--line);
  background: var(--card);
  box-shadow: var(--shadow);
  border-radius: 12px;
  padding: 10px 10px 9px;
  min-width: 0;
}

.stat-label {
  display: block;
  color: var(--muted);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-family: Syne, sans-serif;
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-actions { margin-top: 16px; }
.btn-lg { padding: 13px 16px; border-radius: 14px; font-size: 0.85rem; }

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-head h2 { margin: 0; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-top: 14px;
}
.about-panel { width: 100%; }

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.feature-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.025);
  color: var(--ink);
  font-size: 0.82rem;
  line-height: 1.45;
}
.feature-list .tick {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--app-tint, var(--accent));
  box-shadow: 0 0 12px color-mix(in srgb, var(--app-tint, var(--accent)) 55%, transparent);
  flex: 0 0 auto;
}

.detail-desc {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.source-card .source-name {
  font-family: Syne, sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 6px;
}
.source-url {
  color: var(--muted);
  font-size: 0.75rem;
  word-break: break-all;
  line-height: 1.45;
  text-decoration: none;
}
.source-url:hover { color: var(--accent-2); }

.shots-panel { margin-top: 14px; }
.shots-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(150px, 180px);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.shots-rail .shot {
  display: block;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.25);
  scroll-snap-align: start;
}
.shots-rail img {
  display: block;
  width: 100%;
  height: 280px;
  object-fit: cover;
}

.sticky-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(11,13,18,0.96), rgba(11,13,18,0.82));
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--line);
}
.sticky-cta-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sticky-meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.sticky-meta strong {
  font-family: Syne, sans-serif;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sticky-meta span {
  color: var(--muted);
  font-size: 0.7rem;
}

@media (max-width: 800px) {
  .detail-stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-grid { grid-template-columns: 1fr; }
  .detail-icon { width: 78px; height: 78px; border-radius: 18px; }
  .desktop-actions { display: none; }
  .shots-rail { grid-auto-columns: minmax(132px, 58vw); }
  .shots-rail img { height: 240px; }

  .detail-top {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px 12px;
  }
  .hero-source {
    max-width: 120px;
    padding: 8px 10px;
  }
  .hero-source-name { font-size: 0.8rem; }
  .hero-source-url { display: none; }
}

@media (min-width: 801px) {
  .sticky-cta { display: none; }
  .detail-page { padding-bottom: 0; }
}
`;

