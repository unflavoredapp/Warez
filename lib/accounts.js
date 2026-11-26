"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Tiny file-backed accounts + signed session cookies.
 * First account created via /setup becomes admin.
 */
class Accounts {
  constructor(dataDir, secret) {
    this.file = path.join(dataDir, "accounts.json");
    this.settingsFile = path.join(dataDir, "settings.json");
    this.secret = String(secret || "").trim() || crypto.randomBytes(32).toString("hex");
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(this.file)) {
      this._writeAccounts({ users: [] });
    }
    if (!fs.existsSync(this.settingsFile)) {
      this._writeSettings({ plugins: {} });
    }
  }

  _readAccounts() {
    return JSON.parse(fs.readFileSync(this.file, "utf8"));
  }

  _writeAccounts(data) {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.file);
  }

  _readSettings() {
    return JSON.parse(fs.readFileSync(this.settingsFile, "utf8"));
  }

  _writeSettings(data) {
    const tmp = `${this.settingsFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.settingsFile);
  }

  needsSetup() {
    return this._readAccounts().users.length === 0;
  }

  listUsers() {
    return this._readAccounts().users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  getUser(id) {
    return this._readAccounts().users.find((u) => u.id === id) || null;
  }

  findByUsername(username) {
    const name = String(username || "").trim().toLowerCase();
    return this._readAccounts().users.find((u) => u.username.toLowerCase() === name) || null;
  }

  _hash(password, salt) {
    return crypto.scryptSync(String(password), salt, 64).toString("hex");
  }

  createAdmin({ username, password }) {
    if (!this.needsSetup()) throw new Error("setup already completed");
    const user = String(username || "").trim();
    const pass = String(password || "");
    if (user.length < 3) throw new Error("username must be at least 3 characters");
    if (pass.length < 8) throw new Error("password must be at least 8 characters");
    const salt = crypto.randomBytes(16).toString("hex");
    const data = this._readAccounts();
    const row = {
      id: crypto.randomBytes(8).toString("hex"),
      username: user,
      role: "admin",
      salt,
      hash: this._hash(pass, salt),
      createdAt: Date.now(),
    };
    data.users.push(row);
    this._writeAccounts(data);
    return { id: row.id, username: row.username, role: row.role, createdAt: row.createdAt };
  }

  verify(username, password) {
    const u = this.findByUsername(username);
    if (!u) return null;
    const hash = this._hash(password, u.salt);
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(u.hash, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
  }

  /** pluginEnabled(id) — default true if unset */
  pluginEnabled(id) {
    const s = this._readSettings();
    if (!s.plugins || typeof s.plugins !== "object") return true;
    if (!Object.prototype.hasOwnProperty.call(s.plugins, id)) return true;
    return Boolean(s.plugins[id]);
  }

  setPluginEnabled(id, enabled) {
    const s = this._readSettings();
    if (!s.plugins || typeof s.plugins !== "object") s.plugins = {};
    s.plugins[id] = Boolean(enabled);
    this._writeSettings(s);
    return s.plugins;
  }

  getSettings() {
    return this._readSettings();
  }

  // ---- sessions (HMAC cookie) ----
  issueSession(user) {
    const payload = Buffer.from(
      JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 14,
      }),
      "utf8"
    ).toString("base64url");
    const sig = crypto.createHmac("sha256", this.secret).update(payload).digest("base64url");
    return `${payload}.${sig}`;
  }

  readSession(token) {
    if (!token || typeof token !== "string" || !token.includes(".")) return null;
    const [payload, sig] = token.split(".");
    const expect = crypto.createHmac("sha256", this.secret).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (!data?.exp || data.exp < Date.now()) return null;
      const live = this.getUser(data.id);
      if (!live) return null;
      return { id: live.id, username: live.username, role: live.role, createdAt: live.createdAt };
    } catch {
      return null;
    }
  }
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers?.cookie || "";
  for (const part of String(raw).split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function sessionCookie(token, { clear = false } = {}) {
  if (clear) {
    return "sentry_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  }
  return `sentry_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}`;
}

module.exports = { Accounts, parseCookies, sessionCookie };
