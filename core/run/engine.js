import { CARD_LIBRARY, STARTER_DECK } from "../../content/cards.js";
import { ENEMY_ORDER } from "../../content/enemies.js";
import { STORY_ARC_ORDER, STORY_DECK, STORY_EVENTS } from "../../content/story-events.js";
import { createBattle, createSeededRandom } from "../battle/engine.js";

const NODE_TOTAL = 11;

function randomRewardCards(random, count) {
  const pool = Object.keys(CARD_LIBRARY);
  const options = [];
  while (options.length < count) {
    const id = pool[Math.floor(random() * pool.length)];
    if (!options.includes(id)) options.push(id);
  }
  return options;
}

function pickFromPool(pool, random) {
  return pool[Math.floor(random() * pool.length)];
}

function chooseDeckEvent(planner, random) {
  const candidates = STORY_DECK.filter((eventId) => {
    const event = STORY_EVENTS[eventId];
    if (event.requiresFlags?.some((flag) => !planner.flags[flag])) return false;
    if (event.forbidFlags?.some((flag) => planner.flags[flag])) return false;
    return true;
  });
  const pool = candidates.length ? candidates : STORY_DECK;

  const weighted = pool.map((eventId) => {
    const event = STORY_EVENTS[eventId];
    const score = (event.tags || []).reduce((sum, tag) => sum + (planner.bias[tag] || 0), 0);
    return { eventId, weight: 1 + Math.max(0, score) };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return STORY_EVENTS[item.eventId];
  }
  return STORY_EVENTS[weighted[weighted.length - 1].eventId];
}

function chooseStoryEvent(planner, random) {
  if (planner.branchQueue.length) {
    const branchEventId = planner.branchQueue.shift();
    return { event: STORY_EVENTS[branchEventId], source: "branchQueue" };
  }
  if (planner.queue.length) {
    const queuedId = planner.queue.shift();
    return { event: STORY_EVENTS[queuedId], source: "queue" };
  }
  const arcEventId = STORY_ARC_ORDER[planner.arcIndex];
  if (arcEventId) {
    planner.arcIndex += 1;
    return { event: STORY_EVENTS[arcEventId], source: "arc" };
  }
  return { event: chooseDeckEvent(planner, random), source: "deck" };
}

function applyStoryEffects(planner, state, effects = {}) {
  (effects.setFlags || []).forEach((flag) => {
    planner.flags[flag] = true;
  });
  (effects.enqueue || []).forEach((eventId) => {
    planner.queue.push(eventId);
  });
  (effects.enqueueBranch || []).forEach((eventId) => {
    planner.branchQueue.push(eventId);
  });
  (effects.bias || []).forEach((item) => {
    planner.bias[item.tag] = (planner.bias[item.tag] || 0) + item.delta;
  });
  const hpDelta = Number(effects.playerHpDelta || 0);
  if (hpDelta) {
    state.playerHp = Math.max(1, Math.min(state.playerMaxHp, state.playerHp + hpDelta));
  }
}

function createNodeFromEvent(storyEvent, source, random) {
  const enemyPool = storyEvent.enemyPool?.length ? storyEvent.enemyPool : ENEMY_ORDER;
  return {
    type: storyEvent.nodeType || "battle",
    enemyId: pickFromPool(enemyPool, random),
    story: {
      id: storyEvent.id,
      source,
      title: storyEvent.title,
      text: storyEvent.text,
      tags: [...(storyEvent.tags || [])],
      preEffects: { ...(storyEvent.preEffects || {}) },
      branches: [...(storyEvent.branches || [])],
      runtimeEffects: { ...(storyEvent.runtimeEffects || {}) },
    },
  };
}

export function createRun({ seed = Date.now(), nodeTotal = NODE_TOTAL } = {}) {
  const random = createSeededRandom(seed);
  const planner = {
    arcIndex: 0,
    branchQueue: [],
    queue: [],
    flags: {},
    bias: {},
  };

  const state = {
    seed,
    mode: "battle",
    nodeIndex: 0,
    nodeTotal,
    nodes: [],
    playerMaxHp: 70,
    playerHp: 70,
    deck: [...STARTER_DECK],
    battle: null,
    rewardOptions: [],
    pendingStoryChoice: null,
    story: {
      current: null,
      history: [],
    },
  };

  function ensureCurrentNode() {
    if (!state.nodes[state.nodeIndex]) {
      const picked = chooseStoryEvent(planner, random);
      state.nodes[state.nodeIndex] = createNodeFromEvent(picked.event, picked.source, random);
    }
    return state.nodes[state.nodeIndex];
  }

  function launchBattleForNode(node) {
    const battleSeed = Math.floor(random() * 1_000_000_000);
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

  function beginNode() {
    const node = ensureCurrentNode();
    state.story.current = {
      id: node.story.id,
      source: node.story.source,
      title: node.story.title,
      text: node.story.text,
      tags: node.story.tags,
      branch: null,
    };
    state.story.history.push({
      node: state.nodeIndex + 1,
      ...state.story.current,
    });

    applyStoryEffects(planner, state, node.story.preEffects);
    applyStoryEffects(planner, state, node.story.runtimeEffects);

    if (node.story.branches.length) {
      state.pendingStoryChoice = {
        eventId: node.story.id,
        options: node.story.branches.map((branch) => ({
          id: branch.id,
          label: branch.label,
          text: branch.text,
        })),
      };
      state.mode = "story";
      state.battle = null;
      return;
    }

    state.pendingStoryChoice = null;
    launchBattleForNode(node);
  }

  function settleBattleIfDone() {
    if (!state.battle || state.battle.state.mode !== "finished") return;

    if (state.battle.state.winner === "enemy") {
      state.mode = "defeat";
      state.playerHp = 0;
      return;
    }

    state.playerHp = state.battle.state.player.hp;
    if (state.nodeIndex >= state.nodeTotal - 1) {
      state.mode = "victory";
      return;
    }

    state.rewardOptions = randomRewardCards(random, 3);
    state.mode = "reward";
  }

  function chooseStoryBranch(branchId) {
    if (state.mode !== "story") return false;
    const node = ensureCurrentNode();
    const branch = node.story.branches.find((item) => item.id === branchId) || node.story.branches[0];
    if (!branch) return false;

    applyStoryEffects(planner, state, branch.effects || {});
    state.story.current.branch = {
      id: branch.id,
      label: branch.label,
      text: branch.text,
    };
    state.story.history[state.story.history.length - 1].branch = state.story.current.branch;
    state.pendingStoryChoice = null;
    launchBattleForNode(node);
    return true;
  }

  function playCard(index) {
    if (state.mode !== "battle") return;
    state.battle.playCard(index);
    settleBattleIfDone();
  }

  function endTurn() {
    if (state.mode !== "battle") return;
    state.battle.endTurn();
    settleBattleIfDone();
  }

  function chooseReward(cardId) {
    if (state.mode !== "reward") return;
    if (cardId && CARD_LIBRARY[cardId]) state.deck.push(cardId);
    state.rewardOptions = [];
    state.mode = "map";
  }

  function removeCard(cardId) {
    if (state.mode !== "reward" || !cardId) return false;
    const idx = state.deck.indexOf(cardId);
    if (idx === -1) return false;
    state.deck.splice(idx, 1);
    return true;
  }

  function nextNode() {
    if (state.mode !== "map") return;
    state.nodeIndex += 1;
    beginNode();
  }

  function restart(seedOverride = Date.now()) {
    const fresh = createRun({ seed: seedOverride, nodeTotal: state.nodeTotal });
    Object.assign(state, fresh.state);
    beginNode();
  }

  beginNode();

  return {
    state,
    playCard,
    endTurn,
    chooseReward,
    removeCard,
    nextNode,
    restart,
    chooseStoryBranch,
  };
}
