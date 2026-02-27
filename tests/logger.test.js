import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../core/logger.js";

test("logger keeps max entries", () => {
  const logger = createLogger(2);
  logger.info("a");
  logger.info("b");
  logger.info("c");

  const lines = logger.list();
  assert.equal(lines.length, 2);
  assert.equal(lines[0].message, "b");
  assert.equal(lines[1].message, "c");
});
