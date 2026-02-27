function statCard(label, value, tone) {
  return `<div class="stat ${tone}"><span>${label}</span><strong>${value}</strong></div>`;
}

function optionCard(option) {
  return `<button class="option-btn" data-option-id="${option.id}">
    <span class="opt-title">${option.label}</span>
    <span class="opt-impact">${option.impactText}</span>
  </button>`;
}

function historyItem(item) {
  return `<li>Day ${item.day}: ${item.optionLabel} <span>${item.impactText}</span></li>`;
}

export function createGameUI(root, actions) {
  root.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <h1>城市生存7天</h1>
          <p id="subtitle">微信可分享的短局生存挑战</p>
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
    root.querySelector("#import-btn")?.addEventListener("click", () => actions.onImportChallenge());
    root.querySelector("#challenge-input")?.addEventListener("input", (event) => {
      actions.onImportCodeChange(event.target.value || "");
    });
  }

  return {
    render(view) {
      const panel = root.querySelector("#main-panel");

      if (view.mode === "intro") {
        panel.innerHTML = `
          <article class="card hero">
            <p class="badge">3~5 分钟一局</p>
            <h2>你只有 7 天在城市里稳住现金、体力、心态和人设。</h2>
            <p>每天一个高压事件，三选一，结局可生成挑战码发微信群。</p>
            <button id="start-btn" class="primary">开始新挑战</button>
          </article>
          <article class="card">
            <h3>导入朋友挑战码</h3>
            <div class="import-row">
              <input id="challenge-input" placeholder="粘贴挑战码" value="${view.importCode || ""}" />
              <button id="import-btn" class="ghost">复刻这局</button>
            </div>
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
            <p class="code">挑战码：<code>${view.result.challengeCode}</code></p>
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
            <h2>Day ${view.day}/${view.dayTotal}</h2>
            <p>当前分数 ${view.score}</p>
          </div>
          <div class="stats-grid">
            ${statCard("现金", view.stats.money, "money")}
            ${statCard("体力", view.stats.energy, "energy")}
            ${statCard("心态", view.stats.mood, "mood")}
            ${statCard("人设", view.stats.reputation, "rep")}
            ${statCard("热度", view.stats.heat, "heat")}
          </div>
        </article>

        <article class="card event-card">
          <p class="badge">今日事件</p>
          <h3>${view.event.title}</h3>
          <p>${view.event.text}</p>
          <div class="option-list">${view.event.options.map(optionCard).join("")}</div>
        </article>

        <article class="card tools-card">
          <h3>临时技能（每局一次）</h3>
          <div class="action-grid">
            <button class="ghost" data-skill-id="powerNap" ${view.skills.powerNap ? "" : "disabled"}>打个盹 (+体力+心态)</button>
            <button class="ghost" data-skill-id="borrowCash" ${view.skills.borrowCash ? "" : "disabled"}>找朋友借钱 (+现金-人设)</button>
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
