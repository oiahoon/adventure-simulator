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
    { id: 1, name: "入世", minLevel: 1, mission: "在新手村存活并完成初试" },
    { id: 2, name: "立足", minLevel: 2, mission: "加入门派并建立个人声名" },
    { id: 3, name: "暗潮", minLevel: 3, mission: "追查江湖暗线并累计三场胜战" },
    { id: 4, name: "盟约", minLevel: 4, mission: "选择进阶天赋并确立流派" },
    { id: 5, name: "远征", minLevel: 5, mission: "在荒野与集镇之间维持补给" },
    { id: 6, name: "风云", minLevel: 6, mission: "在古战场寻找血煞教主踪迹" },
    { id: 7, name: "前夜", minLevel: 7, mission: "完成终局前的资源准备" },
    { id: 8, name: "终局", minLevel: 8, mission: "击败血煞教主或壮烈陨落" }
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
      stance: 0
    },
    metrics: {
      battles: 0,
      victories: 0,
      travels: 0,
      shops: 0,
      loots: 0,
      rareEvents: 0,
      chapterAdvances: 0
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

  function updateChapterProgress() {
    const p = state.player;
    let target = 1;
    for (let i = 0; i < chapters.length; i += 1) {
      if (p.level >= chapters[i].minLevel) {
        target = chapters[i].id;
      }
    }

    if (target > state.story.chapterId) {
      state.story.chapterId = target;
      state.metrics.chapterAdvances += 1;
      const chapter = chapterById(target);
      addMilestone(`推进至第${chapter.id}章《${chapter.name}》`);
      addLog(`主线推进: 第${chapter.id}章《${chapter.name}》 - ${chapter.mission}`);
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
      `稀有遭遇: ${result.rareEvents} 次`,
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
        text: "山间隐士指点你运气走向。",
        apply: function () {
          p.stats.int += 1;
          p.stats.spi += 1;
          addMilestone("隐士传法，悟性提升");
        }
      },
      {
        id: "escort",
        text: "你护送一名商旅脱险，收获谢礼。",
        apply: function () {
          p.gold += 40;
          state.story.stance += 1;
        }
      },
      {
        id: "black-market",
        text: "黑市赌局让你失手，损失了部分盘缠。",
        apply: function () {
          p.gold = Math.max(0, p.gold - 30);
          state.story.stance -= 1;
        }
      },
      {
        id: "medicine-cache",
        text: "荒野药箱仍有余温，你捡到了疗伤药。",
        condition: function () {
          return area === "wild";
        },
        apply: function () {
          p.potion += 1;
        }
      },
      {
        id: "town-tribute",
        text: "乡绅听闻你的战绩，主动资助你的旅费。",
        condition: function () {
          return area === "town" && state.metrics.victories >= 3;
        },
        apply: function () {
          p.gold += 60;
        }
      },
      {
        id: "blood-moon",
        text: "血月照古场，你感到杀机逼近。",
        rare: true,
        condition: function () {
          return state.currentLocation === "ruins";
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.str += 1;
          p.stats.luk += 1;
          addMilestone("血月异象现世");
        }
      },
      {
        id: "old-friend",
        text: "旧友来信，送来秘籍残页。",
        rare: true,
        apply: function () {
          state.metrics.rareEvents += 1;
          gainExp(35);
          addMilestone("旧友赠书，修为突进");
        }
      }
    ];

    const pool = events.filter((item) => (item.condition ? item.condition() : true));
    if (!pool.length) {
      return false;
    }

    const evt = pick(pool);
    evt.apply();
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

    if (maybeOpenChoice()) {
      return;
    }

    if (maybeBossBattle()) {
      render();
      return;
    }

    if (maybeRandomEvent()) {
      render();
      return;
    }

    if (doRestOrShop()) {
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

    maybeOpenChoice();
    render();
  }

  function composeTitle(isWin, score) {
    const p = state.player;
    if (isWin && state.metrics.rareEvents >= 2) {
      return "天命破局者";
    }
    if (isWin && p.hp > Math.floor(p.hpMax * 0.6)) {
      return "镇关不败客";
    }
    if (isWin && p.perk && p.perk.id === "fortune") {
      return "鸿运问鼎者";
    }
    if (!isWin && state.metrics.victories >= 8) {
      return "虽败犹荣将";
    }
    if (!isWin && state.story.chapterId >= 6) {
      return "折戟古战场";
    }
    if (score >= 760) {
      return "江湖传奇录";
    }
    return isWin ? "乱世定风波" : "无名行路人";
  }

  function composeEpitaph(isWin) {
    const p = state.player;
    const sectName = p.sect ? p.sect.name : "无门无派";
    const perkName = p.perk ? p.perk.name : "未定流派";
    if (isWin) {
      return `${p.name}出身${sectName}，以${perkName}定鼎终局，留下可被后人复刻的命运轨迹。`;
    }
    return `${p.name}携${perkName}闯荡至第${state.story.chapterId}章，在${locationById(state.currentLocation).name}饮恨，但其足迹仍可被后来者挑战。`;
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

    const shareText = [
      `我在 Adventure Simulator 打出了结局「${title}」`,
      `角色：${p.name}（${p.profession.name}）｜评分：${score}`,
      `主线：第${finalChapter.id}章《${finalChapter.name}》｜稀有事件：${state.metrics.rareEvents}`,
      `名场面：${highlight}`,
      `同种子挑战：${challengeUrl}`
    ].join("\n");

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
      stance: 0
    };
    state.metrics = {
      battles: 0,
      victories: 0,
      travels: 0,
      shops: 0,
      loots: 0,
      rareEvents: 0,
      chapterAdvances: 0
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
