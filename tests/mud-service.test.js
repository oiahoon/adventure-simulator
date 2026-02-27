import test from "node:test";
import assert from "node:assert/strict";

import { createMudService } from "../core/mud-engine.js";

test("mud service new -> state lifecycle", () => {
  const service = createMudService();
  const created = service.runAction({ action: "new", seed: 123 });
  assert.equal(created.ok, true);
  assert.ok(created.sessionId);
  assert.equal(created.state.mode, "battle");

  const state = service.runAction({ action: "state", sessionId: created.sessionId });
  assert.equal(state.ok, true);
  assert.equal(state.sessionId, created.sessionId);
  assert.equal(state.state.nodeIndex, 0);
});

test("mud service can play and end turn", () => {
  const service = createMudService();
  const created = service.runAction({ action: "new", seed: 123 });
  const sessionId = created.sessionId;

  const played = service.runAction({ action: "play", sessionId, cardIndex: 0 });
  assert.equal(played.ok, true);
  assert.ok(["battle", "reward", "map", "victory", "defeat"].includes(played.state.mode));

  const ended = service.runAction({ action: "end", sessionId });
  assert.equal(ended.ok, true);
  assert.ok(["battle", "reward", "map", "victory", "defeat"].includes(ended.state.mode));
});

test("mud service returns errors on unknown session", () => {
  const service = createMudService();
  const result = service.runAction({ action: "state", sessionId: "missing" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "session_not_found");
});
