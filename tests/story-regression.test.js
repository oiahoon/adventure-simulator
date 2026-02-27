import test from "node:test";
import assert from "node:assert/strict";

import { createRun } from "../core/run/engine.js";

function forceBattleWin(run) {
  run.state.battle.state.enemy.hp = 1;
  run.state.battle.state.player.hand = [
    { id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] },
  ];
  run.playCard(0);
  run.chooseReward(null);
  run.nextNode();
}

test("fixed branch sequence routes to branch-exclusive events", () => {
  const run = createRun({ seed: 7, nodeTotal: 6 });

  assert.equal(run.state.story.current.id, "layoff_rumor");
  run.chooseStoryBranch("layoff_save_mode");
  forceBattleWin(run); // node2

  assert.equal(run.state.story.current.id, "hr_meeting");
  run.chooseStoryBranch("hr_quick_exit");
  forceBattleWin(run); // node3

  assert.equal(run.state.story.current.id, "absurd_side_hustle");
  run.chooseStoryBranch("absurd_reject");
  forceBattleWin(run); // node4

  assert.equal(run.state.story.current.id, "job_hunt_sprint");
  assert.equal(run.state.story.current.source, "branchQueue");
  assert.deepEqual(
    run.state.story.history.slice(0, 4).map((item) => item.id),
    ["layoff_rumor", "hr_meeting", "absurd_side_hustle", "job_hunt_sprint"]
  );
});
