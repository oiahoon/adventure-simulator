"use strict";

const { createCardEngineV2 } = require("../core/card-v2/engine");

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

function pickCard(handMeta, cardPolicy) {
  const list = Array.isArray(handMeta) ? handMeta : [];
  if (!list.length) return null;
  const policy = cardPolicy || {};

  if (typeof policy.cardId === "string") {
    const hit = list.find((x) => x && x.id === policy.cardId);
    if (hit) return hit;
  }

  const tags = Array.isArray(policy.preferTags) ? policy.preferTags : [];
  for (let i = 0; i < tags.length; i += 1) {
    const hit = list.find((x) => x && x.tag === tags[i]);
    if (hit) return hit;
  }

  if (typeof policy.preferTag === "string") {
    const hit = list.find((x) => x && x.tag === policy.preferTag);
    if (hit) return hit;
  }

  if (policy.mode === "last") return list[list.length - 1];
  if (policy.mode === "middle" && list.length >= 2) return list[1];
  return list[0];
}

function pickChoiceId(step, choicePolicy) {
  const mode = typeof choicePolicy === "string" ? choicePolicy : choicePolicy && choicePolicy.mode;
  if (mode === "right") return "right";
  if (mode === "alternate") return step % 2 === 0 ? "left" : "right";
  return "left";
}

function simulateReplayV2(opts) {
  const cfg = opts || {};
  const seed = String(cfg.seed || "v2-replay-seed");
  const steps = Number.isFinite(cfg.steps) ? cfg.steps : 30;
  const random = mulberry32(hashSeed(seed));
  const engine = createCardEngineV2({ random, cwd: cfg.cwd || process.cwd() });

  const history = [];
  const init = engine.runAction({ action: "new", name: cfg.name || "回放测试员" });
  if (!init.ok) throw new Error(init.error || "v2 replay init failed");
  let run = init.payload.run;

  for (let i = 0; i < steps; i += 1) {
    if (!run || run.mode !== "running") break;

    const hand = Array.isArray(run.handMeta) ? run.handMeta : [];
    if (!hand.length) {
      const drawRes = engine.runAction({ action: "draw", run });
      if (!drawRes.ok) throw new Error(drawRes.error || "v2 replay draw failed");
      run = drawRes.payload.run;
      history.push({
        step: i,
        action: "draw",
        turn: run.turn,
        day: run.day,
        hand: (run.handMeta || []).map((x) => x.id)
      });
      continue;
    }

    const chosen = pickCard(hand, cfg.cardPolicy);
    if (!chosen) break;
    const choiceId = pickChoiceId(i, cfg.choicePolicy);
    const before = { day: run.day, turn: run.turn };
    const playRes = engine.runAction({ action: "play", run, cardId: chosen.id, choiceId });
    if (!playRes.ok) throw new Error(playRes.error || "v2 replay play failed");
    run = playRes.payload.run;
    history.push({
      step: i,
      action: "play",
      cardId: chosen.id,
      choiceId,
      from: before,
      to: { day: run.day, turn: run.turn },
      mode: run.mode
    });
  }

  const events = Array.isArray(run.eventLog) ? run.eventLog : [];
  const signature = {
    seed,
    endMode: run.mode,
    day: run.day,
    turn: run.turn,
    stats: run.stats,
    arcState: run.activeArcs,
    observability: run.observability,
    eventTail: events.slice(-24).map((e) => ({
      t: e.turn,
      d: e.day,
      type: e.type,
      cardId: e.cardId || "",
      arcId: e.arcId || "",
      reason: e.reason || "",
      choiceId: e.choiceId || ""
    })),
    historyTail: history.slice(-24)
  };

  const hash = hashText(JSON.stringify(signature));
  return {
    hash,
    run,
    history,
    count: history.length,
    observability: run.observability || {}
  };
}

module.exports = {
  hashSeed,
  mulberry32,
  hashText,
  simulateReplayV2
};

