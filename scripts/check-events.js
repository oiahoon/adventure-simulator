#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const EVENT_DIR = path.join(ROOT, "public", "data", "events");
const FILES = {
  eventMeta: path.join(EVENT_DIR, "event-meta.json"),
  arcConfig: path.join(EVENT_DIR, "arc-config.json"),
  arcEvents: path.join(EVENT_DIR, "arc-events.json"),
  eventDeck: path.join(EVENT_DIR, "event-deck.json"),
  hotpackIndex: path.join(EVENT_DIR, "hotpacks", "index.json")
};

const VALID_DYNAMIC_MODES = new Set(["addRand", "subRand", "subRate", "addRate", "healRand"]);
const KNOWN_QUEUE_EVENTS = new Set([
  "queue:jobhunt-feedback",
  "queue:exam-result",
  "queue:mortgage-followup",
  "queue:parenting-support",
  "queue:legal-review",
  "queue:abroad-feedback"
]);

const result = { errors: [], warnings: [] };

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    result.errors.push(`[parse] ${file}: ${err.message}`);
    return null;
  }
}

function isObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function error(msg) {
  result.errors.push(msg);
}

function warn(msg) {
  result.warnings.push(msg);
}

function resolvePublicDataPath(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return "";
  const rel = publicPath.replace(/^\/+/, "");
  if (rel.startsWith("data/")) {
    return path.join(ROOT, "public", rel);
  }
  return path.join(ROOT, rel);
}

function validateDynamicValue(spec, where) {
  if (spec == null) return;
  if (isNumber(spec)) return;
  if (!isObject(spec)) {
    error(`${where}: dynamic value must be number or object`);
    return;
  }
  if (!VALID_DYNAMIC_MODES.has(spec.mode)) {
    error(`${where}: invalid mode "${spec.mode}"`);
  }
}

function validateCondition(cond, where) {
  if (cond == null) return;
  if (!isObject(cond)) {
    error(`${where}: condition must be an object`);
    return;
  }
  if (Array.isArray(cond.all)) cond.all.forEach((c, i) => validateCondition(c, `${where}.all[${i}]`));
  if (Array.isArray(cond.any)) cond.any.forEach((c, i) => validateCondition(c, `${where}.any[${i}]`));
  if (cond.not) validateCondition(cond.not, `${where}.not`);

  const numberKeys = [
    "dayMin",
    "dayMax",
    "chapterMin",
    "goldGte",
    "goldLte",
    "debtGte",
    "moraleLte",
    "fatigueGte",
    "childCountGte",
    "childCountEq",
    "randomLt"
  ];
  numberKeys.forEach((k) => {
    if (k in cond && !isNumber(cond[k])) error(`${where}.${k}: must be number`);
  });

  const arrayStringKeys = ["professionIn", "locationIn", "locationTypeIn", "familyStageIn", "familyStageNotIn"];
  arrayStringKeys.forEach((k) => {
    if (!(k in cond)) return;
    if (!Array.isArray(cond[k]) || cond[k].some((x) => typeof x !== "string")) {
      error(`${where}.${k}: must be string[]`);
    }
  });

  ["engineFlagTrue", "engineFlagFalse", "milestoneIncludes", "milestoneNotIncludes"].forEach((k) => {
    if (k in cond && typeof cond[k] !== "string") error(`${where}.${k}: must be string`);
  });

  if (cond.seenEventGte != null) {
    if (!isObject(cond.seenEventGte) || typeof cond.seenEventGte.id !== "string" || !isNumber(cond.seenEventGte.value)) {
      error(`${where}.seenEventGte: must be { id: string, value: number }`);
    }
  }

  if (cond.statSumGte != null) {
    if (!isObject(cond.statSumGte)) {
      error(`${where}.statSumGte: must be object`);
    } else {
      if (!Array.isArray(cond.statSumGte.keys) || cond.statSumGte.keys.some((x) => typeof x !== "string")) {
        error(`${where}.statSumGte.keys: must be string[]`);
      }
      if (!isNumber(cond.statSumGte.value)) error(`${where}.statSumGte.value: must be number`);
    }
  }
}

function validateOutcome(outcome, where) {
  if (!isObject(outcome)) {
    error(`${where}: outcome must be an object`);
    return;
  }

  if (outcome.city != null) {
    if (!isObject(outcome.city)) error(`${where}.city: must be object`);
    else ["morale", "fatigue", "debt", "heat"].forEach((k) => {
      if (k in outcome.city && !isNumber(outcome.city[k])) error(`${where}.city.${k}: must be number`);
    });
  }

  if (outcome.player != null) {
    if (!isObject(outcome.player)) error(`${where}.player: must be object`);
    else {
      if ("exp" in outcome.player && !isNumber(outcome.player.exp)) error(`${where}.player.exp: must be number`);
      if ("gold" in outcome.player) validateDynamicValue(outcome.player.gold, `${where}.player.gold`);
      if ("hp" in outcome.player) validateDynamicValue(outcome.player.hp, `${where}.player.hp`);
      if (outcome.player.stats != null && !isObject(outcome.player.stats)) error(`${where}.player.stats: must be object`);
    }
  }

  if (outcome.story != null) {
    if (!isObject(outcome.story)) error(`${where}.story: must be object`);
    else {
      if ("familyStage" in outcome.story && typeof outcome.story.familyStage !== "string") error(`${where}.story.familyStage: must be string`);
      if ("childCountAdd" in outcome.story && !isNumber(outcome.story.childCountAdd)) error(`${where}.story.childCountAdd: must be number`);
    }
  }

  if (outcome.force != null) {
    if (!isObject(outcome.force)) error(`${where}.force: must be object`);
    else {
      if ("goldSet" in outcome.force && !isNumber(outcome.force.goldSet)) error(`${where}.force.goldSet: must be number`);
      if ("hpSet" in outcome.force && !isNumber(outcome.force.hpSet)) error(`${where}.force.hpSet: must be number`);
    }
  }

  if (outcome.setFlags != null) {
    if (!Array.isArray(outcome.setFlags)) error(`${where}.setFlags: must be array`);
    else {
      outcome.setFlags.forEach((f, i) => {
        if (!isObject(f) || typeof f.key !== "string") error(`${where}.setFlags[${i}]: invalid flag`);
      });
    }
  }
  if (outcome.clearFlags != null && (!Array.isArray(outcome.clearFlags) || outcome.clearFlags.some((x) => typeof x !== "string"))) {
    error(`${where}.clearFlags: must be string[]`);
  }
  if (outcome.bias != null) {
    if (!Array.isArray(outcome.bias)) error(`${where}.bias: must be array`);
    else {
      outcome.bias.forEach((b, i) => {
        if (!isObject(b) || typeof b.key !== "string" || !isNumber(b.mul) || !isNumber(b.ttl)) {
          error(`${where}.bias[${i}]: invalid bias item`);
        }
      });
    }
  }
  if (outcome.enqueue != null) {
    if (!Array.isArray(outcome.enqueue)) error(`${where}.enqueue: must be array`);
    else {
      outcome.enqueue.forEach((q, i) => {
        if (!isObject(q) || typeof q.eventId !== "string") {
          error(`${where}.enqueue[${i}]: invalid queue item`);
          return;
        }
        if (!KNOWN_QUEUE_EVENTS.has(q.eventId)) {
          warn(`${where}.enqueue[${i}]: unknown queue event "${q.eventId}"`);
        }
      });
    }
  }

  if ("endRun" in outcome && outcome.endRun !== "lose" && outcome.endRun !== "win") {
    error(`${where}.endRun: must be "lose" or "win"`);
  }
}

function validateEventDeck(deck) {
  if (!isObject(deck)) {
    error(`[event-deck] root must be object`);
    return;
  }
  if (!isNumber(deck.rollChance) || deck.rollChance < 0 || deck.rollChance > 1) {
    error(`[event-deck] rollChance must be number in [0,1]`);
  }
  if (!Array.isArray(deck.events)) {
    error(`[event-deck] events must be array`);
    return;
  }

  const idSet = new Set();
  deck.events.forEach((evt, i) => {
    const where = `[event-deck].events[${i}]`;
    validateDeckEvent(evt, where, idSet);
  });

  return idSet;
}

function validateDeckEvent(evt, where, idSet) {
    if (!isObject(evt)) return error(`${where}: must be object`);
    if (typeof evt.id !== "string" || !evt.id) error(`${where}.id: required string`);
    else if (idSet) {
      if (idSet.has(evt.id)) error(`${where}.id: duplicate "${evt.id}"`);
      idSet.add(evt.id);
    }
    if (typeof evt.title !== "string" || !evt.title.trim()) error(`${where}.title: required string`);
    else {
      const len = evt.title.trim().length;
      if (len < 4 || len > 22) warn(`${where}.title: length ${len}, recommended 4..22`);
    }
    if (typeof evt.text !== "string" || !evt.text.trim()) error(`${where}.text: required string`);
    else if (evt.text.trim().length > 120) warn(`${where}.text: length > 120, may hurt readability`);
    if (evt.deck != null && typeof evt.deck !== "string") error(`${where}.deck: must be string`);
    if (evt.tags != null && (!Array.isArray(evt.tags) || evt.tags.some((x) => typeof x !== "string"))) {
      error(`${where}.tags: must be string[]`);
    }
    if ("rare" in evt && typeof evt.rare !== "boolean") error(`${where}.rare: must be boolean`);
    if ("oncePerRun" in evt && typeof evt.oncePerRun !== "boolean") error(`${where}.oncePerRun: must be boolean`);
    if ("baseWeight" in evt && !isNumber(evt.baseWeight)) error(`${where}.baseWeight: must be number`);
    if ("cooldown" in evt && !isNumber(evt.cooldown)) error(`${where}.cooldown: must be number`);
    validateCondition(evt.when, `${where}.when`);

    ["requireFlags", "blockFlags", "prereqEventsAny", "prereqEventsAll"].forEach((k) => {
      if (evt[k] != null && (!Array.isArray(evt[k]) || evt[k].some((x) => typeof x !== "string"))) {
        error(`${where}.${k}: must be string[]`);
      }
    });

    const hasOutcomes = Array.isArray(evt.outcomes) && evt.outcomes.length > 0;
    const hasBranches = Array.isArray(evt.branches) && evt.branches.length > 0;
    if (!hasOutcomes && !hasBranches) error(`${where}: requires outcomes[] or branches[]`);
    if (hasOutcomes) evt.outcomes.forEach((o, j) => validateOutcome(o, `${where}.outcomes[${j}]`));
    if (hasBranches) {
      evt.branches.forEach((b, j) => {
        const bwhere = `${where}.branches[${j}]`;
        if (!isObject(b)) return error(`${bwhere}: must be object`);
        validateCondition(b.when, `${bwhere}.when`);
        if (!Array.isArray(b.outcomes) || !b.outcomes.length) error(`${bwhere}.outcomes: non-empty array required`);
        else b.outcomes.forEach((o, k) => validateOutcome(o, `${bwhere}.outcomes[${k}]`));
      });
    }
}

function validateHotpacks(deckIds) {
  if (!fs.existsSync(FILES.hotpackIndex)) {
    warn(`[hotpacks] index not found: ${FILES.hotpackIndex}`);
    return;
  }
  const index = readJson(FILES.hotpackIndex);
  if (!index || !Array.isArray(index.packs)) {
    error(`[hotpacks] index.packs must be array`);
    return;
  }
  for (let i = 0; i < index.packs.length; i += 1) {
    const item = index.packs[i];
    const where = `[hotpacks].index.packs[${i}]`;
    if (!isObject(item)) {
      error(`${where}: must be object`);
      continue;
    }
    if (typeof item.id !== "string" || !item.id) error(`${where}.id: required string`);
    if (typeof item.file !== "string" || !item.file) {
      error(`${where}.file: required string`);
      continue;
    }
    const from = item.activeFrom || "";
    const to = item.activeTo || "";
    if (from && Number.isNaN(new Date(`${from}T00:00:00`).getTime())) error(`${where}.activeFrom invalid date`);
    if (to && Number.isNaN(new Date(`${to}T00:00:00`).getTime())) error(`${where}.activeTo invalid date`);
    if (from && to && new Date(`${from}T00:00:00`) > new Date(`${to}T00:00:00`)) error(`${where}: activeFrom > activeTo`);

    const abs = resolvePublicDataPath(item.file);
    if (!fs.existsSync(abs)) {
      error(`${where}: file not found ${item.file}`);
      continue;
    }
    const pack = readJson(abs);
    if (!pack || !isObject(pack)) continue;
    if (typeof pack.id !== "string" || !pack.id) error(`${where}: pack.id required`);
    if (pack.id && item.id && pack.id !== item.id) warn(`${where}: index id "${item.id}" != pack.id "${pack.id}"`);
    if (!Array.isArray(pack.events)) {
      error(`${where}: pack.events must be array`);
      continue;
    }
    const localIds = new Set();
    for (let j = 0; j < pack.events.length; j += 1) {
      const evt = pack.events[j];
      const ewhere = `${where}.events[${j}]`;
      validateDeckEvent(evt, ewhere, localIds);
      if (evt && evt.id && !deckIds.has(evt.id)) {
        // Hot packs are allowed to introduce new ids.
      }
    }
  }
}

function validateArcConfig(arcConfig, arcEvents) {
  if (!isObject(arcConfig)) {
    error(`[arc-config] root must be object`);
    return;
  }
  if (!Array.isArray(arcConfig.order) || arcConfig.order.some((x) => typeof x !== "string")) {
    error(`[arc-config] order must be string[]`);
  } else {
    arcConfig.order.forEach((id, idx) => {
      if (!isObject(arcEvents[id])) error(`[arc-config] order[${idx}]="${id}" missing in arc-events`);
    });
  }
}

function validateArcEvents(arcEvents) {
  if (!isObject(arcEvents)) {
    error(`[arc-events] root must be object`);
    return new Set();
  }
  const arcIds = Object.keys(arcEvents);
  arcIds.forEach((arcId) => {
    const stages = arcEvents[arcId];
    const where = `[arc-events].${arcId}`;
    if (!isObject(stages)) return error(`${where}: must be object`);
    const stageKeys = Object.keys(stages);
    if (!stageKeys.length) error(`${where}: must contain stages`);
    stageKeys.forEach((sKey) => {
      const stage = stages[sKey];
      const swhere = `${where}.${sKey}`;
      if (!/^\d+$/.test(sKey)) error(`${swhere}: stage key must be numeric string`);
      if (!isObject(stage)) return error(`${swhere}: must be object`);
      validateCondition(stage.when, `${swhere}.when`);
      const hasOutcomes = Array.isArray(stage.outcomes) && stage.outcomes.length > 0;
      const hasBranches = Array.isArray(stage.branches) && stage.branches.length > 0;
      if (!hasOutcomes && !hasBranches) error(`${swhere}: requires outcomes[] or branches[]`);
      if (hasOutcomes) stage.outcomes.forEach((o, i) => validateOutcome(o, `${swhere}.outcomes[${i}]`));
      if (hasBranches) {
        stage.branches.forEach((b, i) => {
          const bwhere = `${swhere}.branches[${i}]`;
          if (!isObject(b)) return error(`${bwhere}: must be object`);
          validateCondition(b.when, `${bwhere}.when`);
          if ("nextStage" in b && !isNumber(b.nextStage)) error(`${bwhere}.nextStage: must be number`);
          if (!Array.isArray(b.outcomes) || !b.outcomes.length) error(`${bwhere}.outcomes: non-empty array required`);
          else b.outcomes.forEach((o, j) => validateOutcome(o, `${bwhere}.outcomes[${j}]`));
        });
      }
    });
  });
  return new Set(arcIds);
}

function validateEventMeta(meta, deckEventIds) {
  if (!isObject(meta)) {
    error(`[event-meta] root must be object`);
    return;
  }
  const ids = Object.keys(meta);
  ids.forEach((id) => {
    const m = meta[id];
    const where = `[event-meta].${id}`;
    if (!isObject(m)) return error(`${where}: must be object`);
    if (m.deck != null && typeof m.deck !== "string") error(`${where}.deck: must be string`);
    if (m.tags != null && (!Array.isArray(m.tags) || m.tags.some((x) => typeof x !== "string"))) error(`${where}.tags: must be string[]`);
    if (m.cooldown != null && !isNumber(m.cooldown)) error(`${where}.cooldown: must be number`);
    if (m.bias != null) {
      if (!Array.isArray(m.bias)) error(`${where}.bias: must be array`);
      else m.bias.forEach((b, i) => {
        if (!isObject(b) || typeof b.key !== "string" || !isNumber(b.mul) || !isNumber(b.ttl)) error(`${where}.bias[${i}]: invalid`);
      });
    }
    if (m.enqueue != null) {
      if (!Array.isArray(m.enqueue)) error(`${where}.enqueue: must be array`);
      else m.enqueue.forEach((q, i) => {
        if (!isObject(q) || typeof q.eventId !== "string") error(`${where}.enqueue[${i}]: invalid`);
      });
    }
    if (!deckEventIds.has(id)) {
      warn(`${where}: not found in event-deck (legacy-only metadata?)`);
    }
  });
}

function main() {
  const eventMeta = readJson(FILES.eventMeta);
  const arcConfig = readJson(FILES.arcConfig);
  const arcEvents = readJson(FILES.arcEvents);
  const eventDeck = readJson(FILES.eventDeck);
  if (!eventMeta || !arcConfig || !arcEvents || !eventDeck) {
    printAndExit(1);
    return;
  }

  const deckIds = validateEventDeck(eventDeck) || new Set();
  validateEventMeta(eventMeta, deckIds);
  const arcIds = validateArcEvents(arcEvents) || new Set();
  validateArcConfig(arcConfig, arcEvents);
  validateHotpacks(deckIds);

  if (Array.isArray(arcConfig.order)) {
    arcIds.forEach((id) => {
      if (!arcConfig.order.includes(id)) warn(`[arc-events].${id}: exists but not in arc-config.order`);
    });
  }

  printAndExit(result.errors.length ? 1 : 0);
}

function printAndExit(code) {
  if (result.errors.length) {
    console.error("Event pack check: FAILED");
    result.errors.forEach((e) => console.error(`ERROR ${e}`));
  }
  if (result.warnings.length) {
    console.log("Warnings:");
    result.warnings.forEach((w) => console.log(`WARN  ${w}`));
  }
  console.log(
    `Summary: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`
  );
  process.exit(code);
}

main();
