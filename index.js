#!/usr/bin/env node
"use strict";

require("dotenv").config();

const express = require("express");
const css = require("./css");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const STARTED_AT = Date.now();

const app = express();
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "warez.skin",
    uptimeSec: Math.floor((Date.now() - STARTED_AT) / 1000),
    startedAt: STARTED_AT,
    node: process.version,
  });
});

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    service: "warez.skin",
    status: "online",
    stack: {
      runtime: "node",
      process: "pm2",
      proxy: "apache",
      ssl: "letsencrypt",
    },
    uptimeSec: Math.floor((Date.now() - STARTED_AT) / 1000),
    node: process.version,
  });
});

app.get("/panel.css", (_req, res) => {
  res.type("text/css").send(css);
});

app.get("/", (_req, res) => {
  res.type("html").send(renderIndex());
});

function renderIndex() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="warez.skin — skins, served clean. Node + css.js behind Apache SSL." />
  <title>warez.skin</title>
  <link rel="stylesheet" href="/panel.css" />
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <a class="logo" href="/">
        <span class="logo-mark" aria-hidden="true"></span>
        <span class="logo-text">warez.skin</span>
      </a>
      <nav class="nav" aria-label="Primary">
        <a href="#overview">Overview</a>
        <a href="#stack">Stack</a>
        <a href="#status">Status</a>
        <a href="/health">Health</a>
      </nav>
    </header>

    <h1 class="brand">Warez<span class="dot">.</span>skin</h1>
    <p class="tagline">
      Skins without the static clutter. Pages from <code>index.js</code>, styles from
      <code>css.js</code>, SSL on Apache, process under PM2.
    </p>

    <div class="hero-actions">
      <a class="btn btn-primary" href="#overview">Open index</a>
      <a class="btn" href="/api/status">API status</a>
      <span class="pill" id="live-pill"><span class="dot"></span><span id="live-label">checking…</span></span>
    </div>

    <div class="meta-row" id="stats" aria-live="polite">
      <div class="meta-square">
        <div class="stat" id="s-status">—</div>
        <small>service</small>
      </div>
      <div class="meta-square">
        <div class="stat" id="s-uptime">—</div>
        <small>uptime</small>
      </div>
      <div class="meta-square">
        <div class="stat" id="s-node">—</div>
        <small>node</small>
      </div>
      <div class="meta-square">
        <div class="stat" id="s-proxy">Apache</div>
        <small>edge · certbot</small>
      </div>
    </div>

    <div class="grid" id="overview">
      <section class="panel span-8">
        <span class="feature-kicker">Index</span>
        <h2>Built in JS, not HTML files</h2>
        <p>
          The homepage is rendered by Express as a string template. CSS ships from
          <code>css.js</code> at <code>/panel.css</code>. No <code>public/*.html</code>.
        </p>
        <ul class="list">
          <li><strong>index.js</strong> — routes, health, and page renderers</li>
          <li><strong>css.js</strong> — shared stylesheet module</li>
          <li><strong>PM2</strong> — keeps the Node process online on :3000</li>
          <li><strong>Apache</strong> — terminates TLS and reverse-proxies to Node</li>
        </ul>
      </section>

      <section class="panel span-4" id="status">
        <span class="feature-kicker">Live</span>
        <h2>Heartbeat</h2>
        <p id="heartbeat" class="muted">Polling /api/status…</p>
        <ul class="list" id="stack-list">
          <li><strong>runtime</strong> — —</li>
          <li><strong>process</strong> — —</li>
          <li><strong>proxy</strong> — —</li>
          <li><strong>ssl</strong> — —</li>
        </ul>
      </section>

      <section class="panel span-4" id="stack">
        <span class="feature-kicker">Surface</span>
        <h2>Skin shell</h2>
        <p>Dark panel layout ready for catalogs, unlocks, or dashboards. Extend panels in <code>renderIndex()</code>.</p>
      </section>

      <section class="panel span-4">
        <span class="feature-kicker">Deploy</span>
        <h2>VPS path</h2>
        <p><code>/opt/warez.skin</code> · <code>pm2 restart warez-skin</code> after edits · Certbot renews in the background.</p>
      </section>

      <section class="panel span-4">
        <span class="feature-kicker">Next</span>
        <h2>Hook your product</h2>
        <p>Drop APIs under <code>/api/*</code>, add panels to the grid, keep styles in <code>css.js</code>.</p>
      </section>
    </div>

    <footer>
      <span>warez.skin · index.js + css.js</span>
      <span class="mono" id="foot-stamp">—</span>
    </footer>
  </div>

  <script>
    function formatUptime(sec) {
      sec = Math.max(0, Number(sec) || 0);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      if (h) return h + "h " + m + "m";
      if (m) return m + "m " + s + "s";
      return s + "s";
    }

    async function refresh() {
      const pill = document.getElementById("live-pill");
      const label = document.getElementById("live-label");
      const heartbeat = document.getElementById("heartbeat");
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status " + res.status);
        const data = await res.json();

        document.getElementById("s-status").textContent = data.status || "online";
        document.getElementById("s-uptime").textContent = formatUptime(data.uptimeSec);
        document.getElementById("s-node").textContent = (data.node || "").replace(/^v/, "v");
        document.getElementById("foot-stamp").textContent =
          "uptime " + formatUptime(data.uptimeSec) + " · " + new Date().toLocaleTimeString();

        const stack = data.stack || {};
        document.getElementById("stack-list").innerHTML = [
          ["runtime", stack.runtime],
          ["process", stack.process],
          ["proxy", stack.proxy],
          ["ssl", stack.ssl],
        ].map(([k, v]) => "<li><strong>" + k + "</strong> — " + (v || "—") + "</li>").join("");

        pill.className = "pill online";
        label.textContent = "online";
        heartbeat.className = "ok";
        heartbeat.textContent = "Healthy · " + (data.service || "warez.skin");
      } catch (err) {
        pill.className = "pill offline";
        label.textContent = "offline";
        document.getElementById("s-status").textContent = "down";
        heartbeat.className = "err";
        heartbeat.textContent = String(err.message || err);
      }
    }

    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`;
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "internal error" });
});

app.listen(PORT, HOST, () => {
  console.log(`warez.skin listening on http://${HOST}:${PORT}`);
});
