function cardButton(card, idx, enabled) {
  const disabled = enabled ? "" : "disabled";
  return `<button class="card-btn" data-card-index="${idx}" ${disabled}>
    <span class="name">${card.name}</span>
    <span class="meta">Cost ${card.cost}</span>
    <span class="text">${card.text}</span>
  </button>`;
}

function renderStatusBadges(statuses) {
  if (!statuses.length) {
    return "<p class='status-empty'>No status</p>";
  }
  return `<div class='status-row'>${statuses
    .map((entry) => `<span class='status'>${entry.name} ${entry.value}</span>`)
    .join("")}</div>`;
}

function renderNodes(view) {
  return `<div class='node-row'>${Array.from({ length: view.run.nodeTotal }, (_, idx) => {
    const current = idx === view.run.nodeIndex;
    const done = idx < view.run.nodeIndex;
    const type = view.run.nodeTotal > idx ? (idx === 3 ? "elite" : "battle") : "battle";
    return `<span class='node ${current ? "current" : ""} ${done ? "done" : ""} ${type}'>${idx + 1}</span>`;
  }).join("")}</div>`;
}

export function createGameUI(root, actions) {
  root.innerHTML = `
    <section class="layout">
      <header class="hud">
        <div>
          <h1>Neon Deck</h1>
          <p id="battle-status">Initializing...</p>
        </div>
        <div class="head-actions">
          <button id="guide-toggle-btn" class="subtle">Show Guide</button>
          <button id="restart-btn" class="subtle">New Run</button>
        </div>
      </header>
      <section class="panel" id="guide-panel"></section>
      <section class="panel" id="run-panel"></section>
      <main class="arena" id="arena-panel"></main>
    </section>
  `;

  root.querySelector("#restart-btn").addEventListener("click", () => actions.onRestart());

  function bindBattleActions() {
    root.querySelectorAll("[data-card-index]").forEach((el) => {
      el.addEventListener("click", () => actions.onPlayCard(Number(el.dataset.cardIndex)));
    });
    root.querySelector("#end-turn-btn")?.addEventListener("click", () => actions.onEndTurn());
  }

  function bindRewardActions() {
    root.querySelectorAll("[data-reward-card]").forEach((el) => {
      el.addEventListener("click", () => actions.onChooseReward(el.dataset.rewardCard));
    });
    root.querySelector("#skip-reward-btn")?.addEventListener("click", () => actions.onChooseReward(null));
    root.querySelector("#remove-card-btn")?.addEventListener("click", () => {
      const select = root.querySelector("#remove-card-select");
      actions.onRemoveCard(select.value);
    });
    root.querySelector("#next-node-btn")?.addEventListener("click", () => actions.onNextNode());
  }

  function renderGuide(view, guidePanel) {
    const toggleBtn = root.querySelector("#guide-toggle-btn");
    if (!view.onboarding.visible) {
      guidePanel.style.display = "none";
      toggleBtn.textContent = "Show Guide";
      toggleBtn.onclick = () => actions.onShowGuide();
      return;
    }

    guidePanel.style.display = "block";
    toggleBtn.textContent = "Hide Guide";
    toggleBtn.onclick = () => actions.onHideGuide();
    guidePanel.innerHTML = `
      <h2>Starter Guide</h2>
      <ol>
        ${view.onboarding.steps.map((step) => `<li>${step}</li>`).join("")}
      </ol>
    `;
  }

  return {
    render(view) {
      const status = root.querySelector("#battle-status");
      const runPanel = root.querySelector("#run-panel");
      const arenaPanel = root.querySelector("#arena-panel");
      const guidePanel = root.querySelector("#guide-panel");

      const statusText = `Node ${view.run.nodeIndex + 1}/${view.run.nodeTotal} (${view.run.currentNodeType}) | HP ${view.run.playerHp}/${view.run.playerMaxHp} | Deck ${view.run.deckSize}`;
      status.textContent = `${view.mode.toUpperCase()} | ${statusText}`;

      renderGuide(view, guidePanel);

      runPanel.innerHTML = `
        <h2>Run Path</h2>
        ${renderNodes(view)}
      `;

      if (view.mode === "battle") {
        const b = view.battle;
        arenaPanel.innerHTML = `
          <section class="panel" id="enemy-panel">
            <h2>Enemy ${b.enemy.elite ? "(Elite)" : ""}</h2>
            <p>${b.enemy.name}</p>
            <p>HP ${b.enemy.hp}/${b.enemy.maxHp} | Block ${b.enemy.block}</p>
            <p>Intent: ${b.enemy.intent.label}</p>
            ${renderStatusBadges(b.enemy.statuses)}
          </section>
          <section class="panel" id="player-panel">
            <h2>Player</h2>
            <p>HP ${b.player.hp}/${b.player.maxHp} | Block ${b.player.block}</p>
            <p>Draw ${b.player.drawPile} | Discard ${b.player.discardPile}</p>
            <p>Energy ${b.player.energy}/${b.player.maxEnergy}</p>
            ${renderStatusBadges(b.player.statuses)}
            <button id="end-turn-btn" ${b.phase !== "player" || b.winner ? "disabled" : ""}>End Turn</button>
          </section>
          <section class="panel" id="hand-panel">
            <h2>Hand (${b.player.hand.length})</h2>
            <div class="hand-grid">
              ${b.player.hand
                .map((card, idx) => cardButton(card, idx, b.phase === "player" && !b.winner && card.cost <= b.player.energy))
                .join("")}
            </div>
          </section>
          <section class="panel log" id="log-panel">
            <h2>Battle Log</h2>
            ${b.logs.map((line) => `<p>${line}</p>`).join("")}
          </section>
        `;
        bindBattleActions();
        return;
      }

      if (view.mode === "reward") {
        arenaPanel.innerHTML = `
          <section class="panel" id="reward-panel">
            <h2>Reward: Pick 1 Card</h2>
            <div class="reward-grid">
              ${view.run.rewardOptions
                .map(
                  (card) => `<button class="card-btn" data-reward-card="${card.id}">
                    <span class="name">${card.name}</span>
                    <span class="meta">Cost ${card.cost}</span>
                    <span class="text">${card.text}</span>
                  </button>`
                )
                .join("")}
            </div>
            <button id="skip-reward-btn" class="subtle">Skip Reward</button>
            <h3>Deck Tuning (Remove 1)</h3>
            <div class="tune-row">
              <select id="remove-card-select">
                ${view.run.deckCounts
                  .map((entry) => `<option value="${entry.id}">${entry.id} x${entry.count}</option>`)
                  .join("")}
              </select>
              <button id="remove-card-btn" class="subtle">Remove Card</button>
            </div>
          </section>
        `;
        bindRewardActions();
        return;
      }

      if (view.mode === "map") {
        arenaPanel.innerHTML = `
          <section class="panel">
            <h2>Node Cleared</h2>
            <p>Ready for next encounter.</p>
            <button id="next-node-btn" class="subtle">Enter Next Node</button>
          </section>
        `;
        bindRewardActions();
        return;
      }

      if (view.mode === "victory") {
        arenaPanel.innerHTML = `
          <section class="panel">
            <h2>Run Victory</h2>
            <p>You cleared all nodes.</p>
          </section>
        `;
        return;
      }

      arenaPanel.innerHTML = `
        <section class="panel">
          <h2>Run Defeat</h2>
          <p>The run has ended. Start a new run to continue.</p>
        </section>
      `;
    },
  };
}
