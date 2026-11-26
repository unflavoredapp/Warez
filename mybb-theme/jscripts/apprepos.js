(function () {
  var root = document.getElementById("yh-apprepos");
  if (!root) return;

  var API = root.getAttribute("data-api") || "apprepos.php";
  var CAN = root.getAttribute("data-can-manage") === "1";
  var KEY = root.getAttribute("data-key") || "";
  var SAMPLE = root.getAttribute("data-sample") || "";
  var activeCat = "all";

  function bytes(n) {
    n = Number(n) || 0;
    if (!n) return "—";
    var u = ["B", "KB", "MB", "GB"];
    var i = 0, v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(i ? 1 : 0) + " " + u[i];
  }
  function ago(ts) {
    if (!ts) return "never";
    var s = Math.max(0, Math.round((Date.now() - Number(ts)) / 1000));
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
    return "Repository.php?action=app&repo=" + encodeURIComponent(app.repoId) + "&app=" + encodeURIComponent(app.id);
  }
  function api(path, opts) {
    opts = opts || {};
    var url = API + (path.indexOf("?") === 0 ? path : (path ? "?" + path.replace(/^\?/, "") : ""));
    return fetch(url, Object.assign({ credentials: "same-origin", cache: "no-store" }, opts)).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || data.ok === false) throw new Error((data && data.error) || r.status);
        return data;
      });
    });
  }
  function fmtCount(n) {
    n = Number(n) || 0;
    return n.toLocaleString();
  }

  function setStat(id, n, one, many) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = n;
    var label = el.nextElementSibling;
    if (label && label.tagName === "SPAN") {
      label.textContent = Number(n) === 1 ? one : many;
    }
  }
  function refreshStats() {
    return api("action=status").then(function (data) {
      setStat("yh_ar_stat_repos", data.repos || 0, "repo", "repos");
      setStat("yh_ar_stat_apps", data.apps || 0, "app", "apps");
      setStat("yh_ar_stat_errors", data.errors || 0, "error", "errors");
    });
  }

  function renderNews(items) {
    var wrap = document.getElementById("yh_ar_news_wrap");
    var track = document.getElementById("yh_ar_news");
    if (!wrap || !track) return;
    if (!items || !items.length) {
      wrap.hidden = true;
      track.innerHTML = "";
      return;
    }
    wrap.hidden = false;
    track.innerHTML = items.map(function (n) {
      var img = n.imageURL
        ? '<img class="yh-ar-news-img" src="' + esc(n.imageURL) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />'
        : '<div class="yh-ar-news-img yh-ar-news-img-empty" aria-hidden="true"></div>';
      var href = n.url || "#";
      var cap = n.caption || "";
      return '<a class="yh-ar-news-card" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
        img +
        '<div class="yh-ar-news-copy">' +
          '<div class="yh-ar-news-title">' + esc(n.title) + '</div>' +
          (cap ? '<div class="yh-ar-news-cap">' + esc(cap) + '</div>' : '') +
        '</div></a>';
    }).join("");
  }

  function renderCatCounts(counts) {
    counts = counts || {};
    var nodes = document.querySelectorAll("[data-cat-count]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-cat-count");
      var n = counts[key];
      nodes[i].textContent = n == null ? "" : "· " + fmtCount(n);
    }
  }

  function versionBadge(app) {
    var vc = Number(app.versionCount) || 0;
    if (vc > 1) return '<span class="yh-ar-badge">' + vc + " versions</span>";
    if (app.featured) return '<span class="yh-ar-badge">featured</span>';
    if (app.version) return '<span class="yh-ar-badge">v' + esc(app.version) + "</span>";
    return "";
  }

  function renderApps(apps, q) {
    var box = document.getElementById("yh_ar_apps_list");
    var hits = document.getElementById("yh_ar_stat_hits");
    var meta = document.getElementById("yh_ar_search_meta");
    if (hits) hits.textContent = apps.length;
    if (meta) {
      var label = activeCat !== "all" ? activeCat.toUpperCase() : "apps";
      meta.textContent = q
        ? apps.length + " hit" + (apps.length === 1 ? "" : "s") + ' for "' + q + '"'
        : (apps.length ? label + " · tap an app for details" : "no apps in this filter");
    }
    if (!box) return;
    if (!apps.length) {
      box.innerHTML = '<div class="yh-ar-empty">No apps matched.</div>';
      return;
    }
    box.innerHTML = apps.map(function (app) {
      var icon = app.iconURL
        ? '<img class="yh-ar-icon" src="' + esc(app.iconURL) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />'
        : '<div class="yh-ar-icon yh-ar-icon-empty" aria-hidden="true"></div>';
      var metaBits = [
        app.size ? bytes(app.size) : "",
        app.version ? esc(app.version) : "",
        app.developerName ? esc(app.developerName) : (app.repoName ? esc(app.repoName) : "")
      ].filter(Boolean).join(" <span class=\"yh-ar-sep\">|</span> ");
      var blurb = app.blurb || app.subtitle || "";
      var shots = (app.screenshotURLs || []).slice(0, 3);
      var shotsHtml = shots.length
        ? '<div class="yh-ar-app-shots">' + shots.map(function (u) {
            return '<img src="' + esc(u) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />';
          }).join("") + "</div>"
        : "";
      var dl = app.downloadURL
        ? '<a class="yh-ar-dl" href="' + esc(app.downloadURL) + '" target="_blank" rel="noopener noreferrer" aria-label="Download"><span></span></a>'
        : '<a class="yh-ar-chev" href="' + esc(appHref(app)) + '" aria-hidden="true">›</a>';
      return '<article class="yh-ar-app' + (app.featured ? " is-featured" : "") + '">' +
        '<div class="yh-ar-app-row">' +
          '<a class="yh-ar-app-main" href="' + esc(appHref(app)) + '">' +
            icon +
            '<div class="yh-ar-app-copy">' +
              '<div class="yh-ar-app-titleline">' +
                '<span class="yh-ar-app-title">' + esc(app.name) + "</span>" +
                versionBadge(app) +
              "</div>" +
              (metaBits ? '<div class="yh-ar-app-meta">' + metaBits + "</div>" : "") +
              (blurb ? '<div class="yh-ar-app-blurb">' + esc(blurb) + "</div>" : "") +
            "</div>" +
          "</a>" +
          dl +
        "</div>" +
        shotsHtml +
      "</article>";
    }).join("");
  }

  function searchApps() {
    var q = (document.getElementById("yh_ar_q") || {}).value || "";
    q = String(q).trim();
    var limit = q ? 120 : 48;
    return api(
      "action=apps&q=" + encodeURIComponent(q) +
      "&cat=" + encodeURIComponent(activeCat) +
      "&limit=" + limit
    ).then(function (data) {
      renderApps(data.apps || [], q);
    });
  }

  function loadNews() {
    return api("action=news&limit=16").then(function (data) {
      renderNews(data.news || []);
    }).catch(function () {
      renderNews([]);
    });
  }

  function loadCategories() {
    return api("action=categories").then(function (data) {
      renderCatCounts(data.counts || {});
    }).catch(function () {});
  }

  function renderRepos(repos) {
    var box = document.getElementById("yh_ar_repos_list");
    if (!box) return;
    if (!repos.length) {
      box.innerHTML = '<div class="yh-ar-empty">No repos yet. Add an IPA source JSON URL →</div>';
      return;
    }
    box.innerHTML = repos.map(function (repo) {
      var errPill = repo.lastError
        ? '<span class="yh-ar-pill yh-ar-pill-bad">error</span>'
        : '<span class="yh-ar-pill yh-ar-pill-good">ok</span>';
      var actions = CAN
        ? '<div class="yh-ar-actions">' +
            '<button type="button" class="yh-ar-btn" data-act="refresh">Refresh</button>' +
            '<button type="button" class="yh-ar-btn" data-act="remove">Remove</button>' +
          '</div>'
        : '';
      return '<article class="yh-ar-repo" data-id="' + esc(repo.id) + '">' +
        '<div class="yh-ar-repo-top">' +
          '<div class="yh-ar-repo-copy">' +
            '<div class="yh-ar-repo-title">' + esc(repo.name) + '</div>' +
            '<div class="yh-ar-repo-url">' + esc(repo.sourceURL) + '</div>' +
            '<div class="yh-ar-pills">' +
              '<span class="yh-ar-pill">' + (repo.appCount || 0) + ' apps</span>' +
              '<span class="yh-ar-pill">refreshed ' + ago(repo.refreshedAt) + '</span>' +
              errPill +
            '</div>' +
            (repo.lastError ? '<div class="yh-ar-err">' + esc(repo.lastError) + '</div>' : '') +
          '</div>' + actions +
        '</div>' +
      '</article>';
    }).join("");
  }

  function loadRepos() {
    return api("action=repos").then(function (data) {
      renderRepos(data.repos || []);
      return Promise.all([
        refreshStats(),
        loadNews(),
        loadCategories(),
        searchApps()
      ]);
    });
  }

  function indexSource(sourceURL) {
    var msg = document.getElementById("yh_ar_msg");
    if (!CAN) {
      if (msg) { msg.className = "yh-ar-msg yh-ar-msg-err"; msg.textContent = "Log in to index sources."; }
      return Promise.resolve();
    }
    if (msg) { msg.className = "yh-ar-msg"; msg.textContent = "Fetching source…"; }
    var body = new FormData();
    body.append("action", "add");
    body.append("sourceURL", sourceURL);
    body.append("my_post_key", KEY);
    return fetch(API, { method: "POST", body: body, credentials: "same-origin" })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || r.status); return d; }); })
      .then(function (data) {
        if (msg) {
          msg.className = "yh-ar-msg yh-ar-msg-ok";
          msg.textContent = "Indexed " + ((data.repo && data.repo.name) || "source") + " · " + ((data.repo && data.repo.appCount) || 0) + " apps";
        }
        var src = document.getElementById("yh_ar_source");
        if (src) src.value = "";
        return loadRepos();
      })
      .catch(function (err) {
        if (msg) { msg.className = "yh-ar-msg yh-ar-msg-err"; msg.textContent = String(err.message || err); }
      });
  }

  var searchBtn = document.getElementById("yh_ar_search");
  var clearBtn = document.getElementById("yh_ar_clear");
  var qInput = document.getElementById("yh_ar_q");
  var addBtn = document.getElementById("yh_ar_add");
  var sampleBtn = document.getElementById("yh_ar_sample");
  var reposList = document.getElementById("yh_ar_repos_list");
  var cats = document.getElementById("yh_ar_cats");
  var appsList = document.getElementById("yh_ar_apps_list");

  if (searchBtn) searchBtn.onclick = function () { searchApps().catch(console.error); };
  if (clearBtn) clearBtn.onclick = function () { if (qInput) qInput.value = ""; searchApps().catch(console.error); };
  if (qInput) qInput.addEventListener("keydown", function (e) { if (e.key === "Enter") searchApps().catch(console.error); });
  if (addBtn) addBtn.onclick = function () {
    var src = document.getElementById("yh_ar_source");
    indexSource(((src && src.value) || "").trim()).catch(console.error);
  };
  if (sampleBtn) sampleBtn.onclick = function () {
    var src = document.getElementById("yh_ar_source");
    if (src) src.value = SAMPLE;
    indexSource(SAMPLE).catch(console.error);
  };

  if (cats) {
    cats.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      var next = btn.getAttribute("data-cat") || "all";
      if (next === activeCat) return;
      activeCat = next;
      var buttons = cats.querySelectorAll(".yh-ar-cat");
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle("is-active", buttons[i] === btn);
      }
      searchApps().catch(console.error);
    });
  }

  if (reposList) {
    reposList.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn || !CAN) return;
      e.preventDefault();
      var card = btn.closest("[data-id]");
      var id = card && card.getAttribute("data-id");
      if (!id) return;
      btn.disabled = true;
      var act = btn.getAttribute("data-act");
      var body = new FormData();
      body.append("action", act === "refresh" ? "refresh" : "remove");
      body.append("id", id);
      body.append("my_post_key", KEY);
      fetch(API, { method: "POST", body: body, credentials: "same-origin" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || r.status); return d; }); })
        .then(function () { return loadRepos(); })
        .catch(function (err) { alert(String(err.message || err)); btn.disabled = false; });
    });
  }

  if (!CAN) {
    if (addBtn) addBtn.disabled = true;
    if (sampleBtn) sampleBtn.disabled = true;
  }

  loadRepos().catch(function (err) {
    if (reposList) reposList.innerHTML = '<span class="yh-ar-err">' + esc(err.message || err) + "</span>";
  });
  setInterval(function () { refreshStats().catch(function () {}); }, 15000);
})();
