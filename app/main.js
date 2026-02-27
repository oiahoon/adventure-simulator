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
      cycleUsed: Boolean(state.player.cycleUsed),
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

function estimateCardValue(card, battle) {
  const enemyIntent = battle.enemy.intent;
  const incomingAttack = enemyIntent.type === "attack" ? enemyIntent.value : 0;
  return (card.effects || []).reduce((sum, effect) => {
    if (effect.type === "damage") return sum + effect.value * 1.2;
    if (effect.type === "block") return sum + Math.min(effect.value, incomingAttack) * 1.1;
    if (effect.type === "heal") return sum + effect.value;
    if (effect.type === "status" && effect.target === "enemy") return sum + effect.value * 1.4;
    if (effect.type === "draw") return sum + effect.value * 0.8;
    if (effect.type === "energy") return sum + effect.value * 0.9;
    return sum;
  }, 0);
}

function buildBattleRecommendation(battle) {
  if (!battle || battle.phase !== "player" || battle.winner) return null;
  const playable = battle.player.hand
    .map((card, idx) => ({ idx, card }))
    .filter((item) => item.card.cost <= battle.player.energy);

  if (!playable.length) {
    return {
      type: "end_turn",
      label: "当前无可打出牌，建议结束回合",
    };
  }

  let best = playable[0];
  let bestScore = estimateCardValue(best.card, battle);
  for (const item of playable.slice(1)) {
    const score = estimateCardValue(item.card, battle);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return {
    type: "play_card",
    cardIndex: best.idx,
    cardName: best.card.name,
    label: `建议先打出：${best.card.name}`,
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
      nodeTotal: runState.nodeTotal || runState.nodes.length,
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
      storyCurrent: runState.story?.current || null,
      storyHistory: runState.story?.history || [],
      pendingStoryChoice: runState.pendingStoryChoice || null,
    },
    battle: runState.battle ? battleView(runState.battle) : null,
  };
  view.battleRecommendation = buildBattleRecommendation(view.battle);
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
  onCycleCard: (idx) => {
    appState.run.cycleCard(idx);
    refresh();
  },
  onPlayRecommended: () => {
    const view = buildView();
    const rec = view.battleRecommendation;
    if (!rec) return;
    if (rec.type === "play_card" && Number.isInteger(rec.cardIndex)) {
      appState.run.playCard(rec.cardIndex);
      refresh();
      return;
    }
    if (rec.type === "end_turn") {
      appState.run.endTurn();
      refresh();
    }
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
  onChooseStoryBranch: (branchId) => {
    appState.run.chooseStoryBranch(branchId);
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
  if (key === "c" && mode === "battle") {
    event.preventDefault();
    appState.run.cycleCard(0);
    refresh();
    return;
  }
  if (key === "n" && mode === "map") {
    event.preventDefault();
    appState.run.nextNode();
    refresh();
    return;
  }
  if (key === "1" && mode === "story") {
    event.preventDefault();
    const first = appState.run.state.pendingStoryChoice?.options?.[0];
    if (first) {
      appState.run.chooseStoryBranch(first.id);
      refresh();
    }
    return;
  }
  if (key === "2" && mode === "story") {
    event.preventDefault();
    const second = appState.run.state.pendingStoryChoice?.options?.[1];
    if (second) {
      appState.run.chooseStoryBranch(second.id);
      refresh();
    }
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
    story: {
      current: v.run.storyCurrent,
      history: v.run.storyHistory.slice(-5),
      pendingChoice: v.run.pendingStoryChoice,
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
            cycleUsed: v.battle.player.cycleUsed,
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
          recommendation: v.battleRecommendation,
        }
      : null,
    rewardOptions: v.run.rewardOptions.map((card) => card.id),
  });
};

refresh();
