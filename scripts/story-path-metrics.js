import { createRun } from "../core/run/engine.js";

function forceWinCurrentBattle(run) {
  const battleState = run.state.battle?.state;
  if (!battleState) return;
  battleState.enemy.hp = 1;
  battleState.player.hand = [
    {
      id: "strike",
      name: "Strike",
      cost: 1,
      text: "Deal 6 damage.",
      effects: [{ type: "damage", value: 6 }],
    },
  ];
  run.playCard(0);
}

function simulateRunWithDecisions({ seed, nodeTotal, decisions }) {
  const run = createRun({ seed, nodeTotal });
  const events = [];
  const eventRecords = [];
  const sourceCounts = { arc: 0, queue: 0, branchQueue: 0, deck: 0 };
  let branchNodeCount = 0;
  let cursor = 0;
  const maxSteps = nodeTotal * 8;
  let safety = 0;

  while (!["victory", "defeat"].includes(run.state.mode) && safety < maxSteps) {
    safety += 1;
    if (run.state.mode === "story") {
      const current = run.state.story.current;
      if (current) {
        events.push(`${current.id}${current.branch ? `:${current.branch.id}` : ""}`);
        eventRecords.push({ id: current.id, source: current.source });
        if (sourceCounts[current.source] !== undefined) sourceCounts[current.source] += 1;
      }
      const options = run.state.pendingStoryChoice?.options || [];
      if (options.length) {
        branchNodeCount += 1;
        if (decisions[cursor] === undefined) {
          return {
            status: "needs_more",
            prefix: decisions.slice(0, cursor),
            optionCount: options.length,
          };
        }
        const idx = Math.max(0, Math.min(options.length - 1, decisions[cursor]));
        run.chooseStoryBranch(options[idx].id);
        events[events.length - 1] = `${current.id}:${options[idx].id}`;
        cursor += 1;
      } else {
        run.chooseStoryBranch(undefined);
      }
      continue;
    }

    if (run.state.mode === "battle") {
      forceWinCurrentBattle(run);
      continue;
    }
    if (run.state.mode === "reward") {
      run.chooseReward(null);
      continue;
    }
    if (run.state.mode === "map") {
      run.nextNode();
      continue;
    }
  }

  return {
    status: run.state.mode === "victory" ? "complete" : "incomplete",
    events,
    eventRecords,
    branchNodeCount,
    sourceCounts,
    usedDecisions: decisions.slice(0, cursor),
  };
}

function enumeratePaths({ seed, nodeTotal, maxPaths }) {
  const pending = [[]];
  const results = [];
  const seenDecisions = new Set();

  while (pending.length && results.length < maxPaths) {
    const decisions = pending.pop();
    const sim = simulateRunWithDecisions({ seed, nodeTotal, decisions });

    if (sim.status === "needs_more") {
      for (let i = sim.optionCount - 1; i >= 0; i -= 1) {
        pending.push([...sim.prefix, i]);
      }
      continue;
    }

    if (sim.status === "complete") {
      const decisionKey = sim.usedDecisions.join(",");
      if (!seenDecisions.has(decisionKey)) {
        seenDecisions.add(decisionKey);
        results.push(sim);
      }
    }
  }

  return results;
}

function parseNumberFlag(name, fallback) {
  const token = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!token) return fallback;
  const value = Number(token.split("=")[1]);
  return Number.isFinite(value) ? value : fallback;
}

function computeMetrics(paths) {
  const pathSet = new Set(paths.map((entry) => entry.events.join("->")));
  const nonArcEvents = paths.flatMap((entry) =>
    entry.eventRecords.filter((record) => record.source !== "arc").map((record) => record.id)
  );
  const frequency = new Map();
  nonArcEvents.forEach((eventId) => {
    frequency.set(eventId, (frequency.get(eventId) || 0) + 1);
  });

  const top10Count = [...frequency.values()]
    .sort((a, b) => b - a)
    .slice(0, 10)
    .reduce((sum, value) => sum + value, 0);

  const totalNodes = paths.reduce((sum, entry) => sum + entry.events.length, 0);
  const nonArcTotalNodes = paths.reduce(
    (sum, entry) => sum + entry.eventRecords.filter((record) => record.source !== "arc").length,
    0
  );
  const branchQueueNodes = paths.reduce((sum, entry) => sum + entry.sourceCounts.branchQueue, 0);
  const avgBranchNodes =
    paths.length === 0 ? 0 : paths.reduce((sum, entry) => sum + entry.branchNodeCount, 0) / paths.length;

  return {
    runsSampled: paths.length,
    unique_story_paths: pathSet.size,
    avg_branch_nodes_per_run: Number(avgBranchNodes.toFixed(3)),
    branch_exclusive_event_ratio: totalNodes ? Number((branchQueueNodes / totalNodes).toFixed(3)) : 0,
    top10_event_repeat_ratio: nonArcTotalNodes ? Number((top10Count / nonArcTotalNodes).toFixed(3)) : 0,
  };
}

const seed = parseNumberFlag("--seed", 20260227);
const nodeTotal = parseNumberFlag("--nodes", 11);
const maxPaths = parseNumberFlag("--maxPaths", 5000);

const paths = enumeratePaths({ seed, nodeTotal, maxPaths });
const metrics = computeMetrics(paths);

console.log(JSON.stringify({ seed, nodeTotal, maxPaths, ...metrics }, null, 2));
