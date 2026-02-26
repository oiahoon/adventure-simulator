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

function defaultRandom() {
  return Math.random();
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[randomInt(rng, 0, arr.length - 1)];
}

function pushLog(run, text) {
  run.log.push(text);
  if (run.log.length > 60) run.log = run.log.slice(-60);
}

function gainExp(run, amount) {
  const p = run.player;
  p.exp += amount;
  while (p.exp >= p.nextExp) {
    p.exp -= p.nextExp;
    p.level += 1;
    p.nextExp += 24;
    p.maxHp += 8;
    p.hp = p.maxHp;
    p.maxMp += 4;
    p.mp = p.maxMp;
    p.atk += 2;
    p.def += 1;
    pushLog(run, `升级到 Lv.${p.level}，状态已恢复。`);
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

function endIfNeeded(run) {
  if (run.player.hp <= 0) {
    run.player.hp = 0;
    run.mode = "ended";
    pushLog(run, "你在城市夹缝中倒下，本轮结束。");
    return true;
  }
  if (run.flags.bossDefeated) {
    run.mode = "ended";
    pushLog(run, "你击败了终局敌人，成功通关。");
    return true;
  }
  return false;
}

function stepRun(rng, run) {
  if (run.mode !== "running") return "本局已结束，请 new 开始新局。";
  if (run.pendingChoice) return "存在关键抉择，先 choose。";

  run.turn += 1;
  if (run.turn % 8 === 0) run.day += 1;
  run.location = pick(rng, LOCATIONS);
  const p = run.player;

  const roll = rng();
  if (roll < 0.42) {
    run.metrics.battles += 1;
    const enemyHp = randomInt(rng, 20, 40) + p.level * 2;
    const enemyAtk = randomInt(rng, 6, 12) + p.level;
    const damageToEnemy = Math.max(6, p.atk + randomInt(rng, -2, 4));
    const damageToPlayer = Math.max(1, enemyAtk - p.def + randomInt(rng, -2, 2));
    if (damageToEnemy >= enemyHp) {
      run.metrics.wins += 1;
      const gainGold = Math.floor(randomInt(rng, 12, 30) * (p.goldGain || 1));
      p.gold += gainGold;
      gainExp(run, randomInt(rng, 15, 28));
      pushLog(run, `你击退对手，获得 ${gainGold} 金币。`);
    } else {
      p.hp -= damageToPlayer;
      pushLog(run, `遭遇冲突受伤，损失 ${damageToPlayer} 生命。`);
    }
  } else if (roll < 0.72) {
    run.metrics.events += 1;
    const gain = randomInt(rng, 10, 24);
    p.gold += gain;
    gainExp(run, randomInt(rng, 8, 16));
    pushLog(run, `触发城市事件，赚到 ${gain} 金币。`);
  } else {
    run.metrics.sideJobs += 1;
    const heal = randomInt(rng, 4, 10);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    pushLog(run, `跑完一单兼职，恢复 ${heal} 生命。`);
  }

  if (!run.flags.bossDefeated && p.level >= 6 && run.turn >= 18 && rng() < 0.22) {
    run.metrics.battles += 1;
    const bossHp = 90 + p.level * 8;
    const bossAtk = 18 + p.level * 2;
    const playerBurst = p.atk + randomInt(rng, 10, 22);
    if (playerBurst >= bossHp) {
      run.flags.bossDefeated = true;
      p.gold += 180;
      gainExp(run, 80);
      pushLog(run, "终局敌人出现，你一击定局。");
    } else {
      const hit = Math.max(6, bossAtk - p.def + randomInt(rng, 0, 6));
      p.hp -= hit;
      pushLog(run, `终局敌人重创你，损失 ${hit} 生命。`);
    }
  }

  maybeOpenChoice(run);
  endIfNeeded(run);
  return "已推进 1 回合。";
}

function createRun(rng, name) {
  const profession = pick(rng, JOBS);
  const playerName = name && String(name).trim() ? String(name).trim() : `打工人${randomInt(rng, 100, 999)}`;
  return {
    mode: "running",
    turn: 0,
    day: 1,
    location: pick(rng, LOCATIONS),
    pendingChoice: null,
    flags: { sectChosen: false, perkChosen: false, bossDefeated: false },
    metrics: { battles: 0, wins: 0, events: 0, sideJobs: 0 },
    log: ["你在城市夜色中醒来。"],
    player: {
      name: playerName,
      profession,
      level: 1,
      exp: 0,
      nextExp: 40,
      hp: 60,
      maxHp: 60,
      mp: 20,
      maxMp: 20,
      atk: 10,
      def: 4,
      gold: 50,
      sect: null,
      perk: null,
      goldGain: 1
    }
  };
}

function runAction(rng, payload) {
  const { action = "status", run, option, steps = 1, name } = payload || {};
  let currentRun = run || null;
  let message = "";

  if (action === "new" || !currentRun) {
    currentRun = createRun(rng, name);
    message = "新局已创建。";
  } else if (action === "status") {
    message = "状态读取成功。";
  } else if (action === "choose") {
    message = applyChoice(currentRun, option);
  } else if (action === "step") {
    message = stepRun(rng, currentRun);
  } else if (action === "auto") {
    const count = Math.max(1, Math.min(200, Number(steps) || 1));
    for (let i = 0; i < count; i += 1) {
      const result = stepRun(rng, currentRun);
      message = `批量推进 ${count} 回合完成。`;
      if (currentRun.mode !== "running" || currentRun.pendingChoice || result.includes("关键抉择")) {
        break;
      }
    }
  } else {
    return {
      ok: false,
      statusCode: 400,
      error: "不支持的 action",
      supported: ["new", "status", "step", "auto", "choose"]
    };
  }

  return {
    ok: true,
    statusCode: 200,
    payload: {
      success: true,
      action,
      message,
      run: currentRun
    }
  };
}

function createMudService(opts) {
  const random = opts && typeof opts.random === "function" ? opts.random : defaultRandom;
  return {
    runAction: (payload) => runAction(random, payload),
    constants: { JOBS, LOCATIONS, SECTS, PERKS }
  };
}

module.exports = {
  createMudService
};
