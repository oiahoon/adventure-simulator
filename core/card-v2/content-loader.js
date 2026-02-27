"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DEFAULT_CONTENT } = require("./default-content");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function resolvePublicPath(cwd, p) {
  if (!p || typeof p !== "string") return "";
  const rel = p.replace(/^\/+/, "");
  if (rel.startsWith("data/")) {
    return path.join(cwd, "public", rel);
  }
  return path.join(cwd, rel);
}

function uniqueById(list) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (!item || typeof item.id !== "string") continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function loadCardV2Content(opts) {
  const cfg = opts || {};
  const cwd = cfg.cwd || process.cwd();
  const indexPath = cfg.indexPath || path.join(cwd, "public", "data", "cards-v2", "index.json");

  try {
    if (!fs.existsSync(indexPath)) {
      return {
        content: DEFAULT_CONTENT,
        source: "fallback-default",
        warnings: [`cards-v2 index not found: ${indexPath}`]
      };
    }

    const index = readJson(indexPath);
    const deckRules = readJson(resolvePublicPath(cwd, index.deckRules));
    const baseStats = readJson(resolvePublicPath(cwd, index.baseStats));
    const profiles = readJson(resolvePublicPath(cwd, index.profiles));

    const cards = [];
    const cardFiles = Array.isArray(index.cards) ? index.cards : [];
    for (let i = 0; i < cardFiles.length; i += 1) {
      const file = resolvePublicPath(cwd, cardFiles[i]);
      const body = readJson(file);
      const list = Array.isArray(body.cards) ? body.cards : [];
      cards.push(...list);
    }

    const arcFiles = Array.isArray(index.arcs) ? index.arcs : [];
    const arcs = {};
    for (let i = 0; i < arcFiles.length; i += 1) {
      const file = resolvePublicPath(cwd, arcFiles[i]);
      const body = readJson(file);
      const block = body.arcs && typeof body.arcs === "object" ? body.arcs : {};
      Object.assign(arcs, block);
    }

    return {
      source: indexPath,
      warnings: [],
      content: {
        DECK_RULES: deckRules,
        BASE_STATS: baseStats,
        CITIES: Array.isArray(profiles.cities) ? profiles.cities : DEFAULT_CONTENT.CITIES,
        CAREERS: Array.isArray(profiles.careers) ? profiles.careers : DEFAULT_CONTENT.CAREERS,
        CARDS: uniqueById(cards),
        ARCS: arcs
      }
    };
  } catch (err) {
    return {
      content: DEFAULT_CONTENT,
      source: "fallback-default",
      warnings: [`cards-v2 load failed: ${err.message}`]
    };
  }
}

module.exports = {
  loadCardV2Content
};
