import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  RESOURCE_ORDER,
  applyChoiceToState,
  createInitialState,
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

const runCount = Number(process.argv[2] ?? 200);
const turnCap = Number(process.argv[3] ?? 120);
const strategies = ["random", "balance", "long-seeking"];

const variants = [
  {
    id: "current-default",
    description: "Current MVP bands at 35/45/55 with 60-year old-age cap.",
    rules: rulesPack,
  },
  {
    id: "earlier-pressure",
    description: "Starts pressure one band earlier and tightens the old-age cap to 55.",
    rules: {
      ...rulesPack,
      endingRules: rulesPack.endingRules.map((rule) =>
        rule.id === "old-age-succession"
          ? { ...rule, match: { ...rule.match, value: 55 } }
          : rule
      ),
      pressureSystem: {
        ...rulesPack.pressureSystem,
        bands: [
          { startsAtYear: 30, pressureIncrement: 1, resourcePressureBonus: 0 },
          { startsAtYear: 40, pressureIncrement: 2, resourcePressureBonus: 1 },
          { startsAtYear: 50, pressureIncrement: 3, resourcePressureBonus: 2 },
        ],
      },
    },
  },
  {
    id: "harsher-late",
    description: "Keeps the 60-year cap but adds steeper late-reign pressure.",
    rules: {
      ...rulesPack,
      pressureSystem: {
        ...rulesPack.pressureSystem,
        bands: [
          { startsAtYear: 35, pressureIncrement: 1, resourcePressureBonus: 1 },
          { startsAtYear: 45, pressureIncrement: 3, resourcePressureBonus: 2 },
          { startsAtYear: 52, pressureIncrement: 5, resourcePressureBonus: 3 },
        ],
      },
    },
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  runCount,
  turnCap,
  variants: {},
};

variants.forEach((variant) => {
  report.variants[variant.id] = {
    description: variant.description,
    byStrategy: runVariant(variant.rules),
  };
});

writeFileSync(path.join(outputDir, "pressure-tuning-report.json"), JSON.stringify(report, null, 2));
writeFileSync(path.join(outputDir, "pressure-tuning-report.md"), formatMarkdown(report));
console.log(JSON.stringify(report, null, 2));

function runVariant(variantRules) {
  const strategyReport = {};
  for (const strategy of strategies) {
    const results = [];
    for (let index = 0; index < runCount; index += 1) {
      results.push(runSimulation({ strategy, seed: `${strategy}-${index}`, turnCap, rules: variantRules }));
    }
    results.sort((a, b) => b.years - a.years);
    strategyReport[strategy] = {
      maxYears: results[0].years,
      maxEndingId: results[0].endingId,
      averageYears: round(results.reduce((sum, item) => sum + item.years, 0) / results.length),
      medianYears: results[Math.floor(results.length / 2)].years,
      oldAgeEndingRate: round(
        (results.filter((item) => item.endingId === "old_age_succession").length / results.length) * 100
      ),
      peacefulEndingRate: round(
        (results.filter((item) => item.endingId === "peaceful_abdication").length / results.length) * 100
      ),
      topEndingIds: summarizeEndings(results),
    };
  }
  return strategyReport;
}

function runSimulation({ strategy, seed, turnCap, rules }) {
  const random = seededRandom(seed);
  let state = createInitialState({ archive: { reigns: [], unlockedEndingIds: [] }, objectivePack, random });
  let currentCard = selectNextCard({ state, eventPack, currentCard: undefined, random, rules }).card;

  while (state.counters.years_ruled < turnCap) {
    const side = chooseSide({ strategy, state, card: currentCard, random, rules });
    state = applyChoiceToState(state, currentCard, side, rules);
    state = updateObjectiveProgress(state, objectivePack);
    const ending = resolveEndingWithRules(state, endingPack, rules);
    if (ending) {
      return {
        years: state.counters.years_ruled,
        endingId: ending.id,
      };
    }
    const next = selectNextCard({ state, eventPack, currentCard, random, rules });
    state = next.state;
    currentCard = next.card;
  }

  return {
    years: state.counters.years_ruled,
    endingId: "turn_cap_reached",
  };
}

function chooseSide({ strategy, state, card, random, rules }) {
  if (strategy === "random") return random() < 0.5 ? "left" : "right";

  const scored = ["left", "right"].map((side) => {
    const nextState = applyChoiceToState(state, card, side, rules);
    const ending = resolveEndingWithRules(nextState, endingPack, rules);
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

function summarizeEndings(results) {
  const counts = new Map();
  results.forEach((result) => {
    counts.set(result.endingId, (counts.get(result.endingId) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([endingId, count]) => ({ endingId, count, rate: round((count / results.length) * 100) }));
}

function formatMarkdown(report) {
  const lines = [
    "# Pressure Tuning Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Runs per strategy: ${report.runCount}`,
    `Turn cap: ${report.turnCap}`,
    "",
  ];

  Object.entries(report.variants).forEach(([variantId, variant]) => {
    lines.push(`## ${variantId}`);
    lines.push("");
    lines.push(variant.description);
    lines.push("");
    lines.push("| Strategy | Avg Years | Median Years | Max Years | Old Age % | Peaceful % | Top Ending |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | --- |");
    Object.entries(variant.byStrategy).forEach(([strategy, summary]) => {
      lines.push(
        `| ${strategy} | ${summary.averageYears} | ${summary.medianYears} | ${summary.maxYears} | ${summary.oldAgeEndingRate}% | ${summary.peacefulEndingRate}% | ${summary.topEndingIds[0]?.endingId ?? "-"} |`
      );
    });
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
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
