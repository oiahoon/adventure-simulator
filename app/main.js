import { createBattle } from "../core/battle/engine.js";
import { createGameUI } from "../ui/game-ui.js";

const appState = {
  battle: null,
};

const root = document.querySelector("#app");

function buildView() {
  const { state, getNextEnemyIntent } = appState.battle;
  return {
    phase: state.phase,
    turn: state.turn,
    winner: state.winner,
    player: {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      block: state.player.block,
      energy: state.player.energy,
      maxEnergy: state.player.maxEnergy,
      drawPile: state.player.drawPile.length,
      discardPile: state.player.discardPile.length,
      hand: state.player.hand,
    },
    enemy: {
      name: state.enemy.name,
      hp: state.enemy.hp,
      maxHp: state.enemy.maxHp,
      block: state.enemy.block,
      intent: getNextEnemyIntent(),
    },
    logs: state.logs.slice(-10),
  };
}

function restartBattle(seed = Date.now()) {
  appState.battle = createBattle({ seed });
  ui.render(buildView());
}

function playCard(index) {
  appState.battle.playCard(index);
  ui.render(buildView());
}

function endTurn() {
  appState.battle.endTurn();
  ui.render(buildView());
}

const ui = createGameUI(root, {
  onRestart: () => restartBattle(Date.now()),
  onPlayCard: (idx) => playCard(idx),
  onEndTurn: () => endTurn(),
});

window.advanceTime = (ms) => {
  if (ms > 0) {
    // deterministic no-op for turn-based game
  }
  ui.render(buildView());
};

window.render_game_to_text = () => {
  const v = buildView();
  return JSON.stringify({
    coordinateSystem: "UI board only; no world coordinates. top-left origin for layout.",
    mode: v.winner ? "finished" : "battle",
    turn: v.turn,
    phase: v.phase,
    player: {
      hp: v.player.hp,
      maxHp: v.player.maxHp,
      block: v.player.block,
      energy: v.player.energy,
      hand: v.player.hand.map((c) => ({ id: c.id, cost: c.cost })),
      draw: v.player.drawPile,
      discard: v.player.discardPile,
    },
    enemy: {
      name: v.enemy.name,
      hp: v.enemy.hp,
      block: v.enemy.block,
      intent: v.enemy.intent,
    },
    logs: v.logs,
  });
};

restartBattle(20260227);
