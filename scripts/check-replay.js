#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { simulateReplay } = require("./replay-lib");

const cwd = process.cwd();
const file = path.join(cwd, "tests", "replay", "golden-cases.json");

function main() {
  if (!fs.existsSync(file)) {
    console.error(`Replay check: missing ${file}`);
    process.exit(1);
  }
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const cases = Array.isArray(json.cases) ? json.cases : [];
  if (!cases.length) {
    console.error("Replay check: no cases found");
    process.exit(1);
  }

  let failed = 0;
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i];
    const res = simulateReplay({
      cwd,
      seed: c.seed,
      steps: c.steps,
      init: c.init || {},
      referenceDate: c.referenceDate || "2026-02-26"
    });

    const hashOk = !c.expectedHash || c.expectedHash === res.hash;
    let containsOk = true;
    if (Array.isArray(c.mustContain) && c.mustContain.length) {
      const ids = new Set(res.history.map((h) => h.id));
      containsOk = c.mustContain.every((id) => ids.has(id));
    }

    if (!hashOk || !containsOk) {
      failed += 1;
      console.error(
        `FAIL ${c.name || `case-${i}`}: hash=${res.hash} events=${res.count} contains=${containsOk}`
      );
      continue;
    }
    console.log(`PASS ${c.name || `case-${i}`}: hash=${res.hash} events=${res.count}`);
  }

  if (failed) {
    console.error(`Replay check: FAILED (${failed}/${cases.length})`);
    process.exit(1);
  }
  console.log(`Replay check: OK (${cases.length} case(s))`);
}

main();
