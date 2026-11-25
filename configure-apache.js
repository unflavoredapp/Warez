#!/usr/bin/env node
"use strict";

const fs = require("fs");

const snippet = `
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
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    ProxyTimeout 60
`;

const candidates = [
  "/etc/apache2/sites-available/warez.skin-le-ssl.conf",
  "/etc/apache2/sites-available/warez.skin.conf",
];

let updated = false;
for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");

  // Drop DocumentRoot-style static hosting if present; proxy handles / instead.
  text = text.replace(/^\s*DocumentRoot\s+.+$/gm, "");
  text = text.replace(/<Directory[\s\S]*?<\/Directory>\s*/g, "");

  if (!text.includes("ProxyPass / http://127.0.0.1:3000/")) {
    if (!text.includes("</VirtualHost>")) {
      console.error(`No </VirtualHost> in ${file}`);
      continue;
    }
    text = text.replace("</VirtualHost>", `${snippet}\n</VirtualHost>`);
  }

  fs.writeFileSync(file, text);
  console.log(`Updated ${file}`);
  updated = true;
}

if (!updated) {
  const conf = "/etc/apache2/sites-available/warez.skin.conf";
  fs.writeFileSync(
    conf,
    `<VirtualHost *:80>
    ServerName warez.skin
    ServerAlias www.warez.skin
${snippet}
</VirtualHost>
`
  );
  console.log(`Wrote ${conf}`);
}
