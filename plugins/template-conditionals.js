"use strict";

/**
 * Tiny Template Conditionals helper (Node port of the MyBB-style idea).
 *
 * Syntax inside template strings:
 *   {{#if key}} ... {{/if}}
 *   {{#if key}} ... {{else}} ... {{/if}}
 *   {{#unless key}} ... {{/unless}}
 *
 * `key` is looked up on the context object (truthy / falsy).
 * Nested conditionals are supported recursively.
 */
const META = {
  id: "template-conditionals",
  name: "Template Conditionals",
  version: "1.0.0",
  description:
    "Tiny custom helper for conditional blocks in templates ({{#if}} / {{#unless}}). Node replacement for the old MyBB Template Conditionals plugin.",
  author: "sentry.mba",
  settingsKey: "template-conditionals",
};

function lookup(ctx, key) {
  if (!key) return false;
  const path = String(key).trim().split(".");
  let cur = ctx;
  for (const part of path) {
    if (cur == null) return false;
    cur = cur[part];
  }
  return cur;
}

function apply(template, ctx = {}) {
  let out = String(template ?? "");

  // unless
  out = out.replace(
    /\{\{#unless\s+([\w.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_m, key, body) => (lookup(ctx, key) ? "" : body)
  );

  // if / else (non-greedy, repeated until stable for light nesting)
  for (let i = 0; i < 8; i += 1) {
    const next = out.replace(
      /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
      (_m, key, whenTrue, whenFalse = "") => (lookup(ctx, key) ? whenTrue : whenFalse)
    );
    if (next === out) break;
    out = next;
  }

  // simple {{key}} interpolation (after conditionals)
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => {
    const v = lookup(ctx, key);
    if (v == null || v === false) return "";
    return String(v);
  });

  return out;
}

/** Convenience helpers for building pages in JS */
function when(cond, html) {
  return cond ? String(html ?? "") : "";
}

function choose(cond, a, b = "") {
  return cond ? String(a ?? "") : String(b ?? "");
}

module.exports = {
  meta: META,
  apply,
  when,
  choose,
  lookup,
};
