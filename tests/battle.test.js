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

test("vulnerable increases incoming damage", () => {
  const battle = createBattle({ seed: 2 });
  battle.state.enemy.statuses.vulnerable = 2;
  const hpBefore = battle.state.enemy.hp;
  battle.state.player.hand = [{ id: "strike", name: "Strike", cost: 1, effects: [{ type: "damage", value: 6 }] }];
  battle.playCard(0);
  assert.equal(hpBefore - battle.state.enemy.hp, 9);
});

test("poison ticks down on end turn", () => {
  const battle = createBattle({ seed: 9 });
  battle.state.enemy.statuses.poison = 3;
  const hpBefore = battle.state.enemy.hp;
  battle.endTurn();
  assert.equal(hpBefore - battle.state.enemy.hp, 3);
  assert.equal(battle.state.enemy.statuses.poison, 2);
});

test("enemy chooses block when hp is low", () => {
  const battle = createBattle({ seed: 4 });
  battle.state.enemy.hp = Math.floor(battle.state.enemy.maxHp * 0.35);
  const intent = battle.chooseEnemyIntent();
  assert.equal(intent.type, "block");
});

test("cycle card spends 1 energy and replaces card once per turn", () => {
  const battle = createBattle({ seed: 11 });
  const handBefore = battle.state.player.hand.map((card) => card.id);
  const energyBefore = battle.state.player.energy;

  const first = battle.cycleCard(0);
  assert.equal(first.ok, true);
  assert.equal(battle.state.player.energy, energyBefore - 1);
  assert.equal(battle.state.player.cycleUsed, true);
  assert.equal(battle.state.player.hand.length, handBefore.length);

  const second = battle.cycleCard(0);
  assert.equal(second.ok, false);
  assert.equal(second.reason, "cycle_used");
});

test("cycle resets after end turn", () => {
  const battle = createBattle({ seed: 12 });
  battle.cycleCard(0);
  assert.equal(battle.state.player.cycleUsed, true);
  battle.endTurn();
  assert.equal(battle.state.player.cycleUsed, false);
});
