export function createGameUI(root, logger) {
  root.innerHTML = `
    <section class="layout">
      <header>
        <h1>Card Game Restart</h1>
        <p id="phase-label">Phase: M0 skeleton</p>
      </header>
      <main>
        <div class="card arena">Empty Scene</div>
        <div class="card" id="log-panel"></div>
      </main>
    </section>
  `;

  const logPanel = root.querySelector("#log-panel");

  function renderLogs() {
    const lines = logger.list();
    logPanel.innerHTML = lines
      .map((line) => `[${line.level}] ${line.ts.slice(11, 19)} ${line.message}`)
      .join("<br>");
  }

  return {
    setPhase(phaseText) {
      const label = root.querySelector("#phase-label");
      label.textContent = `Phase: ${phaseText}`;
    },
    refresh() {
      renderLogs();
    },
  };
}
