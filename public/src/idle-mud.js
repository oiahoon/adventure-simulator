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
    speedSelect: document.getElementById("speed-select"),
    log: document.getElementById("log"),
    sheet: document.getElementById("character-sheet"),
    canvas: document.getElementById("world-canvas"),
    choiceModal: document.getElementById("choice-modal"),
    choiceTitle: document.getElementById("choice-title"),
    choiceBody: document.getElementById("choice-body"),
    choiceOptions: document.getElementById("choice-options")
  };

  const ctx = els.canvas.getContext("2d");

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

  function getTurnMs() {
    return 1200 / state.speed;
  }

  function locationById(id) {
    return locations.find((l) => l.id === id);
  }

  function addLog(message) {
    const stamp = `D${String(state.day).padStart(2, "0")} T${String(state.turn).padStart(3, "0")}`;
    state.log.push(`[${stamp}] ${message}`);
    if (state.log.length > 180) {
      state.log = state.log.slice(-180);
    }
    els.log.textContent = state.log.slice(-60).join("\n");
    els.log.scrollTop = els.log.scrollHeight;
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

    return [
      `姓名: ${p.name}`,
      `职业: ${p.profession.name}`,
      `等级: ${p.level} 经验: ${p.exp}/${p.nextExp}`,
      `生命: ${p.hp}/${p.hpMax}`,
      `内力: ${p.mp}/${p.mpMax}`,
      `金币: ${p.gold} 药剂: ${p.potion}`,
      `地点: ${loc.name}`,
      "",
      "属性:",
      `力量 ${p.stats.str}  敏捷 ${p.stats.agi}  体魄 ${p.stats.vit}`,
      `智识 ${p.stats.int}  神识 ${p.stats.spi}  气运 ${p.stats.luk}`,
      "",
      `门派: ${sectText}`,
      `职业技能: ${p.skill}`,
      `进阶天赋: ${perkText}`,
      "",
      `状态: ${modeText}`,
      `当前天数: ${state.day}`
    ].join("\n");
  }

  function drawMap() {
    const { width, height } = els.canvas;
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

  function render() {
    els.sheet.textContent = formatSheet();
    drawMap();
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
    addLog(`路遇遗落包裹，获得 ${gain} 金币。`);
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

    if (doRestOrShop()) {
      render();
      return;
    }

    const roll = Math.random();
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

  function endRun(isWin) {
    state.mode = "ended";
    state.isPaused = true;
    updateButtons();
    addLog(isWin ? "结局: 你已通关，本轮挂机结束。" : "结局: 角色死亡，本轮挂机结束。");
    render();
  }

  function updateButtons() {
    const hasPlayer = !!state.player;
    const running = state.mode === "running";

    els.startBtn.disabled = !hasPlayer || running || state.mode === "ended";
    els.pauseBtn.disabled = !running || state.isPaused || !!state.pendingChoice;
    els.resumeBtn.disabled = !running || (!state.isPaused && !state.pendingChoice);
    els.speedSelect.disabled = !running;
  }

  function reroll() {
    state.player = createPlayer();
    state.turn = 0;
    state.day = 1;
    state.currentLocation = "novice";
    state.log = [];
    state.mode = "menu";
    state.isPaused = false;
    state.pendingChoice = null;
    state.flags = {
      sectChosen: false,
      skillChosen: false,
      bossDefeated: false
    };
    addLog(`掷骰完成: ${state.player.name} (${state.player.profession.name}) 加入江湖。`);
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
      day: state.day,
      turn: state.turn,
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
    els.speedSelect.addEventListener("change", onSpeedChange);
    window.addEventListener("keydown", handleKey);
  }

  function init() {
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
