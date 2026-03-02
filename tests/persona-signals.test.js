import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadPersonaEventMetrics() {
  const code = fs.readFileSync("app/main.js", "utf8");
  const start = code.indexOf("const FORCED_EVENTS =");
  const end = code.indexOf("const PERSONALITY_DIMENSIONS =");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("failed to locate event/signal block");
  }
  const slice = code.slice(start, end);
  const sandbox = { console, Map, Set, Array, Object, Math };
  vm.createContext(sandbox);
  vm.runInContext(
    `${slice}
this.__OUT = { FORCED_EVENTS, OPENING_EVENTS, STATE_INCIDENT_POOLS, CHAPTER_POOLS, WANG_CHAPTER_POOLS, GROWTH_EVENT_POOL, MILESTONE_EVENTS, SIGNAL_VECTOR, indexEventOptionSignals };`,
    sandbox,
    { timeout: 3000 }
  );

  const out = sandbox.__OUT;
  out.indexEventOptionSignals();
  const signalIds = Object.keys(out.SIGNAL_VECTOR);
  const signalCounts = Object.fromEntries(signalIds.map((id) => [id, 0]));
  const tagCounts = {};
  const allEvents = [];

  const register = (event) => {
    if (event && Array.isArray(event.options)) allEvents.push(event);
  };
  Object.values(out.FORCED_EVENTS).forEach(register);
  Object.values(out.OPENING_EVENTS).forEach(register);
  Object.values(out.MILESTONE_EVENTS).forEach(register);
  out.GROWTH_EVENT_POOL.forEach(register);
  Object.values(out.STATE_INCIDENT_POOLS).forEach((arr) => arr.forEach(register));
  Object.values(out.CHAPTER_POOLS).forEach((stage) => Object.values(stage).forEach((arr) => arr.forEach(register)));
  Object.values(out.WANG_CHAPTER_POOLS).forEach((stage) => Object.values(stage).forEach((arr) => arr.forEach(register)));

  let optionCount = 0;
  let noSignalCount = 0;

  allEvents.forEach((event) => {
    event.options.forEach((option) => {
      optionCount += 1;
      tagCounts[option.tag] = (tagCounts[option.tag] || 0) + 1;
      const signals = Array.isArray(option.signals) ? option.signals : [];
      if (!signals.length) noSignalCount += 1;
      signals.forEach((id) => {
        if (signalCounts[id] !== undefined) signalCounts[id] += 1;
      });
    });
  });

  return {
    events: allEvents.length,
    options: optionCount,
    noSignalCount,
    coverage: optionCount ? (optionCount - noSignalCount) / optionCount : 0,
    signalCounts,
    tagCounts,
  };
}

test("persona signal bank is integrated across gameplay events", () => {
  const metrics = loadPersonaEventMetrics();
  assert.ok(metrics.events >= 80, `expected >=80 events, got ${metrics.events}`);
  assert.ok(metrics.options >= 240, `expected >=240 options, got ${metrics.options}`);
  assert.ok(metrics.coverage >= 0.98, `signal coverage too low: ${(metrics.coverage * 100).toFixed(1)}%`);

  Object.entries(metrics.signalCounts).forEach(([signalId, count]) => {
    assert.ok(count > 0, `signal ${signalId} is never triggered`);
  });

  assert.ok((metrics.tagCounts.content || 0) >= 16, "content options unexpectedly low");
  assert.ok((metrics.tagCounts.network || 0) >= 30, "network options unexpectedly low");
});
