import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  RESOURCE_ORDER,
  applyChoiceToState,
  createInitialState,
  resolveEnding,
  resolveEndingWithRules,
  selectNextCard,
  updateObjectiveProgress,
} from "../public/engine.js";

const root = process.cwd();
const eventPack = readJson("data/chinese-reigns/events.mvp.seed.json");
const objectivePack = readJson("data/chinese-reigns/objectives.mvp.seed.json");
const endingPack = readJson("data/chinese-reigns/endings.mvp.seed.json");
const rulesPack = readJson("data/chinese-reigns/rules.mvp.seed.json");
const outputDir = path.join(root, "tmp", "simulations");
mkdirSync(outputDir, { recursive: true });

const runCount = Number(process.argv[2] ?? 500);
const turnCap = Number(process.argv[3] ?? 200);
const strategies = ["random", "balance", "long-seeking"];
const report = {};

for (const strategy of strategies) {
  const results = [];
  for (let index = 0; index < runCount; index += 1) {
    results.push(runSimulation({ strategy, seed: `${strategy}-${index}`, turnCap }));
  }
  results.sort((a, b) => b.years - a.years);
  report[strategy] = {
    runs: runCount,
    turnCap,
    maxYears: results[0].years,
    maxEndingId: results[0].endingId,
    maxEndedByCap: results[0].endedByCap,
    averageYears: round(results.reduce((sum, item) => sum + item.years, 0) / results.length),
    medianYears: results[Math.floor(results.length / 2)].years,
    topFive: results.slice(0, 5),
  };
}

writeFileSync(path.join(outputDir, "long-run-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

function runSimulation({ strategy, seed, turnCap }) {
  const random = seededRandom(seed);
  let state = createInitialState({ archive: { reigns: [], unlockedEndingIds: [] }, objectivePack, random });
  let currentCard = selectNextCard({ state, eventPack, currentCard: undefined, random }).card;
  const choices = [];

  while (state.counters.years_ruled < turnCap) {
    const side = chooseSide({ strategy, state, card: currentCard, random });
    choices.push({ cardId: currentCard.id, side });
    state = applyChoiceToState(state, currentCard, side, rulesPack);
    state = updateObjectiveProgress(state, objectivePack);
    const ending = resolveEndingWithRules(state, endingPack, rulesPack);
    if (ending) {
      return {
        years: state.counters.years_ruled,
        endingId: ending.id,
        resources: state.resources,
        completedObjectiveIds: state.completedObjectiveIds,
        endedByCap: false,
        lastChoices: choices.slice(-8),
      };
    }
    const next = selectNextCard({ state, eventPack, currentCard, random });
    state = next.state;
    currentCard = next.card;
  }

  return {
    years: state.counters.years_ruled,
    endingId: "turn_cap_reached",
    resources: state.resources,
    completedObjectiveIds: state.completedObjectiveIds,
    endedByCap: true,
    lastChoices: choices.slice(-8),
  };
}

function chooseSide({ strategy, state, card, random }) {
  if (strategy === "random") return random() < 0.5 ? "left" : "right";

  const scored = ["left", "right"].map((side) => {
    const nextState = applyChoiceToState(state, card, side, rulesPack);
    const ending = resolveEndingWithRules(nextState, endingPack, rulesPack);
    let score = 0;

    if (strategy === "balance") {
      score = RESOURCE_ORDER.reduce((sum, key) => sum + Math.abs(nextState.resources[key] - 50), 0);
      if (ending?.id !== "peaceful_abdication") score += ending ? 1000 : 0;
    }

    if (strategy === "long-seeking") {
      const minDistanceToDeath = Math.min(
        ...RESOURCE_ORDER.flatMap((key) => [nextState.resources[key], 100 - nextState.resources[key]])
      );
      const stabilityPenalty = nextState.counters.years_ruled >= 18 &&
        RESOURCE_ORDER.every((key) => nextState.resources[key] >= 35 && nextState.resources[key] <= 75)
        ? 40
        : 0;
      score = -minDistanceToDeath + stabilityPenalty;
      if (ending) score += 1000;
    }

    return { side, score };
  });

  scored.sort((a, b) => a.score - b.score);
  if (scored[0].score === scored[1].score) return random() < 0.5 ? "left" : "right";
  return scored[0].side;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function seededRandom(seed) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}
