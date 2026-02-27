function cardButton(card, idx, enabled) {
  const disabled = enabled ? "" : "disabled";
  return `<button class="card-btn" data-card-index="${idx}" ${disabled}>
    <span class="name">${card.name}</span>
    <span class="meta">Cost ${card.cost}</span>
    <span class="text">${card.text}</span>
  </button>`;
}

export function createGameUI(root, actions) {
  root.innerHTML = `
    <section class="layout">
      <header class="hud">
        <div>
          <h1>Neon Deck</h1>
          <p id="battle-status">Initializing...</p>
        </div>
        <button id="restart-btn" class="subtle">New Battle</button>
      </header>
      <main class="arena">
        <section class="panel" id="enemy-panel"></section>
        <section class="panel" id="player-panel"></section>
        <section class="panel" id="hand-panel"></section>
        <section class="panel log" id="log-panel"></section>
      </main>
    </section>
  `;

  root.querySelector("#restart-btn").addEventListener("click", () => actions.onRestart());

  function bindHandEvents() {
    root.querySelectorAll("[data-card-index]").forEach((el) => {
      el.addEventListener("click", () => actions.onPlayCard(Number(el.dataset.cardIndex)));
    });
  }

  return {
    render(view) {
      const status = root.querySelector("#battle-status");
      const enemyPanel = root.querySelector("#enemy-panel");
      const playerPanel = root.querySelector("#player-panel");
      const handPanel = root.querySelector("#hand-panel");
      const logPanel = root.querySelector("#log-panel");

      const outcome = view.winner ? `Result: ${view.winner}` : `Turn ${view.turn} - ${view.phase}`;
      status.textContent = `${outcome} | Energy ${view.player.energy}/${view.player.maxEnergy}`;

      enemyPanel.innerHTML = `
        <h2>Enemy</h2>
        <p>${view.enemy.name}</p>
        <p>HP ${view.enemy.hp}/${view.enemy.maxHp} | Block ${view.enemy.block}</p>
        <p>Intent: ${view.enemy.intent.label}</p>
      `;

      playerPanel.innerHTML = `
        <h2>Player</h2>
        <p>HP ${view.player.hp}/${view.player.maxHp} | Block ${view.player.block}</p>
        <p>Draw ${view.player.drawPile} | Discard ${view.player.discardPile}</p>
        <button id="end-turn-btn" ${view.phase !== "player" || view.winner ? "disabled" : ""}>End Turn</button>
      `;

      handPanel.innerHTML = `
        <h2>Hand (${view.player.hand.length})</h2>
        <div class="hand-grid">
          ${view.player.hand
            .map((card, idx) => cardButton(card, idx, view.phase === "player" && !view.winner && card.cost <= view.player.energy))
            .join("")}
        </div>
      `;

      logPanel.innerHTML = `
        <h2>Battle Log</h2>
        ${view.logs.map((line) => `<p>${line}</p>`).join("")}
      `;

      root.querySelector("#end-turn-btn")?.addEventListener("click", () => actions.onEndTurn());
      bindHandEvents();
    },
  };
}
