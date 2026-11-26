"use strict";

const templateConditionals = require("./template-conditionals");

const BUILTIN = [templateConditionals];

/**
 * Plugin registry. Each plugin exports `{ meta, ... }`.
 * Enabled state is stored in accounts settings (admin toggles).
 */
function listPlugins(accounts) {
  return BUILTIN.map((mod) => {
    const id = mod.meta.id;
    const enabled = accounts ? accounts.pluginEnabled(id) : true;
    return {
      id,
      name: mod.meta.name,
      version: mod.meta.version,
      description: mod.meta.description,
      author: mod.meta.author || "",
      enabled,
      module: `plugins/${id}.js`,
    };
  });
}

function getPlugin(id) {
  return BUILTIN.find((m) => m.meta.id === id) || null;
}

function render(template, ctx, accounts) {
  const mod = templateConditionals;
  if (accounts && !accounts.pluginEnabled(mod.meta.id)) {
    // Strip conditionals tags but keep true-branch content loosely:
    // when disabled, just return template with tags removed as empty eval → keep raw
    return String(template ?? "")
      .replace(/\{\{#if\s+[\w.]+\}\}/g, "")
      .replace(/\{\{else\}\}/g, "")
      .replace(/\{\{\/if\}\}/g, "")
      .replace(/\{\{#unless\s+[\w.]+\}\}/g, "")
      .replace(/\{\{\/unless\}\}/g, "");
  }
  return mod.apply(template, ctx);
}

module.exports = {
  listPlugins,
  getPlugin,
  render,
  templateConditionals,
};
