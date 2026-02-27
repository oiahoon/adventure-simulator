"use strict";

const { DEFAULT_CONTENT } = require("./default-content");
const { loadCardV2Content } = require("./content-loader");

const SUPPORTED_ACTIONS = ["new", "status", "draw", "play", "discard", "defer", "choose"];

function defaultRandom() {
  return Math.random();
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[randInt(rng, 0, arr.length - 1)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round3(v) {
  return Math.round(v * 1000) / 1000;
}

function pushLog(run, text) {
  run.log.push(text);
  if (run.log.length > 100) run.log = run.log.slice(-100);
}

function pushEvent(run, type, payload) {
  run.eventLog.push({ turn: run.turn, day: run.day, type, ...(payload || {}) });
  if (run.eventLog.length > 240) run.eventLog = run.eventLog.slice(-240);
}

function getFlag(run, key, fallback) {
  return Object.prototype.hasOwnProperty.call(run.flags, key) ? run.flags[key].v : fallback;
}

function tickTTL(run) {
  Object.keys(run.flags).forEach((k) => {
    const it = run.flags[k];
    if (!it || !Number.isFinite(it.ttl) || it.ttl <= 0) return;
    it.ttl -= 1;
    if (it.ttl <= 0) delete run.flags[k];
  });
  Object.keys(run.biasMap).forEach((k) => {
    const it = run.biasMap[k];
    if (!it || !Number.isFinite(it.ttl) || it.ttl <= 0) return;
    it.ttl -= 1;
    if (it.ttl <= 0) delete run.biasMap[k];
  });
  Object.keys(run.cooldowns).forEach((k) => {
    run.cooldowns[k] -= 1;
    if (run.cooldowns[k] <= 0) delete run.cooldowns[k];
  });
}

function evalCondition(run, cond, rng) {
  if (!cond || typeof cond !== "object") return true;
  if (Array.isArray(cond.all)) return cond.all.every((c) => evalCondition(run, c, rng));
  if (Array.isArray(cond.any)) return cond.any.some((c) => evalCondition(run, c, rng));
  if (cond.not) return !evalCondition(run, cond.not, rng);
  if (cond.stat) {
    const current = Number(run.stats[cond.stat] || 0);
    const value = cond.value;
    if (cond.op === ">=") return current >= value;
    if (cond.op === ">") return current > value;
    if (cond.op === "<=") return current <= value;
    if (cond.op === "<") return current < value;
    if (cond.op === "==") return current === value;
    if (cond.op === "!=") return current !== value;
  }
  if (cond.flag) {
    const current = getFlag(run, cond.flag, false);
    if (cond.op === "==") return current === cond.value;
    if (cond.op === "!=") return current !== cond.value;
  }
  if (cond.hasTag) {
    return run.contextTags.includes(cond.hasTag);
  }
  if (cond.rng && Number.isFinite(cond.rng.chance)) {
    return rng() < cond.rng.chance;
  }
  return true;
}

function computeWeight(run, card) {
  const event = card.event || {};
  let w = Number.isFinite(event.baseWeight) ? event.baseWeight : 1;
  if (run.cooldowns[event.id] > 0) return 0;
  const tags = Array.isArray(event.tags) ? event.tags : [];
  for (let i = 0; i < tags.length; i += 1) {
    const bias = run.biasMap[`tag:${tags[i]}`];
    if (bias) w *= bias.mul;
  }
  const cardBias = run.biasMap[`card:${card.id}`];
  if (cardBias) w *= cardBias.mul;
  const recentCount = run.recentCards.filter((id) => id === card.id).length;
  if (recentCount > 0) w *= 1 / (1 + recentCount * 0.35);
  return Math.max(0, w);
}

function weightedPick(rng, list) {
  let total = 0;
  for (let i = 0; i < list.length; i += 1) total += list[i].weight;
  if (total <= 0) return null;
  let roll = rng() * total;
  for (let i = 0; i < list.length; i += 1) {
    roll -= list[i].weight;
    if (roll <= 0) return list[i].card;
  }
  return list[list.length - 1].card;
}

function cardById(content, cardId) {
  return content.CARDS.find((c) => c.id === cardId) || null;
}

function applyDeltas(run, deltas) {
  const list = Array.isArray(deltas) ? deltas : [];
  for (let i = 0; i < list.length; i += 1) {
    const d = list[i];
    if (!d || typeof d.stat !== "string" || !Number.isFinite(d.add)) continue;
    const current = Number(run.stats[d.stat] || 0);
    let next = current + d.add;
    if (Number.isFinite(d.clampMin)) next = Math.max(d.clampMin, next);
    if (Number.isFinite(d.clampMax)) next = Math.min(d.clampMax, next);
    run.stats[d.stat] = next;
  }
}

function applyOutcome(run, outcome) {
  if (!outcome || typeof outcome !== "object") return;
  applyDeltas(run, outcome.deltas);

  const setFlags = outcome.setFlags || {};
  Object.keys(setFlags).forEach((key) => {
    const value = setFlags[key];
    if (!value || typeof value !== "object") return;
    run.flags[key] = { v: value.v, ttl: Number.isFinite(value.ttl) ? value.ttl : 0 };
  });

  const clearFlags = Array.isArray(outcome.clearFlags) ? outcome.clearFlags : [];
  clearFlags.forEach((key) => delete run.flags[key]);

  const enqueue = Array.isArray(outcome.enqueue) ? outcome.enqueue : [];
  enqueue.forEach((q) => {
    if (!q || typeof q.cardId !== "string") return;
    run.queue.push({
      cardId: q.cardId,
      dueIn: Number.isFinite(q.dueIn) ? q.dueIn : 0,
      priority: Number.isFinite(q.priority) ? q.priority : 50,
      forced: !!q.forced
    });
  });

  const bias = Array.isArray(outcome.bias) ? outcome.bias : [];
  bias.forEach((b) => {
    if (!b || typeof b.key !== "string") return;
    run.biasMap[b.key] = {
      mul: Number.isFinite(b.mul) ? b.mul : 1,
      ttl: Number.isFinite(b.ttl) ? b.ttl : 3
    };
  });

  const arcStep = outcome.arcStep || {};
  Object.keys(arcStep).forEach((arcId) => {
    const add = Number(arcStep[arcId] || 0);
    const arc = run.activeArcs[arcId];
    if (!arc || !add) return;
    arc.stage += add;
  });
}

function resolveChoice(run, card, choiceId, rng) {
  const event = card.event || {};
  const choices = Array.isArray(event.choices) ? event.choices : [];
  if (!choices.length) {
    if (Array.isArray(event.autoOutcomes)) {
      event.autoOutcomes.forEach((o) => applyOutcome(run, o));
    }
    return { choice: "auto", label: "自动结算" };
  }

  const selected = choices.find((c) => c.id === choiceId) || choices[0];
  const outcomes = Array.isArray(selected.outcomes) ? selected.outcomes : [];
  outcomes.forEach((o) => applyOutcome(run, o));
  return { choice: selected.id, label: selected.label };
}

function processForcedQueue(run) {
  const due = run.queue.filter((q) => q && q.dueIn <= 0).sort((a, b) => Number(b.forced) - Number(a.forced) || b.priority - a.priority);
  if (!due.length) return null;
  const chosen = due[0];
  run.queue = run.queue.filter((q) => q !== chosen);
  return chosen;
}

function decayQueue(run) {
  run.queue.forEach((q) => {
    q.dueIn -= 1;
  });
}

function updateContextTags(run) {
  const tags = [
    `career:${run.profile.careerId}`,
    `city:${run.profile.cityId}`,
    `stage:${run.storyStage}`
  ];
  if (run.stats.debt >= 120) tags.push("risk:debt_high");
  if (run.stats.san <= 22) tags.push("risk:san_low");
  if (run.stats.fatigue >= 70) tags.push("risk:fatigue_high");
  run.contextTags = tags;
}

function activateArc(run, arcId) {
  const arc = run.activeArcs[arcId];
  if (!arc || arc.active || arc.done) return false;
  arc.active = true;
  arc.stage = 1;
  pushEvent(run, "arc_activate", { arcId, stage: 1 });
  return true;
}

function maybeActivateArcs(run) {
  if (run.stats.debt >= 100) activateArc(run, "mortgage");
  if (run.stats.heat >= 42 || getFlag(run, "legal.prepared", false)) activateArc(run, "legal");
  if (run.stats.fatigue >= 56) activateArc(run, "parenting");
  if (run.stats.cash <= 30) activateArc(run, "unemployment");
  if (run.stats.careerXP >= 8) activateArc(run, "jobhunt");
}

function runArcStep(run, rng, content) {
  const order = ["unemployment", "mortgage", "parenting", "legal", "jobhunt"];
  for (let i = 0; i < order.length; i += 1) {
    const arcId = order[i];
    const arcState = run.activeArcs[arcId];
    if (!arcState || !arcState.active || arcState.done) continue;
    const def = content.ARCS[arcId];
    if (!def) continue;
    const stageId = Math.max(1, Math.min(3, arcState.stage));
    const node = def.stages[String(stageId)];
    if (!node) continue;

    pushLog(run, `【剧情链】${def.title}S${stageId}: ${node.text}`);
    pushEvent(run, "arc_step", { arcId, stage: stageId });

    const outcome = node.outcome || {};
    applyDeltas(run, outcome.deltas || []);
    if (outcome.complete) {
      arcState.done = true;
      arcState.active = false;
      arcState.ending = "complete";
    } else if (Number.isFinite(outcome.nextStage)) {
      arcState.stage = outcome.nextStage;
    } else {
      arcState.stage = stageId + 1;
      if (arcState.stage > 3) {
        arcState.done = true;
        arcState.active = false;
      }
    }

    return true;
  }
  return false;
}

function drawCards(run, rng, content) {
  if (run.pendingChoice) return { ok: false, message: "存在关键抉择，请先 choose。" };

  const forced = processForcedQueue(run);
  if (forced) {
    const forcedCard = cardById(content, forced.cardId);
    if (forcedCard) {
      const forcedChoices = Array.isArray(forcedCard.event.choices) ? forcedCard.event.choices : [];
      run.hand = [forcedCard.id];
      run.handMeta = [{
        id: forcedCard.id,
        title: forcedCard.event.title,
        text: forcedCard.event.text || "",
        tag: forcedCard.event.tags[0] || "forced",
        forced: true,
        canDiscard: !!forcedCard.canDiscard,
        leftLabel: forcedChoices[0] && forcedChoices[0].label ? forcedChoices[0].label : "左选",
        rightLabel: forcedChoices[1] && forcedChoices[1].label ? forcedChoices[1].label : "右选"
      }];
      pushEvent(run, "draw_forced", { cardId: forcedCard.id });
      return { ok: true, message: "已发放强制后续卡。" };
    }
  }

  const size = clamp(content.DECK_RULES.baseHandSize, 1, content.DECK_RULES.maxHandSize);
  if (Array.isArray(run.hand) && run.hand.length >= size) {
    return { ok: true, message: "当前手牌已满。" };
  }
  const available = content.CARDS.filter((card) => {
    const event = card.event || {};
    if (run.cooldowns[event.id] > 0) return false;
    if (event.when && !evalCondition(run, event.when, rng)) return false;
    if (content.DECK_RULES.preventDuplicatesInHand && run.hand.includes(card.id)) return false;
    if ((run.discardHistory[card.id] || -999) + content.DECK_RULES.discardCooldownTurns > run.turn) return false;
    if ((run.deferHistory[card.id] || -999) + (content.DECK_RULES.deferCooldownTurns || 2) > run.turn) return false;
    return true;
  });

  const weighted = available
    .map((card) => ({ card, weight: computeWeight(run, card) }))
    .filter((x) => x.weight > 0);

  const pickedIds = Array.isArray(run.hand) ? run.hand.slice() : [];
  const pickedMeta = Array.isArray(run.handMeta) ? run.handMeta.slice() : [];
  while (pickedIds.length < size && weighted.length > 0) {
    const card = weightedPick(rng, weighted);
    if (!card) break;
    const choices = Array.isArray(card.event.choices) ? card.event.choices : [];
    pickedIds.push(card.id);
    pickedMeta.push({
      id: card.id,
      title: card.event.title,
      text: card.event.text || "",
      tag: card.event.tags[0] || "main",
      forced: false,
      canDiscard: !!card.canDiscard,
      leftLabel: choices[0] && choices[0].label ? choices[0].label : "左选",
      rightLabel: choices[1] && choices[1].label ? choices[1].label : "右选"
    });
    const idx = weighted.findIndex((w) => w.card.id === card.id);
    if (idx >= 0) weighted.splice(idx, 1);
  }

  run.hand = pickedIds;
  run.handMeta = pickedMeta;
  pushEvent(run, "draw", { cards: pickedIds });
  return { ok: true, message: pickedIds.length ? "已补齐手牌。" : "没有可抽卡牌。" };
}

function applyTurnProgress(run) {
  run.turn += 1;
  if (run.turn % 8 === 0) run.day += 1;

  run.stats.fatigue = clamp(run.stats.fatigue + 2, 0, 100);
  run.stats.debt = Math.max(0, run.stats.debt + 1);
  run.stats.san = clamp(run.stats.san - 1, 0, 100);
  run.stats.heat = clamp(run.stats.heat - 1, 0, 100);
  run.stats.hp = clamp(run.stats.hp - Math.max(0, Math.floor((run.stats.fatigue - 68) / 20)), 0, 100);

  if (run.day >= 28) run.storyStage = "中年托举";
  else if (run.day >= 18) run.storyStage = "成家阶段";
  else if (run.day >= 10) run.storyStage = "职场分流";
  else run.storyStage = "初入社会";
}

function checkEnd(run) {
  if (run.stats.hp <= 0) return "生命线归零";
  if (run.stats.san <= 0) return "精神线归零";
  if (run.stats.fatigue >= 100) return "疲劳线归零";
  if (run.stats.debt >= 280) return "债务线归零";
  if (run.day >= 36) return "成功坚持到人生终盘";
  return "";
}

function handOpCard(run, cardId, content, op) {
  if (run.mode !== "running") return { ok: false, statusCode: 400, error: "本局已结束。" };
  if (run.pendingChoice) return { ok: false, statusCode: 400, error: "存在关键抉择，请先 choose。" };
  if (!Array.isArray(run.hand) || !run.hand.length) return { ok: false, statusCode: 400, error: "当前无手牌。" };
  if (run.handOpUsedTurn === run.turn) {
    return { ok: false, statusCode: 400, error: "每回合仅允许一次手牌管理（弃置/延后）。" };
  }

  const resolvedCardId = cardId || run.hand[0];
  if (!run.hand.includes(resolvedCardId)) {
    return { ok: false, statusCode: 400, error: "cardId 不在当前手牌中", hand: run.handMeta };
  }
  const card = cardById(content, resolvedCardId);
  if (!card) return { ok: false, statusCode: 400, error: "未知 cardId" };
  if (!card.canDiscard) return { ok: false, statusCode: 400, error: "该卡不可进行手牌管理操作。" };

  run.hand = run.hand.filter((id) => id !== resolvedCardId);
  run.handMeta = (run.handMeta || []).filter((x) => x && x.id !== resolvedCardId);
  run.handOpUsedTurn = run.turn;

  if (op === "discard") {
    run.discardHistory[resolvedCardId] = run.turn;
    run.metrics.discards += 1;
    pushLog(run, `你弃置了【${card.event.title}】，等待更合适的机会卡。`);
    pushEvent(run, "discard", { cardId: resolvedCardId });
    return { ok: true, statusCode: 200, message: `已弃置卡牌 ${card.event.title}。` };
  }

  run.deferHistory[resolvedCardId] = run.turn;
  run.metrics.defers += 1;
  run.queue.push({ cardId: resolvedCardId, dueIn: 2, priority: 40, forced: false });
  pushLog(run, `你延后了【${card.event.title}】，它将在后续回合再次浮现。`);
  pushEvent(run, "defer", { cardId: resolvedCardId, dueIn: 2 });
  return { ok: true, statusCode: 200, message: `已延后卡牌 ${card.event.title}。` };
}

function buildObservability(run) {
  const plays = Number(run.metrics && run.metrics.cardPlays) || 0;
  const playHistory = Array.isArray(run.playHistory) ? run.playHistory : [];
  const uniqueCards = new Set(playHistory);
  const repeated = Math.max(0, plays - uniqueCards.size);

  const events = Array.isArray(run.eventLog) ? run.eventLog : [];
  let draws = 0;
  let queueHits = 0;
  for (let i = 0; i < events.length; i += 1) {
    const t = events[i] && events[i].type;
    if (t === "draw") draws += 1;
    else if (t === "draw_forced") {
      draws += 1;
      queueHits += 1;
    }
  }

  const arcs = run.activeArcs && typeof run.activeArcs === "object" ? run.activeArcs : {};
  const arcIds = Object.keys(arcs);
  const arcDone = arcIds.filter((id) => arcs[id] && arcs[id].done).length;

  return {
    arcCompletionRate: round3(arcIds.length ? arcDone / arcIds.length : 0),
    queueHitRate: round3(draws ? queueHits / draws : 0),
    cardDiversity: round3(plays ? uniqueCards.size / plays : 0),
    repeatRate: round3(plays ? repeated / plays : 0),
    counts: {
      draws,
      queueHits,
      cardPlays: plays,
      uniqueCards: uniqueCards.size,
      repeated,
      arcDone,
      arcTotal: arcIds.length
    }
  };
}

function playCard(run, rng, cardId, choiceId, content) {
  if (run.mode !== "running") return { ok: false, statusCode: 400, error: "本局已结束。" };
  if (run.pendingChoice) return { ok: false, statusCode: 400, error: "存在关键抉择，请先 choose。" };
  if (!run.hand.length) return { ok: false, statusCode: 400, error: "当前无手牌，请先 draw。" };

  const resolvedCardId = cardId || run.hand[0];
  if (!run.hand.includes(resolvedCardId)) {
    return { ok: false, statusCode: 400, error: "cardId 不在当前手牌中", hand: run.handMeta };
  }

  const card = cardById(content, resolvedCardId);
  if (!card) return { ok: false, statusCode: 400, error: "未知 cardId" };

  const resolution = resolveChoice(run, card, choiceId, rng);
  run.metrics.cardPlays += 1;
  run.handOpUsedTurn = -1;
  run.lastPlayedCard = card.id;
  run.playHistory.push(card.id);
  if (run.playHistory.length > 400) run.playHistory = run.playHistory.slice(-400);
  run.recentCards.push(card.id);
  if (run.recentCards.length > 12) run.recentCards = run.recentCards.slice(-12);

  const event = card.event || {};
  if (Number.isFinite(event.cooldown) && event.cooldown > 0) {
    run.cooldowns[event.id] = event.cooldown;
  }

  pushLog(run, `你打出【${event.title}】并选择「${resolution.label}」。`);
  pushEvent(run, "play", { cardId: card.id, choiceId: resolution.choice });

  run.hand = [];
  run.handMeta = [];

  applyTurnProgress(run);
  decayQueue(run);
  tickTTL(run);
  updateContextTags(run);
  maybeActivateArcs(run);
  runArcStep(run, rng, content);

  const endReason = checkEnd(run);
  if (endReason) {
    run.mode = "ended";
    pushLog(run, `结局：${endReason}`);
    pushEvent(run, "end", { reason: endReason });
    return { ok: true, statusCode: 200, message: `已打出卡牌 ${event.title}，本局结束。` };
  }

  return { ok: true, statusCode: 200, message: `已打出卡牌 ${event.title}。` };
}

function createRun(rng, name, content) {
  const run = {
    schemaVersion: 2,
    engineVersion: "v2",
    mode: "running",
    turn: 0,
    day: 1,
    profile: {
      name: name && String(name).trim() ? String(name).trim() : `打工人${randInt(rng, 100, 999)}`,
      cityId: pick(rng, content.CITIES),
      careerId: pick(rng, content.CAREERS),
      goals: ["生存", "稳现金流"]
    },
    location: "城中村",
    player: {
      name: "",
      profession: "",
      level: 1,
      exp: 0,
      nextExp: 40,
      hp: 70,
      maxHp: 70,
      mp: 20,
      maxMp: 20,
      gold: 56,
      sect: null,
      perk: null
    },
    stats: { ...content.BASE_STATS },
    city: {
      morale: content.BASE_STATS.san,
      fatigue: content.BASE_STATS.fatigue,
      debt: content.BASE_STATS.debt,
      heat: content.BASE_STATS.heat
    },
    hand: [],
    handMeta: [],
    pendingChoice: null,
    flags: {},
    biasMap: {},
    queue: [],
    activeArcs: {
      unemployment: { stage: 0, active: false, done: false },
      mortgage: { stage: 0, active: false, done: false },
      parenting: { stage: 0, active: false, done: false },
      legal: { stage: 0, active: false, done: false },
      jobhunt: { stage: 0, active: false, done: false }
    },
    cooldowns: {},
    discardHistory: {},
    deferHistory: {},
    handOpUsedTurn: -1,
    recentCards: [],
    playHistory: [],
    storyStage: "初入社会",
    contextTags: [],
    metrics: { cardPlays: 0, keyEvents: 0, battles: 0, events: 0, discards: 0, defers: 0 },
    log: [],
    eventLog: [],
    observability: {
      arcCompletionRate: 0,
      queueHitRate: 0,
      cardDiversity: 0,
      repeatRate: 0,
      counts: { draws: 0, queueHits: 0, cardPlays: 0, uniqueCards: 0, repeated: 0, arcDone: 0, arcTotal: 0 }
    }
  };

  run.player.name = run.profile.name;
  run.player.profession = run.profile.careerId;

  pushLog(run, "你进入卡牌化人生循环：每回合抽牌并打出一个决定。");
  updateContextTags(run);
  drawCards(run, rng, content);
  return run;
}

function runAction(rng, payload, content) {
  const { action = "status", run, option, cardId, choiceId, name } = payload || {};
  let currentRun = run || null;
  let message = "";

  if (action === "new" || !currentRun) {
    currentRun = createRun(rng, name, content);
    message = "v2 引擎新局已创建。";
  } else if (action === "status") {
    message = "状态读取成功。";
  } else if (action === "choose") {
    message = "当前 v2 阶段未启用 choose 分支。";
  } else if (action === "draw") {
    const drawRes = drawCards(currentRun, rng, content);
    if (!drawRes.ok) {
      return { ok: false, statusCode: 400, error: drawRes.message, supported: SUPPORTED_ACTIONS };
    }
    message = drawRes.message;
  } else if (action === "play") {
    const playRes = playCard(currentRun, rng, cardId || option, choiceId || option, content);
    if (!playRes.ok) {
      return { ok: false, statusCode: playRes.statusCode || 400, error: playRes.error, hand: playRes.hand, supported: SUPPORTED_ACTIONS };
    }
    message = playRes.message;
    if (currentRun.mode === "running" && !currentRun.hand.length && !currentRun.pendingChoice) {
      const drawRes = drawCards(currentRun, rng, content);
      if (drawRes.ok) message += ` ${drawRes.message}`;
    }
  } else if (action === "discard" || action === "defer") {
    const handRes = handOpCard(currentRun, cardId || option, content, action);
    if (!handRes.ok) {
      return { ok: false, statusCode: handRes.statusCode || 400, error: handRes.error, hand: handRes.hand, supported: SUPPORTED_ACTIONS };
    }
    message = handRes.message;
    if (currentRun.mode === "running" && !currentRun.pendingChoice) {
      const drawRes = drawCards(currentRun, rng, content);
      if (drawRes.ok) message += ` ${drawRes.message}`;
    }
  } else {
    return {
      ok: false,
      statusCode: 400,
      error: "不支持的 action",
      supported: SUPPORTED_ACTIONS
    };
  }

  // Mirror stats for legacy UIs that still read run.city/run.player.gold.
  currentRun.city = {
    morale: currentRun.stats.san,
    fatigue: currentRun.stats.fatigue,
    debt: currentRun.stats.debt,
    heat: currentRun.stats.heat
  };
  currentRun.player.hp = currentRun.stats.hp;
  currentRun.player.maxHp = Math.max(currentRun.player.maxHp, currentRun.stats.hp);
  currentRun.player.gold = currentRun.stats.cash;
  currentRun.observability = buildObservability(currentRun);

  return {
    ok: true,
    statusCode: 200,
    payload: {
      success: true,
      action,
      message,
      run: currentRun,
      engineVersion: "v2",
      supportedActions: SUPPORTED_ACTIONS
    }
  };
}

function createCardEngineV2(opts) {
  const random = opts && typeof opts.random === "function" ? opts.random : defaultRandom;
  const loaded = loadCardV2Content(opts || {});
  const content = loaded && loaded.content ? loaded.content : DEFAULT_CONTENT;
  const warnings = loaded && Array.isArray(loaded.warnings) ? loaded.warnings : [];
  return {
    runAction: (payload) => runAction(random, payload, content),
    constants: {
      SUPPORTED_ACTIONS,
      DECK_RULES: content.DECK_RULES,
      BASE_STATS: content.BASE_STATS
    },
    metadata: {
      source: loaded ? loaded.source : "fallback-default",
      warnings
    }
  };
}

module.exports = {
  createCardEngineV2
};
