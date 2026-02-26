"use strict";

const fs = require("node:fs");
const path = require("node:path");

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashText(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function loadDeck(cwd) {
  const file = path.join(cwd, "public", "data", "events", "event-deck.json");
  const base = JSON.parse(fs.readFileSync(file, "utf8"));
  const indexFile = path.join(cwd, "public", "data", "events", "hotpacks", "index.json");
  let index = { packs: [] };
  if (fs.existsSync(indexFile)) {
    index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  }
  return { base, index };
}

function parseDateOnly(text) {
  if (!text || typeof text !== "string") return null;
  const d = new Date(`${text}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isPackActive(pack, refDate) {
  const from = parseDateOnly(pack.activeFrom);
  const to = parseDateOnly(pack.activeTo);
  if (from && refDate < from) return false;
  if (to) {
    const end = new Date(to.getTime());
    end.setHours(23, 59, 59, 999);
    if (refDate > end) return false;
  }
  return true;
}

function mergeHotpacks(cwd, baseDeck, index, referenceDate) {
  const ref = referenceDate ? new Date(`${referenceDate}T12:00:00`) : new Date("2026-02-26T12:00:00");
  const merged = JSON.parse(JSON.stringify(baseDeck || { rollChance: 0.2, events: [] }));
  const events = Array.isArray(merged.events) ? merged.events.slice() : [];
  const byId = {};
  for (let i = 0; i < events.length; i += 1) byId[events[i].id] = i;

  const packs = Array.isArray(index && index.packs) ? index.packs.slice() : [];
  packs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  for (let i = 0; i < packs.length; i += 1) {
    const p = packs[i];
    if (!p || !p.file || !isPackActive(p, ref)) continue;
    const rel = p.file.replace(/^\/+/, "");
    const abs = rel.startsWith("data/") ? path.join(cwd, "public", rel) : path.join(cwd, rel);
    if (!fs.existsSync(abs)) continue;
    const body = JSON.parse(fs.readFileSync(abs, "utf8"));
    const list = Array.isArray(body.events) ? body.events : [];
    for (let j = 0; j < list.length; j += 1) {
      const evt = list[j];
      if (!evt || !evt.id) continue;
      if (Number.isInteger(byId[evt.id])) events[byId[evt.id]] = evt;
      else {
        byId[evt.id] = events.length;
        events.push(evt);
      }
    }
  }
  merged.events = events;
  return merged;
}

function simulateReplay(opts) {
  const cfg = opts || {};
  const cwd = cfg.cwd || process.cwd();
  const loaded = loadDeck(cwd);
  const deck = mergeHotpacks(cwd, loaded.base, loaded.index, cfg.referenceDate || "2026-02-26");
  const seed = cfg.seed || "replay-seed";
  const steps = Number.isFinite(cfg.steps) ? cfg.steps : 120;
  const random = mulberry32(hashSeed(seed));
  const history = [];

  const state = {
    day: cfg.init && Number.isFinite(cfg.init.day) ? cfg.init.day : 1,
    turn: 0,
    chapter: cfg.init && Number.isFinite(cfg.init.chapter) ? cfg.init.chapter : 3,
    location: cfg.init && cfg.init.location ? cfg.init.location : "novice",
    locationType: cfg.init && cfg.init.locationType ? cfg.init.locationType : "town",
    profession: cfg.init && cfg.init.profession ? cfg.init.profession : "worker",
    familyStage: cfg.init && cfg.init.familyStage ? cfg.init.familyStage : "单身",
    childCount: cfg.init && Number.isFinite(cfg.init.childCount) ? cfg.init.childCount : 0,
    stats: { int: 12, spi: 9, agi: 9, vit: 10, luk: 8, ...(cfg.init && cfg.init.stats ? cfg.init.stats : {}) },
    hp: cfg.init && Number.isFinite(cfg.init.hp) ? cfg.init.hp : 120,
    hpMax: cfg.init && Number.isFinite(cfg.init.hpMax) ? cfg.init.hpMax : 120,
    gold: cfg.init && Number.isFinite(cfg.init.gold) ? cfg.init.gold : 80,
    city: {
      morale: cfg.init && Number.isFinite(cfg.init.morale) ? cfg.init.morale : 58,
      fatigue: cfg.init && Number.isFinite(cfg.init.fatigue) ? cfg.init.fatigue : 24,
      debt: cfg.init && Number.isFinite(cfg.init.debt) ? cfg.init.debt : 70,
      heat: cfg.init && Number.isFinite(cfg.init.heat) ? cfg.init.heat : 12
    },
    flags: {},
    bias: {},
    cooldowns: {},
    seen: {},
    queue: []
  };

  if (cfg.init && cfg.init.flags && typeof cfg.init.flags === "object") {
    Object.keys(cfg.init.flags).forEach((k) => {
      const v = cfg.init.flags[k];
      state.flags[k] = { value: v, ttl: 999 };
    });
  }

  function randInt(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function markSeen(id, cooldown) {
    state.seen[id] = (state.seen[id] || 0) + 1;
    if (cooldown > 0) state.cooldowns[id] = cooldown;
  }

  function addBias(key, mul, ttl) {
    const current = state.bias[key];
    const safeMul = Number.isFinite(mul) ? mul : 1;
    const safeTtl = Number.isFinite(ttl) ? Math.max(1, ttl) : 1;
    if (!current) {
      state.bias[key] = { mul: safeMul, ttl: safeTtl };
      return;
    }
    current.mul *= safeMul;
    current.ttl = Math.max(current.ttl, safeTtl);
  }

  function enqueueEvent(eventId, dueIn, priority, forced) {
    if (typeof eventId !== "string" || !eventId) return;
    state.queue.push({
      eventId,
      dueTurn: state.turn + Math.max(0, Number.isFinite(dueIn) ? dueIn : 0),
      priority: Number.isFinite(priority) ? priority : 50,
      forced: !!forced
    });
  }

  function cooldownTick() {
    Object.keys(state.cooldowns).forEach((k) => {
      state.cooldowns[k] -= 1;
      if (state.cooldowns[k] <= 0) delete state.cooldowns[k];
    });
    Object.keys(state.flags).forEach((k) => {
      if (!state.flags[k].ttl) return;
      state.flags[k].ttl -= 1;
      if (state.flags[k].ttl <= 0) delete state.flags[k];
    });
    Object.keys(state.bias).forEach((k) => {
      state.bias[k].ttl -= 1;
      if (state.bias[k].ttl <= 0) delete state.bias[k];
    });
  }

  function getFlag(k, fallback) {
    return Object.prototype.hasOwnProperty.call(state.flags, k) ? state.flags[k].value : fallback;
  }

  function sumStats(keys) {
    return (keys || []).reduce((acc, k) => acc + (state.stats[k] || 0), 0);
  }

  function evalCond(cond) {
    if (!cond || typeof cond !== "object") return true;
    if (Array.isArray(cond.all)) return cond.all.every((c) => evalCond(c));
    if (Array.isArray(cond.any)) return cond.any.some((c) => evalCond(c));
    if (cond.not) return !evalCond(cond.not);
    if (Number.isFinite(cond.dayMin) && state.day < cond.dayMin) return false;
    if (Number.isFinite(cond.dayMax) && state.day > cond.dayMax) return false;
    if (Number.isFinite(cond.chapterMin) && state.chapter < cond.chapterMin) return false;
    if (Number.isFinite(cond.goldGte) && state.gold < cond.goldGte) return false;
    if (Number.isFinite(cond.goldLte) && state.gold > cond.goldLte) return false;
    if (Number.isFinite(cond.debtGte) && state.city.debt < cond.debtGte) return false;
    if (Number.isFinite(cond.moraleLte) && state.city.morale > cond.moraleLte) return false;
    if (Number.isFinite(cond.fatigueGte) && state.city.fatigue < cond.fatigueGte) return false;
    if (Array.isArray(cond.professionIn) && !cond.professionIn.includes(state.profession)) return false;
    if (Array.isArray(cond.locationIn) && !cond.locationIn.includes(state.location)) return false;
    if (Array.isArray(cond.locationTypeIn) && !cond.locationTypeIn.includes(state.locationType)) return false;
    if (Array.isArray(cond.familyStageIn) && !cond.familyStageIn.includes(state.familyStage)) return false;
    if (Array.isArray(cond.familyStageNotIn) && cond.familyStageNotIn.includes(state.familyStage)) return false;
    if (Number.isFinite(cond.childCountGte) && state.childCount < cond.childCountGte) return false;
    if (Number.isFinite(cond.childCountEq) && state.childCount !== cond.childCountEq) return false;
    if (typeof cond.engineFlagTrue === "string" && !getFlag(cond.engineFlagTrue, false)) return false;
    if (typeof cond.engineFlagFalse === "string" && getFlag(cond.engineFlagFalse, false)) return false;
    if (cond.seenEventGte && typeof cond.seenEventGte === "object") {
      if ((state.seen[cond.seenEventGte.id] || 0) < (cond.seenEventGte.value || 0)) return false;
    }
    if (cond.statSumGte && typeof cond.statSumGte === "object") {
      if (sumStats(cond.statSumGte.keys || []) < (cond.statSumGte.value || 0)) return false;
    }
    if (Number.isFinite(cond.randomLt) && random() >= cond.randomLt) return false;
    return true;
  }

  function resolveDynamicValue(spec, currentValue, maxValue) {
    if (typeof spec === "number") return spec;
    if (!spec || typeof spec !== "object") return 0;
    if (spec.mode === "addRand") return randInt(spec.min || 0, spec.max || 0);
    if (spec.mode === "subRand") return -randInt(spec.min || 0, spec.max || 0);
    if (spec.mode === "subRate") return -Math.floor((currentValue || 0) * (spec.rate || 0));
    if (spec.mode === "addRate") return Math.floor((currentValue || 0) * (spec.rate || 0));
    if (spec.mode === "healRand") return Math.min(maxValue || 9999, (currentValue || 0) + randInt(spec.min || 0, spec.max || 0)) - (currentValue || 0);
    return 0;
  }

  function applyOutcome(outcome) {
    if (!outcome || typeof outcome !== "object") return;
    if (outcome.city) {
      state.city.morale += outcome.city.morale || 0;
      state.city.fatigue += outcome.city.fatigue || 0;
      state.city.debt += outcome.city.debt || 0;
      state.city.heat += outcome.city.heat || 0;
    }
    if (outcome.player) {
      if (outcome.player.gold != null) state.gold = Math.max(0, state.gold + resolveDynamicValue(outcome.player.gold, state.gold, 999999));
      if (outcome.player.hp != null) state.hp = Math.max(0, Math.min(state.hpMax, state.hp + resolveDynamicValue(outcome.player.hp, state.hp, state.hpMax)));
      if (outcome.player.stats && typeof outcome.player.stats === "object") {
        Object.keys(outcome.player.stats).forEach((k) => {
          state.stats[k] = (state.stats[k] || 0) + (outcome.player.stats[k] || 0);
        });
      }
    }
    if (Array.isArray(outcome.setFlags)) {
      outcome.setFlags.forEach((f) => {
        state.flags[f.key] = { value: f.value, ttl: Number(f.ttl) > 0 ? Number(f.ttl) : 0 };
      });
    }
    if (Array.isArray(outcome.clearFlags)) {
      outcome.clearFlags.forEach((k) => delete state.flags[k]);
    }
    if (outcome.story && typeof outcome.story === "object") {
      if (typeof outcome.story.familyStage === "string") state.familyStage = outcome.story.familyStage;
      if (Number.isFinite(outcome.story.childCountAdd)) state.childCount = Math.max(0, state.childCount + outcome.story.childCountAdd);
    }
    if (Array.isArray(outcome.bias)) {
      outcome.bias.forEach((b) => {
        if (!b || typeof b.key !== "string") return;
        addBias(b.key, b.mul, b.ttl);
      });
    }
    if (Array.isArray(outcome.enqueue)) {
      outcome.enqueue.forEach((q) => {
        if (!q || typeof q.eventId !== "string") return;
        enqueueEvent(q.eventId, q.dueIn, q.priority, q.forced);
      });
    }
  }

  function biasMultiplier(eventId, tags) {
    let mul = 1;
    if (state.bias[`event:${eventId}`]) mul *= state.bias[`event:${eventId}`].mul;
    const list = Array.isArray(tags) ? tags : [];
    for (let i = 0; i < list.length; i += 1) {
      const hit = state.bias[`tag:${list[i]}`];
      if (hit) mul *= hit.mul;
    }
    return mul;
  }

  function runQueueEvent(item) {
    if (!item || typeof item.eventId !== "string") return false;
    if (item.eventId === "queue:jobhunt-feedback") {
      if ((state.stats.int || 0) + (state.stats.agi || 0) + randInt(0, 8) >= 24) {
        state.gold = Math.max(0, state.gold + randInt(18, 42));
        state.city.morale += 4;
        state.city.debt -= 6;
      } else {
        state.city.morale -= 3;
        state.city.fatigue += 2;
      }
      return true;
    }
    if (item.eventId === "queue:exam-result") {
      if ((state.stats.int || 0) + (state.stats.spi || 0) + randInt(0, 10) >= 28) {
        state.city.morale += 6;
        state.city.fatigue -= 2;
      } else {
        state.city.morale -= 5;
        state.city.fatigue += 3;
      }
      return true;
    }
    if (item.eventId === "queue:mortgage-followup") {
      state.gold = Math.max(0, state.gold - randInt(16, 42));
      state.city.debt += 10;
      state.city.morale -= 2;
      state.city.heat += 2;
      return true;
    }
    if (item.eventId === "queue:parenting-support") {
      if (random() < 0.5) {
        state.city.fatigue -= 8;
        state.city.morale += 4;
        state.city.debt -= 4;
      } else {
        state.city.fatigue += 6;
        state.city.morale -= 3;
        state.city.debt += 8;
      }
      return true;
    }
    if (item.eventId === "queue:legal-review") {
      if ((state.seen["helping-fall-fraud"] || 0) > 0) {
        state.flags["legal.review.ready"] = { value: true, ttl: 12 };
        addBias("tag:legal", 1.22, 7);
        addBias("tag:relief", 1.3, 8);
        state.city.fatigue -= 1;
        state.city.heat -= 1;
      } else {
        state.city.fatigue += 1;
      }
      return true;
    }
    if (item.eventId === "queue:abroad-feedback") {
      state.flags["career.abroad.callback"] = { value: true, ttl: 10 };
      addBias("tag:abroad", 1.25, 8);
      addBias("tag:jobhunt", 1.08, 6);
      state.city.fatigue += 1;
      state.city.heat += 1;
      return true;
    }
    return false;
  }

  function noveltyPenalty(id) {
    const seen = state.seen[id] || 0;
    if (seen <= 0) return 1;
    return 1 / (1 + seen * 0.35);
  }

  function weightedPick(pool) {
    let total = 0;
    for (let i = 0; i < pool.length; i += 1) total += Math.max(0, pool[i].weight || 0);
    if (total <= 0) return null;
    let roll = random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= Math.max(0, pool[i].weight || 0);
      if (roll <= 0) return pool[i].event;
    }
    return pool[pool.length - 1].event;
  }

  for (let i = 0; i < steps; i += 1) {
    state.turn += 1;
    if (state.turn % 8 === 0) state.day += 1;
    cooldownTick();

    const due = state.queue
      .filter((q) => q && q.dueTurn <= state.turn)
      .sort((a, b) => Number(b.forced) - Number(a.forced) || b.priority - a.priority);
    if (due.length) {
      const chosenQueue = due[0];
      state.queue = state.queue.filter((q) => q !== chosenQueue);
      if (runQueueEvent(chosenQueue)) {
        history.push({
          day: state.day,
          turn: state.turn,
          id: chosenQueue.eventId,
          branch: "queue"
        });
        continue;
      }
    }

    if (random() > (Number.isFinite(deck.rollChance) ? deck.rollChance : 0.2)) continue;

    const pool = [];
    const events = Array.isArray(deck.events) ? deck.events : [];
    for (let j = 0; j < events.length; j += 1) {
      const evt = events[j];
      if (!evt || !evt.id) continue;
      if ((state.cooldowns[evt.id] || 0) > 0) continue;
      if (evt.oncePerRun && (state.seen[evt.id] || 0) > 0) continue;
      if (Array.isArray(evt.requireFlags) && evt.requireFlags.some((k) => !getFlag(k, false))) continue;
      if (Array.isArray(evt.blockFlags) && evt.blockFlags.some((k) => getFlag(k, false))) continue;
      if (Array.isArray(evt.prereqEventsAll) && evt.prereqEventsAll.some((k) => (state.seen[k] || 0) <= 0)) continue;
      if (Array.isArray(evt.prereqEventsAny) && evt.prereqEventsAny.length && !evt.prereqEventsAny.some((k) => (state.seen[k] || 0) > 0)) continue;
      if (evt.when && !evalCond(evt.when)) continue;

      const tags = evt.tags || [];
      const deckName = evt.deck || "";
      let weight = Number.isFinite(evt.baseWeight) ? evt.baseWeight : evt.rare ? 0.7 : 1.2;
      if (deckName === "career" && state.chapter >= 3) weight *= 1.25;
      if (deckName === "family" && state.familyStage !== "单身") weight *= 1.2;
      if (deckName === "housing" && state.city.debt >= 90) weight *= 1.25;
      if (state.city.heat >= 75 && tags.includes("heat")) weight *= 1.3;
      if (state.city.heat <= 12 && tags.includes("relief")) weight *= 1.2;
      weight *= biasMultiplier(evt.id, tags);
      weight *= noveltyPenalty(evt.id);
      pool.push({ event: evt, weight: Math.max(0.05, weight) });
    }
    if (!pool.length) continue;

    const chosen = weightedPick(pool) || pool[Math.floor(random() * pool.length)].event;
    const branches = Array.isArray(chosen.branches) ? chosen.branches : [];
    let branch = null;
    for (let b = 0; b < branches.length; b += 1) {
      if (!branches[b].when || evalCond(branches[b].when)) {
        branch = branches[b];
        break;
      }
    }
    const outcomes = branch ? branch.outcomes || [] : chosen.outcomes || [];
    outcomes.forEach((o) => applyOutcome(o));
    markSeen(chosen.id, chosen.cooldown || (chosen.rare ? 5 : 2));

    history.push({
      day: state.day,
      turn: state.turn,
      id: chosen.id,
      branch: branch && branch.name ? branch.name : "normal"
    });
  }

  const signature = history.map((h) => `${h.id}:${h.branch}`).join("|");
  return {
    seed,
    steps,
    count: history.length,
    hash: hashText(signature),
    history
  };
}

module.exports = { simulateReplay };
