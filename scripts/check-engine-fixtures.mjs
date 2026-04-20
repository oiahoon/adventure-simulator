import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { applyChoiceToState, createInitialState, resolveEndingWithRules } from "../public/engine.js";

const root = process.cwd();
const objectivePack = readJson("data/chinese-reigns/objectives.mvp.seed.json");
const endingPack = readJson("data/chinese-reigns/endings.mvp.seed.json");
const rulesPack = readJson("data/chinese-reigns/rules.mvp.seed.json");
const fixturePack = readJson("data/chinese-reigns/engine-fixtures.mvp.json");

const failures = [];

fixturePack.fixtures.forEach((fixture) => {
  const baseState = createInitialState({
    archive: { reigns: [], unlockedEndingIds: [] },
    objectivePack,
  });
  const state = mergeFixtureState(baseState, fixture.state);
  const ending = resolveEndingWithRules(state, endingPack, rulesPack);
  const actualEndingId = ending?.id ?? null;
  if (actualEndingId !== fixture.expectedEndingId) {
    failures.push({
      id: fixture.id,
      description: fixture.description,
      expectedEndingId: fixture.expectedEndingId,
      actualEndingId,
    });
  }
});

(fixturePack.transitionFixtures ?? []).forEach((fixture) => {
  const baseState = createInitialState({
    archive: { reigns: [], unlockedEndingIds: [] },
    objectivePack,
  });
  const state = mergeFixtureState(baseState, fixture.state);
  const nextState = applyChoiceToState(state, fixture.card, fixture.side ?? "left", rulesPack);
  if (nextState.counters.years_ruled !== fixture.expected.years_ruled) {
    failures.push({
      id: fixture.id,
      description: fixture.description,
      expectedYearsRuled: fixture.expected.years_ruled,
      actualYearsRuled: nextState.counters.years_ruled,
    });
  }
  Object.entries(fixture.expected.counters ?? {}).forEach(([key, value]) => {
    if ((nextState.counters[key] ?? null) !== value) {
      failures.push({
        id: fixture.id,
        description: fixture.description,
        counter: key,
        expectedValue: value,
        actualValue: nextState.counters[key] ?? null,
      });
    }
  });
});

if (failures.length) {
  console.error(JSON.stringify({ fixtureFailures: failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  fixtureFailures: [],
  checkedEndingFixtures: fixturePack.fixtures.length,
  checkedTransitionFixtures: (fixturePack.transitionFixtures ?? []).length,
}, null, 2));

function mergeFixtureState(baseState, partialState) {
  return {
    ...baseState,
    ...partialState,
    resources: { ...baseState.resources, ...(partialState.resources ?? {}) },
    flags: { ...baseState.flags, ...(partialState.flags ?? {}) },
    counters: { ...baseState.counters, ...(partialState.counters ?? {}) },
    completedObjectiveIds: [...(partialState.completedObjectiveIds ?? baseState.completedObjectiveIds)],
    currentObjectiveIds: [...(partialState.currentObjectiveIds ?? baseState.currentObjectiveIds)],
    eventHistory: [...(partialState.eventHistory ?? baseState.eventHistory)],
    endingHistory: [...(partialState.endingHistory ?? baseState.endingHistory)],
    cooldowns: { ...baseState.cooldowns, ...(partialState.cooldowns ?? {}) },
    nextQueue: [...(partialState.nextQueue ?? baseState.nextQueue)],
  };
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}
