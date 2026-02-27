#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { simulateReplayV2 } = require("./replay-v2-lib");

const cwd = process.cwd();
const file = path.join(cwd, "tests", "replay-v2", "golden-cases.json");

function asNum(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

function main() {
  if (!fs.existsSync(file)) {
    console.error(`Replay V2 check: missing ${file}`);
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const cases = Array.isArray(json.cases) ? json.cases : [];
  if (!cases.length) {
    console.error("Replay V2 check: no cases found");
    process.exit(1);
  }

  let failed = 0;
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i] || {};
    const res = simulateReplayV2({
      cwd,
      seed: c.seed,
      steps: c.steps,
      cardPolicy: c.cardPolicy || {},
      choicePolicy: c.choicePolicy || "left"
    });

    const hashOk = !c.expectedHash || c.expectedHash === res.hash;
    const run = res.run || {};
    const obs = run.observability || {};
    const counts = obs.counts || {};

    const minPlaysOk = asNum(c.minCardPlays, 0) <= asNum(counts.cardPlays, 0);
    const minArcOk = asNum(c.minArcCompletionRate, 0) <= asNum(obs.arcCompletionRate, 0);
    const queueMax = asNum(c.maxQueueHitRate, 1);
    const queueOk = asNum(obs.queueHitRate, 0) <= queueMax;

    const mustContain = Array.isArray(c.mustContainCards) ? c.mustContainCards : [];
    const played = new Set(Array.isArray(run.playHistory) ? run.playHistory : []);
    const containsOk = mustContain.every((id) => played.has(id));

    if (!hashOk || !minPlaysOk || !minArcOk || !queueOk || !containsOk) {
      failed += 1;
      console.error(
        `FAIL ${c.name || `case-${i}`}: hash=${res.hash} plays=${counts.cardPlays || 0} arc=${obs.arcCompletionRate || 0} queue=${obs.queueHitRate || 0}`
      );
      continue;
    }
    console.log(
      `PASS ${c.name || `case-${i}`}: hash=${res.hash} plays=${counts.cardPlays || 0} arc=${obs.arcCompletionRate || 0} queue=${obs.queueHitRate || 0}`
    );
  }

  if (failed) {
    console.error(`Replay V2 check: FAILED (${failed}/${cases.length})`);
    process.exit(1);
  }
  console.log(`Replay V2 check: OK (${cases.length} case(s))`);
}

main();

