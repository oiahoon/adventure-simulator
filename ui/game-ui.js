const TAG_META = {
  work: { label: "硬扛流", cls: "tag-work", icon: "./assets/pixel/decor/icon-history.svg" },
  risk: { label: "梭哈流", cls: "tag-risk", icon: "./assets/pixel/decor/corner-gold.svg" },
  control: { label: "控场流", cls: "tag-control", icon: "./assets/pixel/decor/icon-event.svg" },
  network: { label: "关系流", cls: "tag-network", icon: "./assets/pixel/decor/icon-skill.svg" },
  social: { label: "社交流", cls: "tag-social", icon: "./assets/pixel/decor/icon-event.svg" },
  content: { label: "内容流", cls: "tag-content", icon: "./assets/pixel/decor/icon-history.svg" },
  rest: { label: "续命流", cls: "tag-rest", icon: "./assets/pixel/decor/icon-supply.svg" },
  money: { label: "现金流", cls: "tag-money", icon: "./assets/pixel/decor/icon-supply.svg" },
};

const STAT_META = {
  money: { label: "现金", element: "金", subtitle: "财流" },
  energy: { label: "体力", element: "木", subtitle: "生机" },
  mood: { label: "心态", element: "水", subtitle: "心湖" },
  reputation: { label: "人设", element: "火", subtitle: "声望" },
  heat: { label: "热度", element: "土", subtitle: "势能" },
};

function chapterTone(chapter = "") {
  if (chapter.includes("第一章")) return "tone-wood";
  if (chapter.includes("第二章")) return "tone-fire";
  if (chapter.includes("第三章")) return "tone-earth";
  if (chapter.includes("第四章")) return "tone-metal";
  if (chapter.includes("第五章")) return "tone-water";
  if (chapter.includes("第六章")) return "tone-dark";
  if (chapter.includes("成长节点")) return "tone-growth";
  if (chapter.includes("强制事件")) return "tone-force";
  return "tone-plain";
}

function optionCard(option, index) {
  const tag = TAG_META[option.tag] || { label: "行动流", cls: "tag-generic", icon: "./assets/pixel/decor/icon-event.svg" };
  return `<button class="option-btn ${tag.cls}" data-option-id="${option.id}" style="--stagger:${index}">
    <span class="opt-mark" aria-hidden="true"><img src="${tag.icon}" alt="" loading="lazy" decoding="async" /></span>
    <span class="opt-head">
      <span class="opt-title">${option.label}</span>
      <span class="opt-tag"><img class="opt-tag-icon" src="${tag.icon}" alt="" loading="lazy" decoding="async" />${tag.label}</span>
    </span>
    <span class="opt-impact">${option.impactText}</span>
  </button>`;
}

function historyItem(item) {
  return `<li>Day ${item.day}: ${item.optionLabel} <span>${item.impactText}</span></li>`;
}

function simpleList(items = []) {
  if (!items.length) return "<li>暂无</li>";
  return items.map((line) => `<li>${line}</li>`).join("");
}

function tempSkillCard(skill, disabled) {
  return `<button class="ghost module-btn skill-btn" data-skill-id="${skill.id}" ${disabled ? "disabled" : ""}>
    <span class="icon-line">
      <img class="pixel-icon" src="${skill.icon}" alt="" loading="lazy" decoding="async" />
      <span>${skill.name}</span>
    </span>
    <span class="opt-impact">${skill.impactText}</span>
  </button>`;
}

function foodCard(food, disabled) {
  return `<button class="ghost module-btn supply-btn" data-food-id="${food.id}" ${disabled ? "disabled" : ""}>
    <span class="icon-line">
      <img class="pixel-icon" src="${food.icon}" alt="" loading="lazy" decoding="async" />
      <span>${food.name}</span>
    </span>
    <span class="opt-impact">${food.impactText}${food.affordable ? "" : " · 现金不足"}</span>
  </button>`;
}

function statBar(key, value, tone) {
  const meta = STAT_META[key];
  const percent = Math.max(0, Math.min(100, Math.round((value / 10) * 100)));
  const rankClass = value <= 2 ? "is-critical" : value >= 8 ? "is-strong" : "is-normal";
  return `<div class="hud-bar ${tone} ${rankClass}">
    <span class="hud-name"><span class="hud-ele">${meta.element}</span>${meta.label}</span>
    <div class="hud-track"><div class="hud-fill" style="width:${percent}%"></div></div>
    <span class="hud-value">${value}/10</span>
  </div>`;
}

function radarMetricValue(score) {
  return Math.round((Math.max(-100, Math.min(100, score)) + 100) / 2);
}

function buildPentagonRadarSvg(traits = []) {
  const size = 210;
  const center = size / 2;
  const radius = 78;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const pointsForScale = (scale) =>
    traits
      .map((_, idx) => {
        const a = (-Math.PI / 2) + (idx * Math.PI * 2) / traits.length;
        const r = radius * scale;
        const x = center + Math.cos(a) * r;
        const y = center + Math.sin(a) * r;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const dataPoints = traits
    .map((item, idx) => {
      const a = (-Math.PI / 2) + (idx * Math.PI * 2) / traits.length;
      const metric = radarMetricValue(item.score);
      const r = radius * (metric / 100);
      const x = center + Math.cos(a) * r;
      const y = center + Math.sin(a) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const axisLines = traits
    .map((_, idx) => {
      const a = (-Math.PI / 2) + (idx * Math.PI * 2) / traits.length;
      const x = center + Math.cos(a) * radius;
      const y = center + Math.sin(a) * radius;
      return `<line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
    })
    .join("");

  const labels = traits
    .map((item, idx) => {
      const a = (-Math.PI / 2) + (idx * Math.PI * 2) / traits.length;
      const x = center + Math.cos(a) * (radius + 20);
      const y = center + Math.sin(a) * (radius + 20);
      const value = radarMetricValue(item.score);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${item.name} ${value}</text>`;
    })
    .join("");

  const rings = levels
    .map((level) => `<polygon points="${pointsForScale(level)}" />`)
    .join("");

  return `
    <svg class="persona-radar-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="人格五维雷达图">
      <g class="radar-rings">${rings}</g>
      <g class="radar-axis">${axisLines}</g>
      <polygon class="radar-area" points="${dataPoints}" />
      <polyline class="radar-line" points="${dataPoints} ${dataPoints.split(" ")[0]}" />
      <g class="radar-labels">${labels}</g>
    </svg>
  `;
}

export function createGameUI(root, actions) {
  root.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div class="brand-wrap">
          <div class="brand-line">
            <img class="logo-main" src="./assets/pixel/brand/logo-main-v2.png" alt="都市生活挑战" decoding="async" loading="eager" />
            <h1 class="brand-title">都市生活挑战</h1>
          </div>
          <p id="subtitle">JOJO风都市生存卡牌</p>
        </div>
        <button class="ghost" id="restart-btn">重开</button>
      </header>
      <section id="main-panel"></section>
    </section>
  `;

  const panel = root.querySelector("#main-panel");
  root.querySelector("#restart-btn").addEventListener("click", () => actions.onRestart());

  let renderedMode = "";
  let refs = {};

  function withTapFeedback(el, cb) {
    if (!el) return;
    el.classList.add("tap-fx");
    el.disabled = true;
    window.setTimeout(cb, 65);
  }

  function bindDynamicEvents() {
    panel.querySelectorAll("[data-option-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const optionId = el.dataset.optionId;
        withTapFeedback(el, () => actions.onPickOption(optionId));
      });
    });

    panel.querySelectorAll("[data-skill-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const skillId = el.dataset.skillId;
        withTapFeedback(el, () => actions.onUseSkill(skillId));
      });
    });
    panel.querySelectorAll("[data-food-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const foodId = el.dataset.foodId;
        withTapFeedback(el, () => actions.onBuyFood(foodId));
      });
    });

    panel.querySelector("#start-btn")?.addEventListener("click", () => actions.onStart());
    panel.querySelector("#wechat-share-btn")?.addEventListener("click", () => actions.onWeChatShare());
    panel.querySelector("#copy-share-btn")?.addEventListener("click", () => actions.onCopyShare());
  }

  function renderIntro() {
    panel.innerHTML = `
      <article class="card hero">
        <p class="badge">都市生活挑战</p>
        <h2>这局只看一件事：你能不能坚持 100 天。</h2>
        <p>每天一个高压事件，三选一，直到属性崩盘才会结算并生成分享文案。</p>
        <button id="start-btn" class="primary">开始新挑战</button>
      </article>
    `;
    bindDynamicEvents();
  }

  function renderEnded(view) {
    const restartLocked = Boolean(view.endingUi?.restartLocked);
    const restartConfirm = Boolean(view.endingUi?.restartConfirm);
    const restartText = restartLocked ? "结算中..." : restartConfirm ? "确认再来一局" : "再来一局";
    const persona = view.result.personality;
    const llmTraitMap = Object.fromEntries(
      ((persona?.llm?.traitComments || []).filter((item) => item && item.id)).map((item) => [item.id, item.line || ""])
    );
    const traitLines = (persona?.traits || [])
      .map((item) => {
        const llmLine = llmTraitMap[item.id] ? `；${llmTraitMap[item.id]}` : "";
        return `<li>${item.name}：${item.label}（分值 ${item.score >= 0 ? "+" : ""}${item.score}｜置信 ${item.confidence}%）${llmLine}</li>`;
      })
      .join("");
    const radarSvg = persona?.traits?.length >= 5 ? buildPentagonRadarSvg(persona.traits.slice(0, 5)) : "";
    const radarBg = view.avatar?.baseUrl
      ? `<img class="persona-radar-bg" src="${view.avatar.baseUrl}" alt="" loading="eager" decoding="async" />`
      : "";

    panel.innerHTML = `
      <article class="card hero end">
        <p class="badge">结局</p>
        <h2>${view.result.ending.title}</h2>
        <p>${view.result.ending.subtitle}</p>
        <p class="score">本局坚持 ${view.result.daysSurvived} 天</p>
        <article class="reason-block">
          <h3>结局成因</h3>
          <ul class="history">
            ${(view.result.reason?.bullets || []).map((line) => `<li>${line}</li>`).join("")}
          </ul>
        </article>
        <article class="reason-block">
          <h3>整局故事</h3>
          ${
            view.result.storyLoading
              ? "<p>正在生成本局剧情总结...</p>"
              : view.result.storyNarrative
                ? `<p class="story-text">${view.result.storyNarrative}</p>`
                : `<p>暂未生成（${view.result.storyError || "unknown"}）</p>`
          }
        </article>
        <article class="reason-block">
          <h3>Top3 关键因果节点</h3>
          <ul class="history">${simpleList(view.result.reason?.review?.topNodes || [])}</ul>
          <h3>Top3 关键决策</h3>
          <ul class="history">${simpleList(view.result.reason?.review?.topDecisions || [])}</ul>
          <p class="opt-impact">链路摘要：${view.result.reason?.review?.chainSummary || "暂无"}</p>
        </article>
        <article class="reason-block">
          <h3>行为人格画像</h3>
          <div class="persona-head">
            <div class="persona-radar-wrap">${radarBg}${radarSvg}</div>
          </div>
          <p class="opt-impact">画像：${persona?.llm?.title || persona?.title || "观察中"}｜总体置信 ${persona?.confidence || 0}%</p>
          ${persona?.lowConfidence ? `<p class="opt-impact">${persona?.llm?.lowConfidenceNote || "样本不足：本局证据密度偏低，先看趋势，不建议下定型结论。"}</p>` : ""}
          <p class="opt-impact">${persona?.llm?.summary || persona?.note || ""}</p>
          <ul class="history">${traitLines || "<li>样本不足，无法生成稳定画像。</li>"}</ul>
          <h3>画像证据</h3>
          <ul class="history">${simpleList(persona?.evidence || [])}</ul>
          <h3>画像建议</h3>
          <ul class="history">${simpleList((persona?.llm?.tips?.length ? persona?.llm?.tips : persona?.tips) || [])}</ul>
        </article>
        <p class="opt-impact">${restartLocked ? "结局刚生成，按钮短暂保护中，避免误触。" : restartConfirm ? "再次点击将立即重开新局。" : "点击“再来一局”后需二次确认，防止误触。"}</p>
        <div class="action-grid end-actions">
          <button class="primary" id="start-btn" ${restartLocked ? "disabled" : ""}>${restartText}</button>
          <button class="ghost" id="wechat-share-btn">微信分享</button>
          <button class="ghost" id="copy-share-btn">复制分享文案</button>
        </div>
      </article>
    `;

    bindDynamicEvents();
  }

  function renderPlayingShell() {
    panel.innerHTML = `
      <article class="card status-card">
        <div class="head-row">
          <h2 id="day-text"></h2>
          <p id="score-text"></p>
        </div>
        <p class="opt-impact" id="profile-text"></p>
        <div class="element-row" id="element-row"></div>
        <div class="hud-layout">
          <div class="avatar-card">
            <div class="avatar-stack" id="avatar-stack"></div>
          </div>
          <div class="hud-panel" id="stats-panel"></div>
        </div>
        <div class="quick-tools">
          <div class="quick-tools-section quick-tools-food">
            <div class="quick-tools-head">
              <h3 class="mod-title"><img class="mod-icon" src="./assets/pixel/decor/icon-supply.svg" alt="" />补给商店</h3>
              <p class="opt-impact" id="food-tip"></p>
            </div>
            <div class="action-grid utility-grid" id="food-list"></div>
          </div>
          <div class="quick-tools-section quick-tools-skill">
            <div class="quick-tools-head">
              <h3 class="mod-title"><img class="mod-icon" src="./assets/pixel/decor/icon-skill.svg" alt="" />临时技能</h3>
              <p class="opt-impact" id="skills-tip"></p>
            </div>
            <div class="action-grid utility-grid" id="skills-list"></div>
          </div>
        </div>
      </article>

      <article class="card event-card">
        <p class="badge badge-event"><img class="badge-icon" src="./assets/pixel/decor/icon-event.svg" alt="" />今日事件</p>
        <p class="opt-impact" id="event-chapter"></p>
        <p class="milestone-tip" id="event-milestone-tip"></p>
        <h3 id="event-title"></h3>
        <p id="event-text"></p>
        <p class="opt-impact" id="event-cause"></p>
        <div class="option-list" id="event-options"></div>
      </article>

      <article class="card">
        <h3 class="mod-title"><img class="mod-icon" src="./assets/pixel/decor/icon-history.svg" alt="" />最近决策链</h3>
        <ul class="history" id="history-list"></ul>
      </article>
    `;

    refs = {
      dayText: panel.querySelector("#day-text"),
      scoreText: panel.querySelector("#score-text"),
      profileText: panel.querySelector("#profile-text"),
      elementRow: panel.querySelector("#element-row"),
      avatarStack: panel.querySelector("#avatar-stack"),
      statsPanel: panel.querySelector("#stats-panel"),
      eventChapter: panel.querySelector("#event-chapter"),
      eventTitle: panel.querySelector("#event-title"),
      eventText: panel.querySelector("#event-text"),
      eventCause: panel.querySelector("#event-cause"),
      eventMilestoneTip: panel.querySelector("#event-milestone-tip"),
      eventOptions: panel.querySelector("#event-options"),
      foodTip: panel.querySelector("#food-tip"),
      foodList: panel.querySelector("#food-list"),
      skillsTip: panel.querySelector("#skills-tip"),
      skillsList: panel.querySelector("#skills-list"),
      historyList: panel.querySelector("#history-list"),
    };
  }

  function updatePlaying(view) {
    refs.dayText.textContent = `Day ${view.day}/${view.dayTarget}`;
    refs.scoreText.textContent = `当前分数 ${view.score}`;
    refs.profileText.textContent = `开局角色：${view.profileName} · 当前形态：${view.avatar.profileLabel || "生存期"}`;
    refs.elementRow.innerHTML = [
      `<span class="element-pill money"><b>金</b> 财流</span>`,
      `<span class="element-pill energy"><b>木</b> 生机</span>`,
      `<span class="element-pill mood"><b>水</b> 心湖</span>`,
      `<span class="element-pill rep"><b>火</b> 声望</span>`,
      `<span class="element-pill heat"><b>土</b> 势能</span>`,
    ].join("");

    if (refs.avatarStack.dataset.avatarSeed !== view.avatar.seed) {
      const badges = (view.avatar.overlays || [])
        .map(
          (item) =>
            `<img class="avatar-badge ${item.slot}" src="${item.url}" alt="" loading="lazy" decoding="async" />`
        )
        .join("");
      refs.avatarStack.innerHTML = `<img class="avatar-img" src="${view.avatar.baseUrl}" alt="角色头像" decoding="async" loading="eager" />${badges}`;
      refs.avatarStack.dataset.avatarSeed = view.avatar.seed;
    }

    refs.statsPanel.innerHTML = [
      statBar("money", view.stats.money, "money"),
      statBar("energy", view.stats.energy, "energy"),
      statBar("mood", view.stats.mood, "mood"),
      statBar("reputation", view.stats.reputation, "rep"),
      statBar("heat", view.stats.heat, "heat"),
    ].join("");

    refs.eventChapter.textContent = view.event.chapter;
    refs.eventChapter.className = `opt-impact chapter-chip ${chapterTone(view.event.chapter)}`;
    const eventCard = panel.querySelector(".event-card");
    eventCard?.classList.toggle("milestone-event", Boolean(view.event.isMilestone));
    refs.eventMilestoneTip.textContent = view.event.isMilestone
      ? "里程碑节点：本次选择会重塑后续阶段节奏。"
      : "";
    refs.eventMilestoneTip.style.display = view.event.isMilestone ? "block" : "none";
    refs.eventTitle.textContent = view.event.title;
    refs.eventText.textContent = view.event.text;
    refs.eventCause.textContent = `因果线：${view.event.causeText}`;
    refs.eventOptions.innerHTML = view.event.options.map((item, index) => optionCard(item, index)).join("");

    refs.foodTip.textContent = view.foodShop.usedToday
      ? "今日已购买"
      : "每日限购 1 次";
    refs.foodList.innerHTML = view.foodShop.options.map((item) => foodCard(item, view.foodShop.usedToday || !item.affordable)).join("");

    refs.skillsTip.textContent = view.skills.usedToday
      ? "今日已使用"
      : "每日可用 1 次";
    refs.skillsList.innerHTML = view.skills.offers.map((item) => tempSkillCard(item, view.skills.usedToday)).join("");

    refs.historyList.innerHTML = view.history.length ? view.history.map(historyItem).join("") : "<li>暂无</li>";

    bindDynamicEvents();
  }

  return {
    render(view) {
      const subtitle = root.querySelector("#subtitle");
      if (subtitle) {
        subtitle.textContent = view.notice || "JOJO风都市生存卡牌";
        subtitle.classList.toggle("flash", Boolean(view.notice));
      }

      if (view.mode !== renderedMode) {
        renderedMode = view.mode;
        refs = {};
        if (view.mode === "intro") {
          renderIntro();
          return;
        }
        if (view.mode === "ended") {
          renderEnded(view);
          return;
        }
        renderPlayingShell();
      }

      if (view.mode === "ended") {
        renderEnded(view);
        return;
      }

      if (view.mode === "intro") {
        return;
      }

      updatePlaying(view);
    },
  };
}
