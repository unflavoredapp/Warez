(function () {
  var root = document.getElementById("yh-apprepos");
  if (!root) return;

  var API = root.getAttribute("data-api") || "apprepos.php";
  var CAN = root.getAttribute("data-can-manage") === "1";
  var KEY = root.getAttribute("data-key") || "";
  var SAMPLE = root.getAttribute("data-sample") || "";

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
    // Use "app" not "id" — MyBB casts input[id] to integer
    return "portal.php?action=app&repo=" + encodeURIComponent(app.repoId) + "&app=" + encodeURIComponent(app.id);
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

  function refreshStats() {
    return api("action=status").then(function (data) {
      var el;
      if ((el = document.getElementById("yh_ar_repos"))) el.textContent = data.repos || 0;
      if ((el = document.getElementById("yh_ar_apps"))) el.textContent = data.apps || 0;
      if ((el = document.getElementById("yh_ar_errors"))) el.textContent = data.errors || 0;
    });
  }

  function renderApps(apps, q) {
    var box = document.getElementById("yh_ar_apps");
    var hits = document.getElementById("yh_ar_hits");
    var meta = document.getElementById("yh_ar_search_meta");
    if (hits) hits.textContent = apps.length;
    if (meta) {
      meta.textContent = q
        ? apps.length + " hit" + (apps.length === 1 ? "" : "s") + ' for "' + q + '"'
        : (apps.length ? "tap an app for details" : "no apps indexed yet — add a source");
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
      return '<a class="yh-ar-app" href="' + esc(appHref(app)) + '">' +
        '<div class="yh-ar-app-main">' + icon +
          '<div class="yh-ar-app-copy">' +
            '<div class="yh-ar-app-title">' + esc(app.name) + '</div>' +
            '<div class="yh-ar-app-sub">' + esc(app.bundleIdentifier || "—") + '</div>' +
            '<div class="yh-ar-pills">' +
              '<span class="yh-ar-pill">' + esc(app.repoName || "repo") + '</span>' +
              (app.version ? '<span class="yh-ar-pill">v' + esc(app.version) + '</span>' : '') +
              (app.size ? '<span class="yh-ar-pill">' + bytes(app.size) + '</span>' : '') +
              (app.developerName ? '<span class="yh-ar-pill">' + esc(app.developerName) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div><div class="yh-ar-chev">›</div></a>';
    }).join("");
  }

  function searchApps() {
    var q = (document.getElementById("yh_ar_q") || {}).value || "";
    q = String(q).trim();
    return api("action=apps&q=" + encodeURIComponent(q)).then(function (data) {
      renderApps(data.apps || [], q);
    });
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
      var apps = (repo.apps || []).slice(0, 8).map(function (app) {
        var icon = app.iconURL
          ? '<img class="yh-ar-icon yh-ar-icon-sm" src="' + esc(app.iconURL) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />'
          : '<div class="yh-ar-icon yh-ar-icon-sm yh-ar-icon-empty" aria-hidden="true"></div>';
        var href = "portal.php?action=app&repo=" + encodeURIComponent(repo.id) + "&app=" + encodeURIComponent(app.id);
        return '<a class="yh-ar-mini" href="' + esc(href) + '">' + icon +
          '<div><div class="yh-ar-mini-name">' + esc(app.name) + '</div>' +
          '<div class="yh-ar-mini-sub">' + esc(app.bundleIdentifier || "") +
          (app.version ? " · v" + esc(app.version) : "") + "</div></div></a>";
      }).join("");
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
        (apps ? '<details class="yh-ar-preview"><summary>Preview apps</summary><div class="yh-ar-minis">' + apps + '</div></details>' : '') +
      '</article>';
    }).join("");
  }

  function loadRepos() {
    return api("action=repos&apps=1").then(function (data) {
      renderRepos(data.repos || []);
      return refreshStats().then(searchApps);
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
