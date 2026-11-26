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
  <div class="shell">
    <nav class="topnav" aria-label="Primary">
      <a href="/">[ home ]</a>
      <a href="/#latest">[ latest apps ]</a>
      <a href="/#repos">[ repos ]</a>
      <a href="/#search">[ search ]</a>
      <a href="/#add">[ add source ]</a>
      <a href="/api/status">[ api ]</a>
    </nav>
    ${body}
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
  const repos = store.listRepos({ withApps: true });
  const allApps = store.searchApps("", { limit: 500 });

  // "Most" by appearing first in catalog order / name — use size as a stand-in popularity proxy
  const most = [...allApps]
    .sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))
    .slice(0, 15);
  const latest = [...allApps]
    .sort((a, b) => String(b.versionDate || "").localeCompare(String(a.versionDate || "")))
    .slice(0, 15);

  function appRows(apps) {
    if (!apps.length) {
      return `<tr><td colspan="5" class="muted">No apps indexed yet.</td></tr>`;
    }
    return apps
      .map((app) => {
        const href = `/app/${encodeURIComponent(app.repoId)}/${encodeURIComponent(app.id)}`;
        return `<tr>
          <td class="mono">${esc(ymd(app.versionDate))}</td>
          <td><a href="${esc(href)}">${esc(app.name)}</a><div class="muted hide-sm">${esc(app.bundleIdentifier || "")}</div></td>
          <td>${esc(app.developerName || app.repoName || "—")}</td>
          <td class="mono">${esc(app.version ? `v${app.version}` : "—")}</td>
          <td class="mono">${esc(app.size ? formatBytes(app.size) : "—")}</td>
        </tr>`;
      })
      .join("");
  }

  function repoRows() {
    if (!repos.length) {
      return `<tr><td colspan="5" class="muted">No repos yet. Add a source below.</td></tr>`;
    }
    return repos
      .map((repo) => {
        const status = repo.lastError
          ? `<span class="bad">Error</span>`
          : `<span class="ok">✓ Verified</span>`;
        return `<tr data-id="${esc(repo.id)}">
          <td class="mono">${esc(ymd(repo.refreshedAt || repo.addedAt))}</td>
          <td><strong>${esc(repo.name)}</strong><div class="muted">${esc(repo.sourceURL)}</div></td>
          <td class="mono">${esc(repo.appCount || 0)}</td>
          <td>${status}</td>
          <td>
            <button class="btn btn-ghost" data-act="refresh" type="button">Refresh</button>
            <button class="btn btn-ghost" data-act="remove" type="button">Remove</button>
          </td>
        </tr>`;
      })
      .join("");
  }

  const body = `
    <header class="hero">
      <div class="logo-mark" aria-hidden="true"></div>
      <div class="logo-text">SENTRY</div>
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
      <table class="repo" id="search-table">
        <thead><tr>
          <th style="width:12%">::Released</th>
          <th>::App</th>
          <th style="width:18%">::Author</th>
          <th style="width:10%">::Version</th>
          <th style="width:10%">::Size</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <div class="section-title" id="latest">[ Latest Apps ]</div>
    <table class="repo">
      <thead><tr>
        <th style="width:12%">::Released</th>
        <th>::Description</th>
        <th style="width:18%">::Author</th>
        <th style="width:10%">::Version</th>
        <th style="width:10%">::Size</th>
      </tr></thead>
      <tbody>${appRows(latest)}</tbody>
    </table>

    <div class="section-title">[ Largest Indexed Apps ]</div>
    <table class="repo">
      <thead><tr>
        <th style="width:12%">::Released</th>
        <th>::Description</th>
        <th style="width:18%">::Author</th>
        <th style="width:10%">::Version</th>
        <th style="width:10%">::Size</th>
      </tr></thead>
      <tbody>${appRows(most)}</tbody>
    </table>

    <div class="section-title" id="repos">[ Indexed Repos ]</div>
    <table class="repo" id="repos-table">
      <thead><tr>
        <th style="width:12%">::Updated</th>
        <th>::Source</th>
        <th style="width:10%">::Apps</th>
        <th style="width:12%">::Status</th>
        <th style="width:18%">::Actions</th>
      </tr></thead>
      <tbody>${repoRows()}</tbody>
    </table>

    <div class="panel" id="add">
      <h2>[ Add IPA Source ]</h2>
      <label for="source-url">Source JSON URL</label>
      <input class="source" id="source-url" placeholder="https://example.com/apps.json" />
      <div class="row">
        <button class="btn" id="add-btn" type="button">Index source</button>
        <button class="btn btn-ghost" id="sample-btn" type="button">Load sample</button>
      </div>
      <div class="msg" id="add-msg"></div>
      <p class="muted" style="margin:10px 0 0;font-size:11px">
        Expects AltStore-compatible JSON (<code>name</code>, <code>identifier</code>, <code>apps[]</code>).
        Private/localhost URLs are blocked.
      </p>
    </div>

    <div class="footer-stats">
      Total Repos: <strong id="s-repos">${stats.repos}</strong>
      &nbsp;|&nbsp; Total Apps: <strong id="s-apps">${stats.apps}</strong>
      &nbsp;|&nbsp; Source Errors: <strong id="s-errors">${stats.errors}</strong>
      &nbsp;|&nbsp; ${esc(SITE_NAME)}
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
      function rowHtml(app) {
        var href = "/app/" + encodeURIComponent(app.repoId) + "/" + encodeURIComponent(app.id);
        return "<tr><td class='mono'>"+esc(ymd(app.versionDate))+"</td>"+
          "<td><a href='"+esc(href)+"'>"+esc(app.name)+"</a><div class='muted hide-sm'>"+esc(app.bundleIdentifier||"")+"</div></td>"+
          "<td>"+esc(app.developerName||app.repoName||"—")+"</td>"+
          "<td class='mono'>"+esc(app.version?("v"+app.version):"—")+"</td>"+
          "<td class='mono'>"+esc(app.size?bytes(app.size):"—")+"</td></tr>";
      }
      async function searchApps() {
        var q = document.getElementById("q").value.trim();
        var box = document.getElementById("search-results");
        var tb = document.querySelector("#search-table tbody");
        if (!q) { box.style.display = "none"; return; }
        box.style.display = "block";
        tb.innerHTML = "<tr><td colspan='5' class='muted'>Searching…</td></tr>";
        var res = await fetch("/api/apps?q="+encodeURIComponent(q)+"&limit=100", {cache:"no-store"});
        var data = await res.json();
        var apps = data.apps || [];
        tb.innerHTML = apps.length ? apps.map(rowHtml).join("") : "<tr><td colspan='5' class='muted'>No apps matched.</td></tr>";
      }
      document.getElementById("search-btn").onclick = function(){ searchApps().catch(console.error); };
      document.getElementById("clear-btn").onclick = function(){
        document.getElementById("q").value = "";
        document.getElementById("search-results").style.display = "none";
      };
      document.getElementById("q").addEventListener("keydown", function(e){
        if (e.key === "Enter") searchApps().catch(console.error);
      });

      async function indexSource(sourceURL) {
        var msg = document.getElementById("add-msg");
        msg.className = "msg"; msg.textContent = "Fetching source…";
        document.getElementById("add-btn").disabled = true;
        document.getElementById("sample-btn").disabled = true;
        try {
          var res = await fetch("/api/repos", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ sourceURL: sourceURL })
          });
          var data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || res.status);
          msg.className = "msg ok";
          msg.textContent = "Indexed " + (data.repo.name || "source") + " · " + (data.repo.appCount || 0) + " apps";
          document.getElementById("source-url").value = "";
          location.reload();
        } catch (err) {
          msg.className = "msg err";
          msg.textContent = String(err.message || err);
        } finally {
          document.getElementById("add-btn").disabled = false;
          document.getElementById("sample-btn").disabled = false;
        }
      }
      document.getElementById("add-btn").onclick = function(){
        indexSource(document.getElementById("source-url").value.trim()).catch(console.error);
      };
      document.getElementById("sample-btn").onclick = function(){
        var u = location.origin + "/sample-source.json";
        document.getElementById("source-url").value = u;
        indexSource(u).catch(console.error);
      };

      document.getElementById("repos-table").addEventListener("click", async function(e){
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        var id = tr && tr.getAttribute("data-id");
        if (!id) return;
        btn.disabled = true;
        try {
          if (btn.getAttribute("data-act") === "refresh") {
            var res = await fetch("/api/repos/"+encodeURIComponent(id)+"/refresh", {method:"POST"});
            var data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || res.status);
          } else {
            var res2 = await fetch("/api/repos/"+encodeURIComponent(id), {method:"DELETE"});
            var data2 = await res2.json();
            if (!res2.ok || !data2.ok) throw new Error(data2.error || res2.status);
          }
          location.reload();
        } catch (err) {
          alert(String(err.message || err));
          btn.disabled = false;
        }
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
