import test from "node:test";
import assert from "node:assert/strict";

import { createBattle } from "../core/battle/engine.js";

test("battle starts with five cards and player phase", () => {
  const battle = createBattle({ seed: 7 });
  assert.equal(battle.state.phase, "player");
  assert.equal(battle.state.player.hand.length, 5);
  assert.equal(battle.state.player.energy, 3);
});

test("playing a card spends energy and affects enemy hp", () => {
  const battle = createBattle({ seed: 7 });
  const idx = battle.state.player.hand.findIndex((card) => card.id === "strike" || card.id === "heavy_strike");
  assert.notEqual(idx, -1);

  const hpBefore = battle.state.enemy.hp;
  const energyBefore = battle.state.player.energy;
  const cost = battle.state.player.hand[idx].cost;

  const result = battle.playCard(idx);
  assert.equal(result.ok, true);
  assert.equal(battle.state.player.energy, energyBefore - cost);
  assert.ok(battle.state.enemy.hp < hpBefore);
});

test("ending turn triggers enemy action", () => {
  const battle = createBattle({ seed: 4 });
  const hpBefore = battle.state.player.hp;
  battle.endTurn();
  assert.equal(battle.state.phase, "player");
  assert.equal(battle.state.turn, 2);
  assert.ok(battle.state.player.hp <= hpBefore);
});
