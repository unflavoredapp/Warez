#!/usr/bin/env node
"use strict";

/**
 * Point Apache vhosts at the Node IPA discovery app on :3000.
 * Retires MyBB DocumentRoot for public traffic (files kept on disk).
 */
const fs = require("fs");

const PROXY_SNIPPET = `
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass /health http://127.0.0.1:3000/health
    ProxyPassReverse /health http://127.0.0.1:3000/health
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/
    ProxyPass /panel.css http://127.0.0.1:3000/panel.css
    ProxyPassReverse /panel.css http://127.0.0.1:3000/panel.css
    ProxyPass /sample-source.json http://127.0.0.1:3000/sample-source.json
    ProxyPassReverse /sample-source.json http://127.0.0.1:3000/sample-source.json
    ProxyPass /sentry-banner.png http://127.0.0.1:3000/sentry-banner.png
    ProxyPassReverse /sentry-banner.png http://127.0.0.1:3000/sentry-banner.png
    ProxyPass /gold.gif http://127.0.0.1:3000/gold.gif
    ProxyPassReverse /gold.gif http://127.0.0.1:3000/gold.gif
    ProxyPass /bg.gif http://127.0.0.1:3000/bg.gif
    ProxyPassReverse /bg.gif http://127.0.0.1:3000/bg.gif
    ProxyPass /check.png http://127.0.0.1:3000/check.png
    ProxyPassReverse /check.png http://127.0.0.1:3000/check.png
    ProxyPass /app/ http://127.0.0.1:3000/app/
    ProxyPassReverse /app/ http://127.0.0.1:3000/app/
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    ProxyTimeout 60
`;

const candidates = [
  "/etc/apache2/sites-available/warez.skin-le-ssl.conf",
  "/etc/apache2/sites-available/warez.skin.conf",
  "/etc/apache2/sites-available/sentry.mba-le-ssl.conf",
  "/etc/apache2/sites-available/sentry.mba.conf",
];

function stripMybbDocroot(text) {
  let out = text;
  out = out.replace(/^\s*DocumentRoot\s+.+$/gm, "");
  out = out.replace(/<Directory[\s\S]*?<\/Directory>\s*/g, "");
  return out;
}

function ensureProxy(text) {
  let out = stripMybbDocroot(text);
  if (out.includes("ProxyPass / http://127.0.0.1:3000/")) {
    // Refresh snippet if missing routes from older configs.
    if (!out.includes("ProxyPass /sentry-banner.png http://127.0.0.1:3000/sentry-banner.png")) {
      out = out.replace(
        /ProxyPass \/ http:\/\/127\.0\.0\.1:3000\/\s*\n\s*ProxyPassReverse \/ http:\/\/127\.0\.0\.1:3000\//,
        `ProxyPass /sentry-banner.png http://127.0.0.1:3000/sentry-banner.png\n    ProxyPassReverse /sentry-banner.png http://127.0.0.1:3000/sentry-banner.png\n    ProxyPass / http://127.0.0.1:3000/\n    ProxyPassReverse / http://127.0.0.1:3000/`
      );
    }
    if (!out.includes("ProxyPass /app/ http://127.0.0.1:3000/app/")) {
      out = out.replace(
        /ProxyPass \/ http:\/\/127\.0\.0\.1:3000\/\s*\n\s*ProxyPassReverse \/ http:\/\/127\.0\.0\.1:3000\//,
        `ProxyPass /app/ http://127.0.0.1:3000/app/\n    ProxyPassReverse /app/ http://127.0.0.1:3000/app/\n    ProxyPass / http://127.0.0.1:3000/\n    ProxyPassReverse / http://127.0.0.1:3000/`
      );
    }
    return out;
  }
  if (!out.includes("</VirtualHost>")) {
    throw new Error("No </VirtualHost> block");
  }
  return out.replace("</VirtualHost>", `${PROXY_SNIPPET}\n</VirtualHost>`);
}

let updated = false;
for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  try {
    const next = ensureProxy(fs.readFileSync(file, "utf8"));
    fs.writeFileSync(file, next);
    console.log(`Updated ${file}`);
    updated = true;
  } catch (err) {
    console.error(`${file}: ${err.message}`);
  }
}

// Ensure HTTP vhost for warez.skin exists (Certbot / redirects).
const warezHttp = "/etc/apache2/sites-available/warez.skin.conf";
if (!fs.existsSync(warezHttp)) {
  fs.writeFileSync(
    warezHttp,
    `<VirtualHost *:80>
    ServerName warez.skin
    ServerAlias www.warez.skin
${PROXY_SNIPPET}
</VirtualHost>
`
  );
  console.log(`Wrote ${warezHttp}`);
  updated = true;
}

// Optional sentry.mba HTTP stub — enable once DNS A points at this VPS.
const sentryHttp = "/etc/apache2/sites-available/sentry.mba.conf";
if (!fs.existsSync(sentryHttp)) {
  fs.writeFileSync(
    sentryHttp,
    `<VirtualHost *:80>
    ServerName sentry.mba
    ServerAlias www.sentry.mba
${PROXY_SNIPPET}
</VirtualHost>
`
  );
  console.log(`Wrote ${sentryHttp}`);
  updated = true;
}

if (!updated) {
  console.error("No Apache site configs updated");
  process.exit(1);
}
