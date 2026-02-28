function optionCard(option) {
  return `<button class="option-btn" data-option-id="${option.id}">
    <span class="opt-title">${option.label}</span>
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
  return `<button class="ghost" data-skill-id="${skill.id}" ${disabled ? "disabled" : ""}>
    <span class="icon-line">
      <img class="pixel-icon" src="${skill.icon}" alt="" loading="lazy" decoding="async" />
      <span>${skill.name}</span>
    </span>
    <span class="opt-impact">${skill.impactText}</span>
  </button>`;
}

function foodCard(food, disabled) {
  return `<button class="ghost" data-food-id="${food.id}" ${disabled ? "disabled" : ""}>
    <span class="icon-line">
      <img class="pixel-icon" src="${food.icon}" alt="" loading="lazy" decoding="async" />
      <span>${food.name}</span>
    </span>
    <span class="opt-impact">${food.impactText}${food.affordable ? "" : " · 现金不足"}</span>
  </button>`;
}

function statBar(label, value, tone) {
  const percent = Math.max(0, Math.min(100, Math.round((value / 10) * 100)));
  return `<div class="hud-bar ${tone}">
    <span class="hud-name">${label}</span>
    <div class="hud-track"><div class="hud-fill" style="width:${percent}%"></div></div>
    <span class="hud-value">${value}/10</span>
  </div>`;
}

export function createGameUI(root, actions) {
  root.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <h1>是男人就坚持100天</h1>
          <p id="subtitle">都市生存挑战</p>
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
        <p class="badge">100天目标挑战</p>
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
          <h3>Top3 关键因果节点</h3>
          <ul class="history">${simpleList(view.result.reason?.review?.topNodes || [])}</ul>
          <h3>Top3 关键决策</h3>
          <ul class="history">${simpleList(view.result.reason?.review?.topDecisions || [])}</ul>
          <p class="opt-impact">链路摘要：${view.result.reason?.review?.chainSummary || "暂无"}</p>
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
        <p class="opt-impact">${restartLocked ? "结局刚生成，按钮短暂保护中，避免误触。" : restartConfirm ? "再次点击将立即重开新局。" : "点击“再来一局”后需二次确认，防止误触。"}</p>
        <div class="action-grid end-actions">
          <button class="primary" id="start-btn" ${restartLocked ? "disabled" : ""}>${restartText}</button>
          <button class="ghost" id="wechat-share-btn">微信分享</button>
          <button class="ghost" id="copy-share-btn">复制分享文案</button>
        </div>
      </article>
      <article class="card">
        <h3>最近决策</h3>
        <ul class="history">${view.history.map(historyItem).join("")}</ul>
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
        <div class="hud-layout">
          <div class="avatar-card">
            <img class="avatar-img" id="avatar-img" alt="角色头像" decoding="async" loading="eager" />
          </div>
          <div class="hud-panel" id="stats-panel"></div>
        </div>
      </article>

      <article class="card event-card">
        <p class="badge">今日事件</p>
        <p class="opt-impact" id="event-chapter"></p>
        <h3 id="event-title"></h3>
        <p id="event-text"></p>
        <p class="opt-impact" id="event-cause"></p>
        <div class="option-list" id="event-options"></div>
      </article>

      <article class="card tools-card">
        <h3>补给商店（每日限购一次）</h3>
        <p class="opt-impact" id="food-tip"></p>
        <div class="action-grid" id="food-list"></div>
      </article>

      <article class="card tools-card">
        <h3>临时技能（每日刷新，限用一次）</h3>
        <p class="opt-impact" id="skills-tip"></p>
        <div class="action-grid" id="skills-list"></div>
      </article>

      <article class="card">
        <h3>最近决策链</h3>
        <ul class="history" id="history-list"></ul>
      </article>
    `;

    refs = {
      dayText: panel.querySelector("#day-text"),
      scoreText: panel.querySelector("#score-text"),
      profileText: panel.querySelector("#profile-text"),
      avatarImg: panel.querySelector("#avatar-img"),
      statsPanel: panel.querySelector("#stats-panel"),
      eventChapter: panel.querySelector("#event-chapter"),
      eventTitle: panel.querySelector("#event-title"),
      eventText: panel.querySelector("#event-text"),
      eventCause: panel.querySelector("#event-cause"),
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
    refs.profileText.textContent = `开局角色：${view.profileName}`;

    if (refs.avatarImg.dataset.avatarSeed !== view.avatar.seed) {
      refs.avatarImg.src = view.avatar.url;
      refs.avatarImg.dataset.avatarSeed = view.avatar.seed;
    }

    refs.statsPanel.innerHTML = [
      statBar("现金", view.stats.money, "money"),
      statBar("体力", view.stats.energy, "energy"),
      statBar("心态", view.stats.mood, "mood"),
      statBar("人设", view.stats.reputation, "rep"),
      statBar("热度", view.stats.heat, "heat"),
    ].join("");

    refs.eventChapter.textContent = view.event.chapter;
    refs.eventTitle.textContent = view.event.title;
    refs.eventText.textContent = view.event.text;
    refs.eventCause.textContent = `因果线：${view.event.causeText}`;
    refs.eventOptions.innerHTML = view.event.options.map(optionCard).join("");

    refs.foodTip.textContent = view.foodShop.usedToday
      ? "今天已补给，明天可再次购买。"
      : "补给会立即生效，但一天只能买一次。";
    refs.foodList.innerHTML = view.foodShop.options.map((item) => foodCard(item, view.foodShop.usedToday || !item.affordable)).join("");

    refs.skillsTip.textContent = view.skills.usedToday
      ? "本回合已使用，明天刷新新技能。"
      : "本回合可用 1 次，技能同时包含收益与代价。";
    refs.skillsList.innerHTML = view.skills.offers.map((item) => tempSkillCard(item, view.skills.usedToday)).join("");

    refs.historyList.innerHTML = view.history.length ? view.history.map(historyItem).join("") : "<li>暂无</li>";

    bindDynamicEvents();
  }

  return {
    render(view) {
      const subtitle = root.querySelector("#subtitle");
      if (subtitle) {
        subtitle.textContent = view.notice || "都市生存挑战";
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
