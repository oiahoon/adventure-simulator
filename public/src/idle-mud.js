(function () {
  const professions = [
    { id: "swordsman", name: "剑客", mod: { str: 2, agi: 1, vit: 1, int: 0, spi: 0, luk: 0 }, skill: "破军斩" },
    { id: "monk", name: "武僧", mod: { str: 1, agi: 1, vit: 2, int: 0, spi: 1, luk: -1 }, skill: "金钟护体" },
    { id: "scholar", name: "策士", mod: { str: -1, agi: 0, vit: 0, int: 3, spi: 1, luk: 0 }, skill: "奇门推演" },
    { id: "ranger", name: "游侠", mod: { str: 0, agi: 2, vit: 0, int: 0, spi: 0, luk: 2 }, skill: "追风箭" }
  ];

  const sects = [
    { id: "qingshan", name: "青山剑宗", bonus: { str: 2, agi: 1 }, desc: "剑招稳定，伤害提升。" },
    { id: "lingyin", name: "灵隐禅院", bonus: { vit: 2, spi: 2 }, desc: "生命与回复能力提升。" },
    { id: "tianji", name: "天机阁", bonus: { int: 2, luk: 2 }, desc: "奇遇概率与收益提升。" }
  ];

  const skills = [
    { id: "burst", name: "爆发", desc: "战斗首回合额外造成 8 点伤害。" },
    { id: "guard", name: "坚守", desc: "每回合减少 3 点受到的伤害。" },
    { id: "fortune", name: "鸿运", desc: "拾取金币和道具时额外 +30%。" }
  ];

  const chapters = [
    { id: 1, name: "地铁开局", minLevel: 1, mission: "在早高峰活下来并找到第一份委托" },
    { id: 2, name: "社群立足", minLevel: 2, mission: "加入流派群聊并拿下首个口碑任务" },
    { id: 3, name: "算法暗潮", minLevel: 3, mission: "追查热搜背后的异动并连胜三场" },
    { id: 4, name: "技能转职", minLevel: 4, mission: "完成关键抉择，定下职业成长分支" },
    { id: 5, name: "夜城远征", minLevel: 5, mission: "在商圈与边区维持补给和声望平衡" },
    { id: 6, name: "高楼风云", minLevel: 6, mission: "锁定终局敌人并抢占制高点" },
    { id: 7, name: "停电前夜", minLevel: 7, mission: "集齐终局物资，准备最终直播战" },
    { id: 8, name: "全城终局", minLevel: 8, mission: "击败血煞教主或在聚光灯下陨落" }
  ];

  const chapterQuestBook = {
    1: [
      { id: "c1-1", text: "完成 2 次城市移动", req: { travels: 2 } },
      { id: "c1-2", text: "击败 1 名街头敌人", req: { victories: 1 } },
      { id: "c1-3", text: "累计拾取 1 次补给", req: { loots: 1 } },
      { id: "c1-4", text: "触发 1 次随机事件", req: { randomEvents: 1 } }
    ],
    2: [
      { id: "c2-1", text: "完成门派抉择", req: { choices: 1 } },
      { id: "c2-2", text: "累计 3 场战斗", req: { battles: 3 } },
      { id: "c2-3", text: "触发 2 次城市随机事件", req: { randomEvents: 2 } },
      { id: "c2-4", text: "完成 1 次支线任务", req: { sideQuestCompletions: 1 } }
    ],
    3: [
      { id: "c3-1", text: "连胜推进到 4 场胜利", req: { victories: 4 } },
      { id: "c3-2", text: "完成 1 次商店补给", req: { shops: 1 } },
      { id: "c3-3", text: "累计触发 1 次稀有事件", req: { rareEvents: 1 } },
      { id: "c3-4", text: "累计 5 次城市移动", req: { travels: 5 } }
    ],
    4: [
      { id: "c4-1", text: "完成进阶天赋抉择", req: { choices: 2 } },
      { id: "c4-2", text: "达到 Lv.4", req: { level: 4 } },
      { id: "c4-3", text: "累计 6 场胜利", req: { victories: 6 } },
      { id: "c4-4", text: "累计完成 2 次支线", req: { sideQuestCompletions: 2 } }
    ],
    5: [
      { id: "c5-1", text: "在城市边区间穿梭 8 次", req: { travels: 8 } },
      { id: "c5-2", text: "完成 2 次支线任务", req: { sideQuestCompletions: 2 } },
      { id: "c5-3", text: "累计 2 次稀有事件", req: { rareEvents: 2 } },
      { id: "c5-4", text: "累计 8 场胜利", req: { victories: 8 } }
    ],
    6: [
      { id: "c6-1", text: "推进至古战场并获胜 8 场", req: { victories: 8 } },
      { id: "c6-2", text: "累计 10 场战斗", req: { battles: 10 } },
      { id: "c6-3", text: "累计 3 次关键抉择/支线抉择", req: { choices: 2, sideQuestCompletions: 3 } },
      { id: "c6-4", text: "累计触发 3 次稀有事件", req: { rareEvents: 3 } }
    ],
    7: [
      { id: "c7-1", text: "角色达到 Lv.7", req: { level: 7 } },
      { id: "c7-2", text: "累计完成 4 次支线任务", req: { sideQuestCompletions: 4 } },
      { id: "c7-3", text: "累计触发 3 次稀有事件", req: { rareEvents: 3 } },
      { id: "c7-4", text: "累计 12 场战斗", req: { battles: 12 } }
    ],
    8: [{ id: "c8-1", text: "击败血煞教主完成全城终局", req: { bossDefeated: true } }]
  };

  const sideQuestTemplates = [
    { id: "sq-rider", title: "外卖护送", text: "护送骑手穿过晚高峰。", req: { travels: 3 }, reward: { gold: 50, exp: 18 } },
    { id: "sq-group", title: "群聊答疑", text: "在群里给出可执行方案。", req: { randomEvents: 2 }, reward: { exp: 26, int: 1 } },
    { id: "sq-deadline", title: "临时加班", text: "在截止前打完两场硬仗。", req: { battles: 2, victories: 1 }, reward: { gold: 36, vit: 1 } },
    { id: "sq-night", title: "夜路代驾", text: "凌晨完成夜城跑图。", req: { travels: 4 }, reward: { gold: 62, luk: 1 } },
    { id: "sq-hotsearch", title: "热搜反击", text: "以胜场和事件覆盖负面话题。", req: { victories: 2, rareEvents: 1 }, reward: { exp: 40, spi: 1 } },
    { id: "sq-campus", title: "社团返场", text: "回母校分享你的都市生存法。", req: { loots: 2, randomEvents: 1 }, reward: { gold: 30, exp: 22 } },
    { id: "sq-interview", title: "反向面试二周目", text: "继续在面试战场存活。", req: { randomEvents: 3, battles: 1 }, reward: { int: 1, spi: 1, exp: 28 } },
    { id: "sq-stream", title: "直播连麦", text: "完成一场不翻车的连麦挑战。", req: { victories: 2, randomEvents: 1 }, reward: { gold: 70, exp: 35 } },
    { id: "sq-rent", title: "月底房租", text: "在发薪前凑够本月房租。", req: { loots: 2, victories: 1 }, reward: { gold: 85, exp: 26 } },
    { id: "sq-family", title: "家庭支援", text: "寄一笔钱回家并维持本周状态。", req: { travels: 2, shops: 1 }, reward: { spi: 1, gold: 48, exp: 22 } },
    { id: "sq-hospital", title: "深夜陪诊", text: "跑完夜路后还要去医院排号。", req: { travels: 3, randomEvents: 2 }, reward: { vit: 1, exp: 34 } },
    { id: "sq-training", title: "技能证书", text: "白天打工晚上备考，争取一张证书。", req: { battles: 2, randomEvents: 2 }, reward: { int: 1, exp: 38 } },
    { id: "sq-neighbor", title: "邻里互助", text: "帮邻居搬家后继续上夜班。", req: { travels: 3, victories: 1 }, reward: { gold: 40, vit: 1 } },
    { id: "sq-delivery-peak", title: "高峰单王", text: "在晚高峰连续扛住两轮压力。", req: { battles: 3, loots: 1 }, reward: { gold: 78, agi: 1 } },
    { id: "sq-night-school", title: "夜校复读", text: "下班后再去夜校上一节硬课。", req: { randomEvents: 3 }, reward: { int: 1, spi: 1, exp: 30 } }
  ];

  const achievementBook = [
    { id: "ach-win", title: "终局幸存者", desc: "击败终局敌人完成通关。", when: "win", check: () => true },
    { id: "ach-last-stand", title: "最后一班地铁", desc: "在终局前夕倒下。", when: "lose", check: () => state.story.chapterId >= 7 },
    { id: "ach-relentless", title: "打不垮的上班人", desc: "总战斗场次达到 15。", when: "any", check: () => state.metrics.battles >= 15 },
    { id: "ach-side-master", title: "兼职永动机", desc: "完成至少 6 条支线。", when: "any", check: () => state.metrics.sideQuestCompletions >= 6 },
    { id: "ach-rare", title: "离谱见证者", desc: "触发至少 5 次稀有事件。", when: "any", check: () => state.metrics.rareEvents >= 5 },
    { id: "ach-frugal", title: "精打细算", desc: "通关时金币不低于 300。", when: "win", check: () => state.player.gold >= 300 },
    { id: "ach-courage", title: "逆风赶路人", desc: "死亡时胜场不低于 10。", when: "lose", check: () => state.metrics.victories >= 10 },
    { id: "ach-solidarity", title: "人间互助网", desc: "累计触发随机事件达到 12。", when: "any", check: () => state.metrics.randomEvents >= 12 },
    { id: "ach-mainline", title: "主线通勤王", desc: "主线节点完成数达到 20。", when: "any", check: () => countMainlineCompleted() >= 20 },
    { id: "ach-steady", title: "扛压体质", desc: "最终等级达到 9 级。", when: "any", check: () => state.player.level >= 9 }
  ];

  const locations = [
    { id: "novice", name: "新手村", type: "town", x: 120, y: 280 },
    { id: "forest", name: "落叶林", type: "wild", x: 260, y: 230 },
    { id: "market", name: "青石集", type: "town", x: 380, y: 280 },
    { id: "river", name: "寒水渡", type: "wild", x: 470, y: 190 },
    { id: "ruins", name: "古战场", type: "wild", x: 560, y: 105 }
  ];

  const links = [
    ["novice", "forest"],
    ["forest", "market"],
    ["forest", "river"],
    ["market", "river"],
    ["river", "ruins"]
  ];

  const boss = { name: "血煞教主", hp: 130, atk: 20, rewardExp: 240, rewardGold: 180 };

  const state = {
    mode: "menu",
    player: null,
    turn: 0,
    day: 1,
    speed: 1,
    currentLocation: "novice",
    isPaused: false,
    pendingChoice: null,
    seed: "",
    rng: null,
    initialSeedFromUrl: null,
    story: {
      chapterId: 1,
      milestones: [],
      majorChoices: [],
      stance: 0,
      mainlineProgress: {},
      activeSideQuest: null
    },
    metrics: {
      battles: 0,
      victories: 0,
      travels: 0,
      shops: 0,
      loots: 0,
      randomEvents: 0,
      rareEvents: 0,
      chapterAdvances: 0,
      sideQuestCompletions: 0
    },
    runResult: null,
    flags: {
      sectChosen: false,
      skillChosen: false,
      bossDefeated: false
    },
    log: []
  };

  let rafId = 0;
  let rafLast = 0;
  let turnAccumulator = 0;

  const els = {
    rerollBtn: document.getElementById("reroll-btn"),
    startBtn: document.getElementById("start-btn"),
    pauseBtn: document.getElementById("pause-btn"),
    resumeBtn: document.getElementById("resume-btn"),
    shareCardBtn: document.getElementById("share-card-btn"),
    copyShareBtn: document.getElementById("copy-share-btn"),
    copyLinkBtn: document.getElementById("copy-link-btn"),
    speedSelect: document.getElementById("speed-select"),
    log: document.getElementById("log"),
    sheet: document.getElementById("character-sheet"),
    endingSheet: document.getElementById("ending-sheet"),
    canvas: document.getElementById("world-canvas"),
    shareCanvas: document.getElementById("share-canvas"),
    downloadShareLink: document.getElementById("download-share-link"),
    choiceModal: document.getElementById("choice-modal"),
    choiceTitle: document.getElementById("choice-title"),
    choiceBody: document.getElementById("choice-body"),
    choiceOptions: document.getElementById("choice-options")
  };

  const ctx = els.canvas.getContext("2d");
  const shareCtx = els.shareCanvas.getContext("2d");

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeSeedString() {
    return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e8).toString(36)}`;
  }

  function readSeedFromUrl() {
    const seed = new URLSearchParams(window.location.search).get("seed");
    return seed && seed.trim() ? seed.trim() : null;
  }

  function resetRng(seedString) {
    state.seed = seedString;
    state.rng = mulberry32(hashSeed(seedString));
  }

  function random() {
    return state.rng ? state.rng() : Math.random();
  }

  function randInt(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function roll3d6() {
    return randInt(1, 6) + randInt(1, 6) + randInt(1, 6);
  }

  function makeName() {
    const first = ["沈", "陆", "萧", "叶", "顾", "林", "苏", "季", "温", "程"];
    const second = ["青", "秋", "夜", "岚", "霜", "云", "舟", "尘", "明", "涯"];
    const third = ["行", "歌", "远", "川", "默", "鸣", "山", "岳", "宁", "渊"];
    return `${pick(first)}${pick(second)}${pick(third)}`;
  }

  function locationById(id) {
    return locations.find((l) => l.id === id);
  }

  function chapterById(id) {
    return chapters.find((c) => c.id === id) || chapters[0];
  }

  function createPlayer() {
    const job = pick(professions);
    const stats = {
      str: roll3d6() + job.mod.str,
      agi: roll3d6() + job.mod.agi,
      vit: roll3d6() + job.mod.vit,
      int: roll3d6() + job.mod.int,
      spi: roll3d6() + job.mod.spi,
      luk: roll3d6() + job.mod.luk
    };

    const hpMax = 70 + stats.vit * 5;
    const mpMax = 24 + stats.spi * 3;

    return {
      name: makeName(),
      profession: job,
      stats,
      level: 1,
      exp: 0,
      nextExp: 70,
      hp: hpMax,
      hpMax,
      mp: mpMax,
      mpMax,
      gold: 40,
      potion: 1,
      sect: null,
      skill: job.skill,
      perk: null
    };
  }

  function addMilestone(text) {
    state.story.milestones.push(text);
    if (state.story.milestones.length > 14) {
      state.story.milestones = state.story.milestones.slice(-14);
    }
  }

  function addLog(message) {
    const stamp = `D${String(state.day).padStart(2, "0")} T${String(state.turn).padStart(3, "0")}`;
    state.log.push(`[${stamp}] ${message}`);
    if (state.log.length > 240) {
      state.log = state.log.slice(-240);
    }
    els.log.textContent = state.log.slice(-70).join("\n");
    els.log.scrollTop = els.log.scrollHeight;
  }

  function reqSatisfied(req) {
    const p = state.player;
    const checks = {
      level: p.level,
      battles: state.metrics.battles,
      victories: state.metrics.victories,
      travels: state.metrics.travels,
      shops: state.metrics.shops,
      loots: state.metrics.loots,
      randomEvents: state.metrics.randomEvents,
      rareEvents: state.metrics.rareEvents,
      choices: state.story.majorChoices.length,
      sideQuestCompletions: state.metrics.sideQuestCompletions
    };

    const keys = Object.keys(req || {});
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (key === "bossDefeated") {
        if (!!req[key] !== !!state.flags.bossDefeated) {
          return false;
        }
        continue;
      }
      if ((checks[key] || 0) < req[key]) {
        return false;
      }
    }
    return true;
  }

  function getCurrentMainlineTask() {
    const chapterId = state.story.chapterId;
    const list = chapterQuestBook[chapterId] || [];
    const idx = state.story.mainlineProgress[chapterId] || 0;
    return list[idx] || null;
  }

  function maybeProgressMainlineTask() {
    const chapterId = state.story.chapterId;
    const list = chapterQuestBook[chapterId] || [];
    if (!list.length) {
      return;
    }

    let idx = state.story.mainlineProgress[chapterId] || 0;
    while (idx < list.length && reqSatisfied(list[idx].req)) {
      addMilestone(`主线达成: ${list[idx].text}`);
      addLog(`主线节点完成: ${list[idx].text}`);
      idx += 1;
      state.story.mainlineProgress[chapterId] = idx;
    }
  }

  function getSideQuestProgressText(quest) {
    if (!quest) {
      return "无";
    }
    const parts = [];
    const req = quest.req;
    const baseline = quest.baseline;
    const entries = Object.keys(req);
    for (let i = 0; i < entries.length; i += 1) {
      const key = entries[i];
      const now = (state.metrics[key] || 0) - (baseline[key] || 0);
      parts.push(`${key}:${Math.max(0, now)}/${req[key]}`);
    }
    return parts.join(" ");
  }

  function maybeAssignSideQuest() {
    if (state.story.activeSideQuest || random() > 0.14) {
      return;
    }
    if (state.story.chapterId < 2) {
      return;
    }
    const tpl = pick(sideQuestTemplates);
    const baseline = {
      battles: state.metrics.battles,
      victories: state.metrics.victories,
      travels: state.metrics.travels,
      shops: state.metrics.shops,
      loots: state.metrics.loots,
      randomEvents: state.metrics.randomEvents,
      rareEvents: state.metrics.rareEvents
    };
    state.story.activeSideQuest = { ...tpl, baseline };
    addLog(`支线接取: ${tpl.title} - ${tpl.text}`);
  }

  function grantSideQuestReward(reward) {
    const p = state.player;
    if (reward.gold) {
      p.gold += reward.gold;
    }
    if (reward.exp) {
      gainExp(reward.exp);
    }
    if (reward.str) {
      p.stats.str += reward.str;
    }
    if (reward.agi) {
      p.stats.agi += reward.agi;
    }
    if (reward.vit) {
      p.stats.vit += reward.vit;
    }
    if (reward.int) {
      p.stats.int += reward.int;
    }
    if (reward.spi) {
      p.stats.spi += reward.spi;
    }
    if (reward.luk) {
      p.stats.luk += reward.luk;
    }
  }

  function maybeCompleteSideQuest() {
    const quest = state.story.activeSideQuest;
    if (!quest) {
      return false;
    }
    const req = quest.req;
    const baseline = quest.baseline;
    const keys = Object.keys(req);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const delta = (state.metrics[key] || 0) - (baseline[key] || 0);
      if (delta < req[key]) {
        return false;
      }
    }

    state.metrics.sideQuestCompletions += 1;
    grantSideQuestReward(quest.reward);
    addMilestone(`支线完成: ${quest.title}`);
    addLog(`支线完成: ${quest.title}，奖励已结算。`);
    state.story.activeSideQuest = null;
    return true;
  }

  function updateChapterProgress() {
    const p = state.player;
    let changed = false;
    while (state.story.chapterId < chapters.length) {
      const currentId = state.story.chapterId;
      const currentList = chapterQuestBook[currentId] || [];
      const currentDone = state.story.mainlineProgress[currentId] || 0;
      const currentReady = currentList.length === 0 || currentDone >= currentList.length;
      const next = chapterById(currentId + 1);
      if (!next) {
        break;
      }
      if (!currentReady || p.level < next.minLevel) {
        break;
      }
      state.story.chapterId = next.id;
      if (typeof state.story.mainlineProgress[next.id] !== "number") {
        state.story.mainlineProgress[next.id] = 0;
      }
      state.metrics.chapterAdvances += 1;
      addMilestone(`推进至第${next.id}章《${next.name}》`);
      addLog(`主线推进: 第${next.id}章《${next.name}》 - ${next.mission}`);
      changed = true;
    }
    if (changed) {
      maybeProgressMainlineTask();
    }
  }

  function formatSheet() {
    const p = state.player;
    if (!p) {
      return "尚未生成角色";
    }

    const loc = locationById(state.currentLocation);
    const modeText = state.mode === "ended" ? "已结束" : state.isPaused ? "暂停" : "运行中";
    const sectText = p.sect ? p.sect.name : "未选择";
    const perkText = p.perk ? p.perk.name : "未选择";
    const chapter = chapterById(state.story.chapterId);
    const mainlineTask = getCurrentMainlineTask();
    const sideQuest = state.story.activeSideQuest;

    return [
      `姓名: ${p.name}`,
      `职业: ${p.profession.name}`,
      `等级: ${p.level} 经验: ${p.exp}/${p.nextExp}`,
      `生命: ${p.hp}/${p.hpMax}`,
      `内力: ${p.mp}/${p.mpMax}`,
      `金币: ${p.gold} 药剂: ${p.potion}`,
      `地点: ${loc.name}`,
      `主线章节: 第${chapter.id}章《${chapter.name}》`,
      `当前主线: ${chapter.mission}`,
      `主线节点: ${mainlineTask ? mainlineTask.text : "本章已全部完成"}`,
      `当前支线: ${sideQuest ? `${sideQuest.title} (${getSideQuestProgressText(sideQuest)})` : "暂无"}`,
      "",
      "属性:",
      `力量 ${p.stats.str}  敏捷 ${p.stats.agi}  体魄 ${p.stats.vit}`,
      `智识 ${p.stats.int}  神识 ${p.stats.spi}  气运 ${p.stats.luk}`,
      "",
      `门派: ${sectText}`,
      `职业技能: ${p.skill}`,
      `进阶天赋: ${perkText}`,
      `世界种子: ${state.seed}`,
      "",
      `状态: ${modeText}`,
      `当前天数: ${state.day}`
    ].join("\n");
  }

  function formatEndingSheet() {
    const result = state.runResult;
    if (!result) {
      return "本局尚未结束";
    }

    return [
      `结局称号: ${result.title}`,
      `江湖评语: ${result.epitaph}`,
      `核心成绩: ${result.score} 分`,
      `通关状态: ${result.outcome}`,
      `最终章节: 第${result.finalChapter.id}章《${result.finalChapter.name}》`,
      `关键抉择: ${result.keyChoices || "无"}`,
      `主线节点完成: ${result.mainlineCompleted}`,
      `支线任务完成: ${result.sideQuestCompletions}`,
      `稀有遭遇: ${result.rareEvents} 次`,
      `成就数: ${result.achievements.length}`,
      "",
      "成就:",
      ...(result.achievements.length ? result.achievements.map((a) => `${a.title} - ${a.desc}`) : ["暂无"]),
      "",
      "里程碑:",
      ...result.milestones.slice(-5)
    ].join("\n");
  }

  function drawMap() {
    const width = els.canvas.width;
    const height = els.canvas.height;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#f8edd4");
    bg.addColorStop(1, "#dfcda9");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#9a835d";
    links.forEach(([a, b]) => {
      const from = locationById(a);
      const to = locationById(b);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    locations.forEach((loc) => {
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = loc.type === "town" ? "#3f6654" : "#875444";
      ctx.fill();

      ctx.fillStyle = "#fdf8ea";
      ctx.font = "12px serif";
      ctx.textAlign = "center";
      ctx.fillText(loc.name, loc.x, loc.y + 35);
    });

    if (state.player) {
      const here = locationById(state.currentLocation);
      ctx.beginPath();
      ctx.arc(here.x, here.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#f9d145";
      ctx.fill();
      ctx.strokeStyle = "#20150e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#1e2328";
    ctx.font = "14px serif";
    ctx.fillText(`Day ${state.day} / Turn ${state.turn}`, 12, 24);
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const parts = text.split("\n");
    let cursorY = y;
    for (let p = 0; p < parts.length; p += 1) {
      const words = parts[p].split("");
      let line = "";
      for (let i = 0; i < words.length; i += 1) {
        const testLine = line + words[i];
        if (context.measureText(testLine).width > maxWidth && line) {
          context.fillText(line, x, cursorY);
          line = words[i];
          cursorY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
    return cursorY;
  }

  function clearShareCanvas() {
    const w = els.shareCanvas.width;
    const h = els.shareCanvas.height;
    shareCtx.clearRect(0, 0, w, h);
    const bg = shareCtx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f0e1c8");
    bg.addColorStop(1, "#dbc3a0");
    shareCtx.fillStyle = bg;
    shareCtx.fillRect(0, 0, w, h);
    shareCtx.fillStyle = "#35251a";
    shareCtx.font = "bold 60px serif";
    shareCtx.fillText("江湖战报", 120, 180);
    shareCtx.font = "42px serif";
    shareCtx.fillText("本局结束后可生成分享卡", 120, 270);
  }

  function renderShareCard() {
    const result = state.runResult;
    if (!result) {
      clearShareCanvas();
      return;
    }

    const w = els.shareCanvas.width;
    const h = els.shareCanvas.height;
    shareCtx.clearRect(0, 0, w, h);

    const bg = shareCtx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f9ecd2");
    bg.addColorStop(0.6, "#e9d4b0");
    bg.addColorStop(1, "#cda57a");
    shareCtx.fillStyle = bg;
    shareCtx.fillRect(0, 0, w, h);

    shareCtx.fillStyle = "rgba(76, 40, 18, 0.18)";
    for (let i = 0; i < 8; i += 1) {
      shareCtx.fillRect(70 + i * 120, 0, 26, h);
    }

    shareCtx.fillStyle = "#2f1d14";
    shareCtx.font = "bold 72px serif";
    shareCtx.fillText("江湖战报", 90, 120);
    shareCtx.font = "42px serif";
    shareCtx.fillText(`${result.name} · ${result.profession}`, 90, 190);

    shareCtx.strokeStyle = "#7f5a3f";
    shareCtx.lineWidth = 5;
    shareCtx.strokeRect(72, 230, w - 144, h - 350);

    shareCtx.fillStyle = "#3e291d";
    shareCtx.font = "bold 52px serif";
    shareCtx.fillText(result.title, 110, 330);

    shareCtx.font = "36px serif";
    let y = 410;
    y = wrapText(shareCtx, `评语: ${result.epitaph}`, 110, y, w - 220, 56) + 10;

    const rows = [
      `结局: ${result.outcome}`,
      `总评分: ${result.score}`,
      `等级/天数: Lv.${result.level} / 第 ${result.day} 天`,
      `主线进度: 第${result.finalChapter.id}章《${result.finalChapter.name}》`,
      `主线节点完成: ${result.mainlineCompleted}`,
      `支线完成数: ${result.sideQuestCompletions}`,
      `达成成就: ${result.achievements.length} 个`,
      `关键抉择: ${result.keyChoices || "无"}`,
      `胜场/战斗: ${result.victories}/${result.battles}`,
      `稀有事件: ${result.rareEvents}`,
      `Seed: ${state.seed}`
    ];

    rows.forEach((line) => {
      shareCtx.fillText(line, 110, y);
      y += 56;
    });

    y += 24;
    shareCtx.font = "bold 38px serif";
    shareCtx.fillText("名场面", 110, y);
    y += 50;
    shareCtx.font = "34px serif";
    y = wrapText(shareCtx, `“${result.highlight}”`, 110, y, w - 220, 50) + 16;

    shareCtx.font = "28px monospace";
    wrapText(shareCtx, result.challengeUrl, 110, y, w - 220, 42);

    shareCtx.font = "24px serif";
    shareCtx.fillText("分享至微信/群聊，邀请好友挑战同种子命运", 110, h - 70);

    els.downloadShareLink.href = els.shareCanvas.toDataURL("image/png");
    els.downloadShareLink.classList.remove("hidden");
  }

  function render() {
    els.sheet.textContent = formatSheet();
    els.endingSheet.textContent = formatEndingSheet();
    drawMap();
  }

  function getTurnMs() {
    return 1200 / state.speed;
  }

  function gainExp(amount) {
    const p = state.player;
    p.exp += amount;

    while (p.exp >= p.nextExp) {
      p.exp -= p.nextExp;
      p.level += 1;
      p.nextExp = Math.floor(p.nextExp * 1.3);
      p.hpMax += 12 + Math.floor(p.stats.vit / 2);
      p.mpMax += 6 + Math.floor(p.stats.spi / 3);
      p.hp = p.hpMax;
      p.mp = p.mpMax;
      p.stats.str += randInt(0, 1);
      p.stats.agi += randInt(0, 1);
      p.stats.vit += randInt(0, 1);
      p.stats.int += randInt(0, 1);
      p.stats.spi += randInt(0, 1);
      p.stats.luk += randInt(0, 1);
      addLog(`等级提升到 ${p.level}，全属性成长并恢复状态。`);
      addMilestone(`等级提升到 Lv.${p.level}`);
      maybeProgressMainlineTask();
      updateChapterProgress();
    }
  }

  function maybeOpenChoice() {
    const p = state.player;

    if (!state.flags.sectChosen && p.level >= 2) {
      openChoice({
        title: "关键抉择: 选择门派",
        body: "江湖路宽，你必须投身一个门派修行。",
        options: sects.map((sect) => ({
          id: sect.id,
          label: `${sect.name} - ${sect.desc}`,
          onPick: function () {
            p.sect = sect;
            p.stats.str += sect.bonus.str || 0;
            p.stats.agi += sect.bonus.agi || 0;
            p.stats.vit += sect.bonus.vit || 0;
            p.stats.int += sect.bonus.int || 0;
            p.stats.spi += sect.bonus.spi || 0;
            p.stats.luk += sect.bonus.luk || 0;
            state.flags.sectChosen = true;
            state.story.majorChoices.push(`门派: ${sect.name}`);
            state.story.stance += sect.id === "qingshan" ? 1 : sect.id === "lingyin" ? 2 : 0;
            addMilestone(`拜入 ${sect.name}`);
            addLog(`你加入了 ${sect.name}。`);
            maybeProgressMainlineTask();
            updateChapterProgress();
          }
        }))
      });
      return true;
    }

    if (!state.flags.skillChosen && p.level >= 4) {
      openChoice({
        title: "关键抉择: 选择进阶天赋",
        body: "你的修行已成气候，选择一条战斗风格。",
        options: skills.map((perk) => ({
          id: perk.id,
          label: `${perk.name} - ${perk.desc}`,
          onPick: function () {
            p.perk = perk;
            state.flags.skillChosen = true;
            state.story.majorChoices.push(`天赋: ${perk.name}`);
            addMilestone(`领悟 ${perk.name}`);
            addLog(`你领悟了天赋: ${perk.name}。`);
            maybeProgressMainlineTask();
            updateChapterProgress();
          }
        }))
      });
      return true;
    }

    return false;
  }

  function openChoice(choice) {
    state.pendingChoice = choice;
    state.isPaused = true;
    els.choiceTitle.textContent = choice.title;
    els.choiceBody.textContent = choice.body;
    els.choiceOptions.innerHTML = "";

    choice.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        opt.onPick();
        closeChoice();
      });
      els.choiceOptions.appendChild(btn);
    });

    els.choiceModal.classList.remove("hidden");
    updateButtons();
    render();
  }

  function closeChoice() {
    state.pendingChoice = null;
    els.choiceModal.classList.add("hidden");
    if (state.mode === "running") {
      state.isPaused = false;
    }
    updateButtons();
    render();
  }

  function tryUsePotion() {
    const p = state.player;
    if (p.potion > 0 && p.hp < Math.floor(p.hpMax * 0.35)) {
      p.potion -= 1;
      const heal = 42 + p.stats.spi;
      p.hp = Math.min(p.hpMax, p.hp + heal);
      addLog(`自动使用疗伤药，恢复 ${heal} 生命。`);
      return true;
    }
    return false;
  }

  function doTravel() {
    const current = state.currentLocation;
    const neighbors = links
      .filter(([a, b]) => a === current || b === current)
      .map(([a, b]) => (a === current ? b : a));
    state.currentLocation = pick(neighbors);
    state.metrics.travels += 1;
    const loc = locationById(state.currentLocation);
    addLog(`自动行走到 ${loc.name}。`);
  }

  function doRestOrShop() {
    const p = state.player;
    const inTown = locationById(state.currentLocation).type === "town";
    if (!inTown) {
      return false;
    }

    if (p.hp < Math.floor(p.hpMax * 0.65)) {
      const heal = 18 + Math.floor(p.stats.vit / 2);
      p.hp = Math.min(p.hpMax, p.hp + heal);
      addLog(`在客栈打坐调息，恢复 ${heal} 生命。`);
      return true;
    }

    if (p.gold >= 24 && p.potion < 3) {
      p.gold -= 24;
      p.potion += 1;
      state.metrics.shops += 1;
      addLog("在药铺购入一瓶疗伤药。(-24 金币)");
      return true;
    }

    return false;
  }

  function getPerkBonus() {
    const perk = state.player.perk ? state.player.perk.id : "";
    return {
      burst: perk === "burst" ? 8 : 0,
      guard: perk === "guard" ? 3 : 0,
      fortune: perk === "fortune" ? 1.3 : 1
    };
  }

  function doEncounter(isBoss) {
    const p = state.player;
    const perk = getPerkBonus();
    state.metrics.battles += 1;

    let enemy = null;
    if (isBoss) {
      enemy = { ...boss };
    } else {
      const levelBase = Math.max(1, p.level + randInt(-1, 1));
      enemy = {
        name: pick(["山匪", "狼妖", "机关傀儡", "毒雾异虫"]),
        hp: 22 + levelBase * 11 + randInt(0, 16),
        atk: 6 + levelBase * 3 + randInt(0, 6),
        rewardExp: 24 + levelBase * 16,
        rewardGold: 12 + levelBase * 8
      };
    }

    addLog(`遭遇 ${enemy.name}，自动战斗开始。`);

    let round = 0;
    while (enemy.hp > 0 && p.hp > 0 && round < 10) {
      round += 1;
      const playerDamage = randInt(6, 12) + Math.floor(p.stats.str * 0.7) + (round === 1 ? perk.burst : 0);
      enemy.hp -= playerDamage;
      addLog(`你造成 ${playerDamage} 伤害。`);
      if (enemy.hp <= 0) {
        break;
      }

      let incoming = randInt(4, 10) + enemy.atk - Math.floor(p.stats.vit * 0.35);
      incoming = Math.max(1, incoming - perk.guard);
      p.hp -= incoming;
      addLog(`${enemy.name} 反击造成 ${incoming} 伤害。`);

      if (tryUsePotion()) {
        continue;
      }
    }

    if (p.hp <= 0) {
      p.hp = 0;
      addLog("你在战斗中陨落。江湖之路至此终结。");
      endRun(false);
      return;
    }

    if (enemy.hp <= 0) {
      state.metrics.victories += 1;
      const fortune = perk.fortune;
      const expGain = Math.floor(enemy.rewardExp * fortune);
      const goldGain = Math.floor(enemy.rewardGold * fortune);
      p.gold += goldGain;
      gainExp(expGain);
      addLog(`击败 ${enemy.name}，获得 ${expGain} 经验与 ${goldGain} 金币。`);
      if (!isBoss && randInt(1, 100) <= 18 + Math.floor(p.stats.luk / 2)) {
        p.potion += 1;
        addLog("战利品中找到一瓶疗伤药。");
      }
      if (isBoss) {
        state.flags.bossDefeated = true;
        addMilestone("击败血煞教主");
        addLog("你斩落血煞教主，江湖传名。");
        endRun(true);
      }
    }
  }

  function maybeBossBattle() {
    const p = state.player;
    if (state.flags.bossDefeated || p.level < 6) {
      return false;
    }
    if (locationById(state.currentLocation).id !== "ruins") {
      return false;
    }
    if (randInt(1, 100) > 35 + p.stats.luk) {
      return false;
    }

    doEncounter(true);
    return true;
  }

  function doLoot() {
    const p = state.player;
    const gain = randInt(8, 24) + Math.floor(p.stats.luk / 3);
    p.gold += gain;
    state.metrics.loots += 1;
    addLog(`路遇遗落包裹，获得 ${gain} 金币。`);
  }

  function maybeRandomEvent() {
    if (random() > 0.2) {
      return false;
    }

    const p = state.player;
    const area = locationById(state.currentLocation).type;
    const events = [
      {
        id: "hermit",
        text: "地铁口算命阿姨用三句话点醒了你。",
        apply: function () {
          p.stats.int += 1;
          p.stats.spi += 1;
          addMilestone("被路边高人点醒");
        }
      },
      {
        id: "escort",
        text: "你帮迷路外卖员找到写字楼，拿到感谢红包。",
        apply: function () {
          p.gold += 40;
          state.story.stance += 1;
        }
      },
      {
        id: "black-market",
        text: "你在二手群冲动下单，买到了“九成新空气”。",
        apply: function () {
          p.gold = Math.max(0, p.gold - 30);
          state.story.stance -= 1;
        }
      },
      {
        id: "medicine-cache",
        text: "共享柜里居然有一瓶没人取的能量饮料。",
        condition: function () {
          return area === "wild";
        },
        apply: function () {
          p.potion += 1;
        }
      },
      {
        id: "town-tribute",
        text: "街坊群里疯传你的战绩，众筹给你续了一周伙食。",
        condition: function () {
          return area === "town" && state.metrics.victories >= 3;
        },
        apply: function () {
          p.gold += 60;
        }
      },
      {
        id: "blood-moon",
        text: "夜空突然刷出血色弹幕：'今晚只有一个主角'。",
        rare: true,
        condition: function () {
          return state.currentLocation === "ruins";
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.str += 1;
          p.stats.luk += 1;
          addMilestone("血月弹幕异象现世");
        }
      },
      {
        id: "old-friend",
        text: "老同学深夜发来压缩包，解压后全是硬核攻略。",
        rare: true,
        apply: function () {
          state.metrics.rareEvents += 1;
          gainExp(35);
          addMilestone("旧友发来神秘攻略");
        }
      },
      {
        id: "group-chat",
        text: "你在群里问了一个问题，收到了 47 条互相打架的建议。",
        apply: function () {
          const gain = randInt(20, 45);
          p.gold += gain;
          p.stats.int += 1;
          state.story.stance += random() > 0.5 ? 1 : -1;
        }
      },
      {
        id: "interview",
        text: "你去面试，HR 问你五年规划，你反问公司三天规划。",
        rare: true,
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.spi += 1;
          p.stats.luk += 2;
          addMilestone("反向面试名场面");
        }
      },
      {
        id: "midnight-live",
        text: "凌晨直播间突然涨粉，你被迫现场教学如何边走边打怪。",
        condition: function () {
          return state.day >= 3;
        },
        apply: function () {
          const gain = randInt(30, 80);
          p.gold += gain;
          gainExp(24);
          addMilestone("深夜直播意外爆火");
        }
      },
      {
        id: "subway-delay",
        text: "列车延误 27 分钟，你顺便在站台学会了新连招。",
        apply: function () {
          p.stats.agi += 1;
          gainExp(16);
        }
      },
      {
        id: "forum-problem",
        text: "论坛有人发离谱求助，你认真回答后意外涨粉。",
        apply: function () {
          p.gold += 35;
          p.stats.int += 1;
        }
      },
      {
        id: "hotpot-debate",
        text: "你卷入“火锅蘸料宇宙大战”，成功全身而退。",
        apply: function () {
          p.stats.spi += 1;
          state.story.stance += 1;
        }
      },
      {
        id: "lost-phone",
        text: "路边捡到失主手机，归还后对方转你一笔感谢金。",
        condition: function () {
          return area === "town";
        },
        apply: function () {
          p.gold += 48;
          state.story.stance += 1;
        }
      },
      {
        id: "screenshot-war",
        text: "你把战报发进群，立刻引发三轮截图大战。",
        condition: function () {
          return state.metrics.victories >= 5;
        },
        apply: function () {
          gainExp(22);
          p.stats.luk += 1;
          addMilestone("截图大战出圈");
        }
      },
      {
        id: "midnight-bug",
        text: "半夜系统突然崩了一次，你重启后数据反而更顺。",
        rare: true,
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.vit += 1;
          p.stats.int += 1;
          addMilestone("午夜重启逆转");
        }
      },
      {
        id: "office-escape",
        text: "你在临时会议中丝滑逃生，顺手完成一笔外快。",
        condition: function () {
          return state.day >= 2;
        },
        apply: function () {
          p.gold += randInt(22, 68);
          p.stats.agi += 1;
        }
      },
      {
        id: "rainy-taxi",
        text: "暴雨夜你拦到一辆空车，司机还是你的老战友。",
        rare: true,
        apply: function () {
          state.metrics.rareEvents += 1;
          p.potion += 1;
          gainExp(30);
          addMilestone("雨夜重逢战友");
        }
      },
      {
        id: "deadline-miracle",
        text: "你卡点提交方案，甲方居然一次通过。",
        condition: function () {
          return state.metrics.battles >= 6;
        },
        apply: function () {
          p.gold += 90;
          p.stats.spi += 1;
          state.story.stance += 1;
        }
      },
      {
        id: "elevator-legend",
        text: "电梯里 30 秒演讲后，你拿到一张神秘邀请码。",
        rare: true,
        condition: function () {
          return state.story.chapterId >= 4;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.int += 2;
          addMilestone("电梯演讲封神");
        }
      },
      {
        id: "rent-notice",
        text: "房东发来新消息：下月房租微调，你的钱包先行阵亡。",
        condition: function () {
          return area === "town" && state.day >= 2;
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(18, 45));
          p.stats.spi += 1;
          addMilestone("房租压力警报");
        }
      },
      {
        id: "overtime-loop",
        text: "今天你在工位和地铁之间无限循环，脑子快烧了。",
        apply: function () {
          p.stats.vit += 1;
          p.stats.int = Math.max(1, p.stats.int - 1);
          gainExp(20);
        }
      },
      {
        id: "hospital-queue",
        text: "医院队伍绕了三圈，你熬到凌晨终于挂上号。",
        condition: function () {
          return state.day >= 3;
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - 24);
          p.stats.spi += 2;
          addMilestone("深夜排号生存成功");
        }
      },
      {
        id: "layoff-rumor",
        text: "工位间传来裁员传闻，所有人都在假装镇定。",
        rare: true,
        condition: function () {
          return state.story.chapterId >= 3;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.vit += 1;
          p.stats.luk += 1;
          addMilestone("裁员风暴中稳住节奏");
        }
      },
      {
        id: "delivery-rush",
        text: "暴雨晚高峰，单子像洪水一样涌来。",
        condition: function () {
          return area === "wild";
        },
        apply: function () {
          p.gold += randInt(35, 70);
          p.stats.agi += 1;
          state.story.stance += 1;
        }
      },
      {
        id: "family-call",
        text: "家里来电只说一句“别太累”，你沉默了很久。",
        apply: function () {
          p.stats.spi += 1;
          p.stats.vit += 1;
          addMilestone("电话那头的牵挂");
        }
      },
      {
        id: "class-shift",
        text: "你在楼下夜校听完一整节课，转身继续赶路。",
        condition: function () {
          return state.day >= 2;
        },
        apply: function () {
          p.stats.int += 1;
          gainExp(24);
          addMilestone("夜校充电完成");
        }
      },
      {
        id: "social-insurance",
        text: "你终于把社保流程跑通，整个人松了一口气。",
        rare: true,
        condition: function () {
          return state.story.chapterId >= 5;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.spi += 2;
          p.stats.vit += 1;
          addMilestone("社保流程打通");
        }
      },
      {
        id: "street-mutual-help",
        text: "街口大爷递给你一瓶水：年轻人慢点跑。",
        apply: function () {
          p.potion += 1;
          state.story.stance += 1;
        }
      }
    ];

    const pool = events.filter((item) => (item.condition ? item.condition() : true));
    if (!pool.length) {
      return false;
    }

    const evt = pick(pool);
    evt.apply();
    state.metrics.randomEvents += 1;
    addLog(`随机事件: ${evt.text}`);
    return true;
  }

  function takeTurn() {
    if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
      return;
    }

    state.turn += 1;
    if (state.turn % 8 === 0) {
      state.day += 1;
    }

    const p = state.player;
    if (!p || p.hp <= 0) {
      endRun(false);
      return;
    }

    maybeAssignSideQuest();

    if (maybeOpenChoice()) {
      return;
    }

    if (maybeBossBattle()) {
      render();
      return;
    }

    if (maybeRandomEvent()) {
      maybeCompleteSideQuest();
      maybeProgressMainlineTask();
      updateChapterProgress();
      render();
      return;
    }

    if (doRestOrShop()) {
      maybeCompleteSideQuest();
      maybeProgressMainlineTask();
      updateChapterProgress();
      render();
      return;
    }

    const roll = random();
    if (roll < 0.44) {
      doEncounter(false);
    } else if (roll < 0.74) {
      doTravel();
    } else if (roll < 0.9) {
      doLoot();
    } else {
      doRestOrShop() || doTravel();
    }

    if (p.hp <= 0) {
      endRun(false);
      return;
    }

    maybeCompleteSideQuest();
    maybeProgressMainlineTask();
    updateChapterProgress();
    maybeOpenChoice();
    render();
  }

  function composeTitle(isWin, score) {
    const p = state.player;
    if (isWin && state.metrics.rareEvents >= 3) {
      return "热搜定局人";
    }
    if (isWin && p.hp > Math.floor(p.hpMax * 0.6)) {
      return "地铁不败客";
    }
    if (isWin && p.perk && p.perk.id === "fortune") {
      return "欧皇通勤王";
    }
    if (!isWin && state.metrics.victories >= 8) {
      return "虽败仍上分";
    }
    if (!isWin && state.story.chapterId >= 6) {
      return "折戟高楼夜";
    }
    if (score >= 760) {
      return "全城传奇录";
    }
    return isWin ? "乱局清场者" : "路口无名客";
  }

  function composeEpitaph(isWin) {
    const p = state.player;
    const sectName = p.sect ? p.sect.name : "无门无派";
    const perkName = p.perk ? p.perk.name : "未定流派";
    if (isWin) {
      return `${p.name}混迹${sectName}，靠${perkName}在钢铁丛林里完成清场，顺手把命运做成了可复刻挑战。`;
    }
    return `${p.name}带着${perkName}推进到第${state.story.chapterId}章，在${locationById(state.currentLocation).name}被现实反杀，但留下了足够抽象的路线供后来者挑战。`;
  }

  function buildHighlight() {
    const candidates = state.log
      .filter((line) => line.includes("主线推进") || line.includes("随机事件") || line.includes("击败") || line.includes("关键抉择"))
      .slice(-12);
    if (!candidates.length) {
      return "这趟江湖路虽平凡，却足够真实。";
    }
    const picked = candidates[randInt(0, candidates.length - 1)];
    return picked.replace(/^\[[^\]]+\]\s*/, "");
  }

  function buildChallengeUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", state.seed);
    url.searchParams.set("source", "share");
    return url.toString();
  }

  function countMainlineCompleted() {
    let count = 0;
    const keys = Object.keys(chapterQuestBook);
    for (let i = 0; i < keys.length; i += 1) {
      const chapterId = Number(keys[i]);
      const maxCount = (chapterQuestBook[chapterId] || []).length;
      const done = state.story.mainlineProgress[chapterId] || 0;
      count += Math.min(maxCount, done);
    }
    return count;
  }

  function evaluateAchievements(isWin) {
    return achievementBook.filter((item) => {
      if (item.when === "win" && !isWin) {
        return false;
      }
      if (item.when === "lose" && isWin) {
        return false;
      }
      return item.check();
    });
  }

  function buildRunResult(isWin) {
    const p = state.player;
    const score =
      p.level * 95 +
      state.metrics.victories * 28 +
      state.metrics.rareEvents * 80 +
      (isWin ? 260 : 0) +
      Math.floor(p.gold * 0.8) +
      state.story.chapterId * 38;

    const finalChapter = chapterById(state.story.chapterId);
    const title = composeTitle(isWin, score);
    const epitaph = composeEpitaph(isWin);
    const keyChoices = state.story.majorChoices.join(" / ");
    const challengeUrl = buildChallengeUrl();
    const highlight = buildHighlight();
    const mainlineCompleted = countMainlineCompleted();
    const sideQuestCompletions = state.metrics.sideQuestCompletions;
    const achievements = evaluateAchievements(isWin);

    const shareTemplates = [
      [
        `我在 Adventure Simulator 打出了结局「${title}」`,
        `角色：${p.name}（${p.profession.name}）｜评分：${score}`,
        `主线：第${finalChapter.id}章《${finalChapter.name}》｜主线节点 ${mainlineCompleted} 个`,
        `支线完成：${sideQuestCompletions}｜稀有事件：${state.metrics.rareEvents}｜成就 ${achievements.length}`,
        `名场面：${highlight}`,
        `同种子挑战：${challengeUrl}`
      ],
      [
        `谁懂啊，刚下地铁就通关了，称号是「${title}」`,
        `${p.name} 这把全靠 ${p.perk ? p.perk.name : "临场发挥"}，硬打到第${finalChapter.id}章`,
        `顺手清了 ${sideQuestCompletions} 条支线，主线节点过了 ${mainlineCompleted} 个，成就拿了 ${achievements.length} 个`,
        `最离谱一幕：${highlight}`,
        `来复刻我这条命运线：${challengeUrl}`
      ],
      [
        `这局我不想炫，但系统硬要给我「${title}」`,
        `评分 ${score}，主线节点 ${mainlineCompleted}，支线 ${sideQuestCompletions}，成就 ${achievements.length}，也就一般发挥`,
        `如果你更强，欢迎同种子来超我：${challengeUrl}`
      ]
    ];
    const shareText = pick(shareTemplates).join("\n");

    return {
      outcome: isWin ? "通关" : "陨落",
      title,
      epitaph,
      score,
      name: p.name,
      profession: p.profession.name,
      level: p.level,
      day: state.day,
      battles: state.metrics.battles,
      victories: state.metrics.victories,
      rareEvents: state.metrics.rareEvents,
      mainlineCompleted,
      sideQuestCompletions,
      achievements,
      finalChapter,
      keyChoices,
      milestones: [...state.story.milestones],
      highlight,
      challengeUrl,
      shareText
    };
  }

  function endRun(isWin) {
    state.mode = "ended";
    state.isPaused = true;
    state.runResult = buildRunResult(isWin);
    addLog(isWin ? "结局: 你已通关，本轮挂机结束。" : "结局: 角色死亡，本轮挂机结束。");
    addLog(`结局称号: ${state.runResult.title}`);
    renderShareCard();
    updateButtons();
    render();
  }

  function updateButtons() {
    const hasPlayer = !!state.player;
    const running = state.mode === "running";
    const hasResult = !!state.runResult;

    els.startBtn.disabled = !hasPlayer || running || state.mode === "ended";
    els.pauseBtn.disabled = !running || state.isPaused || !!state.pendingChoice;
    els.resumeBtn.disabled = !running || (!state.isPaused && !state.pendingChoice);
    els.speedSelect.disabled = !running;
    els.shareCardBtn.disabled = !hasResult;
    els.copyShareBtn.disabled = !hasResult;
    els.copyLinkBtn.disabled = !hasResult;
  }

  function reroll() {
    const seedToUse = state.initialSeedFromUrl || makeSeedString();
    resetRng(seedToUse);

    state.player = createPlayer();
    state.turn = 0;
    state.day = 1;
    state.currentLocation = "novice";
    state.log = [];
    state.mode = "menu";
    state.isPaused = false;
    state.pendingChoice = null;
    state.story = {
      chapterId: 1,
      milestones: ["踏入江湖"],
      majorChoices: [],
      stance: 0,
      mainlineProgress: { 1: 0 },
      activeSideQuest: null
    };
    state.metrics = {
      battles: 0,
      victories: 0,
      travels: 0,
      shops: 0,
      loots: 0,
      randomEvents: 0,
      rareEvents: 0,
      chapterAdvances: 0,
      sideQuestCompletions: 0
    };
    state.runResult = null;
    state.flags = {
      sectChosen: false,
      skillChosen: false,
      bossDefeated: false
    };

    clearShareCanvas();
    els.downloadShareLink.classList.add("hidden");
    addLog(`掷骰完成: ${state.player.name} (${state.player.profession.name}) 加入江湖。`);
    addLog(`本局命运种子: ${state.seed}`);
    maybeProgressMainlineTask();
    if (state.initialSeedFromUrl) {
      addLog("挑战模式: 你正在游玩分享种子。\n");
    }

    updateButtons();
    render();
  }

  function startRun() {
    if (!state.player) {
      return;
    }
    state.mode = "running";
    state.isPaused = false;
    state.pendingChoice = null;
    addLog("挂机开始，角色将自动探索、战斗与交易。");
    updateButtons();
    render();
  }

  function pauseRun() {
    if (state.mode !== "running") {
      return;
    }
    state.isPaused = true;
    addLog("你暂时按下暂停。\n");
    updateButtons();
    render();
  }

  function resumeRun() {
    if (state.mode !== "running") {
      return;
    }
    if (state.pendingChoice) {
      addLog("请先完成关键抉择，再继续挂机。\n");
      return;
    }
    state.isPaused = false;
    addLog("继续挂机。\n");
    updateButtons();
    render();
  }

  function onSpeedChange(e) {
    state.speed = Number(e.target.value) || 1;
    addLog(`挂机速度调整为 ${state.speed.toFixed(2)}x`);
  }

  async function copyText(text) {
    if (!text) {
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  function onShareCard() {
    if (!state.runResult) {
      return;
    }
    renderShareCard();
    addLog("已生成分享战报图，可直接下载截图。\n");
  }

  async function onCopyShare() {
    if (!state.runResult) {
      return;
    }
    await copyText(state.runResult.shareText);
    addLog("分享文案已复制。\n");
  }

  async function onCopyLink() {
    if (!state.runResult) {
      return;
    }
    await copyText(state.runResult.challengeUrl);
    addLog("挑战链接已复制。\n");
  }

  function loop(ts) {
    if (!rafLast) {
      rafLast = ts;
    }
    const delta = Math.min(1000, ts - rafLast);
    rafLast = ts;

    if (state.mode === "running" && !state.isPaused && !state.pendingChoice) {
      turnAccumulator += delta;
      const turnMs = getTurnMs();
      while (turnAccumulator >= turnMs) {
        takeTurn();
        turnAccumulator -= turnMs;
        if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
          break;
        }
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleKey(e) {
    if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
    }
    if (e.key === "Escape" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function buildTextState() {
    const p = state.player;
    const loc = locationById(state.currentLocation);
    const payload = {
      coordinate_system: "canvas origin=(0,0) at top-left; +x right, +y down",
      mode: state.mode,
      paused: state.isPaused,
      seed: state.seed,
      day: state.day,
      turn: state.turn,
      chapter: chapterById(state.story.chapterId),
      metrics: { ...state.metrics },
      mainline_task: getCurrentMainlineTask() ? getCurrentMainlineTask().text : null,
      active_side_quest: state.story.activeSideQuest
        ? {
            title: state.story.activeSideQuest.title,
            text: state.story.activeSideQuest.text,
            progress: getSideQuestProgressText(state.story.activeSideQuest)
          }
        : null,
      world: {
        current_location: loc ? { id: loc.id, name: loc.name, x: loc.x, y: loc.y, type: loc.type } : null,
        locations: locations.map((item) => ({ id: item.id, x: item.x, y: item.y, type: item.type }))
      },
      player: p
        ? {
            name: p.name,
            profession: p.profession.name,
            level: p.level,
            hp: p.hp,
            hp_max: p.hpMax,
            mp: p.mp,
            mp_max: p.mpMax,
            exp: p.exp,
            next_exp: p.nextExp,
            gold: p.gold,
            potion: p.potion,
            sect: p.sect ? p.sect.name : null,
            skill: p.skill,
            perk: p.perk ? p.perk.name : null,
            stats: { ...p.stats }
          }
        : null,
      pending_choice: state.pendingChoice
        ? {
            title: state.pendingChoice.title,
            options: state.pendingChoice.options.map((o) => o.id)
          }
        : null,
      run_result: state.runResult
        ? {
            outcome: state.runResult.outcome,
            title: state.runResult.title,
            score: state.runResult.score,
            achievements: state.runResult.achievements.map((a) => a.id),
            challenge_url: state.runResult.challengeUrl
          }
        : null,
      recent_log: state.log.slice(-8)
    };

    return JSON.stringify(payload);
  }

  window.render_game_to_text = buildTextState;

  window.advanceTime = function advanceTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) {
      return;
    }
    if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
      render();
      return;
    }

    turnAccumulator += ms;
    const turnMs = getTurnMs();
    let safety = 0;
    while (turnAccumulator >= turnMs && safety < 200) {
      takeTurn();
      turnAccumulator -= turnMs;
      safety += 1;
      if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
        break;
      }
    }
    render();
  };

  function wireEvents() {
    els.rerollBtn.addEventListener("click", reroll);
    els.startBtn.addEventListener("click", startRun);
    els.pauseBtn.addEventListener("click", pauseRun);
    els.resumeBtn.addEventListener("click", resumeRun);
    els.shareCardBtn.addEventListener("click", onShareCard);
    els.copyShareBtn.addEventListener("click", function () {
      onCopyShare().catch(function () {
        addLog("复制分享文案失败。\n");
      });
    });
    els.copyLinkBtn.addEventListener("click", function () {
      onCopyLink().catch(function () {
        addLog("复制挑战链接失败。\n");
      });
    });
    els.speedSelect.addEventListener("change", onSpeedChange);
    window.addEventListener("keydown", handleKey);
  }

  function init() {
    state.initialSeedFromUrl = readSeedFromUrl();
    wireEvents();
    reroll();
    rafId = requestAnimationFrame(loop);
    updateButtons();
    render();
  }

  window.addEventListener("beforeunload", function () {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });

  init();
})();
