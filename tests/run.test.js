import test from "node:test";
import assert from "node:assert/strict";

import { createRun } from "../core/run/engine.js";

test("run starts at story mode with first node branch options", () => {
  const run = createRun({ seed: 3 });
  assert.equal(run.state.mode, "story");
  assert.equal(run.state.nodeIndex, 0);
  assert.equal(run.state.nodeTotal, 8);
  assert.equal(run.state.story.current.id, "layoff_rumor");
  assert.ok(run.state.pendingStoryChoice.options.length >= 2);
});

test("winning a battle enters reward mode", () => {
  const run = createRun({ seed: 3 });
  run.chooseStoryBranch(run.state.pendingStoryChoice.options[0].id);
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);

  assert.equal(run.state.mode, "reward");
  assert.equal(run.state.rewardOptions.length, 3);
});

test("reward choose and next node progression", () => {
  const run = createRun({ seed: 3 });
  run.chooseStoryBranch(run.state.pendingStoryChoice.options[0].id);
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
  assert.equal(run.state.mode, "story");
  assert.equal(run.state.story.current.id, "hr_meeting");
});

test("remove card during reward tuning", () => {
  const run = createRun({ seed: 3 });
  run.chooseStoryBranch(run.state.pendingStoryChoice.options[0].id);
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);

  const countBefore = run.state.deck.filter((id) => id === "strike").length;
  const removed = run.removeCard("strike");
  const countAfter = run.state.deck.filter((id) => id === "strike").length;

  assert.equal(removed, true);
  assert.equal(countBefore - countAfter, 1);
});

test("story chain is contiguous and recorded", () => {
  const run = createRun({ seed: 3 });
  run.chooseStoryBranch(run.state.pendingStoryChoice.options[0].id);
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0); // to reward
  run.chooseReward(null); // to map
  run.nextNode(); // node 2
  run.chooseStoryBranch(run.state.pendingStoryChoice.options[0].id);

  assert.equal(run.state.story.history[0].id, "layoff_rumor");
  assert.equal(run.state.story.history[1].id, "hr_meeting");
  assert.ok(run.state.story.history[0].branch);
  assert.ok(run.state.story.history.length >= 2);
});

test("branch queue event has higher priority than arc", () => {
  const run = createRun({ seed: 3, nodeTotal: 4 });
  run.chooseStoryBranch("layoff_save_mode");
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);
  run.chooseReward(null);
  run.nextNode(); // node 2: hr_meeting
  run.chooseStoryBranch("hr_quick_exit"); // enqueueBranch job_hunt_sprint
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  run.playCard(0);
  run.chooseReward(null);
  run.nextNode(); // node 3 should be branchQueue event

  assert.equal(run.state.story.current.id, "job_hunt_sprint");
  assert.equal(run.state.story.current.source, "branchQueue");
});
