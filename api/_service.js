import { createMudService } from "../core/mud-engine.js";

const service = createMudService();

export function getMudService() {
  return service;
}
