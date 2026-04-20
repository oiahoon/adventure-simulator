import { readFileSync } from "node:fs";
import path from "node:path";
import {
  applyChoiceToState,
  createInitialState,
  selectNextCard,
  updateObjectiveProgress,
} from "../public/engine.js";

const root = process.cwd();
const eventPack = readJson("data/chinese-reigns/events.mvp.seed.json");
const objectivePack = readJson("data/chinese-reigns/objectives.mvp.seed.json");
const rulesPack = readJson("data/chinese-reigns/rules.mvp.seed.json");

const runCount = Number(process.argv[2] ?? 100);
const turnCount = Number(process.argv[3] ?? 40);
let violations = 0;
const samples = [];

for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
  let state = createInitialState({
    archive: { reigns: [], unlockedEndingIds: [] },
    objectivePack,
    random: Math.random,
  });
  let currentCard = selectNextCard({ state, eventPack, currentCard: undefined, random: Math.random, rules: rulesPack }).card;
  const seen = [];

  for (let turnIndex = 0; turnIndex < turnCount; turnIndex += 1) {
    seen.push({ turn: turnIndex + 1, actor: currentCard.actor, cardId: currentCard.id });
    if (isTripleActorRun(seen)) {
      violations += 1;
      samples.push(seen.slice(-3));
      break;
    }
    state = applyChoiceToState(state, currentCard, turnIndex % 2 === 0 ? "left" : "right", rulesPack);
    state = updateObjectiveProgress(state, objectivePack);
    const next = selectNextCard({ state, eventPack, currentCard, random: Math.random, rules: rulesPack });
    state = next.state;
    currentCard = next.card;
  }
}

if (violations > 0) {
  console.error(JSON.stringify({ actorTripleViolations: violations, samples }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ actorTripleViolations: 0, runs: runCount, turnsPerRun: turnCount }, null, 2));

function isTripleActorRun(seen) {
  if (seen.length < 3) return false;
  const lastThree = seen.slice(-3);
  return lastThree.every((entry) => entry.actor === lastThree[0].actor);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}
