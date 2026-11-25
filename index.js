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
const STARTED_AT = Date.now();

const store = new Store(DATA_DIR);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));

const SAMPLE_SOURCE = {
  name: "warez.skin Sample Repo",
  identifier: "skin.warez.sample",
  subtitle: "Demo IPA catalog for discovery UI",
  apps: [
    {
      name: "Sample Player",
      bundleIdentifier: "skin.warez.sample.player",
      developerName: "warez.skin",
      subtitle: "Demo listing",
      version: "1.0.0",
      versionDate: "2026-11-25",
      size: 12_582_912,
      downloadURL: "https://warez.skin/sample/player.ipa",
      screenshotURLs: [],
      localizedDescription: "Demo app listing used to exercise discovery + details.",
    },
    {
      name: "Sample Notes",
      bundleIdentifier: "skin.warez.sample.notes",
      developerName: "warez.skin",
      subtitle: "Demo listing",
      version: "2.1.0",
      versionDate: "2026-11-20",
      size: 8_388_608,
      downloadURL: "https://warez.skin/sample/notes.ipa",
      screenshotURLs: [],
      localizedDescription: "Another demo listing for the details page.",
    },
  ],
};

const VIEWPORT =
  "width=device-width, initial-scale=0.6, minimum-scale=0.4, maximum-scale=3, user-scalable=yes";

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

app.get("/sample-source.json", (_req, res) => {
  res.json(SAMPLE_SOURCE);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "warez.skin",
    uptimeSec: Math.floor((Date.now() - STARTED_AT) / 1000),
    ...store.stats(),
  });
});

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    service: "warez.skin",
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

app.get("/", (_req, res) => {
  res.type("html").send(renderIndex());
});

app.get("/app/:repoId/:appId", (req, res) => {
  const found = store.getApp(req.params.repoId, req.params.appId);
  if (!found) {
    return res.status(404).type("html").send(renderNotFound());
  }
  return res.type("html").send(renderAppDetails(found));
});

function shellTop(title) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="${VIEWPORT}" />
  <meta name="description" content="warez.skin — IPA app repository discovery." />
  <title>${esc(title)}</title>
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
        <a href="/#discover">Discover</a>
        <a href="/#repos">Repos</a>
        <a href="/#add">Add source</a>
        <a href="/api/status">API</a>
      </nav>
    </header>`;
}

function shellBottom() {
  return `
    <footer>
      <span>warez.skin · IPA app repo discovery</span>
      <span class="mono">mobile scale 60%</span>
    </footer>
  </div>
</body>
</html>`;
}

function renderNotFound() {
  return `${shellTop("Not found · warez.skin")}
    <h1 class="brand">App not found</h1>
    <p class="tagline">That listing is missing or the repo was removed.</p>
    <a class="btn btn-primary" href="/">Back to discovery</a>
  ${shellBottom()}`;
}

function tintRgb(raw) {
  const m = String(raw || "")
    .trim()
    .match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (!m) return null;
  const rgb = [m[1], m[2], m[3]].map((n) => Math.max(0, Math.min(255, Number(n))));
  return `rgb(${rgb.join(",")})`;
}

function splitFeatureLines(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*[•·]\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderAppDetails(app) {
  const shots = (app.screenshotURLs || [])
    .map(
      (u) =>
        `<a class="shot" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" /></a>`
    )
    .join("");

  const features = splitFeatureLines(
    app.localizedDescription || app.versionDescription || ""
  );
  const featureHtml = features.length
    ? `<ul class="feature-list">${features
        .map((line) => `<li><span class="tick" aria-hidden="true"></span><span>${esc(line)}</span></li>`)
        .join("")}</ul>`
    : `<p class="detail-desc">No description.</p>`;

  const icon = app.iconURL
    ? `<img class="detail-icon" src="${esc(app.iconURL)}" alt="" referrerpolicy="no-referrer" />`
    : `<div class="detail-icon" aria-hidden="true"></div>`;

  const tint = tintRgb(app.tintColor) || "rgb(124,92,255)";
  const heroStyle = `--app-tint:${tint};`;

  return `${shellTop(`${app.name} · warez.skin`)}
    <div class="detail-page" style="${heroStyle}">
      <a class="back-link" href="/#discover">← Back to discovery</a>

      <section class="detail-hero panel">
        <div class="detail-glow" aria-hidden="true"></div>
        <div class="detail-top">
          ${icon}
          <div class="detail-copy">
            ${
              app.featured
                ? `<div class="detail-kicker"><span class="pill good">featured</span></div>`
                : ""
            }
            <h1 class="detail-title">${esc(app.name)}</h1>
            <div class="app-meta">${esc(app.bundleIdentifier || "—")}</div>
            <div class="detail-actions desktop-actions">
              ${
                app.downloadURL
                  ? `<a class="btn btn-primary btn-lg" href="${esc(app.downloadURL)}" target="_blank" rel="noopener noreferrer">Open IPA URL</a>`
                  : ""
              }
              <a class="btn btn-lg" href="/#discover">All apps</a>
            </div>
          </div>
        </div>
      </section>

      <div class="detail-stats-row" aria-label="App metadata">
        <div class="stat-chip">
          <span class="stat-label">Version</span>
          <span class="stat-value">${esc(app.version ? `v${app.version}` : "—")}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-label">Size</span>
          <span class="stat-value">${esc(app.size ? formatBytes(app.size) : "—")}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-label">Updated</span>
          <span class="stat-value">${esc(app.versionDate || "—")}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-label">Developer</span>
          <span class="stat-value">${esc(app.developerName || "—")}</span>
        </div>
      </div>

      ${
        shots
          ? `<section class="panel shots-panel">
              <div class="section-head">
                <h2>Screenshots</h2>
                <span class="muted mono">${(app.screenshotURLs || []).length} images</span>
              </div>
              <div class="shots-rail">${shots}</div>
            </section>`
          : ""
      }

      <div class="detail-grid">
        <section class="panel">
          <div class="section-head"><h2>About</h2></div>
          ${featureHtml}
        </section>
        <section class="panel source-card">
          <div class="section-head"><h2>Source</h2></div>
          <div class="source-name">${esc(app.repoName || "")}</div>
          <a class="source-url" href="${esc(app.sourceURL || "#")}" target="_blank" rel="noopener noreferrer">${esc(app.sourceURL || "")}</a>
          <div class="pill-row" style="margin-top:14px">
            <span class="pill">${esc(app.bundleIdentifier || "bundle")}</span>
            ${app.version ? `<span class="pill">v${esc(app.version)}</span>` : ""}
          </div>
        </section>
      </div>

      ${
        app.downloadURL
          ? `<div class="sticky-cta">
              <div class="sticky-cta-inner">
                <div class="sticky-meta">
                  <strong>${esc(app.name)}</strong>
                  <span>${esc(app.version ? `v${app.version}` : "")}${app.size ? ` · ${esc(formatBytes(app.size))}` : ""}</span>
                </div>
                <a class="btn btn-primary" href="${esc(app.downloadURL)}" target="_blank" rel="noopener noreferrer">Open IPA URL</a>
              </div>
            </div>`
          : ""
      }
    </div>
  ${shellBottom()}`;
}

function renderIndex() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="${VIEWPORT}" />
  <meta name="description" content="warez.skin — IPA app repository discovery. Add sources, search apps, open details." />
  <title>warez.skin · IPA repo discovery</title>
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
        <a href="#discover">Discover</a>
        <a href="#repos">Repos</a>
        <a href="#add">Add source</a>
        <a href="/api/status">API</a>
      </nav>
    </header>

    <h1 class="brand">IPA repo<span class="dot">.</span>discovery</h1>
    <p class="tagline">
      Index AltStore-style IPA sources, search apps across repos, and open each listing on its own details page.
      Mobile viewport starts at <strong>60%</strong> zoom so more of the catalog fits on screen.
    </p>

    <div class="meta-row" id="stats">
      <div class="meta-square">
        <div class="stat" id="s-repos">—</div>
        <small>repos indexed</small>
      </div>
      <div class="meta-square">
        <div class="stat" id="s-apps">—</div>
        <small>apps discovered</small>
      </div>
      <div class="meta-square">
        <div class="stat" id="s-hits">—</div>
        <small>search hits</small>
      </div>
      <div class="meta-square">
        <div class="stat" id="s-errors">—</div>
        <small>source errors</small>
      </div>
    </div>

    <div class="grid">
      <section class="panel span-12" id="discover">
        <h2>Discover apps</h2>
        <label for="q">Search by app name, bundle ID, developer, or repo</label>
        <input id="q" placeholder="e.g. com.example.app or music player" autocomplete="off" />
        <div class="row">
          <button class="btn btn-primary" id="search-btn" type="button">Search</button>
          <button class="btn btn-ghost" id="clear-btn" type="button">Clear</button>
          <span class="muted mono" id="search-meta">tap an app for details</span>
        </div>
        <div id="apps" class="app-list" style="margin-top:14px"></div>
      </section>

      <section class="panel span-8" id="repos">
        <h2>Indexed repos</h2>
        <div id="repos-list" class="repo-list muted">Loading…</div>
      </section>

      <section class="panel span-4" id="add">
        <h2>Add IPA source</h2>
        <label for="source-url">Source JSON URL</label>
        <input id="source-url" placeholder="https://example.com/apps.json" />
        <div class="row">
          <button class="btn btn-primary" id="add-btn" type="button">Index source</button>
          <button class="btn btn-ghost" id="sample-btn" type="button">Load sample</button>
        </div>
        <div class="msg" id="add-msg"></div>
        <p class="muted" style="margin:14px 0 0;font-size:0.75rem;line-height:1.5">
          Expects AltStore-compatible JSON (<code>name</code>, <code>identifier</code>, <code>apps[]</code>).
          Private/localhost URLs are blocked. Try
          <code>https://warez.skin/sample-source.json</code>.
        </p>
      </section>
    </div>

    <footer>
      <span>warez.skin · IPA app repo discovery</span>
      <span class="mono" id="foot-stamp">—</span>
    </footer>
  </div>

  <script>
    function bytes(n) {
      n = Number(n) || 0;
      if (!n) return "—";
      const u = ["B","KB","MB","GB"];
      let i = 0, v = n;
      while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
      return v.toFixed(i ? 1 : 0) + " " + u[i];
    }
    function ago(ts) {
      if (!ts) return "never";
      const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
      if (s < 60) return s + "s ago";
      if (s < 3600) return Math.floor(s / 60) + "m ago";
      if (s < 86400) return Math.floor(s / 3600) + "h ago";
      return Math.floor(s / 86400) + "d ago";
    }
    function esc(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
    function appHref(app) {
      return "/app/" + encodeURIComponent(app.repoId) + "/" + encodeURIComponent(app.id);
    }

    async function refreshStats() {
      const res = await fetch("/api/status", { cache: "no-store" });
      const data = await res.json();
      document.getElementById("s-repos").textContent = data.repos ?? 0;
      document.getElementById("s-apps").textContent = data.apps ?? 0;
      document.getElementById("s-errors").textContent = data.errors ?? 0;
      document.getElementById("foot-stamp").textContent =
        "uptime " + (data.uptimeSec || 0) + "s · scale 60% · " + new Date().toLocaleTimeString();
    }

    function renderApps(apps, q) {
      const root = document.getElementById("apps");
      document.getElementById("s-hits").textContent = apps.length;
      document.getElementById("search-meta").textContent = q
        ? (apps.length + " hit" + (apps.length === 1 ? "" : "s") + " for \\"" + q + "\\"")
        : (apps.length ? "tap an app for details" : "no apps indexed yet — add a source");
      if (!apps.length) {
        root.innerHTML = "<div class='muted'>No apps matched.</div>";
        return;
      }
      root.innerHTML = apps.map(app => {
        const icon = app.iconURL
          ? "<img class='icon' src='" + esc(app.iconURL) + "' alt='' loading='lazy' referrerpolicy='no-referrer' />"
          : "<div class='icon' aria-hidden='true'></div>";
        return "<a class='app-card app-link' href='" + esc(appHref(app)) + "'>" +
          "<div class='app-card-top'>" +
            "<div style='display:flex;gap:12px;min-width:0;flex:1'>" +
              icon +
              "<div style='min-width:0'>" +
                "<div class='app-title'>" + esc(app.name) + "</div>" +
                "<div class='app-meta'>" + esc(app.bundleIdentifier || "—") + "</div>" +
                "<div class='pill-row'>" +
                  "<span class='pill'>" + esc(app.repoName || "repo") + "</span>" +
                  (app.version ? "<span class='pill'>v" + esc(app.version) + "</span>" : "") +
                  (app.size ? "<span class='pill'>" + bytes(app.size) + "</span>" : "") +
                  (app.developerName ? "<span class='pill'>" + esc(app.developerName) + "</span>" : "") +
                "</div>" +
              "</div>" +
            "</div>" +
            "<div class='chev' aria-hidden='true'>›</div>" +
          "</div>" +
        "</a>";
      }).join("");
    }

    async function searchApps() {
      const q = document.getElementById("q").value.trim();
      const res = await fetch("/api/apps?q=" + encodeURIComponent(q), { cache: "no-store" });
      const data = await res.json();
      renderApps(data.apps || [], q);
    }

    function renderRepos(repos) {
      const root = document.getElementById("repos-list");
      if (!repos.length) {
        root.innerHTML = "<div class='muted'>No repos yet. Add an IPA source JSON URL →</div>";
        return;
      }
      root.innerHTML = repos.map(repo => {
        const errPill = repo.lastError
          ? "<span class='pill bad'>error</span>"
          : "<span class='pill good'>ok</span>";
        const apps = (repo.apps || []).slice(0, 8).map(app => {
          const icon = app.iconURL
            ? "<img class='icon' style='width:28px;height:28px;border-radius:7px' src='" + esc(app.iconURL) + "' alt='' loading='lazy' referrerpolicy='no-referrer' />"
            : "<div class='icon' style='width:28px;height:28px;border-radius:7px' aria-hidden='true'></div>";
          const href = "/app/" + encodeURIComponent(repo.id) + "/" + encodeURIComponent(app.id);
          return "<a class='mini-app app-link' href='" + esc(href) + "'>" + icon +
            "<div style='min-width:0'>" +
              "<div class='name'>" + esc(app.name) + "</div>" +
              "<div class='bid'>" + esc(app.bundleIdentifier || "") +
                (app.version ? " · v" + esc(app.version) : "") +
              "</div>" +
            "</div></a>";
        }).join("");
        return "<article class='repo-card' data-id='" + esc(repo.id) + "'>" +
          "<div class='repo-card-top'>" +
            "<div style='min-width:0;flex:1'>" +
              "<div class='repo-title'>" + esc(repo.name) + "</div>" +
              "<div class='repo-url'>" + esc(repo.sourceURL) + "</div>" +
              "<div class='pill-row'>" +
                "<span class='pill'>" + (repo.appCount || 0) + " apps</span>" +
                "<span class='pill'>refreshed " + ago(repo.refreshedAt) + "</span>" +
                errPill +
              "</div>" +
              (repo.lastError ? "<div class='err' style='margin-top:8px;font-size:0.72rem'>" + esc(repo.lastError) + "</div>" : "") +
            "</div>" +
            "<div class='actions'>" +
              "<button class='btn' data-act='refresh' type='button'>Refresh</button>" +
              "<button class='btn btn-ghost' data-act='remove' type='button'>Remove</button>" +
            "</div>" +
          "</div>" +
          (apps
            ? "<details class='repo-apps'><summary>Preview apps</summary><div class='mini-apps'>" + apps + "</div></details>"
            : "") +
        "</article>";
      }).join("");
    }

    async function loadRepos() {
      const res = await fetch("/api/repos?apps=1", { cache: "no-store" });
      const data = await res.json();
      renderRepos(data.repos || []);
      await refreshStats();
      await searchApps();
    }

    document.getElementById("search-btn").onclick = () => searchApps().catch(console.error);
    document.getElementById("clear-btn").onclick = () => {
      document.getElementById("q").value = "";
      searchApps().catch(console.error);
    };
    document.getElementById("q").addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchApps().catch(console.error);
    });

    async function indexSource(sourceURL) {
      const msg = document.getElementById("add-msg");
      msg.className = "msg";
      msg.textContent = "Fetching source…";
      document.getElementById("add-btn").disabled = true;
      document.getElementById("sample-btn").disabled = true;
      try {
        const res = await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceURL }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || res.status);
        msg.className = "msg ok";
        msg.textContent = "Indexed " + (data.repo.name || "source") + " · " + (data.repo.appCount || 0) + " apps";
        document.getElementById("source-url").value = "";
        await loadRepos();
      } catch (err) {
        msg.className = "msg err";
        msg.textContent = String(err.message || err);
      } finally {
        document.getElementById("add-btn").disabled = false;
        document.getElementById("sample-btn").disabled = false;
      }
    }

    document.getElementById("add-btn").onclick = () => {
      indexSource(document.getElementById("source-url").value.trim()).catch(console.error);
    };
    document.getElementById("sample-btn").onclick = () => {
      document.getElementById("source-url").value = location.origin + "/sample-source.json";
      indexSource(location.origin + "/sample-source.json").catch(console.error);
    };

    document.getElementById("repos-list").addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      e.preventDefault();
      const card = btn.closest("[data-id]");
      const id = card && card.getAttribute("data-id");
      if (!id) return;
      btn.disabled = true;
      try {
        if (btn.getAttribute("data-act") === "refresh") {
          const res = await fetch("/api/repos/" + encodeURIComponent(id) + "/refresh", { method: "POST" });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || res.status);
        } else if (btn.getAttribute("data-act") === "remove") {
          const res = await fetch("/api/repos/" + encodeURIComponent(id), { method: "DELETE" });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || res.status);
        }
        await loadRepos();
      } catch (err) {
        alert(String(err.message || err));
        btn.disabled = false;
      }
    });

    loadRepos().catch((err) => {
      document.getElementById("repos-list").innerHTML = "<span class='err'>" + esc(err) + "</span>";
    });
    setInterval(() => refreshStats().catch(() => {}), 10000);
  </script>
</body>
</html>`;
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "internal error" });
});

app.listen(PORT, HOST, () => {
  console.log(`warez.skin IPA discovery on http://${HOST}:${PORT}`);
});
