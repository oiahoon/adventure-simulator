"use strict";

const JOBS = ["外卖骑手", "互联网打工人", "考公备考生", "县城返乡青年"];
const LOCATIONS = ["城中村", "地铁站", "写字楼", "夜市", "旧工业区", "高架桥下"];
const SECTS = [
  { id: "logistics", name: "物流突击队", bonus: { atk: 2, hp: 4 } },
  { id: "nightschool", name: "夜校互助会", bonus: { maxMp: 6, mp: 6 } },
  { id: "coder", name: "代码搬运组", bonus: { def: 2, atk: 1 } }
];
const PERKS = [
  { id: "burst", name: "加班爆发", bonus: { atk: 3 } },
  { id: "guard", name: "抗压护体", bonus: { def: 2 } },
  { id: "fortune", name: "节流达人", bonus: { goldGain: 1.25 } }
];

const SUPPORTED_ACTIONS = ["new", "status", "draw", "play", "choose"];

const CARD_POOL = [
  {
    id: "job-sprint",
    title: "冲刺投递",
    tag: "求职",
    text: "集中投简历，争取尽快拿到面试。",
    apply(run, rng, push) {
      run.city.fatigue += 3;
      run.city.morale -= 1;
      run.signals.jobhunt += 2;
      push("你集中投递简历，短期精力透支。", true);
    }
  },
  {
    id: "cash-defense",
    title: "现金防线",
    tag: "房贷",
    text: "压缩开支，优先保住现金流。",
    apply(run, rng, push) {
      run.city.debt = Math.max(0, run.city.debt - randInt(rng, 6, 16));
      run.city.morale -= 1;
      run.signals.mortgage += 2;
      push("你把现金优先级拉满，房贷压力暂缓。", true);
    }
  },
  {
    id: "family-night",
    title: "家庭夜班",
    tag: "育儿",
    text: "夜里照护家庭，白天继续硬扛。",
    apply(run, rng, push) {
      run.city.fatigue += 5;
      run.city.morale += 2;
      run.signals.parenting += 2;
      run.story.familyCareTurns += 1;
      push("你扛下家庭夜班，情绪稳定但疲劳累积。", true);
    }
  },
  {
    id: "evidence-save",
    title: "证据留存",
    tag: "法律",
    text: "提前存档聊天记录和监控截图。",
    apply(run, rng, push) {
      run.city.heat = Math.max(0, run.city.heat - 2);
      run.signals.legal += 2;
      run.flags.legalPrepared = true;
      push("你做了证据留存，后续法律风险可控性提升。", true);
    }
  },
  {
    id: "skills-up",
    title: "技能补强",
    tag: "成长",
    text: "挤出时间学习，赌下一波机会。",
    apply(run, rng, push) {
      gainExp(run, randInt(rng, 10, 20), push);
      run.city.fatigue += 3;
      run.signals.jobhunt += 1;
      run.signals.unemployment += 1;
      push("你补强技能，后续求职链成功率上升。", true);
    }
  },
  {
    id: "rest-halfday",
    title: "半日休整",
    tag: "恢复",
    text: "今天慢一点，先把状态拉回安全线。",
    apply(run, rng, push) {
      run.player.hp = Math.min(run.player.maxHp, run.player.hp + randInt(rng, 6, 15));
      run.city.fatigue = Math.max(0, run.city.fatigue - 7);
      run.city.morale += 3;
      run.city.debt += 3;
      push("你选择休整，身体恢复但现金流更紧。", true);
    }
  },
  {
    id: "public-noise",
    title: "舆情发声",
    tag: "热度",
    text: "主动发声争取支持，但热度波动更大。",
    apply(run, rng, push) {
      run.city.heat += randInt(rng, 4, 10);
      run.city.morale += 1;
      run.signals.legal += 1;
      run.signals.jobhunt += 1;
      push("你主动发声，热度与外部风险同步上升。", true);
    }
  },
  {
    id: "side-gig",
    title: "副业冲刺",
    tag: "收入",
    text: "短期拼副业，快速回点现金。",
    apply(run, rng, push) {
      const gain = Math.floor(randInt(rng, 16, 42) * (run.player.goldGain || 1));
      run.player.gold += gain;
      run.city.fatigue += 4;
      run.city.morale -= 1;
      run.signals.unemployment += 1;
      push(`你拼副业拿到 ${gain} 金币。`, true);
    }
  },
  {
    id: "mortgage-call",
    title: "银行协商",
    tag: "房贷",
    text: "与银行沟通展期和月供重算。",
    when(run) {
      return run.city.debt >= 90;
    },
    apply(run, rng, push) {
      run.city.debt = Math.max(0, run.city.debt - randInt(rng, 10, 20));
      run.city.fatigue += 2;
      run.signals.mortgage += 3;
      push("你与银行协商，账单压力短期缓和。", true);
    }
  },
  {
    id: "parenting-budget",
    title: "托育预算",
    tag: "育儿",
    text: "重新核算托育费用，避免连续失控。",
    when(run) {
      return run.story.lifeStage !== "初入社会";
    },
    apply(run, rng, push) {
      run.city.debt += 4;
      run.city.fatigue -= 2;
      run.city.morale += 2;
      run.signals.parenting += 2;
      push("你调整托育预算，家庭运转稍微顺畅。", true);
    }
  }
];

function defaultRandom() {
  return Math.random();
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[randInt(rng, 0, arr.length - 1)];
}

function pushLog(run, text) {
  run.log.push(text);
  if (run.log.length > 80) run.log = run.log.slice(-80);
}

function setLifeStage(run) {
  if (run.day >= 28) run.story.lifeStage = "中年托举";
  else if (run.day >= 18) run.story.lifeStage = "成家阶段";
  else if (run.day >= 10) run.story.lifeStage = "职场分流";
  else run.story.lifeStage = "初入社会";
}

function gainExp(run, amount, push) {
  const p = run.player;
  p.exp += amount;
  while (p.exp >= p.nextExp) {
    p.exp -= p.nextExp;
    p.level += 1;
    p.nextExp += 26;
    p.maxHp += 8;
    p.hp = p.maxHp;
    p.maxMp += 4;
    p.mp = p.maxMp;
    p.atk += 2;
    p.def += 1;
    push(`升级到 Lv.${p.level}，状态恢复。`);
  }
}

function maybeOpenChoice(run) {
  const p = run.player;
  if (!run.flags.sectChosen && p.level >= 2) {
    run.pendingChoice = {
      type: "sect",
      title: "选择组织",
      options: SECTS.map((s) => ({ id: s.id, label: s.name }))
    };
    return true;
  }
  if (!run.flags.perkChosen && p.level >= 4) {
    run.pendingChoice = {
      type: "perk",
      title: "选择天赋",
      options: PERKS.map((s) => ({ id: s.id, label: s.name }))
    };
    return true;
  }
  return false;
}

function applyChoice(run, option) {
  if (!run.pendingChoice) return "当前没有待选择项。";

  if (run.pendingChoice.type === "sect") {
    const picked = SECTS.find((s) => s.id === option);
    if (!picked) return "无效组织选项。";
    run.player.sect = picked.name;
    run.player.atk += picked.bonus.atk || 0;
    run.player.def += picked.bonus.def || 0;
    run.player.maxHp += picked.bonus.hp || 0;
    run.player.hp += picked.bonus.hp || 0;
    run.player.maxMp += picked.bonus.maxMp || 0;
    run.player.mp += picked.bonus.mp || 0;
    run.flags.sectChosen = true;
    pushLog(run, `你加入了 ${picked.name}。`);
  } else if (run.pendingChoice.type === "perk") {
    const picked = PERKS.find((s) => s.id === option);
    if (!picked) return "无效天赋选项。";
    run.player.perk = picked.name;
    run.player.atk += picked.bonus.atk || 0;
    run.player.def += picked.bonus.def || 0;
    run.player.goldGain = picked.bonus.goldGain || run.player.goldGain;
    run.flags.perkChosen = true;
    pushLog(run, `你掌握了天赋 ${picked.name}。`);
  }

  run.pendingChoice = null;
  return "选择已生效。";
}

function chainState() {
  return {
    unemployment: { active: false, stage: 0, done: false },
    mortgage: { active: false, stage: 0, done: false },
    parenting: { active: false, stage: 0, done: false },
    legal: { active: false, stage: 0, done: false },
    jobhunt: { active: false, stage: 0, done: false }
  };
}

function activateChain(run, id) {
  const c = run.chains[id];
  if (!c || c.done || c.active) return false;
  c.active = true;
  c.stage = 1;
  return true;
}

function completeChain(run, id, ending) {
  const c = run.chains[id];
  if (!c) return;
  c.active = false;
  c.done = true;
  c.ending = ending;
}

function pushMajorEvent(run, text) {
  pushLog(run, `【关键事件】${text}`);
  run.metrics.keyEvents += 1;
}

function maybeActivateChains(run, rng) {
  if (run.signals.unemployment >= 3 || run.city.debt >= 110) {
    if (activateChain(run, "unemployment")) pushMajorEvent(run, "失业预警：组织调整传到你所在小组。");
  }
  if (run.signals.mortgage >= 3 || run.city.debt >= 120) {
    if (activateChain(run, "mortgage")) pushMajorEvent(run, "房贷抬升：月供重算通知到达。");
  }
  if (run.signals.parenting >= 3 || run.story.familyCareTurns >= 3) {
    if (activateChain(run, "parenting")) pushMajorEvent(run, "育儿挤压：托育与上班时间冲突。");
  }
  if (run.signals.legal >= 3 || run.city.heat >= 68) {
    if (activateChain(run, "legal")) pushMajorEvent(run, "法律风波：一次公共争议开始发酵。");
  }
  if (run.signals.jobhunt >= 3 || run.chains.unemployment.active) {
    if (activateChain(run, "jobhunt")) pushMajorEvent(run, "求职循环：面试与回绝同时到来。");
  }

  if (rng() < 0.06 && run.story.lifeStage === "成家阶段") {
    run.story.familyCareTurns += 1;
  }
}

function runChainStage(run, id, rng) {
  const c = run.chains[id];
  if (!c || !c.active || c.done) return false;

  const successBase = run.player.level + run.player.intensity;
  if (id === "unemployment") {
    if (c.stage === 1) {
      run.city.morale -= 6;
      run.city.debt += 8;
      pushMajorEvent(run, "失业链S1：你进入待岗名单，收入预期下降。");
      c.stage = 2;
      return true;
    }
    if (c.stage === 2) {
      if (successBase + run.player.level + randInt(rng, 0, 8) >= 14) {
        run.player.gold += randInt(rng, 20, 50);
        run.city.morale += 2;
        pushMajorEvent(run, "失业链S2：补偿到账并拿到面试机会。");
      } else {
        run.city.morale -= 4;
        run.city.debt += 10;
        pushMajorEvent(run, "失业链S2：连续回绝，现金流继续恶化。");
      }
      c.stage = 3;
      return true;
    }
    if (c.stage === 3) {
      if (run.player.level + randInt(rng, 0, 10) >= 8) {
        run.player.gold += randInt(rng, 28, 76);
        run.city.debt = Math.max(0, run.city.debt - 14);
        run.city.morale += 6;
        completeChain(run, id, "再就业");
        pushMajorEvent(run, "失业链S3：你成功再就业，链路收束。");
      } else {
        run.city.fatigue += 4;
        run.city.debt += 8;
        completeChain(run, id, "灵活用工");
        pushMajorEvent(run, "失业链S3：转入灵活用工，稳定性不足。");
      }
      return true;
    }
  }

  if (id === "mortgage") {
    if (c.stage === 1) {
      run.city.debt += 12;
      run.city.morale -= 3;
      pushMajorEvent(run, "房贷链S1：月供上涨，家庭预算被迫重排。");
      c.stage = 2;
      return true;
    }
    if (c.stage === 2) {
      if (run.player.gold >= 90 || randInt(rng, 0, 10) >= 6) {
        run.city.debt = Math.max(0, run.city.debt - 18);
        run.player.gold = Math.max(0, run.player.gold - randInt(rng, 20, 48));
        pushMajorEvent(run, "房贷链S2：完成展期协商，短期稳住。");
      } else {
        run.city.debt += 16;
        run.city.heat += 5;
        pushMajorEvent(run, "房贷链S2：协商失败，逾期风险上升。");
      }
      c.stage = 3;
      return true;
    }
    if (c.stage === 3) {
      if (run.city.debt < 170) {
        run.city.morale += 4;
        completeChain(run, id, "稳住月供");
        pushMajorEvent(run, "房贷链S3：断供风险解除。");
      } else {
        run.player.gold = Math.max(0, run.player.gold - Math.floor(run.player.gold * 0.35));
        run.city.morale -= 5;
        completeChain(run, id, "资产调整");
        pushMajorEvent(run, "房贷链S3：被迫出售资产保现金流。");
      }
      return true;
    }
  }

  if (id === "parenting") {
    if (c.stage === 1) {
      run.city.fatigue += 7;
      run.city.morale -= 2;
      pushMajorEvent(run, "育儿链S1：托育排队拉长，作息被打乱。");
      c.stage = 2;
      return true;
    }
    if (c.stage === 2) {
      if (run.player.gold >= 80 || randInt(rng, 0, 10) >= 5) {
        run.city.fatigue = Math.max(0, run.city.fatigue - 6);
        run.city.debt += 5;
        run.city.morale += 3;
        pushMajorEvent(run, "育儿链S2：托育支持到位，节奏缓和。");
      } else {
        run.city.fatigue += 8;
        run.city.debt += 8;
        run.player.hp = Math.max(0, run.player.hp - randInt(rng, 3, 9));
        pushMajorEvent(run, "育儿链S2：无人接替，连续透支。");
      }
      c.stage = 3;
      return true;
    }
    if (c.stage === 3) {
      if (run.city.fatigue < 78) {
        run.city.morale += 6;
        completeChain(run, id, "协作稳定");
        pushMajorEvent(run, "育儿链S3：家庭协作成型。");
      } else {
        run.city.morale -= 4;
        run.city.debt += 6;
        completeChain(run, id, "持续硬扛");
        pushMajorEvent(run, "育儿链S3：进入长期硬扛阶段。");
      }
      return true;
    }
  }

  if (id === "legal") {
    if (c.stage === 1) {
      run.city.heat += 8;
      run.city.morale -= 4;
      pushMajorEvent(run, "法律链S1：争议视频扩散，舆情升温。");
      c.stage = 2;
      return true;
    }
    if (c.stage === 2) {
      if (run.flags.legalPrepared) {
        run.city.heat = Math.max(0, run.city.heat - 7);
        run.city.morale += 2;
        pushMajorEvent(run, "法律链S2：证据提交后，风险开始回落。");
      } else {
        run.player.gold = Math.max(0, run.player.gold - randInt(rng, 18, 45));
        run.city.heat += 6;
        run.city.morale -= 3;
        pushMajorEvent(run, "法律链S2：证据不足，处置成本上升。");
      }
      c.stage = 3;
      return true;
    }
    if (c.stage === 3) {
      if (run.flags.legalPrepared || randInt(rng, 0, 10) >= 6) {
        run.city.heat = Math.max(0, run.city.heat - 10);
        run.city.morale += 5;
        completeChain(run, id, "平反");
        pushMajorEvent(run, "法律链S3：监控与证据还原，链路收束。");
      } else {
        run.player.gold = Math.max(0, run.player.gold - randInt(rng, 30, 70));
        run.city.debt += 12;
        completeChain(run, id, "和解止损");
        pushMajorEvent(run, "法律链S3：和解止损，财富承压。");
      }
      return true;
    }
  }

  if (id === "jobhunt") {
    if (c.stage === 1) {
      run.city.fatigue += 3;
      run.city.morale -= 2;
      pushMajorEvent(run, "求职链S1：连续笔试开启，节奏拉满。");
      c.stage = 2;
      return true;
    }
    if (c.stage === 2) {
      if (run.player.level >= 3 || randInt(rng, 0, 10) >= 5) {
        gainExp(run, randInt(rng, 12, 22), (t) => pushLog(run, t));
        run.player.gold += randInt(rng, 12, 30);
        run.city.morale += 3;
        pushMajorEvent(run, "求职链S2：拿到二面，信心回升。");
      } else {
        run.city.morale -= 5;
        run.city.fatigue += 3;
        pushMajorEvent(run, "求职链S2：一轮游，继续投递。");
      }
      c.stage = 3;
      return true;
    }
    if (c.stage === 3) {
      if (run.city.morale >= 25 && randInt(rng, 0, 10) >= 4) {
        run.player.gold += randInt(rng, 18, 44);
        run.city.debt = Math.max(0, run.city.debt - 10);
        completeChain(run, id, "岗位落地");
        pushMajorEvent(run, "求职链S3：拿到 offer，链路结束。");
      } else {
        run.city.morale -= 4;
        run.city.debt += 6;
        completeChain(run, id, "继续等待");
        pushMajorEvent(run, "求职链S3：继续等待，窗口未开。");
      }
      return true;
    }
  }

  return false;
}

function maybeRunChainEvent(run, rng) {
  maybeActivateChains(run, rng);
  const order = ["unemployment", "mortgage", "parenting", "legal", "jobhunt"];
  for (let i = 0; i < order.length; i += 1) {
    const id = order[i];
    if (run.chains[id] && run.chains[id].active) {
      return runChainStage(run, id, rng);
    }
  }
  return false;
}

function applyPressure(run) {
  run.city.fatigue += 2;
  run.city.debt += 1;
  run.city.morale -= 1;
  run.player.hp = Math.max(0, run.player.hp - Math.max(0, Math.floor((run.city.fatigue - 60) / 20)));
  run.city.heat = Math.max(0, run.city.heat - 1);
}

function maybeMinorIncident(run, rng) {
  const roll = rng();
  if (roll < 0.08) {
    run.metrics.battles += 1;
    const hit = randInt(rng, 3, 9);
    run.player.hp = Math.max(0, run.player.hp - hit);
    pushLog(run, `路口冲突造成 ${hit} 点损耗。`);
    return;
  }
  if (roll < 0.2) {
    run.metrics.events += 1;
    const delta = randInt(rng, -8, 20);
    run.player.gold = Math.max(0, run.player.gold + delta);
    pushLog(run, `零碎事务结算，现金变化 ${delta >= 0 ? "+" : ""}${delta}。`);
  }
}

function endIfNeeded(run) {
  if (run.player.hp <= 0) {
    run.player.hp = 0;
    run.mode = "ended";
    pushLog(run, "生命线归零，本局结束。");
    return true;
  }
  if (run.city.morale <= 0) {
    run.mode = "ended";
    pushLog(run, "精神线归零，本局结束。");
    return true;
  }
  if (run.city.fatigue >= 100) {
    run.mode = "ended";
    pushLog(run, "疲劳线归零，本局结束。");
    return true;
  }
  if (run.city.debt >= 260) {
    run.mode = "ended";
    pushLog(run, "债务线归零，本局结束。");
    return true;
  }
  if (run.day >= 36) {
    run.mode = "ended";
    pushLog(run, "你坚持到了人生阶段终盘，成功收官。");
    return true;
  }
  return false;
}

function applyCard(run, card, rng) {
  const localLogs = [];
  const push = (text, major) => {
    if (major) run.metrics.keyEvents += 1;
    localLogs.push(text);
  };
  card.apply(run, rng, push);
  run.metrics.cardPlays += 1;
  run.lastPlayedCard = card.id;
  for (let i = 0; i < localLogs.length; i += 1) pushLog(run, localLogs[i]);
}

function drawCards(run, rng) {
  const list = CARD_POOL.filter((c) => (typeof c.when === "function" ? c.when(run) : true));
  const pool = list.slice();
  const hand = [];
  while (pool.length && hand.length < 3) {
    const idx = randInt(rng, 0, pool.length - 1);
    hand.push(pool[idx]);
    pool.splice(idx, 1);
  }
  run.hand = hand.map((c) => ({ id: c.id, title: c.title, tag: c.tag, text: c.text }));
}

function resolveAfterPlay(run, rng) {
  run.turn += 1;
  if (run.turn % 8 === 0) run.day += 1;
  setLifeStage(run);
  run.location = pick(rng, LOCATIONS);

  applyPressure(run);
  maybeMinorIncident(run, rng);
  maybeRunChainEvent(run, rng);

  run.signals.unemployment = Math.max(0, run.signals.unemployment - 1);
  run.signals.mortgage = Math.max(0, run.signals.mortgage - 1);
  run.signals.parenting = Math.max(0, run.signals.parenting - 1);
  run.signals.legal = Math.max(0, run.signals.legal - 1);
  run.signals.jobhunt = Math.max(0, run.signals.jobhunt - 1);

  maybeOpenChoice(run);
  endIfNeeded(run);
}

function createRun(rng, name) {
  const profession = pick(rng, JOBS);
  const playerName = name && String(name).trim() ? String(name).trim() : `打工人${randInt(rng, 100, 999)}`;
  const run = {
    mode: "running",
    turn: 0,
    day: 1,
    location: pick(rng, LOCATIONS),
    pendingChoice: null,
    hand: [],
    lastPlayedCard: null,
    flags: { sectChosen: false, perkChosen: false, legalPrepared: false },
    metrics: { cardPlays: 0, keyEvents: 0, battles: 0, events: 0 },
    story: { lifeStage: "初入社会", familyCareTurns: 0 },
    signals: { unemployment: 0, mortgage: 0, parenting: 0, legal: 0, jobhunt: 0 },
    chains: chainState(),
    city: { morale: 60, fatigue: 22, debt: 72, heat: 12 },
    log: ["你在城市夜色中醒来，准备打出第一张牌。"],
    player: {
      name: playerName,
      profession,
      level: 1,
      intensity: 2,
      exp: 0,
      nextExp: 40,
      hp: 62,
      maxHp: 62,
      mp: 20,
      maxMp: 20,
      atk: 10,
      def: 4,
      gold: 56,
      sect: null,
      perk: null,
      goldGain: 1
    }
  };
  drawCards(run, rng);
  return run;
}

function runAction(rng, payload) {
  const { action = "status", run, option, cardId, name } = payload || {};
  let currentRun = run || null;
  let message = "";

  if (action === "new" || !currentRun) {
    currentRun = createRun(rng, name);
    message = "新局已创建并发放手牌。";
  } else if (action === "status") {
    message = "状态读取成功。";
  } else if (action === "choose") {
    message = applyChoice(currentRun, option);
    if (currentRun.mode === "running" && !currentRun.pendingChoice && (!currentRun.hand || !currentRun.hand.length)) {
      drawCards(currentRun, rng);
    }
  } else if (action === "draw") {
    if (currentRun.mode !== "running") {
      message = "本局已结束。";
    } else if (currentRun.pendingChoice) {
      message = "存在关键抉择，请先 choose。";
    } else if (currentRun.hand && currentRun.hand.length) {
      message = "当前已有手牌。";
    } else {
      drawCards(currentRun, rng);
      message = "已发放新手牌。";
    }
  } else if (action === "play") {
    if (currentRun.mode !== "running") {
      message = "本局已结束。";
    } else if (currentRun.pendingChoice) {
      message = "存在关键抉择，请先 choose。";
    } else if (!currentRun.hand || !currentRun.hand.length) {
      message = "当前无可用手牌，请先 draw。";
    } else {
      const id = cardId || option;
      const handCard = currentRun.hand.find((c) => c.id === id);
      if (!handCard) {
        return {
          ok: false,
          statusCode: 400,
          error: "无效 cardId",
          hand: currentRun.hand
        };
      }
      const cardDef = CARD_POOL.find((c) => c.id === handCard.id);
      applyCard(currentRun, cardDef, rng);
      currentRun.hand = [];
      resolveAfterPlay(currentRun, rng);
      if (currentRun.mode === "running" && !currentRun.pendingChoice) {
        drawCards(currentRun, rng);
      }
      message = `已打出卡牌 ${handCard.title}。`;
    }
  } else {
    return {
      ok: false,
      statusCode: 400,
      error: "不支持的 action",
      supported: SUPPORTED_ACTIONS
    };
  }

  return {
    ok: true,
    statusCode: 200,
    payload: {
      success: true,
      action,
      message,
      run: currentRun,
      supportedActions: SUPPORTED_ACTIONS
    }
  };
}

function createMudService(opts) {
  const random = opts && typeof opts.random === "function" ? opts.random : defaultRandom;
  return {
    runAction: (payload) => runAction(random, payload),
    constants: { JOBS, LOCATIONS, SECTS, PERKS, SUPPORTED_ACTIONS }
  };
}

module.exports = {
  createMudService
};
