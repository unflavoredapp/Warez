#!/usr/bin/env node
"use strict";

require("dotenv").config();

const express = require("express");
const css = require("./css");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const app = express();
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "warez.skin" });
});

app.get("/panel.css", (_req, res) => {
  res.type("text/css").send(css);
});

app.get("/", (_req, res) => {
  res.type("html").send(renderHome());
});

function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>warez.skin</title>
  <link rel="stylesheet" href="/panel.css" />
</head>
<body>
  <main class="shell">
    <h1 class="brand">warez.skin</h1>
    <p class="tagline">Node + css.js · Apache reverse proxy · Certbot SSL</p>
    <div class="badge">pm2 · express · let's encrypt</div>
  </main>
</body>
</html>`;
}

app.listen(PORT, HOST, () => {
  console.log(`warez.skin listening on http://${HOST}:${PORT}`);
});
