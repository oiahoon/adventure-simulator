(function () {
  "use strict";

  const state = {
    run: null,
    info: "",
    busy: false,
    lastError: ""
  };

  const els = {
    kpi: document.getElementById("kpi"),
    cards: document.getElementById("cards"),
    info: document.getElementById("info"),
    log: document.getElementById("log"),
    newBtn: document.getElementById("new-btn"),
    drawBtn: document.getElementById("draw-btn")
  };

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
    if (!run || !Array.isArray(run.handMeta) || !run.handMeta.length) {
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

  function setBusy(v) {
    state.busy = !!v;
    els.newBtn.disabled = state.busy;
    els.drawBtn.disabled = state.busy;
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
