(function () {
  "use strict";

  const state = {
    run: null,
    info: "",
    busy: false,
    lastError: "",
    shareText: "",
    ending: null
  };

  const els = {
    kpi: document.getElementById("kpi"),
    cards: document.getElementById("cards"),
    info: document.getElementById("info"),
    log: document.getElementById("log"),
    newBtn: document.getElementById("new-btn"),
    drawBtn: document.getElementById("draw-btn"),
    ending: document.getElementById("ending"),
    copyShareBtn: document.getElementById("copy-share-btn"),
    buildShareBtn: document.getElementById("build-share-btn"),
    downloadShareBtn: document.getElementById("download-share-btn"),
    shareCanvas: document.getElementById("share-canvas-v2")
  };
  const shareCtx = els.shareCanvas.getContext("2d");

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  async function callApi(payload) {
    const res = await fetch("/api/mud/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(payload || {}), engineVersion: "v2" })
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (_) {
      throw new Error(`API 返回非 JSON: ${text.slice(0, 120)}`);
    }
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    return json;
  }

  function makeKpiItem(name, value, max, invert) {
    const safe = Number.isFinite(value) ? value : 0;
    const pct = max > 0 ? clamp((safe / max) * 100, 0, 100) : 0;
    const display = invert ? 100 - pct : pct;
    return `<div><span>${name}</span><strong>${safe}</strong><div class="bar"><i style="width:${display.toFixed(1)}%"></i></div></div>`;
  }

  function renderKpi() {
    const run = state.run;
    if (!run) {
      els.kpi.innerHTML = "";
      return;
    }
    const stats = run.stats || {};
    els.kpi.innerHTML = [
      makeKpiItem("生命", stats.hp, 100, false),
      makeKpiItem("精神", stats.san, 100, false),
      makeKpiItem("疲劳", stats.fatigue, 100, true),
      makeKpiItem("债务", stats.debt, 280, true),
      makeKpiItem("热度", stats.heat, 100, true),
      makeKpiItem("现金", stats.cash, 200, false),
      makeKpiItem("天数", run.day, 36, false),
      makeKpiItem("回合", run.turn, 80, false)
    ].join("");
  }

  function renderCards() {
    const run = state.run;
    if (!run || run.mode === "ended" || !Array.isArray(run.handMeta) || !run.handMeta.length) {
      els.cards.innerHTML = `<div class="card"><h3>暂无手牌</h3><p>点击“抽牌”或先完成关键抉择。</p><span class="tag">empty</span></div>`;
      return;
    }

    els.cards.innerHTML = run.handMeta
      .map((card) => {
        return `<article class="card">
          <h3>${card.title || card.id}</h3>
          <p>${card.id}</p>
          <span class="tag">${card.tag || "card"}</span>
          <div class="choice">
            <button data-play="${card.id}" data-choice="left">左选</button>
            <button data-play="${card.id}" data-choice="right">右选</button>
          </div>
        </article>`;
      })
      .join("");

    els.cards.querySelectorAll("button[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.getAttribute("data-play");
        const choiceId = btn.getAttribute("data-choice");
        play(cardId, choiceId).catch((e) => {
          state.lastError = e.message;
          render();
        });
      });
    });
  }

  function renderInfo() {
    const run = state.run;
    if (!run) {
      els.info.textContent = state.lastError || "等待初始化...";
      if (state.lastError) els.info.classList.add("error");
      else els.info.classList.remove("error");
      return;
    }
    const stage = run.storyStage || (run.story && run.story.lifeStage) || "未知阶段";
    const basic = [
      `状态: ${run.mode}`,
      `阶段: ${stage}`,
      `地点: ${run.location}`,
      `玩家: ${run.player.name} (${run.player.profession})`,
      `出牌: ${run.metrics.cardPlays} | 关键事件: ${run.metrics.keyEvents}`,
      `消息: ${state.info || "-"}`
    ];
    if (state.lastError) {
      basic.push(`错误: ${state.lastError}`);
      els.info.classList.add("error");
    } else {
      els.info.classList.remove("error");
    }
    els.info.textContent = basic.join("\n");
  }

  function renderLog() {
    const run = state.run;
    if (!run || !Array.isArray(run.log)) {
      els.log.textContent = "日志为空";
      return;
    }
    els.log.textContent = run.log.slice(-24).map((line) => `- ${line}`).join("\n");
    els.log.scrollTop = els.log.scrollHeight;
  }

  function computeAchievements(run) {
    const stats = run.stats || {};
    const arcs = run.activeArcs || {};
    const done = Object.keys(arcs).filter((k) => arcs[k] && arcs[k].done).length;
    const list = [];
    if (run.day >= 20) list.push("熬过分流期");
    if (done >= 3) list.push("链路收束者");
    if ((run.metrics && run.metrics.cardPlays) >= 24) list.push("决策耐受体");
    if ((stats.debt || 0) < 90) list.push("账本稳压");
    if ((stats.san || 0) >= 45) list.push("精神稳态");
    if ((stats.fatigue || 0) <= 45) list.push("体力调度员");
    if (!list.length) list.push("持续求生");
    return list.slice(0, 4);
  }

  function buildEnding(run) {
    if (!run || run.mode !== "ended") {
      return {
        text: "本局尚未结束",
        shareText: ""
      };
    }
    const stats = run.stats || {};
    const arcs = run.activeArcs || {};
    const arcSummary = Object.keys(arcs)
      .map((id) => {
        const a = arcs[id];
        if (!a) return null;
        if (a.done) return `${id}:已收束`;
        if (a.active) return `${id}:阶段${a.stage}`;
        return null;
      })
      .filter(Boolean)
      .join(" / ");
    const ach = computeAchievements(run);
    const title = run.day >= 36 ? "终盘幸存" : "阶段倒下";
    const text = [
      `结局: ${title}`,
      `天数/回合: D${run.day} / T${run.turn}`,
      `核心值: 生命${stats.hp} 精神${stats.san} 疲劳${stats.fatigue} 债务${stats.debt} 热度${stats.heat} 现金${stats.cash}`,
      `决策数: ${run.metrics.cardPlays} 关键事件: ${run.metrics.keyEvents}`,
      `剧情链: ${arcSummary || "无显著收束"}`,
      `成就: ${ach.join("、")}`
    ].join("\n");
    const shareText = [
      `我在《都市生存模拟器V2》打出了「${title}」`,
      `坚持到 D${run.day}/T${run.turn}，决策 ${run.metrics.cardPlays} 次，关键事件 ${run.metrics.keyEvents} 次`,
      `状态：生命${stats.hp} 精神${stats.san} 疲劳${stats.fatigue} 债务${stats.debt} 热度${stats.heat} 现金${stats.cash}`,
      `成就：${ach.join("、")}`,
      `来挑战我的卡牌命运线`
    ].join("\n");
    return { text, shareText, achievements: ach, title };
  }

  function renderShareCard(run, ending) {
    const w = els.shareCanvas.width;
    const h = els.shareCanvas.height;
    shareCtx.clearRect(0, 0, w, h);
    const bg = shareCtx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f8edd7");
    bg.addColorStop(1, "#ead9b7");
    shareCtx.fillStyle = bg;
    shareCtx.fillRect(0, 0, w, h);

    shareCtx.fillStyle = "#2a2d36";
    shareCtx.font = "700 62px 'Noto Sans SC'";
    shareCtx.fillText("都市生存模拟器 V2", 70, 110);
    shareCtx.font = "600 38px 'Noto Sans SC'";
    shareCtx.fillText(ending.title || "结局", 70, 178);

    const stats = run.stats || {};
    const lines = [
      `Day ${run.day} / Turn ${run.turn}`,
      `生命 ${stats.hp}  精神 ${stats.san}  疲劳 ${stats.fatigue}`,
      `债务 ${stats.debt}  热度 ${stats.heat}  现金 ${stats.cash}`,
      `决策 ${run.metrics.cardPlays}  关键事件 ${run.metrics.keyEvents}`,
      `成就: ${(ending.achievements || []).join("、")}`
    ];
    shareCtx.font = "500 34px 'Noto Sans SC'";
    lines.forEach((line, i) => {
      shareCtx.fillText(line, 70, 290 + i * 62);
    });

    shareCtx.font = "400 30px 'Noto Sans SC'";
    const recent = (run.log || []).slice(-6);
    shareCtx.fillText("剧情片段：", 70, 690);
    recent.forEach((line, i) => {
      shareCtx.fillText(`- ${String(line).slice(0, 36)}`, 70, 750 + i * 52);
    });

    els.downloadShareBtn.href = els.shareCanvas.toDataURL("image/png");
    els.downloadShareBtn.classList.remove("hidden");
  }

  async function copyShare() {
    if (!state.shareText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(state.shareText);
    } else {
      const ta = document.createElement("textarea");
      ta.value = state.shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    state.info = "分享文案已复制";
  }

  function renderEnding() {
    const run = state.run;
    state.ending = buildEnding(run);
    state.shareText = state.ending.shareText || "";
    els.ending.textContent = state.ending.text;
    const ended = !!run && run.mode === "ended";
    els.copyShareBtn.disabled = !ended;
    els.buildShareBtn.disabled = !ended;
    if (!ended) {
      els.downloadShareBtn.classList.add("hidden");
      shareCtx.clearRect(0, 0, els.shareCanvas.width, els.shareCanvas.height);
      shareCtx.fillStyle = "#f7f2e7";
      shareCtx.fillRect(0, 0, els.shareCanvas.width, els.shareCanvas.height);
      shareCtx.fillStyle = "#4f5a67";
      shareCtx.font = "500 36px 'Noto Sans SC'";
      shareCtx.fillText("本局结束后可生成战报图", 90, 120);
    }
  }

  function setBusy(v) {
    state.busy = !!v;
    els.newBtn.disabled = state.busy;
    els.drawBtn.disabled = state.busy || !state.run || state.run.mode === "ended";
  }

  async function newRun() {
    setBusy(true);
    state.lastError = "";
    try {
      const res = await callApi({ action: "new" });
      state.run = res.run;
      state.info = res.message || "新局已创建";
    } finally {
      setBusy(false);
      render();
    }
  }

  async function draw() {
    if (!state.run) return newRun();
    setBusy(true);
    state.lastError = "";
    try {
      const res = await callApi({ action: "draw", run: state.run });
      state.run = res.run;
      state.info = res.message || "已抽牌";
    } finally {
      setBusy(false);
      render();
    }
  }

  async function play(cardId, choiceId) {
    if (!state.run) return;
    setBusy(true);
    state.lastError = "";
    try {
      const res = await callApi({ action: "play", cardId, choiceId, run: state.run });
      state.run = res.run;
      state.info = res.message || "已出牌";
    } finally {
      setBusy(false);
      render();
    }
  }

  function render() {
    renderKpi();
    renderCards();
    renderInfo();
    renderLog();
    renderEnding();
    setBusy(state.busy);
  }

  function bind() {
    els.newBtn.addEventListener("click", () => {
      newRun().catch((e) => {
        state.lastError = e.message;
        render();
      });
    });
    els.drawBtn.addEventListener("click", () => {
      draw().catch((e) => {
        state.lastError = e.message;
        render();
      });
    });
    els.copyShareBtn.addEventListener("click", () => {
      copyShare().then(render).catch((e) => {
        state.lastError = e.message;
        render();
      });
    });
    els.buildShareBtn.addEventListener("click", () => {
      if (state.run && state.run.mode === "ended" && state.ending) {
        renderShareCard(state.run, state.ending);
        state.info = "战报图已生成";
        render();
      }
    });
  }

  function buildTextState() {
    return JSON.stringify({
      mode: state.run ? state.run.mode : "menu",
      turn: state.run ? state.run.turn : 0,
      day: state.run ? state.run.day : 0,
      story_stage: state.run ? state.run.storyStage : "",
      stats: state.run ? state.run.stats : {},
      hand: state.run ? state.run.handMeta : [],
      log_tail: state.run && state.run.log ? state.run.log.slice(-8) : [],
      info: state.info,
      error: state.lastError
    });
  }

  window.render_game_to_text = buildTextState;
  window.advanceTime = function advanceTime(_) {
    render();
  };

  bind();
  newRun().catch((e) => {
    state.lastError = e.message;
    render();
  });
})();
