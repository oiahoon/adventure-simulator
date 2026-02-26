#!/usr/bin/env node
"use strict";

const { simulateReplay } = require("./replay-lib");

const RUNS_PER_SCENARIO = 240;
const STEPS = 220;
const REF_DATE = "2026-02-26";

function mkSeed(prefix, i) {
  return `${prefix}-${String(i).padStart(4, "0")}`;
}

function findOrdered(history, firstId, secondId) {
  let firstIdx = -1;
  for (let i = 0; i < history.length; i += 1) {
    if (history[i].id === firstId) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx < 0) return false;
  for (let i = firstIdx + 1; i < history.length; i += 1) {
    if (history[i].id === secondId) return true;
  }
  return false;
}

function countEvent(history, id) {
  let n = 0;
  for (let i = 0; i < history.length; i += 1) if (history[i].id === id) n += 1;
  return n;
}

function runScenario(name, init, tracker) {
  const agg = {
    runs: RUNS_PER_SCENARIO,
    avgEvents: 0,
    p10Events: 0,
    p90Events: 0,
    topEvents: [],
    chains: {},
    notes: []
  };

  const eventCounts = {};
  const perRunEvents = [];
  const chainCounters = {};
  for (let i = 0; i < tracker.length; i += 1) {
    chainCounters[tracker[i].name] = { hit: 0, closed: 0 };
  }

  for (let i = 0; i < RUNS_PER_SCENARIO; i += 1) {
    const run = simulateReplay({
      cwd: process.cwd(),
      seed: mkSeed(name, i),
      steps: STEPS,
      referenceDate: REF_DATE,
      init
    });
    perRunEvents.push(run.count);
    for (let j = 0; j < run.history.length; j += 1) {
      const id = run.history[j].id;
      eventCounts[id] = (eventCounts[id] || 0) + 1;
    }
    for (let t = 0; t < tracker.length; t += 1) {
      const c = tracker[t];
      const hit = countEvent(run.history, c.from) > 0;
      const closed = findOrdered(run.history, c.from, c.to);
      if (hit) chainCounters[c.name].hit += 1;
      if (closed) chainCounters[c.name].closed += 1;
    }
  }

  perRunEvents.sort((a, b) => a - b);
  const sum = perRunEvents.reduce((s, n) => s + n, 0);
  agg.avgEvents = Number((sum / perRunEvents.length).toFixed(2));
  agg.p10Events = perRunEvents[Math.floor(perRunEvents.length * 0.1)];
  agg.p90Events = perRunEvents[Math.floor(perRunEvents.length * 0.9)];
  agg.topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id, n]) => ({ id, rate: Number((n / RUNS_PER_SCENARIO).toFixed(2)) }));

  Object.keys(chainCounters).forEach((k) => {
    const v = chainCounters[k];
    agg.chains[k] = {
      triggerRate: Number((v.hit / RUNS_PER_SCENARIO).toFixed(3)),
      closeRate: Number((v.closed / RUNS_PER_SCENARIO).toFixed(3)),
      closeGivenTrigger: v.hit > 0 ? Number((v.closed / v.hit).toFixed(3)) : 0
    };
  });

  return agg;
}

function main() {
  const trackers = [
    { name: "扶人风波->监控平反", from: "helping-fall-fraud", to: "camera-clear" },
    { name: "留学抉择->海归落差", from: "abroad-offer-rmb-pressure", to: "returnee-gap" },
    { name: "新生儿->二胎讨论", from: "newborn", to: "second-child-discuss" },
    { name: "房贷预警->跨城迁移", from: "mortgage-overdue", to: "city-relocate-plan" }
  ];

  const scenarios = [
    {
      name: "baseline",
      init: { day: 4, chapter: 3, familyStage: "单身", debt: 90, gold: 90, morale: 56, fatigue: 25, heat: 12, profession: "coder" }
    },
    {
      name: "mortgage-heavy",
      init: { day: 8, chapter: 5, familyStage: "已婚", debt: 165, gold: 120, morale: 50, fatigue: 34, heat: 18, profession: "rider" }
    },
    {
      name: "parenting-intent-two",
      init: {
        day: 12,
        chapter: 6,
        familyStage: "育儿中",
        childCount: 1,
        debt: 140,
        gold: 96,
        morale: 50,
        fatigue: 44,
        heat: 22,
        profession: "freelancer",
        flags: { "family.secondChild.intent": true }
      }
    },
    {
      name: "parenting-blocked-two",
      init: {
        day: 12,
        chapter: 6,
        familyStage: "育儿中",
        childCount: 1,
        debt: 140,
        gold: 96,
        morale: 50,
        fatigue: 44,
        heat: 22,
        profession: "freelancer",
        flags: { "family.secondChild.blocked": true }
      }
    }
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    runsPerScenario: RUNS_PER_SCENARIO,
    steps: STEPS,
    referenceDate: REF_DATE,
    scenarios: {}
  };

  for (let i = 0; i < scenarios.length; i += 1) {
    const s = scenarios[i];
    report.scenarios[s.name] = runScenario(s.name, s.init, trackers);
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
