import { CARD_LIBRARY } from "../content/cards.js";
import { createRun } from "../core/run/engine.js";
import { createGameUI } from "../ui/game-ui.js";

const GUIDE_STORAGE_KEY = "neon-deck-guide-hidden";

const appState = {
  run: createRun({ seed: 20260227 }),
  guideHidden: localStorage.getItem(GUIDE_STORAGE_KEY) === "1",
};

const root = document.querySelector("#app");

function battleView(battle) {
  const { state, getNextEnemyIntent, summaryStatuses } = battle;
  const statuses = summaryStatuses();
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
      statuses: statuses.player,
    },
    enemy: {
      name: state.enemy.name,
      hp: state.enemy.hp,
      maxHp: state.enemy.maxHp,
      block: state.enemy.block,
      intent: getNextEnemyIntent(),
      statuses: statuses.enemy,
      elite: state.enemy.elite,
    },
    logs: state.logs.slice(-12),
  };
}

function buildView() {
  const runState = appState.run.state;
  const view = {
    mode: runState.mode,
    onboarding: {
      visible: !appState.guideHidden,
      steps: [
        "每回合优先看敌方 Intent，再决定防御或进攻。",
        "状态牌（Poison/Vulnerable/Weak）在前中期价值很高。",
        "战后奖励先补短板，再做删牌精简。",
      ],
    },
    run: {
      nodeIndex: runState.nodeIndex,
      nodeTotal: runState.nodes.length,
      nodeTypes: runState.nodes.map((node) => node.type),
      deckSize: runState.deck.length,
      playerHp: runState.playerHp,
      playerMaxHp: runState.playerMaxHp,
      currentNodeType: runState.nodes[runState.nodeIndex]?.type || null,
      rewardOptions: runState.rewardOptions.map((id) => CARD_LIBRARY[id]),
      deckCounts: Object.entries(
        runState.deck.reduce((acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    },
    battle: runState.battle ? battleView(runState.battle) : null,
  };
  return view;
}

function refresh() {
  ui.render(buildView());
}

function restartRun() {
  appState.run = createRun({ seed: Date.now() });
  refresh();
}

function hideGuide() {
  appState.guideHidden = true;
  localStorage.setItem(GUIDE_STORAGE_KEY, "1");
  refresh();
}

function showGuide() {
  appState.guideHidden = false;
  localStorage.setItem(GUIDE_STORAGE_KEY, "0");
  refresh();
}

function shouldIgnoreHotkeyTarget(target) {
  if (!target) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

const ui = createGameUI(root, {
  onRestart: () => restartRun(),
  onPlayCard: (idx) => {
    appState.run.playCard(idx);
    refresh();
  },
  onEndTurn: () => {
    appState.run.endTurn();
    refresh();
  },
  onChooseReward: (cardId) => {
    appState.run.chooseReward(cardId);
    refresh();
  },
  onRemoveCard: (cardId) => {
    appState.run.removeCard(cardId);
    refresh();
  },
  onNextNode: () => {
    appState.run.nextNode();
    refresh();
  },
  onHideGuide: () => hideGuide(),
  onShowGuide: () => showGuide(),
});

window.addEventListener("keydown", (event) => {
  if (shouldIgnoreHotkeyTarget(event.target)) {
    return;
  }
  const key = event.key.toLowerCase();
  const mode = appState.run.state.mode;

  if (key === "enter" && mode === "battle") {
    event.preventDefault();
    appState.run.endTurn();
    refresh();
    return;
  }
  if (key === "n" && mode === "map") {
    event.preventDefault();
    appState.run.nextNode();
    refresh();
    return;
  }
  if (key === "g") {
    event.preventDefault();
    if (appState.guideHidden) {
      showGuide();
    } else {
      hideGuide();
    }
    return;
  }
  if (key === "r") {
    event.preventDefault();
    restartRun();
  }
});

window.advanceTime = () => {
  refresh();
};

window.render_game_to_text = () => {
  const v = buildView();
  return JSON.stringify({
    coordinateSystem: "UI board only; no world coordinates. top-left origin for layout.",
    mode: v.mode,
    guideVisible: v.onboarding.visible,
    node: {
      index: v.run.nodeIndex + 1,
      total: v.run.nodeTotal,
      type: v.run.currentNodeType,
    },
    playerMeta: {
      hp: v.run.playerHp,
      maxHp: v.run.playerMaxHp,
      deckSize: v.run.deckSize,
    },
    battle: v.battle
      ? {
          turn: v.battle.turn,
          phase: v.battle.phase,
          player: {
            hp: v.battle.player.hp,
            block: v.battle.player.block,
            energy: v.battle.player.energy,
            statuses: v.battle.player.statuses,
            hand: v.battle.player.hand.map((c) => ({ id: c.id, cost: c.cost })),
          },
          enemy: {
            name: v.battle.enemy.name,
            hp: v.battle.enemy.hp,
            block: v.battle.enemy.block,
            statuses: v.battle.enemy.statuses,
            intent: v.battle.enemy.intent,
          },
          logs: v.battle.logs,
        }
      : null,
    rewardOptions: v.run.rewardOptions.map((card) => card.id),
  });
};

refresh();
