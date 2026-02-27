import { CARD_LIBRARY, STARTER_DECK } from "../../content/cards.js";
import { ENEMY_ORDER } from "../../content/enemies.js";
import { STORY_ARC_ORDER, STORY_DECK, STORY_EVENTS } from "../../content/story-events.js";
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

function pickFromPool(pool, random) {
  return pool[Math.floor(random() * pool.length)];
}

function hasFlag(storyState, flag) {
  return Boolean(storyState.flags[flag]);
}

function applyPreEffects(storyState, event) {
  const effects = event.preEffects || {};
  (effects.setFlags || []).forEach((flag) => {
    storyState.flags[flag] = true;
  });
  (effects.enqueue || []).forEach((eventId) => {
    storyState.queue.push(eventId);
  });
  (effects.bias || []).forEach((item) => {
    storyState.bias[item.tag] = (storyState.bias[item.tag] || 0) + item.delta;
  });
}

function chooseDeckEvent(storyState, random) {
  const weighted = STORY_DECK.map((eventId) => {
    const event = STORY_EVENTS[eventId];
    const score = (event.tags || []).reduce((sum, tag) => sum + (storyState.bias[tag] || 0), 0);
    return { eventId, weight: 1 + Math.max(0, score) };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) {
      return STORY_EVENTS[item.eventId];
    }
  }
  return STORY_EVENTS[weighted[weighted.length - 1].eventId];
}

function chooseStoryEvent(storyState, random) {
  if (storyState.queue.length) {
    const queuedId = storyState.queue.shift();
    return { event: STORY_EVENTS[queuedId], source: "queue" };
  }

  const arcEventId = STORY_ARC_ORDER[storyState.arcIndex];
  if (arcEventId) {
    const arcEvent = STORY_EVENTS[arcEventId];
    storyState.arcIndex += 1;
    return { event: arcEvent, source: "arc" };
  }

  return { event: chooseDeckEvent(storyState, random), source: "deck" };
}

function buildNodes(random, nodeTotal = 5) {
  const storyState = {
    arcIndex: 0,
    queue: [],
    flags: {},
    bias: {},
  };
  const nodes = [];

  for (let index = 0; index < nodeTotal; index += 1) {
    const picked = chooseStoryEvent(storyState, random);
    const storyEvent = picked.event;
    applyPreEffects(storyState, storyEvent);

    const enemyPool = storyEvent.enemyPool?.length ? storyEvent.enemyPool : ENEMY_ORDER;
    nodes.push({
      type: storyEvent.nodeType || "battle",
      enemyId: pickFromPool(enemyPool, random),
      story: {
        id: storyEvent.id,
        source: picked.source,
        title: storyEvent.title,
        text: storyEvent.text,
        tags: [...(storyEvent.tags || [])],
        runtimeEffects: { ...(storyEvent.runtimeEffects || {}) },
      },
    });
  }

  return nodes;
}

function applyRuntimeStoryEffects(state, node) {
  const delta = Number(node.story.runtimeEffects?.playerHpDelta || 0);
  if (!delta) {
    return;
  }
  state.playerHp = Math.max(1, Math.min(state.playerMaxHp, state.playerHp + delta));
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
    story: {
      current: null,
      history: [],
    },
  };

  function startNode() {
    const node = state.nodes[state.nodeIndex];
    const battleSeed = Math.floor(random() * 1_000_000_000);

    applyRuntimeStoryEffects(state, node);
    state.story.current = {
      id: node.story.id,
      source: node.story.source,
      title: node.story.title,
      text: node.story.text,
      tags: node.story.tags,
    };
    state.story.history.push({
      node: state.nodeIndex + 1,
      ...state.story.current,
    });

    state.battle = createBattle({
      seed: battleSeed,
      deck: state.deck,
      enemyId: node.enemyId,
      playerHp: state.playerHp,
      playerMaxHp: state.playerMaxHp,
      enemyHpScale: node.type === "elite" ? 1.25 : 1,
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
