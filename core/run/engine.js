import { CARD_LIBRARY, STARTER_DECK } from "../../content/cards.js";
import { ENEMY_ORDER } from "../../content/enemies.js";
import { createBattle, createSeededRandom } from "../battle/engine.js";

function randomRewardCards(random, count) {
  const pool = Object.keys(CARD_LIBRARY);
  const options = [];
  while (options.length < count) {
    const id = pool[Math.floor(random() * pool.length)];
    if (!options.includes(id)) {
      options.push(id);
    }
  }
  return options;
}

function buildNodes(random) {
  return [
    { type: "battle", enemyId: ENEMY_ORDER[Math.floor(random() * ENEMY_ORDER.length)] },
    { type: "battle", enemyId: ENEMY_ORDER[Math.floor(random() * ENEMY_ORDER.length)] },
    { type: "battle", enemyId: ENEMY_ORDER[Math.floor(random() * ENEMY_ORDER.length)] },
    { type: "elite", enemyId: ENEMY_ORDER[Math.floor(random() * ENEMY_ORDER.length)] },
    { type: "battle", enemyId: ENEMY_ORDER[Math.floor(random() * ENEMY_ORDER.length)] },
  ];
}

export function createRun({ seed = Date.now() } = {}) {
  const random = createSeededRandom(seed);
  const state = {
    seed,
    mode: "battle",
    nodeIndex: 0,
    nodes: buildNodes(random),
    playerMaxHp: 70,
    playerHp: 70,
    deck: [...STARTER_DECK],
    battle: null,
    rewardOptions: [],
  };

  function startNode() {
    const node = state.nodes[state.nodeIndex];
    const battleSeed = Math.floor(random() * 1_000_000_000);
    state.battle = createBattle({
      seed: battleSeed,
      deck: state.deck,
      enemyId: node.enemyId,
      playerHp: state.playerHp,
      playerMaxHp: state.playerMaxHp,
      enemyHpScale: node.type === "elite" ? 1.35 : 1,
      elite: node.type === "elite",
    });
    state.mode = "battle";
  }

  function settleBattleIfDone() {
    if (!state.battle || state.battle.state.mode !== "finished") {
      return;
    }

    if (state.battle.state.winner === "enemy") {
      state.mode = "defeat";
      state.playerHp = 0;
      return;
    }

    state.playerHp = state.battle.state.player.hp;
    if (state.nodeIndex >= state.nodes.length - 1) {
      state.mode = "victory";
      return;
    }

    state.rewardOptions = randomRewardCards(random, 3);
    state.mode = "reward";
  }

  function playCard(index) {
    if (state.mode !== "battle") {
      return;
    }
    state.battle.playCard(index);
    settleBattleIfDone();
  }

  function endTurn() {
    if (state.mode !== "battle") {
      return;
    }
    state.battle.endTurn();
    settleBattleIfDone();
  }

  function chooseReward(cardId) {
    if (state.mode !== "reward") {
      return;
    }
    if (cardId && CARD_LIBRARY[cardId]) {
      state.deck.push(cardId);
    }
    state.rewardOptions = [];
    state.mode = "map";
  }

  function removeCard(cardId) {
    if (state.mode !== "reward" || !cardId) {
      return false;
    }
    const idx = state.deck.indexOf(cardId);
    if (idx === -1) {
      return false;
    }
    state.deck.splice(idx, 1);
    return true;
  }

  function nextNode() {
    if (state.mode !== "map") {
      return;
    }
    state.nodeIndex += 1;
    startNode();
  }

  function restart(seedOverride = Date.now()) {
    const fresh = createRun({ seed: seedOverride });
    Object.assign(state, fresh.state);
    startNode();
  }

  startNode();

  return {
    state,
    playCard,
    endTurn,
    chooseReward,
    removeCard,
    nextNode,
    restart,
  };
}
