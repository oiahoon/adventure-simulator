#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const BASE = path.join(ROOT, "public", "data", "cards-v2");

const result = { errors: [], warnings: [] };

function err(msg) {
  result.errors.push(msg);
}

function warn(msg) {
  result.warnings.push(msg);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err(`[parse] ${file}: ${e.message}`);
    return null;
  }
}

function toAbs(p) {
  const rel = String(p || "").replace(/^\/+/, "");
  return rel.startsWith("data/") ? path.join(ROOT, "public", rel) : path.join(ROOT, rel);
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function validate() {
  const idxFile = path.join(BASE, "index.json");
  if (!fs.existsSync(idxFile)) {
    err(`[index] missing: ${idxFile}`);
    return;
  }

  const index = readJson(idxFile);
  if (!isObj(index)) return;

  ["deckRules", "baseStats", "profiles"].forEach((k) => {
    if (typeof index[k] !== "string") err(`[index] ${k}: required string path`);
  });
  if (!Array.isArray(index.cards)) err("[index] cards: required string[]");
  if (!Array.isArray(index.arcs)) err("[index] arcs: required string[]");
  if (result.errors.length) return;

  const deckRules = readJson(toAbs(index.deckRules));
  const baseStats = readJson(toAbs(index.baseStats));
  const profiles = readJson(toAbs(index.profiles));
  if (!isObj(deckRules)) err("[deckRules] must be object");
  if (!isObj(baseStats)) err("[baseStats] must be object");
  if (!isObj(profiles)) err("[profiles] must be object");

  if (isObj(deckRules)) {
    ["baseHandSize", "maxHandSize", "drawPerTurn", "discardCooldownTurns"].forEach((k) => {
      if (!Number.isFinite(deckRules[k])) err(`[deckRules] ${k}: required number`);
    });
  }
  if (isObj(profiles)) {
    if (!Array.isArray(profiles.cities)) err("[profiles] cities: required array");
    if (!Array.isArray(profiles.careers)) err("[profiles] careers: required array");
  }

  const cards = [];
  index.cards.forEach((p) => {
    const abs = toAbs(p);
    const body = readJson(abs);
    if (!isObj(body) || !Array.isArray(body.cards)) {
      err(`[cards] ${abs}: requires { cards: [] }`);
      return;
    }
    cards.push(...body.cards);
  });

  const arcs = {};
  index.arcs.forEach((p) => {
    const abs = toAbs(p);
    const body = readJson(abs);
    if (!isObj(body) || !isObj(body.arcs)) {
      err(`[arcs] ${abs}: requires { arcs: {} }`);
      return;
    }
    Object.assign(arcs, body.arcs);
  });

  const cardIdSet = new Set();
  cards.forEach((card, i) => {
    const where = `[card#${i}]`;
    if (!isObj(card)) return err(`${where}: must be object`);
    if (typeof card.id !== "string" || !card.id) return err(`${where}.id: required string`);
    if (cardIdSet.has(card.id)) err(`${where}.id duplicate: ${card.id}`);
    cardIdSet.add(card.id);
    if (!Array.isArray(card.deckTags)) err(`${where}.deckTags: required array`);
    if (typeof card.canDiscard !== "boolean") err(`${where}.canDiscard: required boolean`);

    const event = card.event;
    if (!isObj(event)) return err(`${where}.event: required object`);
    if (typeof event.id !== "string") err(`${where}.event.id: required string`);
    if (event.id !== card.id) warn(`${where}: event.id != card.id (${event.id} != ${card.id})`);
    if (!Number.isFinite(event.baseWeight)) err(`${where}.event.baseWeight: required number`);
    if (!Array.isArray(event.tags)) err(`${where}.event.tags: required string[]`);

    const choices = Array.isArray(event.choices) ? event.choices : [];
    choices.forEach((choice, ci) => {
      if (!isObj(choice) || typeof choice.id !== "string") err(`${where}.event.choices[${ci}] invalid`);
      const outcomes = Array.isArray(choice && choice.outcomes) ? choice.outcomes : [];
      outcomes.forEach((outcome, oi) => {
        if (!isObj(outcome)) return err(`${where}.choice[${ci}].outcome[${oi}] invalid`);
        const enqueue = Array.isArray(outcome.enqueue) ? outcome.enqueue : [];
        enqueue.forEach((q, qi) => {
          if (!isObj(q) || typeof q.cardId !== "string") err(`${where}.enqueue[${qi}] invalid`);
          else if (!cardIdSet.has(q.cardId)) warn(`${where}.enqueue[${qi}] references unknown cardId: ${q.cardId}`);
        });
        const arcStep = isObj(outcome.arcStep) ? outcome.arcStep : null;
        if (arcStep) {
          Object.keys(arcStep).forEach((arcId) => {
            if (!Object.prototype.hasOwnProperty.call(arcs, arcId)) warn(`${where}.arcStep unknown arcId: ${arcId}`);
          });
        }
      });
    });
  });

  Object.keys(arcs).forEach((arcId) => {
    const arc = arcs[arcId];
    if (!isObj(arc)) return err(`[arc:${arcId}] must be object`);
    if (!isObj(arc.stages)) return err(`[arc:${arcId}].stages required object`);
    ["1", "2", "3"].forEach((sid) => {
      if (!arc.stages[sid]) warn(`[arc:${arcId}] missing stage ${sid}`);
    });
  });
}

validate();
console.log(`Summary: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
if (result.warnings.length) result.warnings.forEach((w) => console.log(`WARN ${w}`));
if (result.errors.length) {
  result.errors.forEach((e) => console.error(`ERROR ${e}`));
  process.exit(1);
}
