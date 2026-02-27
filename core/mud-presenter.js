export function isCliRequest(headers = {}) {
  const mode = String(headers["x-client-mode"] || "").toLowerCase();
  const ua = String(headers["user-agent"] || "").toLowerCase();
  return mode === "cli" || ua.includes("mud-cli");
}

function formatBattle(state) {
  if (!state.battle) {
    return "No active battle";
  }
  const battle = state.battle;
  const handText = battle.player.hand.map((card, idx) => `#${idx} ${card.name}(${card.cost})`).join(" | ");
  return [
    `Turn ${battle.turn} [${battle.phase}]`,
    `Player HP ${state.playerHp}/${state.playerMaxHp} Energy ${battle.player.energy} Block ${battle.player.block}`,
    `Enemy ${battle.enemy.name} HP ${battle.enemy.hp}/${battle.enemy.maxHp} Block ${battle.enemy.block}`,
    `Hand: ${handText || "(empty)"}`,
    `Logs: ${battle.logs.join(" / ")}`,
  ].join("\n");
}

export function formatStateForCli(result) {
  if (!result?.ok) {
    return `Error: ${result?.error || "unknown"}`;
  }
  const state = result.state;
  const lines = [
    `Session: ${result.sessionId}`,
    `Mode: ${state.mode}`,
    `Node: ${state.nodeIndex + 1}/${state.nodeTotal} (${state.nodeType})`,
    `Deck: ${state.deckSize}`,
  ];
  if (state.mode === "reward") {
    lines.push(`Reward options: ${state.rewardOptions.join(", ") || "(none)"}`);
  }
  lines.push(formatBattle(state));
  return lines.join("\n");
}
