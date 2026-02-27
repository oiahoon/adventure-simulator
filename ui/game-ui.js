function optionCard(option) {
  return `<button class="option-btn" data-option-id="${option.id}">
    <span class="opt-title">${option.label}</span>
    <span class="opt-impact">${option.impactText}</span>
  </button>`;
}

function historyItem(item) {
  return `<li>Day ${item.day}: ${item.optionLabel} <span>${item.impactText}</span></li>`;
}

function tempSkillCard(skill, disabled) {
  return `<button class="ghost" data-skill-id="${skill.id}" ${disabled ? "disabled" : ""}>
    ${skill.name} (${skill.impactText})
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

  root.querySelector("#restart-btn").addEventListener("click", () => actions.onRestart());

  function bindEvents() {
    root.querySelectorAll("[data-option-id]").forEach((el) => {
      el.addEventListener("click", () => actions.onPickOption(el.dataset.optionId));
    });
    root.querySelectorAll("[data-skill-id]").forEach((el) => {
      el.addEventListener("click", () => actions.onUseSkill(el.dataset.skillId));
    });
    root.querySelector("#start-btn")?.addEventListener("click", () => actions.onStart());
    root.querySelector("#copy-share-btn")?.addEventListener("click", () => actions.onCopyShare());
  }

  return {
    render(view) {
      const panel = root.querySelector("#main-panel");
      const subtitle = root.querySelector("#subtitle");
      if (subtitle) {
        subtitle.textContent = view.notice || "都市生存挑战";
        subtitle.classList.toggle("flash", Boolean(view.notice));
      }

      if (view.mode === "intro") {
        panel.innerHTML = `
          <article class="card hero">
            <p class="badge">100天目标挑战</p>
            <h2>这局只看一件事：你能不能坚持 100 天。</h2>
            <p>每天一个高压事件，三选一，直到属性崩盘才会结算并生成分享文案。</p>
            <button id="start-btn" class="primary">开始新挑战</button>
          </article>
        `;
        bindEvents();
        return;
      }

      if (view.mode === "ended") {
        panel.innerHTML = `
          <article class="card hero end">
            <p class="badge">结局</p>
            <h2>${view.result.ending.title}</h2>
            <p>${view.result.ending.subtitle}</p>
            <p class="score">本局分数 ${view.result.score} | 历史最高 ${view.bestScore}</p>
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
                    ? `<p>${view.result.storyNarrative}</p>`
                    : `<p>暂未生成（${view.result.storyError || "unknown"}）</p>`
              }
            </article>
            <div class="action-grid">
              <button class="primary" id="start-btn">再来一局</button>
              <button class="ghost" id="copy-share-btn">复制分享文案</button>
            </div>
          </article>
          <article class="card">
            <h3>最近决策</h3>
            <ul class="history">${view.history.map(historyItem).join("")}</ul>
          </article>
        `;
        bindEvents();
        return;
      }

      panel.innerHTML = `
        <article class="card status-card">
          <div class="head-row">
            <h2>Day ${view.day}/${view.dayTarget}</h2>
            <p>当前分数 ${view.score}</p>
          </div>
          <p class="opt-impact">开局角色：${view.profileName}</p>
          <div class="hud-layout">
            <div class="avatar-card">
              <img class="avatar-img" src="${view.avatar.url}" alt="角色头像" />
            </div>
            <div class="hud-panel">
              ${statBar("现金", view.stats.money, "money")}
              ${statBar("体力", view.stats.energy, "energy")}
              ${statBar("心态", view.stats.mood, "mood")}
              ${statBar("人设", view.stats.reputation, "rep")}
              ${statBar("热度", view.stats.heat, "heat")}
            </div>
          </div>
        </article>

        <article class="card event-card">
          <p class="badge">今日事件</p>
          <p class="opt-impact">${view.event.chapter}</p>
          <h3>${view.event.title}</h3>
          <p>${view.event.text}</p>
          <p class="opt-impact">因果线：${view.event.causeText}</p>
          <div class="option-list">${view.event.options.map(optionCard).join("")}</div>
        </article>

        <article class="card tools-card">
          <h3>临时技能（每日刷新，限用一次）</h3>
          <p class="opt-impact">${view.skills.usedToday ? "本回合已使用，明天刷新新技能。" : "本回合可用 1 次，技能同时包含收益与代价。"}</p>
          <div class="action-grid">
            ${view.skills.offers.map((item) => tempSkillCard(item, view.skills.usedToday)).join("")}
          </div>
        </article>

        <article class="card">
          <h3>最近决策链</h3>
          <ul class="history">${view.history.map(historyItem).join("") || "<li>暂无</li>"}</ul>
        </article>
      `;

      bindEvents();
    },
  };
}
