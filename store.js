"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dns = require("dns").promises;
const net = require("net");
const { URL } = require("url");

function now() {
  return Date.now();
}

function idFrom(input) {
  return crypto.createHash("sha1").update(String(input)).digest("hex").slice(0, 12);
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (net.isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1") return true;
    if (v.startsWith("fc") || v.startsWith("fd")) return true;
    if (v.startsWith("fe80")) return true;
    return false;
  }
  return true;
}

async function assertPublicHttpUrl(raw) {
  let u;
  try {
    u = new URL(String(raw).trim());
  } catch {
    throw new Error("invalid URL");
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("only http/https URLs allowed");
  }
  if (u.username || u.password) {
    throw new Error("URLs with credentials are not allowed");
  }
  const hostname = u.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("localhost blocked");
  }
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("private IP blocked");
  } else {
    const looked = await dns.lookup(hostname, { all: true });
    if (!looked.length) throw new Error("DNS lookup failed");
    for (const row of looked) {
      if (isPrivateIp(row.address)) throw new Error("private IP blocked");
    }
  }
  return u.toString();
}

function normalizeSource(json, sourceUrl) {
  const appsIn = Array.isArray(json?.apps) ? json.apps : [];
  const apps = appsIn.map((app) => {
    const versions = Array.isArray(app.versions) ? app.versions : [];
    const latest = versions[0] || null;
    return {
      name: String(app.name || app.bundleIdentifier || "Untitled"),
      bundleIdentifier: String(app.bundleIdentifier || ""),
      developerName: String(app.developerName || app.developer || ""),
      subtitle: String(app.subtitle || ""),
      localizedDescription: String(app.localizedDescription || app.description || "").slice(0, 2000),
      iconURL: String(app.iconURL || ""),
      version: String(latest?.version || app.version || ""),
      versionDate: String(latest?.date || app.versionDate || ""),
      size: Number(latest?.size || app.size || 0) || 0,
      downloadURL: String(latest?.downloadURL || app.downloadURL || ""),
    };
  });

  return {
    name: String(json?.name || "Untitled source"),
    identifier: String(json?.identifier || idFrom(sourceUrl)),
    sourceURL: sourceUrl,
    website: String(json?.website || ""),
    subtitle: String(json?.subtitle || ""),
    description: String(json?.description || "").slice(0, 4000),
    iconURL: String(json?.iconURL || ""),
    appCount: apps.length,
    apps,
  };
}

class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, "repos.json");
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(this.file)) {
      this._write({ repos: [] });
    }
  }

  _read() {
    return JSON.parse(fs.readFileSync(this.file, "utf8"));
  }

  _write(data) {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.file);
  }

  listRepos({ withApps = false } = {}) {
    return this._read().repos.map((r) => this._publicRepo(r, withApps));
  }

  getRepo(id) {
    const repo = this._read().repos.find((r) => r.id === id);
    return repo ? this._publicRepo(repo, true) : null;
  }

  _publicRepo(repo, withApps = false) {
    const out = {
      id: repo.id,
      name: repo.name,
      identifier: repo.identifier,
      sourceURL: repo.sourceURL,
      website: repo.website,
      subtitle: repo.subtitle,
      description: repo.description,
      iconURL: repo.iconURL,
      appCount: repo.appCount || (repo.apps || []).length,
      addedAt: repo.addedAt,
      refreshedAt: repo.refreshedAt,
      lastError: repo.lastError || null,
    };
    if (withApps) out.apps = repo.apps || [];
    return out;
  }

  async fetchSource(sourceUrl) {
    const safeUrl = await assertPublicHttpUrl(sourceUrl);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12000);
    try {
      const res = await fetch(safeUrl, {
        signal: ac.signal,
        redirect: "follow",
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": "warez.skin-repo-discovery/1.0",
        },
      });
      if (!res.ok) throw new Error(`fetch failed (${res.status})`);
      const len = Number(res.headers.get("content-length") || 0);
      if (len > 8 * 1024 * 1024) throw new Error("source too large");
      const text = await res.text();
      if (text.length > 8 * 1024 * 1024) throw new Error("source too large");
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("source is not valid JSON");
      }
      return normalizeSource(json, safeUrl);
    } finally {
      clearTimeout(timer);
    }
  }

  async addRepo(sourceUrl) {
    const normalized = await this.fetchSource(sourceUrl);
    const data = this._read();
    const existing = data.repos.find(
      (r) => r.sourceURL === normalized.sourceURL || r.identifier === normalized.identifier
    );
    if (existing) {
      Object.assign(existing, normalized, {
        refreshedAt: now(),
        lastError: null,
      });
      this._write(data);
      return this._publicRepo(existing, true);
    }
    const repo = {
      id: idFrom(normalized.sourceURL),
      ...normalized,
      addedAt: now(),
      refreshedAt: now(),
      lastError: null,
    };
    data.repos.unshift(repo);
    this._write(data);
    return this._publicRepo(repo, true);
  }

  async refreshRepo(id) {
    const data = this._read();
    const repo = data.repos.find((r) => r.id === id);
    if (!repo) return null;
    try {
      const normalized = await this.fetchSource(repo.sourceURL);
      Object.assign(repo, normalized, {
        refreshedAt: now(),
        lastError: null,
      });
      this._write(data);
      return this._publicRepo(repo, true);
    } catch (err) {
      repo.lastError = String(err.message || err);
      repo.refreshedAt = now();
      this._write(data);
      throw err;
    }
  }

  removeRepo(id) {
    const data = this._read();
    const before = data.repos.length;
    data.repos = data.repos.filter((r) => r.id !== id);
    this._write(data);
    return before !== data.repos.length;
  }

  searchApps(query = "") {
    const q = String(query || "").trim().toLowerCase();
    const repos = this._read().repos;
    const hits = [];
    for (const repo of repos) {
      for (const app of repo.apps || []) {
        const hay = [
          app.name,
          app.bundleIdentifier,
          app.developerName,
          app.subtitle,
          repo.name,
        ]
          .join(" ")
          .toLowerCase();
        if (q && !hay.includes(q)) continue;
        hits.push({
          ...app,
          repoId: repo.id,
          repoName: repo.name,
          sourceURL: repo.sourceURL,
        });
      }
    }
    hits.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return hits;
  }

  stats() {
    const repos = this._read().repos;
    const apps = repos.reduce((n, r) => n + (r.apps || []).length, 0);
    return {
      repos: repos.length,
      apps,
      refreshed: repos.filter((r) => r.refreshedAt).length,
      errors: repos.filter((r) => r.lastError).length,
    };
  }
}

module.exports = { Store };
