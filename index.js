#!/usr/bin/env node
"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const css = require("./css");
const { Store } = require("./store");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const DATA_DIR = process.env.WAREZ_DATA || path.join(__dirname, "data");
const SITE_NAME = process.env.SITE_NAME || "sentry.mba";
const STARTED_AT = Date.now();

const store = new Store(DATA_DIR);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));

const SAMPLE_SOURCE = {
  name: `${SITE_NAME} Sample Repo`,
  identifier: "mba.sentry.sample",
  subtitle: "Demo IPA catalog",
  apps: [
    {
      name: "Sample Player",
      bundleIdentifier: "mba.sentry.sample.player",
      developerName: SITE_NAME,
      version: "1.0.0",
      versionDate: "2026-11-25",
      size: 12_582_912,
      downloadURL: `https://${SITE_NAME}/sample/player.ipa`,
      localizedDescription: "Demo listing for discovery UI.",
    },
    {
      name: "Sample Notes",
      bundleIdentifier: "mba.sentry.sample.notes",
      developerName: SITE_NAME,
      version: "2.1.0",
      versionDate: "2026-11-20",
      size: 8_388_608,
      downloadURL: `https://${SITE_NAME}/sample/notes.ipa`,
      localizedDescription: "Another demo listing.",
    },
  ],
};

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBytes(n) {
  const v = Number(n) || 0;
  if (!v) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = v;
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024;
    i += 1;
  }
  return `${x.toFixed(i ? 1 : 0)} ${u[i]}`;
}

function ymd(tsOrStr) {
  if (!tsOrStr) return "—";
  if (typeof tsOrStr === "number") {
    const d = new Date(tsOrStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toISOString().slice(0, 10);
  }
  const s = String(tsOrStr);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function shell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${esc(SITE_NAME)} — IPA app repository discovery." />
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="/panel.css" />
</head>
<body>
  <div class="page">
    <nav class="topnav float-tabs" aria-label="Primary">
      <a href="/">[ home ]</a>
      <a href="/#latest">[ latest apps ]</a>
      <a href="/#search">[ search ]</a>
      <a class="buy-gold" href="/">[ <img class="coin" src="/gold.gif" width="12" height="10" alt="" />buy gold ]</a>
      <a href="/api/status">[ api ]</a>
    </nav>
    <div class="shell">
      ${body}
    </div>
  </div>
</body>
</html>`;
}

app.get("/sample-source.json", (_req, res) => {
  res.json(SAMPLE_SOURCE);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: SITE_NAME,
    uptimeSec: Math.floor((Date.now() - STARTED_AT) / 1000),
    ...store.stats(),
  });
});

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    service: SITE_NAME,
    status: "online",
    focus: "ipa-app-repo-discovery",
    uptimeSec: Math.floor((Date.now() - STARTED_AT) / 1000),
    node: process.version,
    ...store.stats(),
  });
});

app.get("/api/repos", (req, res) => {
  const withApps = String(req.query.apps || "") === "1";
  res.json({ ok: true, repos: store.listRepos({ withApps }), stats: store.stats() });
});

app.get("/api/repos/:id", (req, res) => {
  const repo = store.getRepo(req.params.id);
  if (!repo) return res.status(404).json({ ok: false, error: "repo not found" });
  return res.json({ ok: true, repo });
});

app.post("/api/repos", async (req, res) => {
  try {
    const sourceURL = String(req.body?.sourceURL || req.body?.url || "").trim();
    if (!sourceURL) {
      return res.status(400).json({ ok: false, error: "sourceURL required" });
    }
    const repo = await store.addRepo(sourceURL);
    return res.json({ ok: true, repo });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

app.post("/api/repos/:id/refresh", async (req, res) => {
  try {
    const repo = await store.refreshRepo(req.params.id);
    if (!repo) return res.status(404).json({ ok: false, error: "repo not found" });
    return res.json({ ok: true, repo });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

app.delete("/api/repos/:id", (req, res) => {
  const ok = store.removeRepo(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: "repo not found" });
  return res.json({ ok: true });
});

app.get("/api/apps", (req, res) => {
  const q = String(req.query.q || "");
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
  const apps = store.searchApps(q, { limit });
  res.json({ ok: true, q, count: apps.length, apps });
});

app.get("/api/apps/:repoId/:appId", (req, res) => {
  const found = store.getApp(req.params.repoId, req.params.appId);
  if (!found) return res.status(404).json({ ok: false, error: "app not found" });
  return res.json({ ok: true, app: found });
});

app.get("/panel.css", (_req, res) => {
  res.type("text/css").send(css);
});

app.get("/sentry-banner.png", (_req, res) => {
  res.type("image/png").sendFile(path.join(__dirname, "public", "sentry-banner.png"));
});
app.get("/sentry-banner.jpg", (_req, res) => {
  res.redirect(301, "/sentry-banner.png");
});
app.get("/gold.gif", (_req, res) => {
  res.type("image/gif").sendFile(path.join(__dirname, "public", "gold.gif"));
});
app.get("/gold-coin.png", (_req, res) => {
  res.type("image/png").sendFile(path.join(__dirname, "public", "gold-coin.png"));
});
app.get("/bg.gif", (_req, res) => {
  res.type("image/gif").sendFile(path.join(__dirname, "public", "bg.gif"));
});
app.get("/check.png", (_req, res) => {
  res.type("image/png").sendFile(path.join(__dirname, "public", "check.png"));
});

app.get("/app/:repoId/:appId", (req, res) => {
  const found = store.getApp(req.params.repoId, req.params.appId);
  if (!found) {
    return res
      .status(404)
      .type("html")
      .send(
        shell(
          `Not found · ${SITE_NAME}`,
          `<p class="blurb">App not found.</p><p><a href="/">[ back to home ]</a></p>`
        )
      );
  }
  return res.type("html").send(renderAppDetails(found));
});

function renderAppDetails(app) {
  const shots = (app.screenshotURLs || [])
    .map(
      (u) =>
        `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer"><img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" /></a>`
    )
    .join("");

  const icon = app.iconURL
    ? `<img src="${esc(app.iconURL)}" alt="" width="72" height="72" style="border:1px solid #2a6b2a;background:#001000" referrerpolicy="no-referrer" />`
    : "";

  return shell(
    `${app.name} · ${SITE_NAME}`,
    `
    <a class="detail-back" href="/#search">[ ← back ]</a>
    <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
      ${icon}
      <div>
        <h1 class="detail-title">${esc(app.name)}</h1>
        <div class="detail-meta">${esc(app.bundleIdentifier || "—")}</div>
        <div class="row">
          ${
            app.downloadURL
              ? `<a class="btn" href="${esc(app.downloadURL)}" target="_blank" rel="noopener noreferrer">Open IPA URL</a>`
              : ""
          }
          <a class="btn btn-ghost" href="/#search">All apps</a>
        </div>
      </div>
    </div>
    <div class="chips">
      <div class="chip"><span>Version</span><strong>${esc(app.version ? `v${app.version}` : "—")}</strong></div>
      <div class="chip"><span>Size</span><strong>${esc(app.size ? formatBytes(app.size) : "—")}</strong></div>
      <div class="chip"><span>Updated</span><strong>${esc(app.versionDate || "—")}</strong></div>
      <div class="chip"><span>Developer</span><strong>${esc(app.developerName || "—")}</strong></div>
    </div>
    ${shots ? `<div class="panel"><div class="section-title" style="margin-top:0">[ Screenshots ]</div><div class="shots">${shots}</div></div>` : ""}
    <div class="panel">
      <div class="section-title" style="margin-top:0">[ About ]</div>
      <p>${esc(app.localizedDescription || "No description.").replace(/\n/g, "<br/>")}</p>
      <p class="muted">Source: <a href="${esc(app.sourceURL || "#")}" target="_blank" rel="noopener noreferrer">${esc(app.repoName || app.sourceURL || "")}</a></p>
    </div>`
  );
}

function renderIndex() {
  const stats = store.stats();
  const allApps = store.searchApps("", { limit: 500 });

  // "Most" by appearing first in catalog order / name — use size as a stand-in popularity proxy
  const most = [...allApps]
    .sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))
    .slice(0, 16);
  const latest = [...allApps]
    .sort((a, b) => String(b.versionDate || "").localeCompare(String(a.versionDate || "")))
    .slice(0, 16);

  function appCard(app) {
    const href = `/app/${encodeURIComponent(app.repoId)}/${encodeURIComponent(app.id)}`;
    const icon = app.iconURL
      ? `<img class="app-icon" src="${esc(app.iconURL)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
      : `<div class="app-icon app-icon-fallback" aria-hidden="true"></div>`;
    const ver = app.version ? String(app.version) : "—";
    const sub = app.bundleIdentifier || app.developerName || app.repoName || "";
    const meta = [
      app.developerName && app.developerName !== sub ? `• ${app.developerName}` : "",
      app.size ? `• ${formatBytes(app.size)}` : "",
      app.versionDate ? `• ${ymd(app.versionDate)}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `<a class="app-card" href="${esc(href)}">
      ${icon}
      <div class="app-card-body">
        <div class="app-card-title">${esc(app.name)}</div>
        <div class="app-card-sub">${esc(sub)}</div>
        <div class="app-card-meta">${esc(meta)}</div>
        <div class="app-card-foot">
          <span class="cost"><img class="coin" src="/gold.gif" width="12" height="10" alt="" />Free</span>
          <span class="ver-tag">${esc(ver)}</span>
        </div>
      </div>
    </a>`;
  }

  function appCards(apps) {
    if (!apps.length) {
      return `<div class="muted" style="grid-column:1/-1;padding:12px;text-align:center">No apps indexed yet.</div>`;
    }
    return apps.map(appCard).join("");
  }

  const body = `
    <header class="hero">
      <img class="banner" src="/sentry-banner.png" alt="SENTRY.MBA" width="900" height="200" />
      <p class="blurb">IPA repository discovery — index AltStore-style sources, search apps, open listings.<br/>Style inspired by classic sentry.mba · content is app repos only.</p>
    </header>

    <div class="search-row" id="search">
      <label for="q">Search:</label>
      <input id="q" placeholder="app name, bundle id, developer…" autocomplete="off" />
      <button type="button" id="search-btn">Search</button>
      <button type="button" class="btn-ghost" id="clear-btn">Clear</button>
    </div>
    <div id="search-results" class="panel" style="display:none">
      <div class="section-title" style="margin-top:0">[ Search Results ]</div>
      <div class="app-grid" id="search-grid"></div>
    </div>

    <div class="section-title" id="latest">[ Latest Apps ]</div>
    <div class="app-grid">${appCards(latest)}</div>

    <div class="section-title">[ Largest Indexed Apps ]</div>
    <div class="app-grid">${appCards(most)}</div>

    <div class="footer-stats">
      Total Repos: <strong id="s-repos">${stats.repos}</strong>
      &nbsp;|&nbsp; Total Apps: <strong id="s-apps">${stats.apps}</strong>
      &nbsp;|&nbsp; Source Errors: <strong id="s-errors">${stats.errors}</strong>
      &nbsp;|&nbsp; <img class="coin" src="/gold.gif" width="12" height="10" alt="" />${esc(SITE_NAME)}
    </div>

    <script>
      function esc(s) {
        return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      }
      function bytes(n) {
        n = Number(n) || 0; if (!n) return "—";
        var u=["B","KB","MB","GB"], i=0, v=n;
        while (v>=1024 && i<u.length-1) { v/=1024; i++; }
        return v.toFixed(i?1:0)+" "+u[i];
      }
      function ymd(s) {
        if (!s) return "—";
        s = String(s);
        return s.length >= 10 ? s.slice(0,10) : s;
      }
      function cardHtml(app) {
        var href = "/app/" + encodeURIComponent(app.repoId) + "/" + encodeURIComponent(app.id);
        var icon = app.iconURL
          ? "<img class='app-icon' src='"+esc(app.iconURL)+"' alt='' loading='lazy' referrerpolicy='no-referrer' />"
          : "<div class='app-icon app-icon-fallback' aria-hidden='true'></div>";
        var ver = app.version ? String(app.version) : "—";
        var sub = app.bundleIdentifier || app.developerName || app.repoName || "";
        var meta = [];
        if (app.developerName && app.developerName !== sub) meta.push("• " + app.developerName);
        if (app.size) meta.push("• " + bytes(app.size));
        if (app.versionDate) meta.push("• " + ymd(app.versionDate));
        return "<a class='app-card' href='"+esc(href)+"'>"+icon+
          "<div class='app-card-body'>"+
          "<div class='app-card-title'>"+esc(app.name)+"</div>"+
          "<div class='app-card-sub'>"+esc(sub)+"</div>"+
          "<div class='app-card-meta'>"+esc(meta.join(" "))+"</div>"+
          "<div class='app-card-foot'>"+
          "<span class='cost'><img class='coin' src='/gold.gif' width='12' height='10' alt='' />Free</span>"+
          "<span class='ver-tag'>"+esc(ver)+"</span>"+
          "</div></div></a>";
      }
      async function searchApps() {
        var q = document.getElementById("q").value.trim();
        var box = document.getElementById("search-results");
        var grid = document.getElementById("search-grid");
        if (!q) { box.style.display = "none"; return; }
        box.style.display = "block";
        grid.innerHTML = "<div class='muted' style='grid-column:1/-1;padding:12px;text-align:center'>Searching…</div>";
        var res = await fetch("/api/apps?q="+encodeURIComponent(q)+"&limit=100", {cache:"no-store"});
        var data = await res.json();
        var apps = data.apps || [];
        grid.innerHTML = apps.length
          ? apps.map(cardHtml).join("")
          : "<div class='muted' style='grid-column:1/-1;padding:12px;text-align:center'>No apps matched.</div>";
      }
      document.getElementById("search-btn").onclick = function(){ searchApps().catch(console.error); };
      document.getElementById("clear-btn").onclick = function(){
        document.getElementById("q").value = "";
        document.getElementById("search-results").style.display = "none";
      };
      document.getElementById("q").addEventListener("keydown", function(e){
        if (e.key === "Enter") searchApps().catch(console.error);
      });
    </script>
  `;

  return shell(`${SITE_NAME} · IPA repo discovery`, body);
}

app.get("/", (_req, res) => {
  res.type("html").send(renderIndex());
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "internal error" });
});

app.listen(PORT, HOST, () => {
  console.log(`${SITE_NAME} IPA discovery on http://${HOST}:${PORT}`);
});
