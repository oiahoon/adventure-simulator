import { CARD_LIBRARY, STARTER_DECK } from "../../content/cards.js";
import { ENEMY_LIBRARY, ENEMY_ORDER } from "../../content/enemies.js";

function cloneCard(cardId) {
  const base = CARD_LIBRARY[cardId];
  if (!base) {
    throw new Error(`Unknown card: ${cardId}`);
  }
  return { ...base };
}

function shuffle(list, random) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function createSeededRandom(seed = 1) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

export function createBattle({ seed = Date.now() } = {}) {
  const random = createSeededRandom(seed);
  const enemyId = ENEMY_ORDER[Math.floor(random() * ENEMY_ORDER.length)];
  const enemyTemplate = ENEMY_LIBRARY[enemyId];

  const state = {
    seed,
    mode: "battle",
    turn: 1,
    phase: "player",
    winner: null,
    logs: [],
    player: {
      maxHp: 70,
      hp: 70,
      block: 0,
      maxEnergy: 3,
      energy: 3,
      hand: [],
      drawPile: shuffle(STARTER_DECK, random),
      discardPile: [],
      exhaustPile: [],
    },
    enemy: {
      ...enemyTemplate,
      hp: enemyTemplate.maxHp,
      block: 0,
      intentIndex: 0,
    },
  };

  function addLog(text) {
    state.logs.push(text);
    if (state.logs.length > 30) {
      state.logs.shift();
    }
  }

  function drawCards(count) {
    for (let i = 0; i < count; i += 1) {
      if (!state.player.drawPile.length && state.player.discardPile.length) {
        state.player.drawPile = shuffle(state.player.discardPile, random);
        state.player.discardPile = [];
        addLog("Shuffled discard into draw pile.");
      }
      if (!state.player.drawPile.length) {
        return;
      }
      const cardId = state.player.drawPile.pop();
      state.player.hand.push(cloneCard(cardId));
    }
  }

  function takeDamage(target, amount) {
    const blocked = Math.min(target.block, amount);
    const hpLoss = Math.max(0, amount - blocked);
    target.block -= blocked;
    target.hp = Math.max(0, target.hp - hpLoss);
    return { blocked, hpLoss };
  }

  function applyCardEffect(effect) {
    if (effect.type === "damage") {
      const result = takeDamage(state.enemy, effect.value);
      addLog(`Player deals ${effect.value} (${result.hpLoss} HP).`);
    } else if (effect.type === "block") {
      state.player.block += effect.value;
      addLog(`Player gains ${effect.value} block.`);
    } else if (effect.type === "draw") {
      drawCards(effect.value);
      addLog(`Player draws ${effect.value}.`);
    } else if (effect.type === "heal") {
      const prev = state.player.hp;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + effect.value);
      addLog(`Player heals ${state.player.hp - prev}.`);
    } else if (effect.type === "energy") {
      state.player.energy += effect.value;
      addLog(`Player gains ${effect.value} energy.`);
    } else if (effect.type === "self_block") {
      state.player.block = Math.max(0, state.player.block + effect.value);
      addLog(`Player block ${effect.value >= 0 ? "+" : ""}${effect.value}.`);
    }
  }

  function checkResult() {
    if (state.enemy.hp <= 0) {
      state.mode = "finished";
      state.winner = "player";
      state.phase = "done";
      addLog("Battle won.");
      return true;
    }
    if (state.player.hp <= 0) {
      state.mode = "finished";
      state.winner = "enemy";
      state.phase = "done";
      addLog("Battle lost.");
      return true;
    }
    return false;
  }

  function playCard(handIndex) {
    if (state.phase !== "player" || state.mode !== "battle") {
      return { ok: false, reason: "not_player_phase" };
    }
    const card = state.player.hand[handIndex];
    if (!card) {
      return { ok: false, reason: "invalid_card" };
    }
    if (card.cost > state.player.energy) {
      return { ok: false, reason: "no_energy" };
    }

    state.player.energy -= card.cost;
    state.player.hand.splice(handIndex, 1);
    state.player.discardPile.push(card.id);
    addLog(`Play ${card.name}.`);

    card.effects.forEach((effect) => applyCardEffect(effect));
    checkResult();
    return { ok: true };
  }

  function runEnemyTurn() {
    const intent = state.enemy.intents[state.enemy.intentIndex % state.enemy.intents.length];
    state.enemy.intentIndex += 1;

    if (intent.type === "attack") {
      const result = takeDamage(state.player, intent.value);
      addLog(`${state.enemy.name} attacks ${intent.value} (${result.hpLoss} HP).`);
    }
    if (intent.type === "block") {
      state.enemy.block += intent.value;
      addLog(`${state.enemy.name} gains ${intent.value} block.`);
    }
  }

  function endTurn() {
    if (state.phase !== "player" || state.mode !== "battle") {
      return;
    }
    state.phase = "enemy";
    state.player.hand.forEach((card) => state.player.discardPile.push(card.id));
    state.player.hand = [];
    state.player.block = Math.max(0, state.player.block);

    runEnemyTurn();
    if (checkResult()) {
      return;
    }

    state.enemy.block = 0;
    state.player.block = 0;
    state.turn += 1;
    state.player.energy = state.player.maxEnergy;
    drawCards(5);
    state.phase = "player";
    addLog(`Turn ${state.turn} start.`);
  }

  function getNextEnemyIntent() {
    const idx = state.enemy.intentIndex % state.enemy.intents.length;
    return state.enemy.intents[idx];
  }

  drawCards(5);
  addLog(`Encounter: ${state.enemy.name}.`);
  addLog("Turn 1 start.");

  return {
    state,
    playCard,
    endTurn,
    getNextEnemyIntent,
  };
}
