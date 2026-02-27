import { createRun } from "../core/run/engine.js";

function pickPlayableCard(battleState) {
  const playable = battleState.player.hand
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => card.cost <= battleState.player.energy);
  if (!playable.length) {
    return null;
  }
  playable.sort((a, b) => b.card.cost - a.card.cost);
  return playable[0].idx;
}

function runSingle(seed) {
  const run = createRun({ seed });
  let safety = 1200;
  while (safety-- > 0) {
    const mode = run.state.mode;
    if (mode === "battle") {
      const battle = run.state.battle.state;
      const idx = pickPlayableCard(battle);
      if (idx === null) {
        run.endTurn();
      } else {
        run.playCard(idx);
      }
      continue;
    }
    if (mode === "reward") {
      const firstReward = run.state.rewardOptions[0] || null;
      run.chooseReward(firstReward);
      continue;
    }
    if (mode === "map") {
      run.nextNode();
      continue;
    }
    break;
  }
  return {
    seed,
    result: run.state.mode,
    finalHp: run.state.playerHp,
    deckSize: run.state.deck.length,
    reachedNode: run.state.nodeIndex + 1,
  };
}

function main() {
  const countArg = Number(process.argv[2] || 30);
  const count = Number.isFinite(countArg) && countArg > 0 ? Math.floor(countArg) : 30;
  const outcomes = [];
  for (let i = 0; i < count; i += 1) {
    outcomes.push(runSingle(20260301 + i * 17));
  }

  const summary = outcomes.reduce(
    (acc, item) => {
      acc[item.result] = (acc[item.result] || 0) + 1;
      acc.totalHp += item.finalHp;
      acc.totalDeck += item.deckSize;
      return acc;
    },
    { totalHp: 0, totalDeck: 0 }
  );

  const victoryRate = ((summary.victory || 0) / count) * 100;
  const defeatRate = ((summary.defeat || 0) / count) * 100;
  const avgHp = summary.totalHp / count;
  const avgDeck = summary.totalDeck / count;

  console.log(`Simulated runs: ${count}`);
  console.log(`Victory: ${summary.victory || 0} (${victoryRate.toFixed(1)}%)`);
  console.log(`Defeat: ${summary.defeat || 0} (${defeatRate.toFixed(1)}%)`);
  console.log(`Avg final HP: ${avgHp.toFixed(1)}`);
  console.log(`Avg deck size: ${avgDeck.toFixed(1)}`);
}

main();
