(function () {
  "use strict";

  const ANALYTICS_KEY = "mud_v2_ux_analytics_v1";

  const state = {
    run: null,
    info: "",
    busy: false,
    lastError: "",
    shareText: "",
    ending: null,
    activeCardId: "",
    dragDx: 0,
    uxMetrics: {
      plays: 0,
      swipePlays: 0,
      buttonPlays: 0,
      discards: 0,
      defers: 0,
      queueHintsSeen: 0,
      shareCopy: 0,
      shareBuild: 0
    },
    uiVariantRequested: "",
    uiVariantResolved: "single",
    analytics: null,
    runStartCounters: null,
    lastRecordedEndKey: "",
    lastQueueHintText: ""
  };

  const els = {
    kpi: document.getElementById("kpi"),
    mainCardHost: document.getElementById("main-card-host"),
    handMini: document.getElementById("hand-mini"),
    queueHint: document.getElementById("queue-hint"),
    info: document.getElementById("info"),
    log: document.getElementById("log"),
    newBtn: document.getElementById("new-btn"),
    drawBtn: document.getElementById("draw-btn"),
    layoutBtn: document.getElementById("layout-btn"),
    analyticsBox: document.getElementById("analytics-box"),
    exportAnalyticsBtn: document.getElementById("export-analytics-btn"),
    resetAnalyticsBtn: document.getElementById("reset-analytics-btn"),
    ending: document.getElementById("ending"),
    copyShareBtn: document.getElementById("copy-share-btn"),
    buildShareBtn: document.getElementById("build-share-btn"),
    downloadShareBtn: document.getElementById("download-share-btn"),
    shareCanvas: document.getElementById("share-canvas-v2")
  };
  const shareCtx = els.shareCanvas.getContext("2d");

  function newAnalyticsStore() {
    return {
      version: 1,
      totals: {
        runs: 0,
        wins: 0,
        totalTurns: 0,
        totalPlays: 0,
        swipePlays: 0,
        buttonPlays: 0,
        discards: 0,
        defers: 0,
        shareCopies: 0,
        shareBuilds: 0
      },
      byVariant: {
        single: { runs: 0, wins: 0, plays: 0, turns: 0 },
        hand: { runs: 0, wins: 0, plays: 0, turns: 0 },
        auto: { runs: 0, wins: 0, plays: 0, turns: 0 }
      },
      recentRuns: []
    };
  }

  function loadAnalyticsStore() {
    try {
      const text = window.localStorage.getItem(ANALYTICS_KEY);
      if (!text) return newAnalyticsStore();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") return newAnalyticsStore();
      return {
        ...newAnalyticsStore(),
        ...parsed,
        totals: { ...newAnalyticsStore().totals, ...(parsed.totals || {}) },
        byVariant: {
          single: { ...newAnalyticsStore().byVariant.single, ...((parsed.byVariant && parsed.byVariant.single) || {}) },
          hand: { ...newAnalyticsStore().byVariant.hand, ...((parsed.byVariant && parsed.byVariant.hand) || {}) },
          auto: { ...newAnalyticsStore().byVariant.auto, ...((parsed.byVariant && parsed.byVariant.auto) || {}) }
        },
        recentRuns: Array.isArray(parsed.recentRuns) ? parsed.recentRuns.slice(0, 24) : []
      };
    } catch (_) {
      return newAnalyticsStore();
    }
  }

  function saveAnalyticsStore() {
    try {
      window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(state.analytics || newAnalyticsStore()));
    } catch (_) {
      // Ignore storage errors.
    }
  }

  function snapshotUx() {
    return {
      plays: state.uxMetrics.plays,
      swipePlays: state.uxMetrics.swipePlays,
      buttonPlays: state.uxMetrics.buttonPlays,
      discards: state.uxMetrics.discards,
      defers: state.uxMetrics.defers,
      shareCopy: state.uxMetrics.shareCopy,
      shareBuild: state.uxMetrics.shareBuild
    };
  }

  function startRunTracking() {
    state.runStartCounters = snapshotUx();
  }

  function runVariantLabel() {
    if (state.uiVariantRequested === "single" || state.uiVariantRequested === "hand") return state.uiVariantRequested;
    return "auto";
  }

  function accumulateRunAnalytics(run) {
    if (!run || run.mode !== "ended" || !state.runStartCounters || !state.analytics) return;
    const key = `${run.player && run.player.name ? run.player.name : "-"}:${run.day}:${run.turn}:${run.metrics && run.metrics.cardPlays ? run.metrics.cardPlays : 0}`;
    if (state.lastRecordedEndKey === key) return;
    state.lastRecordedEndKey = key;

    const diff = {
      plays: Math.max(0, state.uxMetrics.plays - state.runStartCounters.plays),
      swipePlays: Math.max(0, state.uxMetrics.swipePlays - state.runStartCounters.swipePlays),
      buttonPlays: Math.max(0, state.uxMetrics.buttonPlays - state.runStartCounters.buttonPlays),
      discards: Math.max(0, state.uxMetrics.discards - state.runStartCounters.discards),
      defers: Math.max(0, state.uxMetrics.defers - state.runStartCounters.defers),
      shareCopies: Math.max(0, state.uxMetrics.shareCopy - state.runStartCounters.shareCopy),
      shareBuilds: Math.max(0, state.uxMetrics.shareBuild - state.runStartCounters.shareBuild)
    };
    const win = run.day >= 36 ? 1 : 0;
    const variant = runVariantLabel();

    state.analytics.totals.runs += 1;
    state.analytics.totals.wins += win;
    state.analytics.totals.totalTurns += Number(run.turn || 0);
    state.analytics.totals.totalPlays += diff.plays;
    state.analytics.totals.swipePlays += diff.swipePlays;
    state.analytics.totals.buttonPlays += diff.buttonPlays;
    state.analytics.totals.discards += diff.discards;
    state.analytics.totals.defers += diff.defers;
    state.analytics.totals.shareCopies += diff.shareCopies;
    state.analytics.totals.shareBuilds += diff.shareBuilds;

    const bucket = state.analytics.byVariant[variant] || state.analytics.byVariant.auto;
    bucket.runs += 1;
    bucket.wins += win;
    bucket.plays += diff.plays;
    bucket.turns += Number(run.turn || 0);

    state.analytics.recentRuns.unshift({
      at: new Date().toISOString(),
      variant,
      day: run.day || 0,
      turn: run.turn || 0,
      win: !!win,
      plays: diff.plays,
      discards: diff.discards,
      defers: diff.defers,
      swipeRate: diff.plays > 0 ? Math.round((diff.swipePlays / diff.plays) * 1000) / 1000 : 0
    });
    state.analytics.recentRuns = state.analytics.recentRuns.slice(0, 24);
    saveAnalyticsStore();
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function ratio(v, max, invert) {
    const safe = Number.isFinite(v) ? v : 0;
    const pct = max > 0 ? clamp((safe / max) * 100, 0, 100) : 0;
    return invert ? 100 - pct : pct;
  }

  function getMainCard(run) {
    const hand = Array.isArray(run && run.handMeta) ? run.handMeta : [];
    if (!hand.length) return null;
    if (!state.activeCardId) {
      state.activeCardId = hand[0].id;
      return hand[0];
    }
    const hit = hand.find((x) => x && x.id === state.activeCardId);
    if (hit) return hit;
    state.activeCardId = hand[0].id;
    return hand[0];
  }

  function readRequestedVariant() {
    const q = new URLSearchParams(window.location.search);
    const v = String(q.get("uiVariant") || "").toLowerCase();
    if (v === "single" || v === "hand") return v;
    return "";
  }

  function resolveVariant() {
    if (state.uiVariantRequested === "single" || state.uiVariantRequested === "hand") {
      return state.uiVariantRequested;
    }
    return window.matchMedia("(max-width: 720px)").matches ? "single" : "hand";
  }

  function nextForcedHint(run) {
    if (!run) return "";
    const hand = Array.isArray(run.handMeta) ? run.handMeta : [];
    const inHandForced = hand.find((x) => x && x.forced);
    if (inHandForced) {
      return `强制后续已到达：${inHandForced.title || inHandForced.id}`;
    }
    const q = Array.isArray(run.queue) ? run.queue.slice() : [];
    if (!q.length) return "";
    q.sort((a, b) => (a.dueIn || 0) - (b.dueIn || 0));
    const first = q[0];
    if (!first || !first.cardId) return "";
    const due = Number.isFinite(first.dueIn) ? first.dueIn : 0;
    if (due <= 0) return `强制后续：${first.cardId}（即将触发）`;
    return `强制后续：${first.cardId}（约 ${due} 回合后）`;
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
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  function renderKpi() {
    const run = state.run;
    if (!run) {
      els.kpi.innerHTML = "";
      return;
    }
    const stats = run.stats || {};
    const items = [
      ["生命", stats.hp, 100, false],
      ["精神", stats.san, 100, false],
      ["疲劳", stats.fatigue, 100, true],
      ["债务", stats.debt, 280, true],
      ["热度", stats.heat, 100, true],
      ["现金", stats.cash, 220, false],
      ["天数", run.day, 36, false],
      ["回合", run.turn, 80, false]
    ];
    els.kpi.innerHTML = items
      .map((it) => `<div><span>${it[0]}</span><strong>${Number.isFinite(it[1]) ? it[1] : 0}</strong><div class="bar"><i style="width:${ratio(it[1], it[2], it[3]).toFixed(1)}%"></i></div></div>`)
      .join("");
  }

  function renderQueueHint() {
    const text = nextForcedHint(state.run);
    if (!text) {
      els.queueHint.classList.remove("show");
      els.queueHint.textContent = "";
      state.lastQueueHintText = "";
      return;
    }
    els.queueHint.classList.add("show");
    els.queueHint.textContent = text;
    if (text !== state.lastQueueHintText) {
      state.uxMetrics.queueHintsSeen += 1;
      state.lastQueueHintText = text;
    }
  }

  function renderMainCard() {
    const run = state.run;
    const hand = Array.isArray(run && run.handMeta) ? run.handMeta : [];
    if (!run || run.mode === "ended" || !hand.length) {
      els.mainCardHost.innerHTML = `<div class="main-card"><h3>暂无手牌</h3><p>点击“补牌”继续，或新开一局。</p></div>`;
      return;
    }

    const card = getMainCard(run);
    if (!card) {
      els.mainCardHost.innerHTML = `<div class="main-card"><h3>暂无可选主卡</h3></div>`;
      return;
    }

    els.mainCardHost.innerHTML = `
      <article class="main-card" data-card-id="${card.id}">
        <h3>${card.title || card.id}</h3>
        <p>${card.text || card.id}</p>
        <div class="row">
          <span class="tag">${card.tag || "card"}</span>
          ${card.forced ? '<span class="forced-tag">强制后续</span>' : ""}
        </div>
        <div class="preview">
          <i id="preview-left">左滑：${card.leftLabel || "左选"}</i>
          <i id="preview-right">右滑：${card.rightLabel || "右选"}</i>
        </div>
        <div class="actions">
          <button data-play="${card.id}" data-choice="left">${card.leftLabel || "左选"}</button>
          <button data-play="${card.id}" data-choice="right">${card.rightLabel || "右选"}</button>
        </div>
        ${card.canDiscard ? `<div class="actions"><button data-hand-op="${card.id}" data-op="discard">弃置</button><button data-hand-op="${card.id}" data-op="defer">延后</button></div>` : ""}
      </article>`;

    bindMainCardActions(card);
  }

  function renderMiniHand() {
    const run = state.run;
    const hand = Array.isArray(run && run.handMeta) ? run.handMeta : [];
    if (!hand.length) {
      els.handMini.innerHTML = "";
      return;
    }
    const main = getMainCard(run);
    const list = hand.filter((x) => x && main && x.id !== main.id);
    if (!list.length) {
      els.handMini.innerHTML = "";
      return;
    }
    const variant = state.uiVariantResolved;
    els.handMini.innerHTML = list
      .map((card) => {
        const handActions = variant === "hand"
          ? `<div class="actions"><button data-play-mini="${card.id}" data-choice="left">${card.leftLabel || "左选"}</button><button data-play-mini="${card.id}" data-choice="right">${card.rightLabel || "右选"}</button></div>`
          : "";
        const handOps = card.canDiscard ? `<div class="actions"><button data-op-mini="${card.id}" data-op="discard">弃置</button><button data-op-mini="${card.id}" data-op="defer">延后</button></div>` : "";
        return `<article class="mini-card">
          <h4>${card.title || card.id}</h4>
          <p>${card.text ? String(card.text).slice(0, 36) : card.id}</p>
          <div class="row">
            <span class="tag">${card.tag || "card"}</span>
            ${card.forced ? '<span class="forced-tag">强制</span>' : ""}
          </div>
          ${handActions}
          ${handOps}
          <button data-focus="${card.id}">设为主卡</button>
        </article>`;
      })
      .join("");

    els.handMini.querySelectorAll("button[data-focus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.getAttribute("data-focus");
        if (!cardId) return;
        state.activeCardId = cardId;
        renderMainCard();
      });
    });
    els.handMini.querySelectorAll("button[data-play-mini]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.getAttribute("data-play-mini");
        const choiceId = btn.getAttribute("data-choice");
        state.uxMetrics.buttonPlays += 1;
        play(cardId, choiceId).catch((e) => {
          state.lastError = e.message;
          render();
        });
      });
    });
    els.handMini.querySelectorAll("button[data-op-mini]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.getAttribute("data-op-mini");
        const op = btn.getAttribute("data-op");
        state.uxMetrics.buttonPlays += 1;
        handOp(cardId, op).catch((e) => {
          state.lastError = e.message;
          render();
        });
      });
    });
  }

  function pointerX(event) {
    if (event.touches && event.touches[0]) return event.touches[0].clientX;
    if (event.changedTouches && event.changedTouches[0]) return event.changedTouches[0].clientX;
    return event.clientX;
  }

  function bindMainCardActions(card) {
    const host = els.mainCardHost;
    host.querySelectorAll("button[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.getAttribute("data-play");
        const choiceId = btn.getAttribute("data-choice");
        state.uxMetrics.buttonPlays += 1;
        play(cardId, choiceId).catch((e) => {
          state.lastError = e.message;
          render();
        });
      });
    });
    host.querySelectorAll("button[data-hand-op]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.getAttribute("data-hand-op");
        const op = btn.getAttribute("data-op");
        state.uxMetrics.buttonPlays += 1;
        handOp(cardId, op).catch((e) => {
          state.lastError = e.message;
          render();
        });
      });
    });

    const el = host.querySelector(".main-card");
    if (!el || !card) return;

    let dragging = false;
    let startX = 0;

    const left = host.querySelector("#preview-left");
    const right = host.querySelector("#preview-right");

    function applyDrag(dx) {
      state.dragDx = dx;
      const rot = clamp(dx / 18, -12, 12);
      el.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
      if (left) left.classList.toggle("active-left", dx < -35);
      if (right) right.classList.toggle("active-right", dx > 35);
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      const dx = state.dragDx;
      state.dragDx = 0;
      if (Math.abs(dx) >= 110 && !state.busy) {
        const choiceId = dx < 0 ? "left" : "right";
        state.uxMetrics.swipePlays += 1;
        play(card.id, choiceId).catch((e) => {
          state.lastError = e.message;
          render();
        });
        return;
      }
      el.style.transform = "translateX(0px) rotate(0deg)";
      if (left) left.classList.remove("active-left");
      if (right) right.classList.remove("active-right");
    }

    const onStart = (e) => {
      if (state.busy) return;
      dragging = true;
      startX = pointerX(e);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchend", onEnd, { passive: true });
      window.addEventListener("touchcancel", onEnd, { passive: true });
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = pointerX(e) - startX;
      applyDrag(dx);
    };

    function detach() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    }

    const onEnd = () => {
      endDrag();
      detach();
    };

    el.addEventListener("mousedown", onStart);
    el.addEventListener("touchstart", onStart, { passive: true });
  }

  function renderAnalytics() {
    const a = state.analytics || newAnalyticsStore();
    const t = a.totals || {};
    const runs = Number(t.runs || 0);
    const plays = Number(t.totalPlays || 0);
    const swipeRate = plays > 0 ? Math.round((Number(t.swipePlays || 0) / plays) * 1000) / 1000 : 0;
    const winRate = runs > 0 ? Math.round((Number(t.wins || 0) / runs) * 1000) / 1000 : 0;
    const avgTurn = runs > 0 ? Math.round((Number(t.totalTurns || 0) / runs) * 10) / 10 : 0;
    const shares = Number(t.shareCopies || 0) + Number(t.shareBuilds || 0);
    const shareRate = runs > 0 ? Math.round((shares / runs) * 1000) / 1000 : 0;
    const bSingle = (a.byVariant && a.byVariant.single) || { runs: 0, wins: 0, plays: 0, turns: 0 };
    const bHand = (a.byVariant && a.byVariant.hand) || { runs: 0, wins: 0, plays: 0, turns: 0 };
    const bAuto = (a.byVariant && a.byVariant.auto) || { runs: 0, wins: 0, plays: 0, turns: 0 };
    const last = Array.isArray(a.recentRuns) ? a.recentRuns.slice(0, 3) : [];
    const lastText = last.length
      ? last.map((x) => `${x.at.slice(0, 16)} ${x.variant} D${x.day}/T${x.turn} plays=${x.plays} discard=${x.discards} defer=${x.defers} swipe=${x.swipeRate}`).join("\n")
      : "-";

    els.analyticsBox.textContent = [
      `累计局数: ${runs}  胜率: ${winRate}  平均回合: ${avgTurn}`,
      `累计出牌: ${plays}  滑动占比: ${swipeRate}  分享转化(粗略): ${shareRate}`,
      `累计弃置: ${t.discards || 0}  累计延后: ${t.defers || 0}`,
      `single: runs=${bSingle.runs} wins=${bSingle.wins} plays=${bSingle.plays} turns=${bSingle.turns}`,
      `hand: runs=${bHand.runs} wins=${bHand.wins} plays=${bHand.plays} turns=${bHand.turns}`,
      `auto: runs=${bAuto.runs} wins=${bAuto.wins} plays=${bAuto.plays} turns=${bAuto.turns}`,
      "",
      "最近3局：",
      lastText
    ].join("\n");
  }

  function renderInfo() {
    const run = state.run;
    if (!run) {
      els.info.textContent = state.lastError || "等待初始化...";
      if (state.lastError) els.info.classList.add("error");
      else els.info.classList.remove("error");
      return;
    }
    const stage = run.storyStage || "未知阶段";
    const obs = run.observability || {};
    const basic = [
      `状态: ${run.mode}`,
      `布局: ${state.uiVariantResolved}${state.uiVariantRequested ? ` (manual:${state.uiVariantRequested})` : " (auto)"}`,
      `阶段: ${stage}`,
      `玩家: ${run.player.name} (${run.player.profession})`,
      `出牌: ${run.metrics.cardPlays} | 多样性: ${obs.cardDiversity || 0} | 重复率: ${obs.repeatRate || 0}`,
      `手牌管理: 弃置${run.metrics.discards || 0} / 延后${run.metrics.defers || 0}`,
      `剧情链收束率: ${obs.arcCompletionRate || 0} | 强制命中率: ${obs.queueHitRate || 0}`,
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

  function topCards(run, limit) {
    const hist = Array.isArray(run && run.playHistory) ? run.playHistory : [];
    const map = {};
    for (let i = 0; i < hist.length; i += 1) {
      const id = hist[i];
      if (!id) continue;
      map[id] = (map[id] || 0) + 1;
    }
    return Object.keys(map)
      .sort((a, b) => map[b] - map[a])
      .slice(0, limit || 3)
      .map((id) => `${id} x${map[id]}`);
  }

  function recentTimeline(run, limit) {
    const list = Array.isArray(run && run.eventLog) ? run.eventLog.slice(-80) : [];
    const out = [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const e = list[i] || {};
      if (!e.type) continue;
      if (e.type === "arc_activate") out.push(`D${e.day} 激活链路 ${e.arcId}`);
      else if (e.type === "arc_step") out.push(`D${e.day} 链路推进 ${e.arcId}-S${e.stage}`);
      else if (e.type === "draw_forced") out.push(`D${e.day} 强制后续 ${e.cardId}`);
      else if (e.type === "end") out.push(`D${e.day} 结局 ${e.reason || "-"}`);
      if (out.length >= (limit || 4)) break;
    }
    return out.reverse();
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
    if (!list.length) list.push("持续求生");
    return list.slice(0, 4);
  }

  function buildEnding(run) {
    if (!run || run.mode !== "ended") return { text: "本局尚未结束", shareText: "" };
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
    const keys = topCards(run, 3);
    const timeline = recentTimeline(run, 4);
    const title = run.day >= 36 ? "终盘幸存" : "阶段倒下";
    const text = [
      `结局: ${title}`,
      `天数/回合: D${run.day} / T${run.turn}`,
      `核心值: 生命${stats.hp} 精神${stats.san} 疲劳${stats.fatigue} 债务${stats.debt} 热度${stats.heat} 现金${stats.cash}`,
      `决策数: ${run.metrics.cardPlays} 关键事件: ${run.metrics.keyEvents}`,
      `剧情链: ${arcSummary || "无显著收束"}`,
      `关键牌: ${keys.length ? keys.join("、") : "暂无"}`,
      `轨迹: ${timeline.length ? timeline.join(" | ") : "暂无"}`,
      `成就: ${ach.join("、")}`
    ].join("\n");

    const shareText = [
      `我在《都市生存模拟器》打出了「${title}」`,
      `坚持到 D${run.day}/T${run.turn}，决策 ${run.metrics.cardPlays} 次，关键事件 ${run.metrics.keyEvents} 次`,
      `状态：生命${stats.hp} 精神${stats.san} 疲劳${stats.fatigue} 债务${stats.debt} 热度${stats.heat} 现金${stats.cash}`,
      `关键牌：${keys.length ? keys.join("、") : "暂无"}`,
      `轨迹：${timeline.length ? timeline.join("；") : "暂无"}`,
      `成就：${ach.join("、")}`
    ].join("\n");

    return { text, shareText, achievements: ach, title, keyCards: keys, timeline };
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
    shareCtx.fillText("都市生存模拟器", 70, 110);
    shareCtx.font = "600 38px 'Noto Sans SC'";
    shareCtx.fillText(ending.title || "结局", 70, 178);

    const stats = run.stats || {};
    const lines = [
      `Day ${run.day} / Turn ${run.turn}`,
      `生命 ${stats.hp}  精神 ${stats.san}  疲劳 ${stats.fatigue}`,
      `债务 ${stats.debt}  热度 ${stats.heat}  现金 ${stats.cash}`,
      `决策 ${run.metrics.cardPlays}  关键事件 ${run.metrics.keyEvents}`,
      `关键牌: ${(ending.keyCards || []).join("、") || "暂无"}`,
      `成就: ${(ending.achievements || []).join("、")}`
    ];
    shareCtx.font = "500 34px 'Noto Sans SC'";
    lines.forEach((line, i) => shareCtx.fillText(line, 70, 290 + i * 62));

    shareCtx.font = "400 30px 'Noto Sans SC'";
    const recent = (run.log || []).slice(-6);
    shareCtx.fillText("剧情片段：", 70, 760);
    recent.forEach((line, i) => shareCtx.fillText(`- ${String(line).slice(0, 36)}`, 70, 820 + i * 52));
    const timeline = Array.isArray(ending.timeline) ? ending.timeline : [];
    if (timeline.length) {
      shareCtx.fillText("关键轨迹：", 70, 1180);
      timeline.slice(0, 3).forEach((line, i) => shareCtx.fillText(`- ${String(line).slice(0, 36)}`, 70, 1240 + i * 52));
    }

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
    state.uxMetrics.shareCopy += 1;
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
    if (run && run.mode === "ended") {
      accumulateRunAnalytics(run);
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
    state.activeCardId = "";
    state.lastRecordedEndKey = "";
    try {
      const res = await callApi({ action: "new" });
      state.run = res.run;
      state.info = res.message || "新局已创建";
      startRunTracking();
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
      state.info = res.message || "已补牌";
    } finally {
      setBusy(false);
      render();
    }
  }

  async function play(cardId, choiceId) {
    if (!state.run || !cardId) return;
    setBusy(true);
    state.lastError = "";
    try {
      const res = await callApi({ action: "play", cardId, choiceId, run: state.run });
      state.run = res.run;
      state.uxMetrics.plays += 1;
      state.info = res.message || "已出牌";
      const hand = Array.isArray(state.run.handMeta) ? state.run.handMeta : [];
      if (hand.length) {
        state.activeCardId = hand[0].id;
      } else {
        state.activeCardId = "";
      }
    } finally {
      setBusy(false);
      render();
    }
  }

  async function handOp(cardId, op) {
    if (!state.run || !cardId || (op !== "discard" && op !== "defer")) return;
    setBusy(true);
    state.lastError = "";
    try {
      const res = await callApi({ action: op, cardId, run: state.run });
      state.run = res.run;
      if (op === "discard") state.uxMetrics.discards += 1;
      else state.uxMetrics.defers += 1;
      state.info = res.message || (op === "discard" ? "已弃置" : "已延后");
      const hand = Array.isArray(state.run.handMeta) ? state.run.handMeta : [];
      state.activeCardId = hand.length ? hand[0].id : "";
    } finally {
      setBusy(false);
      render();
    }
  }

  function render() {
    renderKpi();
    renderQueueHint();
    renderMainCard();
    renderMiniHand();
    renderInfo();
    renderLog();
    renderEnding();
    renderAnalytics();
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
    els.layoutBtn.addEventListener("click", () => {
      if (state.uiVariantRequested === "") state.uiVariantRequested = state.uiVariantResolved === "single" ? "hand" : "single";
      else if (state.uiVariantRequested === "single") state.uiVariantRequested = "hand";
      else if (state.uiVariantRequested === "hand") state.uiVariantRequested = "";
      state.uiVariantResolved = resolveVariant();
      const label = state.uiVariantRequested || "自动";
      els.layoutBtn.textContent = `布局：${label}`;
      render();
    });
    els.exportAnalyticsBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.analytics || newAnalyticsStore(), null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ux-analytics.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      state.info = "指标 JSON 已导出";
      render();
    });
    els.resetAnalyticsBtn.addEventListener("click", () => {
      state.analytics = newAnalyticsStore();
      saveAnalyticsStore();
      state.info = "累计指标已重置";
      render();
    });
    els.copyShareBtn.addEventListener("click", () => {
      copyShare().then(render).catch((e) => {
        state.lastError = e.message;
        render();
      });
    });
    els.buildShareBtn.addEventListener("click", () => {
      if (state.run && state.run.mode === "ended" && state.ending) {
        state.uxMetrics.shareBuild += 1;
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
      active_card: state.activeCardId,
      ui_variant: state.uiVariantResolved,
      log_tail: state.run && state.run.log ? state.run.log.slice(-8) : [],
      info: state.info,
      error: state.lastError,
      ux_metrics: state.uxMetrics,
      ux_analytics_totals: state.analytics ? state.analytics.totals : {}
    });
  }

  window.render_game_to_text = buildTextState;
  window.advanceTime = function advanceTime(_) {
    render();
  };

  state.analytics = loadAnalyticsStore();
  state.uiVariantRequested = readRequestedVariant();
  state.uiVariantResolved = resolveVariant();
  if (els.layoutBtn) {
    els.layoutBtn.textContent = `布局：${state.uiVariantRequested || "自动"}`;
  }
  window.addEventListener("resize", () => {
    if (!state.uiVariantRequested) {
      state.uiVariantResolved = resolveVariant();
      render();
    }
  });

  bind();
  newRun().catch((e) => {
    state.lastError = e.message;
    render();
  });
})();
