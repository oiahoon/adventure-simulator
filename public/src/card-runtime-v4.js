(function () {
  "use strict";

  const state = {
    run: null,
    info: "",
    shareText: "",
    seed: ""
  };

  const els = {
    stats: document.getElementById("stats"),
    cardHost: document.getElementById("card-host"),
    leftBtn: document.getElementById("left-btn"),
    rightBtn: document.getElementById("right-btn"),
    turnNote: document.getElementById("turn-note"),
    timeline: document.getElementById("timeline"),
    profile: document.getElementById("profile"),
    ending: document.getElementById("ending"),
    copyShareBtn: document.getElementById("copy-share-btn"),
    newRunBtn: document.getElementById("new-run-btn"),
    focusSelect: document.getElementById("focus-select"),
    applyFocusBtn: document.getElementById("apply-focus-btn")
  };

  const NAME_POOL = ["李雨桐", "王晨", "张志豪", "赵可欣", "陈嘉乐", "孙浩宇", "刘诗宁", "杨逸凡", "吴晓楠", "周子航", "何文静", "唐一鸣"];
  const JOB_POOL = ["外卖骑手", "客服专员", "直播运营", "短视频剪辑", "工地资料员", "仓储分拣员", "程序开发", "考编备考生"];
  const ORIGIN_POOL = ["县城普通家庭", "城郊租住家庭", "外来务工家庭", "小城双职工家庭"];

  const CARDS = [
    {
      id: "trial_overtime",
      title: "试用期加码",
      text: "领导暗示你本周继续无偿加班，答应能留岗，不答应可能被边缘化。",
      tag: "就业",
      weight: 10,
      options: {
        left: { label: "先扛住", effects: { cash: 14, energy: -12, mind: -7, heat: -2 }, log: "你硬扛加班，现金回升但身心吃紧。" },
        right: { label: "明确拒绝", effects: { cash: -8, energy: 5, mind: 2, heat: 5 }, log: "你拒绝无偿加班，短期收入受损但保住精力。" }
      }
    },
    {
      id: "rent_raise",
      title: "房东涨租",
      text: "合同到期，房租上涨。你要么咬牙续租，要么换远郊通勤。",
      tag: "住房",
      weight: 9,
      options: {
        left: { label: "继续住", effects: { cash: -18, debt: 10, mind: -4 }, log: "你续租原房，通勤稳定但债务压力上升。" },
        right: { label: "搬去远郊", effects: { cash: -6, energy: -8, mind: -2, debt: -6 }, log: "你搬去远郊，房租压力缓解但通勤拖垮精力。" }
      }
    },
    {
      id: "job_cut_rumor",
      title: "裁员传闻",
      text: "群里流出部门优化名单，你的名字疑似在列。",
      tag: "失业",
      weight: 8,
      options: {
        left: { label: "立即投简历", effects: { cash: -5, mind: -3, heat: 2 }, setFlags: ["job_hunt"], log: "你开始密集投递，心理压力上来了。" },
        right: { label: "先观望", effects: { mind: -6, energy: 3 }, setFlags: ["layoff_risk"], log: "你选择观望，焦虑在上升。" }
      }
    },
    {
      id: "loan_offer",
      title: "消费贷推送",
      text: "App 给你推送低息额度，正好能填补现金缺口。",
      tag: "债务",
      weight: 7,
      options: {
        left: { label: "先借一笔", effects: { cash: 30, debt: 24, mind: -2 }, setFlags: ["loan_active"], log: "你拿到短期资金，后续还款压力已埋下。" },
        right: { label: "拒绝借贷", effects: { cash: -10, mind: 2, debt: -4 }, log: "你没有新增贷款，但眼下更拮据。" }
      }
    },
    {
      id: "blind_date",
      title: "周末相亲局",
      text: "家里催你相亲，双方家庭都在问收入、房子与未来打算。",
      tag: "家庭",
      weight: 6,
      options: {
        left: { label: "认真推进", effects: { cash: -12, mind: 4, energy: -3 }, setFlags: ["relationship"], log: "相亲推进顺利，但经济压力明显。" },
        right: { label: "礼貌结束", effects: { mind: -3, heat: -2 }, log: "你回避了关系推进，家里不太满意。" }
      }
    },
    {
      id: "upskill_class",
      title: "职业培训班",
      text: "付费课程承诺转岗涨薪，但要占用大量晚间时间。",
      tag: "成长",
      weight: 7,
      options: {
        left: { label: "报名", effects: { cash: -16, energy: -8, mind: 6 }, setFlags: ["skill_up"], log: "你投入学习，短期更累但看到一点希望。" },
        right: { label: "放弃", effects: { mind: -5, cash: 4 }, log: "你选择不报班，省下钱但心态更被动。" }
      }
    },
    {
      id: "social_heat",
      title: "评论区风波",
      text: "你的一条吐槽被转发，评论区开始失控，热度上升。",
      tag: "舆情",
      weight: 5,
      options: {
        left: { label: "立刻删帖", effects: { heat: -12, mind: -2 }, log: "你快速止损，热度下降。" },
        right: { label: "硬刚到底", effects: { heat: 14, mind: -8, cash: 4 }, setFlags: ["high_heat"], log: "你硬刚评论区，热度和压力一起暴涨。" }
      }
    },
    {
      id: "helping_risk",
      title: "路边急救",
      text: "你在路边扶起摔倒老人，围观者举着手机拍你。",
      tag: "法律",
      weight: 4,
      options: {
        left: { label: "坚持送医", effects: { cash: -20, mind: -8, heat: 10 }, setFlags: ["legal_risk"], enqueue: ["legal_follow"], log: "你把人送到医院，后续舆论风险被触发。" },
        right: { label: "报警等待", effects: { mind: -4, heat: 2 }, log: "你只做最低介入，内心复杂。" }
      }
    },
    {
      id: "mortgage_choice",
      title: "房贷上车",
      text: "伴侣希望你们尽快上车，银行给出高杠杆方案。",
      tag: "房贷",
      weight: 6,
      when: (run) => hasFlag(run, "relationship"),
      options: {
        left: { label: "先上车", effects: { debt: 36, cash: -20, mind: -5 }, setFlags: ["mortgage"], log: "你背上房贷，生活进入还款模式。" },
        right: { label: "继续观望", effects: { mind: -2, heat: 2 }, log: "你暂缓买房，关系中出现分歧。" }
      }
    },
    {
      id: "child_plan",
      title: "生育计划",
      text: "家里讨论要不要尽快生孩子，现实账本摆在你面前。",
      tag: "育儿",
      weight: 4,
      when: (run) => hasFlag(run, "relationship"),
      options: {
        left: { label: "决定生育", effects: { cash: -22, energy: -10, mind: 6 }, setFlags: ["child"], log: "你做了生育决定，幸福感和压力同时上升。" },
        right: { label: "继续推迟", effects: { mind: -3, debt: -4 }, log: "你选择推迟，短期账本更稳。" }
      }
    },
    {
      id: "mortgage_repay",
      title: "月供警报",
      text: "本月现金流接近断裂，月供快到期。",
      tag: "房贷",
      weight: 9,
      when: (run) => hasFlag(run, "mortgage"),
      options: {
        left: { label: "借钱还款", effects: { cash: 10, debt: 18, mind: -6 }, log: "你用新债还旧债，暂时续命。" },
        right: { label: "协商展期", effects: { debt: -10, heat: 7, mind: -2 }, log: "你申请展期，负担缓和但风险公开化。" }
      }
    },
    {
      id: "childcare",
      title: "托育名额",
      text: "你抢到一个托育名额，但费用远超预期。",
      tag: "育儿",
      weight: 8,
      when: (run) => hasFlag(run, "child"),
      options: {
        left: { label: "咬牙交费", effects: { cash: -18, mind: 4, energy: 5 }, log: "你交了托育费，精力稍有恢复。" },
        right: { label: "自己硬扛", effects: { cash: -4, energy: -15, mind: -6 }, log: "你选择自己带娃，身体和心态都被拉扯。" }
      }
    },
    {
      id: "job_offer_follow",
      title: "新工作邀约",
      text: "投递后收到 offer，一份稳定低薪，一份高压高薪。",
      tag: "失业",
      weight: 9,
      when: (run) => hasFlag(run, "job_hunt"),
      options: {
        left: { label: "选稳定", effects: { cash: 12, mind: 7, energy: 2, heat: -3 }, clearFlags: ["job_hunt", "layoff_risk"], log: "你选了稳定路线，生活波动下降。" },
        right: { label: "冲高薪", effects: { cash: 24, energy: -10, mind: -4, heat: 6 }, clearFlags: ["job_hunt"], log: "你冲向高压岗位，收入上去但代价明显。" }
      }
    },
    {
      id: "legal_follow",
      title: "纠纷回访",
      text: "对方家属要求赔偿，监控尚未调取完成。",
      tag: "法律",
      weight: 10,
      when: (run) => hasFlag(run, "legal_risk"),
      options: {
        left: { label: "请律师", effects: { cash: -20, mind: 2, heat: -6 }, clearFlags: ["legal_risk"], log: "你请律师介入，花钱止损。" },
        right: { label: "私下和解", effects: { cash: -36, mind: -6, heat: 2 }, clearFlags: ["legal_risk"], log: "你私下和解，现金被重击。" }
      }
    }
  ];

  function hasFlag(run, k) {
    return !!(run && run.flags && run.flags[k]);
  }

  function randOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function pct(value, max, invert) {
    const p = clamp((value / max) * 100, 0, 100);
    return invert ? 100 - p : p;
  }

  function createRun() {
    const run = {
      seed: Math.random().toString(36).slice(2, 10),
      mode: "running",
      turn: 1,
      age: 19,
      focus: "steady",
      profile: {
        name: randOf(NAME_POOL),
        job: randOf(JOB_POOL),
        origin: randOf(ORIGIN_POOL)
      },
      stats: {
        health: 80,
        mind: 76,
        energy: 74,
        debt: 70,
        heat: 16,
        cash: 52
      },
      flags: {},
      queue: [],
      log: ["你进入新一轮人生卡牌局。"],
      history: [],
      currentCard: null,
      ending: "",
      achievements: []
    };
    run.currentCard = drawCard(run);
    return run;
  }

  function weightForFocus(card, focus) {
    const tag = card.tag || "";
    if (focus === "steady") {
      if (tag === "债务" || tag === "房贷") return 1.25;
      if (tag === "舆情") return 0.85;
    }
    if (focus === "growth") {
      if (tag === "成长" || tag === "就业") return 1.25;
      if (tag === "育儿") return 0.85;
    }
    if (focus === "risk") {
      if (tag === "舆情" || tag === "法律") return 1.25;
      if (tag === "住房") return 0.9;
    }
    return 1;
  }

  function drawCard(run) {
    if (run.queue.length) {
      const qid = run.queue.shift();
      const forced = CARDS.find((c) => c.id === qid);
      if (forced) return forced;
    }
    const pool = CARDS.filter((c) => {
      if (typeof c.when === "function" && !c.when(run)) return false;
      return true;
    });
    let total = 0;
    const rows = pool.map((card) => {
      const used = run.history.filter((id) => id === card.id).length;
      const antiRepeat = 1 / (1 + used * 0.5);
      const weight = (card.weight || 1) * antiRepeat * weightForFocus(card, run.focus);
      total += weight;
      return { card, weight };
    });
    let r = Math.random() * (total || 1);
    for (let i = 0; i < rows.length; i += 1) {
      r -= rows[i].weight;
      if (r <= 0) return rows[i].card;
    }
    return rows.length ? rows[0].card : CARDS[0];
  }

  function setFlag(run, list, value) {
    if (!Array.isArray(list)) return;
    list.forEach((k) => {
      run.flags[k] = value;
    });
  }

  function applyPassive(run) {
    const s = run.stats;
    s.energy -= 2;
    s.mind -= 1;
    s.cash -= 2;
    if (s.cash < 0) {
      s.debt += Math.abs(s.cash);
      s.cash = 0;
    }
    if (s.debt > 120) s.mind -= 2;
    if (s.heat > 60) s.health -= 3;
    if (s.energy < 25) s.health -= 2;
  }

  function applyEffects(run, effects) {
    const s = run.stats;
    const keys = ["health", "mind", "energy", "debt", "heat", "cash"];
    keys.forEach((k) => {
      if (Number.isFinite(effects[k])) {
        s[k] += effects[k];
      }
    });
    s.health = clamp(s.health, 0, 100);
    s.mind = clamp(s.mind, 0, 100);
    s.energy = clamp(s.energy, 0, 100);
    s.debt = clamp(s.debt, 0, 260);
    s.heat = clamp(s.heat, 0, 100);
    s.cash = clamp(s.cash, 0, 260);
  }

  function checkEnding(run) {
    const s = run.stats;
    if (s.health <= 0) return "身体线断裂";
    if (s.mind <= 0) return "精神线断裂";
    if (s.energy <= 0) return "精力线断裂";
    if (s.debt >= 220) return "债务线爆表";
    if (run.turn >= 36) {
      if (s.debt < 130 && s.health > 20 && s.mind > 20) return "你扛过了高压阶段";
      return "你勉强熬到阶段终局";
    }
    return "";
  }

  function computeAchievements(run) {
    const s = run.stats;
    const out = [];
    if (run.turn >= 36) out.push("坚守到终局");
    if (s.debt < 90) out.push("债务管理者");
    if (s.mind >= 55) out.push("情绪稳态");
    if (hasFlag(run, "child")) out.push("家庭抉择者");
    if (hasFlag(run, "mortgage")) out.push("房贷承压者");
    if (hasFlag(run, "legal_risk")) out.push("法律风波中");
    if (!out.length) out.push("继续求生");
    return out.slice(0, 4);
  }

  function play(choiceId) {
    const run = state.run;
    if (!run || run.mode === "ended") return;
    const card = run.currentCard;
    if (!card) return;
    const option = card.options && card.options[choiceId];
    if (!option) return;

    run.history.push(card.id);
    applyEffects(run, option.effects || {});
    setFlag(run, option.setFlags, true);
    setFlag(run, option.clearFlags, false);
    if (Array.isArray(option.enqueue)) {
      option.enqueue.forEach((id) => run.queue.push(id));
    }

    const line = `[T${run.turn}] ${card.title} -> ${option.label} | ${option.log || "已执行"}`;
    run.log.push(line);
    if (run.log.length > 40) run.log = run.log.slice(-40);

    applyPassive(run);

    const ending = checkEnding(run);
    if (ending) {
      run.mode = "ended";
      run.ending = ending;
      run.achievements = computeAchievements(run);
      state.shareText = [
        `我在《人生卡牌局》打出结局：${ending}`,
        `坚持到 T${run.turn} / 年龄 ${run.age}`,
        `状态：生命${run.stats.health} 精神${run.stats.mind} 精力${run.stats.energy} 债务${run.stats.debt} 热度${run.stats.heat} 现金${run.stats.cash}`,
        `成就：${run.achievements.join("、")}`
      ].join("\n");
      return;
    }

    run.turn += 1;
    run.age += 1;
    run.currentCard = drawCard(run);
  }

  function renderStats(run) {
    const s = run.stats;
    const items = [
      ["生命", s.health, 100, false],
      ["精神", s.mind, 100, false],
      ["精力", s.energy, 100, false],
      ["债务", s.debt, 220, true],
      ["热度", s.heat, 100, true],
      ["现金", s.cash, 180, false]
    ];
    els.stats.innerHTML = items.map((it) => {
      return `<div class="stat"><span>${it[0]}</span><b>${it[1]}</b><div class="bar"><i style="width:${pct(it[1], it[2], it[3]).toFixed(1)}%"></i></div></div>`;
    }).join("");
  }

  function renderCard(run) {
    const card = run.currentCard;
    if (!card || run.mode === "ended") {
      els.cardHost.innerHTML = `<article class="life-card"><h3>本局已结束</h3><p>点击“新开一局”开始下一轮人生。</p></article>`;
      return;
    }
    els.cardHost.innerHTML = `
      <article class="life-card">
        <h3>${card.title}</h3>
        <p>${card.text}</p>
        <div class="card-tags"><span class="badge">${card.tag || "事件"}</span><span class="badge">第 ${run.turn} 回合</span></div>
        <div class="choice-preview">
          <div>A: ${card.options.left.label}</div>
          <div>B: ${card.options.right.label}</div>
        </div>
      </article>`;
    els.leftBtn.textContent = card.options.left.label;
    els.rightBtn.textContent = card.options.right.label;
  }

  function renderProfile(run) {
    const p = run.profile;
    els.profile.textContent = [
      `姓名: ${p.name}`,
      `职业: ${p.job}`,
      `出身: ${p.origin}`,
      `年龄: ${run.age}`,
      `回合: ${run.turn}`,
      `策略: ${run.focus}`,
      `状态: ${run.mode === "ended" ? "已结束" : "进行中"}`
    ].join("\n");
  }

  function renderTimeline(run) {
    els.timeline.textContent = run.log.slice(-16).join("\n");
    els.timeline.scrollTop = els.timeline.scrollHeight;
  }

  function renderEnding(run) {
    if (run.mode !== "ended") {
      els.ending.textContent = "本局尚未结束";
      els.copyShareBtn.disabled = true;
      return;
    }
    els.copyShareBtn.disabled = false;
    els.ending.textContent = [
      `结局: ${run.ending}`,
      `最终回合: ${run.turn}  年龄: ${run.age}`,
      `状态: 生命${run.stats.health} 精神${run.stats.mind} 精力${run.stats.energy}`,
      `债务${run.stats.debt} 热度${run.stats.heat} 现金${run.stats.cash}`,
      `成就: ${(run.achievements || []).join("、")}`
    ].join("\n");
  }

  function renderNote(run) {
    if (run.mode === "ended") {
      els.turnNote.textContent = "本局已结束，可复制结局分享。";
      return;
    }
    const risky = [];
    if (run.stats.health < 24) risky.push("生命告急");
    if (run.stats.mind < 24) risky.push("精神告急");
    if (run.stats.energy < 24) risky.push("精力告急");
    if (run.stats.debt > 170) risky.push("债务高压");
    if (run.stats.heat > 70) risky.push("热度过高");
    const riskText = risky.length ? risky.join(" / ") : "风险可控";
    els.turnNote.textContent = `当前提示: ${riskText}\n目标: 尽量活到第36回合并保持账本与精神稳定。`;
  }

  function render() {
    const run = state.run;
    if (!run) return;
    renderStats(run);
    renderCard(run);
    renderProfile(run);
    renderTimeline(run);
    renderEnding(run);
    renderNote(run);

    const disabled = run.mode === "ended";
    els.leftBtn.disabled = disabled;
    els.rightBtn.disabled = disabled;
    if (els.focusSelect.value !== run.focus) {
      els.focusSelect.value = run.focus;
    }
  }

  async function copyShare() {
    if (!state.shareText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(state.shareText);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = state.shareText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  function bind() {
    els.newRunBtn.addEventListener("click", () => {
      state.run = createRun();
      state.shareText = "";
      render();
    });

    els.leftBtn.addEventListener("click", () => {
      play("left");
      render();
    });

    els.rightBtn.addEventListener("click", () => {
      play("right");
      render();
    });

    els.applyFocusBtn.addEventListener("click", () => {
      if (!state.run || state.run.mode === "ended") return;
      state.run.focus = els.focusSelect.value || "steady";
      state.run.log.push(`[T${state.run.turn}] 策略切换为 ${state.run.focus}`);
      render();
    });

    els.copyShareBtn.addEventListener("click", () => {
      copyShare().then(() => {
        els.turnNote.textContent = "结局文案已复制。";
      }).catch(() => {
        els.turnNote.textContent = "复制失败，请手动复制。";
      });
    });
  }

  function textState() {
    const run = state.run;
    if (!run) return JSON.stringify({ mode: "menu" });
    return JSON.stringify({
      mode: run.mode,
      turn: run.turn,
      age: run.age,
      focus: run.focus,
      stats: run.stats,
      current_card: run.currentCard ? { id: run.currentCard.id, title: run.currentCard.title, tag: run.currentCard.tag } : null,
      flags: run.flags,
      log_tail: run.log.slice(-8),
      ending: run.ending,
      achievements: run.achievements
    });
  }

  window.render_game_to_text = textState;
  window.advanceTime = function advanceTime(_) {
    render();
  };

  bind();
  state.run = createRun();
  render();
})();
