/** Shared stylesheet for warez.skin (served as /panel.css). */
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
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(124, 92, 255, 0.25), transparent 60%),
    radial-gradient(900px 500px at 90% 110%, rgba(56, 189, 248, 0.18), transparent 55%),
    var(--bg);
  color: var(--ink);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}

body {
  padding: 28px 20px 60px;
  display: grid;
  place-items: center;
  min-height: 100vh;
}

.shell {
  width: min(92vw, 560px);
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
  padding: 2rem;
  text-align: center;
}

.brand {
  font-family: Syne, sans-serif;
  font-weight: 800;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  letter-spacing: -0.04em;
  line-height: 0.95;
  margin: 0 0 12px;
}

.tagline {
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
}

.badge {
  display: inline-block;
  margin-top: 1.25rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(124, 92, 255, 0.18);
  color: #cbbdff;
  font-size: 0.85rem;
  border: 1px solid rgba(124, 92, 255, 0.35);
}

.muted { color: var(--muted); }
`;
