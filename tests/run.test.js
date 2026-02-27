import test from "node:test";
import assert from "node:assert/strict";

import { createRun } from "../core/run/engine.js";

test("run starts at battle mode with first node", () => {
  const run = createRun({ seed: 3 });
  assert.equal(run.state.mode, "battle");
  assert.equal(run.state.nodeIndex, 0);
  assert.ok(run.state.battle);
});

test("winning a battle enters reward mode", () => {
  const run = createRun({ seed: 3 });
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);

  assert.equal(run.state.mode, "reward");
  assert.equal(run.state.rewardOptions.length, 3);
});

test("reward choose and next node progression", () => {
  const run = createRun({ seed: 3 });
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);

  const beforeDeck = run.state.deck.length;
  const chosen = run.state.rewardOptions[0];
  run.chooseReward(chosen);
  assert.equal(run.state.mode, "map");
  assert.equal(run.state.deck.length, beforeDeck + 1);

  run.nextNode();
  assert.equal(run.state.nodeIndex, 1);
  assert.equal(run.state.mode, "battle");
});

test("remove card during reward tuning", () => {
  const run = createRun({ seed: 3 });
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);

  const countBefore = run.state.deck.filter((id) => id === "strike").length;
  const removed = run.removeCard("strike");
  const countAfter = run.state.deck.filter((id) => id === "strike").length;

  assert.equal(removed, true);
  assert.equal(countBefore - countAfter, 1);
});
